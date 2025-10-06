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

function consultarTitulo() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const tituloInput = document.getElementById("titulo");
	const titulo = tituloInput.value;
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	resultadoElement.innerText = "Consultando...";
	dadosElement.style.display = "none";

	const tituloLimpo = titulo.replace(/\s/g, "");
	const modulo = "consulta_titulo";

	// 1. Verificar limite
	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
		.then((response) => response.json())
		.then((verificacao) => {
			if (!verificacao.autorizado) {
				throw new Error("Limite atingido ou acesso negado.");
			}

			resultadoElement.innerText = "Consultando...";

			// Consulta real somente se autorizado
			return fetch("../../backend/consultas/api_titulo.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ titulo: tituloLimpo }),
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
		  <h4>Emprego ${index + 1}</h4>
		  ${exibirCampo("Contatos Id", pessoa.contatos_id)}
		  ${exibirCampo("CPF", pessoa.cpf)}
		  ${exibirCampo("Nome", pessoa.nome)}
		  ${exibirCampo("Sexo", pessoa.sexo)}
		  ${exibirCampo("Nascimento", pessoa.nasc)}
		  ${exibirCampo("Nome da Mãe", pessoa.nome_mae)}
		  ${exibirCampo("Nome do Pai", pessoa.nome_pai)}
		  ${exibirCampo("Cadastro Id", pessoa.cadastro_id)}
		  ${exibirCampo("Estado Civil", pessoa.estciv)}
		  ${exibirCampo("RG", pessoa.rg)}
		  ${exibirCampo("Nacionalidade", pessoa.nacionalid)}
		  ${exibirCampo("Contatos Id Cônjuge", pessoa.contatos_id_conjuge)}
		  ${exibirCampo("Sócio", pessoa.so)}
		  ${exibirCampo("Situação Cadastro", pessoa.cd_sit_cad)}
		  ${exibirCampo("Data Situação Cadastro", pessoa.dt_sit_cad)}
		  ${exibirCampo("Data Informação", pessoa.dt_informacao)}
		  ${exibirCampo("CBO", pessoa.cbo)}
		  ${exibirCampo("Órgão Emissor", pessoa.orgao_emissor)}
		  ${exibirCampo("UF Emissão", pessoa.uf_emissao)}
		  ${exibirCampo("Data Óbito", pessoa.dt_ob)}
		  ${exibirCampo("Código Mosaic", pessoa.cd_mosaic)}
		  ${exibirCampo("Renda", pessoa.renda)}
		  ${exibirCampo("Faixa Renda Id", pessoa.faixa_renda_id)}
		  ${exibirCampo("Título Eleitor", pessoa.titulo_eleitor)}
		  ${exibirCampo("Código Mosaic Novo", pessoa.cd_mosaic_novo)}
		  ${exibirCampo("Código Mosaic Secundário", pessoa.cd_mosaic_secundario)}
		</div>
	`;
			});

			dadosElement.innerHTML = html;
			dadosElement.style.display = "block";
			resultadoElement.innerText = `Consulta realizada para o titulo: ${titulo}`;
			document.getElementById("acoes").style.display = "block";

			// Registrar consulta
			return fetch("../../backend/consultas/registrar_consulta.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `modulo=${modulo}`,
			});
		})
		.catch((error) => {
			console.error("Erro ao consultar titulo:", error);
			resultadoElement.innerText = `Erro: ${error.message}`;
			dadosElement.style.display = "none";
		})
		.finally(() => {
			consultarBtn.disabled = false;
			resetCaptcha();
		});
}
