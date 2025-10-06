<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $stmt = $conexao->prepare("SELECT valor FROM config WHERE chave = ?");
    $chave = 'chave_bank';
    $stmt->bind_param("s", $chave);
    $stmt->execute();
    $stmt->bind_result($token);

    if ($stmt->fetch()) {
        echo json_encode(['success' => true, 'token' => $token]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Token não encontrado']);
    }

    $stmt->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
