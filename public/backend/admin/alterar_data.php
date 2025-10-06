<?php
header('Content-Type: application/json');
ob_start();

require '../config.php';

try {
	// Obtém os dados enviados via JSON
	$jsonData = json_decode(file_get_contents("php://input"), true);

	if (json_last_error() !== JSON_ERROR_NONE) {
		throw new InvalidArgumentException("Erro ao decodificar JSON.");
	}

	// Verifica se os campos esperados foram recebidos
	if (!isset($jsonData["usernameData"]) || !isset($jsonData["data"])) {
		throw new InvalidArgumentException("Campos 'usernameData' e 'data' são obrigatórios.");
	}

	$username = trim($jsonData["usernameData"]);
	$dias = intval($jsonData["data"]); // número de dias a somar

	if (empty($username) || $dias <= 0) {
		echo json_encode(["success" => false, "message" => "Preencha todos os campos corretamente!"]);
		exit();
	}

	// Verifica se o usuário existe e obtém a data atual de expiração
	$sqlCheck = "SELECT data_expira FROM clientes WHERE usuario = ?";
	$stmtCheck = $conexao->prepare($sqlCheck);
	$stmtCheck->bind_param("s", $username);
	$stmtCheck->execute();
	$result = $stmtCheck->get_result();

	if ($result->num_rows === 0) {
		$stmtCheck->close();
		echo json_encode(["success" => false, "message" => "Usuário não encontrado."]);
		exit();
	}

	$row = $result->fetch_assoc();
	$dataAtual = new DateTime($row['data_expira']);
	$dataAtual->modify("+{$dias} days");
	$novaData = $dataAtual->format("Y-m-d");

	$stmtCheck->close();

	// Atualiza a data de expiração
	$sqlUpdate = "UPDATE clientes SET data_expira = ? WHERE usuario = ?";
	$stmtUpdate = $conexao->prepare($sqlUpdate);
	if ($stmtUpdate === false) {
		throw new RuntimeException("Erro ao preparar a atualização: " . $conexao->error);
	}

	$stmtUpdate->bind_param("ss", $novaData, $username);

	if ($stmtUpdate->execute()) {
		echo json_encode(["success" => true, "message" => "Data de expiração atualizada com sucesso!"]);
	} else {
		echo json_encode(["success" => false, "message" => "Erro ao atualizar data de expiração."]);
	}

	$stmtUpdate->close();
} catch (mysqli_sql_exception $e) {
	ob_end_clean();
	error_log("Erro MySQL: " . $e->getMessage());
	echo json_encode(["success" => false, "message" => "Erro interno no servidor [DB]."]);
} catch (InvalidArgumentException $e) {
	ob_end_clean();
	echo json_encode(["success" => false, "message" => $e->getMessage()]);
} catch (Exception $e) {
	ob_end_clean();
	error_log("Erro Geral: " . $e->getMessage());
	echo json_encode(["success" => false, "message" => "Erro interno no servidor."]);
} finally {
	ob_end_flush();
}
