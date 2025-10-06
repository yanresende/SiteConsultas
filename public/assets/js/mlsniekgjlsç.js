document.addEventListener("DOMContentLoaded", function () {
	const userForm = document.getElementById("userForm");
	const formMudarData = document.getElementById("formMudarData");
	const adminUserForm = document.getElementById("adminUserForm");
	const removeUserForm = document.getElementById("removeUserForm");
	const statusForm = document.getElementById("formAlterarStatus");
	const userListElement = document.getElementById("userList");
	const formAlterarPlano = document.getElementById("formAlterarPlano");
	const mensagemPlano = document.getElementById("mensagemPlano");
	const mensagemCadastro = document.getElementById("mensagemCadastro");
	const mensagemRemocao = document.getElementById("mensagemRemocao");
	const mensagemStatus = document.getElementById("mensagemStatus");
	const formAlterarSenha = document.getElementById("formAlterarSenha");
	const mensagemSenha = document.getElementById("mensagemSenha");
	const formMudarVendedor = document.getElementById("formMudarVendedor");
	const mensagemMudarVendedor = document.getElementById(
		"mensagemMudarVendedor"
	);
	const mensagemMudarData = document.getElementById("mensagemMudarData");
	const mensagemCreditoAdmin = document.getElementById("mensagemCreditoAdmin");
	const mensagemCadastroAdmin = document.getElementById(
		"mensagemCadastroAdmin"
	);

	// Verifica se os elementos existem antes de adicionar eventos
	if (
		!userForm ||
		!removeUserForm ||
		!statusForm ||
		!userListElement ||
		!formMudarVendedor
	) {
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

	if (!formMudarVendedor) {
		console.error(
			"Erro: Formulário 'formMudarVendedor' não encontrado no HTML."
		);
		return;
	}

	formMudarVendedor.addEventListener("submit", async function (event) {
		event.preventDefault();

		const clienteInput = document.getElementById("clienteNome");
		const vendedorInput = document.getElementById("novoVendedorId");

		if (!clienteInput || !vendedorInput) {
			console.error(
				"Erro: Campos 'clienteNome' ou 'novoVendedorId' não encontrados no HTML."
			);
			return;
		}

		const cliente = clienteInput.value.trim();
		const vendedor_id = vendedorInput.value.trim();

		if (!cliente || !vendedor_id) {
			alert("Preencha todos os campos!");
			return;
		}

		try {
			const response = await fetch("../backend/admin/mudar_vendedor.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					cliente: cliente,
					vendedor_id: parseInt(vendedor_id),
				}),
			});

			const result = await response.json();

			if (result.success) {
				showToast(
					result.message || "Vendedor atualizado com sucesso!",
					"success"
				);
			} else {
				showToast(result.message || "Erro ao atualizar!", "error");
			}
		} catch (error) {
			console.error("Erro na requisição:", error);
			showToast(result.message || "Erro ao enviar solicitação.", "error");
		}
	});

	// Cadastro de novo usuário
	userForm.addEventListener("submit", async function (event) {
		event.preventDefault();
		const username = document.getElementById("newUser").value;
		const password = document.getElementById("newPassword").value;
		const plano = document.getElementById("novoPlanoCad").value;
		const novoVend = document.getElementById("vendedorCadastro").value;
		mensagemCadastro.textContent = "";

		try {
			const response = await fetch("../backend/admin/cadastroAdm.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password, plano, novoVend }),
			});

			const result = await response.json();

			if (result.success) {
				showToast(
					result.message || "Usuário cadastrado com sucesso!",
					"success"
				);
				userForm.reset();
				updateUserList();
			} else {
				showToast(result.message || "Erro ao cadastrar.", "error");
			}
		} catch (error) {
			handleFetchError(error, mensagemCadastro, "cadastro");
		}
	});

	// Cadastro de novo admin
	adminUserForm.addEventListener("submit", async function (event) {
		event.preventDefault();
		const usernameAdmin = document.getElementById("newAdmin").value;
		const passwordAdmin = document.getElementById("newPasswordAdmin").value;
		const newNomeVendedor = document.getElementById("newNomeVendedor").value;
		const newTelVendedor = document.getElementById("newTelVendedor").value;
		const newCreditoVendedor =
			document.getElementById("newCreditoVendedor").value;
		mensagemCadastroAdmin.textContent = "";

		try {
			const response = await fetch("../backend/admin/cadastrarAdmin.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					usernameAdmin,
					passwordAdmin,
					newNomeVendedor,
					newTelVendedor,
					newCreditoVendedor,
				}),
			});

			const result = await response.json();

			if (result.success) {
				const vendedorId = result.vendedor_id;
				const visitanteUsername = `visitante${vendedorId}`;
				showToast(result.message || "Admin cadastrado com sucesso!", "success");
				mensagemCadastroAdmin.textContent =
					(result.message || "Usuário cadastrado com sucesso!") +
					(vendedorId ? ` (ID do vendedor: ${vendedorId})` : "") +
					" Link de venda: newmaxbuscaspay.com?v=" +
					(vendedorId ? `${vendedorId}` : "");
				mensagemCadastroAdmin.style.color = "green";

				// CADASTRAR USUÁRIO VISITANTE AUTOMATICAMENTE
				if (vendedorId) {
					const visitanteData = {
						username: visitanteUsername,
						password: "123",
						plano: 7,
						novoVend: vendedorId,
					};

					try {
						const visitanteResponse = await fetch(
							"../backend/admin/cadastroAdm.php",
							{
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify(visitanteData),
							}
						);

						const visitanteResult = await visitanteResponse.json();

						if (visitanteResult.success) {
							showInfoModal(vendedorId, visitanteUsername);
						} else {
							mensagemCadastroAdmin.textContent += `\nFalha ao criar usuário visitante: ${visitanteResult.message}`;
						}
					} catch (visitanteError) {
						mensagemCadastroAdmin.textContent += `\nErro ao cadastrar usuário visitante.`;
						console.error("Erro ao cadastrar visitante:", visitanteError);
					}
				}

				userForm.reset();
				updateUserList();
			} else {
				showToast(result.message || "Erro ao cadastrar.", "error");
			}
		} catch (error) {
			handleFetchError(error, mensagemCadastroAdmin, "cadastro");
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
				showToast(result.message || "Usuário removido com sucesso!", "success");
				removeUserForm.reset();
				updateUserList();
			} else {
				showToast(result.message || "Erro ao remover.", "error");
			}
		} catch (error) {
			handleFetchError(error, mensagemRemocao, "remoção");
		}
	});

	// Alterar Status do Usuário
	statusForm.addEventListener("submit", async function (event) {
		event.preventDefault();
		const username = document.getElementById("statusUsername").value;
		const status = document.getElementById("statusSelect").value;
		mensagemStatus.textContent = "";

		try {
			const response = await fetch("../backend/admin/alterar_status.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, status }),
			});

			const result = await response.json();

			if (result.success) {
				showToast(result.message || "Status alterado com sucesso!", "success");
				statusForm.reset();
				updateUserList();
			} else {
				showToast(result.message || "Erro ao alterar status.", "error");
			}
		} catch (error) {
			handleFetchError(error, mensagemStatus, "alteração de status");
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
				showToast(result.message || "Senha alterada com sucesso!", "success");
				formAlterarSenha.reset();
			} else {
				showToast(result.message || "Erro ao alterar senha.", "error");
			}
		} catch (error) {
			handleFetchError(error, mensagemSenha, "alteração de senha");
		}
	});

	// Alterar Plano do Usuário
	formAlterarPlano.addEventListener("submit", async function (event) {
		event.preventDefault();

		const username = document.getElementById("usuarioPlano").value.trim();
		const plano = document.getElementById("novoPlano").value;

		mensagemPlano.textContent = "";

		if (!username || !plano) {
			mensagemPlano.textContent = "Preencha todos os campos.";
			mensagemPlano.style.color = "red";
			return;
		}

		try {
			const response = await fetch("../backend/admin/alterar_plano.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, plano }),
			});

			const result = await response.json();

			if (result.success) {
				showToast(result.message || "Plano alterado com sucesso!", "success");
				formAlterarPlano.reset();
			} else {
				showToast(result.message || "Erro ao alterar plano.", "error");
			}
		} catch (error) {
			console.error("Erro ao alterar plano:", error);
			mensagemPlano.textContent = "Erro ao enviar solicitação.";
			mensagemPlano.style.color = "red";
		}
	});

	// Alterar Credito do Usuário
	creditoForm.addEventListener("submit", async function (event) {
		event.preventDefault();
		const idUsernameCredito = document
			.getElementById("vendedorCredito")
			.value.trim();
		const novoCredito = document.getElementById("newCredito").value;
		mensagemCreditoAdmin.textContent = "";
		if (!idUsernameCredito || !novoCredito) {
			mensagemCreditoAdmin.textContent = "Preencha todos os campos.";
			mensagemCreditoAdmin.style.color = "red";
			return;
		}
		try {
			const response = await fetch("../backend/admin/alterar_credito.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ idUsernameCredito, novoCredito }),
			});

			const result = await response.json();

			if (result.success) {
				showToast(result.message || "Credito alterado com sucesso!", "success");
				creditoForm.reset();
			} else {
				showToast(result.message || "Erro ao alterar credito.", "error");
			}
		} catch (error) {
			console.error("Erro ao alterar credito:", error);
			mensagemCreditoAdmin.textContent = "Erro ao enviar solicitação.";
			mensagemCreditoAdmin.style.color = "red";
		}
	});

	// Alterar Data do Usuário
	formMudarData.addEventListener("submit", async function (event) {
		event.preventDefault();
		const usernameData = document.getElementById("clienteNomeData").value;
		const data = document.getElementById("novaData").value;
		mensagemStatus.textContent = "";

		try {
			const response = await fetch("../backend/admin/alterar_data.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ usernameData, data }),
			});

			const result = await response.json();

			if (result.success) {
				showToast(result.message || "Data alterado com sucesso!", "success");
				statusForm.reset();
				updateUserList();
			} else {
				showToast(result.message || "Erro ao alterar data.", "error");
			}
		} catch (error) {
			handleFetchError(error, mensagemMudarData, "alteração de status");
		}
	});

	// Atualiza a lista de usuários
	async function updateUserList() {
		userListElement.innerHTML = "<li>Carregando...</li>";

		try {
			const response = await fetch("../backend/admin/listarAdm.php");

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
						diamante: 0,
						"pro anual": 0,
						"elite anual": 0,
						vendedor: 0,
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
						"vendedor",
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

function showToast(message, type = "success") {
	const toast = document.getElementById("toast");
	toast.textContent = message;
	toast.className = `toast show ${type}`;

	setTimeout(() => {
		toast.classList.remove("show");
	}, 4000); // Fecha após 4 segundos
}

function showInfoModal(vendedorId, visitanteUsername) {
	const modal = document.getElementById("infoModal");
	document.getElementById("modalVendedorId").textContent = vendedorId;
	document.getElementById(
		"modalLinkVenda"
	).textContent = `https://newmaxbuscaspay.com?v=${vendedorId}`;
	document.getElementById("modalVisitanteUser").textContent = visitanteUsername;

	modal.classList.remove("hidden");
	modal.style.display = "block";

	document.getElementById("closeModal").onclick = () => {
		modal.style.display = "none";
	};

	window.onclick = function (event) {
		if (event.target === modal) {
			modal.style.display = "none";
		}
	};
}
