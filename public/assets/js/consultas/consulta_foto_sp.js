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
            captchaContainer. innerHTML = ""; // Remove o CAPTCHA antigo
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
    if (valor === null || valor === undefined || valor === "" || valor === "0.00") {
			return `<p><strong>${label}:</strong> <span style="color: yellow;">Disponível no Premium ⭐⭐⭐⭐⭐</span></p>`;
    }
    return `<p><strong>${label}:</strong> ${valor}</p>`;
}


function consultarCPF() {
    if (!captchaValidado) {
        document.getElementById("resultado").innerText = "Por favor, resolva o CAPTCHA.";
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
        return;
    }

    resultadoElement.innerText = "Consultando...";
    dadosElement.style.display = "none";

    const cpfLimpo = cpf.replace(/\D/g, "");

	const modulo = "consulta_foto_sp";

	// 1. Verificar limite
	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
  .then((response) => response.json())
  .then((verificacao) => {
    if (!verificacao.autorizado) {
      throw new Error("Limite atingido ou acesso negado.");
    }

    resultadoElement.innerText = "Consultando...";

    return fetch("../../backend/consultas/api_foto_sp.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: cpfLimpo }),
    });
  })
  .then(async (response) => {
    if (!response) return;

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.indexOf("application/json") !== -1;

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
    if (!data || !data.FOTOB64) {
      throw new Error("Dados inexistentes / Limite diario atingido");
    }

    const html = `
      <p><strong>CPF:</strong> ${data.CPF}</p>
      <p><strong>Origem:</strong> ${data.ORIGEM}</p>
      <div style="text-align:center;">
        <p><strong>Foto:</strong></p>
        <img src="data:image/jpeg;base64,${data.FOTOB64}" alt="Foto do CPF" style="max-width:200px; border:1px solid #ccc; border-radius:8px;">
      </div>
    `;

    dadosElement.innerHTML = html;
    dadosElement.style.display = "block";
    resultadoElement.innerText = `Foto encontrada para o CPF: ${data.CPF}`;
    document.getElementById("acoes").style.display = "block";

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
