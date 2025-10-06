<?php
header('Content-Type: application/json');
require '../config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data["username"]) || !isset($data["novaSenha"])) {

        throw new InvalidArgumentException("Campos 'cliente' e 'senha' são obrigatórios.");
    }

    $cliente = trim($data["username"]);
    $senha = trim($data["novaSenha"]);
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);



    if (empty($cliente) || empty($senha)) {
        echo json_encode(["success" => false, "message" => "Preencha todos os campos!"]);
        exit();
    }

    // Aqui você pode aplicar hash na senha, se necessário:
    // $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

    $sql = "UPDATE clientes SET senha = ? WHERE usuario = ?";
    $stmt = $conexao->prepare($sql);

    if ($stmt === false) {
        throw new RuntimeException("Erro ao preparar a query: " . $conexao->error);
    }

    $stmt->bind_param("ss", $senhaHash, $cliente);


    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Senha alterada com sucesso!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao alterar a senha."]);
    }

    $stmt->close();

} catch (Exception $e) {
    error_log("Erro no alterar_senha.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor."]);
}
?>
