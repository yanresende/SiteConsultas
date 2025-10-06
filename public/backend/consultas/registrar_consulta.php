<?php
session_start();
header('Content-Type: application/json');
require '../config.php';

if (!isset($_SESSION["usuario"])) {
    echo json_encode(["sucesso" => false, "mensagem" => "Usuário não autenticado."]);
    exit();
}

$usuario = $_SESSION["usuario"];
$modulo = "consulta_geral";
//$modulo = $_POST['modulo'] ?? null;

if (!$modulo) {
    echo json_encode(["sucesso" => false, "mensagem" => "Módulo não informado."]);
    exit();
}

// Pega id do cliente
$sql = "SELECT id FROM clientes WHERE usuario = ?";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("s", $usuario);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(["sucesso" => false, "mensagem" => "Usuário não encontrado."]);
    exit();
}

$cliente_id = $res->fetch_assoc()["id"];

// Pega id do módulo
$sqlModulo = "SELECT id FROM modulos WHERE nome = ?";
$stmtModulo = $conexao->prepare($sqlModulo);
$stmtModulo->bind_param("s", $modulo);
$stmtModulo->execute();
$resModulo = $stmtModulo->get_result();

if ($resModulo->num_rows === 0) {
    echo json_encode(["sucesso" => false, "mensagem" => "Módulo não encontrado."]);
    exit();
}

$modulo_id = $resModulo->fetch_assoc()["id"];

// Insere consulta
$sqlInsert = "INSERT INTO consultas (cliente_id, modulo_id) VALUES (?, ?)";
$stmtInsert = $conexao->prepare($sqlInsert);
$stmtInsert->bind_param("ii", $cliente_id, $modulo_id);

if ($stmtInsert->execute()) {
    echo json_encode(["sucesso" => true, "mensagem" => "Consulta registrada com sucesso."]);
} else {
    echo json_encode(["sucesso" => false, "mensagem" => "Erro ao registrar consulta."]);
}

$conexao->close();
?>
