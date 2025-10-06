async function carregarDadosUsuario() {
	try {
		const resposta = await fetch("../backend/get_user_data.php");
		const dados = await resposta.json();

		if (!dados.autenticado) {
			document.getElementById("usuario-card").innerHTML = `
                    <h2>Usuário não autenticado</h2>
                    <p>Por favor, faça login novamente.</p>
                `;
			return;
		}

		document.getElementById("usuario-card").innerHTML = `
    <h2>Bem-vindo, ${dados.usuario}!</h2>

                <div class="info"><span class="label">Plano:</span> ${
									dados.plano
								}</div>

                <a href="https://buscabrasilpay.com?v=${
									dados.vendedor_id
								}" class="renovar-btn" target="_blank">
                    <i class="fas fa-sync-alt"></i> Renovar Plano
                </a>

                <div class="info"><span class="label">Vendedor:</span> ${
									dados.nome
								}</div>

                <a href="${
									dados.whatsapp_revendedor
								}" class="whatsapp-link" target="_blank">
                    <i class="fa-brands fa-whatsapp"></i> Falar no WhatsApp
                </a>

    <a href="#" class="renovar-btn" id="abrir-alterar-senha">Alterar Senha</a>

    <div id="form-alterar-senha" class="senha-card" style="display: none;">
        <h3>Alterar Senha</h3>
        <div class="nova-senha-wrapper">
            <input type="password" id="nova-senha" placeholder="Nova senha" class="input-senha">
            <i class="fa fa-eye" id="toggle-nova-senha" style="cursor: pointer;"></i>
        </div>
        <button id="enviar-alterar-senha" class="btn-salvar">Salvar Nova Senha</button>
        <p id="senha-status"></p>
    </div>

    <a href="aM.php" class="voltar-btn">← Voltar</a>
`;

		// Após o HTML ser inserido no DOM, agora os elementos existem:
		document
			.getElementById("abrir-alterar-senha")
			.addEventListener("click", function (e) {
				e.preventDefault();
				const form = document.getElementById("form-alterar-senha");
				form.style.display = form.style.display === "none" ? "block" : "none";
			});

		document
			.getElementById("toggle-nova-senha")
			.addEventListener("click", function () {
				const input = document.getElementById("nova-senha");
				const icon = document.getElementById("toggle-nova-senha");

				if (input.type === "password") {
					input.type = "text";
					icon.classList.remove("fa-eye");
					icon.classList.add("fa-eye-slash");
				} else {
					input.type = "password";
					icon.classList.remove("fa-eye-slash");
					icon.classList.add("fa-eye");
				}
			});

		document
			.getElementById("enviar-alterar-senha")
			.addEventListener("click", async function () {
				const novaSenha = document.getElementById("nova-senha").value.trim();
				const status = document.getElementById("senha-status");

				if (!novaSenha) {
					status.textContent = "Informe a nova senha!";
					status.style.color = "orange";
					return;
				}

				try {
					const response = await fetch("../backend/alterar_senha_usuario.php", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							username: dados.usuario,
							novaSenha: novaSenha,
						}),
					});

					const result = await response.json();
					status.textContent = result.message;
					status.style.color = result.success ? "lightgreen" : "red";

					if (result.success) {
						document.getElementById("nova-senha").value = "";
					}
				} catch (error) {
					status.textContent = "Erro ao conectar ao servidor.";
					status.style.color = "red";
				}
			});
	} catch (erro) {
		document.getElementById("usuario-card").innerHTML = `
                <h2>Erro ao carregar os dados</h2>
                <p>${erro}</p>
            `;
	}
}

carregarDadosUsuario();
