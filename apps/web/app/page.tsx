import { redirect } from "next/navigation";
import { LANDING_ROUTE } from "@/lib/routes";

export default function RootPage() {
  redirect(LANDING_ROUTE);
}
