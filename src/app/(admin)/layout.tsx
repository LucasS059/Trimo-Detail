import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.wrapper}>
      
      {/* Menu Lateral */}
      <AdminSidebar />
      
      {/* Área Principal de Conteúdo */}
      <main className={styles.mainArea}>
        <div className={styles.contentContainer}>
          {children}
        </div>
      </main>

    </div>
  );
}

const styles = {

  wrapper: "h-screen w-full flex flex-col md:flex-row bg-zinc-900 font-sans overflow-hidden",
  mainArea: "flex-1 flex flex-col min-w-0 w-full h-full overflow-y-auto",
  contentContainer: "flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8",
};