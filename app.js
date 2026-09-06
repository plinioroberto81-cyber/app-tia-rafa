// CONEXAO SUPABASE
const SUPABASE_URL = "https://sxrexcmtanpwljimfqpk.supabase.co";
const SUPABASE_KEY = "sb_publishable_NM0fvyA5X1zlFVy39gvrYA_pyTXBisb";

let supabaseClient = null;
if (window.supabase && window.supabase.createClient) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

let passRafa = "rafa123";
let passAdmin = "admin123";
let pixChaveGlobal = "11999998888";
let linkCartaoGlobal = "https://mpago.la/";
let currentRole = null;
let alunosCache = [];

// ELEMENTOS GLOBAIS
let loginSection, authForm, authTitle, inputPassword, mainButtons, bottomBar;

document.addEventListener("DOMContentLoaded", () => {
  loginSection = document.getElementById("login-section");
  authForm = document.getElementById("auth-form");
  authTitle = document.getElementById("auth-title");
  inputPassword = document.getElementById("input-password");
  mainButtons = document.getElementById("main-buttons");
  bottomBar = document.getElementById("bottom-bar");

  inicializarTema();
  verificarAlertaGlobal();

  // EVENTOS DE BOTÕES DE TEMA E NAVEGAÇÃO
  document.getElementById("btn-theme-toggle")?.addEventListener("click", alternarTema);
  document.getElementById("btn-pais")?.addEventListener("click", () => entrarPerfil("pais"));
  document.getElementById("btn-rafa")?.addEventListener("click", () => mostrarFormLogin("rafa"));
  document.getElementById("btn-admin")?.addEventListener("click", () => mostrarFormLogin("admin"));
  document.getElementById("btn-back")?.addEventListener("click", resetLogin);
  document.getElementById("nav-btn-logout")?.addEventListener("click", logout);

  // LOGIN SUBMIT
  document.getElementById("btn-login-submit")?.addEventListener("click", () => {
    const pwd = inputPassword ? inputPassword.value : "";
    if (currentRole === "rafa" && pwd === passRafa) entrarPerfil("rafa");
    else if (currentRole === "admin" && pwd === passAdmin) entrarPerfil("admin");
    else alert("Senha incorreta!");
  });

  // ABAS TIA RAFA
  document.getElementById("tab-btn-chamada")?.addEventListener("click", () => {
    document.getElementById("aba-chamada-rafa")?.classList.remove("hidden");
    document.getElementById("aba-financeiro-rafa")?.classList.add("hidden");
    document.getElementById("tab-btn-chamada").className = "flex-1 py-2 text-xs font-bold text-amber-400 border-b-2 border-amber-400";
    document.getElementById("tab-btn-financeiro").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
  });

  document.getElementById("tab-btn-financeiro")?.addEventListener("click", () => {
    document.getElementById("aba-chamada-rafa")?.classList.add("hidden");
    document.getElementById("aba-financeiro-rafa")?.classList.remove("hidden");
    document.getElementById("tab-btn-financeiro").className = "flex-1 py-2 text-xs font-bold text-amber-400 border-b-2 border-amber-400";
    document.getElementById("tab-btn-chamada").className = "flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent";
  });

  // AVISOS TIA RAFA
  document.getElementById("btn-aviso-10min")?.addEventListener("click", () => dispararAviso("⏱️ Pequeno atraso na rota (Aproximadamente 10 minutos). Crianças em segurança!"));
  document.getElementById("btn-aviso-transito")?.addEventListener("click", () => dispararAviso("🚗 Trânsito intenso na via. Estamos avançando devagar e em segurança."));
  document.getElementById("btn-aviso-chuva")?.addEventListener("click", () => dispararAviso("🌧️ Chuva forte na região. Velocidade reduzida por segurança."));
  document.getElementById("btn-enviar-aviso-custom")?.addEventListener("click", () => {
    const txt = document.getElementById("input-aviso-custom")?.value;
    if (txt) {
      dispararAviso(`📢 ${txt}`);
      document.getElementById("input-aviso-custom").value = "";
    }
  });
  document.getElementById("btn-limpar-aviso")?.addEventListener("click", limparAvisos);

  // SELEÇÃO PAIS
  document.getElementById("select-email-pais")?.addEventListener("change", (e) => renderizarPaisFilho(e.target.value));

  // CADASTRO ADMIN
  document.getElementById("form-cadastrar-aluno")?.addEventListener("submit", cadastrarAlunoAdmin);
});

