<?php
require 'chave_turnstile.php'; // Pegando a chave secreta do banco

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Método não permitido"]);
    exit;
}

$token = $_POST['token'] ?? '';

if (!$token) {
    echo json_encode(["success" => false, "error" => "Token ausente."]);
    exit;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    "secret" => $cloudflare_secret,
    "response" => $token
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

if (!$response) {
    echo json_encode(["success" => false, "error" => "Falha ao comunicar com o servidor Turnstile."]);
    exit;
}

$responseData = json_decode($response, true);

echo json_encode(["success" => $responseData["success"] ?? false]);
?>
