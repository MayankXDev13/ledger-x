import { Redirect } from "expo-router";

// The customers list lives in the tabs group at `(tabs)/customers`. This
// legacy route remains only so deep links to `/customers` resolve.
export default function CustomersRedirect() {
  return <Redirect href="/(tabs)/customers" />;
}
