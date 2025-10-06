function consultarCPF() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const cpf = document.getElementById("cpf").value.replace(/\D/g, "");
	const nome = document.getElementById("nome").value.trim();

	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	resultadoElement.innerText = "Consultando...";
	dadosElement.style.display = "none";

	const modulo = "consulta_pix";

	// Verifica se já existe cache desta API e telefone
	if (
		cacheConsultas[apiSelecionada] &&
		cacheConsultas[apiSelecionada].chave === tel
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

	// 1. Verificar limite
	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
		.then((response) => response.json())
		.then((verificacao) => {
			if (!verificacao.autorizado) {
				throw new Error("Limite atingido ou acesso negado.");
			}

			resultadoElement.innerText = "Consultando...";
			// 2. Fazer a consulta real
			const endpoint =
				apiSelecionada === "api1" ? "api_pix.php" : "api_pix_2.php";

			return fetch(`../../backend/consultas/${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cpf, nome }),
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
			if (!Array.isArray(data.dados) || data.dados.length === 0) {
				throw new Error("Dados inexistentes");
			}
			let html = "";
			if (apiSelecionada === "api1") {
				html += "<h3>Resultados encontrados:</h3>";
				data.dados.forEach((pessoa, index) => {
					const endereco = pessoa.address || {};
					html += `
      <div class="pessoa-card">
        <p><strong>Nome:</strong> ${pessoa.name || "Não disponível"}</p>
        <p><strong>CPF:</strong> ${
					formatarCPF(pessoa.cpf) || "Não disponível"
				}</p>
        <p><strong>Nascimento:</strong> ${
					pessoa.birth_date || "Não disponível"
				}</p>
        <p><strong>Sexo:</strong> ${
					pessoa.gender === "M"
						? "Masculino"
						: pessoa.gender === "F"
						? "Feminino"
						: "Não disponível"
				}</p>
        <p><strong>Mãe:</strong> ${pessoa.mother_name || "Não disponível"}</p>
        <p><strong>Renda Presumida:</strong> R$ ${
					pessoa.presumed_income || "Não disponível"
				}</p>
        <p><strong>Endereço:</strong><br>
        Rua: ${endereco.street || "Não disponível"}<br>
        Número: ${endereco.number || "Não disponível"}<br>
        Complemento: ${endereco.complement || "Não disponível"}<br>
        Bairro: ${endereco.neighborhood || "Não disponível"}<br>
        Cidade: ${endereco.city || "Não disponível"}<br>
        Estado: ${endereco.state || endereco.uf || "Não disponível"}<br>
        CEP: ${endereco.zip_code || "Não disponível"}
</p>

      </div>
      <hr>
    `;
				});
			} else if (apiSelecionada === "api2") {
				const pessoas = data.dados;
				html += `<h3>Resultado da consulta</h3>`;
				pessoas.forEach((pessoa, index) => {
					html += `
      <div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;">
        <h4>Pessoa ${index + 1}</h4>
        ${exibirCampo("Nome", pessoa.nome)}
        ${exibirCampo("CPF", pessoa.cpf)}
        ${exibirCampo("Nome da Mãe", pessoa.nome_mae)}
        ${exibirCampo("Nascimento", pessoa.dt_nascimento)}
        ${exibirCampo("Sexo", pessoa.sexo)}
      </div>
    `;
				});
			}

			dadosElement.innerHTML = html;
			dadosElement.style.display = "block";
			resultadoElement.innerText = `Foram encontrados ${data.dados.length} resultado(s).`;
			ativarBotoes();

			// Salva no cache
			cacheConsultas[apiSelecionada] = {
				dados: data,
				html: html,
				chave: cpf,
			};

			// Registra a consulta
			return fetch("../../backend/consultas/registrar_consulta.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `modulo=${modulo}`,
			});
		})

		.catch((error) => {
			console.error("Erro ao consultar:", error);
			resultadoElement.innerText = `Erro: ${error.message}`;
			dadosElement.style.display = "none";
		})
		.finally(() => {
			consultarBtn.disabled = false;
			resetCaptcha();
		});
}

function formatarCPF(cpf) {
	if (!cpf) return "";
	return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
