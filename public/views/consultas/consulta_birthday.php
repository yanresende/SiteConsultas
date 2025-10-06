<?php
session_start();
require '../../backend/config.php';

$tabela = isset($_SESSION['admin']) ? 'admin' : 'clientes';
$user_id = $_SESSION["usuario_id"] ?? null;

if (!$user_id) {
	header('Location: ../login.php');
	exit();
}

// Verifica se a conta permite múltiplos logins
$sql = "SELECT session_id, compartilhado FROM $tabela WHERE id = ?";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
	$row = $result->fetch_assoc();

	// Se NÃO permite multilogin e a session não bate, derruba
	if (!$row["compartilhado"] && $row["session_id"] !== session_id()) {
		session_destroy();
		header("Location: ../login.php?erro=session_duplicada");
		exit();
	}
}
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Painel de Consulta</title>
	<link rel="icon" href="../../assets/img/favicon.png" type="image/png">
	<meta property="og:title" content="Busca Infos">
	<meta property="og:description" content="Site de buscas">
	<meta property="og:image" content="https://BuscaInfos.online/public/assets/img/favicon.jpg">
	<meta property="og:url" content="https://BuscaInfos.online">
	<meta property="og:type" content="website">
	<link rel="stylesheet" href="../../assets/css/consultas.css?v=<?php echo md5_file('../../assets/css/consultas.css'); ?>">
	<script>
		fetch("../../backend/verifica_sessao.php")
			.then(response => response.json())
			.then(data => {
				if (!data.autenticado) {
					window.location.href = "../login.php";
				}
			})
			.catch(error => {
				console.error("Erro ao verificar sessão:", error);
				window.location.href = "../login.php";
			});
	</script>
</head>

<body>
	<div class="container">
		<div class="logo-container">
			<img class="logo" src="../../assets/img/busca_brasil_icone.png" alt="Logo do Cliente">
		</div>
		<h2>Consulta Data de Nascimento</h2>
		<input type="text" id="data" placeholder="Digite a Data de Nascimento" oninput="formatData(this)" maxlength="10"
			inputmode="numeric">
		<button id="consultarBtn" onclick="consultarData()" disabled>Consultar</button>

		<!-- Turnstile CAPTCHA -->
		<div class="cf-turnstile" id="captcha" data-sitekey="0x4AAAAAABCUfVi2iZQzzgzx" data-callback="onCaptchaSuccess">
		</div>

		<input type="hidden" id="captcha-response" name="cf-turnstile-response">

		<p id="resultado"></p>

		<div id="dados" class="dados" style="display: none;"></div>

		<!-- Botões de ação -->
		<div id="acoes" style="display: none; margin-top: 20px;">
			<button onclick="copiarDados()">Copiar Dados</button>
			<button style="margin-top: 20px;" onclick="baixarPDF()">Baixar em PDF</button>
			<button style="margin-top: 20px;" onclick="baixarTXT()">Baixar em TXT</button>
		</div>

	</div>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
	<script src="../../assets/js/consultas/consulta_birthday.js?v=<?php echo md5_file('../../assets/js/consultas/consulta_birthday.js'); ?>"></script>
	<script src="../../assets/js/consultas/baixar_consultas.js?v=<?php echo md5_file('../../assets/js/consultas/baixar_consultas.js'); ?>"></script>
</body>

</html>
