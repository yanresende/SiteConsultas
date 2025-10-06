<?php
session_start();
header('Content-Type: application/json');
require '../config.php';

if (!isset($_SESSION["usuario"])) {
    echo json_encode(["autorizado" => false, "mensagem" => "Usuário não autenticado."]);
    exit();
}

$usuario = $_SESSION["usuario"];
$modulo = "consulta_geral";
//$modulo = $_GET['modulo'] ?? null;


if (!$modulo) {
    echo json_encode(["autorizado" => false, "mensagem" => "Módulo não especificado."]);
    exit();
}

// Obter informações do cliente e plano
$sql = "SELECT c.id AS cliente_id, p.limite_consulta, p.nome AS plano_nome, c.data_expira
        FROM clientes c
        JOIN planos p ON c.plano_id = p.id
        WHERE c.usuario = ? AND c.status = 'ativo'";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("s", $usuario);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["autorizado" => false, "mensagem" => "Usuário não encontrado ou inativo."]);
    exit();
}

$dados = $result->fetch_assoc();
$cliente_id = $dados["cliente_id"];
$limite = $dados["limite_consulta"];
$plano = strtolower($dados["plano_nome"]);
$data_expira = new DateTime($dados["data_expira"]);
$hoje = new DateTime();

// ✅ Verifica se o plano expirou
if ($hoje > $data_expira) {
    echo json_encode([
        "autorizado" => false,
        "mensagem" => "Seu plano expirou em " . $data_expira->format('d/m/Y') . ". Entre em contato com seu revendedor."
    ]);
    exit();
}

// Obter id do módulo
$sqlModulo = "SELECT id FROM modulos WHERE nome = ?";
$stmtModulo = $conexao->prepare($sqlModulo);
$stmtModulo->bind_param("s", $modulo);
$stmtModulo->execute();
$resModulo = $stmtModulo->get_result();

if ($resModulo->num_rows === 0) {
    echo json_encode(["autorizado" => false, "mensagem" => "Módulo não encontrado."]);
    exit();
}

$modulo_id = $resModulo->fetch_assoc()['id'];

// Se for ilimitado, permite
if (is_null($limite)) {
    echo json_encode(["autorizado" => true]);
    exit();
}

// Conta quantas consultas hoje
$sqlCount = "SELECT COUNT(*) AS total FROM consultas WHERE cliente_id = ? AND modulo_id = ? AND DATE(data) = CURDATE()";

$stmtCount = $conexao->prepare($sqlCount);
$stmtCount->bind_param("ii", $cliente_id, $modulo_id);
$stmtCount->execute();
$resCount = $stmtCount->get_result();
$totalHoje = $resCount->fetch_assoc()['total'];

if ($totalHoje >= $limite) {
    echo json_encode(["autorizado" => false, "mensagem" => "Limite diário de consultas atingido."]);
} else {
    echo json_encode(["autorizado" => true, "restantes" => $limite - $totalHoje]);
}

$conexao->close();
?>
