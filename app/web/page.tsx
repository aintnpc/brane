import { Suspense } from "react";
import type { Metadata } from "next";
import BraneApp from "@/components/BraneApp";

export const metadata: Metadata = {
  title: "brane — browsable",
  description: "AI 대화 로그가 소화되어 개념 그래프가 된 기억 원장.",
};

export default function WebPage() {
  return (
    <Suspense fallback={null}>
      <BraneApp />
    </Suspense>
  );
}
