let captchaValidado = false;

function onCaptchaSuccess() {
  captchaValidado = true;
  document.getElementById("consultarBtn").disabled = false;
}

function resetCaptcha() {
  captchaValidado = false;
  document.getElementById("consultarBtn").disabled = true;

  setTimeout(() => {
    const captchaContainer = document.getElementById("captcha");
    if (captchaContainer) {
      captchaContainer.innerHTML = "";
      turnstile.render("#captcha", {
				sitekey: "0x4AAAAAABCUfVi2iZQzzgzx",
				callback: onCaptchaSuccess,
			});
    } else {
      console.warn("Elemento CAPTCHA não encontrado!");
    }
  }, 500);
}

function exibirCampo(label, valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === "" ||
    valor === "0.00"
  ) {
    return `<p><strong>${label}:</strong> <span style="color: yellow;">Disponível no Premium ⭐⭐⭐⭐⭐</span></p>`;
  }
  return `<p><strong>${label}:</strong> ${valor}</p>`;
}

function consultarDividas() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const dividasInput = document.getElementById("dividas");
	const dividas = dividasInput.value;
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	resultadoElement.innerText = "Consultando...";
	dadosElement.style.display = "none";

	const dividasLimpo = dividas.replace(/\D/g, "");
	const modulo = "consulta_dividas";

	// 1. Verificar limite
	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
		.then((response) => response.json())
		.then((verificacao) => {
			if (!verificacao.autorizado) {
				throw new Error("Limite atingido ou acesso negado.");
			}

			resultadoElement.innerText = "Consultando...";

			// Consulta real somente se autorizado
			return fetch("../../backend/consultas/api_dividas.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ dividas: dividasLimpo }),
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

			const pessoas = resposta.data;

			if (!Array.isArray(pessoas) || pessoas.length === 0) {
				resultadoElement.innerText =
					"Dados inexistentes / Limite diario atingido";
				return;
			}

			let html = `<h3>Resultado da consulta</h3>`;
			pessoas.forEach((pessoa, index) => {
				html += `
		<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;">
		  <h4>Dívida ${index + 1}</h4>
		  ${exibirCampo("CPF/CNPJ", pessoa.cpf_cnpj)}
		  ${exibirCampo("Tipo Pessoa", pessoa.tipo_pessoa)}
		  ${exibirCampo("Tipo Devedor", pessoa.tipo_devedor)}
		  ${exibirCampo("Nome Devedor", pessoa.nome_devedor)}
		  ${exibirCampo("UF Devedor", pessoa.uf_devedor)}
		  ${exibirCampo("Unidade Responsável", pessoa.unidade_responsavel)}
		  ${exibirCampo("Número Inscrição", pessoa.numero_inscricao)}
		  ${exibirCampo("Tipo Situação Inscrição", pessoa.tipo_situacao_inscricao)}
		  ${exibirCampo("Situação Inscrição", pessoa.situacao_inscricao)}
		  ${exibirCampo("Tipo Crédito", pessoa.tipo_credito)}
		  ${exibirCampo("Data Inscrição", pessoa.data_inscricao)}
		  ${exibirCampo("Indicador de Prejuízo", pessoa.indicador_de_prejuizo)}
		  ${exibirCampo("Valor Consolidado", pessoa.valor_consolidado)}
		  ${exibirCampo("SIDA", pessoa.sida)}
		  ${exibirCampo("FGTS", pessoa.fgts)}
		</div>
	`;
			});

			dadosElement.innerHTML = html;
			dadosElement.style.display = "block";
			resultadoElement.innerText = `Consulta realizada para o Cpf: ${dividas}`;
			document.getElementById("acoes").style.display = "block";

			// Registrar consulta
			return fetch("../../backend/consultas/registrar_consulta.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `modulo=${modulo}`,
			});
		})
		.catch((error) => {
			console.error("Erro ao consultar dividas:", error);
			resultadoElement.innerText = `Erro: ${error.message}`;
			dadosElement.style.display = "none";
		})
		.finally(() => {
			consultarBtn.disabled = false;
			resetCaptcha();
		});
}
