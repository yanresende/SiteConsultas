<?php
session_start();
header('Content-Type: application/json');
require 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$valor = isset($data['amount']) ? (float)$data['amount'] : 0;
$codigoTransacao = isset($data['transacaoId']) ? trim($data['transacaoId']) : '';

if (!isset($_SESSION['usuario']) || $valor <= 0 || empty($codigoTransacao)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Dados inválidos ou usuário não autenticado.']);
    exit();
}

$usuario = $_SESSION['usuario'];

// Verifica se a transação já foi registrada
$sqlVerifica = "SELECT id FROM transacoes WHERE codigo_transacao = ?";
$stmtVerifica = $conexao->prepare($sqlVerifica);
$stmtVerifica->bind_param("s", $codigoTransacao);
$stmtVerifica->execute();
$resultVerifica = $stmtVerifica->get_result();
if ($resultVerifica->num_rows > 0) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Transação já registrada.']);
    $stmtVerifica->close();
    exit();
}
$stmtVerifica->close();

// Busca ID do cliente
$sqlBuscaCliente = "SELECT id FROM clientes WHERE usuario = ?";
$stmtCliente = $conexao->prepare($sqlBuscaCliente);
$stmtCliente->bind_param("s", $usuario);
$stmtCliente->execute();
$resultCliente = $stmtCliente->get_result();

if ($resultCliente->num_rows === 0) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não encontrado.']);
    $stmtCliente->close();
    exit();
}

$cliente = $resultCliente->fetch_assoc();
$cliente_id = $cliente['id'];
$stmtCliente->close();

// Atualiza o saldo
$sql = "UPDATE clientes SET saldo = saldo + ? WHERE usuario = ?";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("ds", $valor, $usuario);

if ($stmt->execute()) {
    $stmt->close();

    // Insere transação
    $tipoTransacao = 'saldo';
    $sqlTransacao = "INSERT INTO transacoes (codigo_transacao, cliente_id, tipo, valor) VALUES (?, ?, ?, ?)";
    $stmtTransacao = $conexao->prepare($sqlTransacao);
    $stmtTransacao->bind_param("siss", $codigoTransacao, $cliente_id, $tipoTransacao, $valor);
    $stmtTransacao->execute();
    $stmtTransacao->close();

    echo json_encode(['sucesso' => true, 'mensagem' => 'Recarga realizada com sucesso!']);
} else {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao processar a recarga.']);
    $stmt->close();
}

$conexao->close();
?>
