<?php
session_start();
header('Content-Type: application/json');
require '../config.php';

// Recebe os dados do JavaScript (assumindo JSON via POST)
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["usernameSaldo"]) || !isset($data["novoSaldo"])) {
    echo json_encode(["success" => false, "message" => "Campos 'Usuário' e 'Saldo' são obrigatórios."]);
    exit;
}

$usernameSaldo = trim($data["usernameSaldo"]);
$novoSaldo = (float)trim($data["novoSaldo"]);


// Busca o saldo atual
$stmt = $conexao->prepare("SELECT saldo FROM clientes WHERE usuario = ?");
$stmt->bind_param("s", $usernameSaldo);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $saldoAtual = (float)$row["saldo"];
    $saldoAtualizado = $saldoAtual + $novoSaldo;

    // Atualiza o saldo no banco
    $update = $conexao->prepare("UPDATE clientes SET saldo = ? WHERE usuario = ?");
    $update->bind_param("ds", $saldoAtualizado, $usernameSaldo);

    if ($update->execute()) {
        echo json_encode(["success" => true, "novoSaldo" => $saldoAtualizado]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao atualizar saldo."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Usuário não encontrado."]);
}
?>
