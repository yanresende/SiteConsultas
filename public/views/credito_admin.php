<?php
$url = "https://economia.awesomeapi.com.br/json/last/USD-BRL";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // só se necessário
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
$resposta = curl_exec($ch);
curl_close($ch);

$data = json_decode($resposta, true);
$cotacaoVenda = $data['USDBRL']['ask'] ?? null;
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
	<meta charset="UTF-8" name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Depósito USDT - Polygon</title>
	<link rel="icon" href="../assets/img/favicon.png" type="image/png">
	<meta property="og:title" content="Busca Infos">
	<meta property="og:description" content="Site de buscas">
	<meta property="og:image" content="https://BuscaInfos.pro/public/assets/img/favicon.jpg">
	<meta property="og:url" content="https://BuscaInfos.pro">
	<meta property="og:type" content="website">
	<link rel="stylesheet" href="../assets/css/credito_admin.css?v=<?php echo md5_file('../assets/css/credito_admin.css'); ?>">
</head>

<body>
	<div class="container">
		<img src="../assets/img/qr_polygon.jpg" alt="QR Code USDT Polygon">

		<div class="endereco" id="walletAddress">
			0x0D8F4c21d6493D79970daaf55339EF304Efa5D6A
		</div>

		<button class="copiar-btn" onclick="copiarEndereco()">Copiar</button>

		<div class="rede">
			Rede: <strong>Polygon</strong>
		</div>

		<div class="alerta">
			Certifique-se de depositar <strong>USDT da Polygon</strong> para este endereço.
		</div>

		<p><strong>Cotação atual do dólar:</strong><br>1 USD =
			<span id="cotacao"><?= $cotacaoVenda ? number_format($cotacaoVenda, 4, ',', '.') : 'Indisponível' ?> BRL</span>
		</p>

		<?php if ($cotacaoVenda): ?>
			<table>
				<thead>
					<tr>
						<th>Valor em BRL</th>
						<th>Equivalente em USDT</th>
						<th>Bônus (%)</th>
						<th>Credito + Bonus</th>
					</tr>
				</thead>
				<tbody>
					<?php
					$valores = [500, 1000, 3000];
					foreach ($valores as $brl) {
						$bonusPercentual = 0;
						if ($brl == 500) $bonusPercentual = 10;
						elseif ($brl >= 1000) $bonusPercentual = 20;

						$bonus = $brl * ($bonusPercentual / 100);
						$totalComBonus = $brl + $bonus;
						$usd = $brl / $cotacaoVenda;

						echo "<tr>
                      <td>R$" . number_format($brl, 2, ',', '.') . "</td>
                      <td>≈ " . number_format($usd, 2) . " USDT</td>
                      <td>" . $bonusPercentual . "%</td>
                      <td>R$" . number_format($totalComBonus, 2, ',', '.') . "</td>
                    </tr>";
					}
					?>
				</tbody>
			</table>
		<?php else: ?>
			<p style="color: #ffcc00;">Não foi possível obter a cotação do dólar no momento.</p>
		<?php endif; ?>
	</div>

	<script>
		function copiarEndereco() {
			const texto = document.getElementById("walletAddress").innerText;
			navigator.clipboard.writeText(texto)
				.then(() => alert("Endereço copiado com sucesso!"))
				.catch(err => alert("Erro ao copiar."));
		}
	</script>
</body>

</html>
