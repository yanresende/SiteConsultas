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

function consultarEmprego() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const empregoInput = document.getElementById("emprego");
	const emprego = empregoInput.value;
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	resultadoElement.innerText = "Consultando...";
	dadosElement.style.display = "none";

	const empregoLimpo = emprego.replace(/\D/g, "");
	const modulo = "consulta_emprego";

	// 1. Verificar limite
	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
		.then((response) => response.json())
		.then((verificacao) => {
			if (!verificacao.autorizado) {
				throw new Error("Limite atingido ou acesso negado.");
			}

			resultadoElement.innerText = "Consultando...";

			// Consulta real somente se autorizado
			return fetch("../../backend/consultas/api_emprego.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ emprego: empregoLimpo }),
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
        ${exibirCampo("Nome", pessoa.nome)}
        ${exibirCampo("CPF", pessoa.cpf)}
        ${exibirCampo("PIS", pessoa.pis)}
        ${exibirCampo("Nascimento", pessoa.nascimento)}
        ${exibirCampo("Sexo", pessoa.sexo)}
        ${exibirCampo("CBO", pessoa.cbo)}
        ${exibirCampo("CTPS Número", pessoa.ctps_numero)}
        ${exibirCampo("CTPS Série", pessoa.ctps_serie)}
        ${exibirCampo("Raça/Cor", pessoa.raca_cor)}
        ${exibirCampo("Grau de Instrução", pessoa.grau_instrucao)}
        ${exibirCampo("Salário Mensal", pessoa.salario_mensal)}
        ${exibirCampo("Admissão", pessoa.admissao)}
        ${exibirCampo("Demissão", pessoa.data_demissao || "N/A")}
        ${exibirCampo("Nome Fantasia", pessoa.nome_fantasia)}
        ${exibirCampo(
					"Razão Último Emprego",
					pessoa.razao_possivel_ultimo_emprego || "N/A"
				)}
        ${exibirCampo("Município", pessoa.municipio)}
        ${exibirCampo("UF", pessoa.uf)}
        ${exibirCampo("CNPJ/CEI", pessoa.cnpjcei)}
        ${exibirCampo("Observações", pessoa.obs || "N/A")}
      </div>
    `;
			});

			dadosElement.innerHTML = html;
			dadosElement.style.display = "block";
			resultadoElement.innerText = `Consulta realizada para o Cpf: ${emprego}`;
			document.getElementById("acoes").style.display = "block";

			// Registrar consulta
			return fetch("../../backend/consultas/registrar_consulta.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `modulo=${modulo}`,
			});
		})
		.catch((error) => {
			console.error("Erro ao consultar emprego:", error);
			resultadoElement.innerText = `Erro: ${error.message}`;
			dadosElement.style.display = "none";
		})
		.finally(() => {
			consultarBtn.disabled = false;
			resetCaptcha();
		});
}

function formatCPF(input) {
	let value = input.value.replace(/\D/g, "");
	value = value.replace(/(\d{3})(\d)/, "$1.$2");
	value = value.replace(/(\d{3})(\d)/, "$1.$2");
	value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
	input.value = value;
}
