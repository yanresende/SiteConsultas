document.addEventListener("DOMContentLoaded", function () {
	const userForm = document.getElementById("userForm");
	const removeUserForm = document.getElementById("removeUserForm");
	const userListElement = document.getElementById("userList");
	const mensagemCadastro = document.getElementById("mensagemCadastro");
	const mensagemRemocao = document.getElementById("mensagemRemocao");
	const mensagemStatus = document.getElementById("mensagemStatus");
	const formAlterarSenha = document.getElementById("formAlterarSenha");
	const mensagemSenha = document.getElementById("mensagemSenha");
	const formMudarVendedor = document.getElementById("formMudarVendedor");

	// Verifica se os elementos existem antes de adicionar eventos
	if (!userForm || !removeUserForm || !userListElement) {
		console.error(
			"Erro: Um ou mais elementos do formulário não foram encontrados no HTML."
		);
		return;
	}

	// Função genérica para tratar erros de fetch
	function handleFetchError(error, elementMensagem, tipoAcao) {
		console.error(`Erro ao ${tipoAcao}:`, error);
		elementMensagem.textContent = `Erro ao conectar ao servidor durante ${tipoAcao}. Verifique o console (F12).`;
		elementMensagem.style.color = "red";
	}

	// Atualiza a lista de usuários ao carregar a página
	updateUserList();

	// Cadastro de novo usuário
	userForm.addEventListener("submit", async function (event) {
		event.preventDefault();
		const username = document.getElementById("newUser").value;
		const password = document.getElementById("newPassword").value;
		const plano = document.getElementById("novoPlano").value;
		mensagemCadastro.textContent = "";

		try {
			const response = await fetch("../backend/admin/cadastro.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password, plano }),
			});

			const result = await response.json();

			if (result.success) {
				mensagemCadastro.textContent =
					result.message || "Usuário cadastrado com sucesso!";
				mensagemCadastro.style.color = "green";
				userForm.reset();
				updateUserList();

				// Atualiza o crédito consultando o back-end novamente
				fetch("../backend/admin/getCredito.php")
					.then((response) => response.json())
					.then((data) => {
						if (data.success) {
							document.getElementById(
								"creditoDisplay"
							).textContent = `Crédito: R$ ${Number(data.credito).toFixed(2)}`;
						}
					})
					.catch((error) => {
						console.error("Erro ao atualizar crédito:", error);
					});
			} else {
				mensagemCadastro.textContent = result.message || "Erro ao cadastrar.";
				mensagemCadastro.style.color = "red";
			}
		} catch (error) {
			handleFetchError(error, mensagemCadastro, "cadastro");
		}
	});

	// Remover usuário
	removeUserForm.addEventListener("submit", async function (event) {
		event.preventDefault();
		const username = document.getElementById("removeUser").value;
		mensagemRemocao.textContent = "";

		try {
			const response = await fetch("../backend/admin/remover.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username }),
			});

			const result = await response.json();

			if (result.success) {
				mensagemRemocao.textContent =
					result.message || "Usuário removido com sucesso!";
				mensagemRemocao.style.color = "green";
				removeUserForm.reset();
				updateUserList();
			} else {
				mensagemRemocao.textContent = result.message || "Erro ao remover.";
				mensagemRemocao.style.color = "red";
			}
		} catch (error) {
			handleFetchError(error, mensagemRemocao, "remoção");
		}
	});

	// Alterar Senha do Usuário
	formAlterarSenha.addEventListener("submit", async function (event) {
		event.preventDefault();
		const username = document.getElementById("usuarioSenha").value.trim();
		const novaSenha = document.getElementById("novaSenha").value;

		mensagemSenha.textContent = "";

		if (!username || !novaSenha) {
			mensagemSenha.textContent = "Preencha todos os campos.";
			mensagemSenha.style.color = "red";
			return;
		}

		try {
			const response = await fetch("../backend/admin/alterar_senha.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, novaSenha }),
			});

			const result = await response.json();

			if (result.success) {
				mensagemSenha.textContent =
					result.message || "Senha alterada com sucesso!";
				mensagemSenha.style.color = "green";
				formAlterarSenha.reset();
			} else {
				mensagemSenha.textContent = result.message || "Erro ao alterar senha.";
				mensagemSenha.style.color = "red";
			}
		} catch (error) {
			handleFetchError(error, mensagemSenha, "alteração de senha");
		}
	});

	// Atualiza a lista de usuários
	async function updateUserList() {
		userListElement.innerHTML = "<li>Carregando...</li>";

		try {
			const response = await fetch("../backend/admin/listar.php");

			if (!response.ok) {
				let errorText = await response.text();
				throw new Error(
					`Erro do servidor: ${response.status} ${response.statusText}. Resposta: ${errorText}`
				);
			}

			const result = await response.json();

			if (result.success && Array.isArray(result.data)) {
				userListElement.innerHTML = "";

				if (result.data.length === 0) {
					userListElement.innerHTML = "<li>Nenhum usuário cadastrado.</li>";
				} else {
					const resumoDiv = document.getElementById("resumoPlanos");

					// Inicializa contadores para cada plano
					const planosValidos = {
						pro: 0,
						elite: 0,
						"pro anual": 0,
						"elite anual": 0,
					};

					const hoje = new Date();

					result.data.forEach((user) => {
						const expira = new Date(user.data_expira);
						const expirado = expira < hoje;

						// Incrementa o plano se não expirado
						if (
							!expirado &&
							planosValidos.hasOwnProperty(user.plano.toLowerCase())
						) {
							planosValidos[user.plano.toLowerCase()]++;
						}
					});

					// Gera HTML com os totais por plano
					const ordemPlanos = [
						"pro",
						"elite",
						"pro anual",
						"elite anual",
					];
					let resumoHTML = "";
					ordemPlanos.forEach((plano) => {
						const total = planosValidos[plano];
						resumoHTML += `
		<div class="card-plano">
			<h4>${plano}</h4>
			<p>${total} usuário${total !== 1 ? "s" : ""} válido${total !== 1 ? "s" : ""}</p>
		</div>
	`;
					});

					resumoDiv.innerHTML = resumoHTML;

					// Agora lista os usuários normalmente
					result.data.forEach((user) => {
						const li = document.createElement("li");

						const expira = new Date(user.data_expira);
						const expirado = expira < hoje;

						li.classList.add(expirado ? "expirado" : "ativo");

						li.innerHTML = `
  <div class="user-info"><span class="user-label">Usuário:</span> ${
		user.usuario
	}</div>
  <div class="user-info"><span class="user-label">Plano:</span> ${
		user.plano
	}</div>
  <div class="user-info"><span class="user-label">Expira:</span> ${
		user.data_expira
	}</div>
`;

						userListElement.appendChild(li);
					});
				}
			} else {
				throw new Error(result.message || "Erro ao carregar lista.");
			}
		} catch (error) {
			userListElement.innerHTML =
				"<li style='color: red;'>Erro ao carregar lista.</li>";
			console.error("Erro ao carregar lista:", error);
		}
	}
});

document.getElementById("btnRecargaCredito").addEventListener("click", () => {
	window.location.href = "credito_admin.php";
});
