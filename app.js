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
let modoRotaAtual = "IDA"; // 'IDA' ou 'VOLTA'
let filtroTurnoAtual = "Todos";
let filtroFinStatus = "Todos";
let filtroFinAdminStatus = "Todos";
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
  document.getElementById("btn-back")?.addEventListener("click", resetLogin);
  document.getElementById("nav-btn-logout")?.addEventListener("click", logout);

  // TEMA
  document.getElementById("btn-theme-toggle")?.addEventListener("click", alternarTema);

  // PERFIS
  document.getElementById("btn-pais")?.addEventListener("click", () => entrarPerfil("pais"));
  document.getElementById("btn-rafa")?.addEventListener("click", () => mostrarFormLogin("rafa"));
  document.getElementById("btn-admin")?.addEventListener("click", () => mostrarFormLogin("admin"));

  // LOGIN RAFA E ADMIN
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

  // AUTO-CADASTRO PAIS
  document.getElementById("btn-abrir-auto-cadastro")?.addEventListener("click", () => {
    document.getElementById("form-auto-cadastro-container")?.classList.remove("hidden");
  });
  document.getElementById("btn-fechar-auto-cadastro")?.addEventListener("click", () => {
    document.getElementById("form-auto-cadastro-container")?.classList.add("hidden");
  });
  document.getElementById("form-auto-cadastro-pais")?.addEventListener("submit", enviarAutoCadastroPais);

  // LOGIN PIN PAIS
  document.getElementById("select-email-pais")?.addEventListener("change", (e) => {
    const email = e.target.value;
    const boxPin = document.getElementById("box-pin-pais");
    const containerFilho = document.getElementById("conteudo-filho-pais");
    
    if (email) {
      boxPin?.classList.remove("hidden");
      containerFilho?.classList.add("hidden");
      document.getElementById("input-pin-pais").value = "";
    } else {
      boxPin?.classList.add("hidden");
      containerFilho?.classList.add("hidden");
    }
  });

  document.getElementById("btn-entrar-pais-pin")?.addEventListener("click", validarLoginPinPais);

  // BOTÕES ALTERNAR ROTA (IDA vs VOLTA)
  document.getElementById("btn-rota-ida")?.addEventListener("click", () => alternarModoRota("IDA"));
  document.getElementById("btn-rota-volta")?.addEventListener("click", () => alternarModoRota("VOLTA"));

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

  // ABAS DO PAINEL ADMIN
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

  // FILTROS TURNO TIA RAFA
  document.getElementById("btn-filtro-todos")?.addEventListener("click", () => aplicarFiltroTurno("Todos"));
  document.getElementById("btn-filtro-manha7")?.addEventListener("click", () => aplicarFiltroTurno("Manhã (07h às 11h)"));
  document.getElementById("btn-filtro-manha8")?.addEventListener("click", () => aplicarFiltroTurno("Manhã (08h às 12h)"));
  document.getElementById("btn-filtro-tarde")?.addEventListener("click", () => aplicarFiltroTurno("Tarde"));

  // FILTROS FINANCEIROS TIA RAFA
  document.getElementById("btn-fin-filtro-todos")?.addEventListener("click", () => aplicarFiltroFin("Todos"));
  document.getElementById("btn-fin-filtro-pendentes")?.addEventListener("click", () => aplicarFiltroFin("Pendente"));
  document.getElementById("btn-fin-filtro-pagos")?.addEventListener("click", () => aplicarFiltroFin("Pago"));

  // FILTROS ADMIN FINANCEIRO
  document.getElementById("btn-admin-fin-todos")?.addEventListener("click", () => aplicarFiltroFinAdmin("Todos"));
  document.getElementById("btn-admin-fin-pendentes")?.addEventListener("click", () => aplicarFiltroFinAdmin("Pendente"));
  document.getElementById("btn-admin-fin-pagos")?.addEventListener("click", () => aplicarFiltroFinAdmin("Pago"));

  // BACKUP / EXPORTAÇÃO CSV
  document.getElementById("btn-rafa-exportar-csv")?.addEventListener("click", exportarRelatorioFinanceiroCSV);
  document.getElementById("btn-admin-exportar-csv")?.addEventListener("click", exportarRelatorioFinanceiroCSV);

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

  // ADMIN AÇÕES
  document.getElementById("form-cadastrar-aluno")?.addEventListener("submit", cadastrarAlunoAdmin);
  document.getElementById("btn-encerrar-mes")?.addEventListener("click", encerrarMesFinanceiro);
});

