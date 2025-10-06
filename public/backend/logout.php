<?php

session_start();
require 'config.php';

$tabela = isset($_SESSION['admin']) ? 'admin' : 'clientes';
$user_id = $_SESSION["usuario_id"] ?? null;

if ($user_id) {
	$stmt = $conexao->prepare("UPDATE $tabela SET session_id = NULL WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
}

session_destroy();
header("Location: ../views/login.php");
exit();

	?>
