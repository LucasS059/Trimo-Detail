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
              Chega de box vazio por falta <span className={styles.heroTitleHighlight}>de aviso.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Um sistema completo com a cara da sua estética. O cliente marca sozinho, o Trimo lembra ele e organiza seu faturamento — você foca no detalhamento.
            </p>
            <div className={styles.heroActions}>
              <Link href="/cadastro" className={styles.btnHeroPrimary}>Começar gratuitamente</Link>
              <Link href="#como-funciona" className={styles.btnHeroSecondary}>Ver como funciona</Link>
            </div>
          </div>

          <div className={styles.heroImageCol}>
            <div className={styles.heroImageWrapper}>
              <img 
                src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=2000&auto=format&fit=crop" 
                alt="Detailer trabalhando em um carro" 
                className={styles.heroImage}
              />
              <div className={styles.heroImageOverlay}></div>
            </div>
            
            <div className={styles.heroBadge} style={{animationDuration: '3s'}}>
              <div className={styles.heroBadgeIconWrapper}>
                <svg className={styles.heroBadgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <p className={styles.heroBadgeTitle}>Novo agendamento!</p>
                <p className={styles.heroBadgeText}>Carlos - Polimento Comercial</p>
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
          <div className={styles.container}>
            <div className="text-center mb-20">
              <span className={styles.sectionLabel}>Planos</span>
              <h2 className={styles.sectionTitleCenterDark}>Um preço justo pro tamanho<br className="hidden md:block"/> do seu negócio.</h2>
              <p className={styles.plansSubtitle}>Sem taxa de instalação, sem contrato de fidelidade. Escolha um plano para assinar ou comece testando gratuitamente.</p>
            </div>

            <div className={styles.plansGrid}>
              <div className={styles.planCardDark}>
                <h3 className={styles.planTitleDark}>Teste Grátis</h3>
                <div className={styles.planPriceWrapper}>
                  <span className={styles.planCurrencyDark}>R$</span>
                  <span className={styles.planPriceDark}>0</span>
                </div>
                <p className={styles.planDescDark}>Experimente todas as ferramentas por 14 dias. Sem pedir cartão de crédito.</p>
                <ul className={styles.planListDark}>
                  <li className="flex items-center gap-3"><span className={styles.planCheckDark}>✓</span> Acesso total ao sistema</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckDark}>✓</span> Link de agendamento próprio</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckDark}>✓</span> Lembretes no WhatsApp</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckDark}>✓</span> Cancele quando quiser</li>
                </ul>
                <button className={styles.btnPlanDark}>Começar teste grátis</button>
              </div>

              <div className={styles.planCardDark}>
                <h3 className={styles.planTitleDark}>Básico</h3>
                <div className={styles.planPriceWrapper}>
                  <span className={styles.planCurrencyDark}>R$</span>
                  <span className={styles.planPriceDark}>49</span>
                  <span className={styles.planPeriodDark}>/mês</span>
                </div>
                <p className={styles.planDescDark}>Pra quem trabalha sozinho e quer parar de agendar pelo WhatsApp.</p>
                <ul className={styles.planListDark}>
                  <li className="flex items-center gap-3"><span className={styles.planCheckDark}>✓</span> 1 profissional</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckDark}>✓</span> Link de agendamento próprio</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckDark}>✓</span> Lembrete automático no WhatsApp</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckDark}>✓</span> Agenda ilimitada</li>
                </ul>
                <button className={styles.btnPlanDark}>Assinar Básico</button>
              </div>

              <div className={styles.planCardLight}>
                <div className={styles.planBadge}>Mais escolhido</div>
                <h3 className={styles.planTitleLight}>Profissional</h3>
                <div className={styles.planPriceWrapper}>
                  <span className={styles.planCurrencyLight}>R$</span>
                  <span className={styles.planPriceLight}>99</span>
                  <span className={styles.planPeriodLight}>/mês</span>
                </div>
                <p className={styles.planDescLight}>Pra estética com equipe e múltiplos profissionais atendendo.</p>
                <div className={styles.planDivider}></div>
                <ul className={styles.planListLight}>
                  <li className="flex items-center gap-3"><span className={styles.planCheckLight}>✓</span> Até 5 profissionais</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckLight}>✓</span> Link de agendamento</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckLight}>✓</span> Lembretes automáticos</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckLight}>✓</span> Painel de faturamento</li>
                  <li className="flex items-center gap-3"><span className={styles.planCheckLight}>✓</span> Suporte prioritário</li>
                </ul>
                <button className={styles.btnPlanLight}>Assinar Profissional</button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.testimonialsSection}>
          <div className={styles.testimonialsHeader}>
            <h2 className={styles.testimonialsTitle}>Feito para quem vive do próprio negócio</h2>
            <p className={styles.testimonialsSubtitle}>Veja o que dizem os profissionais que já automatizaram a agenda com o Trimo.</p>
          </div>

          <div className={styles.testimonialsGrid}>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>★★★★★</div>
              <p className={styles.testimonialText}>"Desde que coloquei o link do Trimo no Instagram, parei de perder 2 horas por dia respondendo mensagem. O cliente marca e eu só vejo a notificação."</p>
              <div className={styles.testimonialAuthorWrapper}>
                <div className={styles.testimonialAvatar}></div>
                <div>
                  <p className={styles.testimonialAuthorName}>Roberto Silva</p>
                  <p className={styles.testimonialAuthorRole}>Roberto Estética & Co</p>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>★★★★★</div>
              <p className={styles.testimonialText}>"O lembrete no WhatsApp salvou minha agenda. Antes eu tinha 3 a 4 faltas na semana porque o cliente esquecia. Agora, quase zerei os boxes vazios."</p>
              <div className={styles.testimonialAuthorWrapper}>
                <div className={styles.testimonialAvatar}></div>
                <div>
                  <p className={styles.testimonialAuthorName}>Juliano Costa</p>
                  <p className={styles.testimonialAuthorRole}>JC Detailer</p>
                </div>
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
  btnHeroPrimary: "w-full sm:w-auto bg-[#E56B25] hover:bg-[#cf5818] text-white text-base font-bold py-4 px-8 rounded-full transition-all text-center shadow-xl shadow-[#E56B25]/20",
  btnHeroSecondary: "w-full sm:w-auto bg-white border border-zinc-200 text-zinc-900 hover:border-zinc-400 text-base font-bold py-4 px-8 rounded-full transition-all text-center shadow-sm",

  heroImageCol: "lg:w-1/2 relative w-full",
  heroImageWrapper: "aspect-[4/3] bg-zinc-200 rounded-[2rem] overflow-hidden relative shadow-2xl",
  heroImage: "w-full h-full object-cover",
  heroImageOverlay: "absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent",
  heroBadge: "absolute -bottom-8 -left-4 sm:left-8 bg-white p-4 pr-6 rounded-2xl shadow-xl flex items-center gap-4 border border-zinc-100 animate-bounce",
  heroBadgeIconWrapper: "w-10 h-10 bg-[#E56B25]/10 rounded-full flex items-center justify-center",
  heroBadgeIcon: "w-5 h-5 text-[#E56B25]",
  heroBadgeTitle: "text-sm font-bold text-zinc-900",
  heroBadgeText: "text-xs text-zinc-500 font-medium",

  sectionDark: "bg-zinc-950 py-32 px-6 text-white",
  sectionLight: "bg-[#FAFAFA] py-32 px-6",
  sectionLabel: "text-[#E56B25] text-xs font-bold tracking-[0.2em] uppercase mb-4 block",
  sectionTitleDark: "text-4xl md:text-5xl font-black tracking-tight mb-20 max-w-2xl leading-tight text-white",
  sectionTitleLight: "text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-24 leading-tight",
  sectionTitleCenterDark: "text-4xl md:text-5xl font-black text-white tracking-tight mb-6",

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

  plansSubtitle: "text-zinc-400 font-medium mb-20",
  plansGrid: "grid md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto",
  
  planCardDark: "bg-zinc-900 rounded-3xl p-10 border border-zinc-800",
  planTitleDark: "text-2xl font-bold text-white mb-2",
  planPriceWrapper: "flex items-baseline gap-1 mb-6",
  planCurrencyDark: "text-xl font-bold text-zinc-500",
  planPriceDark: "text-5xl font-black text-white",
  planPeriodDark: "text-zinc-500",
  planDescDark: "text-zinc-400 text-sm mb-8 font-medium h-10",
  planListDark: "space-y-4 mb-10 text-zinc-300 text-sm font-medium",
  planCheckDark: "text-[#E56B25]",
  btnPlanDark: "w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-full transition-colors",

  planCardLight: "bg-white rounded-3xl p-10 shadow-2xl relative transform md:-translate-y-4",
  planBadge: "absolute top-0 right-8 -translate-y-1/2 bg-[#E56B25] text-white text-xs font-black uppercase tracking-wider py-1.5 px-3 rounded-full shadow-lg shadow-[#E56B25]/30",
  planTitleLight: "text-2xl font-bold text-zinc-900 mb-2",
  planCurrencyLight: "text-xl font-bold text-zinc-400",
  planPriceLight: "text-5xl font-black text-zinc-900",
  planPeriodLight: "text-zinc-500",
  planDescLight: "text-zinc-600 text-sm mb-8 font-medium h-10",
  planDivider: "h-[1px] bg-zinc-200 w-full mb-8",
  planListLight: "space-y-4 mb-10 text-zinc-700 text-sm font-bold",
  planCheckLight: "text-[#E56B25]",
  btnPlanLight: "w-full bg-[#E56B25] hover:bg-[#cf5818] text-white font-black py-4 rounded-full transition-colors shadow-xl shadow-[#E56B25]/30",

  testimonialsSection: "bg-[#FAFAFA] py-32 px-6",
  testimonialsHeader: "max-w-4xl mx-auto text-center mb-16",
  testimonialsTitle: "text-4xl font-black text-zinc-900 tracking-tight mb-4",
  testimonialsSubtitle: "text-zinc-500 font-medium",
  testimonialsGrid: "grid md:grid-cols-2 gap-8 max-w-5xl mx-auto",
  testimonialCard: "bg-white p-10 rounded-3xl shadow-sm border border-zinc-100",
  testimonialStars: "flex gap-1 text-[#E56B25] mb-6",
  testimonialText: "text-lg text-zinc-900 font-medium mb-8 leading-relaxed",
  testimonialAuthorWrapper: "flex items-center gap-4",
  testimonialAvatar: "w-12 h-12 bg-zinc-200 rounded-full",
  testimonialAuthorName: "font-bold text-zinc-900",
  testimonialAuthorRole: "text-sm text-zinc-500",

  footer: "bg-zinc-950 pt-16 pb-8 px-6 border-t border-zinc-900",
  footerContainer: "max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6",
  footerText: "text-zinc-500 text-sm font-medium",
};