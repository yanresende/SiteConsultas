<?php
session_start();
header('Content-Type: application/json');
require 'config.php'; // Garanta que $conexao está configurada neste arquivo

// Verifica se o usuário está autenticado
if (!isset($_SESSION["usuario"])) {
	echo json_encode(["autenticado" => false, "error" => "Usuário não autenticado"]);
	exit();
}

$usuario_sessao = $_SESSION["usuario"]; // Renomeado para evitar conflito com $dados["usuario"]

// Seleciona o vendedor_id da tabela clientes (c.vendedor_id)
$sql = "SELECT c.usuario, c.plano, c.plano_id, c.data_expira, c.vendedor_id,
               v.nome AS revendedor_nome, v.whatsapp AS revendedor_whatsapp
        FROM clientes c
        LEFT JOIN vendedores v ON c.vendedor_id = v.id
        WHERE c.usuario = ?";

$stmt = $conexao->prepare($sql);

if (!$stmt) {
	// Logar o erro do servidor em vez de expor diretamente ao cliente em produção
	error_log("Erro ao preparar a query: " . $conexao->error);
	echo json_encode(["autenticado" => false, "error" => "Erro ao processar sua solicitação."]);
	exit();
}

$stmt->bind_param("s", $usuario_sessao);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
	$dados = $result->fetch_assoc();

	echo json_encode([
		"autenticado" => true,
		"usuario" => $dados["usuario"],
		"nome" => $dados["revendedor_nome"] ?? "Não informado",
		"whatsapp_revendedor" => !empty($dados["revendedor_whatsapp"]) ? "https://wa.me/" . preg_replace('/\D/', '', $dados["revendedor_whatsapp"]) : "#",
		"plano" => $dados["plano"],
		"plano_id" => $dados["plano_id"],
		"data_expira" => $dados["data_expira"],
		"vendedor_id" => $dados["vendedor_id"] // Este é o ID do vendedor associado ao cliente
	]);
} else {
	// Usuário autenticado na sessão, mas não encontrado na tabela clientes (situação anômala)
	echo json_encode([
		"autenticado" => true,
		"usuario" => $usuario_sessao,
		"error" => "Dados do cliente não encontrados.",
		"vendedor_id" => null
	]);
}

$stmt->close();
$conexao->close();
