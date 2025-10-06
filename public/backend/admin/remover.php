<?php
// Define o tipo de conteúdo como JSON
header('Content-Type: application/json');
// Inicia o buffer de saída
ob_start();

require '../config.php'; // Fornece $conexao

try {
    // Recebe os dados
    $data = json_decode(file_get_contents("php://input"), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new InvalidArgumentException("Erro ao decodificar JSON recebido.");
    }

    // Verifica se o campo esperado existe e não está vazio
    $user = isset($data["username"]) ? trim($data["username"]) : "";
    if (empty($user)) {
         echo json_encode(["success" => false, "message" => "Nome de usuário não informado."]);
         exit();
    }

    $sqlCheck = "SELECT id FROM clientes WHERE usuario = ?";
    $stmtCheck = $conexao->prepare($sqlCheck);
    $stmtCheck->bind_param("s", $user);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();

    if ($resultCheck->num_rows === 0) {
        $stmtCheck->close();
        echo json_encode(["success" => false, "message" => "Usuário não encontrado."]);
        exit();
    }
    $stmtCheck->close();


    // Remove do banco de dados
    $sqlDelete = "DELETE FROM clientes WHERE usuario = ?";
    $stmtDelete = $conexao->prepare($sqlDelete);
     if ($stmtDelete === false) {
        throw new RuntimeException("Erro ao preparar a remoção no banco de dados: " . $conexao->error);
     }
    $stmtDelete->bind_param("s", $user);

    if ($stmtDelete->execute()) {
        // Verifica se alguma linha foi realmente afetada
        if ($stmtDelete->affected_rows > 0) {
            echo json_encode(["success" => true, "message" => "Usuário removido com sucesso."]);
        } else {
             // Tecnicamente não é um erro, mas a linha não foi encontrada (pode acontecer em condições de corrida)
            echo json_encode(["success" => false, "message" => "Usuário não encontrado para remoção (já removido?)."]);
        }
    } else {
         // Falha na execução do DELETE
         echo json_encode(["success" => false, "message" => "Erro ao executar a remoção do usuário."]);
    }

    $stmtDelete->close();

} catch (mysqli_sql_exception $e) {
    ob_end_clean();
    error_log("Erro de Banco de Dados (remover.php): " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor [DB]."]);

} catch (InvalidArgumentException $e) {
     ob_end_clean();
     echo json_encode(["success" => false, "message" => $e->getMessage()]);

} catch (Exception $e) {
    ob_end_clean();
    error_log("Erro Geral (remover.php): " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor."]);

} finally {
    if (isset($conexao) && $conexao instanceof mysqli && $conexao->thread_id) {
       // $conexao->close();
    }
    ob_end_flush();
}
?>
