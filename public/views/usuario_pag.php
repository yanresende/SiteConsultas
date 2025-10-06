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
	<title>Página do Usuário</title>
	<link rel="icon" href="../assets/img/favicon.png" type="image/png">
	<meta property="og:title" content="Busca Brasil">
	<meta property="og:description" content="Site de buscas">
	<meta property="og:image" content="https://buscabrasil.online/public/assets/img/favicon.jpg">
	<meta property="og:url" content="https://buscabrasil.online">
	<meta property="og:type" content="website">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
	<link rel="stylesheet" href="../assets/css/usuario_pag.css?v=<?php echo md5_file('../assets/css/usuario_pag.css'); ?>">
</head>

<body>

	<div class="card" id="usuario-card">
		<div class="loader"></div>
		<p>Carregando dados do usuário...</p>
	</div>

	<script src="../assets/js/usuario_pag.js?v=<?php echo md5_file('../assets/js/usuario_pag.js'); ?>"></script>

</body>

</html>
