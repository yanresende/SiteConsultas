function consultarEmail() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const emailInput = document.getElementById("email");
	const email = emailInput.value;
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	resultadoElement.innerText = "Consultando...";
	dadosElement.style.display = "none";

	const emailLimpo = email.replace(/\s/g, "");
	const modulo = "consulta_email";

	// Verifica se já existe cache desta API e telefone
	if (
		cacheConsultas[apiSelecionada] &&
		cacheConsultas[apiSelecionada].chave === email
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
				apiSelecionada === "api1" ? "api_email.php" : "api_email_2.php";

			return fetch(`../../backend/consultas/${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: emailLimpo }),
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
		.then((resposta) => {
			if (!resposta) return;

			const pessoas = resposta.dados;

			if (!Array.isArray(pessoas) || pessoas.length === 0) {
				resultadoElement.innerText =
					"Dados inexistentes / Limite diario atingido";
				return;
			}
			let html = "";

			if (apiSelecionada === "api1") {
				html += `<h3>Resultado da consulta</h3>`;
				pessoas.forEach((pessoa, index) => {
					const endereco = pessoa.address || {};
					const emailData = pessoa.email_data || {};

					html += `
			<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;">
			  <h4>Pessoa ${index + 1}</h4>
			  ${exibirCampo("Nome", pessoa.name)}
			  ${exibirCampo("CPF", pessoa.cpf)}
			  ${exibirCampo("RG", pessoa.rg)}
			  ${exibirCampo("Nome da Mãe", pessoa.mother_name)}

			  <br><strong>Endereço:</strong><br>
			  ${exibirCampo("Tipo", endereco.type)}
			  ${exibirCampo("Rua", endereco.street)}
			  ${exibirCampo("Número", endereco.number)}
			  ${exibirCampo("Complemento", endereco.complement)}
			  ${exibirCampo("Bairro", endereco.neighborhood)}
			  ${exibirCampo("Cidade", endereco.city)}
			  ${exibirCampo("CEP", endereco.postal_code)}

			  <br><strong>Informações de Email:</strong><br>
			  ${exibirCampo("Email", emailData.email)}
			  ${exibirCampo("Prioridade", emailData.priority)}
			  ${exibirCampo("Score", emailData.score)}
			  ${exibirCampo("Email Pessoal?", emailData.personal_email)}
			  ${exibirCampo("Estrutura", emailData.structure)}
			</div>
		  `;
				});
			} else if (apiSelecionada === "api2") {
				const pessoas = resposta.dados;
				html += `<h3>Resultado da consulta</h3>`;
				pessoas.forEach((pessoa, index) => {
					html += `
        <div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;">
        <h4>Emprego ${index + 1}</h4>
		${exibirCampo("Contatos Id", pessoa.contatos_id)}
        ${exibirCampo("Email", pessoa.email)}
        ${exibirCampo("Prioridade", pessoa.prioridade)}
        ${exibirCampo("Email Score", pessoa.email_score)}
        ${exibirCampo("Email Pessoal", pessoa.email_pessoal)}
        ${exibirCampo("Email Duplicado", pessoa.email_duplicado)}
        ${exibirCampo("Blacklist", pessoa.blacklist)}
        ${exibirCampo("Estrutura", pessoa.estrutura)}
        ${exibirCampo("Status_vt", pessoa.status_vt)}
        ${exibirCampo("Dominio", pessoa.dominio)}
        ${exibirCampo("Mapas", pessoa.mapas)}
        ${exibirCampo("Peso", pessoa.peso)}
        ${exibirCampo("Cadastro Id", pessoa.cadastro_id)}
        ${exibirCampo("Data inclusão", pessoa.dt_inclusao || "N/A")}
        ${exibirCampo("Nome Fantasia", pessoa.dados_pessoais.cpf)}
		${exibirCampo("Nome", pessoa.dados_pessoais.nome)}
		${exibirCampo("Sexo", pessoa.dados_pessoais.sexo)}
		${exibirCampo("Nascimento", pessoa.dados_pessoais.nasc)}
		${exibirCampo("Nome da Mãe", pessoa.dados_pessoais.nome_mae)}
		${exibirCampo("Nome do Pai", pessoa.dados_pessoais.nome_pai)}
		${exibirCampo("Cadastro Id", pessoa.dados_pessoais.cadastro_id)}
		${exibirCampo("Estado Civil", pessoa.dados_pessoais.estciv)}
		${exibirCampo("RG", pessoa.dados_pessoais.rg)}
		${exibirCampo("Nacionalidade", pessoa.dados_pessoais.nacionalid)}
		${exibirCampo("Id do Cônjuge", pessoa.dados_pessoais.contatos_id_conjuge)}
		${exibirCampo("Sócio", pessoa.dados_pessoais.so)}
		${exibirCampo("Situação Cadastro", pessoa.dados_pessoais.cd_sit_cad)}
		${exibirCampo("Data Situação Cadastro", pessoa.dados_pessoais.dt_sit_cad)}
		${exibirCampo("Data Informação", pessoa.dados_pessoais.dt_informacao)}
		${exibirCampo("CBO", pessoa.dados_pessoais.cbo)}
		${exibirCampo("Órgão Emissor", pessoa.dados_pessoais.orgao_emissor)}
		${exibirCampo("UF Emissão", pessoa.dados_pessoais.uf_emissao)}
		${exibirCampo("Data Óbito", pessoa.dados_pessoais.dt_ob)}
		${exibirCampo("Código Mosaic", pessoa.dados_pessoais.cd_mosaic)}
		${exibirCampo("Renda", pessoa.dados_pessoais.renda)}
		${exibirCampo("Faixa Renda Id", pessoa.dados_pessoais.faixa_renda_id)}
		${exibirCampo("Título de Eleitor", pessoa.dados_pessoais.titulo_eleitor)}
		${exibirCampo("Código Mosaic Novo", pessoa.dados_pessoais.cd_mosaic_novo)}
		${exibirCampo(
			"Código Mosaic Secundário",
			pessoa.dados_pessoais.cd_mosaic_secundario
		)}

      </div>
    `;
				});
			}

			dadosElement.innerHTML = html;
			dadosElement.style.display = "block";
			resultadoElement.innerText = `Consulta realizada para o Email: ${email}`;
			ativarBotoes();

			// Salva no cache
			cacheConsultas[apiSelecionada] = {
				dados: resposta,
				html: html,
				chave: email,
			};

			// Registrar consulta
			return fetch("../../backend/consultas/registrar_consulta.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `modulo=${modulo}`,
			});
		})
		.catch((error) => {
			console.error("Erro ao consultar Email:", error);
			resultadoElement.innerText = `Erro: ${error.message}`;
			dadosElement.style.display = "none";
		})
		.finally(() => {
			consultarBtn.disabled = false;
			resetCaptcha();
		});
}
