let captchaValidado = false;
let apiSelecionada = document.getElementById("apiSelecionada").value;
const cacheConsultas = {};

function selecionarApi(api) {
	apiSelecionada = api;

	// Remove 'active' de todos os botões
	document.getElementById("btn-api1").classList.remove("active");
	if (document.getElementById("btn-api2")) {
		document.getElementById("btn-api2").classList.remove("active");
	}
	if (document.getElementById("btn-api3")) {
		document.getElementById("btn-api3").classList.remove("active");
	}

	// Adiciona 'active' no botão selecionado
	document.getElementById("btn-" + api).classList.add("active");

	// Verifica se há cache para essa API e exibe os dados automaticamente
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	if (cacheConsultas[api]) {
		const cached = cacheConsultas[api];
		resultadoElement.innerText = `Consulta realizada para a pesquisa: ${cached.chave} (cache)`;
		dadosElement.innerHTML = cached.html;
		dadosElement.style.display = "block";
		document.getElementById("acoes").style.display = "block";
	} else {
		// Se não há cache, limpa a área de dados
		resultadoElement.innerText = "Selecione uma API e consulte.";
		dadosElement.style.display = "none";
		document.getElementById("acoes").style.display = "none";
	}
}

document.querySelectorAll(".api-btn").forEach((btn) => {
	if (btn.classList.contains("offline")) {
		btn.textContent = "Offline";
	}
});

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
		valor === "0.00" ||
		valor === "INDEFINIDO"
	) {
		return `<p><strong>${label}:</strong> <span style="color: yellow;">Disponível no Premium ⭐⭐⭐⭐⭐</span></p>`;
	}
	return `<p><strong>${label}:</strong> ${valor}</p>`;
}
