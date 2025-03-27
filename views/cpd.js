import * as db from '../database.js';

export function renderCPD(db) {
  const app = document.getElementById('app');
  const userName = window.currentUser ? window.currentUser.nome : 'Usuário';
  const userFuncao = window.currentUser ? window.currentUser.funcao : 'CPD';

  const renderNotas = async (status = 'all') => {
    const notas = await db.getAllNotas();
    let filteredNotas = notas;

    if (status !== 'all') {
      filteredNotas = notas.filter(nota => {
        if (status === 'aberto') return nota.status === 'Em Aberto - Motorista';
        if (status === 'rejeitado') return nota.status === 'Rejeitada - CPD';
        if (status === 'finalizado') return nota.status === 'Finalizada';
        return true;
      });
    }

    filteredNotas.sort((a, b) => {
      if (a.perecivel === 'Sim' && b.perecivel !== 'Sim') return -1;
      if (a.perecivel !== 'Sim' && b.perecivel === 'Sim') return 1;
      return 0;
    });

    let notasHTML = filteredNotas.map(nota => `
      <li class="${nota.perecivel === 'Sim' ? 'priority' : ''}">
        <strong>Loja:</strong> ${nota.empresaDestino}, 
        <strong>Nota:</strong> ${nota.numeroNota}, 
        <strong>Status:</strong> ${nota.status}
        <button onclick="visualizarNota('${nota.id}')">Visualizar</button>
        ${nota.status === 'Rejeitada - CPD' ? 
          `<button onclick="finalizarNotaRejeitada('${nota.id}')" style="margin-left: 10px;">Finalizar Nota</button>` : 
          ''}
      </li>
    `).join('');

    document.getElementById('listaNotas').innerHTML = notasHTML.length ? 
      notasHTML : '<li>Não há notas pendentes no momento.</li>';
  };

  app.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h2>Bem-vindo, ${userName}! (${userFuncao})</h2>
        <h2>CPD - Notas Fiscais para Coleta</h2>
      </div>
      <button onclick="navigateTo('/login')" style="height: 40px; padding: 0 20px;">Voltar para Login</button>
    </div>
    <div class="filter-container">
      <select id="statusFilter">
        <option value="all">Todas as Notas</option>
        <option value="aberto">Notas em Aberto</option>
        <option value="rejeitado">Notas Rejeitadas</option>
        <option value="finalizado">Notas Finalizadas</option>
      </select>
      <button onclick="applyFilter()">Filtrar</button>
    </div>
    <ul id="listaNotas"></ul>
    <div id="visualizacaoNota"></div>
  `;

  window.applyFilter = () => {
    const filterValue = document.getElementById('statusFilter').value;
    renderNotas(filterValue);
  };

  // Initial render
  renderNotas();

  window.finalizarNotaRejeitada = async (notaId) => {
    const confirmacao = confirm('Você tem certeza que deseja finalizar esta nota rejeitada?');
    if (confirmacao) {
      const motivoFinalizacao = prompt('Por favor, insira o motivo da finalização antecipada:');
      if (!motivoFinalizacao) {
        alert('É necessário informar um motivo para finalizar a nota.');
        return;
      }

      try {
        await db.updateNota(notaId, {
          status: 'Finalizada',
          timestampFinalizacao: new Date().toISOString(),
          observacaoCPD: motivoFinalizacao,
          finalizadaPorCPF: window.currentUser.cpf
        });
        alert('Nota finalizada com sucesso!');
        navigateTo('/cpd');
      } catch (error) {
        alert('Erro ao finalizar a nota: ' + error.message);
      }
    }
  };

  window.visualizarNota = async (notaId) => {
    const nota = await db.getNota(notaId);
    if (nota) {
      let fotosHTML = nota.fotosBase64.map(foto => `<img src="${foto}" style="max-width:200px; max-height:200px;">`).join('');

      document.getElementById('visualizacaoNota').innerHTML = `
        <h3>Visualização da Nota Fiscal</h3>
        ${fotosHTML}
        <p><strong>Data de Cadastro:</strong> ${new Date(nota.timestampCadastro).toLocaleString()}</p>
        <p><strong>Status Atual:</strong> ${nota.status}</p>
        ${nota.observacaoCPD ? `<p><strong>Observação Anterior:</strong> ${nota.observacaoCPD}</p>` : ''}
        <div id="notaControls">
          <label>
            <input type="radio" name="notaPronta" value="Sim" onchange="toggleObservacaoField(false)"> 
            Nota Pronta para Coleta (Sim)
          </label>
          <br>
          <label>
            <input type="radio" name="notaPronta" value="Nao" onchange="toggleObservacaoField(true)"> 
            Nota Pronta para Coleta (Não)
          </label>
          <div id="observacaoContainer" style="display: none;">
            <br>
            <label for="observacaoCPD">Motivo da Rejeição:</label>
            <textarea id="observacaoCPD" rows="4" cols="50" placeholder="Descreva o motivo da rejeição..."></textarea>
          </div>
          <br><br>
          <button onclick="atualizarStatusNota('${nota.id}')">Atualizar Status</button>
        </div>
      `;
    } else {
      document.getElementById('visualizacaoNota').innerHTML = `<p>Nota não encontrada.</p>`;
    }
  };

  window.toggleObservacaoField = (show) => {
    const container = document.getElementById('observacaoContainer');
    container.style.display = show ? 'block' : 'none';
  };

  window.atualizarStatusNota = async (notaId) => {
    const prontaParaColeta = document.querySelector('input[name="notaPronta"]:checked');
    if (!prontaParaColeta) {
      alert('Por favor, selecione se a nota está pronta ou não para coleta.');
      return;
    }

    const cpdResponsavelCPF = window.currentUser ? window.currentUser.cpf : null;

    if (prontaParaColeta.value === 'Nao') {
      const observacao = document.getElementById('observacaoCPD').value;
      if (!observacao) {
        alert('Por favor, descreva o motivo da rejeição.');
        return;
      }

      const confirmarRejeicao = confirm('Você tem certeza que deseja rejeitar esta nota?');
      if (!confirmarRejeicao) {
        return;
      }

      await db.rejectNota(notaId, cpdResponsavelCPF, observacao);
      alert('Nota rejeitada. O motorista será notificado do motivo.');
    } else {
      const confirmarAprovacao = confirm('Você tem certeza que deseja aprovar esta nota para conferência?');
      if (!confirmarAprovacao) {
        return;
      }

      await db.updateNota(notaId, {
        status: 'Em Aberto - Conferente',
        cpdResponsavelCPF: cpdResponsavelCPF
      });
      alert('Nota aprovada e enviada para conferência.');
    }

    navigateTo('/cpd');
  };
}