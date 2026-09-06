// CONEXAO SUPABASE
const SUPABASE_URL = "https://sxrexcmtanpwljimfqpk.supabase.co";
const SUPABASE_KEY = "sb_publishable_NM0fvyA5X1zlFVy39gvrYA_pyTXBisb";

let supabaseClient = null;
if (window.supabase && window.supabase.createClient) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

let passRafa = "rafa123";
let passAdmin = "admin123";
let pixChave = "11999998888";
let currentRole = null;

// ELEMENTOS GLOBAIS
let loginSection, authForm, authTitle, inputPassword, mainButtons, bottomBar, statusLive;

// INICIALIZACAO DOS EVENTOS APOS CARREGAMENTO DO HTML
document.addEventListener("DOMContentLoaded", () => {
  loginSection = document.getElementById("login-section");
  authForm = document.getElementById("auth-form");
  authTitle = document.getElementById("auth-title");
  inputPassword = document.getElementById("input-password");
  mainButtons = document.getElementById("main-buttons");
  bottomBar = document.getElementById("bottom-bar");
  statusLive = document.getElementById("status-live");

  // APLICAR TEMA SALVO
  inicializarTema();

  // EVENTO DO BOTÃO DE TEMA
  document.getElementById("btn-theme-toggle")?.addEventListener("click", alternarTema);

  // EVENTOS DE NAVEGACAO
  document.getElementById("btn-pais")?.addEventListener("click", () => entrarPerfil("pais"));
  document.getElementById("btn-rafa")?.addEventListener("click", () => mostrarFormLogin("rafa"));
  document.getElementById("btn-admin")?.addEventListener("click", () => mostrarFormLogin("admin"));
  document.getElementById("btn-back")?.addEventListener("click", resetLogin);
  document.getElementById("nav-btn-logout")?.addEventListener("click", logout);

  document.getElementById("btn-login-submit")?.addEventListener("click", () => {
    const pwd = inputPassword ? inputPassword.value : "";
    if (currentRole === "rafa" && pwd === passRafa) entrarPerfil("rafa");
    else if (currentRole === "admin" && pwd === passAdmin) entrarPerfil("admin");
    else alert("Senha incorreta!");
  });

  document.getElementById("form-cadastrar-aluno")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!supabaseClient) {
      alert("Erro de conexão com o banco de dados.");
      return;
    }

    await supabaseClient.from('alunos').insert([{
      nome: document.getElementById("add-nome").value,
      escola: document.getElementById("add-escola").value,
      responsavel: document.getElementById("add-responsavel").value,
      telefone: document.getElementById("add-telefone").value,
      status: 'Em Casa'
    }]);

    alert("Aluno cadastrado com sucesso!");
    document.getElementById("form-cadastrar-aluno").reset();
    carregarDadosAdmin();
  });
});

// LOGICA DE TEMA CLARO / ESCURO
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
  if (statusLive) statusLive.classList.add("hidden");
  if (loginSection) loginSection.classList.remove("hidden");
  resetLogin();
}

