import Link from "next/link";

export default function HomePage() {
  return (
    <div className={styles.wrapper}>
      
      <header className={styles.header}>
        <div className={styles.logoText}>
          Trimo Detail<span className={styles.logoDot}>.</span>
        </div>
        
        <nav className={styles.nav}>
          <Link href="#funcionalidades" className={styles.navLink}>Funcionalidades</Link>
          <Link href="#como-funciona" className={styles.navLink}>Como Funciona</Link>
          <Link href="#planos" className={styles.navLink}>Planos</Link>
        </nav>

        <div className={styles.headerActions}>
          <Link href="/login" className={styles.btnLoginGhost}>Entrar</Link>
          <Link href="/cadastro" className={styles.btnPrimary}>Criar conta</Link>
        </div>
      </header>

      <main>
        <section className={styles.heroSection}>
          <div className={styles.heroTextCol}>
            <h1 className={styles.heroTitle}>
              Pare de perder tempo agendando clientes <span className={styles.heroTitleHighlight}>pelo WhatsApp.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Eleve o nível da sua estética automotiva. O Trimo Detail funciona como seu assistente 24h: agenda online, lembretes automáticos e controle de pagamentos em um só lugar.
            </p>
            <div className={styles.heroActions}>
              <Link href="/cadastro" className={styles.btnHeroPrimary}>Testar 7 dias grátis</Link>
            </div>
          </div>

          <div className={styles.heroImageCol}>
            <div className={styles.heroImageWrapper}>
              <img 
                src="https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=2000&auto=format&fit=crop" 
                alt="Carro de luxo com pintura vitrificada" 
                className={styles.heroImage}
              />
              <div className={styles.heroImageOverlay}></div>
            </div>
            
            <div className={styles.heroBadge} style={{animationDuration: '3s'}}>
              <div className={styles.heroBadgeIconWrapperPix}>
                <svg className={styles.heroBadgeIconPix} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p className={styles.heroBadgeTitle}>Pix Recebido!</p>
                <p className={styles.heroBadgeText}>R$ 850,00 - Vitrificação</p>
              </div>
            </div>
          </div>
        </section>

        <section id="funcionalidades" className={styles.sectionDark}>
          <div className={styles.container}>
            <span className={styles.sectionLabel}>Funcionalidades</span>
            <h2 className={styles.sectionTitleDark}>Tudo que sua estética precisa, e nada além disso.</h2>

            <div className={styles.featuresGrid}>
              <div className={styles.featureItem}>
                <div className={styles.featureNumber}>01</div>
                <div>
                  <h3 className={styles.featureTitle}>Agendamento 24 horas</h3>
                  <p className={styles.featureText}>Seu link fica aberto de madrugada, no domingo, ou enquanto você está com a mão na massa. O cliente marca sozinho, na hora que der.</p>
                </div>
              </div>
              
              <div className={styles.featureItem}>
                <div className={styles.featureNumber}>02</div>
                <div>
                  <h3 className={styles.featureTitle}>Lembrete no WhatsApp</h3>
                  <p className={styles.featureText}>Antes do horário, o cliente recebe uma mensagem pra confirmar presença. Se ele não confirmar, você fica sabendo a tempo de preencher a vaga.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureNumber}>03</div>
                <div>
                  <h3 className={styles.featureTitle}>Link exclusivo da sua loja</h3>
                  <p className={styles.featureText}>Uma página só sua, com seus serviços, preços e horários livres. Cole no Instagram, mande no status, e o cliente agenda em três toques.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureNumber}>04</div>
                <div>
                  <h3 className={styles.featureTitle}>Pix e Maquininha Integrados</h3>
                  <p className={styles.featureText}>O sistema gera o QR Code ou manda o valor direto para sua maquininha Point. A baixa no sistema é automática, sem planilhas.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className={styles.sectionLight}>
          <div className={styles.containerSm}>
            <span className={styles.sectionLabel}>Como Funciona</span>
            <h2 className={styles.sectionTitleLight}>Três passos entre o clique e o<br className="hidden md:block" /> carro na sua garagem.</h2>

            <div className={styles.stepsGrid}>
              <div className={styles.stepsConnector}></div>

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>1</div>
                <h3 className={styles.stepTitle}>Cliente escolhe o horário</h3>
                <p className={styles.stepText}>Ele acessa seu link, vê os horários livres de verdade e escolhe o serviço. Sem trocar mensagem, sem esperar resposta.</p>
              </div>

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>2</div>
                <h3 className={styles.stepTitle}>Trimo confirma e lembra</h3>
                <p className={styles.stepText}>A reserva cai na sua agenda na hora. Perto do horário, o Trimo manda o lembrete no WhatsApp e pede a confirmação.</p>
              </div>

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>3</div>
                <h3 className={styles.stepTitle}>Ele aparece, você atende</h3>
                <p className={styles.stepText}>Presença confirmada, box preparado. Se alguém não confirmar, você sabe com antecedência e pode encaixar outro serviço.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="planos" className={styles.sectionDark}>
          <div className={styles.plansContainer}>
            
            <div className={styles.plansTextCol}>
              <span className={styles.sectionLabel}>Plano Único</span>
              <h2 className={styles.plansTitleLeft}>Tudo que você precisa por um preço justo.</h2>
              <p className={styles.plansSubtitleLeft}>
                Sem taxa de instalação e sem contrato de fidelidade. Você tem acesso completo a todas as ferramentas do Trimo Detail desde o primeiro minuto.
              </p>
              <p className={styles.plansSubtitleHighlight}>
                Comece agora e tenha <strong>7 dias totalmente gratuitos</strong> para testar na prática. A primeira cobrança só acontece depois desse período.
              </p>
            </div>

            <div className={styles.plansCardCol}>
              <div className={styles.planCardLight}>
                <div className={styles.planBadge}>7 Dias Grátis</div>
                <h3 className={styles.planTitleLight}>Plano Completo</h3>
                
                <div className={styles.planPriceWrapper}>
                  <span className={styles.planCurrencyLight}>R$</span>
                  <span className={styles.planPriceLight}>49</span>
                  <span className={styles.planPeriodLight}>/mês</span>
                </div>
                
                <p className={styles.planDescLight}>
                  <strong>Não pague nada hoje.</strong> Sua 1ª cobrança só acontece após os 7 dias de teste grátis.
                </p>
                <div className={styles.planDivider}></div>
                
                <ul className={styles.planListLight}>
                  <li className="flex items-center gap-3"><span className={styles.planCheckLight}>✓</span> Link de agendamento próprio</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckLight}>✓</span> Lembretes automáticos no WhatsApp</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckLight}>✓</span> Painel de faturamento integrado</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckLight}>✓</span> Sem limite de agendamentos</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckLight}>✓</span> Cancele online quando quiser</li>
                </ul>
                
                <Link href="/cadastro" className={styles.btnPlanLight}>
                  Começar meus 7 dias grátis
                </Link>
                <p className="text-center text-xs text-zinc-500 mt-4 font-medium">Sem compromisso. Cancele antes de pagar.</p>
              </div>
            </div>

          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.logoTextFooter}>
            Trimo Detail<span className={styles.logoDot}>.</span>
          </div>
          <p className={styles.footerText}>© {new Date().getFullYear()} Trimo. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: "min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#E56B25] selection:text-white",
  container: "max-w-7xl mx-auto",
  containerSm: "max-w-5xl mx-auto text-center",
  
  header: "max-w-7xl mx-auto flex items-center justify-between px-6 py-6",
  logoText: "font-black text-2xl tracking-tighter text-zinc-900",
  logoTextFooter: "font-black text-2xl tracking-tighter text-white",
  logoDot: "text-[#E56B25]",
  nav: "hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-500",
  navLink: "hover:text-zinc-900 transition-colors",
  headerActions: "flex items-center gap-4",
  btnLoginGhost: "text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors hidden sm:block",
  btnPrimary: "bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold py-2.5 px-6 rounded-full transition-colors shadow-lg shadow-[#E56B25]/20",

  heroSection: "max-w-7xl mx-auto px-6 pt-16 pb-32 flex flex-col lg:flex-row items-center gap-16",
  heroTextCol: "lg:w-1/2",
  heroTitle: "text-5xl md:text-6xl lg:text-7xl font-black text-zinc-900 tracking-tighter leading-[1.05] mb-6",
  heroTitleHighlight: "text-[#E56B25]",
  heroSubtitle: "text-lg md:text-xl text-zinc-500 mb-10 max-w-lg leading-relaxed font-medium",
  heroActions: "flex flex-col sm:flex-row items-center gap-4",
  btnHeroPrimary: "w-full sm:w-auto block bg-[#E56B25] hover:bg-[#cf5818] text-white text-base font-bold py-4 px-8 rounded-full transition-all text-center shadow-xl shadow-[#E56B25]/20",

  heroImageCol: "lg:w-1/2 relative w-full",
  heroImageWrapper: "aspect-[4/3] bg-zinc-900 rounded-[2rem] overflow-hidden relative shadow-2xl",
  heroImage: "w-full h-full object-cover opacity-90",
  heroImageOverlay: "absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent",
  
  heroBadge: "absolute -bottom-8 -left-4 sm:left-8 bg-white p-4 pr-6 rounded-2xl shadow-xl flex items-center gap-4 border border-zinc-100 animate-bounce",
  heroBadgeIconWrapperPix: "w-10 h-10 bg-green-100 rounded-full flex items-center justify-center",
  heroBadgeIconPix: "w-5 h-5 text-green-600",
  heroBadgeTitle: "text-sm font-bold text-zinc-900",
  heroBadgeText: "text-xs text-zinc-500 font-medium",

  sectionDark: "bg-zinc-950 py-32 px-6 text-white",
  sectionLight: "bg-[#FAFAFA] py-32 px-6",
  sectionLabel: "text-[#E56B25] text-xs font-bold tracking-[0.2em] uppercase mb-4 block",
  sectionTitleDark: "text-4xl md:text-5xl font-black tracking-tight mb-20 max-w-2xl leading-tight text-white",
  sectionTitleLight: "text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-24 leading-tight",

  featuresGrid: "grid md:grid-cols-2 gap-x-16 gap-y-12",
  featureItem: "flex gap-6",
  featureNumber: "w-12 h-12 shrink-0 bg-zinc-900 rounded-full flex items-center justify-center text-[#E56B25] font-black text-lg shadow-inner",
  featureTitle: "text-xl font-bold mb-3 text-white",
  featureText: "text-zinc-400 font-medium leading-relaxed",

  stepsGrid: "grid md:grid-cols-3 gap-12 relative",
  stepsConnector: "hidden md:block absolute top-6 left-[16%] right-[16%] h-[2px] bg-zinc-200 z-0",
  stepItem: "relative z-10 flex flex-col items-center",
  stepNumber: "w-12 h-12 bg-white border-2 border-zinc-200 rounded-full flex items-center justify-center text-[#E56B25] font-black text-lg mb-6 shadow-sm",
  stepTitle: "text-xl font-bold text-zinc-900 mb-3",
  stepText: "text-zinc-500 font-medium px-4",

  plansContainer: "max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16",
  plansTextCol: "lg:w-1/2 text-left",
  plansCardCol: "lg:w-1/2 w-full max-w-md mx-auto",
  
  plansTitleLeft: "text-4xl md:text-5xl font-black text-white tracking-tight mb-6",
  plansSubtitleLeft: "text-zinc-400 font-medium text-lg leading-relaxed mb-4",
  plansSubtitleHighlight: "text-zinc-300 font-medium text-lg leading-relaxed bg-zinc-900 p-4 border-l-4 border-[#E56B25] rounded-r-lg",

  planCardLight: "bg-white rounded-3xl p-10 shadow-2xl relative",
  planBadge: "absolute top-0 right-8 -translate-y-1/2 bg-[#E56B25] text-white text-xs font-black uppercase tracking-wider py-1.5 px-3 rounded-full shadow-lg shadow-[#E56B25]/30",
  planTitleLight: "text-2xl font-bold text-zinc-900 mb-2",
  planPriceWrapper: "flex items-baseline gap-1 mb-4 mt-2",
  planCurrencyLight: "text-xl font-bold text-zinc-400",
  planPriceLight: "text-5xl font-black text-zinc-900",
  planPeriodLight: "text-zinc-500 font-medium",
  planDescLight: "text-zinc-600 text-sm mb-8 font-medium",
  planDivider: "h-[1px] bg-zinc-200 w-full mb-8",
  planListLight: "space-y-4 mb-10 text-zinc-700 text-sm font-bold",
  planCheckLight: "text-[#E56B25]",
  
  btnPlanLight: "block w-full text-center bg-[#E56B25] hover:bg-[#cf5818] text-white font-black py-4 rounded-full transition-colors shadow-xl shadow-[#E56B25]/30",

  footer: "bg-zinc-950 pt-16 pb-8 px-6 border-t border-zinc-900",
  footerContainer: "max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6",
  footerText: "text-zinc-500 text-sm font-medium",
};