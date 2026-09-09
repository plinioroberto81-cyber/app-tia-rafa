/* ==========================================================================
   1. CONFIGURAÇÕES, BANCO DE DADOS (SUPABASE) & VARIÁVEIS GLOBAIS
   ========================================================================== */

const SUPABASE_URL = "https://sxrexcmtanpwljimfqpk.supabase.co";
const SUPABASE_KEY = "sb_publishable_NM0fvyA5X1zlFVy39gvrYA_pyTXBisb";

let supabaseClient = null;
if (window.supabase && window.supabase.createClient) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Estados Globais da Aplicação
let pixChaveGlobal = "11999998888";
let linkCartaoGlobal = "https://mpago.la/";
let currentRole = null;
let alunosCache = [];
let modoRotaAtual = "IDA";
let filtroTurnoAtual = "Todos";
let filtroFinStatus = "Todos";
let filtroFinAdminStatus = "Todos";

// Áudio / Sirene
let audioContext = null;
let audioOscillator = null;

// GPS & Mapas
let gpsWatchId = null;
let isGpsTransmitting = false;
let mapAdmin = null;
let markerVanAdmin = null;
let mapRafa = null;
let markerVanRafa = null;

// Elementos Globais da Interface
let loginSection, authForm, authTitle, inputPassword, mainButtons, bottomBar, btnTopBack;

/* ==========================================================================
   2. INICIALIZAÇÃO & EVENTOS DO SISTEMA (MAIN)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  loginSection = document.getElementById("login-section");
  authForm = document.getElementById("auth-form");
  authTitle = document.getElementById("auth-title");
  inputPassword = document.getElementById("input-password");
  mainButtons = document.getElementById("main-buttons");
  bottomBar = document.getElementById("bottom-bar");
  btnTopBack = document.getElementById("btn-top-back");

  inicializarTema();
  verificarAlertaGlobal();
  carregarConfiguracoesGlobais();
  
  setInterval(verificarEmergenciaAdmin, 3000);
  setInterval(() => {
    carregarGpsAdmin();
    carregarGpsRafa();
  }, 5000);

  setInterval(() => {
    if (currentRole === "pais") {
      carregarDadosPais(true);
    } else if (currentRole === "rafa") {
      carregarDadosRafa(true);
    } else if (currentRole === "admin") {
      carregarDadosAdmin(true);
    }
  }, 4000);

  // Escutadores Globais
  btnTopBack?.addEventListener("click", voltarHome);
  document.getElementById("btn-back")?.addEventListener("click", resetLogin);
  document.getElementById("nav-btn-logout")?.addEventListener("click", logout);
  document.getElementById("btn-theme-toggle")?.addEventListener("click", alternarTema);

  // Seleção de Perfis
  document.getElementById("btn-pais")?.addEventListener("click", () => entrarPerfil("pais"));
  document.getElementById("btn-rafa")?.addEventListener("click", () => mostrarFormLogin("rafa"));
  document.getElementById("btn-admin")?.addEventListener("click", () => mostrarFormLogin("admin"));
  document.getElementById("btn-login-submit")?.addEventListener("click", efetuarLoginComSupabase);

  // GPS & Mapas
  document.getElementById("btn-toggle-gps")?.addEventListener("click", alternarTransmissaoGps);
  document.getElementById("btn-toggle-mapa-rafa")?.addEventListener("click", toggleMapaRafa);
  document.getElementById("btn-toggle-mapa-admin")?.addEventListener("click", toggleMapaAdmin);

  // Sanfonas
  document.getElementById("btn-toggle-form-rafa")?.addEventListener("click", () => toggleFormCadastro('rafa'));
  document.getElementById("btn-toggle-form-admin")?.addEventListener("click", () => toggleFormCadastro('admin'));

  // Emergências & Modais
  document.getElementById("btn-disparar-emergencia")?.addEventListener("click", dispararEmergenciaRafa);
  document.getElementById("btn-desativar-emergencia")?.addEventListener("click", atenderEmergenciaAdmin);
  document.getElementById("btn-fechar-modal-edit")?.addEventListener("click", () => {
    document.getElementById("modal-editar-aluno")?.classList.add("hidden");
  });
  document.getElementById("form-editar-aluno")?.addEventListener("submit", salvarEdicaoAluno);

  // Configurações Globais
  document.getElementById("btn-salvar-configs")?.addEventListener("click", () => salvarConfigsGlobais('admin'));
  document.getElementById("btn-salvar-configs-rafa")?.addEventListener("click", () => salvarConfigsGlobais('rafa'));

  // Auto Cadastro
  document.getElementById("btn-abrir-auto-cadastro")?.addEventListener("click", () => {
    document.getElementById("form-auto-cadastro-container")?.classList.remove("hidden");
  });
  document.getElementById("btn-fechar-auto-cadastro")?.addEventListener("click", () => {
    document.getElementById("form-auto-cadastro-container")?.classList.add("hidden");
  });
  document.getElementById("form-auto-cadastro-pais")?.addEventListener("submit", enviarAutoCadastroPais);

  // Área dos Pais
  document.getElementById("select-email-pais")?.addEventListener("change", (e) => {
    const val = e.target.value;
    const boxPin = document.getElementById("box-pin-pais");
    const containerFilho = document.getElementById("conteudo-filho-pais");
    
    // Sempre esconde os dados do filho ao trocar de nome ou selecionar um novo
    containerFilho?.classList.add("hidden");
    localStorage.removeItem("app_pai_pin_validado");

    if (val) {
      boxPin?.classList.remove("hidden");
      const pinInp = document.getElementById("input-pin-pais");
      if (pinInp) pinInp.value = "";
    } else {
      boxPin?.classList.add("hidden");
    }
  });

  document.getElementById("btn-entrar-pais-pin")?.addEventListener("click", validarLoginPinPais);

  // Abas da Área dos Pais
  document.getElementById("tab-pais-filho")?.addEventListener("click", () => {
    document.getElementById("aba-pais-filho")?.classList.remove("hidden");
    document.getElementById("aba-pais-financeiro")?.classList.add("hidden");
    document.getElementById("tab-pais-filho").className = "flex-1 py-2 text-xs font-bold text-amber-400 border-b-2 border-amber-400";
    document.getElementById("tab-pais-financeiro").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
  });

  document.getElementById("tab-pais-financeiro")?.addEventListener("click", () => {
    document.getElementById("aba-pais-filho")?.classList.add("hidden");
    document.getElementById("aba-pais-financeiro")?.classList.remove("hidden");
    document.getElementById("tab-pais-financeiro").className = "flex-1 py-2 text-xs font-bold text-amber-400 border-b-2 border-amber-400";
    document.getElementById("tab-pais-filho").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
  });

  // Alternador de Rota Ida/Volta
  document.getElementById("btn-rota-ida")?.addEventListener("click", () => alternarModoRota("IDA"));
  document.getElementById("btn-rota-volta")?.addEventListener("click", () => alternarModoRota("VOLTA"));

  // Abas Tia Rafa
  document.getElementById("tab-btn-chamada")?.addEventListener("click", () => {
    document.getElementById("aba-chamada-rafa")?.classList.remove("hidden");
    document.getElementById("aba-passageiros-rafa")?.classList.add("hidden");
    document.getElementById("aba-financeiro-rafa")?.classList.add("hidden");
    document.getElementById("tab-btn-chamada").className = "flex-1 py-2 text-xs font-bold text-amber-400 border-b-2 border-amber-400";
    document.getElementById("tab-btn-passageiros").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
    document.getElementById("tab-btn-financeiro").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
  });

  document.getElementById("tab-btn-passageiros")?.addEventListener("click", () => {
    document.getElementById("aba-chamada-rafa")?.classList.add("hidden");
    document.getElementById("aba-passageiros-rafa")?.classList.remove("hidden");
    document.getElementById("aba-financeiro-rafa")?.classList.add("hidden");
    document.getElementById("tab-btn-passageiros").className = "flex-1 py-2 text-xs font-bold text-amber-400 border-b-2 border-amber-400";
    document.getElementById("tab-btn-chamada").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
    document.getElementById("tab-btn-financeiro").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
    renderizarPassageirosGeralRafa();
  });

  document.getElementById("tab-btn-financeiro")?.addEventListener("click", () => {
    document.getElementById("aba-chamada-rafa")?.classList.add("hidden");
    document.getElementById("aba-passageiros-rafa")?.classList.add("hidden");
    document.getElementById("aba-financeiro-rafa")?.classList.remove("hidden");
    document.getElementById("tab-btn-financeiro").className = "flex-1 py-2 text-xs font-bold text-amber-400 border-b-2 border-amber-400";
    document.getElementById("tab-btn-chamada").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
    document.getElementById("tab-btn-passageiros").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
    renderizarFinanceiroRafa();
  });

  // Abas Admin
  document.getElementById("tab-admin-alunos")?.addEventListener("click", () => {
    document.getElementById("aba-admin-alunos")?.classList.remove("hidden");
    document.getElementById("aba-admin-financeiro")?.classList.add("hidden");
    document.getElementById("tab-admin-alunos").className = "flex-1 py-2 text-xs font-bold text-amber-400 border-b-2 border-amber-400";
    document.getElementById("tab-admin-financeiro").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
  });

  document.getElementById("tab-admin-financeiro")?.addEventListener("click", () => {
    document.getElementById("aba-admin-alunos")?.classList.add("hidden");
    document.getElementById("aba-admin-financeiro")?.classList.remove("hidden");
    document.getElementById("tab-admin-financeiro").className = "flex-1 py-2 text-xs font-bold text-amber-400 border-b-2 border-amber-400";
    document.getElementById("tab-admin-alunos").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
    renderizarFinanceiroAdmin();
  });

  // Filtros
  document.getElementById("btn-filtro-todos")?.addEventListener("click", () => aplicarFiltroTurno("Todos"));
  document.getElementById("btn-filtro-manha7")?.addEventListener("click", () => aplicarFiltroTurno("Manhã (07h às 11h)"));
  document.getElementById("btn-filtro-manha8")?.addEventListener("click", () => aplicarFiltroTurno("Manhã (08h às 12h)"));
  document.getElementById("btn-filtro-tarde")?.addEventListener("click", () => aplicarFiltroTurno("Tarde"));

  document.getElementById("btn-fin-filtro-todos")?.addEventListener("click", () => aplicarFiltroFin("Todos"));
  document.getElementById("btn-fin-filtro-pendentes")?.addEventListener("click", () => aplicarFiltroFin("Pendente"));
  document.getElementById("btn-fin-filtro-pagos")?.addEventListener("click", () => aplicarFiltroFin("Pago"));

  document.getElementById("btn-admin-fin-todos")?.addEventListener("click", () => aplicarFiltroFinAdmin("Todos"));
  document.getElementById("btn-admin-fin-pendentes")?.addEventListener("click", () => aplicarFiltroFinAdmin("Pendente"));
  document.getElementById("btn-admin-fin-pagos")?.addEventListener("click", () => aplicarFiltroFinAdmin("Pago"));

  // Exportar Relatórios CSV
  document.getElementById("btn-rafa-exportar-csv")?.addEventListener("click", exportarRelatorioFinanceiroCSV);
  document.getElementById("btn-admin-exportar-csv")?.addEventListener("click", exportarRelatorioFinanceiroCSV);

  // Mural de Avisos
  document.getElementById("btn-aviso-transito")?.addEventListener("click", () => dispararAviso("🚗 Trânsito intenso na via. Estamos avançando devagar e em segurança."));
  document.getElementById("btn-aviso-transito-rafa")?.addEventListener("click", () => dispararAviso("🚗 Trânsito intenso na via. Estamos avançando devagar e em segurança."));
  document.getElementById("btn-aviso-chuva")?.addEventListener("click", () => dispararAviso("🌧️ Chuva forte na região. Velocidade reduzida por segurança."));
  document.getElementById("btn-aviso-chuva-rafa")?.addEventListener("click", () => dispararAviso("🌧️ Chuva forte na região. Velocidade reduzida por segurança."));

  document.getElementById("btn-enviar-aviso-custom")?.addEventListener("click", () => {
    const txt = document.getElementById("input-aviso-custom")?.value;
    if (txt) { dispararAviso(`📢 ${txt}`); document.getElementById("input-aviso-custom").value = ""; }
  });
  document.getElementById("btn-enviar-aviso-custom-rafa")?.addEventListener("click", () => {
    const txt = document.getElementById("input-aviso-custom-rafa")?.value;
    if (txt) { dispararAviso(`📢 ${txt}`); document.getElementById("input-aviso-custom-rafa").value = ""; }
  });

  document.getElementById("btn-limpar-aviso")?.addEventListener("click", limparAvisos);
  document.getElementById("btn-limpar-aviso-rafa")?.addEventListener("click", limparAvisos);

  // Formulários de Cadastro de Passageiro
  document.getElementById("form-cadastrar-aluno")?.addEventListener("submit", cadastrarAlunoAdmin);
  document.getElementById("form-cadastrar-aluno-rafa")?.addEventListener("submit", cadastrarAlunoRafa);
  
  // Encerrar Mês
  document.getElementById("btn-encerrar-mes")?.addEventListener("click", encerrarMesFinanceiro);
  document.getElementById("btn-encerrar-mes-rafa")?.addEventListener("click", encerrarMesFinanceiro);

  await restaurarSessaoAnterior();
});

/* ==========================================================================
   3. INTERFACE, TEMA CLARO/ESCURO & COMPONENTES VISUAIS
   ========================================================================== */

