export function renderLogin(db) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h2>Login</h2>
    <form id="loginForm">
      <label for="cpf">CPF:</label>
      <input type="text" id="cpf" name="cpf" placeholder="XXX.XXX.XXX-XX" required><br><br>
      <button type="submit">Entrar</button>
    </form>
    <p>Não tem uma conta? <a href="#" onclick="navigateTo('/cadastro')">Cadastre-se</a></p>
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

  document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const cpf = document.getElementById('cpf').value;
    if (cpf.replace(/\D/g, '').length !== 11) {
      alert('O CPF deve conter 11 dígitos.');
      return;
    }

    if (cpf === '999.999.999-99') {
      app.innerHTML = `
        <h2>Cadastro (Admin)</h2>
        <form id="cadastroForm">
          <label for="cpf">CPF:</label>
          <input type="text" id="cpf" name="cpf" required><br><br>
          <label for="nome">Nome:</label>
          <input type="text" id="nome" name="nome" required><br><br>
          <label for="telefone">Telefone:</label>
          <input type="text" id="telefone" name="telefone" required><br><br>
          <label for="funcao">Função:</label>
          <select id="funcao" name="funcao">
            <option value="motorista">Motorista</option>
            <option value="cpd">CPD</option>
            <option value="conferente">Conferente</option>
            <option value="chefe">Chefe</option>
          </select><br><br>
          <button type="submit">Cadastrar</button>
        </form>
        <p>Já tem uma conta? <a href="#" onclick="navigateTo('/login')">Entrar</a></p>
      `;

      document.getElementById('cadastroForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const cpf = document.getElementById('cpf').value;
        const nome = document.getElementById('nome').value;
        const telefone = document.getElementById('telefone').value;
        const funcao = document.getElementById('funcao').value;
        if (cpf.replace(/\D/g, '').length !== 11) {
          alert('O CPF deve conter 11 dígitos.');
          return;
        }

        const existingUser = await db.findUserByCPF(cpf);
        if (existingUser) {
          alert('CPF já cadastrado.');
          return;
        }

        const newUser = {
          cpf,
          nome,
          telefone,
          funcao
        };
        await db.createUser(newUser);
        alert('Usuário cadastrado com sucesso!');
        navigateTo('/login');
      });
      return;
    }

    const user = await db.findUserByCPF(cpf);

    if (user) {
      window.currentUser = user; // Store user information globally
      
      const rolesRequiringPassword = ['cpd', 'conferente', 'chefe'];
      
      if (rolesRequiringPassword.includes(user.funcao)) {
        const senha = prompt('Digite a senha para acessar:');
        if (senha !== '1234') {
          alert('Senha incorreta!');
          return;
        }
      }

      alert(`Bem-vindo, ${user.nome}! (${user.funcao})`);
      // Redireciona com base na função do usuário
      switch (user.funcao) {
        case 'motorista':
          navigateTo('/motorista');
          break;
        case 'cpd':
          navigateTo('/cpd');
          break;
        case 'conferente':
          navigateTo('/conferente');
          break;
        case 'chefe':
          navigateTo('/chefe');
          break;
        default:
          alert('Função de usuário desconhecida.');
      }
    } else {
      alert('Usuário não encontrado. Verifique o CPF ou cadastre-se.');
    }
  });
}