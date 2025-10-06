<?php
header('Content-Type: application/json');
require '../config.php';

try {
    // Obtém os dados enviados via JSON
    $data = json_decode(file_get_contents("php://input"), true);

    // Verifica se os dados foram recebidos corretamente
    if (!isset($data["cliente"]) || !isset($data["vendedor_id"])) {
        throw new InvalidArgumentException("Campos 'cliente' e 'vendedor_id' são obrigatórios.");
    }

    $cliente = trim($data["cliente"]);
    $vendedor_id = intval($data["vendedor_id"]); // Converte para inteiro por segurança

    // Validação básica
    if (empty($cliente) || empty($vendedor_id)) {
        echo json_encode(["success" => false, "message" => "Preencha todos os campos!"]);
        exit();
    }

    // Atualiza o vendedor do cliente
    $sqlUpdate = "UPDATE clientes SET vendedor_id = ? WHERE usuario = ?";
    $stmtUpdate = $conexao->prepare($sqlUpdate);

    if ($stmtUpdate === false) {
        throw new RuntimeException("Erro ao preparar a atualização: " . $conexao->error);
    }

    $stmtUpdate->bind_param("is", $vendedor_id, $cliente);

    if ($stmtUpdate->execute()) {
        echo json_encode(["success" => true, "message" => "Vendedor atualizado com sucesso!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao atualizar vendedor."]);
    }

    $stmtUpdate->close();

} catch (Exception $e) {
    error_log("Erro no muda_vendedor.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor."]);
}
?>
