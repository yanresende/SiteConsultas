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
	<meta property="og:title" content="Busca Infos">
	<meta property="og:description" content="Site de buscas">
	<meta property="og:image" content="https://BuscaInfos.pro/public/assets/img/favicon.jpg">
	<meta property="og:url" content="https://BuscaInfos.pro">
	<meta property="og:type" content="website">
	<link rel="stylesheet" href="../assets/css/admin.css?v=<?php echo md5_file('../assets/css/admin.css'); ?>">
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
		<div id="creditoDisplay" style="margin: 10px 0; font-weight: bold;"></div>
		<button id="btnRecargaCredito" style="margin-bottom: 15px;">Fazer Recarga de Créditos</button>

		<h2>Painel de Administração</h2>

		<div class="tabs">
			<button class="tab-button active" data-tab="adicionar">Adicionar Usuário</button>
			<button class="tab-button" data-tab="usuarios">Usuários Cadastrados</button>
			<button class="tab-button" data-tab="remover">Remover Usuário</button>
			<button class="tab-button" data-tab="senha">Alterar Senha</button>
		</div>

		<div class="tab-content active" id="adicionar">
			<h3>Adicionar Novo Usuário</h3>
			<form id="userForm">
				<input type="text" id="newUser" placeholder="Nome de usuário" required>
				<input type="password" id="newPassword" placeholder="Senha" required>
				<select id="novoPlano" required>
					<option value="1">Pro (Creditos: 150,00)</option>
					<option value="2">Elite (Creditos: 225,00)</option>
					<option value="3">Pro Anual (Creditos: 1080,00)</option>
					<option value="4">Elite Anual (Creditos: 1620,00)</option>
				</select>
				<button type="submit">Cadastrar</button>
			</form>
			<p id="mensagemCadastro"></p>
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

		<div class="tab-content" id="senha">
			<h3>Alterar Senha do Usuário</h3>
			<form id="formAlterarSenha">
				<input type="text" id="usuarioSenha" placeholder="Nome de usuário" required>
				<input type="password" id="novaSenha" placeholder="Nova senha" required>
				<button type="submit">Alterar Senha</button>
			</form>
			<p id="mensagemSenha"></p>
		</div>

		<button onclick="window.location.href='login.php'">Sair</button>
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

		fetch("../backend/admin/getCredito.php")
			.then(response => response.json())
			.then(data => {
				if (data.success) {
					document.getElementById("creditoDisplay").textContent =
						`Crédito: R$ ${data.credito.toFixed(2)}`;
				}
			});
	</script>

	<script src="../assets/js/admin.js?v=<?php echo md5_file('../assets/js/admin.js'); ?>"></script>
</body>

</html>
