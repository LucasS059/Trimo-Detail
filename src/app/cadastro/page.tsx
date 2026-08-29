import Link from "next/link";
import { CadastroForm } from "@/components/layout/cadastro-form";

export default function CadastroPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.contentWrapper}>
        
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logoText}>
            Trimo Detail<span className={styles.logoDot}>.</span>
          </Link>
        </div>

        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Criar conta</h1>
            <p className={styles.subtitle}>
              Cadastre sua estética automotiva para acessar o sistema.
            </p>
          </div>

          <CadastroForm />

          <div className={styles.footerContainer}>
            <p className={styles.footerText}>
              Já tem uma conta?{" "}
              <Link href="/login" className={styles.link}>
                Entrar
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  wrapper: "min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#E56B25] selection:text-white flex flex-col items-center justify-center p-4",
  contentWrapper: "w-full max-w-[520px]",
  
  logoContainer: "text-center mb-8",
  logoText: "inline-block font-black text-3xl tracking-tighter text-zinc-900 hover:opacity-80 transition-opacity",
  logoDot: "text-[#E56B25]",
  
  card: "bg-white w-full rounded-2xl p-8 sm:p-10 shadow-sm border border-zinc-200",
  
  header: "mb-8",
  title: "text-2xl font-bold text-zinc-900 tracking-tight mb-2",
  subtitle: "text-zinc-500 text-sm font-medium",
  
  footerContainer: "mt-8 pt-6 border-t border-zinc-100 text-center",
  footerText: "text-sm font-medium text-zinc-600",
  link: "font-bold text-[#E56B25] hover:text-[#cf5818] transition-colors",
};