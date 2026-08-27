import { Suspense } from "react";
import BraneApp from "@/components/BraneApp";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <BraneApp />
    </Suspense>
  );
}
