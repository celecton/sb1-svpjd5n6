import * as db from '../database.js';

export function renderConferente(db) {
  const app = document.getElementById('app');
  const userName = window.currentUser ? window.currentUser.nome : 'Usuário';
  const userFuncao = window.currentUser ? window.currentUser.funcao : 'Conferente';

  Promise.all([
    db.getNotasByStatus('Em Aberto - Conferente'),
    db.getNotasByStatus('Finalizada'),
    db.getNotasByStatus('Rejeitada - CPD')
  ]).then(([notasEmAberto, notasFinalizadas, notasRejeitadas]) => {
    const allNotas = [...notasEmAberto, ...notasFinalizadas, ...notasRejeitadas];
    let notas = allNotas;

    const filterNotas = (status) => {
      if (status === 'todas') {
        notas = allNotas;
      } else {
        notas = allNotas.filter(nota => {
          if (status === 'em_aberto') return nota.status === 'Em Aberto - Conferente';
          if (status === 'rejeitadas') return nota.status === 'Rejeitada - CPD';
          if (status === 'finalizadas') return nota.status === 'Finalizada';
          return true;
        });
      }
      renderNotas();
    };

    const renderNotas = () => {
      notas.sort((a, b) => {
      if (a.perecivel === 'Sim' && b.perecivel !== 'Sim') return -1; // 'a' comes first
      if (a.perecivel !== 'Sim' && b.perecivel === 'Sim') return 1; // 'b' comes first
      return 0; // no change
    });
    let notasHTML = notas.map(nota => `
      <li class="${nota.perecivel === 'Sim' ? 'priority' : ''}">
        <strong>Loja:</strong> ${nota.empresaDestino}, <strong>Nota:</strong> ${nota.numeroNota}
        <button onclick="visualizarNota('${nota.id}')">Visualizar</button>
      </li>
    `).join('');

    app.innerHTML = `
      <h2>Bem-vindo, ${userName}! (${userFuncao})</h2>
      <h2>Conferente - Notas Fiscais para Conferência</h2>
      <div class="filter-buttons">
        <button onclick="window.filterNotas('todas')">Todas as Notas</button>
        <button onclick="window.filterNotas('em_aberto')">Notas em Aberto</button>
        <button onclick="window.filterNotas('rejeitadas')">Notas Rejeitadas</button>
        <button onclick="window.filterNotas('finalizadas')">Notas Finalizadas</button>
      </div>
      <ul id="listaNotas">${notasHTML.length ? notasHTML : '<li>Não há notas pendentes no momento.</li>'}</ul>
      <div id="visualizacaoNota"></div>
      <button onclick="navigateTo('/login')">Voltar para Login</button>
    `;

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
  });
}