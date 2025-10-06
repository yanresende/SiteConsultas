<?php
header('Content-Type: application/json');
ob_start();
require '../config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new InvalidArgumentException("Erro ao decodificar JSON.");
    }

    if (
        !isset($data["usernameAdmin"], $data["passwordAdmin"],
        $data["newNomeVendedor"], $data["newTelVendedor"],
        $data["newCreditoVendedor"])
    ) {
        throw new InvalidArgumentException("Campos obrigatórios faltando.");
    }

    $user = trim($data["usernameAdmin"]);
    $pass = trim($data["passwordAdmin"]);
    $newNomeVendedor = trim($data["newNomeVendedor"]);
    $newTelVendedor = trim($data["newTelVendedor"]);
    $newCreditoVendedor = trim($data["newCreditoVendedor"]);

    if (empty($user) || empty($pass) || empty($newNomeVendedor) || empty($newTelVendedor) || empty($newCreditoVendedor)) {
        echo json_encode(["success" => false, "message" => "Preencha todos os campos!"]);
        exit();
    }

    // Verifica se o usuário já existe
    $sqlCheck = "SELECT id FROM admin WHERE usuario = ?";
    $stmtCheck = $conexao->prepare($sqlCheck);
    $stmtCheck->bind_param("s", $user);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();
    if ($resultCheck->num_rows > 0) {
        $stmtCheck->close();
        echo json_encode(["success" => false, "message" => "Usuário já cadastrado."]);
        exit();
    }
    $stmtCheck->close();

    // Cria vendedor
    $sqlVendedor = "INSERT INTO vendedores (nome, whatsapp) VALUES (?, ?)";
    $stmtVend = $conexao->prepare($sqlVendedor);
    if (!$stmtVend) throw new RuntimeException("Erro ao preparar vendedor: " . $conexao->error);
    $stmtVend->bind_param("ss", $newNomeVendedor, $newTelVendedor);
    if (!$stmtVend->execute()) {
        throw new RuntimeException("Erro ao cadastrar vendedor.");
    }
    $vendedor_id = $conexao->insert_id;
    $stmtVend->close();

    // Criptografa senha
    $hashed_password = password_hash($pass, PASSWORD_DEFAULT);
    if (!$hashed_password) throw new RuntimeException("Erro ao gerar hash da senha.");

    // Cria admin com vendedor_id e crédito
    $sqlAdmin = "INSERT INTO admin (usuario, senha, credito, vendedor_id) VALUES (?, ?, ?, ?)";
    $stmtAdmin = $conexao->prepare($sqlAdmin);
    if (!$stmtAdmin) throw new RuntimeException("Erro ao preparar admin: " . $conexao->error);
    $stmtAdmin->bind_param("ssdi", $user, $hashed_password, $newCreditoVendedor, $vendedor_id);
    if (!$stmtAdmin->execute()) {
        throw new RuntimeException("Erro ao cadastrar admin.");
    }
    $stmtAdmin->close();

    echo json_encode([
        "success" => true,
        "message" => "Admin e vendedor cadastrados com sucesso!",
        "vendedor_id" => $vendedor_id
    ]);

} catch (mysqli_sql_exception $e) {
    ob_end_clean();
    error_log("Erro MySQL: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro no banco de dados."]);
} catch (InvalidArgumentException $e) {
    ob_end_clean();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} catch (Exception $e) {
    ob_end_clean();
    error_log("Erro geral: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor."]);
} finally {
    ob_end_flush();
}
?>
