let filtroFinStatus = "Todos";

// Adicionar estes ouvintes dentro do seu listener de DOMContentLoaded no app.js:
document.getElementById("btn-fin-filtro-todos")?.addEventListener("click", () => aplicarFiltroFin("Todos"));
document.getElementById("btn-fin-filtro-pendentes")?.addEventListener("click", () => aplicarFiltroFin("Pendente"));
document.getElementById("btn-fin-filtro-pagos")?.addEventListener("click", () => aplicarFiltroFin("Pago"));

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

  // Atualizar Métricas e Previsibilidade
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

  // Filtragem
  let filtrados = alunosCache;
  if (filtroFinStatus === "Pendente") filtrados = alunosCache.filter(a => a.status_pagamento !== "Pago");
  if (filtroFinStatus === "Pago") filtrados = alunosCache.filter(a => a.status_pagamento === "Pago");

  container.innerHTML = filtrados.map(aluno => {
    const stP = aluno.status_pagamento || 'Pendente';
    const val = parseFloat(aluno.valor || 180);
    const venc = parseInt(aluno.vencimento || 10);
    const emAtraso = stP !== "Pago" && diaHoje > venc;
    const wsp = (aluno.whatsapp || '').replace(/\D/g, '');

    // Mensagem amigável de cobrança via WhatsApp
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
