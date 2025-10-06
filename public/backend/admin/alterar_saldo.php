<?php
session_start();
header('Content-Type: application/json');
require '../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["usernameSaldo"]) || !isset($data["novoSaldo"])) {
    echo json_encode(["success" => false, "message" => "Campos 'Usuário' e 'Saldo' são obrigatórios."]);
    exit;
}

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["success" => false, "message" => "Acesso não autorizado."]);
    exit;
}

$usernameSaldo = trim($data["usernameSaldo"]);
$novoSaldo = (float)trim($data["novoSaldo"]);
$admin_id = $_SESSION['usuario_id'];

// ✅ Valores permitidos
$valoresPermitidos = [20, 30, 50, 100];
if (!in_array($novoSaldo, $valoresPermitidos)) {
    echo json_encode(["success" => false, "message" => "Valor de saldo inválido."]);
    exit;
}

// ✅ Custo em crédito para o admin (50% do valor)
$descontoCredito = $novoSaldo * 0.5;

// Verifica se o admin tem crédito suficiente
$stmtCredito = $conexao->prepare("SELECT credito FROM admin WHERE id = ?");
$stmtCredito->bind_param("i", $admin_id);
$stmtCredito->execute();
$resultCredito = $stmtCredito->get_result();

if ($resultCredito->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Administrador não encontrado."]);
    exit;
}

$creditoAtual = (float)$resultCredito->fetch_assoc()['credito'];
$stmtCredito->close();

if ($creditoAtual < $descontoCredito) {
    echo json_encode(["success" => false, "message" => "Crédito do administrador insuficiente."]);
    exit;
}

// Busca o saldo atual do usuário
$stmt = $conexao->prepare("SELECT saldo FROM clientes WHERE usuario = ?");
$stmt->bind_param("s", $usernameSaldo);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $saldoAtual = (float)$row["saldo"];
    $saldoAtualizado = $saldoAtual + $novoSaldo;

    // Atualiza o saldo do cliente
    $update = $conexao->prepare("UPDATE clientes SET saldo = ? WHERE usuario = ?");
    $update->bind_param("ds", $saldoAtualizado, $usernameSaldo);

    if ($update->execute()) {
        // Desconta o valor do crédito do admin (50%)
        $stmtDesconta = $conexao->prepare("UPDATE admin SET credito = credito - ? WHERE id = ?");
        $stmtDesconta->bind_param("di", $descontoCredito, $admin_id);
        $stmtDesconta->execute();
        $stmtDesconta->close();

        echo json_encode([
            "success" => true,
            "novoSaldo" => $saldoAtualizado,
            "descontoCredito" => $descontoCredito,
            "novoCreditoAdmin" => round($creditoAtual - $descontoCredito, 2)
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao atualizar saldo."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Usuário não encontrado."]);
}
?>
