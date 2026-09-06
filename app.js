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
let filtroTurnoAtual = "Todos";
let filtroFinStatus = "Todos";
let audioContext = null;
let audioOscillator = null;

let gpsWatchId = null;
let isGpsTransmitting = false;
let mapAdmin = null;
let markerVanAdmin = null;

let loginSection, authForm, authTitle, inputPassword, mainButtons, bottomBar, btnTopBack;

document.addEventListener("DOMContentLoaded", () => {
  loginSection = document.getElementById("login-section");
  authForm = document.getElementById("auth-form");
  authTitle = document.getElementById("auth-title");
  inputPassword = document.getElementById("input-password");
  mainButtons = document.getElementById("main-buttons");
  bottomBar = document.getElementById("bottom-bar");
  btnTopBack = document.getElementById("btn-top-back");

  inicializarTema();
  verificarAlertaGlobal();
  
  // CHECAGEM AUTOMÁTICA
  setInterval(verificarEmergenciaAdmin, 3000);
  setInterval(carregarGpsAdmin, 5000);

  // NAVEGAÇÃO
  btnTopBack?.addEventListener("click", voltarHome);
  document.getElementById("nav-btn-home")?.addEventListener("click", voltarHome);
  document.getElementById("btn-back")?.addEventListener("click", resetLogin);
  document.getElementById("nav-btn-logout")?.addEventListener("click", logout);

  // TEMA
  document.getElementById("btn-theme-toggle")?.addEventListener("click", alternarTema);

  // PERFIS
  document.getElementById("btn-pais")?.addEventListener("click", () => entrarPerfil("pais"));
  document.getElementById("btn-rafa")?.addEventListener("click", () => mostrarFormLogin("rafa"));
  document.getElementById("btn-admin")?.addEventListener("click", () => mostrarFormLogin("admin"));

  // LOGIN
  document.getElementById("btn-login-submit")?.addEventListener("click", () => {
    const pwd = inputPassword ? inputPassword.value : "";
    if (currentRole === "rafa" && pwd === passRafa) entrarPerfil("rafa");
    else if (currentRole === "admin" && pwd === passAdmin) entrarPerfil("admin");
    else alert("Senha incorreta!");
  });

  // GPS TOGGLE (TIA RAFA)
  document.getElementById("btn-toggle-gps")?.addEventListener("click", alternarTransmissaoGps);
  document.getElementById("btn-forcar-gps-test")?.addEventListener("click", carregarGpsAdmin);

  // EMERGÊNCIA
  document.getElementById("btn-disparar-emergencia")?.addEventListener("click", dispararEmergenciaRafa);
  document.getElementById("btn-desativar-emergencia")?.addEventListener("click", atenderEmergenciaAdmin);

  // MODAL EDIÇÃO
  document.getElementById("btn-fechar-modal-edit")?.addEventListener("click", () => {
    document.getElementById("modal-editar-aluno")?.classList.add("hidden");
  });
  document.getElementById("form-editar-aluno")?.addEventListener("submit", salvarEdicaoAlunoAdmin);

  // CONFIGS GLOBAIS
  document.getElementById("btn-salvar-configs")?.addEventListener("click", salvarConfigsGlobais);

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

  // FILTROS
  document.getElementById("btn-filtro-todos")?.addEventListener("click", () => aplicarFiltroTurno("Todos"));
  document.getElementById("btn-filtro-manha")?.addEventListener("click", () => aplicarFiltroTurno("Manhã"));
  document.getElementById("btn-filtro-tarde")?.addEventListener("click", () => aplicarFiltroTurno("Tarde"));

  document.getElementById("btn-fin-filtro-todos")?.addEventListener("click", () => aplicarFiltroFin("Todos"));
  document.getElementById("btn-fin-filtro-pendentes")?.addEventListener("click", () => aplicarFiltroFin("Pendente"));
  document.getElementById("btn-fin-filtro-pagos")?.addEventListener("click", () => aplicarFiltroFin("Pago"));

  // AVISOS
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

  // SELEÇÃO E-MAIL PAIS
  document.getElementById("select-email-pais")?.addEventListener("change", (e) => renderizarPaisFilho(e.target.value));

  // ADMIN
  document.getElementById("form-cadastrar-aluno")?.addEventListener("submit", cadastrarAlunoAdmin);
  document.getElementById("btn-encerrar-mes")?.addEventListener("click", encerrarMesFinanceiro);
});