// ALTERNAR ENTRE ROTA DA IDA E ROTA DA VOLTA
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

// VALIDAR PIN 4 DÍGITOS DOS PAIS
function validarLoginPinPais() {
  const emailSelect = document.getElementById("select-email-pais")?.value;
  const pinInput = document.getElementById("input-pin-pais")?.value;

  if (!emailSelect) {
    alert("Selecione seu e-mail.");
    return;
  }

  const aluno = alunosCache.find(a => a.email_mae === emailSelect && !a.pendente_aprovacao);

  if (!aluno) {
    alert("Cadastro não encontrado ou pendente de aprovação.");
    return;
  }

  const pinCorreto = aluno.pin_pais || "1234";

  if (pinInput === pinCorreto) {
    document.getElementById("box-pin-pais")?.classList.add("hidden");
    renderizarPaisFilho(emailSelect);
  } else {
    alert("PIN de 4 dígitos incorreto. Tente novamente.");
  }
}

// SUBMETER AUTO-CADASTRO DOS PAIS (SEM O HORÁRIO DE BUSCA)
async function enviarAutoCadastroPais(e) {
  e.preventDefault();
  if (!supabaseClient) return;

  const pin = document.getElementById("auto-pin").value;
  if (pin.length !== 4 || isNaN(pin)) {
    alert("O PIN deve conter exatamente 4 números.");
    return;
  }

  const novoAluno = {
    nome: document.getElementById("auto-nome").value,
    turno: document.getElementById("auto-turno").value,
    whatsapp: document.getElementById("auto-wsp").value,
    horario_escola: document.getElementById("auto-horario-escola").value,
    horario_busca: "", // Fica em branco para a Tia Rafa preencher ao aprovar
    endereco_casa: document.getElementById("auto-endereco-casa").value,
    escola: document.getElementById("auto-escola").value,
    email_mae: document.getElementById("auto-email-mae").value,
    pin_pais: pin,
    valor: 180,
    vencimento: 10,
    status: 'Em Casa',
    status_pagamento: 'Pendente',
    vai_hoje: true,
    vai_turno1_hoje: false,
    levado_hoje: false, // Flag de controle para a rota dinâmica da volta
    pendente_aprovacao: true
  };

  const { error } = await supabaseClient.from('alunos').insert([novoAluno]);

  if (error) {
    alert("Erro ao enviar cadastro: " + error.message);
    return;
  }

  alert("Cadastro enviado com sucesso! A Tia Rafa irá definir o horário da busca e aprovar o acesso.");
  document.getElementById("form-auto-cadastro-pais").reset();
  document.getElementById("form-auto-cadastro-container")?.classList.add("hidden");
  carregarDadosPais();
}

// RENDERIZAR CARDS DE APROVAÇÃO PENDENTE (RAFA E ADMIN DEFINEM O HORÁRIO DE BUSCA)
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
          <p class="text-[10px] text-slate-300 font-medium mt-0.5">🏫 Entrada na Escola: ${a.horario_escola || 'Não inf.'}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Responsável: ${a.email_mae} (${a.whatsapp || 'S/ Whats'})</p>
          <p class="text-[10px] text-slate-400">Endereço: ${a.endereco_casa || '-'}</p>
        </div>
      </div>

      <div class="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
        <div>
          <label class="text-[10px] text-amber-400 block font-bold">⏰ Definir Horário que vai passar pra buscar:</label>
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
    alert("Por favor, informe o horário de busca da criança antes de aprovar!");
    return;
  }

  const val = inputVal ? parseFloat(inputVal.value) : 180;
  const venc = inputVenc ? parseInt(inputVenc.value) : 10;

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
    alert("Erro ao aprovar cadastro: " + error.message);
    return;
  }

  alert("Cadastro aprovado e horário da rota definido!");
  if (currentRole === 'rafa') carregarDadosRafa();
  if (currentRole === 'admin') carregarDadosAdmin();
}

