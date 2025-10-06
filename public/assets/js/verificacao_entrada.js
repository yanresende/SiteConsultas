// js/verificacao_entrada.js

// Referências e Variáveis Globais (se necessário fora das funções)
const messageArea = document.getElementById("messageArea"); // Pode ser pego aqui se preferir
const turnstileWidgetId = "#turnstileWidget"; // ID do div do Turnstile
const loginPageUrl = "public/views/login.php"; // *** URL PARA ONDE REDIRECIONAR ***
const verificationApiUrl = "public/backend/verificar_entrada.php"; // *** API PHP DE VERIFICAÇÃO ***

// ---- Funções de Callback Globais para o Turnstile ----

/**
 * Callback chamado pelo Turnstile quando a verificação é bem-sucedida.
 * @param {string} token O token gerado pelo Turnstile.
 */
function onCaptchaSuccess(token) {
  console.log("Verificação Turnstile cliente OK. Token:", token);
  clearMessages(); // Limpa mensagens anteriores
  displayMessage("Verificando...", "loading");
  // Envia imediatamente o token para o backend para validação
  validarTokenNoBackend(token);
}

/**
 * Callback chamado pelo Turnstile quando ocorre um erro na verificação do lado do cliente.
 * @param {string} errorCode Código de erro fornecido pelo Turnstile.
 */
function onCaptchaError(errorCode) {
  console.error("Erro na verificação Turnstile (cliente):", errorCode);
  displayMessage(
    "Falha na verificação. Por favor, tente novamente. (" + errorCode + ")",
    "error"
  );
  // Não precisamos resetar o token global aqui pois não há botão de reenvio manual
}

// ---- Funções Auxiliares ----

/**
 * Envia o token para o backend para validação final.
 * @param {string} token O token do Turnstile a ser validado.
 */
async function validarTokenNoBackend(token) {
  try {
    const response = await fetch(verificationApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ "cf-turnstile-response": token }),
    });

    const responseData = await response.json().catch(() => null); // Tenta pegar JSON mesmo em erro

    if (!response.ok || !responseData || responseData.success !== true) {
      // Falha na validação do backend ou erro na comunicação
      const errorMessage =
        responseData?.message ||
        `Erro ${response.status || "desconhecido"}. Tente novamente.`;
      throw new Error(errorMessage); // Cai no bloco catch
    }

    // SUCESSO! Backend validou o token.
    console.log("Verificação no backend OK:", responseData.message);
    displayMessage(
      "Verificação concluída! Redirecionando para o login...",
      "success"
    );

    // Redireciona para a página de login após um pequeno atraso
    setTimeout(() => {
      window.location.href = loginPageUrl;
    }, 1500); // Atraso de 1.5 segundos para o usuário ler a mensagem
  } catch (error) {
    // Falha na comunicação ou validação do backend
    console.error("Erro ao validar token no backend:", error);
    displayMessage(
      error.message ||
        "Não foi possível verificar seu acesso. Tente novamente.",
      "error"
    );
    // Reseta o widget para permitir nova tentativa
    resetTurnstile();
  }
}

/**
 * Exibe uma mensagem na área designada.
 * @param {string} text O texto da mensagem.
 * @param {'success'|'error'|'loading'} type O tipo da mensagem (para estilização).
 */
function displayMessage(text, type) {
  const msgArea = document.getElementById("messageArea"); // Pega a referência aqui
  if (msgArea) {
    msgArea.textContent = text;
    msgArea.className = ""; // Limpa classes anteriores
    if (type) {
      msgArea.classList.add(`message-${type}`);
    }
  }
}

/**
 * Limpa a área de mensagens.
 */
function clearMessages() {
  const msgArea = document.getElementById("messageArea");
  if (msgArea) {
    msgArea.textContent = "";
    msgArea.className = "";
  }
}

/**
 * Reseta o widget Cloudflare Turnstile.
 */
function resetTurnstile() {
  try {
    // A função `turnstile` é exposta globalmente pelo script da API
    if (typeof turnstile !== "undefined") {
      turnstile.reset(turnstileWidgetId);
      console.log("Widget Turnstile resetado.");
    }
  } catch (error) {
    console.error("Erro ao tentar resetar o widget Turnstile:", error);
  }
}

// Não precisamos mais do DOMContentLoaded aqui, pois não há listeners para adicionar
// As funções são globais e chamadas diretamente pelos callbacks ou outras funções.
