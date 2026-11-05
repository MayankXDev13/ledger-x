import { Suspense } from "react";
import { CustomerDetailView } from "./CustomerDetailView";

// Static route (query param `?id=`) so `output: export` works on Pages.
export default function CustomerDetailPage() {
  return (
    <Suspense>
      <CustomerDetailView />
    </Suspense>
  );
}
