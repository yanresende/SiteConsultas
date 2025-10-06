<?php
session_start();
header('Content-Type: application/json');
ob_start();
require '../config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new InvalidArgumentException("Erro ao decodificar JSON recebido.");
    }

    if (!isset($data["username"], $data["password"], $data["plano"],$data["novoVend"])) {
        throw new InvalidArgumentException("Campos 'username', 'password' e 'plano' são obrigatórios.");
    }

    $user = trim($data["username"]);
    $pass = trim($data["password"]);
    $plano = intval($data["plano"]);
    $vendedor_id = intval($data["novoVend"]);

    if (empty($user) || empty($vendedor_id) || empty($pass) || !in_array($plano, [1, 2, 3, 4, 5, 6 , 7])) {
        echo json_encode(["success" => false, "message" => "Preencha todos os campos corretamente!"]);
        exit();
    }

    // 🧮 Preços dos planos
    $precos = [
		1 => 150.00,  // pro
		2 => 225.00, // elite
		3 => 1080.00, // pro anual
		4 => 1620.00, // elite anual
		5 => 9999.00, // Testes
    ];

    // 🕵️‍♂️ Verifica se o usuário já existe
    $sqlCheck = "SELECT id FROM clientes WHERE usuario = ?";
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

    // 🔐 Hash da senha
    $hashed_password = password_hash($pass, PASSWORD_DEFAULT);
    if ($hashed_password === false) {
        throw new RuntimeException("Erro ao gerar hash da senha.");
    }

    // 🗓️ Expiração do plano
    $dias_validade = 30;
    $status = "ativo";

    switch ($plano) {
        case 1: $planoNome = "Simples"; break;
        case 2: $planoNome = "Basico"; break;
        case 3: $planoNome = "Premium"; break;
        case 4: $planoNome = "Diamante"; break;
        case 5: $planoNome = "Premium_Anual"; $dias_validade = 365; break;
        case 6: $planoNome = "Diamante_Anual"; $dias_validade = 365; break;
		case 7: $planoNome = "Testes"; $dias_validade = 18250; break;
        default: $planoNome = "Desconhecido"; $dias_validade = null;
    }

    $data_expira = null;
    if ($dias_validade !== null) {
        $data_expira = (new DateTime())->modify("+$dias_validade days")->format("Y-m-d");
    }

    // 💾 Cadastra novo usuário
    $sqlInsert = "INSERT INTO clientes (usuario, senha, status, plano, data_expira, plano_id, vendedor_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmtInsert = $conexao->prepare($sqlInsert);

    if ($stmtInsert === false) {
        throw new RuntimeException("Erro ao preparar a inserção no banco de dados: " . $conexao->error);
    }

    $stmtInsert->bind_param("sssssii", $user, $hashed_password, $status, $planoNome, $data_expira, $plano, $vendedor_id);

    if ($stmtInsert->execute()) {

        echo json_encode([
    "success" => true,
    "message" => "Usuário cadastrado com sucesso!"

]);

    } else {
        echo json_encode(["success" => false, "message" => "Erro ao cadastrar usuário."]);
    }

    $stmtInsert->close();

} catch (mysqli_sql_exception $e) {
    ob_end_clean();
    error_log("Erro de Banco de Dados (cadastro.php): " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor [DB]."]);

} catch (InvalidArgumentException $e) {
    ob_end_clean();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);

} catch (Exception $e) {
    ob_end_clean();
    error_log("Erro Geral (cadastro.php): " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor."]);

} finally {
    if (isset($conexao) && $conexao instanceof mysqli && $conexao->thread_id) {
        // conexão ativa
    }
    ob_end_flush();
}
?>
