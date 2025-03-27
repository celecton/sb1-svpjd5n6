import * as db from '../database.js';

export function renderMotorista(db) {
  const app = document.getElementById('app');
  const userName = window.currentUser ? window.currentUser.nome : 'Usuário';
  const userFuncao = window.currentUser ? window.currentUser.funcao : 'Motorista';
  const motoristaCPF = window.currentUser ? window.currentUser.cpf : null;

  // Primeiro, verificamos se há notas rejeitadas para este motorista
  db.getNotasByStatus('Rejeitada - CPD').then(notasRejeitadas => {
    // Filtramos apenas as notas deste motorista
    const minhasNotasRejeitadas = notasRejeitadas.filter(nota => nota.cpf === motoristaCPF);
    
    let notasRejeitadasHTML = '';
    if (minhasNotasRejeitadas.length > 0) {
      notasRejeitadasHTML = `
        <h3>Notas Rejeitadas pelo CPD</h3>
        <p>As seguintes notas foram rejeitadas e precisam ser corrigidas:</p>
        <ul id="listaNotasRejeitadas">
          ${minhasNotasRejeitadas.map(nota => `
            <li>
              <strong>Loja:</strong> ${nota.empresaDestino}, 
              <strong>Nota:</strong> ${nota.numeroNota}
              <button onclick="visualizarNotaRejeitada('${nota.id}')">Visualizar</button>
            </li>
          `).join('')}
        </ul>
        <div id="visualizacaoNotaRejeitada"></div>
      `;
    }

    app.innerHTML = `
      <h2>Bem-vindo, ${userName}! (${userFuncao})</h2>
      
      ${notasRejeitadasHTML}
      
      <h2>Motorista - Cadastro de Notas Fiscais</h2>

      <h3>Aviso Importante:</h3>
      <p>NECESSÁRIO TIRAR A FOTO DA NOTA INTEIRA DE FORMA LEGÍVEL - SE FOREM VÁRIAS NOTAS, FAÇA MAIS DE UM AGENDAMENTO</p>

      <form id="notaFiscalForm">
        <label for="cnpj">CNPJ:</label>
        <input type="text" id="cnpj" name="cnpj" required><br><br>
        <label for="nomeEmpresa">Nome da Empresa:</label>
        <input type="text" id="nomeEmpresa" name="nomeEmpresa" required><br><br>
        <label for="empresaDestino">Empresa Destino:</label>
        <select id="empresaDestino" name="empresaDestino">
          <option value="Loja 01 ST Sul">Loja 01 ST Sul</option>
          <option value="Loja 02 Vila Verde">Loja 02 Vila Verde</option>
          <option value="Loja 03 Formosinha">Loja 03 Formosinha</option>
          <option value="Loja 04 JD Triangulo">Loja 04 JD Triangulo</option>
        </select><br><br>
        <label for="numeroNota">Número da Nota:</label>
        <input type="number" id="numeroNota" name="numeroNota" required><br><br>
        <label for="notaFiscal">Nota Fiscal (Fotos):</label>
        <input type="file" id="notaFiscal" name="notaFiscal" multiple accept="image/*" required><br>
        <label for="perecivel">Perecível:</label>
        <select id="perecivel" name="perecivel">
          <option value="Nao">Não</option>
          <option value="Sim">Sim</option>
        </select><br><br>
       
        <label for="observacao">Observação:</label>
        <textarea id="observacao" name="observacao"></textarea><br><br>
        <button type="submit">Cadastrar Nota Fiscal</button>
      </form>

      <h3>Informações Importantes:</h3>
      <ul>
        <li>HORÁRIO DE FUNCIONAMENTO DAS 08:00 AS 12:00 E DAS 13:00 AS 17:00</li>
        <li>AOS SÁBADOS E FERIADOS DAS 08:00 AS 11:00</li>
        <li>TERÃO PRIORIDADE CARGA E DESCARGA VEÍCULOS DA FROTA TEM</li>
        <li>TERÃO PRIORIDADE ATÉ AS (12:00) MEIO DIA AS CARGAS DE PERECÍVEIS</li>
        <li>AS DEMAIS SEGUIRÃO A DESCARGA POR ORDEM DE CHEGADA X CHAMADA</li>
        <li>VERIFIQUE SUA POSIÇÃO NA FILA ANTES DE SAIR, CASO SEJA CHAMADO E NÃO ESTEJA PRESENTE, VAI SER CHAMADO O PRÓXIMO, E VOCÊ VAI PARA O FINAL DA FILA.</li>
      </ul>
    `;

    // Função para visualizar nota rejeitada
    window.visualizarNotaRejeitada = async (notaId) => {
      const nota = await db.getNota(notaId);
      if (nota) {
        let fotosHTML = nota.fotosBase64.map(foto => `<img src="${foto}" style="max-width:200px; max-height:200px;">`).join('');

        document.getElementById('visualizacaoNotaRejeitada').innerHTML = `
          <h3>Nota Rejeitada</h3>
          ${fotosHTML}
          <p><strong>Empresa:</strong> ${nota.nomeEmpresa}</p>
          <p><strong>Destino:</strong> ${nota.empresaDestino}</p>
          <p><strong>Número da Nota:</strong> ${nota.numeroNota}</p>
          <p><strong>Perecível:</strong> ${nota.perecivel}</p>
          <p><strong>Motivo da Rejeição:</strong> ${nota.observacaoCPD || 'Não especificado'}</p>
          
          <h4>Corrigir Nota</h4>
          <form id="corrigirNotaForm">
            <label for="notaFiscalCorrigida">Nova Foto da Nota Fiscal:</label>
            <input type="file" id="notaFiscalCorrigida" name="notaFiscalCorrigida" multiple accept="image/*"><br><br>
            
            <label for="observacaoCorrigida">Observação Adicional:</label>
            <textarea id="observacaoCorrigida" name="observacaoCorrigida">${nota.observacao || ''}</textarea><br><br>
            
            <button type="button" onclick="reenviarNota('${nota.id}')">Reenviar Nota Corrigida</button>
          </form>
        `;
      }
    };

    // Função para reenviar nota corrigida
    window.reenviarNota = async (notaId) => {
      const notaFiscalInput = document.getElementById('notaFiscalCorrigida');
      const observacaoCorrigida = document.getElementById('observacaoCorrigida').value;
      
      // Verificar se há novas fotos
      let fotosBase64 = [];
      if (notaFiscalInput.files.length > 0) {
        // Converter novas fotos para Base64
        for (let i = 0; i < notaFiscalInput.files.length; i++) {
          const file = notaFiscalInput.files[i];
          const base64 = await toBase64(file);
          fotosBase64.push(base64);
        }
      } else {
        // Se não houver novas fotos, obter a nota original para manter as fotos existentes
        const notaOriginal = await db.getNota(notaId);
        fotosBase64 = notaOriginal.fotosBase64;
      }
      
      // Atualizar a nota
      await db.updateNota(notaId, {
        status: 'Em Aberto - Motorista',
        observacao: observacaoCorrigida,
        fotos: fotosBase64,
        timestampRejeicao: null,
        observacaoCPD: null
      });
      
      alert('Nota corrigida e reenviada com sucesso!');
      navigateTo('/motorista'); // Recarregar a página
    };

    const cnpjInput = document.getElementById('cnpj');
    const nomeEmpresaInput = document.getElementById('nomeEmpresa');
    const notaFiscalForm = document.getElementById('notaFiscalForm');

    // Formatar CNPJ enquanto digita
    cnpjInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 14) value = value.slice(0, 14);
      
      if (value.length > 12) value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      else if (value.length > 8) value = value.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3/');
      else if (value.length > 5) value = value.replace(/(\d{2})(\d{3})/, '$1.$2.');
      else if (value.length > 2) value = value.replace(/(\d{2})/, '$1.');
      
      e.target.value = value;
    });

    // Buscar empresa quando CNPJ for preenchido
    cnpjInput.addEventListener('blur', async function() {
      const cnpj = cnpjInput.value;
      if (cnpj) {
        try {
          const company = await db.findCompanyByCNPJ(cnpj);
          if (company) {
            nomeEmpresaInput.value = company.nome;
          }
        } catch (error) {
          console.error('Erro ao buscar empresa:', error);
        }
      }
    });

    notaFiscalForm.addEventListener('submit', async function(event) {
      event.preventDefault();

      try {
        const cnpj = cnpjInput.value;
        const nomeEmpresa = nomeEmpresaInput.value;
        const empresaDestino = document.getElementById('empresaDestino').value;
        const numeroNota = document.getElementById('numeroNota').value;
        const notaFiscalInput = document.getElementById('notaFiscal');
        const perecivel = document.getElementById('perecivel').value;
        const observacao = document.getElementById('observacao').value;
        
        // Verificar se todos os campos obrigatórios estão preenchidos
        if (!cnpj || !nomeEmpresa || !empresaDestino || !numeroNota || !notaFiscalInput.files.length) {
          alert('Por favor, preencha todos os campos obrigatórios.');
          return;
        }

        const files = notaFiscalInput.files;
        const fotosBase64 = [];

        // Converte as imagens para Base64
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const base64 = await toBase64(file);
          fotosBase64.push(base64);
        }

        // Salvar a empresa se ainda não existir
        const existingCompany = await db.findCompanyByCNPJ(cnpj);
        if (!existingCompany) {
          await db.createCompany({
            cnpj,
            nome: nomeEmpresa
          });
        }

        // Capture the current user's CPF
        const motoristaCPF = window.currentUser ? window.currentUser.cpf : null;

        const novaNota = {
          cnpj,
          nomeEmpresa,
          empresaDestino,
          numeroNota,
          fotosBase64,
          perecivel,
          observacao,
          cpf: motoristaCPF
        };

        const notaId = await db.createNota(novaNota);
        alert('Nota Fiscal cadastrada com sucesso!');
        notaFiscalForm.reset();
      } catch (error) {
        console.error('Erro ao cadastrar nota:', error);
        alert('Erro ao cadastrar nota fiscal. Por favor, tente novamente.');
      }
    });
  });

  // Função auxiliar para converter arquivo para Base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
}