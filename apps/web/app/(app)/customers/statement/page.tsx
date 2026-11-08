import { Suspense } from "react";
import { StatementView } from "./StatementView";

// Static route (query params `?id=&start=&end=`) so `output: export` works.
export default function CustomerStatementPage() {
  return (
    <Suspense>
      <StatementView />
    </Suspense>
  );
}
