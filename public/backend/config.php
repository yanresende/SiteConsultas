<?php
require __DIR__ . '/../../vendor/autoload.php'; // Garante que está buscando no diretório correto

use Dotenv\Dotenv;

// Carregar variáveis do .env
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Verifica se o .env foi carregado corretamente
if (!isset($_ENV['DB_HOST'])) {
    die("Erro: Arquivo .env não carregado corretamente.");
}

// Configuração do banco de dados
$host = $_ENV['DB_HOST'];
$dbname = $_ENV['DB_NAME'];
$username = $_ENV['DB_USER'];
$password = $_ENV['DB_PASS'];

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conexao = new mysqli($host, $username, $password, $dbname);
    $conexao->set_charset("utf8mb4");
} catch (mysqli_sql_exception $e) {
    die("Erro na conexão com o banco de dados: " . $e->getMessage());
}
?>
