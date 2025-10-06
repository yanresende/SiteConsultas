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

    if (!isset($data["username"], $data["password"], $data["plano"])) {
        throw new InvalidArgumentException("Campos 'username', 'password' e 'plano' são obrigatórios.");
    }

    if (!isset($_SESSION['admin']) || !isset($_SESSION['vendedor_id']) || !isset($_SESSION['usuario_id'])) {
        echo json_encode(["success" => false, "message" => "Acesso não autorizado"]);
        exit();
    }

    $user = trim($data["username"]);
    $pass = trim($data["password"]);
    $plano = intval($data["plano"]);
    $vendedor_id = $_SESSION['vendedor_id'];
    $admin_id = $_SESSION['usuario_id'];

    if (empty($user) || empty($pass) || !in_array($plano, [1, 2, 3, 4, 5, 6])) {
        echo json_encode(["success" => false, "message" => "Preencha todos os campos corretamente!"]);
        exit();
    }

    // 🧮 Preços dos planos
    $precos = [
        1 => 150.00,  // pro
        2 => 225.00, // elite
        3 => 1080.00, // pro anual
        4 => 1620.00, // elite anual
    ];

    $valorPlano = $precos[$plano];

    // 🧾 Verifica crédito atual
    $sqlCredito = "SELECT credito FROM admin WHERE id = ?";
    $stmtCredito = $conexao->prepare($sqlCredito);
    $stmtCredito->bind_param("i", $admin_id);
    $stmtCredito->execute();
    $resultCredito = $stmtCredito->get_result();

    if ($resultCredito->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Administrador não encontrado."]);
        exit();
    }

    $creditoAtual = $resultCredito->fetch_assoc()['credito'];
    $stmtCredito->close();

    if ($creditoAtual < $valorPlano) {
        echo json_encode(["success" => false, "message" => "Crédito insuficiente."]);
        exit();
    }

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
        case 1: $planoNome = "Pro"; break;
        case 2: $planoNome = "Elite"; break;
        case 3: $planoNome = "Pro_Anual"; $dias_validade = 365; break;
        case 4: $planoNome = "Elite_Anual"; $dias_validade = 365; break;
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
        // ✅ Desconta o crédito após sucesso
        $sqlDesconta = "UPDATE admin SET credito = credito - ? WHERE id = ?";
        $stmtDesconta = $conexao->prepare($sqlDesconta);
        $stmtDesconta->bind_param("di", $valorPlano, $admin_id);
        $stmtDesconta->execute();
        $stmtDesconta->close();

        // Calcula o novo crédito do administrador após o débito
        $novoCredito = $creditoAtual - $valorPlano;

        echo json_encode([
            "success" => true,
            "message" => "Usuário cadastrado com sucesso!",
            "novoCredito" => round($novoCredito, 2)

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
