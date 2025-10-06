const banner = document.querySelector(".banner-grande");
const imagens = [
	"../assets/img_banner/banner_principal1.jpg",
	"../assets/img_banner/banner_premium.jpg",
	"../assets/img_banner/assine_o_plano_diamante.jpg",
];

let index = 0;

setInterval(() => {
	index = (index + 1) % imagens.length;
	banner.style.backgroundImage = `url('${imagens[index]}')`;
}, 4000); // Troca a imagem a cada 4 segundos

// Função para alterar a imagem do banner grande
function alterarBanner(imagem) {
	document.getElementById(
		"banner-grande"
	).style.backgroundImage = `url('${imagem}')`;
}

document.querySelectorAll(".carousel-container").forEach((container) => {
	let isDown = false;
	let startX;
	let scrollLeft;
	container.addEventListener("mousedown", (e) => {
		isDown = true;
		startX = e.pageX - container.offsetLeft;
		scrollLeft = container.scrollLeft;
	});
	container.addEventListener("mouseleave", () => {
		isDown = false;
	});
	container.addEventListener("mouseup", () => {
		isDown = false;
	});
	container.addEventListener("mousemove", (e) => {
		if (!isDown) return;
		e.preventDefault();
		const x = e.pageX - container.offsetLeft;
		const walk = (x - startX) * 2;
		container.scrollLeft = scrollLeft - walk;
	});

	// Função para abrir o modal
	function abrirModal() {
		document.getElementById("modal").style.display = "flex";
	}

	// Função para fechar o modal
	function fecharModal() {
		document.getElementById("modal").style.display = "none";
	}

	// Adiciona o evento de clique aos cards
	document.querySelectorAll(".card.pequeno").forEach((card) => {
		card.addEventListener("click", abrirModal);
	});

	// Fecha o modal se o fundo (fora da área modal) for clicado
	document.getElementById("modal").addEventListener("click", function (event) {
		if (event.target === document.getElementById("modal")) {
			fecharModal();
		}
	});
});

document.addEventListener("DOMContentLoaded", function () {
	fetch("../backend/get_user_data.php")
		.then((response) => {
			if (!response.ok) {
				throw new Error("Erro ao carregar os dados do usuário");
			}
			return response.json();
		})
		.then((data) => {
			console.log("Dados recebidos:", data); // Para depuração

			if (!data || !data.autenticado) {
				console.warn("Usuário não autenticado, redirecionando...");
				window.location.href = "login.php";
				return;
			}

			// Atualiza os elementos da página com os dados do usuário
			document.getElementById(
				"revendedor"
			).innerHTML = `Revendedor: ${data.nome}`;
			document
				.getElementById("whatsapp")
				.setAttribute("href", data.whatsapp_revendedor);
			document.getElementById("plano").innerHTML = `Plano: ${data.plano}`;
			document.getElementById("upgradeButton").onclick = function () {
				window.location.href = `https://newmaxbuscaspay.com?v=${data.vendedor_id}`;
			};
			document.getElementById("assinarButton").onclick = function () {
				window.location.href = `https://newmaxbuscaspay.com?v=${data.vendedor_id}`;
			};

			// Depois de carregar dados do usuário, carrega as consultas:
			carregarConsultasDoDia();

			// Verifica permissões de acesso
			aplicarPermissoes(data.plano_id);
		})
		.catch((error) => {
			console.error("Erro ao carregar os dados do usuário:", error);
			window.location.href = "login.php";
		});
});

