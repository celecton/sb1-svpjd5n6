import * as db from '../database.js';

export function renderChefe(db) {
  const app = document.getElementById('app');
  const userName = window.currentUser ? window.currentUser.nome : 'Usuário';
  const userFuncao = window.currentUser ? window.currentUser.funcao : 'Chefe';

  const renderTable = async (status = 'all') => {
    const notas = await db.getAllNotas();
    let filteredNotas = notas;

    if (status !== 'all') {
      filteredNotas = notas.filter(nota => {
        if (status === 'aberto') return nota.status.includes('Em Aberto');
        if (status === 'rejeitado') return nota.status.includes('Rejeitada');
        if (status === 'finalizado') return nota.status === 'Finalizada';
        return true;
      });
    }

    Promise.all(filteredNotas.map(async nota => {
      try {
        const conferente = await db.findUserByCPF(nota.finalizadaPorCPF);
        const cpd = await db.findUserByCPF(nota.cpdResponsavelCPF);

        return `
          <tr>
            <td>${nota.id}</td>
            <td>${nota.empresaDestino}</td>
            <td>${nota.numeroNota}</td>
            <td>${nota.status}</td>
            <td>${new Date(nota.timestampCadastro).toLocaleString()}</td>
            <td>${nota.timestampFinalizacao ? new Date(nota.timestampFinalizacao).toLocaleString() : 'Pendente'}</td>
            <td>${conferente ? conferente.nome : 'N/A'}</td>
            <td>${cpd ? cpd.nome : 'N/A'}</td>
            <td>${nota.observacao || 'N/A'}</td>
            <td><button onclick="visualizarDetalhes('${nota.id}')">Detalhes</button></td>
          </tr>
        `;
      } catch (error) {
        console.error("Erro ao processar nota:", error);
        return `<tr><td colspan="10">Erro ao carregar detalhes da nota.</td></tr>`;
      }
    })).then(notasHTML => {
      document.getElementById('tabelaNotas').innerHTML = notasHTML.join('');
    });
  };

  app.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h2>Bem-vindo, ${userName}! (${userFuncao})</h2>
        <h2>Chefe - Visão Geral das Notas Fiscais</h2>
      </div>
      <button onclick="window.location.href='/'" style="height: 40px; padding: 0 20px; cursor: pointer;">Voltar para Login</button>
    </div>
    <div class="filter-container">
      <select id="statusFilter">
        <option value="all">Todas as Notas</option>
        <option value="aberto">Notas Em Aberto</option>
        <option value="rejeitado">Notas Rejeitadas</option>
        <option value="finalizado">Notas Finalizadas</option>
      </select>
      <button onclick="applyFilter()">Filtrar</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Loja</th>
          <th>Número da Nota</th>
          <th>Status</th>
          <th>Data de Cadastro</th>
          <th>Data de Finalização</th>
          <th>Finalizado Por</th>
          <th>CPD Responsável</th>
          <th>Observação</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody id="tabelaNotas">
      </tbody>
    </table>
    <div id="detalhesNota"></div>
  `;

  window.applyFilter = () => {
    const filterValue = document.getElementById('statusFilter').value;
    renderTable(filterValue);
  };

  // Initial render
  renderTable();

  window.visualizarDetalhes = async (notaId) => {
    const nota = await db.getNota(notaId);
    if (nota) {
      let detalhesHTML = `
        <h3>Detalhes da Nota Fiscal ${nota.numeroNota}</h3>
        <p><strong>ID:</strong> ${nota.id}</p>
        <p><strong>CNPJ:</strong> ${nota.cnpj}</p>
        <p><strong>Nome da Empresa:</strong> ${nota.nomeEmpresa}</p>
        <p><strong>Empresa Destino:</strong> ${nota.empresaDestino}</p>
        <p><strong>Número da Nota:</strong> ${nota.numeroNota}</p>
        <p><strong>Perecível:</strong> ${nota.perecivel}</p>
        <p><strong>Temperatura:</strong> ${nota.temperatura || 'N/A'}</p>
        <p><strong>Observação (Motorista):</strong> ${nota.observacao || 'N/A'}</p>
        <p><strong>Observação (Conferente):</strong> ${nota.observacaoConferente || 'N/A'}</p>
        ${nota.status === 'Finalizada' && nota.observacaoCPD ? 
          `<p><strong style="color: red;">Motivo da Finalização pelo CPD:</strong> ${nota.observacaoCPD}</p>` : ''}
        <p><strong>Status:</strong> ${nota.status}</p>
        <p><strong>Data de Cadastro:</strong> ${new Date(nota.timestampCadastro).toLocaleString()}</p>
        <p><strong>Data de Finalização:</strong> ${nota.timestampFinalizacao ? new Date(nota.timestampFinalizacao).toLocaleString() : 'Pendente'}</p>
      `;

      try {
        const conferente = await db.findUserByCPF(nota.finalizadaPorCPF);
        if (conferente) {
          detalhesHTML += `<p><strong>Finalizado Por:</strong> ${conferente.nome}</p>`;
        } else {
          detalhesHTML += `<p><strong>Finalizado Por:</strong> N/A</p>`;
        }
      } catch (error) {
        console.error("Erro ao buscar conferente:", error);
        detalhesHTML += `<p><strong>Finalizado Por:</strong> Erro ao carregar</p>`;
      }

      try {
        const cpd = await db.findUserByCPF(nota.cpdResponsavelCPF);
        if (cpd) {
          detalhesHTML += `<p><strong>CPD Responsável:</strong> ${cpd.nome}</p>`;
        } else {
          detalhesHTML += `<p><strong>CPD Responsável:</strong> N/A</p>`;
        }
      } catch (error) {
        console.error("Erro ao buscar CPD:", error);
        detalhesHTML += `<p><strong>CPD Responsável:</strong> Erro ao carregar</p>`;
      }

      document.getElementById('detalhesNota').innerHTML = detalhesHTML;
    } else {
      document.getElementById('detalhesNota').innerHTML = `<p>Nota não encontrada.</p>`;
    }
  };
}