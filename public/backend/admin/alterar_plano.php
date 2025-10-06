<?php
header('Content-Type: application/json');
require '../config.php';

try {
    // Lê os dados enviados em JSON
    $data = json_decode(file_get_contents("php://input"), true);

    // Validação dos campos obrigatórios
    if (!isset($data["username"]) || !isset($data["plano"])) {
        throw new InvalidArgumentException("Campos 'username' e 'plano' são obrigatórios.");
    }

    $username = trim($data["username"]);
    $id_plano = trim($data["plano"]);

    if (empty($username) || empty($id_plano)) {
        echo json_encode(["success" => false, "message" => "Preencha todos os campos!"]);
        exit();
    }

	// Define o plano e validade
    $dias_validade = 30; // padrão mensal
	switch ((int)$id_plano) {
        case 1: $planoNome = "Pro"; break;
        case 2: $planoNome = "Elite"; break;
        case 3: $planoNome = "Pro_Anual"; $dias_validade = 365; break;
        case 4: $planoNome = "Elite_Anual"; $dias_validade = 365; break;
        default: $planoNome = "Desconhecido"; $dias_validade = null; $id_plano = null; break;
    }

	$data_expira = null;
    if ($dias_validade !== null) {
        $data_expira = (new DateTime())->modify("+$dias_validade days")->format("Y-m-d");
    }

	$sqlUpdate = "UPDATE clientes SET plano = ?, data_last_pg = CURDATE(), data_expira = ?, plano_id = ? WHERE usuario = ?";
    $stmt = $conexao->prepare($sqlUpdate);

    if ($stmt === false) {
        throw new RuntimeException("Erro ao preparar a query: " . $conexao->error);
    }


	$stmt->bind_param("ssis", $planoNome, $data_expira, $id_plano, $username );

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Plano atualizado com sucesso!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao atualizar o plano."]);
    }

    $stmt->close();

} catch (Exception $e) {
    error_log("Erro em alterar_plano.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor."]);
}
?>
