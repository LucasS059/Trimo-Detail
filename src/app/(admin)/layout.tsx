import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-zinc-950 font-sans overflow-hidden text-zinc-100">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0 w-full h-full overflow-y-auto">
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}