import * as db from '../database.js';

export function renderConferente(db) {
  const app = document.getElementById('app');
  const userName = window.currentUser ? window.currentUser.nome : 'Usuário';
  const userFuncao = window.currentUser ? window.currentUser.funcao : 'Conferente';

  const renderNotas = async (status = 'all') => {
    const notas = await db.getAllNotas();
    let filteredNotas = notas;

    if (status !== 'all') {
      filteredNotas = notas.filter(nota => {
        if (status === 'aberto') return nota.status.includes('Em Aberto');
        if (status === 'rejeitado') return nota.status.includes('Rejeitada');
        if (status === 'finalizado') return nota.status === 'Finalizada';
        return true;
      });
    } else {
        filteredNotas = notas.filter(nota => 
          nota.status === "Em Aberto - Conferente" || 
          nota.status.includes("Rejeitada - CPD") ||
          nota.status === "Finalizada"
        );
    }

    filteredNotas.sort((a, b) => {
      if (a.perecivel === 'Sim' && b.perecivel !== 'Sim') return -1;
      if (a.perecivel !== 'Sim' && b.perecivel === 'Sim') return 1;
      return 0;
    });

    let notasHTML = filteredNotas.map(nota => `
      <li class="${nota.perecivel === 'Sim' ? 'priority' : ''}">
        <strong>Número da Nota:</strong> ${nota.numeroNota},
        <strong>Nome da Empresa:</strong> ${nota.nomeEmpresa},
        <strong>Motorista:</strong> ${motoristaNome},
        <strong>Telefone:</strong> ${motoristaTelefone}
        <button onclick="visualizarNota('${nota.id}')">Visualizar</button>
      </li>
    `).join('');

    document.getElementById('listaNotas').innerHTML = notasHTML.length ? 
      notasHTML : '<li>Não há notas pendentes no momento.</li>';
  };

  app.innerHTML = `
    <h2>Bem-vindo, ${userName}! (${userFuncao})</h2>
    <h2>Conferente - Notas Fiscais para Conferência</h2>
    <div class="filter-container">
      <select id="statusFilter">
        <option value="all">Todas as Notas</option>
        <option value="aberto">Notas Em Aberto</option>
        <option value="rejeitado">Notas Rejeitadas</option>
        <option value="finalizado">Notas Finalizadas</option>
      </select>
      <button onclick="applyFilter()">Filtrar</button>
    </div>
    <ul id="listaNotas"></ul>
    <div id="visualizacaoNota"></div>
    <button onclick="navigateTo('/login')">Voltar para Login</button>
  `;

  window.applyFilter = () => {
    const filterValue = document.getElementById('statusFilter').value;
    renderNotas(filterValue);
  };

  // Initial render
  renderNotas();

  window.visualizarNota = async (notaId) => {
    const nota = await db.getNota(notaId);
    if (nota) {
      const tempoAberto = calcularTempoAberto(nota.timestampCadastro);
      let fotosHTML = nota.fotosBase64.map(foto => `<img src="${foto}" style="max-width:200px; max-height:200px;">`).join('');

      // Fetch the motorista's information
      // Assuming that the motorista's CPF is stored within the nota object
      const motoristaCPF = nota.cpf; // Replace 'cpf' with the correct field name if it's different
      let motoristaNome = 'N/A';
      let motoristaTelefone = 'N/A';

      if (motoristaCPF) {
        const motorista = await db.findUserByCPF(motoristaCPF);
        motoristaNome = motorista ? motorista.nome : 'N/A';
        motoristaTelefone = motorista ? motorista.telefone : 'N/A';
      }

      document.getElementById('visualizacaoNota').innerHTML = `
        <h3>Visualização da Nota Fiscal</h3>
        ${fotosHTML}
        <p><strong>Nome da Empresa:</strong> ${nota.nomeEmpresa}</p>
        <p><strong>Data de Cadastro:</strong> ${new Date(nota.timestampCadastro).toLocaleString()}</p>
        <p><strong>Tempo em Aberto:</strong> ${tempoAberto}</p>
        <p><strong>Perecível:</strong> ${nota.perecivel}</p>
        <p><strong>Motorista:</strong> ${motoristaNome}</p>
        <p><strong>Telefone Motorista:</strong> ${motoristaTelefone}</p>
        <p><strong>Observação do Motorista:</strong> ${nota.observacao || 'Nenhuma observação'}</p>
         ${nota.perecivel === 'Sim' ? `
            <label for="temperatura">Temperatura da Carga:</label>
            <input type="number" id="temperatura" name="temperatura" required><br><br>
          ` : ''}
        <form id="finalizarNotaForm">
          <label for="numeroTransacao">Número de Transação:</label>
          <input type="text" id="numeroTransacao" name="numeroTransacao" required><br><br>
          <label for="observacaoConferente">Observações:</label>
          <textarea id="observacaoConferente" name="observacaoConferente" rows="4" cols="50" placeholder="Adicione suas observações aqui..."></textarea><br><br>
          <button type="button" onclick="finalizarNota('${nota.id}')">Finalizar Nota Fiscal</button>
        </form>
      `;
    } else {
      document.getElementById('visualizacaoNota').innerHTML = `<p>Nota não encontrada.</p>`;
    }
  };

  window.finalizarNota = async (notaId) => {
    const numeroTransacao = document.getElementById('numeroTransacao').value;
    const observacaoConferente = document.getElementById('observacaoConferente').value;
    let temperatura = null;

    if (document.getElementById('temperatura')) {
      temperatura = document.getElementById('temperatura').value;
      if (!temperatura) {
        alert('A temperatura da carga é obrigatória para produtos perecíveis.');
        return;
      }
    }

    if (!numeroTransacao) {
      alert('O número de transação é obrigatório.');
      return;
    }

    const finalizar = confirm('Finalizar nota fiscal?');

    if (finalizar) {
      const conferenteCPF = window.currentUser ? window.currentUser.cpf : null;

      await db.updateNota(notaId, {
        status: 'Finalizada',
        numeroTransacao: numeroTransacao,
        observacaoConferente: observacaoConferente,
        finalizadaPorCPF: conferenteCPF,
        timestampFinalizacao: new Date().toISOString(),
        temperatura: temperatura
      });
      alert('Nota Fiscal finalizada com sucesso!');
      navigateTo('/conferente');
    } else {
      alert('Finalização cancelada.');
    }
  };

  function calcularTempoAberto(timestampCadastro) {
    const inicio = new Date(timestampCadastro).getTime();
    const agora = new Date().getTime();
    const diff = agora - inicio;

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${horas} horas e ${minutos} minutos`;
  }
}