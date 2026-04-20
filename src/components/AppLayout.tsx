import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useTheme } from "@/hooks/useTheme";

export function AppLayout() {
  useTheme();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