// LOGICA DE TEMA
function inicializarTema() {
  const temaSalvo = localStorage.getItem("theme");
  const themeIcon = document.getElementById("theme-icon");
  if (temaSalvo === "light") {
    document.documentElement.classList.add("light-mode");
    if (themeIcon) themeIcon.className = "fa-solid fa-moon";
  } else {
    document.documentElement.classList.remove("light-mode");
    if (themeIcon) themeIcon.className = "fa-solid fa-sun";
  }
}

function alternarTema() {
  const htmlEl = document.documentElement;
  const themeIcon = document.getElementById("theme-icon");
  if (htmlEl.classList.contains("light-mode")) {
    htmlEl.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
    if (themeIcon) themeIcon.className = "fa-solid fa-sun";
  } else {
    htmlEl.classList.add("light-mode");
    localStorage.setItem("theme", "light");
    if (themeIcon) themeIcon.className = "fa-solid fa-moon";
  }
}

function mostrarFormLogin(role) {
  currentRole = role;
  if (authTitle) authTitle.innerText = role === "rafa" ? "Senha Tia Rafa" : "Senha Admin";
  if (authForm) authForm.classList.remove("hidden");
  if (mainButtons) mainButtons.classList.add("hidden");
}

function resetLogin() {
  if (authForm) authForm.classList.add("hidden");
  if (mainButtons) mainButtons.classList.remove("hidden");
  if (inputPassword) inputPassword.value = "";
}

function logout() {
  document.getElementById("dashboard-pais")?.classList.add("hidden");
  document.getElementById("dashboard-rafa")?.classList.add("hidden");
  document.getElementById("dashboard-admin")?.classList.add("hidden");
  if (bottomBar) bottomBar.classList.add("hidden");
  if (loginSection) loginSection.classList.remove("hidden");
  resetLogin();
}

function entrarPerfil(role) {
  if (loginSection) loginSection.classList.add("hidden");
  if (bottomBar) bottomBar.classList.remove("hidden");

  if (role === "pais") {
    document.getElementById("dashboard-pais")?.classList.remove("hidden");
    carregarDadosPais();
  } else if (role === "rafa") {
    document.getElementById("dashboard-rafa")?.classList.remove("hidden");
    carregarDadosRafa();
  } else if (role === "admin") {
    document.getElementById("dashboard-admin")?.classList.remove("hidden");
    carregarDadosAdmin();
  }
}

// ==================== ALERTAS GLOBAIS ====================
async function verificarAlertaGlobal() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.from('alertas').select('*').eq('ativo', true).order('id', { ascending: false }).limit(1);
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
  await supabaseClient.from('alertas').update({ ativo: false }).eq('ativo', true);
  await supabaseClient.from('alertas').insert([{ tipo: 'Aviso', mensagem: msg, ativo: true }]);
  alert("Aviso publicado na tela dos pais!");
  verificarAlertaGlobal();
}

async function limparAvisos() {
  if (!supabaseClient) return;
  await supabaseClient.from('alertas').update({ ativo: false }).eq('ativo', true);
  alert("Avisos encerrados!");
  verificarAlertaGlobal();
}

// ==================== ESPAÇO DOS PAIS ====================
async function carregarDadosPais() {
  if (!supabaseClient) return;
  const select = document.getElementById("select-email-pais");
  
  const { data } = await supabaseClient.from('alunos').select('*');
  if (!data) return;
  alunosCache = data;

  const emailsUnicos = [...new Set(data.map(a => a.email_mae).filter(Boolean))];
  
  if (select) {
    select.innerHTML = '<option value="">-- Selecione seu E-mail --</option>' + 
      emailsUnicos.map(e => `<option value="${e}">${e}</option>`).join('');
  }
}

