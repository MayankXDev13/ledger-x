import { AuthGuard } from "@/components/AuthGuard";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden lg:flex">
          <AppSidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </AuthGuard>
  );
}
