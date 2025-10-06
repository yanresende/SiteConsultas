let captchaValidado = false;

function onCaptchaSuccess() {
	captchaValidado = true;
	document.getElementById("consultarBtn").disabled = false;
}

function resetCaptcha() {
	captchaValidado = false; // Reseta a validação do CAPTCHA
	document.getElementById("consultarBtn").disabled = true; // Desativa o botão

	setTimeout(() => {
		const captchaContainer = document.getElementById("captcha");
		if (captchaContainer) {
			captchaContainer.innerHTML = ""; // Remove o CAPTCHA antigo
			turnstile.render("#captcha", {
				sitekey: "0x4AAAAAABCUfVi2iZQzzgzx",
				callback: onCaptchaSuccess,
			});
		} else {
			console.warn("Elemento CAPTCHA não encontrado!");
		}
	}, 500); // Aguarda 500ms antes de recriar o CAPTCHA
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

function consultarVizinho() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const cpfInput = document.getElementById("cpf");
	const cpf = cpfInput.value;
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	if (cpf.length < 14) {
		resultadoElement.innerText = "CPF inválido!";
		consultarBtn.disabled = false;
		return;
	}

	resultadoElement.innerText = "Verificando limite...";
	dadosElement.style.display = "none";

	const cpfLimpo = cpf.replace(/\D/g, "");
	const modulo = "consulta_vizinhos";

	// 1. Verificar limite
	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
		.then((response) => response.json())
		.then((verificacao) => {
			if (!verificacao.autorizado) {
				throw new Error("Limite atingido ou acesso negado.");
			}

			resultadoElement.innerText = "Consultando...";

			// 2. Fazer a consulta real
			return fetch("../../backend/consultas/api_vizinhos.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cpf: cpfLimpo }),
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
			if (!data || !Array.isArray(data.dados) || data.dados.length === 0) {
				throw new Error("Nenhum vizinho encontrado.");
			}


			// 3. Exibir os dados (sua lógica atual permanece aqui)
			const dados = data.dados;

			let html = "<h3>Vizinhos encontrados:</h3>";

			data.dados.forEach((vizinho, index) => {
				const endereco = vizinho.address || {};
				html += `
		<div style="margin-bottom: 15px; border: 1px solid #ccc; padding: 10px; border-radius: 8px;">
			<p><strong>#${index + 1}</strong></p>
			<p><strong>Nome:</strong> ${vizinho.name || "Não disponível"}</p>
			<p><strong>CPF:</strong> ${formatarCPF(vizinho.cpf)}</p>
			<p><strong>Endereço:</strong> ${endereco.type || ""} ${
					endereco.street || ""
				}, ${endereco.number || ""} - ${endereco.neighborhood || ""}, ${
					endereco.city || ""
				} - ${endereco.state || ""} (${endereco.cep || ""})</p>
		</div>
	`;
			});


			dadosElement.innerHTML = html;
			dadosElement.style.display = "block";
			resultadoElement.innerText = `Consulta realizada para o CPF: ${cpf}`;
			document.getElementById("acoes").style.display = "block";

			// 4. Registrar a consulta no banco
			return fetch("../../backend/consultas/registrar_consulta.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `modulo=${modulo}`,
			});
		})
		.catch((error) => {
			console.error("Erro ao consultar CPF:", error);
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

function formatCPF(input) {
	let value = input.value.replace(/\D/g, "");
	value = value.replace(/(\d{3})(\d)/, "$1.$2");
	value = value.replace(/(\d{3})(\d)/, "$1.$2");
	value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
	input.value = value;
}
