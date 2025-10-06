<?php
session_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (isset($_GET['v'])) {
	$_SESSION['vendedor_id'] = $_GET['v'];
}

$vendedor_id = $_SESSION['vendedor_id'] ?? '1';

?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Login Busca Brasil</title>
	<link rel="icon" href="../assets/img/favicon.png" type="image/png">
	<meta property="og:title" content="Busca Brasil">
	<meta property="og:description" content="Site de buscas">
	<meta property="og:image" content="https://newmaxbuscas.pro/public/assets/img/favicon.jpg">
	<meta property="og:url" content="https://newmaxbuscas.pro">
	<meta property="og:type" content="website">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
	<link rel="stylesheet" href="../assets/css/login.css?v=<?php echo md5_file('../assets/css/login.css'); ?>">
</head>

<body>
	<div class="login-container">
		<img src="../assets/img/busca_brasil_icone.png" alt="Logo do Cliente" class="logo">
		<form id="loginForm">
			<input type="text" id="username" placeholder="Usuário" required>
			<input type="password" id="password" placeholder="Senha" required>

			<!-- Modificação para capturar a resposta do Turnstile -->
			<div style="display: flex; justify-content: center; margin: 16px 0;" id="captcha" class="cf-turnstile"
				data-sitekey="0x4AAAAAABCUfVi2iZQzzgzx"
				data-callback="onCaptchaSuccess">
			</div>

			<input type="hidden" id="captcha-response" name="cf-turnstile-response">

			<button type="submit" class="btn-login">Entrar</button>
		</form>
		<button class="btn-subscribe" onclick="window.location.href='https://buscabrasil.com?v=<?= $vendedor_id ?>'" aria-label="Assinar plano">Assinar Plano</button>
		<p class="subscribe-desc">Tenha acesso a vários modulos de consultas garantindo sua assinatura no Busca Brasil</p>
		<p id="error-message" class="error-message"></p>
	</div>
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
	<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5167392388652135"
		crossorigin="anonymous"></script>
	<script>
		function onCaptchaSuccess(token) {
			document.getElementById("captcha-response").value = token;
		}
	</script>

	<script src="../assets/js/login.js?v=<?php echo md5_file('../assets/js/login.js'); ?>"></script>
</body>

</html>