function entrarPerfil(role) {
  if (loginSection) loginSection.classList.add("hidden");
  if (bottomBar) bottomBar.classList.remove("hidden");
  if (statusLive) statusLive.classList.remove("hidden");

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

// RENDERIZACAO PAIS
async function carregarDadosPais() {
  const container = document.getElementById("lista-alunos-pais");
  const pixDisplay = document.getElementById("pix-key-display");
  if (pixDisplay) pixDisplay.innerText = pixChave;
  if (!container) return;

  if (!supabaseClient) {
    container.innerHTML = `<p class="text-center text-xs text-rose-400 py-4">Erro de conexão com o Supabase.</p>`;
    return;
  }

  const { data, error } = await supabaseClient.from('alunos').select('*');
  if (error || !data || data.length === 0) {
    container.innerHTML = `<p class="text-center text-xs text-slate-500 py-4">Nenhum aluno cadastrado.</p>`;
    return;
  }

  container.innerHTML = data.map(aluno => {
    const st = aluno.status || 'Em Casa';
    let color = 'bg-slate-700/50 text-slate-300 border-slate-600';
    let icon = 'fa-house-user';
    
    if (st === 'Na Van') { color = 'bg-amber-500/10 text-amber-400 border-amber-500/30'; icon = 'fa-van-shuttle'; }
    if (st === 'Na Escola') { color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'; icon = 'fa-school'; }

    const inicial = aluno.nome ? aluno.nome.charAt(0).toUpperCase() : 'A';

    return `
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between shadow-lg animate-slide-up">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-extrabold text-base flex items-center justify-center">
            ${inicial}
          </div>
          <div>
            <h4 class="text-sm font-bold text-white">${aluno.nome}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5"><i class="fa-solid fa-graduation-cap text-slate-500"></i> ${aluno.escola || 'Não informada'}</p>
          </div>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-bold border ${color} flex items-center gap-1.5">
          <i class="fa-solid ${icon} text-[10px]"></i> ${st}
        </span>
      </div>
    `;
  }).join('');
}

// RENDERIZACAO RAFA
async function carregarDadosRafa() {
  const container = document.getElementById("lista-chamada-rafa");
  if (!container) return;

  if (!supabaseClient) {
    container.innerHTML = `<p class="text-center text-xs text-rose-400 py-4">Erro de conexão com o Supabase.</p>`;
    return;
  }

  const { data, error } = await supabaseClient.from('alunos').select('*');
  if (error || !data || data.length === 0) {
    container.innerHTML = `<p class="text-center text-xs text-slate-500 py-4">Nenhum aluno para chamada.</p>`;
    return;
  }

  container.innerHTML = data.map(aluno => {
    const st = aluno.status || 'Em Casa';
    return `
      <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="text-sm font-bold text-white">${aluno.nome}</h4>
            <p class="text-xs text-slate-400">${aluno.escola || ''}</p>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="atualizarStatus('${aluno.id}', 'Em Casa')" class="py-2.5 rounded-xl text-xs font-bold transition-all ${st === 'Em Casa' ? 'bg-slate-600 text-white' : 'bg-slate-900/60 text-slate-400'}">🏡 Casa</button>
          <button onclick="atualizarStatus('${aluno.id}', 'Na Van')" class="py-2.5 rounded-xl text-xs font-bold transition-all ${st === 'Na Van' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/60 text-slate-400'}">🚌 Van</button>
          <button onclick="atualizarStatus('${aluno.id}', 'Na Escola')" class="py-2.5 rounded-xl text-xs font-bold transition-all ${st === 'Na Escola' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900/60 text-slate-400'}">🏫 Escola</button>
        </div>
      </div>
    `;
  }).join('');
}

async function atualizarStatus(id, novoStatus) {
  if (!supabaseClient) return;
  await supabaseClient.from('alunos').update({ status: novoStatus }).eq('id', id);
  carregarDadosRafa();
}

// RENDERIZACAO ADMIN
async function carregarDadosAdmin() {
  const container = document.getElementById("lista-alunos-admin");
  if (!container) return;

  if (!supabaseClient) {
    container.innerHTML = `<p class="text-center text-xs text-rose-400 py-4">Erro de conexão com o Supabase.</p>`;
    return;
  }

  const { data, error } = await supabaseClient.from('alunos').select('*');
  if (error || !data || data.length === 0) {
    container.innerHTML = `<p class="text-center text-xs text-slate-500 py-4">Nenhum aluno cadastrado.</p>`;
    return;
  }

  container.innerHTML = data.map(aluno => `
    <div class="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl flex items-center justify-between">
      <div>
        <p class="text-xs font-bold text-white">${aluno.nome}</p>
        <p class="text-[10px] text-slate-400">Escola: ${aluno.escola || '-'} | Resp: ${aluno.responsavel || '-'}</p>
      </div>
      <button onclick="deletarAluno('${aluno.id}')" class="text-rose-400 text-xs p-2">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

async function deletarAluno(id) {
  if (!supabaseClient) return;
  if (confirm("Deseja apagar este aluno?")) {
    await supabaseClient.from('alunos').delete().eq('id', id);
    carregarDadosAdmin();
  }
}
