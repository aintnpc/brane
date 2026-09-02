import type { Metadata } from "next";
import BraneResult from "@/components/BraneResult";

// A brane is only as private as its link, so keep it out of search indexes.
export const metadata: Metadata = {
  title: "my brane",
  robots: { index: false, follow: false },
};

export default async function BranePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <BraneResult token={token} />;
}
