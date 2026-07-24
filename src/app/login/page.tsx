import Link from "next/link";
import { LoginForm } from "@/components/layout/login-form";

export default function LoginPage() {
  return (
    <div className={styles.wrapper}>
      
      {/* Lado Esquerdo (Marketing) */}
      <div className={styles.leftPanel}>
        <div className={styles.bgImage}></div>
        <div className={styles.bgOverlay}></div>

        <div className={styles.leftContent}>
          <Link href="/" className={styles.logoText}>
            Trimo Detail<span className={styles.logoDot}>.</span>
          </Link>

          <div className="mt-20">
            <h1 className={styles.marketingTitle}>
              Que bom ver você de volta.
            </h1>
            <p className={styles.marketingSubtitle}>
              Gerencie sua agenda, confira os pagamentos via WhatsApp e acompanhe o movimento da sua estética em tempo real.
            </p>

            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Agenda sincronizada em tempo real
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Controle de caixa e faturamento
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.testimonialContainer}>
          <div className="flex gap-1 text-[#E56B25] mb-3 text-sm">★★★★★</div>
          <p className="text-zinc-300 font-medium text-sm mb-5 leading-relaxed">
            "O sistema é rápido e direto ao ponto. Meus clientes adoram a facilidade de agendar direto pelo link."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-full"></div>
            <div>
              <p className="text-sm font-bold text-white">Marcos Vinicius</p>
              <p className="text-xs text-zinc-500 font-medium">MV Premium Detailing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito (Formulário de Login) */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          
          <Link href="/" className={styles.logoTextMobile}>
            Trimo Detail<span className={styles.logoDot}>.</span>
          </Link>

          <div className="mb-8">
            <h2 className={styles.formTitle}>Acesse o seu painel</h2>
            <p className={styles.formSubtitle}>
              Entre com seu e-mail e senha cadastrados.
            </p>
          </div>

          <LoginForm />

          <p className={styles.footerText}>
            Ainda não tem uma loja?{" "}
            <Link href="/cadastro" className={styles.link}>
              Criar conta grátis
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}

const styles = {
  wrapper: "min-h-screen w-full flex font-sans selection:bg-[#E56B25] selection:text-white bg-white",

  leftPanel: "hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-black",
  bgImage: "absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30",
  bgOverlay: "absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent",
  
  leftContent: "relative z-10",
  logoText: "font-black text-2xl tracking-tighter text-white hover:opacity-80 transition-opacity inline-block",
  logoDot: "text-[#E56B25]",
  
  marketingTitle: "text-4xl xl:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight",
  marketingSubtitle: "text-lg text-zinc-400 font-medium max-w-md leading-relaxed",
  
  featureList: "space-y-4 mt-10",
  featureItem: "flex items-center gap-3 text-zinc-300 font-medium",
  featureIcon: "text-[#E56B25] font-black",
  
  testimonialContainer: "relative z-10 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-6 rounded-2xl max-w-md",

  rightPanel: "w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-white relative",
  formContainer: "w-full max-w-[400px]",
  
  logoTextMobile: "lg:hidden font-black text-3xl tracking-tighter text-zinc-900 mb-10 block text-center",
  
  formTitle: "text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight",
  formSubtitle: "mt-2 text-sm font-medium text-zinc-500 leading-relaxed",
  
  footerText: "text-sm text-zinc-500 mt-8 text-center font-medium",
  link: "font-bold text-[#E56B25] hover:underline underline-offset-4",
};