function renderizarPaisFilho(email) {
  const container = document.getElementById("conteudo-filho-pais");
  if (!email || !container) {
    container?.classList.add("hidden");
    return;
  }

  const filho = alunosCache.find(a => a.email_mae === email);
  if (!filho) return;

  const st = filho.status || 'Em Casa';
  let badgeColor = 'bg-slate-700/50 text-slate-300 border-slate-600';
  let icon = 'fa-house-user';
  let desc = 'Aguardando embarque residencial.';

  if (st === 'Na Van' || st === 'Embarcou') { 
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30'; 
    icon = 'fa-van-shuttle'; 
    desc = 'A caminho no transporte com a Tia Rafa!';
  }
  if (st === 'Na Escola' || st === 'Desembarcou') { 
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'; 
    icon = 'fa-school'; 
    desc = 'Entregue com segurança no destino.';
  }

  const stPag = filho.status_pagamento || 'Pendente';
  const val = filho.valor || 180.00;
  const venc = filho.vencimento || 10;

  container.innerHTML = `
    <!-- STATUS VIAGEM -->
    <div class="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl space-y-4">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-base font-extrabold text-white">${filho.nome}</h3>
          <p class="text-xs text-slate-400 mt-0.5"><i class="fa-solid fa-graduation-cap"></i> ${filho.escola || '-'}</p>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-bold border ${badgeColor} flex items-center gap-1.5">
          <i class="fa-solid ${icon}"></i> ${st}
        </span>
      </div>

      <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-xs text-slate-300">
        ${desc}
      </div>

      <!-- PRESENÇA HOJE -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-700/60">
        <span class="text-xs font-bold text-slate-300">Vai no transporte hoje?</span>
        <button onclick="alternarPresenca('${filho.id}', ${!filho.vai_hoje})" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filho.vai_hoje !== false ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
          ${filho.vai_hoje !== false ? '✓ Confirmado' : '✕ Ausente Hoje'}
        </button>
      </div>
    </div>

    <!-- MENSALIDADE & PAGAMENTO -->
    <div class="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl space-y-4">
      <div class="flex justify-between items-center">
        <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider">Mensalidade Escolar</h4>
        <span class="text-xs font-bold ${stPag === 'Pago' ? 'text-emerald-400' : 'text-rose-400'}">${stPag === 'Pago' ? '🟢 Pago' : '🔴 Pendente'}</span>
      </div>

      <div class="flex justify-between items-baseline">
        <p class="text-2xl font-extrabold text-white">R$ ${val.toFixed(2)}</p>
        <p class="text-xs text-slate-400">Vencimento: Dia ${venc}</p>
      </div>

      ${stPag !== 'Pago' ? `
        <div class="space-y-3 pt-2">
          <!-- PIX -->
          <div class="p-3 bg-teal-950/40 border border-teal-500/30 rounded-xl space-y-1.5">
            <p class="text-xs font-bold text-teal-300"><i class="fa-brands fa-pix"></i> Pagamento via PIX</p>
            <p class="text-xs font-mono bg-slate-900 p-2 rounded border border-slate-700 text-teal-200 select-all">${pixChaveGlobal}</p>
          </div>

          <!-- DINHEIRO EM MÃOS -->
          <div class="p-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-xs text-slate-400">
            <i class="fa-solid fa-money-bill-wave text-amber-400"></i> <strong>Dinheiro:</strong> Entregar diretamente para a Tia Rafa no embarque.
          </div>

          <!-- CARTÃO DE CRÉDITO/DÉBITO -->
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

  container.classList.remove("hidden");
}

async function alternarPresenca(id, novoStatus) {
  if (!supabaseClient) return;
  await supabaseClient.from('alunos').update({ vai_hoje: novoStatus }).eq('id', id);
  carregarDadosPais();
}

