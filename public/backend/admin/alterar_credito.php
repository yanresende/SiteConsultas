<?php
session_start();
header('Content-Type: application/json');
require '../config.php';

// Recebe os dados do JavaScript (assumindo JSON via POST)
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["idUsernameCredito"]) || !isset($data["novoCredito"])) {
    echo json_encode(["success" => false, "message" => "Campos 'Vendedor' e 'Credito' são obrigatórios."]);
    exit;
}

$idUsernameCredito = (int)trim($data["idUsernameCredito"]);
$novoCredito = (float)trim($data["novoCredito"]);

// Busca o crédito atual
$stmt = $conexao->prepare("SELECT credito FROM admin WHERE vendedor_id = ?");
$stmt->bind_param("i", $idUsernameCredito);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $creditoAtual = (float)$row["credito"];
    $creditoAtualizado = $creditoAtual + $novoCredito;

    // Atualiza o crédito no banco
    $update = $conexao->prepare("UPDATE admin SET credito = ? WHERE id = ?");
    $update->bind_param("di", $creditoAtualizado, $idUsernameCredito);

    if ($update->execute()) {
        echo json_encode(["success" => true, "novoCredito" => $creditoAtualizado]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao atualizar crédito."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Admin não encontrado."]);
}
?>
