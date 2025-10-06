<?php
session_start();

if (isset($_GET['v'])) {
	$_SESSION['vendedor_id'] = $_GET['v'];
}
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="icon" href="public/assets/img/favicon.png" type="image/png">
	<meta property="og:title" content="Busca Brasil">
	<meta property="og:description" content="Site de buscas">
	<meta property="og:image" content="https://buscabrasil.online/public/assets/img/favicon.jpg">
	<meta property="og:url" content="https://buscabrasil.online">
	<meta property="og:type" content="website">
	<title>Verificando Acesso</title>
	<style>
		body {
			font-family: sans-serif;
			padding: 20px;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 80vh;
		}

		#turnstileWidget {
			margin-top: 15px;
			margin-bottom: 15px;
		}

		#messageArea {
			margin-top: 15px;
			padding: 10px;
			border-radius: 4px;
			min-height: 20px;
			text-align: center;
			width: 300px;
		}

		.message-error {
			background-color: #f8d7da;
			color: #721c24;
			border: 1px solid #f5c6cb;
		}

		.message-success {
			background-color: #d4edda;
			color: #155724;
			border: 1px solid #c3e6cb;
		}

		.message-loading {
			background-color: #e2e3e5;
			color: #383d41;
			border: 1px solid #d6d8db;
		}
	</style>
</head>

<body>

	<h1>Verificando seu acesso...</h1>
	<p>Por favor, complete a verificação abaixo para continuar.</p>

	<div id="turnstileWidget" class="cf-turnstile" data-sitekey="0x4AAAAAABCUfVi2iZQzzgzx" data-callback="onCaptchaSuccess"
		data-error-callback="onCaptchaError">
	</div>

	<div id="messageArea" aria-live="polite"></div>

	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
	<script>
		function onCaptchaSuccess(token) {
			const messageArea = document.getElementById('messageArea');
			messageArea.textContent = "Verificando...";
			messageArea.className = "message-loading";

			fetch('public/backend/verificar_turnstile.php', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded'
					},
					body: new URLSearchParams({
						token
					})
				})
				.then(response => response.json())
				.then(data => {
					if (data.success) {
						messageArea.textContent = "Verificação concluída!";
						messageArea.className = "message-success";
						setTimeout(() => {
							window.location.href = 'public/views/login.php';
						}, 1000);
					} else {
						messageArea.textContent = "Falha na verificação. Tente novamente.";
						messageArea.className = "message-error";
					}
				})
				.catch(() => {
					messageArea.textContent = "Erro ao validar. Tente novamente.";
					messageArea.className = "message-error";
				});
		}
	</script>


</body>

</html>
