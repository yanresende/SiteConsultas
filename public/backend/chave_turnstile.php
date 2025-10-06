<?php
require 'config.php'; // Garante que a conexão com o banco de dados está disponível

// Buscar a chave do Cloudflare na tabela 'config'
$query = "SELECT valor FROM config WHERE chave = 'token_cloudflarepro' LIMIT 1";
$stmt = $conexao->prepare($query);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

$cloudflare_secret = $row['valor'] ?? null;

if (!$cloudflare_secret) {
    die("Erro: Chave do Cloudflare não encontrada no banco de dados.");
}
?>
