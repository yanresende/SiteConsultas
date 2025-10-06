<?php
session_start();
header('Content-Type: application/json');
require '../config.php';

if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['admin'])) {
    echo json_encode(["success" => false, "message" => "Não autenticado"]);
    exit();
}

$admin_id = $_SESSION['usuario_id'];

$stmt = $conexao->prepare("SELECT credito FROM admin WHERE id = ?");
$stmt->bind_param("i", $admin_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode(["success" => true, "credito" => (float)$row["credito"]]);
} else {
    echo json_encode(["success" => false, "message" => "Admin não encontrado"]);
}
