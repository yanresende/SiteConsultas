function consultarCep() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const cepInput = document.getElementById("cep");
	const cep = cepInput.value;
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	if (cep.length < 8) {
		resultadoElement.innerText = "CEP inválido!";
		consultarBtn.disabled = false;
		return;
	}

	resultadoElement.innerText = "Consultando...";
	dadosElement.style.display = "none";

	const cepLimpo = cep.replace(/\D/g, "");
	const modulo = "consulta_cep";

	// Verifica se já existe cache desta API e telefone
	if (
		cacheConsultas[apiSelecionada] &&
		cacheConsultas[apiSelecionada].chave === cep
	) {
		console.log("Usando cache para a consulta.");
		const cached = cacheConsultas[apiSelecionada];
		resultadoElement.innerText = `Consulta realizada para a pesquisa: ${cached.chave} (cache)`;
		dadosElement.innerHTML = cached.html;
		dadosElement.style.display = "block";
		ativarBotoes();
		consultarBtn.disabled = false;
		resetCaptcha();
		return;
	}

	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
		.then((response) => response.json())
		.then((verificacao) => {
			if (!verificacao.autorizado) {
				throw new Error("Limite atingido ou acesso negado.");
			}

			resultadoElement.innerText = "Consultando...";

			// 2. Fazer a consulta real
			const endpoint =
				apiSelecionada === "api1" ? "api_cep.php" : "api_cep_2.php";

			return fetch(`../../backend/consultas/${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cep: cepLimpo }),
			});
		})
		.then(async (response) => {
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
			if (!data) throw new Error("Resposta vazia");

			let html = "";

			if (apiSelecionada === "api1") {
				if (
					!data.sucesso ||
					!Array.isArray(data.dados) ||
					data.dados.length === 0
				) {
					throw new Error("Dados inexistentes / Limite diário atingido");
				}

				html += `<h3>Resultados encontrados: ${data.dados.length}</h3>`;
				data.dados.forEach((pessoa, index) => {
					const endereco = pessoa.endereco || {};
					html += `<div>
                        <strong>Resultado ${index + 1}</strong><br>
                        ${exibirCampo("Nome", pessoa.nome)}
                        ${exibirCampo("CPF", pessoa.cpf)}
                        ${exibirCampo("Nome da Mãe", pessoa.mae)}
                        <br><strong>Endereço:</strong><br>
                        ${exibirCampo("Rua", endereco.logradouro)}
                        ${exibirCampo("Número", endereco.numero)}
                        ${exibirCampo("Complemento", endereco.complemento)}
                        ${exibirCampo("Bairro", endereco.bairro)}
                        ${exibirCampo("CEP", endereco.cep)}
                        ${exibirCampo("Cidade", endereco.cidade)}
                        ${exibirCampo("Estado", endereco.estado)}
                    </div><hr>`;
				});
			} else if (apiSelecionada === "api2") {
				const pessoas = data.data;
				if (!Array.isArray(pessoas) || pessoas.length === 0) {
					throw new Error("Dados inexistentes / Limite diário atingido");
				}

				html += `<h3>Resultado da consulta</h3>`;
				pessoas.forEach((pessoa, index) => {
					html += `<div>
                        <strong>Pessoa ${index + 1}</strong><br>
                        ${exibirCampo("Nome", pessoa.dados_pessoais.nome)}
                        ${exibirCampo("CPF", pessoa.dados_pessoais.cpf)}
                        ${exibirCampo(
													"Nome da Mãe",
													pessoa.dados_pessoais.nome_mae
												)}
                        ${exibirCampo("Renda", pessoa.dados_pessoais.renda)}
                        ${exibirCampo("Nascimento", pessoa.dados_pessoais.nasc)}
                        ${exibirCampo("Logradouro", pessoa.logradouro)}
                        ${exibirCampo("Número", pessoa.numero)}
                        ${exibirCampo("Bairro", pessoa.bairro)}
                        ${exibirCampo("Cidade", pessoa.cidade)}
                        ${exibirCampo("CEP", pessoa.cep)}
                        ${exibirCampo("Estado", pessoa.uf)}
                    </div><hr>`;
				});
			}

			dadosElement.innerHTML = html;
			dadosElement.style.display = "block";
			resultadoElement.innerText = `Consulta realizada para o CEP: ${cep}`;
			ativarBotoes();

			// Salva no cache
			cacheConsultas[apiSelecionada] = {
				dados: data,
				html: html,
				chave: cep,
			};

			return fetch("../../backend/consultas/registrar_consulta.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `modulo=${modulo}`,
			});
		})
		.catch((error) => {
			console.error("Erro ao consultar CEP:", error);
			resultadoElement.innerText = `Erro: ${error.message}`;
			dadosElement.style.display = "none";
		})
		.finally(() => {
			consultarBtn.disabled = false;
			resetCaptcha();
		});
}

function formatarCep(cep) {
	const cepLimpo = cep.replace(/\D/g, "");
	return cepLimpo.replace(/(\d{5})(\d{3})/, "$1-$2");
}

function formatCep(input) {
	let value = input.value.replace(/\D/g, "");
	value = value.replace(/(\d{5})(\d)/, "$1-$2");
	input.value = value;
}
