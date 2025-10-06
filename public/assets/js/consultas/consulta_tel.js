function consultarTel() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const telInput = document.getElementById("tel");
	const tel = telInput.value;
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	if (tel.length < 12) {
		resultadoElement.innerText = "Telefone inválido!";
		consultarBtn.disabled = false;
		return;
	}

	resultadoElement.innerText = "Consultando...";
	dadosElement.style.display = "none";

	const telLimpo = tel.replace(/\D/g, "");
	const modulo = "consulta_tel";

	// Verifica se já existe cache desta API e telefone
	if (
		cacheConsultas[apiSelecionada] &&
		cacheConsultas[apiSelecionada].chave === tel
	) {
		console.log("Usando cache para a consulta.");
		const cached = cacheConsultas[apiSelecionada];
		resultadoElement.innerText = `Consulta realizada para o pesquisa: ${cached.chave} (cache)`;
		dadosElement.innerHTML = cached.html;
		dadosElement.style.display = "block";
		ativarBotoes();
		consultarBtn.disabled = false;
		resetCaptcha();
		return;
	}

	// Verifica o limite e só faz a consulta se estiver autorizado
	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
		.then((response) => response.json())
		.then((verificacao) => {
			if (!verificacao.autorizado) {
				throw new Error("Limite atingido ou acesso negado.");
			}

			resultadoElement.innerText = "Consultando...";

			// 2. Fazer a consulta real
			let endpoint = "";

			switch (apiSelecionada) {
				case "api1":
					endpoint = "api_tel.php";
					break;
				case "api2":
					endpoint = "api_tel_2.php";
					break;
				case "api3":
					endpoint = "api_tel_3.php";
					break;
				default:
					throw new Error("API selecionada inválida.");
			}

			return fetch(`../../backend/consultas/${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ tel: telLimpo }),
			});
		})
		.then(async (response) => {
			if (!response) return;

			const contentType = response.headers.get("content-type");
			const isJson =
				contentType && contentType.indexOf("application/json") !== -1;

			if (!response.ok) {
				let errorMessage = `Erro na consulta (${response.status}).`;

				if (isJson) {
					const errorData = await response.json();
					errorMessage = errorData.erro || errorMessage;
				}

				throw new Error(errorMessage);
			}

			return isJson ? response.json() : null;
		})
		.then((data) => {
			let html = "";

			if (apiSelecionada === "api1") {
				if (!data.sucesso || data.dados.length === 0) {
					throw new Error("Dados inexistentes");
				}
				html += `<h3>Resultados encontrados: ${data.dados.length}</h3>`;

				data.dados.forEach((pessoa, index) => {
					const endereco = pessoa.address || {};

					html += `<div style="margin-bottom: 16px; border-bottom: 1px solid #ccc; padding-bottom: 8px;">
			  <strong>Resultado ${index + 1}</strong><br>
			  ${exibirCampo("Nome", pessoa.name)}
			  ${exibirCampo("CPF", pessoa.document)}
			  ${exibirCampo("Telefone", pessoa.phone)}
			  <br><strong>Endereço:</strong><br>
			  ${exibirCampo("Rua", endereco.street)}
			  ${exibirCampo("Número", endereco.number)}
			  ${exibirCampo("Bairro", endereco.neighborhood)}
			  ${exibirCampo("CEP", endereco.zip_code)}
			  ${exibirCampo("Cidade", endereco.city)}
			  ${exibirCampo("Estado", endereco.state)}
			</div>`;
				});
			} else if (apiSelecionada === "api2") {
				const dados = data.dados;
				if (!Array.isArray(dados) || dados.length === 0) {
					resultadoElement.innerText =
						"Dados inexistentes / Limite diario atingido";
					return;
				}
				html += `<h3>Resultado da consulta</h3>`;
				dados.forEach((dado, index) => {
					html += `<div style="margin-bottom: 16px; border-bottom: 1px solid #ccc; padding-bottom: 8px;">
          <strong>Resultado ${index + 1}</strong><br>
          ${exibirCampo("Nome", dado.nome)}
          ${exibirCampo("CPF", dado.cpf)}
          ${exibirCampo("Telefone", dado.telefone)}
		  ${exibirCampo("Operadora", dado.operadora)}
        </div>`;
				});
			} else if (apiSelecionada === "api3") {
				const dados = data.dados;
				if (!Array.isArray(dados) || dados.length === 0) {
					resultadoElement.innerText =
						"Dados inexistentes / Limite diario atingido";
					return;
				}

				html += `<h3>Resultado da consulta</h3>`;
				dados.forEach((dado, index) => {
					const dadosBasicos = dado.dados_basicos;
					const endereco = dado.endereco;
					const veiculos = dado.veiculos;
					const telefones = dado.telefones;
					const celulares = dado.celulares;

					html += `<div style="margin-bottom: 16px; border-bottom: 1px solid #ccc; padding-bottom: 8px;">
        <strong>Resultado ${index + 1}</strong><br>
        ${exibirCampo("Nome", dadosBasicos.nome)}
        ${exibirCampo("CPF", dadosBasicos.cpf)}
        ${exibirCampo("Nascimento", dadosBasicos.nascimento)}
        ${exibirCampo("Nome da Mãe", dadosBasicos.nome_mae)}
        ${exibirCampo("Sexo", dadosBasicos.sexo)}
        ${exibirCampo("Email", dadosBasicos.email)}
        ${exibirCampo(
					"Óbito",
					dadosBasicos.obito ? dadosBasicos.obito.status : "N/A"
				)}
        ${exibirCampo("Status Receita", dadosBasicos.status_receita)}
        ${exibirCampo("Quantidade de Veículos", dadosBasicos.qt_veiculos)}
        ${exibirCampo("Faixa de Renda", dadosBasicos.faixa_renda)}

        <h4>Endereço</h4>
        ${exibirCampo("Tipo", endereco.tipo)}
        ${exibirCampo("Logradouro", endereco.logradouro)}
        ${exibirCampo("Número", endereco.numero)}
        ${exibirCampo("Complemento", endereco.complemento)}
        ${exibirCampo("Bairro", endereco.bairro)}
        ${exibirCampo("Cidade", endereco.cidade)}
        ${exibirCampo("Estado", endereco.estado)}
        ${exibirCampo("UF", endereco.uf)}
        ${exibirCampo("CEP", endereco.cep)}

        <h4>Telefones</h4>
        ${
					telefones && telefones.length > 0
						? telefones.map((tel) => exibirCampo("Telefone", tel)).join("")
						: "<p>Nenhum telefone encontrado.</p>"
				}

        <h4>Celulares</h4>
        ${
					celulares && celulares.length > 0
						? celulares.map((cel) => exibirCampo("Celular", cel)).join("")
						: "<p>Nenhum celular encontrado.</p>"
				}

        <h4>Veículos</h4>
        ${
					veiculos && veiculos.length > 0
						? veiculos
								.map((veic) => `<pre>${JSON.stringify(veic, null, 2)}</pre>`)
								.join("")
						: "<p>Nenhum veículo encontrado.</p>"
				}
        </div>`;
				});
			}

			// Exibe os dados formatados
			dadosElement.innerHTML = html;
			dadosElement.style.display = "block";
			resultadoElement.innerText = `Consulta realizada para o telefone: ${tel}`;
			ativarBotoes();

			// Salva no cache
			cacheConsultas[apiSelecionada] = {
				dados: data,
				html: html,
				chave: tel,
			};

			// Registra a consulta
			return fetch("../../backend/consultas/registrar_consulta.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `modulo=${modulo}`,
			});
		})
		.catch((error) => {
			console.error("Erro ao consultar telefone:", error);
			resultadoElement.innerText = `Erro: ${error.message}`;
			dadosElement.style.display = "none";
		})
		.finally(() => {
			consultarBtn.disabled = false;
			resetCaptcha();
		});
}

function formatarTelefone(tel) {
	const telLimpo = tel.replace(/\D/g, "");
	return telLimpo.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}

function formatTel(input) {
	let value = input.value.replace(/\D/g, "");
	value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
	value = value.replace(/(\d{5})(\d)/, "$1-$2");

	input.value = value;
}
