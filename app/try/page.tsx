import type { Metadata } from "next";
import TryBrane from "@/components/TryBrane";

export const metadata: Metadata = {
  title: "네 대화를 두뇌로 — brane",
  description:
    "ChatGPT·Claude·Gemini 대화를 넣으면 남을 것만 골라 마크다운 개념으로 소화하고, 다른 AI가 읽을 수 있는 MCP 주소를 만들어줍니다.",
  openGraph: {
    title: "네 대화를 두뇌로 — brane",
    description:
      "오늘 Claude에게 말한 걸 내일 ChatGPT가 압니다. 대화를 넣으면 60초 안에 내 brane이 생깁니다.",
  },
};

export default function TryPage() {
  return <TryBrane />;
}