function atualizarBadgeHeader(role) {
  const badge = document.getElementById("badge-perfil-header");
  if (!badge) return;

  if (!role) {
    badge.classList.add("hidden");
    return;
  }

  badge.classList.remove("hidden");

  if (role === "pais") {
    badge.innerText = "Área dos Pais";
    badge.className = "text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30";
  } else if (role === "rafa") {
    badge.innerText = "Tia Rafa";
    badge.className = "text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  } else if (role === "admin") {
    badge.innerText = "Gestão Admin";
    badge.className = "text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30";
  }
}

function inicializarTema() {
  const temaSalvo = localStorage.getItem("theme");
  const themeIcon = document.getElementById("theme-icon");
  if (temaSalvo === "light") {
    document.documentElement.classList.add("light-mode");
    if (themeIcon) themeIcon.className = "fa-solid fa-moon text-xs";
  } else {
    document.documentElement.classList.remove("light-mode");
    if (themeIcon) themeIcon.className = "fa-solid fa-sun text-xs";
  }
}

function alternarTema() {
  const htmlEl = document.documentElement;
  const themeIcon = document.getElementById("theme-icon");
  if (htmlEl.classList.contains("light-mode")) {
    htmlEl.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
    if (themeIcon) themeIcon.className = "fa-solid fa-sun text-xs";
  } else {
    htmlEl.classList.add("light-mode");
    localStorage.setItem("theme", "light");
    if (themeIcon) themeIcon.className = "fa-solid fa-moon text-xs";
  }
}

function toggleFormCadastro(role) {
  const container = role === 'rafa' ? document.getElementById("container-form-cadastrar-rafa") : document.getElementById("container-form-cadastrar-admin");
  const icon = role === 'rafa' ? document.getElementById("icon-toggle-form-rafa") : document.getElementById("icon-toggle-form-admin");
  
  if (!container) return;

  if (container.classList.contains("hidden")) {
    container.classList.remove("hidden");
    if (icon) icon.className = "fa-solid fa-chevron-up text-amber-400";
  } else {
    container.classList.add("hidden");
    if (icon) icon.className = "fa-solid fa-chevron-down text-amber-400";
  }
}

async function verificarAlertaGlobal() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.from('alertas').select('*').eq('ativo', true).neq('tipo', 'EMERGENCIA_ADMIN').neq('tipo', 'GPS_VAN').order('id', { ascending: false }).limit(1);
  const banner = document.getElementById("banner-alerta-global");
  const txt = document.getElementById("texto-alerta-global");
  
  if (data && data.length > 0) {
    if (txt) txt.innerText = data[0].mensagem;
    banner?.classList.remove("hidden");
  } else {
    banner?.classList.add("hidden");
  }
}

async function dispararAviso(msg) {
  if (!supabaseClient) return;
  await supabaseClient.from('alertas').update({ ativo: false }).neq('tipo', 'EMERGENCIA_ADMIN').neq('tipo', 'GPS_VAN');
  await supabaseClient.from('alertas').insert([{ tipo: 'Aviso', mensagem: msg, ativo: true }]);
  alert("Aviso publicado!");
  verificarAlertaGlobal();
}

async function limparAvisos() {
  if (!supabaseClient) return;
  await supabaseClient.from('alertas').update({ ativo: false }).neq('tipo', 'EMERGENCIA_ADMIN').neq('tipo', 'GPS_VAN');
  alert("Avisos encerrados!");
  verificarAlertaGlobal();
}

/* ==========================================================================
   4. AUTENTICAÇÃO, TROCA DE PERFIL E GERENCIAMENTO DE SESSÃO
   ========================================================================== */

function mostrarFormLogin(role) {
  currentRole = role;
  if (authTitle) authTitle.innerText = role === "rafa" ? "Senha Tia Rafa" : "Senha Admin";
  if (authForm) authForm.classList.remove("hidden");
  if (mainButtons) mainButtons.classList.add("hidden");
}

function resetLogin() {
  if (authForm) authForm.classList.add("hidden");
  if (mainButtons) mainButtons.className = "space-y-3";
  if (inputPassword) inputPassword.value = "";
}

function entrarPerfil(role, isRestoring = false) {
  currentRole = role;
  localStorage.setItem("app_role", role);

  loginSection?.classList.add("hidden");
  bottomBar?.classList.remove("hidden");
  btnTopBack?.classList.remove("hidden");

  atualizarBadgeHeader(role);

  if (role === "pais") {
    document.getElementById("dashboard-pais")?.classList.remove("hidden");
    carregarDadosPais();
  } else if (role === "rafa") {
    document.getElementById("dashboard-rafa")?.classList.remove("hidden");
    carregarDadosRafa();
    if (!isGpsTransmitting) alternarTransmissaoGps();
  } else if (role === "admin") {
    document.getElementById("dashboard-admin")?.classList.remove("hidden");
    carregarDadosAdmin();
  }
}

function voltarHome() {
  document.getElementById("dashboard-pais")?.classList.add("hidden");
  document.getElementById("dashboard-rafa")?.classList.add("hidden");
  document.getElementById("dashboard-admin")?.classList.add("hidden");
  bottomBar?.classList.add("hidden");
  btnTopBack?.classList.add("hidden");
  loginSection?.classList.remove("hidden");
  
  if (isGpsTransmitting) alternarTransmissaoGps();
  pararSomSirene();
  resetLogin();
  atualizarBadgeHeader(null);
}

async function efetuarLoginComSupabase() {
  const pwdInput = document.getElementById("input-password");
  const pwd = pwdInput ? pwdInput.value.trim() : "";

  if (!pwd) {
    alert("Por favor, digite a senha.");
    return;
  }

  const emailLogin = (currentRole === "rafa") 
    ? "rafaeladasvirgens@gmail.com" 
    : "plinioroberto81@gmail.com";

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: emailLogin,
      password: pwd
    });

    if (error) {
      alert("⚠️ Senha incorreta ou acesso negado!");
      return;
    }

    pwdInput.value = "";
    entrarPerfil(currentRole);

  } catch (err) {
    console.error("Erro no login:", err);
    alert("Falha de comunicação na autenticação.");
  }
}

async function logout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  localStorage.removeItem("app_role");
  localStorage.removeItem("app_pai_email");

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
      localStorage.removeItem(key);
    }
  });

  currentRole = null;
  voltarHome();
}

async function restaurarSessaoAnterior() {
  const roleSalva = localStorage.getItem("app_role");
  if (!roleSalva) {
    voltarHome();
    return;
  }

  if (roleSalva === "rafa" || roleSalva === "admin") {
    if (!supabaseClient) {
      localStorage.removeItem("app_role");
      voltarHome();
      return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      localStorage.removeItem("app_role");
      voltarHome();
      return;
    }
  }

  currentRole = roleSalva;
  entrarPerfil(roleSalva, true);

  if (roleSalva === "pais") {
    const emailSalvo = localStorage.getItem("app_pai_email");
    if (emailSalvo) {
      setTimeout(() => {
        const select = document.getElementById("select-email-pais");
        if (select) select.value = emailSalvo;
        document.getElementById("box-pin-pais")?.classList.add("hidden");
        renderizarPaisFilho(emailSalvo);
      }, 500);
    }
  }
}

/* ==========================================================================
   5. CONFIGURAÇÕES GLOBAIS DE PAGAMENTO (PIX & CARTÃO)
   ========================================================================== */

