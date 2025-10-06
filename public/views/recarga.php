<?php
session_start();
require '../backend/config.php';

$tabela = isset($_SESSION['admin']) ? 'admin' : 'clientes';
$user_id = $_SESSION["usuario_id"] ?? null;

if (!$user_id) {
	header('Location: login.php');
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
		header("Location: login.php?erro=session_duplicada");
		exit();
	}
}
?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
	<meta charset="UTF-8">
	<title>Recarga de Saldo</title>
	<link rel="icon" href="../assets/img/favicon.png" type="image/png">
	<meta property="og:title" content="Busca Infos">
	<meta property="og:description" content="Site de buscas">
	<meta property="og:image" content="https://BuscaInfos.pro/public/assets/img/favicon.jpg">
	<meta property="og:url" content="https://BuscaInfos.pro">
	<meta property="og:type" content="website">
	<link rel="stylesheet" href="../assets/css/aM.css?v=<?php echo md5_file('../assets/css/aM.css'); ?>">
	<link rel="stylesheet" href="../assets/css/recarga.css?v=<?php echo md5_file('../assets/css/recarga.css'); ?>">
</head>

<body>

	<div class="card">
		<h2>Recarregar Saldo</h2>

		<form action="processar_recarga.php" method="POST">
			<label for="valor">Escolha o valor da recarga:</label>
			<select name="valor" id="valor" required>
				<option value="" disabled selected>Selecione um valor</option>
				<option value="20">R$ 20,00</option>
				<option value="30">R$ 30,00</option>
				<option value="50">R$ 50,00</option>
				<option value="100">R$ 100,00</option>
			</select>

			<button id="depositButton" type="button" class="recarga-btn">Confirmar Recarga</button>
		</form>
		<div id="resultDiv" class="resultado"></div>


		<a href="aM.php" class="voltar">← Voltar para área de membros</a>
	</div>
	<script>
		const currentUser = "<?php echo $_SESSION['usuario']; ?>";
	</script>
	<script src="../assets/js/pagamento.js?v=<?php echo md5_file('../assets/js/pagamento.js'); ?>"></script>
</body>

</html>
