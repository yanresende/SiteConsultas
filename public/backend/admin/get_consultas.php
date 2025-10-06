<?php
session_start();
require '../config.php';

header('Content-Type: application/json');

$user_id = $_SESSION["usuario_id"] ?? null;
if (!$user_id) {
	echo json_encode(["erro" => "Usuário não autenticado."]);
	exit();
}

try {
	// Consultas normais por módulo
	$sql_dia = "SELECT m.nome AS modulo_nome, COUNT(*) AS total
                FROM consultas c
                JOIN modulos m ON c.modulo_id = m.id
                WHERE DATE(c.data) = CURDATE()
                GROUP BY c.modulo_id";

	$sql_semana = "SELECT m.nome AS modulo_nome, COUNT(*) AS total
                   FROM consultas c
                   JOIN modulos m ON c.modulo_id = m.id
                   WHERE YEARWEEK(c.data, 1) = YEARWEEK(CURDATE(), 1)
                   GROUP BY c.modulo_id";

	$sql_mes = "SELECT m.nome AS modulo_nome, COUNT(*) AS total
                FROM consultas c
                JOIN modulos m ON c.modulo_id = m.id
                WHERE MONTH(c.data) = MONTH(CURDATE()) AND YEAR(c.data) = YEAR(CURDATE())
                GROUP BY c.modulo_id";

	// Consultas Landing Page - Totais
	$sql_lp_dia = "SELECT COUNT(*) AS total FROM consultas_landing_page WHERE DATE(data_hora) = CURDATE()";
	$sql_lp_semana = "SELECT COUNT(*) AS total FROM consultas_landing_page WHERE YEARWEEK(data_hora, 1) = YEARWEEK(CURDATE(), 1)";
	$sql_lp_mes = "SELECT COUNT(*) AS total FROM consultas_landing_page WHERE MONTH(data_hora) = MONTH(CURDATE()) AND YEAR(data_hora) = YEAR(CURDATE())";

	$dia = $conexao->query($sql_dia)->fetch_all(MYSQLI_ASSOC);
	$semana = $conexao->query($sql_semana)->fetch_all(MYSQLI_ASSOC);
	$mes = $conexao->query($sql_mes)->fetch_all(MYSQLI_ASSOC);

	$lp_dia = $conexao->query($sql_lp_dia)->fetch_assoc();
	$lp_semana = $conexao->query($sql_lp_semana)->fetch_assoc();
	$lp_mes = $conexao->query($sql_lp_mes)->fetch_assoc();

	echo json_encode([
		"dia" => $dia,
		"semana" => $semana,
		"mes" => $mes,
		"landing_page" => [
			"dia" => $lp_dia["total"],
			"semana" => $lp_semana["total"],
			"mes" => $lp_mes["total"]
		]
	]);
} catch (Exception $e) {
	echo json_encode(["erro" => $e->getMessage()]);
}