// TRANSMISSÃO GPS COM TRATAMENTO DE ERROS DO SUPABASE
function alternarTransmissaoGps() {
  const btn = document.getElementById("btn-toggle-gps");
  if (!isGpsTransmitting) {
    if ("geolocation" in navigator) {
      btn.innerHTML = "🟡 Enviando ao Banco...";
      
      gpsWatchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const precisao = pos.coords.accuracy;

          if (supabaseClient) {
            const { error } = await supabaseClient.from('alertas').insert([{ 
              tipo: 'GPS_VAN', 
              mensagem: `${lat},${lng}`, 
              ativo: true 
            }]);

            if (error) {
              console.error("Erro ao gravar GPS no Supabase:", error);
              btn.innerHTML = "🔴 Erro de Permissão no Banco";
              btn.className = "px-3 py-1 bg-rose-600 text-white font-bold text-[11px] rounded-lg";
              return;
            }
          }
          
          isGpsTransmitting = true;
          if (btn) {
            btn.innerHTML = `🟢 GPS Transmitindo (~${Math.round(precisao)}m)`;
            btn.className = "px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-[11px] rounded-lg transition-all animate-pulse";
          }
        },
        (err) => {
          alert("Aviso: Ative a localização (GPS) do seu celular.");
          btn.innerHTML = "⚪ GPS Desligado";
          btn.className = "px-3 py-1 bg-slate-700 text-slate-300 font-bold text-[11px] rounded-lg transition-all";
          isGpsTransmitting = false;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      alert("Seu celular não suporta geolocalização.");
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

// BUSCAR GPS NO PAINEL ADMIN (MARCADOR PERSONALIZADO ZAFIRA)
async function carregarGpsAdmin() {
  if (currentRole !== "admin" || !supabaseClient) return;

  const statusTxt = document.getElementById("txt-status-gps-admin");
  const containerMapa = document.getElementById("mapa-admin-container");
  
  if (!containerMapa) return;

  // Busca a última posição registrada no banco de dados
  const { data } = await supabaseClient
    .from('alertas')
    .select('*')
    .eq('tipo', 'GPS_VAN')
    .order('id', { ascending: false })
    .limit(1);

  // COORDENADAS PADRÃO: Campo Alegre / Cabuçu - Nova Iguaçu (RJ)
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
      ? "🟢 Sinal ao Vivo Detectado (Em Movimento)" 
      : "⚪ Van Offline (Exibindo Campo Alegre / Cabuçu)";
  }

  // ÍCONE PERSONALIZADO DA ZAFIRA DA TIA RAFA PARA O MAPA
  const iconeZafiraGps = L.divIcon({
    className: 'custom-van-marker',
    html: `
      <div style="width:50px; height:50px; border-radius:50%; border:3px solid #f59e0b; background:#0f172a; padding:3px; box-shadow:0 6px 16px rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center;">
        <img src="https://i.ibb.co/8DjK8D2v/image.png" style="width:100%; height:100%; object-fit:contain;">
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25]
  });

  // CRIA OU ATUALIZA O MAPA NO PAINEL ADMIN
  if (!mapAdmin && window.L) {
    mapAdmin = L.map('mapa-admin-container').setView([lat, lng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(mapAdmin);

    markerVanAdmin = L.marker([lat, lng], { icon: iconeZafiraGps }).addTo(mapAdmin).bindPopup("🚐 Zafira Tia Rafa").openPopup();
  } else if (mapAdmin && markerVanAdmin) {
    markerVanAdmin.setLatLng([lat, lng]);
    mapAdmin.setView([lat, lng]);
  }

  // REAJUSTA AS DIMENSÕES DO MAPA
  setTimeout(() => {
    if (mapAdmin) {
      mapAdmin.invalidateSize();
    }
  }, 300);
}

// EMERGÊNCIA
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
  } catch (e) {
    console.log("Erro áudio", e);
  }
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

    alert("Alerta enviado ao Admin com sua localização!");
  }, async () => {
    await supabaseClient.from('alertas').insert([{
      tipo: 'EMERGENCIA_ADMIN',
      mensagem: `🚨 EMERGÊNCIA: ${motivo}`,
      ativo: true
    }]);
  });
}

async function verificarEmergenciaAdmin() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.from('alertas').select('*').eq('tipo', 'EMERGENCIA_ADMIN').eq('ativo', true).order('id', { ascending: false }).limit(1);

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
  alert("Emergência desativada.");
}

// SUPER ADMIN - GESTÃO TOTAL DE ALUNOS
async function carregarDadosAdmin() {
  if (!supabaseClient) return;

  document.getElementById("cfg-pix").value = pixChaveGlobal;
  document.getElementById("cfg-pass-rafa").value = passRafa;
  document.getElementById("cfg-pass-admin").value = passAdmin;

  const { data } = await supabaseClient.from('alunos').select('*').order('nome', { ascending: true });
  const container = document.getElementById("lista-alunos-admin");
  const countEl = document.getElementById("count-admin-alunos");
  if (!container || !data) return;

  alunosCache = data;
  if (countEl) countEl.innerText = `${data.length} Alunos`;

  container.innerHTML = data.map(a => {
    const st = a.status || 'Em Casa';
    const stP = a.status_pagamento || 'Pendente';
    const val = parseFloat(a.valor || 180);

    return `
      <div class="bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-2xl space-y-2.5">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="text-xs font-bold text-white">${a.nome}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">${a.escola || '-'} • ${a.turno || 'Manhã'} | Mensalidade: R$ ${val.toFixed(2)} (Venc: Dia ${a.vencimento || 10})</p>
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
              <option value="Pago" ${stP === 'Pago' ? 'selected' : ''}>🟢 Quitado (Pago)</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }).join('');

  carregarGpsAdmin();
}

async function alterarStatusAdmin(id, campo, valor) {
  if (!supabaseClient) return;
  let updateObj = {};
  updateObj[campo] = valor;
  await supabaseClient.from('alunos').update(updateObj).eq('id', id);
  carregarDadosAdmin();
}

function abrirModalEditarAluno(id) {
  const aluno = alunosCache.find(a => a.id == id);
  if (!aluno) return;

  document.getElementById("edit-id").value = aluno.id;
  document.getElementById("edit-nome").value = aluno.nome || '';
  document.getElementById("edit-turno").value = aluno.turno || 'Manhã';
  document.getElementById("edit-wsp").value = aluno.whatsapp || '';
  document.getElementById("edit-horario-busca").value = aluno.horario_busca || '';
  document.getElementById("edit-horario-escola").value = aluno.horario_escola || '';
  document.getElementById("edit-endereco-casa").value = aluno.endereco_casa || '';
  document.getElementById("edit-escola").value = aluno.escola || '';
  document.getElementById("edit-email-mae").value = aluno.email_mae || '';
  document.getElementById("edit-valor").value = aluno.valor || 180;
  document.getElementById("edit-vencimento").value = aluno.vencimento || 10;

  document.getElementById("modal-editar-aluno")?.classList.remove("hidden");
}

async function salvarEdicaoAlunoAdmin(e) {
  e.preventDefault();
  if (!supabaseClient) return;

  const id = document.getElementById("edit-id").value;
  const updateData = {
    nome: document.getElementById("edit-nome").value,
    turno: document.getElementById("edit-turno").value,
    whatsapp: document.getElementById("edit-wsp").value,
    horario_busca: document.getElementById("edit-horario-busca").value,
    horario_escola: document.getElementById("edit-horario-escola").value,
    endereco_casa: document.getElementById("edit-endereco-casa").value,
    escola: document.getElementById("edit-escola").value,
    email_mae: document.getElementById("edit-email-mae").value,
    valor: parseFloat(document.getElementById("edit-valor").value),
    vencimento: parseInt(document.getElementById("edit-vencimento").value)
  };

  await supabaseClient.from('alunos').update(updateData).eq('id', id);
  alert("Dados do passageiro atualizados!");
  document.getElementById("modal-editar-aluno")?.classList.add("hidden");
  carregarDadosAdmin();
}

function salvarConfigsGlobais() {
  pixChaveGlobal = document.getElementById("cfg-pix").value;
  passRafa = document.getElementById("cfg-pass-rafa").value;
  passAdmin = document.getElementById("cfg-pass-admin").value;
  alert("Configurações salvas para esta sessão!");
}

// NAVEGAÇÕES E INTERFACE
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

function voltarHome() {
  document.getElementById("dashboard-pais")?.classList.add("hidden");
  document.getElementById("dashboard-rafa")?.classList.add("hidden");
  document.getElementById("dashboard-admin")?.classList.add("hidden");
  bottomBar?.classList.add("hidden");
  btnTopBack?.classList.add("hidden");
  loginSection?.classList.remove("hidden");
  resetLogin();
}

function logout() {
  voltarHome();
}

function entrarPerfil(role) {
  loginSection?.classList.add("hidden");
  bottomBar?.classList.remove("hidden");
  btnTopBack?.classList.remove("hidden");

  if (role === "pais") {
    document.getElementById("dashboard-pais")?.classList.remove("hidden");
    carregarDadosPais();
  } else if (role === "rafa") {
    document.getElementById("dashboard-rafa")?.classList.remove("hidden");
    carregarDadosRafa();
  } else if (role === "admin") {
    document.getElementById("dashboard-admin")?.classList.remove("hidden");
    carregarDadosAdmin();

    setTimeout(() => {
      carregarGpsAdmin();
      if (mapAdmin) {
        mapAdmin.invalidateSize();
      }
    }, 400);
  }
}

// ALERTAS PAIS
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
  alert("Aviso publicado na tela dos pais!");
  verificarAlertaGlobal();
}

async function limparAvisos() {
  if (!supabaseClient) return;
  await supabaseClient.from('alertas').update({ ativo: false }).neq('tipo', 'EMERGENCIA_ADMIN').neq('tipo', 'GPS_VAN');
  alert("Avisos encerrados!");
  verificarAlertaGlobal();
}

// PAIS
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

  container.innerHTML = `
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

      <div class="flex items-center justify-between pt-2 border-t border-slate-700/60">
        <span class="text-xs font-bold text-slate-300">Vai no transporte hoje?</span>
        <button onclick="alternarPresenca('${filho.id}', ${!filho.vai_hoje})" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filho.vai_hoje !== false ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
          ${filho.vai_hoje !== false ? '✓ Confirmado' : '✕ Ausente Hoje'}
        </button>
      </div>
    </div>

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

  container.classList.remove("hidden");
}

async function alternarPresenca(id, novoStatus) {
  if (!supabaseClient) return;
  await supabaseClient.from('alunos').update({ vai_hoje: novoStatus }).eq('id', id);
  carregarDadosPais();
}

// PAINEL RAFA
async function carregarDadosRafa() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.from('alunos').select('*');
  if (!data) return;
  alunosCache = data;

  renderizarRotaRafa();
  renderizarFinanceiroRafa();
}

function aplicarFiltroTurno(turno) {
  filtroTurnoAtual = turno;
  document.getElementById("btn-filtro-todos").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${turno === 'Todos' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`;
  document.getElementById("btn-filtro-manha").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${turno === 'Manhã' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`;
  document.getElementById("btn-filtro-tarde").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${turno === 'Tarde' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`;
  renderizarRotaRafa();
}

function renderizarRotaRafa() {
  const container = document.getElementById("lista-chamada-rafa-cards");
  if (!container) return;

  let filtrados = alunosCache;
  if (filtroTurnoAtual !== "Todos") {
    filtrados = alunosCache.filter(a => a.turno === filtroTurnoAtual);
  }

  container.innerHTML = filtrados.map(aluno => {
    const st = aluno.status || 'Em Casa';
    const wsp = (aluno.whatsapp || '').replace(/\D/g, '');

    return `
      <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="text-sm font-bold text-white">${aluno.nome}</h4>
            <p class="text-xs text-slate-400">${aluno.escola || ''} • ${aluno.turno || 'Manhã'}</p>
          </div>
          ${wsp ? `<a href="https://wa.me/55${wsp}" target="_blank" class="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg"><i class="fa-brands fa-whatsapp"></i> Whats</a>` : ''}
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

  alunosCache.forEach(a => {
    const val = parseFloat(a.valor || 180);
    faturamentoTotal += val;
    if (a.status_pagamento === "Pago") recebido += val;
    else pendente += val;
  });

  const mTot = document.getElementById("metrica-faturamento-total");
  const mRec = document.getElementById("metrica-recebido");
  const mPen = document.getElementById("metrica-pendente");
  const countAlunos = document.getElementById("total-alunos-count");
  const progTexto = document.getElementById("progresso-percentual");
  const progBarra = document.getElementById("barra-progresso-financeiro");

  if (mTot) mTot.innerText = `R$ ${faturamentoTotal.toFixed(2)}`;
  if (mRec) mRec.innerText = `R$ ${recebido.toFixed(2)}`;
  if (mPen) mPen.innerText = `R$ ${pendente.toFixed(2)}`;
  if (countAlunos) countAlunos.innerText = `${alunosCache.length} Alunos Ativos`;

  const porc = faturamentoTotal > 0 ? Math.round((recebido / faturamentoTotal) * 100) : 0;
  if (progTexto) progTexto.innerText = `${porc}%`;
  if (progBarra) progBarra.style.width = `${porc}%`;

  let filtrados = alunosCache;
  if (filtroFinStatus === "Pendente") filtrados = alunosCache.filter(a => a.status_pagamento !== "Pago");
  if (filtroFinStatus === "Pago") filtrados = alunosCache.filter(a => a.status_pagamento === "Pago");

  container.innerHTML = filtrados.map(aluno => {
    const stP = aluno.status_pagamento || 'Pendente';
    const val = parseFloat(aluno.valor || 180);
    const venc = parseInt(aluno.vencimento || 10);
    const emAtraso = stP !== "Pago" && diaHoje > venc;
    const wsp = (aluno.whatsapp || '').replace(/\D/g, '');

    const msgCobranca = encodeURIComponent(`Olá! Passando para lembrar sobre a mensalidade do transporte escolar do(a) *${aluno.nome}* referente a este mês no valor de R$ ${val.toFixed(2)}.\n\n🔑 Chave PIX: ${pixChaveGlobal}\n\nQualquer dúvida estou à disposição! 😊`);

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
              <a href="https://wa.me/55${wsp}?text=${msgCobranca}" target="_blank" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center shrink-0 shadow" title="Lembrete de Pagamento no WhatsApp">
                <i class="fa-brands fa-whatsapp text-sm"></i>
              </a>
            ` : ''}
          `}
        </div>
      </div>
    `;
  }).join('');
}

async function atualizarStatusRafa(id, st) {
  if (!supabaseClient) return;
  await supabaseClient.from('alunos').update({ status: st }).eq('id', id);
  carregarDadosRafa();
}

async function darBaixaRafa(id, stP, forma) {
  if (!supabaseClient) return;
  await supabaseClient.from('alunos').update({ status_pagamento: stP, forma_pagamento: forma }).eq('id', id);
  carregarDadosRafa();
}

async function encerrarMesFinanceiro() {
  if (!supabaseClient) return;
  if (confirm("Deseja fechar o mês atual e resetar os pagamentos para 'Pendente'?")) {
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
        forma_pagamento: null
      }).eq('id', a.id);
    }

    alert("Mês encerrado com sucesso!");
    carregarDadosRafa();
  }
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
