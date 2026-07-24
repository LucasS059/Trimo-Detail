import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

// ----------------------------------------------------------------------
// ORGANIZAÇÃO DOS ESTILOS (Tailwind CSS)
// ----------------------------------------------------------------------
const styles = {
  // O wrapper ocupa a tela toda (h-screen) e não deixa nada vazar (overflow-hidden)
  wrapper: "h-screen w-full flex bg-zinc-50 font-sans overflow-hidden",
  
  // A área principal ocupa o espaço restante (flex-1) e rola internamente
  // min-w-0 é crucial: impede que tabelas grandes quebrem o flexbox
  mainArea: "flex-1 flex flex-col min-w-0 h-full overflow-y-auto",
  
  // Container com espaçamento responsivo (menor no celular, maior no PC)
  contentContainer: "flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8",
};