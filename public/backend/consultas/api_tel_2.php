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
require '../config.php';

// Lê e valida o telefone
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['tel'])) {
    http_response_code(400);
    echo json_encode(['erro' => 'Telefone não informado.']);
    exit;
}

$tel = preg_replace('/\D/', '', $input['tel']);
if (strlen($tel) !== 11) {
    http_response_code(400);
    echo json_encode(['erro' => 'Telefone inválido.']);
    exit;
}

// Busca o token no banco de dados
$token = null;
$stmt = $conexao->prepare("SELECT valor FROM config WHERE chave = ?");
$chave = 'api_secudaria';
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

// Consulta à API externa
$url = "data.workbuscas.com/api/v1/{$token}/telefone/{$tel}";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_USERAGENT => 'Mozilla/5.0',
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro na requisição: ' . $curlError]);
    exit;
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['erro' => 'Erro na consulta externa. / Dados invalidos.', 'codigo_http' => $httpCode]);
    exit;
}

// Decodifica a resposta da API externa
$data = json_decode($response, true);
if ($data === null) {
    http_response_code(500);
    echo json_encode(['erro' => 'Resposta da API inválida. / API fora do ar.']);
    exit;
}

// Retorna os dados para o frontend
http_response_code(200);
echo json_encode([
    'status' => 200,
    'dados' => $data['data'] ?? []
]);
