<?php
session_start();
require '../config.php';

header('Content-Type: application/json');

$user_id = $_SESSION["usuario_id"] ?? null;
if (!$user_id) {
	echo json_encode(["erro" => "Usuário não autenticado."]);
	exit();
}

$dataInicio = $_GET['inicio'] ?? null;
$dataFim = $_GET['fim'] ?? null;

if (!$dataInicio || !$dataFim) {
	echo json_encode(["erro" => "Datas inválidas."]);
	exit();
}

try {
	$sql = "SELECT m.nome AS modulo_nome, COUNT(*) AS total
            FROM consultas c
            JOIN modulos m ON c.modulo_id = m.id
            WHERE DATE(c.data) BETWEEN ? AND ?
            GROUP BY c.modulo_id";

	$stmt = $conexao->prepare($sql);
	$stmt->bind_param("ss", $dataInicio, $dataFim);
	$stmt->execute();
	$resultado = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

	echo json_encode($resultado);
} catch (Exception $e) {
	echo json_encode(["erro" => $e->getMessage()]);
}
