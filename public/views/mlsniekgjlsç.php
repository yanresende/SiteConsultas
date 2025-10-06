<?php
session_start();
require '../backend/config.php';

$tabela = isset($_SESSION['admin']) ? 'admin' : 'clientes';
$user_id = $_SESSION["usuario_id"] ?? null;

if (!$user_id) {
	header('Location: login.php');
	exit();
}

// Agora buscamos também o vendedor_id
$sql = "SELECT session_id, vendedor_id FROM $tabela WHERE id = ?";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
	$row = $result->fetch_assoc();
	if ($row["session_id"] !== session_id()) {
		session_destroy();
		header("Location: login.php?erro=session_duplicada");
		exit();
	}

	// Armazena o vendedor_id na sessão se for admin
	if (isset($_SESSION['admin']) && isset($row["vendedor_id"])) {
		$_SESSION["vendedor_id"] = $row["vendedor_id"];
	}
}
?>

<!DOCTYPE html>
<html lang="pt-BR">

<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Painel de Administração</title>
	<link rel="icon" href="../assets/img/favicon.png" type="image/png">
	<meta property="og:title" content="New Max Buscas">
	<meta property="og:description" content="Site de buscas">
	<meta property="og:image" content="https://newmaxbuscas.pro/public/assets/img/favicon.jpg">
	<meta property="og:url" content="https://newmaxbuscas.pro">
	<meta property="og:type" content="website">
	<link rel="icon" href="../assets/img/favicon.png" type="image/png">
	<link rel="stylesheet" href="../assets/css/mlsniekgjlsç.css?v=<?php echo md5_file('../assets/css/mlsniekgjlsç.css'); ?>">
	<script>
		fetch("../backend/verifica_sessao.php")
			.then((response) => response.json())
			.then((data) => {
				if (!data.autenticado) {
					window.location.href = "login.php"; // Redireciona se não estiver autenticado
				}
			})
			.catch((error) => {
				console.error("Erro ao verificar sessão:", error);
				window.location.href = "login.php"; // Opcional: Redireciona em caso de erro
			});
	</script>
</head>

