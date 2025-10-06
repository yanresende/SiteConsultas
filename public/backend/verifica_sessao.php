<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['usuario']) || isset($_SESSION['admin'])) {
    echo json_encode(["autenticado" => true]);
} else {
    echo json_encode(["autenticado" => false]);
}
?>