// ==================== PAINEL TIA RAFA ====================
async function carregarDadosRafa() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.from('alunos').select('*');
  if (!data) return;

  // ROTA & CHAMADA
  const containerChamada = document.getElementById("aba-chamada-rafa");
  if (containerChamada) {
    containerChamada.innerHTML = data.map(aluno => {
      const st = aluno.status || 'Em Casa';
      return `
        <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-3">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="text-sm font-bold text-white">${aluno.nome}</h4>
              <p class="text-xs text-slate-400">${aluno.escola || ''} • Turno: ${aluno.turno || 'Manhã'}</p>
            </div>
            ${aluno.vai_hoje === false ? '<span class="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30">Não Vai Hoje</span>' : ''}
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="atualizarStatusRafa('${aluno.id}', 'Em Casa')" class="py-2.5 rounded-xl text-xs font-bold transition-all ${st === 'Em Casa' ? 'bg-slate-600 text-white' : 'bg-slate-900/60 text-slate-400'}">🏡 Casa</button>
            <button onclick="atualizarStatusRafa('${aluno.id}', 'Na Van')" class="py-2.5 rounded-xl text-xs font-bold transition-all ${st === 'Na Van' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/60 text-slate-400'}">🚌 Van</button>
            <button onclick="atualizarStatusRafa('${aluno.id}', 'Na Escola')" class="py-2.5 rounded-xl text-xs font-bold transition-all ${st === 'Na Escola' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900/60 text-slate-400'}">🏫 Escola</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // FINANCEIRO RAFA
  const containerFin = document.getElementById("aba-financeiro-rafa");
  if (containerFin) {
    containerFin.innerHTML = data.map(aluno => {
      const stP = aluno.status_pagamento || 'Pendente';
      return `
        <div class="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-white">${aluno.nome}</p>
            <p class="text-[10px] text-slate-400">R$ ${(aluno.valor || 180).toFixed(2)} | Venc: Dia ${aluno.vencimento || 10}</p>
          </div>
          <div class="flex items-center gap-1">
            ${stP === 'Pago' ? `
              <span class="text-xs font-bold text-emerald-400 mr-1">✓ Pago</span>
              <button onclick="darBaixaRafa('${aluno.id}', 'Pendente')" class="text-[10px] bg-slate-700 text-slate-300 p-1.5 rounded">Desfazer</button>
            ` : `
              <button onclick="darBaixaRafa('${aluno.id}', 'Pago')" class="text-xs bg-emerald-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg">Dar Baixa</button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }
}

async function atualizarStatusRafa(id, st) {
  if (!supabaseClient) return;
  await supabaseClient.from('alunos').update({ status: st }).eq('id', id);
  carregarDadosRafa();
}

async function darBaixaRafa(id, stP) {
  if (!supabaseClient) return;
  await supabaseClient.from('alunos').update({ status_pagamento: stP }).eq('id', id);
  carregarDadosRafa();
}

// ==================== PAINEL ADMIN ====================
async function carregarDadosAdmin() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.from('alunos').select('*');
  const container = document.getElementById("lista-alunos-admin");
  if (!container || !data) return;

  container.innerHTML = data.map(a => `
    <div class="bg-slate-900/60 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between">
      <div>
        <p class="text-xs font-bold text-white">${a.nome} (${a.turno || 'Manhã'})</p>
        <p class="text-[10px] text-slate-400">Escola: ${a.escola || '-'} | E-mail: ${a.email_mae || '-'}</p>
      </div>
      <button onclick="deletarAlunoAdmin('${a.id}')" class="text-rose-400 text-xs p-2">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

async function cadastrarAlunoAdmin(e) {
  e.preventDefault();
  if (!supabaseClient) return;

  const novoAluno = {
    nome: document.getElementById("add-nome").value,
    turno: document.getElementById("add-turno").value,
    whatsapp: document.getElementById("add-wsp").value,
    horario_busca: document.getElementById("add-horario-busca").value,
    horario_escola: document.getElementById("add-horario-escola").value,
    endereco_casa: document.getElementById("add-endereco-casa").value,
    escola: document.getElementById("add-escola").value,
    endereco_escola: document.getElementById("add-endereco-escola").value,
    email_mae: document.getElementById("add-email-mae").value,
    valor: parseFloat(document.getElementById("add-valor").value),
    vencimento: parseInt(document.getElementById("add-vencimento").value),
    status: 'Em Casa',
    status_pagamento: 'Pendente',
    vai_hoje: true
  };

  await supabaseClient.from('alunos').insert([novoAluno]);
  alert("Aluno cadastrado com sucesso!");
  document.getElementById("form-cadastrar-aluno").reset();
  carregarDadosAdmin();
}

async function deletarAlunoAdmin(id) {
  if (!supabaseClient) return;
  if (confirm("Deseja apagar este aluno do banco de dados?")) {
    await supabaseClient.from('alunos').delete().eq('id', id);
    carregarDadosAdmin();
  }
}
