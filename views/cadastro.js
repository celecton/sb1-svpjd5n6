import * as db from '../database.js';

export function renderCadastro(db) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h2>Cadastro</h2>
    <form id="cadastroForm">
      <label for="cpf">CPF:</label>
      <input type="text" id="cpf" name="cpf" placeholder="XXX.XXX.XXX-XX" required><br><br>
      <label for="nome">Nome:</label>
      <input type="text" id="nome" name="nome" required><br><br>
      <label for="telefone">Telefone:</label>
      <input type="text" id="telefone" name="telefone" required><br><br>
      <label for="funcao">Função:</label>
      <select id="funcao" name="funcao" disabled>
        <option value="motorista" selected>Motorista</option>
      </select>
      <input type="hidden" id="funcao" name="funcao" value="motorista"><br><br>
      <button type="submit">Cadastrar</button>
    </form>
    <p>Já tem uma conta? <a href="#" onclick="navigateTo('/login')">Entrar</a></p>
  `;

  const cpfInput = document.getElementById('cpf');

  cpfInput.addEventListener('input', function(event) {
    let value = event.target.value.replace(/\D/g, '');
    value = value.slice(0, 11); // Limita a 11 dígitos
    if (value.length > 3) {
      value = value.substring(0, 3) + '.' + value.substring(3);
    }
    if (value.length > 7) {
      value = value.substring(0, 7) + '.' + value.substring(7);
    }
    if (value.length > 11) {
      value = value.substring(0, 11) + '-' + value.substring(11);
    }
    event.target.value = value;
  });

  document.getElementById('cadastroForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    try {
      const cpf = document.getElementById('cpf').value;
      const nome = document.getElementById('nome').value;
      const telefone = document.getElementById('telefone').value;
      const funcao = 'motorista'; // Valor fixo

      // Validar o formato do CPF antes de cadastrar
      const cpfPattern = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (!cpfPattern.test(cpf)) {
        alert('Formato de CPF inválido. Use o formato XXX.XXX.XXX-XX.');
        return;
      }

      if (cpf.replace(/\D/g, '').length !== 11) {
        alert('O CPF deve conter 11 dígitos.');
        return;
      }

      // Verificar se o usuário já existe
      const existingUser = await db.findUserByCPF(cpf);
      if (existingUser) {
        alert('CPF já cadastrado.');
        return;
      }

      // Criar o novo usuário
      const newUser = {
        cpf,
        nome,
        telefone,
        funcao
      };

      await db.createUser(newUser);
      alert('Usuário cadastrado com sucesso!');
      navigateTo('/login');
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      alert('Erro ao cadastrar usuário. Por favor, tente novamente.');
    }
  });
}