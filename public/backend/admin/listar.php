<?php
session_start();
header('Content-Type: application/json');
require '../config.php';

try {
    // Verifica se o admin está autenticado e tem vendedor_id
    if (!isset($_SESSION['admin']) || !isset($_SESSION['vendedor_id'])) {
        echo json_encode(["success" => false, "message" => "Acesso não autorizado"]);
        exit();
    }

    $vendedor_id = $_SESSION['vendedor_id'];

    // Seleciona apenas os clientes do vendedor específico
	$sql = "SELECT usuario, plano, saldo, data_expira FROM clientes WHERE vendedor_id = ? ORDER BY usuario ASC";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $vendedor_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    $stmt->close();

    echo json_encode(["success" => true, "data" => $users]);

} catch (Exception $e) {
    error_log("Erro ao listar usuários: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erro interno no servidor"]);
}
?>
