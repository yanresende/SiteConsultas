<?php
header('Content-Type: application/json');
ob_start();

require '../config.php';

try {
    // Obtém os dados enviados via JSON
    $data = json_decode(file_get_contents("php://input"), true);

    // Verifica se o JSON foi decodificado corretamente
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new InvalidArgumentException("Erro ao decodificar JSON.");
    }

    // Verifica se os campos esperados foram recebidos
    if (!isset($data["username"]) || !isset($data["status"])) {
        throw new InvalidArgumentException("Campos 'username' e 'status' são obrigatórios.");
    }

    $username = trim($data["username"]);
    $status = trim($data["status"]);

    // Validação básica
    if (empty($username) || empty($status)) {
        echo json_encode(["success" => false, "message" => "Preencha todos os campos!"]);
        exit();
    }

    // Verifica se o usuário existe
    $sqlCheck = "SELECT id FROM clientes WHERE usuario = ?";
    $stmtCheck = $conexao->prepare($sqlCheck);
    $stmtCheck->bind_param("s", $username);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();

    if ($resultCheck->num_rows === 0) {
        $stmtCheck->close();
        echo json_encode(["success" => false, "message" => "Usuário não encontrado."]);
        exit();
    }
    $stmtCheck->close();

    // Atualiza o status do usuário
    $sqlUpdate = "UPDATE clientes SET status = ? WHERE usuario = ?";
    $stmtUpdate = $conexao->prepare($sqlUpdate);

    if ($stmtUpdate === false) {
        throw new RuntimeException("Erro ao preparar a atualização: " . $conexao->error);
    }

    $stmtUpdate->bind_param("ss", $status, $username);

    if ($stmtUpdate->execute()) {
        echo json_encode(["success" => true, "message" => "Status atualizado com sucesso!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao atualizar status."]);
    }

    $stmtUpdate->close();

} catch (mysqli_sql_exception $e) {
    ob_end_clean();
    error_log("Erro MySQL (alterar_status.php): " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor [DB]."]);

} catch (InvalidArgumentException $e) {
    ob_end_clean();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);

} catch (Exception $e) {
    ob_end_clean();
    error_log("Erro Geral (alterar_status.php): " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor."]);

} finally {
    ob_end_flush();
}
?>
