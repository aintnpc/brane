# share2dm — workers/src/queue-processor.ts

_source: 저장소 원본 · share2dm/workers/src/queue-processor.ts_

```ts
import { Env } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendRateLimitAlert } from './email';

const MAX_RETRIES = 3;
// Process up to this many per brand per cron tick
// Meta's actual rate limit is discovered via 429 responses — no self-imposed cap
const BATCH_SIZE_PER_BRAND = 20;

export async function handleQueueCron(env: Env): Promise<void> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Get all brands that have pending items in the queue
  const { data: pendingBrands } = await supabase
    .from('share2dm_dm_queue')
    .select('brand_id')
    .eq('status', 'pending')
    .limit(100);

  if (!pendingBrands?.length) {
    console.log('[Queue] No pending items');
    return;
  }

  // Deduplicate brand IDs
  const brandIds = [...new Set(pendingBrands.map((r) => r.brand_id))];
  console.log(`[Queue] Processing ${brandIds.length} brands with pending DMs`);

  for (const brandId of brandIds) {
    await processBrandQueue(supabase, env, brandId);
  }
}

async function processBrandQueue(
  supabase: SupabaseClient,
  env: Env,
  brandId: string
): Promise<void> {
  const batchSize = BATCH_SIZE_PER_BRAND;

  // Fetch pending items (FIFO)
  const { data: items } = await supabase
    .from('share2dm_dm_queue')
    .select('*')
    .eq('brand_id', brandId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(batchSize);

  if (!items?.length) return;

  console.log(`[Queue] Brand ${brandId}: processing ${items.length} items`);

  for (const item of items) {
    // Atomically claim the item: only proceed if it's still 'pending'
    // (webhook may have already claimed and sent it between our SELECT and this UPDATE)
    const { data: claimed } = await supabase
      .from('share2dm_dm_queue')
      .update({ status: 'sending' })
      .eq('id', item.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (!claimed) {
      console.log(`[Queue] Item ${item.id} already claimed/sent, skipping`);
      continue;
    }

    try {
      // Send DM via Instagram Graph API
      const response = await fetch(
        'https://graph.facebook.com/v21.0/me/messages',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: item.sender_ig_id },
            message: { text: item.message },
            access_token: item.access_token,
          }),
        }
      );

      const resultText = await response.text();

      if (response.ok) {
        // Success: mark as sent, insert dm_log
        await supabase
          .from('share2dm_dm_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', item.id);

        await supabase.from('share2dm_dm_logs').upsert({
          id: crypto.randomUUID(),
          campaign_id: item.campaign_id,
          brand_id: item.brand_id,
          sender_ig_id: item.sender_ig_id,
          ig_contents_id: item.ig_contents_id,
        }, { onConflict: 'campaign_id,sender_ig_id' });

        console.log(`[Queue] Sent DM to ${item.sender_ig_id} (campaign: ${item.campaign_id})`);
      } else if (response.status === 429) {
        // Rate limited — revert to pending and stop processing this brand
        await supabase
          .from('share2dm_dm_queue')
          .update({ status: 'pending', error_message: `429 rate limited: ${resultText}` })
          .eq('id', item.id);

        console.warn(`[Queue] Brand ${brandId}: 429 rate limited, stopping batch`);
        // Send 429 alert email if configured
        if (env.RESEND_API_KEY) {
          const { data: brand } = await supabase
            .from('share2dm_brands')
            .select('brand_name, notification_email')
            .eq('id', brandId)
            .single();
          if (brand?.notification_email) {
            try {
              await sendRateLimitAlert(env.RESEND_API_KEY, brand.notification_email, brand.brand_name);
            } catch (e: any) {
              console.error(`[Queue] Failed to send 429 alert:`, e.message);
            }
          }
        }
        return; // Stop processing this brand
      } else {
        // Other error
        const newRetryCount = (item.retry_count ?? 0) + 1;
        const newStatus = newRetryCount >= MAX_RETRIES ? 'failed' : 'pending';

        await supabase
          .from('share2dm_dm_queue')
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            error_message: `HTTP ${response.status}: ${resultText}`,
          })
          .eq('id', item.id);

        console.error(`[Queue] DM send failed (${response.status}): ${resultText}, retry ${newRetryCount}/${MAX_RETRIES}`);
      }
    } catch (err: any) {
      const newRetryCount = (item.retry_count ?? 0) + 1;
      const newStatus = newRetryCount >= MAX_RETRIES ? 'failed' : 'pending';

      await supabase
        .from('share2dm_dm_queue')
        .update({
          status: newStatus,
          retry_count: newRetryCount,
          error_message: `Exception: ${err.message}`,
        })
        .eq('id', item.id);

      console.error(`[Queue] Exception sending DM:`, err.message);
    }
  }
}

// API: Get queue status for a brand (optionally filtered by campaign)
export async function handleQueueStatus(url: URL, env: Env): Promise<Response> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const brandId = url.searchParams.get('brand_id');
  if (!brandId) {
    return new Response(JSON.stringify({ error: 'brand_id required' }), { status: 400, headers });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const campaignId = url.searchParams.get('campaign_id');

  // Count by status
  const statuses = ['pending', 'sending', 'sent', 'failed'] as const;
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    let query = supabase
      .from('share2dm_dm_queue')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('status', status);

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { count } = await query;
    counts[status] = count ?? 0;
  }

  return new Response(JSON.stringify({
    brand_id: brandId,
    campaign_id: campaignId || null,
    queue: counts,
    total: counts.pending + counts.sending + counts.sent + counts.failed,
  }), { headers });
}

// API: Admin stats — system-wide overview
export async function handleAdminStats(env: Env): Promise<Response> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Total brands
  const { count: totalBrands } = await supabase
    .from('share2dm_brands')
    .select('*', { count: 'exact', head: true });

  // Total DMs sent (all time)
  const { count: totalDMs } = await supabase
    .from('share2dm_dm_logs')
    .select('*', { count: 'exact', head: true });

  // Today's DMs
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const { count: todayDMs } = await supabase
    .from('share2dm_dm_logs')
    .select('*', { count: 'exact', head: true })
    .gte('dm_sent_at', todayStart.toISOString());

  // Total clicks (all time)
  const { count: totalClicks } = await supabase
    .from('share2dm_dm_logs')
    .select('*', { count: 'exact', head: true })
    .not('link_clicked_at', 'is', null);

  // Queue stats
  const queueStatuses = ['pending', 'sending', 'sent', 'failed'] as const;
  const queueCounts: Record<string, number> = {};
  for (const status of queueStatuses) {
    const { count } = await supabase
      .from('share2dm_dm_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    queueCounts[status] = count ?? 0;
  }

  // Per-brand breakdown
  const { data: brands } = await supabase
    .from('share2dm_brands')
    .select('id, brand_name, ig_account_id, plan, created_at')
    .order('created_at', { ascending: false });

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const brandStats = [];
  for (const brand of brands ?? []) {
    // Monthly DMs
    const { count: monthlyDMs } = await supabase
      .from('share2dm_dm_logs')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .gte('dm_sent_at', startOfMonth.toISOString());

    // Monthly clicks
    const { count: monthlyClicks } = await supabase
      .from('share2dm_dm_logs')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .gte('dm_sent_at', startOfMonth.toISOString())
      .not('link_clicked_at', 'is', null);

    // Queue pending
    const { count: queuePending } = await supabase
      .from('share2dm_dm_queue')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .eq('status', 'pending');

    // Queue failed
    const { count: queueFailed } = await supabase
      .from('share2dm_dm_queue')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .eq('status', 'failed');

    brandStats.push({
      ...brand,
      monthly_dms: monthlyDMs ?? 0,
      monthly_clicks: monthlyClicks ?? 0,
      queue_pending: queuePending ?? 0,
      queue_failed: queueFailed ?? 0,
    });
  }

  return new Response(JSON.stringify({
    overview: {
      total_brands: totalBrands ?? 0,
      total_dms: totalDMs ?? 0,
      today_dms: todayDMs ?? 0,
      total_clicks: totalClicks ?? 0,
      queue: queueCounts,
    },
    brands: brandStats,
  }), { headers });
}
```
