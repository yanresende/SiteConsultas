<?php
session_start();
header('Content-Type: application/json');
ob_start();
error_reporting(0);

if (php_sapi_name() === 'cli') {
	$_POST = json_decode(file_get_contents("php://input"), true);
	if (!isset($_POST["username"], $_POST["password"])) {
		echo json_encode(["success" => false, "message" => "Preencha todos os campos!"]);
		exit();
	}

	// Pula CAPTCHA se rodando via CLI (terminal ou PHPUnit)
	$captchaValidation = ["success" => true];
} else {
	$rawInput = file_get_contents('php://input');
	if (!$rawInput) {
		$rawInput = stream_get_contents(STDIN); // <- Isso resolve no CLI
	}

	$data = json_decode($rawInput, true);

	if (!isset($data["username"], $data["password"], $data["captchaResponse"])) {
		echo json_encode(["success" => false, "message" => "Preencha todos os campos!"]);
		exit();
	}

	// CAPTCHA normal
	$captchaResponse = $data["captchaResponse"];
	$captchaUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
	$captchaData = [
		"secret" => $cloudflare_secret,
		"response" => $captchaResponse
	];

	$options = [
		"http" => [
			"header" => "Content-Type: application/x-www-form-urlencoded\r\n",
			"method" => "POST",
			"content" => http_build_query($captchaData)
		]
	];

	$context = stream_context_create($options);
	$captchaResult = file_get_contents($captchaUrl, false, $context);
	$captchaValidation = json_decode($captchaResult, true);
}


require 'config.php';
require 'chave_turnstile.php'; // Obtém a chave secreta do banco

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["username"], $data["password"], $data["captchaResponse"])) {
	echo json_encode(["success" => false, "message" => "Preencha todos os campos!"]);
	exit();
}

// Garante que as sessões não sejam perdidas
ini_set("session.gc_maxlifetime", 86400); // 24 horas
session_set_cookie_params(86400); // Cookie da sessão válido por 24 horas

// Verifica o CAPTCHA primeiro
$captchaResponse = $data["captchaResponse"];
$captchaUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
$captchaData = [
	"secret" => $cloudflare_secret,
	"response" => $captchaResponse
];

$options = [
	"http" => [
		"header" => "Content-Type: application/x-www-form-urlencoded\r\n",
		"method" => "POST",
		"content" => http_build_query($captchaData)
	]
];

$context = stream_context_create($options);
$captchaResult = file_get_contents($captchaUrl, false, $context);
$captchaValidation = json_decode($captchaResult, true);

if (!$captchaValidation["success"]) {
	echo json_encode(["success" => false, "message" => "Falha na verificação do CAPTCHA."]);
	exit();
}

// Se passou no CAPTCHA, verifica o login
$user = trim($data["username"]);
$pass = trim($data["password"]);

if (verificarLogin($conexao, $user, $pass, "clientes", "usuario", "aM.php", true)) {
	exit();
}

if (verificarLogin($conexao, $user, $pass, "admin", "admin", "admin.php", false)) {
	exit();
}

echo json_encode(["success" => false, "message" => "Usuário ou senha inválidos"]);
exit();

// Função para verificar login
function verificarLogin($conexao, $user, $pass, $tabela, $sessao, $redirect, $verificarStatus)
{
	global $conexao;

	// Busca dados do usuário (inclui permite_multilogin)
	$sql = $verificarStatus
		? "SELECT id, senha, status, compartilhado FROM $tabela WHERE usuario = ?"
		: "SELECT id, senha, compartilhado FROM $tabela WHERE usuario = ?";

	$stmt = $conexao->prepare($sql);
	$stmt->bind_param("s", $user);
	$stmt->execute();
	$result = $stmt->get_result();

	if ($result->num_rows > 0) {
		$row = $result->fetch_assoc();

		if ($verificarStatus && isset($row["status"]) && $row["status"] === "inativo") {
			echo json_encode(["success" => false, "message" => "Conta inativa. Entre em contato com o suporte."]);
			return false;
		}

		if (password_verify($pass, $row["senha"])) {
			session_regenerate_id(true); // Evita session fixation
			$_SESSION[$sessao] = $user;
			$_SESSION["usuario_id"] = $row["id"];

			$novo_session_id = session_id();

			// Só atualiza session_id no banco se NÃO permitir multilogin
			if (empty($row['compartilhado'])) {
				$sqlUpdate = "UPDATE $tabela SET session_id = ? WHERE id = ?";
				$stmtUpdate = $conexao->prepare($sqlUpdate);
				$stmtUpdate->bind_param("si", $novo_session_id, $row["id"]);
				$stmtUpdate->execute();
			}

			echo json_encode(["success" => true, "redirect" => $redirect]);
			return true;
		}
	}

	return false;
}