<body>
	<div class="admin-container">

		<button onclick="window.location.href='contador_consultas.php'" class="btn-contador">
			Acessar Painel de Consultas
		</button>

		<h2>Painel de Administração</h2>

		<div class="tabs">
			<button class="tab-button active" data-tab="adicionar">Adicionar Usuário</button>
			<button class="tab-button" data-tab="admin">Adicionar Admin</button>
			<button class="tab-button" data-tab="usuarios">Usuários Cadastrados</button>
			<button class="tab-button" data-tab="remover">Remover Usuário</button>
			<button class="tab-button" data-tab="status">Alterar Status</button>
			<button class="tab-button" data-tab="vendedor">Mudar Vendedor</button>
			<button class="tab-button" data-tab="senha">Alterar Senha</button>
			<button class="tab-button" data-tab="plano">Alterar Plano</button>
			<button class="tab-button" data-tab="credito">Adicionar Credito</button>
			<button class="tab-button" data-tab="data">Alterar Data Vencimento</button>
		</div>

		<div class="tab-content active" id="adicionar">
			<h3>Adicionar Novo Usuário</h3>
			<form id="userForm">
				<input type="text" id="newUser" placeholder="Nome de usuário" required>
				<input type="password" id="newPassword" placeholder="Senha" required>
				<input type="number" id="vendedorCadastro" placeholder="Id vendedor" required>
				<select id="novoPlanoCad" required>
					<option value="1">Pro</option>
					<option value="2">Elite</option>
					<option value="3">Pro Anual</option>
					<option value="4">Elite Anual</option>
				</select>
				<button type="submit">Cadastrar</button>
			</form>
			<p id="mensagemCadastro"></p>
		</div>

		<div class="tab-content" id="admin">
			<h3>Adicionar Novo Admin</h3>
			<form id="adminUserForm">
				<input type="text" id="newAdmin" placeholder="Usuario" required>
				<input type="password" id="newPasswordAdmin" placeholder="Senha" required>
				<input type="text" id="newNomeVendedor" placeholder="Nome Vendedor" required>
				<input type="number" id="newTelVendedor" placeholder="Telefone Vendedor" required>
				<input type="number" id="newCreditoVendedor" placeholder="Credito Vendedor" required>
				<button type="submit">Cadastrar</button>
			</form>
			<p id="mensagemCadastroAdmin"></p>
		</div>

		<div class="tab-content" id="usuarios">
			<h3>Usuários Cadastrados</h3>

			<!-- Resumo em cards -->
			<div id="resumoPlanos" class="cards-container"></div>

			<ul id="userList"></ul>
		</div>


		<div class="tab-content" id="remover">
			<h3>Remover Usuário</h3>
			<form id="removeUserForm">
				<input type="text" id="removeUser" placeholder="Nome de usuário" required>
				<button type="submit">Remover</button>
			</form>
			<p id="mensagemRemocao"></p>
		</div>

		<div class="tab-content" id="status">
			<h3>Alterar Status do Usuário</h3>
			<form id="formAlterarStatus">
				<input type="text" id="statusUsername" placeholder="Nome de usuário" required>
				<select id="statusSelect" required>
					<option value="">Selecione o status</option>
					<option value="ativo">Ativo</option>
					<option value="inativo">Inativo</option>
				</select>
				<button type="submit">Alterar Status</button>
			</form>
			<p id="mensagemStatus"></p>
		</div>

		<div class="tab-content" id="vendedor">
			<h3>Mudar Vendedor</h3>
			<form id="formMudarVendedor">
				<input type="text" id="clienteNome" placeholder="Nome do cliente" required>
				<input type="number" id="novoVendedorId" placeholder="ID do novo vendedor" required>
				<button type="submit">Atualizar Vendedor</button>
			</form>
			<p id="mensagemMudarVendedor"></p>
		</div>

		<div class="tab-content" id="senha">
			<h3>Alterar Senha do Usuário</h3>
			<form id="formAlterarSenha">
				<input type="text" id="usuarioSenha" placeholder="Nome de usuário" required>
				<input type="password" id="novaSenha" placeholder="Nova senha" required>
				<button type="submit">Alterar Senha</button>
			</form>
			<p id="mensagemSenha"></p>
		</div>

		<div class="tab-content" id="data">
			<h3>Mudar Data vecimento</h3>
			<form id="formMudarData">
				<input type="text" id="clienteNomeData" placeholder="Nome do cliente" required>
				<input type="number" id="novaData" placeholder="Dias a mais" required>
				<button type="submit">Atualizar Data Plano</button>
			</form>
			<p id="mensagemMudarData"></p>
		</div>

		<div class="tab-content" id="plano">
			<h3>Alterar Plano do Usuário</h3>
			<form id="formAlterarPlano">
				<input type="text" id="usuarioPlano" placeholder="Nome de usuário" required>
				<select id="novoPlano" required>
					<option value="1">Pro</option>
					<option value="2">Elite</option>
					<option value="3">Pro Anual</option>
					<option value="4">Elite Anual</option>
				</select>
				<button type="submit">Alterar Plano</button>
			</form>
			<p id="mensagemPlano"></p>
		</div>

		<div class="tab-content" id="credito">
			<h3>Adicionar Credito</h3>
			<form id="creditoForm">
				<input type="number" id="newCredito" placeholder="Novo Credito" required>
				<input type="number" id="vendedorCredito" placeholder="Id vendedor" required>
				<button type="submit">Adicionar</button>
			</form>
			<p id="mensagemCreditoAdmin"></p>
		</div>

		<button onclick="window.location.href='../backend/logout.php'">Sair</button>

	</div>

	<div id="toast" class="toast"></div>

	<div id="infoModal" class="modal hidden">
		<div class="modal-content">
			<span id="closeModal" class="close">&times;</span>
			<h2>Cadastro realizado com sucesso!</h2>
			<p><strong>ID do Vendedor:</strong> <span id="modalVendedorId"></span></p>
			<p><strong>Link de Venda:</strong> <span id="modalLinkVenda"></span></p>
			<p><strong>Usuário Visitante:</strong> <span id="modalVisitanteUser"></span></p>
			<p><strong>Senha:</strong> <span id="modalVisitanteSenha">123</span></p>
		</div>
	</div>

	<script>
		const tabs = document.querySelectorAll('.tab-button');
		const contents = document.querySelectorAll('.tab-content');

		tabs.forEach(tab => {
			tab.addEventListener('click', () => {
				tabs.forEach(t => t.classList.remove('active'));
				contents.forEach(c => c.classList.remove('active'));

				tab.classList.add('active');
				document.getElementById(tab.dataset.tab).classList.add('active');
			});
		});
	</script>

	<script src="../assets/js/mlsniekgjlsç.js?v=<?php echo md5_file('../assets/js/mlsniekgjlsç.js'); ?>"></script>
</body>

</html>
