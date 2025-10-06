<?php
session_start();
require '../backend/config.php';

$tabela = isset($_SESSION['admin']) ? 'admin' : 'clientes';
$user_id = $_SESSION["usuario_id"] ?? null;

if (!$user_id) {
	header('Location: login.php');
	exit();
}

// Verifica se a conta permite múltiplos logins
$sql = "SELECT session_id, compartilhado FROM $tabela WHERE id = ?";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
	$row = $result->fetch_assoc();

	// Se NÃO permite multilogin e a session não bate, derruba
	if (!$row["compartilhado"] && $row["session_id"] !== session_id()) {
		session_destroy();
		header("Location: login.php?erro=session_duplicada");
		exit();
	}
}
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Busca Brasil</title>
	<link rel="icon" href="../assets/img/favicon.png" type="image/png">
	<meta property="og:title" content="Busca Infos">
	<meta property="og:description" content="Site de buscas">
	<meta property="og:image" content="https://BuscaInfos.online/public/assets/img/favicon.jpg">
	<meta property="og:url" content="https://BuscaInfos.online">
	<meta property="og:type" content="website">
	<link rel="stylesheet" href="../assets/css/aM.css?v=<?php echo md5_file('../assets/css/aM.css'); ?>">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
</head>

<body>
	<header class="top-header">
		<input type="checkbox" id="check">
		<label for="check">
			<i class="fas fa-bars" id="btn"></i>
			<i class="fas fa-times" id="cancel"></i>
		</label>
		<div class="sidebar">
			<h2>Menu</h2>
			<ul>
				<li><a href="usuario_pag.php"><i class=""></i>Perfil 🔐</a></li>
				<li><a href="#" id="revendedor"><i class=""></i>Revendedor: Carregando...</a></li>
				<li><a href="https://wa.me/" id="whatsapp"><i class="fa-brands fa-whatsapp"></i>Whatsapp</a></li>
				<li><a href="#" id="plano"><i class=""></i>Plano: Carregando...</a></li>
				<a href="../backend/logout.php">Sair</a>
			</ul>
		</div>
		<div class="spacer"></div>
		<img src="../assets/img/busca_brasil_icone.png" alt="Logo">
		<div class="spacer"></div>
		<button id="assinarButton">Assinar</button>
	</header>

	<!-- código do popup -->
	<div class="overlay" id="popupOverlay">
		<div class="popup">
			<button class="close-btn" onclick="document.getElementById('popupOverlay').style.display='none'">Fechar</button>

			<img src="../assets/img/busca_brasil_icone.png" alt="Logo Busca Infos" />

			<h2>⚠️ Atenção!</h2>

			<p>
				Todos os pagamentos devem ser realizados exclusivamente através do link oficial <strong>BuscaInfosPay</strong>.
			</p>

			<p>
				O cadastro será liberado automaticamente após a confirmação do pagamento pelo link oficial.
			</p>

			<h3>🔒 Aviso Importante!</h3>

			<p>
				Nenhum representante está autorizado a enviar login e senha para acesso ao painel de consultas.
			</p>
			<p>
				Nosso sistema é de uso exclusivo para assinantes. Disponibilizamos alguns módulos gratuitos apenas para que você possa experimentar nossos serviços.
			</p>
			<p>
				Para ter acesso completo, é necessário adquirir um plano ativo.
			</p>
			<p>
				Atenciosamente,<br>
				Busca Infos
			</p>
		</div>
	</div>

	<!-- Banner grande acima da seção de favoritos -->
	<div class="banner-grande" id="banner-grande"></div>

	<section class="carousel" id="favoritos">
		<h2>Consultas Disponiveis: <span class="contador-modulo1 contador">0</span></h2>
		<!-- 1° FILEIRA DOS Básico -->
		<div class="carousel-container">

			<div class="card basico teste">
				<a href="consultas/consulta_cpf.php"> <img src="../assets/img3D/consulta_CPF_max.jpg" alt="consulta_CPF_max"></a>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<a href="consultas/consulta_tel.php"> <img src="../assets/img3D/buscar_telefone.jpg" alt="consulta_telefone"></a>
				<button class="botao">Sendo Adicionado</button>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<a href="consultas/consulta_email.php"><img src="../assets/img3D/consulta_EMAIL.jpg" alt="consulta_EMAIL"></a>
				<button class="botao">Sendo Adicionado</button>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<a href="consultas/consulta_titulo.php"> <img src="../assets/img3D/titulo_eleitor.jpg" alt="titulo_eleitor">></a>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<a href="consultas/consulta_nome.php"><img src="../assets/img3D/pesquisa_por_nome.jpg" alt="pesquisa_por_nome"></a>
				<button class="botao">Sendo Adicionado</button>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<a href="consultas/consulta_cep.php"> <img src="../assets/img3D/buscar_cep.jpg" alt="buscar_cep"></a>
				<button class="botao">Sendo Adicionado</button>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<a href="consultas/consulta_pix.php"> <img src="../assets/img3D/desmascarar_pix_(adicionando).jpg" alt="desmascarar_pix_(adicionando)"></a>
				<button class="botao">Sendo Adicionado</button>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<a href="consultas/consulta_emprego.php"> <img src="../assets/img/buscar_empregos.jpg" alt="buscar_empregos"></a>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<!--<img src="../assets/img3D/vizinhos.jpg" alt="vizinhos">-->
				<a href="consultas/consulta_vizinhos.php"><img src="../assets/img3D/vizinhos.jpg" alt="buscar_vizinhos"></a>
				<button class="botao">Sendo Adicionado</button>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<!--<img src="../assets/img3D/motor.jpg" alt="vizinhos">-->
				<a href="consultas/consulta_motor.php"><img src="../assets/img3D/motor.jpg" alt="motor"></a>
				<button class="botao">Sendo Adicionado</button>
			</div>
		</div>
		<!-- 2° FILEIRA DOS Básico -->
		<div class="carousel-container">
			<div class="card basico teste" onclick="mostrarBotao(this)">
				<!--<img src="../assets/img3D/consulta_pai.jpg" alt="vizinhos">-->
				<a href="consultas/consulta_pai.php"><img src="../assets/img3D/consulta_pai.jpg" alt="consulta_pai"></a>
				<button class="botao">Sendo Adicionado</button>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<!--<img src="../assets/img3D/buscar_rg.jpg" alt="buscar_rg">-->
				<a href="consultas/consulta_rg.php"><img src="../assets/img3D/buscar_rg.jpg" alt="buscar_rg"></a>
				<button class="botao">Sendo Adicionado</button>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<!--<img src="../assets/img3D/consulta_CNPJ_max.jpg" alt="vizinhos">-->
				<a href="consultas/consulta_cnpj.php"> <img src="../assets/img3D/consulta_CNPJ_max.jpg" alt="consulta_CNPJ"></a>
				<button class="botao">Sendo Adicionado</button>
			</div>

			<div class="card basico teste" onclick="mostrarBotao(this)">
				<a href="consultas/consulta_placa.php"> <img src="../assets/img3D/placaplus_premium.jpg" alt="placa_plus_plano_premium"></a>
			</div>

			<div class="card basico bloqueado">
				<div class="tarjaAdd"></div>
				<img src="../assets/img/gerador_de_rendas.jpg" alt="gerador_de_rendas">
			</div>

			<div class="card basico bloqueado">
				<div class="tarjaAdd bloqueado"></div>
				<img src="../assets/img/buscar_parentes.jpg" alt="buscar_parentes">
			</div>

			<div class="card basico bloqueado">
				<div class="tarjaAdd"></div>
				<img src="../assets/img/motorista_de_99_uber.jpg" alt="/motorista_de_99_uber">
			</div>

			<div class="card basico bloqueado">
				<div class="tarjaAdd"></div>
				<img src="../assets/img3D/consulta_receita_federal.jpg" alt="consulta_receita_federal">
			</div>


			<div class="card basico bloqueado" onclick="mostrarBotao(this)">
				<div class="tarjaAdd"></div>
				<img src="../assets/img/consulta_divida.jpg" alt="consulta_divida">
				<!--<a href="consultas/consulta_dividas.php"><img src="../assets/img/consulta_divida.jpg" alt="consulta_divida">></a>-->
			</div>

			<div class="card basico bloqueado">
				<div class="tarjaAdd"></div>
				<img src="../assets/img3D/CNH_simples.jpg" alt="CNH_simples">
			</div>

		</div>
	</section>

	<section>
		<section class="carousel" id="favoritos">
			<!-- 3° FILEIRA DOS basicos -->
			<div class="carousel-container">

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/consulta_veicular_max_3D.jpg" alt="consulta_veicular_max">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/consulta_frota_veicular.jpg" alt="consulta_frota_veicular">
				</div>


				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/consulta_cadsus.jpg" alt="consulta_cadsus">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/consulta_tracker.jpg" alt="consulta_tracker">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/consultar_FGTS.jpg" alt="consultar_FGTS">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/bacen.jpg" alt="bacen">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/gerar_score.jpg" alt="gerar_score">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/gerador_de_aniversario.jpg" alt="gerador_de_aniversario">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/buscar_assinatura_3D.jpg" alt="buscar_assinatura">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/buscar_processo.jpg" alt="buscar_processo">
				</div>

			</div>

		</section>

		<!-- 4° FILEIRA DOS basicos -->
		<section class="carousel">
			<div class="carousel-container">

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/consulta_INSS.jpg" alt="consulta_INSS">
				</div>

				<div class="card basico bloqueado" onclick="mostrarBotao(this)">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/consulta_funcionarios.jpg" alt="consulta_funcionarios">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/consulta_score.jpg" alt="consulta_score">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/consulta_datecorp.jpg" alt="consulta_datecorp">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/consulta_search_data.jpg" alt="consulta_search_dataa">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/consulta_divida.jpg" alt="consulta_divida">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/consulta_cadin.jpg" alt="consulta_cadin">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/consulta_empresarial.jpg" alt="consulta_empresarial">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/buscar_mandato.jpg" alt="buscar_mandato">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/imprimir_boletim_de_ocorrência.jpg" alt="imprimir_boletim_de_ocorrência">
				</div>
			</div>
		</section>

		<!-- 5° FILEIRA DOS basicos -->
		<section class="carousel">
			<div class="carousel-container">

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/listagem_novos_aposentados.jpg" alt="listagem_novos_aposentados">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/buscar_servidor_publico.jpg" alt="buscar_servidor_publico">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/consulta_tracker_avançado.jpg" alt="consulta_tracker_avançado">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/consultar_empréstimo.jpg" alt="consultar_empréstimo">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/consulta_credi_link.jpg" alt="consulta_credi_link">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/CNH_completa_com_foto.jpg" alt="CNH_completa_com_foto">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/consulta_detran_pro.jpg" alt="consulta_detran_pro.jpg">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/despachante_condutor.jpg" alt="despachante_condutor">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/despachante_veicular.jpg" alt="despachante_veicular">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/buscar_foto.jpg" alt="buscar_foto">
				</div>

			</div>

		</section>

		<!-- 6° FILEIRA DOS basicos -->
		<section class="carousel">
			<div class="carousel-container">

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/consulta_radar_de_veiculos.jpg" alt="consulta_radar_de_veiculos">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/CRLV_Todos_os_estados.jpg" alt="CRLV_(Todos_os_estados)">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/consulta_SERASA.jpg" alt="consulta_SERASA.jpg">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/scpc.jpg" alt="SCPC">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/crv+codigo_3D.jpg" alt="CRV_+código">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/ATPV_atpv.jpg" alt="ATPV">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img3D/busca_chassi.jpg" alt="pesquisa_chassi">
				</div>

				<div class="card basico bloqueado">
					<div class="tarjaAdd"></div>
					<img src="../assets/img/obito.jpg" alt="obito">
				</div>

			</div>

		</section>

	</section>

	<section class="carousel">
		<section>
			<div id="modal" class="modal">
				<div class="modal-content">
					<p>Contrate o Plano</p>
				</div>
		</section>

	</section>

	<div id="modalUpgrade" class="modal">
		<div class="modal-content">
			<span class="close">&times;</span>
			<h3>Recurso bloqueado</h3>
			<p>Este recurso está disponível apenas para planos superiores.</p>
			<button id="upgradeButton">Melhorar plano</button>
		</div>
	</div>

	<footer>
		<div class="copy">
			<p>Copyright © 2025 Busca Infos | All Rights Reserved </p>
		</div>
	</footer>

	<script src="../assets/js/aM.js?v=<?php echo md5_file('../assets/js/aM.js'); ?>"></script>
</body>

</html>