function carregarConsultasDoDia() {
	fetch("../backend/get_consultas_do_dia.php")
		.then((response) => response.json())
		.then((data) => {
			if (data.sucesso) {
				const limite = data.limite;

				for (const [modulo_id, quantidade] of Object.entries(data.consultas)) {
					const contadores = document.querySelectorAll(
						`.contador-modulo${modulo_id}`
					);

					contadores.forEach((contador) => {
						contador.classList.remove("bg-verde", "bg-vermelho");

						if (limite === null) {
							contador.textContent = `ilimitado`;
							contador.classList.add("bg-verde");
							contador.title = "Este módulo possui consultas ilimitadas.";
							verificarPlano(contador);
						} else {
							const restante = limite - quantidade;
							contador.textContent = `${quantidade}/${limite}`;
							contador.title = `Você usou ${quantidade} de ${limite} consultas hoje.`;

							if (quantidade >= limite) {
								contador.classList.add("bg-vermelho");
							} else {
								contador.classList.add("bg-verde");
							}
							verificarPlano(contador);
						}
					});
				}
			}
		})
		.catch((error) => console.error("Erro ao carregar consultas:", error));
}

function verificarPlano(contador) {
	fetch("../backend/get_user_data.php")
		.then((response) => response.json())
		.then((data) => {
			if (data.autenticado) {
				const dataExpira = new Date(data.data_expira);
				const hoje = new Date();

				// Zera horas para comparar apenas a data
				dataExpira.setHours(0, 0, 0, 0);
				hoje.setHours(0, 0, 0, 0);

				if (dataExpira < hoje) {
					contador.textContent = `Plano vencido`;
					contador.title = `Seu plano expirou.`;
					contador.classList.remove("bg-verde", "bg-vermelho");
					contador.classList.add("bg-vermelho");
				}
			}
		})
		.catch((error) => {
			console.error("Erro ao verificar plano:", error);
		});
}

function aplicarPermissoes(plano_id) {
	const acessos = {
		1: ["pro", "elite", "pro anual", "elite anual","teste"],
		2: ["pro", "elite", "pro anual", "elite anual","teste"],
		3: ["pro", "elite", "pro anual", "elite anual","teste"],
		4: ["pro", "elite", "pro anual", "elite anual","teste"],
		5: ["pro", "elite", "pro anual", "elite anual","teste"],
	};

	const permissoes = acessos[plano_id] || [];

	document.querySelectorAll(".card").forEach((card) => {
		if (card.classList.contains("grande")) return;
		const cardClasses = Array.from(card.classList);
		const liberado = cardClasses.some((c) => permissoes.includes(c));

		const tipoModal = plano_id === 7 ? 7 : 7;
		if (!liberado) {
			card.classList.add("desativado");
			card.addEventListener("click", (e) => {
				e.stopPropagation();
				abrirModalUpgrade(tipoModal);
			});
			card.style.opacity = "0.7";

			const tarja = card.querySelector(".tarjaAdd");
			if (tarja) {
				tarja.textContent = "Bloqueado";
				tarja.classList.add("bloqueado");
			}

			// Esconde o contador também:
			const contador = card.querySelector(".contador");
			if (contador) {
				contador.style.display = "none";
			}

			// DESATIVA O LINK
			const link = card.querySelector("a");
			if (link) {
				link.removeAttribute("href");
				link.addEventListener("click", (e) => e.preventDefault());
			}
		}
	});
}

// Modal funcionalidade
function abrirModalUpgrade(tipo = "padrao") {
	const modal = document.getElementById("modalUpgrade");
	const mensagem = modal.querySelector("p");
	const mensagemBotao = document.getElementById("upgradeButton");

	if (tipo === "teste") {
		mensagem.textContent =
			"Este recurso está disponível apenas para assinantes.";
		mensagemBotao.textContent = "Assinar Plano";
	} else {
		mensagem.textContent =
			"Este recurso está disponível apenas para planos superiores.";
		mensagemBotao.textContent = "Melhorar Plano";
	}

	modal.style.display = "flex";
}

function fecharModalUpgrade() {
	document.getElementById("modalUpgrade").style.display = "none";
}

document
	.querySelector(".modal .close")
	.addEventListener("click", fecharModalUpgrade);
window.addEventListener("click", function (e) {
	const modal = document.getElementById("modalUpgrade");
	if (e.target === modal) {
		fecharModalUpgrade();
	}
});