async function carregarConfiguracoesGlobais() {
  if (!supabaseClient) return;

  try {
    const { data } = await supabaseClient
      .from('configuracoes')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (data) {
      pixChaveGlobal = data.pix_chave || pixChaveGlobal;
      linkCartaoGlobal = data.link_cartao || linkCartaoGlobal;

      if (document.getElementById("cfg-pix")) document.getElementById("cfg-pix").value = pixChaveGlobal;
      if (document.getElementById("cfg-cartao")) document.getElementById("cfg-cartao").value = linkCartaoGlobal;

      if (document.getElementById("cfg-pix-rafa")) document.getElementById("cfg-pix-rafa").value = pixChaveGlobal;
      if (document.getElementById("cfg-cartao-rafa")) document.getElementById("cfg-cartao-rafa").value = linkCartaoGlobal;
    }
  } catch (e) {
    console.error("Erro ao carregar configuracoes:", e);
  }
}

async function salvarConfigsGlobais(origem) {
  if (!supabaseClient) return;

  if (origem === 'rafa') {
    pixChaveGlobal = document.getElementById("cfg-pix-rafa")?.value.trim() || pixChaveGlobal;
    linkCartaoGlobal = document.getElementById("cfg-cartao-rafa")?.value.trim() || linkCartaoGlobal;
  } else {
    pixChaveGlobal = document.getElementById("cfg-pix")?.value.trim() || pixChaveGlobal;
    linkCartaoGlobal = document.getElementById("cfg-cartao")?.value.trim() || linkCartaoGlobal;
  }

  const { error } = await supabaseClient
    .from('configuracoes')
    .update({
      pix_chave: pixChaveGlobal,
      link_cartao: linkCartaoGlobal
    })
    .eq('id', 1);

  if (error) {
    alert("Erro ao salvar no banco: " + error.message);
    return;
  }

  alert("✓ Configurações salvas com sucesso!");
  
  if (currentRole === 'rafa') carregarDadosRafa();
  if (currentRole === 'admin') carregarDadosAdmin();
}

/* ==========================================================================
   6. GEOLOCALIZAÇÃO (GPS) E MAPAS
   ========================================================================== */

function toggleMapaRafa() {
  const wrapper = document.getElementById("wrapper-mapa-rafa");
  const btn = document.getElementById("btn-toggle-mapa-rafa");
  if (!wrapper || !btn) return;

  if (wrapper.classList.contains("hidden")) {
    wrapper.classList.remove("hidden");
    btn.innerHTML = `<i class="fa-solid fa-eye-slash"></i> Ocultar Mapa`;
    carregarGpsRafa();
    setTimeout(() => { if (mapRafa) mapRafa.invalidateSize(); }, 300);
  } else {
    wrapper.classList.add("hidden");
    btn.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> Exibir Mapa`;
  }
}

function toggleMapaAdmin() {
  const wrapper = document.getElementById("wrapper-mapa-admin");
  const btn = document.getElementById("btn-toggle-mapa-admin");
  if (!wrapper || !btn) return;

  if (wrapper.classList.contains("hidden")) {
    wrapper.classList.remove("hidden");
    btn.innerHTML = `<i class="fa-solid fa-eye-slash"></i> Ocultar Mapa`;
    carregarGpsAdmin();
    setTimeout(() => { if (mapAdmin) mapAdmin.invalidateSize(); }, 300);
  } else {
    wrapper.classList.add("hidden");
    btn.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> Exibir Mapa`;
  }
}

function alternarTransmissaoGps() {
  const btn = document.getElementById("btn-toggle-gps");
  if (!isGpsTransmitting) {
    if ("geolocation" in navigator) {
      if (btn) btn.innerHTML = "🟡 Enviando ao Banco...";
      
      gpsWatchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const precisao = pos.coords.accuracy;

          if (supabaseClient) {
            await supabaseClient.from('alertas').insert([{ 
              tipo: 'GPS_VAN', 
              mensagem: `${lat},${lng}`, 
              ativo: true 
            }]);
          }
          
          isGpsTransmitting = true;
          if (btn) {
            btn.innerHTML = `🟢 GPS Transmitindo (~${Math.round(precisao)}m)`;
            btn.className = "px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-[11px] rounded-lg transition-all animate-pulse";
          }
        },
        (err) => {
          if (btn) {
            btn.innerHTML = "⚪ GPS Desligado";
            btn.className = "px-3 py-1 bg-slate-700 text-slate-300 font-bold text-[11px] rounded-lg transition-all";
          }
          isGpsTransmitting = false;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      alert("Dispositivo sem suporte a GPS.");
    }
  } else {
    if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
    isGpsTransmitting = false;
    if (btn) {
      btn.innerHTML = "⚪ GPS Desligado";
      btn.className = "px-3 py-1 bg-slate-700 text-slate-300 font-bold text-[11px] rounded-lg transition-all";
    }
  }
}

async function carregarGpsRafa() {
  if (currentRole !== "rafa" || !supabaseClient) return;

  const wrapper = document.getElementById("wrapper-mapa-rafa");
  if (wrapper && wrapper.classList.contains("hidden")) return;

  const statusTxt = document.getElementById("txt-status-gps-rafa");
  const containerMapa = document.getElementById("mapa-rafa-container");
  if (!containerMapa) return;

  try {
    const { data } = await supabaseClient
      .from('alertas')
      .select('*')
      .eq('tipo', 'GPS_VAN')
      .order('id', { ascending: false })
      .limit(1);

    let lat = -22.7681; 
    let lng = -43.5591;
    let temSinal = false;

    if (data && data.length > 0 && data[0].mensagem) {
      const coords = data[0].mensagem.split(',');
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        lat = parseFloat(coords[0]);
        lng = parseFloat(coords[1]);
        temSinal = true;
      }
    }

    if (statusTxt) {
      statusTxt.innerText = temSinal 
        ? "🟢 Sinal ao Vivo Detectado" 
        : "⚪ Van Offline";
    }

    const iconeZafiraGps = L.divIcon({
      className: 'custom-van-marker',
      html: `
        <div style="width:50px; height:50px; border-radius:50%; border:3px solid #f59e0b; background:#0f172a; padding:3px; box-shadow:0 6px 16px rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center;">
          <img src="https://i.ibb.co/B2qsQ1pK/zafira-removebg-preview.png" style="width:100%; height:100%; object-fit:contain;" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3202/3202926.png'">
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    if (!mapRafa && window.L) {
      mapRafa = L.map('mapa-rafa-container').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRafa);
      markerVanRafa = L.marker([lat, lng], { icon: iconeZafiraGps }).addTo(mapRafa);
    } else if (mapRafa && markerVanRafa) {
      markerVanRafa.setLatLng([lat, lng]);
      mapRafa.setView([lat, lng]);
    }

    setTimeout(() => { if (mapRafa) mapRafa.invalidateSize(); }, 300);
  } catch (e) {
    console.error("Erro mapa rafa:", e);
  }
}

async function carregarGpsAdmin() {
  if (currentRole !== "admin" || !supabaseClient) return;

  const wrapper = document.getElementById("wrapper-mapa-admin");
  if (wrapper && wrapper.classList.contains("hidden")) return;

  const statusTxt = document.getElementById("txt-status-gps-admin");
  const containerMapa = document.getElementById("mapa-admin-container");
  if (!containerMapa) return;

  try {
    const { data } = await supabaseClient
      .from('alertas')
      .select('*')
      .eq('tipo', 'GPS_VAN')
      .order('id', { ascending: false })
      .limit(1);

    let lat = -22.7681; 
    let lng = -43.5591;
    let temSinal = false;

    if (data && data.length > 0 && data[0].mensagem) {
      const coords = data[0].mensagem.split(',');
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        lat = parseFloat(coords[0]);
        lng = parseFloat(coords[1]);
        temSinal = true;
      }
    }

    if (statusTxt) {
      statusTxt.innerText = temSinal 
        ? "🟢 Sinal ao Vivo Detectado" 
        : "⚪ Van Offline";
    }

    const iconeZafiraGps = L.divIcon({
      className: 'custom-van-marker',
      html: `
        <div style="width:50px; height:50px; border-radius:50%; border:3px solid #f59e0b; background:#0f172a; padding:3px; box-shadow:0 6px 16px rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center;">
          <img src="https://i.ibb.co/B2qsQ1pK/zafira-removebg-preview.png" style="width:100%; height:100%; object-fit:contain;" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3202/3202926.png'">
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    if (!mapAdmin && window.L) {
      mapAdmin = L.map('mapa-admin-container').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapAdmin);
      markerVanAdmin = L.marker([lat, lng], { icon: iconeZafiraGps }).addTo(mapAdmin);
    } else if (mapAdmin && markerVanAdmin) {
      markerVanAdmin.setLatLng([lat, lng]);
      mapAdmin.setView([lat, lng]);
    }

    setTimeout(() => { if (mapAdmin) mapAdmin.invalidateSize(); }, 300);
  } catch (e) {
    console.error("Erro mapa admin:", e);
  }
}

/* ==========================================================================
   7. MÓDULO ÁREA DOS PAIS
   ========================================================================== */

async function carregarDadosPais(isBackground = false) {
  if (!supabaseClient) return;
  const select = document.getElementById("select-email-pais");
  
  if (!isBackground) await carregarConfiguracoesGlobais();

  const { data } = await supabaseClient.from('alunos').select('*');
  if (!data) return;
  alunosCache = data;

  const aprovados = data.filter(a => !a.pendente_aprovacao);
  const nomesUnicos = [...new Set(aprovados.map(a => a.nome).filter(Boolean))];
  
  if (select && select.children.length <= 1) {
    select.innerHTML = '<option value="">-- Selecione seu Cadastro --</option>' + 
      nomesUnicos.map(n => `<option value="${n}">${n}</option>`).join('');
  }

  // PRIVACIDADE: Só restaura os dados se houver uma sessão de PIN já validada previamente no localStorage
  const alunoSalvo = localStorage.getItem("app_pai_email");
  const pinValidado = localStorage.getItem("app_pai_pin_validado");

  if (alunoSalvo && pinValidado === "true") {
    if (select) select.value = alunoSalvo;
    document.getElementById("box-pin-pais")?.classList.add("hidden");
    renderizarPaisFilho(alunoSalvo);
  } else {
    // Garante que o conteúdo do filho permaneça escondido
    document.getElementById("conteudo-filho-pais")?.classList.add("hidden");
  }
}

