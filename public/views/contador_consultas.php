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
	<title>Painel de Consultas</title>
	<link rel="icon" href="../assets/img/favicon.png" type="image/png">
	<meta property="og:title" content="New Max Buscas">
	<meta property="og:description" content="Site de buscas">
	<meta property="og:image" content="https://newmaxbuscas.pro/public/assets/img/favicon.jpg">
	<meta property="og:url" content="https://newmaxbuscas.pro">
	<meta property="og:type" content="website">
	<link rel="icon" href="../assets/img/favicon.png" type="image/png">
	<link rel="stylesheet" href="../assets/css/contador_consultas.css?v=<?php echo md5_file('../assets/css/contador_consultas.css'); ?>">
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
		<h2>Painel de Consultas</h2>

		<div class="consultas-tabs">
		</div>
		<div class="filtro-periodo">
			<h3>Consultar Período Personalizado</h3>
			<label>Data Início:
				<input type="date" id="dataInicio">
			</label>
			<label>Data Fim:
				<input type="date" id="dataFim">
			</label>
			<button onclick="consultarPeriodo()">Buscar</button>
		</div>

		<div class="resultado-periodo"></div>
	</div>

	<script src="../assets/js/contador_consultas.js?v=<?php echo md5_file('../assets/js/contador_consultas.js'); ?>"></script>

</body>

</html>