// RENDERIZAR ROTA DINÂMICA DA TIA RAFA (ORDENADA POR HORÁRIO DE BUSCA)
function renderizarRotaRafa() {
  const container = document.getElementById("lista-chamada-rafa-cards");
  if (!container) return;

  const aprovados = alunosCache.filter(a => !a.pendente_aprovacao);
  let filtrados = aprovados;

  // 1. FILTRAR POR ROTA DE IDA vs VOLTA
  if (modoRotaAtual === "VOLTA") {
    // Rota da Volta traz apenas quem foi LEVADO para a escola no dia ou marcado como presente
    filtrados = aprovados.filter(a => a.levado_hoje === true || a.status === 'Na Escola' || a.status === 'Na Van');
  }

  // 2. FILTRAR POR TURNO
  if (filtroTurnoAtual !== "Todos") {
    filtrados = filtrados.filter(a => {
      if (filtroTurnoAtual === 'Manhã (07h às 11h)' && a.vai_turno1_hoje) return true;
      return a.turno === filtroTurnoAtual;
    });
  }

  // 3. ORDENAR DINAMICAMENTE POR HORÁRIO DE BUSCA (Ex: 06:20 -> 06:40 -> 07:10)
  filtrados.sort((a, b) => {
    const hA = a.horario_busca || '99:99';
    const hB = b.horario_busca || '99:99';
    return hA.localeCompare(hB);
  });

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-2">
        <i class="fa-solid fa-van-shuttle text-2xl text-amber-400"></i>
        <p class="text-xs font-bold text-white">Nenhum passageiro nesta rota no momento.</p>
        <p class="text-[10px] text-slate-400">${modoRotaAtual === 'VOLTA' ? 'Assim que você marcar as crianças como "Na Van" ou "Na Escola" no turno da ida, elas aparecerão na rota da volta automaticamente.' : 'Selecione outro filtro de turno.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtrados.map(aluno => {
    const st = aluno.status || 'Em Casa';
    const wsp = (aluno.whatsapp || '').replace(/\D/g, '');
    const vaiTurno1 = aluno.vai_turno1_hoje;

    return `
      <div class="bg-slate-800/80 border ${vaiTurno1 ? 'border-amber-400 bg-amber-500/5' : 'border-slate-700'} p-4 rounded-2xl space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-xs rounded-lg">${aluno.horario_busca || 'S/ hor.'}</span>
              <h4 class="text-sm font-bold text-white">${aluno.nome}</h4>
            </div>
            <p class="text-xs text-slate-400 mt-1">${aluno.escola || ''} (${aluno.turno || 'Manhã'}) • Entrada: ${aluno.horario_escola || '-'}</p>
            <p class="text-[10px] text-slate-300 mt-0.5"><i class="fa-solid fa-location-dot text-amber-400"></i> ${aluno.endereco_casa || 'Endereço não informado'}</p>
          </div>
          ${wsp ? `<a href="https://wa.me/55${wsp}" target="_blank" class="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg shrink-0"><i class="fa-brands fa-whatsapp"></i> Whats</a>` : ''}
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
  
  // Se marcou que está Na Van ou Na Escola, grava que a criança foi levada hoje
  if (st === 'Na Van' || st === 'Na Escola') {
    updateData.levado_hoje = true;
  }

  await supabaseClient.from('alunos').update(updateData).eq('id', id);
  carregarDadosRafa();
}

async function resetarStatusDoDia() {
  if (!supabaseClient) return;
  if (confirm("Deseja resetar o status de todos os alunos para 'Em Casa' e limpar a rota do dia?")) {
    await supabaseClient.from('alunos').update({
      status: 'Em Casa',
      levado_hoje: false,
      vai_turno1_hoje: false
    }).neq('id', '0');

    alert("Dia resetado com sucesso!");
    carregarDadosRafa();
  }
}

// TRANSMISSÃO GPS
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
            const { error } = await supabaseClient.from('alertas').insert([{ 
              tipo: 'GPS_VAN', 
              mensagem: `${lat},${lng}`, 
              ativo: true 
            }]);

            if (error) {
              console.error("Erro ao gravar GPS no Supabase:", error);
              if (btn) {
                btn.innerHTML = "🔴 Erro de Permissão no Banco";
                btn.className = "px-3 py-1 bg-rose-600 text-white font-bold text-[11px] rounded-lg";
              }
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
          console.warn("Erro GPS:", err);
          if (btn) {
            btn.innerHTML = "⚪ GPS Desligado";
            btn.className = "px-3 py-1 bg-slate-700 text-slate-300 font-bold text-[11px] rounded-lg transition-all";
          }
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

// BUSCAR GPS NO PAINEL ADMIN
async function carregarGpsAdmin() {
  if (currentRole !== "admin" || !supabaseClient) return;

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
        ? "🟢 Sinal ao Vivo Detectado (Em Movimento)" 
        : "⚪ Van Offline (Exibindo Campo Alegre / Cabuçu)";
    }

    const iconeZafiraGps = L.divIcon({
      className: 'custom-van-marker',
      html: `
        <div style="width:50px; height:50px; border-radius:50%; border:3px solid #f59e0b; background:#0f172a; padding:3px; box-shadow:0 6px 16px rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center;">
          <img src="https://i.ibb.co/8DjK8D2v/image.png" style="width:100%; height:100%; object-fit:contain;" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3202/3202926.png'">
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    if (!mapAdmin && window.L) {
      mapAdmin = L.map('mapa-admin-container').setView([lat, lng], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapAdmin);

      markerVanAdmin = L.marker([lat, lng], { icon: iconeZafiraGps }).addTo(mapAdmin);
    } else if (mapAdmin && markerVanAdmin) {
      markerVanAdmin.setLatLng([lat, lng]);
      mapAdmin.setView([lat, lng]);
    }

    setTimeout(() => {
      if (mapAdmin) mapAdmin.invalidateSize();
    }, 300);
  } catch (e) {
    console.error("Erro ao carregar mapa:", e);
  }
}

