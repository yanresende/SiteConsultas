document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault(); // Evita o envio padrão do formulário

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const captchaResponse = document.getElementById("captcha-response").value; // Obtém o token do CAPTCHA
    const errorMessage = document.getElementById("error-message");

    errorMessage.textContent = ""; // Limpa mensagens anteriores

    // Validação básica
    if (!username || !password) {
      errorMessage.textContent = "Preencha todos os campos!";
      resetCaptcha();
      return;
    }

    if (!captchaResponse) {
      errorMessage.textContent = "Por favor, resolva o CAPTCHA.";
      return;
    }

    try {
      const response = await fetch("../backend/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, captchaResponse }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.redirect;
      } else {
        errorMessage.textContent = data.message;
        resetCaptcha(); // Reseta o CAPTCHA ao falhar
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      errorMessage.textContent = "Erro ao conectar ao servidor.";
      resetCaptcha(); // Reseta o CAPTCHA mesmo em caso de erro inesperado
    }
  });

  function resetCaptcha() {
    document.getElementById("captcha-response").value = ""; // Limpa o token

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
    }, 500); // Pequeno delay para evitar falhas no reset
  }
});
