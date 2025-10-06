<?php
session_start();
header('Content-Type: application/json');
require 'config.php';

if (!isset($_SESSION["usuario_id"])) {
    echo json_encode(["sucesso" => false, "mensagem" => "Usuário não autenticado."]);
    exit();
}

$cliente_id = $_SESSION["usuario_id"];

// Buscar o limite do plano do usuário
$sql_plano = "SELECT p.limite_consulta
              FROM clientes c
              JOIN planos p ON c.plano_id = p.id
              WHERE c.id = ?
              LIMIT 1";

$stmt_plano = $conexao->prepare($sql_plano);
$stmt_plano->bind_param("i", $cliente_id);
$stmt_plano->execute();
$result_plano = $stmt_plano->get_result();
$plano = $result_plano->fetch_assoc();

$limite = isset($plano['limite_consulta']) ? $plano['limite_consulta'] : null;

// Buscar todos os módulos (supondo que você tem uma tabela de módulos)
$sql_modulos = "SELECT id FROM modulos";
$result_modulos = $conexao->query($sql_modulos);

$consultas = [];
while ($modulo = $result_modulos->fetch_assoc()) {
    $consultas[$modulo['id']] = 0; // inicia com 0
}

// Atualizar com os valores reais do dia
$sql = "SELECT modulo_id, COUNT(*) as total
        FROM consultas
        WHERE cliente_id = ?
        AND DATE(data) = CURDATE()
        GROUP BY modulo_id";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $cliente_id);
$stmt->execute();
$result = $stmt->get_result();

while ($row = $result->fetch_assoc()) {
    $consultas[$row['modulo_id']] = (int)$row['total'];
}

echo json_encode([
    "sucesso" => true,
    "consultas" => $consultas,
    "limite" => $limite
]);