// SIRENE DE EMERGÊNCIA
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

// CHECAGEM DE EMERGÊNCIA RESTRITA AO ADMIN
async function verificarEmergenciaAdmin() {
  if (!supabaseClient) return;

  if (currentRole !== "admin") {
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
  alert("Emergência desativada.");
}

// ADMIN GESTÃO DE ALUNOS
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
  renderizarPendentesAprovacao();

  const aprovados = data.filter(a => !a.pendente_aprovacao);
  if (countEl) countEl.innerText = `${aprovados.length} Alunos`;

  container.innerHTML = aprovados.map(a => {
    const st = a.status || 'Em Casa';
    const stP = a.status_pagamento || 'Pendente';
    const val = parseFloat(a.valor || 180);

    return `
      <div class="bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-2xl space-y-2.5">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="text-xs font-bold text-white">${a.nome}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">${a.escola || '-'} • ${a.turno || 'Manhã (07h às 11h)'} | PIN: <strong>${a.pin_pais || '1234'}</strong></p>
            <p class="text-[10px] text-amber-400 font-medium">📍 Busca Casa: ${a.horario_busca || '-'} | 🏫 Entrada Escola: ${a.horario_escola || '-'}</p>
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
  renderizarFinanceiroAdmin();
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
  document.getElementById("edit-turno").value = aluno.turno || 'Manhã (07h às 11h)';
  document.getElementById("edit-wsp").value = aluno.whatsapp || '';
  document.getElementById("edit-horario-busca").value = aluno.horario_busca || '';
  document.getElementById("edit-horario-escola").value = aluno.horario_escola || '';
  document.getElementById("edit-endereco-casa").value = aluno.endereco_casa || '';
  document.getElementById("edit-escola").value = aluno.escola || '';
  document.getElementById("edit-email-mae").value = aluno.email_mae || '';
  document.getElementById("edit-pin").value = aluno.pin_pais || '1234';
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
    pin_pais: document.getElementById("edit-pin").value,
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

// ADMIN FINANCEIRO
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

    const msgCobranca = encodeURIComponent(`Olá! Passando para lembrar sobre a mensalidade do transporte escolar do(a) *${aluno.nome}* referente a este mês no valor de R$ ${val.toFixed(2)}.\n\n🔑 Chave PIX: ${pixChaveGlobal}\n\nQualquer dúvida estou à disposição! 😊`);

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
              <a href="https://wa.me/55${wsp}?text=${msgCobranca}" target="_blank" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center shrink-0 shadow" title="Cobrar WhatsApp">
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

// EXPORTAÇÃO CSV / PLANILHA
function exportarRelatorioFinanceiroCSV() {
  const aprovados = alunosCache.filter(a => !a.pendente_aprovacao);
  if (!aprovados || aprovados.length === 0) {
    alert("Não há dados de alunos aprovados para exportar.");
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

// NAVEGAÇÃO E ENTRADA NOS PERFIS
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
  
  if (isGpsTransmitting) alternarTransmissaoGps();
  pararSomSirene();
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
    
    if (!isGpsTransmitting) {
      alternarTransmissaoGps();
    }
  } else if (role === "admin") {
    document.getElementById("dashboard-admin")?.classList.remove("hidden");
    carregarDadosAdmin();

    setTimeout(() => {
      carregarGpsAdmin();
      if (mapAdmin) mapAdmin.invalidateSize();
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

  const aprovados = data.filter(a => !a.pendente_aprovacao);
  const emailsUnicos = [...new Set(aprovados.map(a => a.email_mae).filter(Boolean))];
  
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

  const filho = alunosCache.find(a => a.email_mae === email && !a.pendente_aprovacao);
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
  const vaiTurno1 = filho.vai_turno1_hoje || false;

  container.innerHTML = `
    <div class="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl space-y-4">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-base font-extrabold text-white">${filho.nome}</h3>
          <p class="text-xs text-slate-400 mt-0.5"><i class="fa-solid fa-graduation-cap"></i> ${filho.escola || '-'} (${filho.turno || 'Manhã'})</p>
          <p class="text-[11px] text-amber-400 font-medium mt-1"><i class="fa-regular fa-clock"></i> Horário de Busca: ${filho.horario_busca || 'A definir pela Tia Rafa'} | Entrada: ${filho.horario_escola || '-'}</p>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-bold border ${badgeColor} flex items-center gap-1.5">
          <i class="fa-solid ${icon}"></i> ${st}
        </span>
      </div>

      <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-xs text-slate-300">
        ${desc}
      </div>

      <!-- AVISO DE TURNO EXCEÇÃO (07H) -->
      ${filho.turno === 'Manhã (08h às 12h)' ? `
        <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-400"><i class="fa-solid fa-clock"></i> Vai no 1º turno hoje (07h)?</span>
            <button onclick="alternarExcecaoPais('${filho.id}', ${!vaiTurno1})" class="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${vaiTurno1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}">
              ${vaiTurno1 ? '✓ Sim (07h)' : 'Não (08h)'}
            </button>
          </div>
          <p class="text-[10px] text-slate-400">Marque "Sim" se ele vai no primeiro horário do transporte hoje.</p>
        </div>
      ` : ''}

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

async function alternarExcecaoPais(id, statusExcecao) {
  if (!supabaseClient) return;
  await supabaseClient.from('alunos').update({ vai_turno1_hoje: statusExcecao }).eq('id', id);
  carregarDadosPais();
}

// PAINEL RAFA
async function carregarDadosRafa() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.from('alunos').select('*');
  if (!data) return;
  alunosCache = data;

  renderizarPendentesAprovacao();
  renderizarRotaRafa();
  renderizarFinanceiroRafa();
}

function aplicarFiltroTurno(turno) {
  filtroTurnoAtual = turno;
  document.getElementById("btn-filtro-todos").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${turno === 'Todos' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`;
  document.getElementById("btn-filtro-manha7").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${turno === 'Manhã (07h às 11h)' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`;
  document.getElementById("btn-filtro-manha8").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${turno === 'Manhã (08h às 12h)' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`;
  document.getElementById("btn-filtro-tarde").className = `px-2.5 py-1 text-[11px] font-bold rounded-lg ${turno === 'Tarde' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`;
  renderizarRotaRafa();
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
  const countAlunos = document.getElementById("total-alunos-count");
  const progTexto = document.getElementById("progresso-percentual");
  const progBarra = document.getElementById("barra-progresso-financeiro");

  if (mTot) mTot.innerText = `R$ ${faturamentoTotal.toFixed(2)}`;
  if (mRec) mRec.innerText = `R$ ${recebido.toFixed(2)}`;
  if (mPen) mPen.innerText = `R$ ${pendente.toFixed(2)}`;
  if (countAlunos) countAlunos.innerText = `${aprovados.length} Alunos Ativos`;

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
        forma_pagamento: null,
        vai_turno1_hoje: false,
        levado_hoje: false
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
    pin_pais: document.getElementById("add-pin").value || "1234",
    valor: parseFloat(document.getElementById("add-valor").value),
    vencimento: parseInt(document.getElementById("add-vencimento").value),
    status: 'Em Casa',
    status_pagamento: 'Pendente',
    vai_hoje: true,
    vai_turno1_hoje: false,
    levado_hoje: false,
    pendente_aprovacao: false
  };

  await supabaseClient.from('alunos').insert([novoAluno]);
  alert("Aluno cadastrado com sucesso!");
  document.getElementById("form-cadastrar-aluno").reset();
  carregarDadosAdmin();
}

async function deletarAlunoAdmin(id) {
  if (!supabaseClient) return;
  if (confirm("Deseja recusar/apagar este aluno do banco de dados?")) {
    await supabaseClient.from('alunos').delete().eq('id', id);
    if (currentRole === 'rafa') carregarDadosRafa();
    if (currentRole === 'admin') carregarDadosAdmin();
  }
}