function validarLoginPinPais() {
  const emailSelect = document.getElementById("select-email-pais")?.value;
  const pinInput = document.getElementById("input-pin-pais")?.value;

  if (!emailSelect) {
    alert("Por favor, selecione o seu cadastro na lista.");
    return;
  }

  if (!pinInput) {
    alert("Por favor, digite o seu PIN de 4 dígitos.");
    return;
  }

  const aluno = alunosCache.find(a => (a.email_mae === emailSelect || a.nome === emailSelect) && !a.pendente_aprovacao);

  if (!aluno) {
    alert("Cadastro não encontrado ou pendente de aprovação pela Tia Rafa.");
    return;
  }

  const pinCorreto = aluno.pin_pais || "1234";

  if (pinInput === pinCorreto) {
    // Salva a validação na memória para não pedir PIN a cada clique
    localStorage.setItem("app_pai_email", emailSelect);
    localStorage.setItem("app_pai_pin_validado", "true");

    // Esconde a caixa do PIN e mostra as informações do filho
    document.getElementById("box-pin-pais")?.classList.add("hidden");
    renderizarPaisFilho(emailSelect);
  } else {
    alert("⚠️ PIN incorreto! Verifique o código digitado.");
    document.getElementById("conteudo-filho-pais")?.classList.add("hidden");
  }
}
function renderizarPaisFilho(emailOuNome) {
  const container = document.getElementById("conteudo-filho-pais");
  const abaFilho = document.getElementById("aba-pais-filho");
  const abaFin = document.getElementById("aba-pais-financeiro");

  if (!emailOuNome || !container) {
    container?.classList.add("hidden");
    return;
  }

  const filho = alunosCache.find(a => (a.email_mae === emailOuNome || a.nome === emailOuNome) && !a.pendente_aprovacao);
  if (!filho) return;

  const st = filho.status || 'Em Casa';
  let badgeColor = 'bg-slate-700/50 text-slate-300 border-slate-600';
  let icon = 'fa-house-user';
  let desc = 'Aguardando busca residencial.';

  if (st === 'Na Van' || st === 'Embarcou') { 
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30'; 
    icon = 'fa-van-shuttle'; 
    desc = 'A caminho com a Tia Rafa!';
  }
  if (st === 'Na Escola' || st === 'Desembarcou') { 
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'; 
    icon = 'fa-school'; 
    desc = 'Entregue no destino com segurança.';
  }

  const stPag = filho.status_pagamento || 'Pendente';
  const val = filho.valor || 180.00;
  const venc = filho.vencimento || 10;
  const temEspecial = filho.tem_horario_especial === true;
  const vaiHoje = filho.vai_hoje !== false;

  // CONTEÚDO DA ABA 1: MEU FILHO / ROTA
  if (abaFilho) {
    abaFilho.innerHTML = `
      <div class="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl space-y-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-base font-extrabold text-white">${filho.nome}</h3>
            <p class="text-xs text-slate-400 mt-0.5"><i class="fa-solid fa-graduation-cap"></i> ${filho.escola || '-'} (${filho.turno || 'Manhã'})</p>
            <p class="text-[11px] text-amber-400 font-medium mt-1"><i class="fa-regular fa-clock"></i> Horário Fixo: Busca ${filho.horario_busca || 'A definir'} | Entrada ${filho.horario_escola || '-'}</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold border ${badgeColor} flex items-center gap-1.5">
            <i class="fa-solid ${icon}"></i> ${st}
          </span>
        </div>

        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-xs text-slate-300">
          ${desc}
        </div>

        <div class="bg-slate-900/80 border border-amber-500/30 p-3.5 rounded-xl space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-400"><i class="fa-solid fa-clock"></i> Informar Exceção / Ausência</span>
            <button id="btn-toggle-excecao-${filho.id}" onclick="toggleBoxHorarioEspecial('${filho.id}')" class="px-2.5 py-1 text-[11px] font-bold rounded-lg ${temEspecial || !vaiHoje ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}">
              ${temEspecial || !vaiHoje ? '⚡ Exceção Ativa' : '+ Informar Exceção'}
            </button>
          </div>

          <div id="box-horario-especial-${filho.id}" class="${temEspecial || !vaiHoje ? '' : 'hidden'} space-y-3 pt-2 border-t border-slate-800">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] text-slate-400 block font-bold">Busca Ida Hoje:</label>
                <input type="text" id="esp-ida-${filho.id}" value="${filho.horario_busca_hoje || ''}" placeholder="Ex: 09:30" class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white">
              </div>
              <div>
                <label class="text-[9px] text-slate-400 block font-bold">Volta Hoje:</label>
                <input type="text" id="esp-volta-${filho.id}" value="${filho.horario_volta_hoje || ''}" placeholder="Ex: 15:00" class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white">
              </div>
            </div>
            
            <button onclick="salvarHorarioEspecialPais('${filho.id}')" class="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all">
              💾 Salvar Horário Especial pra Tia Rafa
            </button>

            <div class="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button onclick="marcarAusenciaPais('${filho.id}', '${filho.nome.replace(/'/g, "\\'")}')" class="w-full py-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white font-bold text-xs rounded-lg transition-all">
                🔴 Marcar que NÃO VAI no transporte hoje
              </button>

              ${temEspecial || !vaiHoje ? `
                <button onclick="restaurarPadraoPais('${filho.id}')" class="w-full py-1.5 bg-slate-800 text-emerald-400 hover:text-emerald-300 font-bold text-[11px] rounded-lg transition-all border border-slate-700">
                  ✓ Cancelar Exceção / Voltar ao Horário Fixo
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-700/60">
          <span class="text-xs font-bold text-slate-300">Status de Transporte Hoje:</span>
          <span class="px-3 py-1.5 rounded-xl text-xs font-bold ${vaiHoje ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white shadow-lg border border-rose-400'}">
            ${vaiHoje ? '🟢 Confirmado (Vai Hoje)' : '🔴 Ausente Informado'}
          </span>
        </div>
      </div>
    `;
  }

  // CONTEÚDO DA ABA 2: MENSALIDADE DA CRIANÇA
  if (abaFin) {
    abaFin.innerHTML = `
      <div class="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl space-y-4">
        <div class="flex justify-between items-center">
          <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider">Mensalidade Escolar</h4>
          <span class="text-xs font-bold ${stPag === 'Pago' ? 'text-emerald-400' : 'text-rose-400'}">${stPag === 'Pago' ? '🟢 Quitado' : '🔴 Pendente'}</span>
        </div>

        <div class="flex justify-between items-baseline">
          <p class="text-2xl font-extrabold text-white">R$ ${val.toFixed(2)}</p>
          <p class="text-xs text-slate-400">Vencimento: Dia ${venc}</p>
        </div>

        ${stPag !== 'Pago' ? `
          <div class="space-y-3 pt-2">
            <div class="p-3 bg-teal-950/40 border border-teal-500/30 rounded-xl space-y-1.5">
              <p class="text-xs font-bold text-teal-300"><i class="fa-brands fa-pix"></i> Pagamento via PIX</p>
              <p class="text-xs font-mono bg-slate-900 p-2 rounded border border-slate-700 text-teal-200 select-all">${pixChaveGlobal}</p>
            </div>

            <div class="p-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-xs text-slate-400">
              <i class="fa-solid fa-money-bill-wave text-amber-400"></i> <strong>Dinheiro:</strong> Entregar diretamente para a Tia Rafa no embarque.
            </div>

            <a href="${linkCartaoGlobal}" target="_blank" class="block w-full py-3 bg-slate-700 hover:bg-slate-600 text-white text-center font-bold text-xs rounded-xl transition-all">
              <i class="fa-solid fa-credit-card"></i> Pagar no Cartão de Crédito/Débito
            </a>
          </div>
        ` : `
          <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold text-center">
            ✓ Obrigado! A mensalidade deste mês está quitada.
          </div>
        `}
      </div>
    `;
  }

  container.classList.remove("hidden");
}

function toggleBoxHorarioEspecial(id) {
  const box = document.getElementById(`box-horario-especial-${id}`);
  const btn = document.getElementById(`btn-toggle-excecao-${id}`);
  if (!box) return;

  const estaEscondido = box.classList.contains("hidden");

  if (estaEscondido) {
    box.classList.remove("hidden");
    if (btn) btn.innerText = "✕ Fechar";
  } else {
    box.classList.add("hidden");
    const filho = alunosCache.find(a => a.id == id);
    const temEspecial = filho ? (filho.tem_horario_especial || filho.vai_hoje === false) : false;
    if (btn) btn.innerText = temEspecial ? "⚡ Exceção Ativa" : "+ Informar Exceção";
  }
}

async function enviarAutoCadastroPais(e) {
  e.preventDefault();
  if (!supabaseClient) return;

  const nomeEl = document.getElementById("auto-nome");
  const turnoEl = document.getElementById("auto-turno");
  const wspEl = document.getElementById("auto-wsp");
  const endEl = document.getElementById("auto-endereco-casa");
  const escolaEl = document.getElementById("auto-escola");
  const emailEl = document.getElementById("auto-email-mae");
  const pinEl = document.getElementById("auto-pin");

  const pin = pinEl ? pinEl.value.trim() : "";
  if (pin.length !== 4 || isNaN(pin)) {
    alert("O PIN de acesso deve conter exatamente 4 números.");
    if (pinEl) pinEl.focus();
    return;
  }

  const emailValor = emailEl ? emailEl.value.trim().toLowerCase() : "";

  const novoAluno = {
    nome: nomeEl ? nomeEl.value.trim() : "",
    turno: turnoEl ? turnoEl.value : "Manhã (07h às 11h)",
    whatsapp: wspEl ? wspEl.value.trim() : "",
    horario_escola: turnoEl ? turnoEl.value : "",
    horario_busca: "",
    endereco_casa: endEl ? endEl.value.trim() : "",
    escola: escolaEl ? escolaEl.value.trim() : "",
    email_mae: emailValor || `aluno_${Date.now()}@transporte.local`,
    pin_pais: pin,
    valor: 180,
    vencimento: 10,
    status: 'Em Casa',
    status_pagamento: 'Pendente',
    vai_hoje: true,
    levado_hoje: false,
    tem_horario_especial: false,
    horario_busca_hoje: "",
    horario_volta_hoje: "",
    pendente_aprovacao: true
  };

  const { error } = await supabaseClient.from('alunos').insert([novoAluno]);

  if (error) {
    alert("Erro ao enviar cadastro: " + error.message);
    return;
  }

  alert("✓ Cadastro enviado com sucesso!\n\nA Tia Rafa definirá o horário da busca e aprovará o acesso.");
  document.getElementById("form-auto-cadastro-pais")?.reset();
  document.getElementById("form-auto-cadastro-container")?.classList.add("hidden");
  carregarDadosPais();
}

async function marcarAusenciaPais(id, nomeAluno) {
  if (!supabaseClient) return;

  const confirmou = confirm(`Tem certeza que o(a) ${nomeAluno} NÃO vai no transporte hoje?`);
  if (!confirmou) return;

  const { error } = await supabaseClient.from('alunos').update({ 
    vai_hoje: false 
  }).eq('id', id);

  if (error) {
    alert("Erro ao registrar ausência: " + error.message);
    return;
  }

  alert(`✓ Avisado com sucesso! A Tia Rafa já sabe que ${nomeAluno} não irá hoje.`);
  
  await carregarDadosPais();
  if (currentRole === 'rafa') carregarDadosRafa();

  const emailSelect = document.getElementById("select-email-pais")?.value;
  if (emailSelect) renderizarPaisFilho(emailSelect);
}

async function salvarHorarioEspecialPais(id) {
  if (!supabaseClient) return;

  const hIda = document.getElementById(`esp-ida-${id}`)?.value.trim() || "";
  const hVolta = document.getElementById(`esp-volta-${id}`)?.value.trim() || "";

  if (!hIda && !hVolta) {
    alert("Informe ao menos um horário para salvar.");
    return;
  }

  const { error } = await supabaseClient.from('alunos').update({
    tem_horario_especial: true,
    horario_busca_hoje: hIda,
    horario_volta_hoje: hVolta,
    vai_hoje: true
  }).eq('id', id);

  if (error) {
    alert("Erro ao salvar: " + error.message);
    return;
  }

  alert("✓ Horário especial enviado para a Tia Rafa!");
  
  await carregarDadosPais();
  if (currentRole === 'rafa') carregarDadosRafa();

  const emailSelect = document.getElementById("select-email-pais")?.value;
  if (emailSelect) renderizarPaisFilho(emailSelect);
}

async function restaurarPadraoPais(id) {
  if (!supabaseClient) return;

  const confirmou = confirm("Deseja cancelar todas as exceções e voltar ao horário e presença normais?");
  if (!confirmou) return;

  const { error } = await supabaseClient.from('alunos').update({
    tem_horario_especial: false,
    horario_busca_hoje: "",
    horario_volta_hoje: "",
    vai_hoje: true
  }).eq('id', id);

  if (error) {
    alert("Erro ao restaurar: " + error.message);
    return;
  }

  alert("✓ Status restaurado ao padrão normal!");
  
  await carregarDadosPais();
  if (currentRole === 'rafa') carregarDadosRafa();

  const emailSelect = document.getElementById("select-email-pais")?.value;
  if (emailSelect) renderizarPaisFilho(emailSelect);
}

/* ==========================================================================
   8. MÓDULO PAINEL TIA RAFA (MOTORISTA)
   ========================================================================== */

async function carregarDadosRafa(isBackground = false) {
  if (!supabaseClient) return;

  if (!isBackground) await carregarConfiguracoesGlobais();

  const { data } = await supabaseClient.from('alunos').select('*');
  if (!data) return;
  alunosCache = data;

  renderizarPendentesAprovacao();
  renderizarRotaRafa();
  renderizarPassageirosGeralRafa();
  renderizarFinanceiroRafa();
}

function alternarModoRota(modo) {
  modoRotaAtual = modo;
  const btnIda = document.getElementById("btn-rota-ida");
  const btnVolta = document.getElementById("btn-rota-volta");

  if (modo === "IDA") {
    btnIda.className = "py-2 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 transition-all flex items-center justify-center gap-1.5";
    btnVolta.className = "py-2 text-xs font-bold rounded-lg bg-slate-800 text-slate-400 transition-all flex items-center justify-center gap-1.5";
  } else {
    btnVolta.className = "py-2 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 transition-all flex items-center justify-center gap-1.5";
    btnIda.className = "py-2 text-xs font-bold rounded-lg bg-slate-800 text-slate-400 transition-all flex items-center justify-center gap-1.5";
  }
  renderizarRotaRafa();
}

function aplicarFiltroTurno(turno) {
  filtroTurnoAtual = turno;
  document.getElementById("btn-filtro-todos").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${turno === 'Todos' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`;
  document.getElementById("btn-filtro-manha7").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${turno === 'Manhã (07h às 11h)' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`;
  document.getElementById("btn-filtro-manha8").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${turno === 'Manhã (08h às 12h)' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`;
  document.getElementById("btn-filtro-tarde").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${turno === 'Tarde' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`;
  renderizarRotaRafa();
}

function renderizarRotaRafa() {
  const container = document.getElementById("lista-chamada-rafa-cards");
  if (!container) return;

  const aprovados = alunosCache.filter(a => !a.pendente_aprovacao && a.vai_hoje !== false);
  let filtrados = aprovados;

  if (modoRotaAtual === "VOLTA") {
    filtrados = aprovados.filter(a => a.levado_hoje === true || a.status === 'Na Escola' || a.status === 'Na Van');
  }

  if (filtroTurnoAtual !== "Todos") {
    filtrados = filtrados.filter(a => a.turno === filtroTurnoAtual);
  }

  filtrados.sort((a, b) => {
    let hA = a.horario_busca || '99:99';
    let hB = b.horario_busca || '99:99';

    if (modoRotaAtual === "IDA" && a.horario_busca_hoje) hA = a.horario_busca_hoje;
    if (modoRotaAtual === "IDA" && b.horario_busca_hoje) hB = b.horario_busca_hoje;

    if (modoRotaAtual === "VOLTA" && a.horario_volta_hoje) hA = a.horario_volta_hoje;
    if (modoRotaAtual === "VOLTA" && b.horario_volta_hoje) hB = b.horario_volta_hoje;

    return hA.localeCompare(hB);
  });

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-2">
        <i class="fa-solid fa-van-shuttle text-2xl text-amber-400"></i>
        <p class="text-xs font-bold text-white">Nenhum passageiro nesta rota no momento.</p>
        <p class="text-[10px] text-slate-400">${modoRotaAtual === 'VOLTA' ? 'As crianças trazidas na ida aparecerão automaticamente aqui.' : 'Todos os alunos estão ausentes ou sem rota no momento.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtrados.map(aluno => {
    const st = aluno.status || 'Em Casa';
    const wsp = (aluno.whatsapp || '').replace(/\D/g, '');
    const temEspecial = aluno.tem_horario_especial;
    
    const horBuscaExibicao = (aluno.horario_busca_hoje) ? `${aluno.horario_busca_hoje} (Especial)` : (aluno.horario_busca || 'S/ hor.');
    const horVoltaExibicao = (aluno.horario_volta_hoje) ? `${aluno.horario_volta_hoje} (Especial)` : (aluno.horario_escola || '-');

    return `
      <div class="bg-slate-800/80 border ${temEspecial ? 'border-amber-400 bg-amber-500/10' : 'border-slate-700'} p-4 rounded-2xl space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 ${temEspecial ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-700 text-amber-400 font-bold'} text-xs rounded-lg">
                ${modoRotaAtual === 'IDA' ? horBuscaExibicao : horVoltaExibicao}
              </span>
              <h4 class="text-sm font-bold text-white">${aluno.nome}</h4>
            </div>
            
            ${temEspecial ? '<p class="text-[10px] font-bold text-amber-300 mt-1"><i class="fa-solid fa-clock-rotate-left"></i> ⚡ ATENÇÃO: Horário alterado para hoje!</p>' : ''}

            <p class="text-xs text-slate-400 mt-1">${aluno.escola || ''} (${aluno.turno || 'Manhã'})</p>
            <p class="text-[10px] text-slate-300 mt-0.5"><i class="fa-solid fa-location-dot text-amber-400"></i> ${aluno.endereco_casa || 'Endereço não informado'}</p>
          </div>
          
          <div class="flex items-center gap-1.5 shrink-0">
            <button onclick="abrirModalEditarAluno('${aluno.id}')" class="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg hover:bg-amber-500 hover:text-slate-950 transition-all">✏️</button>
            <button onclick="deletarAlunoAdmin('${aluno.id}')" class="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg hover:bg-rose-600 hover:text-white transition-all">🗑️</button>
            ${wsp ? `<a href="https://wa.me/55${wsp}" target="_blank" class="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg"><i class="fa-brands fa-whatsapp"></i> Whats</a>` : ''}
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <button onclick="atualizarStatusRafa('${aluno.id}', 'Em Casa')" class="py-2.5 rounded-xl text-xs font-bold transition-all ${st === 'Em Casa' ? 'bg-slate-600 text-white' : 'bg-slate-900/60 text-slate-400'}">🏡 Casa</button>
          <button onclick="atualizarStatusRafa('${aluno.id}', 'Na Van')" class="py-2.5 rounded-xl text-xs font-bold transition-all ${st === 'Na Van' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/60 text-slate-400'}">🚌 Na Van</button>
          <button onclick="atualizarStatusRafa('${aluno.id}', 'Na Escola')" class="py-2.5 rounded-xl text-xs font-bold transition-all ${st === 'Na Escola' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900/60 text-slate-400'}">🏫 Na Escola</button>
        </div>
      </div>
    `;
  }).join('');
}

async function atualizarStatusRafa(id, st) {
  if (!supabaseClient) return;

  let updateData = { status: st };
  if (st === 'Na Van' || st === 'Na Escola') {
    updateData.levado_hoje = true;
  }

  await supabaseClient.from('alunos').update(updateData).eq('id', id);
  carregarDadosRafa();
}

async function resetarStatusDoDia() {
  if (!supabaseClient) return;
  const res = confirm("Deseja resetar a chamada de todos os alunos para 'Em Casa' e restaurar a presença normal do dia?");
  if (!res) return;

  await supabaseClient.from('alunos').update({
    status: 'Em Casa',
    levado_hoje: false,
    vai_hoje: true,
    tem_horario_especial: false,
    horario_busca_hoje: "",
    horario_volta_hoje: ""
  }).neq('id', '0');

  alert("✓ Chamada do dia resetada com sucesso!");
  if (currentRole === 'rafa') carregarDadosRafa();
  if (currentRole === 'admin') carregarDadosAdmin();
}

function renderizarPassageirosGeralRafa() {
  const container = document.getElementById("lista-passageiros-geral-rafa");
  const countEl = document.getElementById("count-rafa-alunos");
  if (!container) return;

  const aprovados = alunosCache.filter(a => !a.pendente_aprovacao);
  if (countEl) countEl.innerText = `${aprovados.length} Alunos`;

  if (aprovados.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">Nenhum aluno cadastrado.</p>`;
    return;
  }

  container.innerHTML = aprovados.map(a => {
    const st = a.status || 'Em Casa';
    const stP = a.status_pagamento || 'Pendente';
    const vaiHoje = a.vai_hoje !== false;

    return `
      <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <h4 class="text-xs font-bold text-white">${a.nome}</h4>
              <span class="text-[9px] font-bold px-2 py-0.5 rounded-md ${vaiHoje ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
                ${vaiHoje ? '✓ Vai Hoje' : '✕ Ausente'}
              </span>
            </div>
            <p class="text-[10px] text-slate-400 mt-0.5">${a.escola || '-'} • ${a.turno || 'Manhã'} | PIN: <strong>${a.pin_pais || '1234'}</strong></p>
            <p class="text-[10px] text-amber-400 font-medium">📍 Busca Casa: ${a.horario_busca || '-'} | Entrada: ${a.horario_escola || '-'}</p>
            <p class="text-[10px] text-slate-400">Contato: ${a.whatsapp || 'S/ Whats'}</p>
          </div>
          <div class="flex gap-1 shrink-0">
            <button onclick="abrirModalEditarAluno('${a.id}')" class="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-lg hover:bg-amber-500 hover:text-slate-950 transition-all">✏️ Editar</button>
            <button onclick="deletarAlunoAdmin('${a.id}')" class="px-2 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold rounded-lg hover:bg-rose-600 hover:text-white transition-all">🗑️ Deletar</button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
          <div>
            <span class="text-[9px] font-bold text-slate-500 uppercase block mb-1">Status Rota</span>
            <select onchange="alterarStatusAdmin('${a.id}', 'status', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-[10px] text-white">
              <option value="Em Casa" ${st === 'Em Casa' ? 'selected' : ''}>🏡 Em Casa</option>
              <option value="Na Van" ${st === 'Na Van' ? 'selected' : ''}>🚌 Na Van</option>
              <option value="Na Escola" ${st === 'Na Escola' ? 'selected' : ''}>🏫 Na Escola</option>
            </select>
          </div>

          <div>
            <span class="text-[9px] font-bold text-slate-500 uppercase block mb-1">Status Financeiro</span>
            <select onchange="alterarStatusAdmin('${a.id}', 'status_pagamento', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-[10px] text-white">
              <option value="Pendente" ${stP === 'Pendente' ? 'selected' : ''}>🔴 Pendente</option>
              <option value="Pago" ${stP === 'Pago' ? 'selected' : ''}>🟢 Quitado</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function cadastrarAlunoRafa(e) {
  e.preventDefault();
  if (!supabaseClient) return;

  const emailMae = document.getElementById("add-email-mae-rafa")?.value.trim() || "";

  const novoAluno = {
    nome: document.getElementById("add-nome-rafa").value,
    turno: document.getElementById("add-turno-rafa").value,
    whatsapp: document.getElementById("add-wsp-rafa").value,
    horario_busca: document.getElementById("add-horario-busca-rafa").value,
    horario_escola: document.getElementById("add-horario-escola-rafa").value,
    endereco_casa: document.getElementById("add-endereco-casa-rafa").value,
    escola: document.getElementById("add-escola-rafa").value,
    email_mae: emailMae || `aluno_${Date.now()}@transporte.local`,
    pin_pais: document.getElementById("add-pin-rafa").value || "1234",
    valor: parseFloat(document.getElementById("add-valor-rafa").value),
    vencimento: parseInt(document.getElementById("add-vencimento-rafa").value),
    status: 'Em Casa',
    status_pagamento: 'Pendente',
    vai_hoje: true,
    levado_hoje: false,
    tem_horario_especial: false,
    horario_busca_hoje: "",
    horario_volta_hoje: "",
    pendente_aprovacao: false
  };

  await supabaseClient.from('alunos').insert([novoAluno]);
  alert("Aluno cadastrado com sucesso!");
  document.getElementById("form-cadastrar-aluno-rafa").reset();
  toggleFormCadastro('rafa');
  carregarDadosRafa();
}

function aplicarFiltroFin(status) {
  filtroFinStatus = status;
  document.getElementById("btn-fin-filtro-todos").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${status === 'Todos' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`;
  document.getElementById("btn-fin-filtro-pendentes").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${status === 'Pendente' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`;
  document.getElementById("btn-fin-filtro-pagos").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${status === 'Pago' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`;
  renderizarFinanceiroRafa();
}

function renderizarFinanceiroRafa() {
  const container = document.getElementById("lista-financeiro-rafa-cards");
  if (!container) return;

  let faturamentoTotal = 0;
  let recebido = 0;
  let pendente = 0;
  const diaHoje = new Date().getDate();

  const aprovados = alunosCache.filter(a => !a.pendente_aprovacao);

  aprovados.forEach(a => {
    const val = parseFloat(a.valor || 180);
    faturamentoTotal += val;
    if (a.status_pagamento === "Pago") recebido += val;
    else pendente += val;
  });

  const mTot = document.getElementById("metrica-faturamento-total");
  const mRec = document.getElementById("metrica-recebido");
  const mPen = document.getElementById("metrica-pendente");
  const progTexto = document.getElementById("progresso-percentual");
  const progBarra = document.getElementById("barra-progresso-financeiro");

  if (mTot) mTot.innerText = `R$ ${faturamentoTotal.toFixed(2)}`;
  if (mRec) mRec.innerText = `R$ ${recebido.toFixed(2)}`;
  if (mPen) mPen.innerText = `R$ ${pendente.toFixed(2)}`;

  const porc = faturamentoTotal > 0 ? Math.round((recebido / faturamentoTotal) * 100) : 0;
  if (progTexto) progTexto.innerText = `${porc}%`;
  if (progBarra) progBarra.style.width = `${porc}%`;

  let filtrados = aprovados;
  if (filtroFinStatus === "Pendente") filtrados = aprovados.filter(a => a.status_pagamento !== "Pago");
  if (filtroFinStatus === "Pago") filtrados = aprovados.filter(a => a.status_pagamento === "Pago");

  container.innerHTML = filtrados.map(aluno => {
    const stP = aluno.status_pagamento || 'Pendente';
    const val = parseFloat(aluno.valor || 180);
    const venc = parseInt(aluno.vencimento || 10);
    const emAtraso = stP !== "Pago" && diaHoje > venc;
    const wsp = (aluno.whatsapp || '').replace(/\D/g, '');

    const msgCobranca = encodeURIComponent(`Olá! Passando para lembrar sobre a mensalidade do transporte escolar do(a) *${aluno.nome}* no valor de R$ ${val.toFixed(2)}.\n\n🔑 Chave PIX: ${pixChaveGlobal}\n\nQualquer dúvida estou à disposição! 😊`);

    return `
      <div class="bg-slate-800/80 border ${emAtraso ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-700'} p-3.5 rounded-2xl space-y-2">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <p class="text-xs font-bold text-white">${aluno.nome}</p>
              ${emAtraso ? '<span class="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded">Em Atraso</span>' : ''}
            </div>
            <p class="text-[10px] text-slate-400 mt-0.5">Mensalidade: <strong>R$ ${val.toFixed(2)}</strong> | Vencimento: Dia ${venc}</p>
          </div>
          <span class="text-xs font-bold ${stP === 'Pago' ? 'text-emerald-400' : 'text-rose-400'}">${stP === 'Pago' ? '🟢 Quitado' : '🔴 Devendo'}</span>
        </div>

        <div class="flex items-center gap-2 pt-1 border-t border-slate-700/50">
          ${stP === 'Pago' ? `
            <button onclick="darBaixaRafa('${aluno.id}', 'Pendente', null)" class="w-full py-1.5 text-xs bg-slate-700 text-slate-300 font-bold rounded-lg">Desfazer Pagamento</button>
          ` : `
            <button onclick="darBaixaRafa('${aluno.id}', 'Pago', 'PIX')" class="flex-1 py-1.5 text-xs bg-teal-500 text-slate-950 font-bold rounded-lg">PIX</button>
            <button onclick="darBaixaRafa('${aluno.id}', 'Pago', 'Dinheiro')" class="flex-1 py-1.5 text-xs bg-amber-500 text-slate-950 font-bold rounded-lg">Dinheiro</button>
            <button onclick="darBaixaRafa('${aluno.id}', 'Pago', 'Cartão')" class="flex-1 py-1.5 text-xs bg-slate-600 text-white font-bold rounded-lg">Cartão</button>
            ${wsp ? `
              <a href="https://wa.me/55${wsp}?text=${msgCobranca}" target="_blank" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center shrink-0 shadow">
                <i class="fa-brands fa-whatsapp text-sm"></i>
              </a>
            ` : ''}
          `}
        </div>
      </div>
    `;
  }).join('');
}

async function darBaixaRafa(id, stP, forma) {
  if (!supabaseClient) return;
  await supabaseClient.from('alunos').update({ status_pagamento: stP, forma_pagamento: forma }).eq('id', id);
  carregarDadosRafa();
}

async function dispararEmergenciaRafa() {
  if (!supabaseClient) return;
  const motivo = prompt("Digite o motivo da emergência:", "Problema Mecânico / Saúde na Rota");
  if (!motivo) return;

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    await supabaseClient.from('alertas').insert([{
      tipo: 'EMERGENCIA_ADMIN',
      mensagem: `🚨 EMERGÊNCIA: ${motivo} | Pos: ${lat},${lng}`,
      ativo: true
    }]);

    alert("Alerta enviado para o Admin!");
  }, async () => {
    await supabaseClient.from('alertas').insert([{
      tipo: 'EMERGENCIA_ADMIN',
      mensagem: `🚨 EMERGÊNCIA: ${motivo}`,
      ativo: true
    }]);
  });
}

/* ==========================================================================
   9. MÓDULO PAINEL ADMIN / GESTÃO
   ========================================================================== */

async function carregarDadosAdmin(isBackground = false) {
  if (!supabaseClient) return;

  if (!isBackground) await carregarConfiguracoesGlobais();

  const { data } = await supabaseClient.from('alunos').select('*').order('nome', { ascending: true });
  const container = document.getElementById("lista-alunos-admin");
  const countEl = document.getElementById("count-admin-alunos");
  if (!container || !data) return;

  alunosCache = data;
  renderizarPendentesAprovacao();

  const aprovados = data.filter(a => !a.pendente_aprovacao);
  if (countEl) countEl.innerText = `${aprovados.length} Alunos`;

  container.innerHTML = aprovados.map(a => {
    const st = a.status || 'Em Casa';
    const stP = a.status_pagamento || 'Pendente';

    return `
      <div class="bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-2xl space-y-2.5">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="text-xs font-bold text-white">${a.nome}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">${a.escola || '-'} • ${a.turno || 'Manhã'} | PIN: <strong>${a.pin_pais || '1234'}</strong></p>
            <p class="text-[10px] text-amber-400 font-medium">📍 Busca Casa: ${a.horario_busca || '-'} | Entrada: ${a.horario_escola || '-'}</p>
          </div>
          <div class="flex gap-1 shrink-0">
            <button onclick="abrirModalEditarAluno('${a.id}')" class="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-lg hover:bg-amber-500 hover:text-slate-950 transition-all">✏️ Editar</button>
            <button onclick="deletarAlunoAdmin('${a.id}')" class="px-2 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold rounded-lg hover:bg-rose-600 hover:text-white transition-all">🗑️ Deletar</button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
          <div>
            <span class="text-[9px] font-bold text-slate-500 uppercase block mb-1">Status Rota</span>
            <select onchange="alterarStatusAdmin('${a.id}', 'status', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-[10px] text-white">
              <option value="Em Casa" ${st === 'Em Casa' ? 'selected' : ''}>🏡 Em Casa</option>
              <option value="Na Van" ${st === 'Na Van' ? 'selected' : ''}>🚌 Na Van</option>
              <option value="Na Escola" ${st === 'Na Escola' ? 'selected' : ''}>🏫 Na Escola</option>
            </select>
          </div>

          <div>
            <span class="text-[9px] font-bold text-slate-500 uppercase block mb-1">Status Financeiro</span>
            <select onchange="alterarStatusAdmin('${a.id}', 'status_pagamento', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-[10px] text-white">
              <option value="Pendente" ${stP === 'Pendente' ? 'selected' : ''}>🔴 Pendente</option>
              <option value="Pago" ${stP === 'Pago' ? 'selected' : ''}>🟢 Quitado</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (!isBackground) carregarGpsAdmin();
  renderizarFinanceiroAdmin();
}

function renderizarPendentesAprovacao() {
  const pendentes = alunosCache.filter(a => a.pendente_aprovacao === true);

  const containerRafa = document.getElementById("container-pendentes-rafa");
  const listaRafa = document.getElementById("lista-pendentes-rafa");
  const countRafa = document.getElementById("badge-pendentes-count-rafa");

  const containerAdmin = document.getElementById("container-pendentes-admin");
  const listaAdmin = document.getElementById("lista-pendentes-admin");
  const countAdmin = document.getElementById("badge-pendentes-count-admin");

  if (pendentes.length === 0) {
    containerRafa?.classList.add("hidden");
    containerAdmin?.classList.add("hidden");
    return;
  }

  if (countRafa) countRafa.innerText = pendentes.length;
  if (countAdmin) countAdmin.innerText = pendentes.length;

  const htmlContent = pendentes.map(a => `
    <div class="bg-slate-900 border border-amber-500/30 p-3.5 rounded-xl space-y-2.5">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="text-xs font-bold text-white">${a.nome}</h4>
          <p class="text-[10px] text-amber-300 font-semibold">${a.escola || '-'} • ${a.turno}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Contato: ${a.whatsapp || 'S/ Whats'}</p>
          <p class="text-[10px] text-slate-400">Endereço: ${a.endereco_casa || '-'}</p>
        </div>
      </div>

      <div class="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
        <div>
          <label class="text-[10px] text-amber-400 block font-bold">⏰ Horário que vai passar pra buscar:</label>
          <input type="text" id="hor-busca-aprov-${a.id}" placeholder="Ex: 06:40" class="w-full bg-slate-900 border border-amber-500/50 rounded p-1.5 text-xs text-white font-bold">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[9px] text-slate-400 block font-bold">Mensalidade (R$)</label>
            <input type="number" id="val-aprov-${a.id}" value="${a.valor || 180}" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white">
          </div>
          <div>
            <label class="text-[9px] text-slate-400 block font-bold">Vencimento (Dia)</label>
            <input type="number" id="venc-aprov-${a.id}" value="${a.vencimento || 10}" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white">
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <button onclick="aprovarCadastroAluno('${a.id}')" class="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all">
          ✓ Aprovar & Definir Horário
        </button>
        <button onclick="deletarAlunoAdmin('${a.id}')" class="px-3 py-2 bg-rose-500/20 text-rose-400 font-bold text-xs rounded-lg hover:bg-rose-600 hover:text-white transition-all">
          ✕ Recusar
        </button>
      </div>
    </div>
  `).join('');

  if (listaRafa) listaRafa.innerHTML = htmlContent;
  if (listaAdmin) listaAdmin.innerHTML = htmlContent;

  containerRafa?.classList.remove("hidden");
  containerAdmin?.classList.remove("hidden");
}

async function aprovarCadastroAluno(id) {
  if (!supabaseClient) return;

  const inputBusca = document.getElementById(`hor-busca-aprov-${id}`);
  const inputVal = document.getElementById(`val-aprov-${id}`);
  const inputVenc = document.getElementById(`venc-aprov-${id}`);

  const horarioBusca = inputBusca ? inputBusca.value.trim() : "";
  
  if (!horarioBusca) {
    alert("Por favor, preencha o horário de busca da van antes de aprovar!");
    if (inputBusca) inputBusca.focus();
    return;
  }

  const val = (inputVal && inputVal.value) ? parseFloat(inputVal.value) : 180;
  const venc = (inputVenc && inputVenc.value) ? parseInt(inputVenc.value) : 10;

  const { error } = await supabaseClient
    .from('alunos')
    .update({ 
      pendente_aprovacao: false,
      horario_busca: horarioBusca,
      valor: val,
      vencimento: venc
    })
    .eq('id', id);

  if (error) {
    alert("Erro ao aprovar: " + error.message);
    return;
  }

  alert("✓ Cadastro aprovado e horário definido!");
  if (currentRole === 'rafa') carregarDadosRafa();
  if (currentRole === 'admin') carregarDadosAdmin();
}

async function deletarAlunoAdmin(id) {
  if (!supabaseClient) return;

  const confirmou = confirm("Deseja realmente apagar este cadastro?");
  if (confirmou) {
    const { error } = await supabaseClient.from('alunos').delete().eq('id', id);

    if (error) {
      alert("Erro ao excluir: " + error.message);
      return;
    }

    alert("Cadastro removido!");
    alunosCache = alunosCache.filter(a => a.id != id);
    renderizarPendentesAprovacao();

    if (currentRole === 'rafa') carregarDadosRafa();
    if (currentRole === 'admin') carregarDadosAdmin();
  }
}

async function cadastrarAlunoAdmin(e) {
  e.preventDefault();
  if (!supabaseClient) return;

  const emailMae = document.getElementById("add-email-mae")?.value.trim() || "";

  const novoAluno = {
    nome: document.getElementById("add-nome").value,
    turno: document.getElementById("add-turno").value,
    whatsapp: document.getElementById("add-wsp").value,
    horario_busca: document.getElementById("add-horario-busca").value,
    horario_escola: document.getElementById("add-horario-escola").value,
    endereco_casa: document.getElementById("add-endereco-casa").value,
    escola: document.getElementById("add-escola").value,
    email_mae: emailMae || `aluno_${Date.now()}@transporte.local`,
    pin_pais: document.getElementById("add-pin").value || "1234",
    valor: parseFloat(document.getElementById("add-valor").value),
    vencimento: parseInt(document.getElementById("add-vencimento").value),
    status: 'Em Casa',
    status_pagamento: 'Pendente',
    vai_hoje: true,
    levado_hoje: false,
    tem_horario_especial: false,
    horario_busca_hoje: "",
    horario_volta_hoje: "",
    pendente_aprovacao: false
  };

  await supabaseClient.from('alunos').insert([novoAluno]);
  alert("Aluno cadastrado com sucesso!");
  document.getElementById("form-cadastrar-aluno").reset();
  toggleFormCadastro('admin');
  carregarDadosAdmin();
}

async function alterarStatusAdmin(id, campo, valor) {
  if (!supabaseClient) return;
  let updateObj = {};
  updateObj[campo] = valor;
  await supabaseClient.from('alunos').update(updateObj).eq('id', id);
  
  if (currentRole === 'rafa') carregarDadosRafa();
  if (currentRole === 'admin') carregarDadosAdmin();
}

function abrirModalEditarAluno(id) {
  const aluno = alunosCache.find(a => a.id == id);
  if (!aluno) return;

  document.getElementById("edit-id").value = aluno.id;
  document.getElementById("edit-nome").value = aluno.nome || '';
  document.getElementById("edit-turno").value = aluno.turno || 'Manhã (07h às 11h)';
  document.getElementById("edit-wsp").value = aluno.whatsapp || '';
  document.getElementById("edit-horario-busca").value = aluno.horario_busca || '';
  document.getElementById("edit-horario-escola").value = aluno.horario_escola || '';
  document.getElementById("edit-endereco-casa").value = aluno.endereco_casa || '';
  document.getElementById("edit-escola").value = aluno.escola || '';
  document.getElementById("edit-email-mae").value = (aluno.email_mae && !aluno.email_mae.includes('@transporte.local')) ? aluno.email_mae : '';
  document.getElementById("edit-pin").value = aluno.pin_pais || '1234';
  document.getElementById("edit-valor").value = aluno.valor || 180;
  document.getElementById("edit-vencimento").value = aluno.vencimento || 10;

  document.getElementById("modal-editar-aluno")?.classList.remove("hidden");
}

async function salvarEdicaoAluno(e) {
  e.preventDefault();
  if (!supabaseClient) return;

  const id = document.getElementById("edit-id").value;
  const emailMae = document.getElementById("edit-email-mae")?.value.trim() || "";

  const updateData = {
    nome: document.getElementById("edit-nome").value,
    turno: document.getElementById("edit-turno").value,
    whatsapp: document.getElementById("edit-wsp").value,
    horario_busca: document.getElementById("edit-horario-busca").value,
    horario_escola: document.getElementById("edit-horario-escola").value,
    endereco_casa: document.getElementById("edit-endereco-casa").value,
    escola: document.getElementById("edit-escola").value,
    email_mae: emailMae || `aluno_${Date.now()}@transporte.local`,
    pin_pais: document.getElementById("edit-pin").value,
    valor: parseFloat(document.getElementById("edit-valor").value),
    vencimento: parseInt(document.getElementById("edit-vencimento").value)
  };

  const { error } = await supabaseClient.from('alunos').update(updateData).eq('id', id);

  if (error) {
    alert("Erro ao salvar alterações: " + error.message);
    return;
  }

  alert("✓ Cadastro atualizado com sucesso!");
  document.getElementById("modal-editar-aluno")?.classList.add("hidden");

  if (currentRole === 'rafa') carregarDadosRafa();
  if (currentRole === 'admin') carregarDadosAdmin();
}

function aplicarFiltroFinAdmin(status) {
  filtroFinAdminStatus = status;
  document.getElementById("btn-admin-fin-todos").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${status === 'Todos' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`;
  document.getElementById("btn-admin-fin-pendentes").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${status === 'Pendente' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`;
  document.getElementById("btn-admin-fin-pagos").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${status === 'Pago' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`;
  renderizarFinanceiroAdmin();
}

function renderizarFinanceiroAdmin() {
  const container = document.getElementById("lista-financeiro-admin-cards");
  if (!container) return;

  let faturamentoTotal = 0;
  let recebido = 0;
  let pendente = 0;
  const diaHoje = new Date().getDate();

  const aprovados = alunosCache.filter(a => !a.pendente_aprovacao);

  aprovados.forEach(a => {
    const val = parseFloat(a.valor || 180);
    faturamentoTotal += val;
    if (a.status_pagamento === "Pago") recebido += val;
    else pendente += val;
  });

  const mTot = document.getElementById("admin-metrica-total");
  const mRec = document.getElementById("admin-metrica-recebido");
  const mPen = document.getElementById("admin-metrica-pendente");
  const progTexto = document.getElementById("admin-progresso-percentual");
  const progBarra = document.getElementById("admin-barra-progresso");

  if (mTot) mTot.innerText = `R$ ${faturamentoTotal.toFixed(2)}`;
  if (mRec) mRec.innerText = `R$ ${recebido.toFixed(2)}`;
  if (mPen) mPen.innerText = `R$ ${pendente.toFixed(2)}`;

  const porc = faturamentoTotal > 0 ? Math.round((recebido / faturamentoTotal) * 100) : 0;
  if (progTexto) progTexto.innerText = `${porc}%`;
  if (progBarra) progBarra.style.width = `${porc}%`;

  let filtrados = aprovados;
  if (filtroFinAdminStatus === "Pendente") filtrados = aprovados.filter(a => a.status_pagamento !== "Pago");
  if (filtroFinAdminStatus === "Pago") filtrados = aprovados.filter(a => a.status_pagamento === "Pago");

  container.innerHTML = filtrados.map(aluno => {
    const stP = aluno.status_pagamento || 'Pendente';
    const val = parseFloat(aluno.valor || 180);
    const venc = parseInt(aluno.vencimento || 10);
    const emAtraso = stP !== "Pago" && diaHoje > venc;
    const wsp = (aluno.whatsapp || '').replace(/\D/g, '');

    const msgCobranca = encodeURIComponent(`Olá! Passando para lembrar sobre a mensalidade do transporte escolar do(a) *${aluno.nome}* no valor de R$ ${val.toFixed(2)}.\n\n🔑 Chave PIX: ${pixChaveGlobal}\n\nQualquer dúvida estou à disposição! 😊`);

    return `
      <div class="bg-slate-900/80 border ${emAtraso ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-700/80'} p-3.5 rounded-2xl space-y-2">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <p class="text-xs font-bold text-white">${aluno.nome}</p>
              ${emAtraso ? '<span class="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded">Em Atraso</span>' : ''}
            </div>
            <p class="text-[10px] text-slate-400 mt-0.5">Mensalidade: <strong>R$ ${val.toFixed(2)}</strong> | Vencimento: Dia ${venc}</p>
          </div>
          <span class="text-xs font-bold ${stP === 'Pago' ? 'text-emerald-400' : 'text-rose-400'}">${stP === 'Pago' ? '🟢 Quitado' : '🔴 Devendo'}</span>
        </div>

        <div class="flex items-center gap-2 pt-1 border-t border-slate-800">
          ${stP === 'Pago' ? `
            <button onclick="darBaixaAdmin('${aluno.id}', 'Pendente', null)" class="w-full py-1.5 text-xs bg-slate-700 text-slate-300 font-bold rounded-lg">Desfazer Pagamento</button>
          ` : `
            <button onclick="darBaixaAdmin('${aluno.id}', 'Pago', 'PIX')" class="flex-1 py-1.5 text-xs bg-teal-500 text-slate-950 font-bold rounded-lg">PIX</button>
            <button onclick="darBaixaAdmin('${aluno.id}', 'Pago', 'Dinheiro')" class="flex-1 py-1.5 text-xs bg-amber-500 text-slate-950 font-bold rounded-lg">Dinheiro</button>
            <button onclick="darBaixaAdmin('${aluno.id}', 'Pago', 'Cartão')" class="flex-1 py-1.5 text-xs bg-slate-600 text-white font-bold rounded-lg">Cartão</button>
            ${wsp ? `
              <a href="https://wa.me/55${wsp}?text=${msgCobranca}" target="_blank" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center shrink-0 shadow">
                <i class="fa-brands fa-whatsapp text-sm"></i>
              </a>
            ` : ''}
          `}
        </div>
      </div>
    `;
  }).join('');
}

async function darBaixaAdmin(id, stP, forma) {
  if (!supabaseClient) return;
  await supabaseClient.from('alunos').update({ status_pagamento: stP, forma_pagamento: forma }).eq('id', id);
  carregarDadosAdmin();
}

async function encerrarMesFinanceiro() {
  if (!supabaseClient) return;
  const confirmou = confirm("Deseja fechar o mês atual e resetar os pagamentos para 'Pendente'?");
  if (confirmou) {
    const mesAno = new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
    
    for (let a of alunosCache) {
      await supabaseClient.from('historico_financeiro').insert([{
        aluno_id: a.id,
        mes_ano: mesAno,
        valor: a.valor || 180,
        status_pagamento: a.status_pagamento || 'Pendente'
      }]);

      await supabaseClient.from('alunos').update({
        status_pagamento: 'Pendente',
        forma_pagamento: null,
        tem_horario_especial: false,
        horario_busca_hoje: "",
        horario_volta_hoje: "",
        levado_hoje: false,
        vai_hoje: true
      }).eq('id', a.id);
    }

    alert("Mês encerrado com sucesso!");
    if (currentRole === 'rafa') carregarDadosRafa();
    if (currentRole === 'admin') carregarDadosAdmin();
  }
}

function exportarRelatorioFinanceiroCSV() {
  const aprovados = alunosCache.filter(a => !a.pendente_aprovacao);
  if (!aprovados || aprovados.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  let csvContent = "\uFEFF";
  csvContent += "Nome do Passageiro;Escola;Turno;Horario Busca;Horario Entrada;Valor Mensalidade;Dia Vencimento;Status Pagamento;Forma Pagamento;Email Responsavel;WhatsApp;PIN Pais\n";

  aprovados.forEach(a => {
    const nome = (a.nome || "-").replace(/;/g, ",");
    const escola = (a.escola || "-").replace(/;/g, ",");
    const turno = a.turno || "Manhã";
    const hBusca = a.horario_busca || "-";
    const hEscola = a.horario_escola || "-";
    const valor = parseFloat(a.valor || 180).toFixed(2);
    const vencimento = a.vencimento || 10;
    const statusPag = a.status_pagamento || "Pendente";
    const formaPag = a.forma_pagamento || "-";
    const email = a.email_mae || "-";
    const whats = a.whatsapp || "-";
    const pin = a.pin_pais || "1234";

    csvContent += `${nome};${escola};${turno};${hBusca};${hEscola};R$ ${valor};Dia ${vencimento};${statusPag};${formaPag};${email};${whats};${pin}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const dataHoje = new Date().toISOString().slice(0, 10);
  const fileName = `Backup_Financeiro_TiaRafa_${dataHoje}.csv`;

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function tocarSomSirene() {
  if (audioContext) return;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioOscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    audioOscillator.type = 'sawtooth';
    audioOscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    audioOscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);

    audioOscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    audioOscillator.start();
  } catch (e) {}
}

function pararSomSirene() {
  if (audioOscillator) {
    audioOscillator.stop();
    audioOscillator.disconnect();
    audioOscillator = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

async function verificarEmergenciaAdmin() {
  if (!supabaseClient || currentRole !== "admin") {
    pararSomSirene();
    return;
  }

  const { data } = await supabaseClient
    .from('alertas')
    .select('*')
    .eq('tipo', 'EMERGENCIA_ADMIN')
    .eq('ativo', true)
    .order('id', { ascending: false })
    .limit(1);

  const modal = document.getElementById("modal-emergencia-admin");
  const detalhes = document.getElementById("detalhes-emergencia-admin");
  const btnMaps = document.getElementById("btn-rota-maps-emergencia");

  if (data && data.length > 0) {
    if (detalhes) detalhes.innerText = data[0].mensagem;
    if (data[0].mensagem.includes("Pos:")) {
      const posPart = data[0].mensagem.split("Pos:")[1].trim();
      if (btnMaps) btnMaps.href = `https://www.google.com/maps/search/?api=1&query=${posPart}`;
    }
    modal?.classList.remove("hidden");
    tocarSomSirene();
  } else {
    modal?.classList.add("hidden");
    pararSomSirene();
  }
}

async function atenderEmergenciaAdmin() {
  if (!supabaseClient) return;
  await supabaseClient.from('alertas').update({ ativo: false }).eq('tipo', 'EMERGENCIA_ADMIN');
  pararSomSirene();
  document.getElementById("modal-emergencia-admin")?.classList.add("hidden");
}
