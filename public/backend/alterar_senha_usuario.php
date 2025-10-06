<?php
header('Content-Type: application/json');
require 'config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data["username"]) || !isset($data["novaSenha"])) {
        throw new InvalidArgumentException("Campos obrigatórios ausentes.");
    }

    $cliente = trim($data["username"]);
    $novaSenha = trim($data["novaSenha"]);

    if (empty($cliente) || empty($novaSenha)) {
        echo json_encode(["success" => false, "message" => "Preencha todos os campos."]);
        exit();
    }

    // Impede alteração de senha para contas visitantes
    if (preg_match('/^visitante\d+$/i', $cliente)) {
        echo json_encode(["success" => false, "message" => "Esta conta não permite alteração de senha."]);
        exit();
    }

    // Verifica se o usuário existe
    $sqlBusca = "SELECT id FROM clientes WHERE usuario = ?";
    $stmtBusca = $conexao->prepare($sqlBusca);
    $stmtBusca->bind_param("s", $cliente);
    $stmtBusca->execute();
    $result = $stmtBusca->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Usuário não encontrado."]);
        exit();
    }

    // Atualizar com nova senha
    $senhaHash = password_hash($novaSenha, PASSWORD_DEFAULT);
    $sqlUpdate = "UPDATE clientes SET senha = ? WHERE usuario = ?";
    $stmtUpdate = $conexao->prepare($sqlUpdate);
    $stmtUpdate->bind_param("ss", $senhaHash, $cliente);

    if ($stmtUpdate->execute()) {
        echo json_encode(["success" => true, "message" => "Senha alterada com sucesso!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao alterar a senha."]);
    }

    $stmtBusca->close();
    $stmtUpdate->close();

} catch (Exception $e) {
    error_log("Erro no alterar_senha.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor."]);
}
?>
