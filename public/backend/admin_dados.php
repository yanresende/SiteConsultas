<?php
session_start();
header('Content-Type: application/json');
require 'config.php';

// Verifica se o admin está autenticado
if (!isset($_SESSION["admin"])) {
    echo json_encode(["autenticado" => false]);
    exit();
}

$admin_usuario = $_SESSION["admin"];

$sql = "SELECT a.usuario, a.nome, a.vendedor_id
        FROM admin a
        WHERE a.usuario = ?";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("s", $admin_usuario);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $dados = $result->fetch_assoc();

    // Salva na sessão, caso ainda não tenha
    if (!isset($_SESSION["vendedor_id"])) {
        $_SESSION["vendedor_id"] = $dados["vendedor_id"];
    }

    echo json_encode([
        "autenticado" => true,
        "usuario" => $dados["usuario"],
        "nome" => $dados["nome"],
        "vendedor_id" => $dados["vendedor_id"]
    ]);
} else {
    echo json_encode(["autenticado" => false]);
}

$stmt->close();
$conexao->close();
?>
