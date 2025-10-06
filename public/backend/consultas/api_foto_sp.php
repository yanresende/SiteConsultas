<?php
session_start();
header('Content-Type: application/json');

// Verifica autenticação
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autenticado.']);
    exit;
}

// Inclui a configuração do banco de dados
require '../config.php'; // Certifique-se que $conexao é criado corretamente aqui

// Lê e valida o CPF
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['cpf'])) {
    http_response_code(400);
    echo json_encode(['erro' => 'CPF não informado.']);
    exit;
}

$cpf = preg_replace('/\D/', '', $input['cpf']);
if (strlen($cpf) !== 11) {
    http_response_code(400);
    echo json_encode(['erro' => 'CPF inválido.']);
    exit;
}

// Busca o token no banco de dados
$token = null;
$stmt = $conexao->prepare("SELECT valor FROM config WHERE chave = ?");
$chave = 'token_api_foto_sp'; // <- Use o nome da chave certa no seu banco
$stmt->bind_param("s", $chave);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $token = $row['valor'];
}
$stmt->close();

if (empty($token)) {
    http_response_code(500);
    echo json_encode(['erro' => 'Token da API não encontrado no banco de dados.']);
    exit;
}

// Consulta à API da foto
$url = "https://ghostapis.com.br/api.php?token={$token}&foto_sp={$cpf}";
$response = file_get_contents($url);

if ($response === false) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao consultar a API de foto.']);
    exit;
}

$data = json_decode($response, true);
if (!isset($data['FOTOB64']) || empty($data['FOTOB64'])) {
    http_response_code(404);
    echo json_encode(['erro' => 'Foto não encontrada para este CPF.']);
    exit;
}

// Retorna exatamente o formato da GhostAPIs
echo json_encode([
    'CPF' => $data['CPF'] ?? $cpf,
    'ORIGEM' => $data['ORIGEM'] ?? 'DESCONHECIDA',
    'FOTOB64' => $data['FOTOB64']
]);
