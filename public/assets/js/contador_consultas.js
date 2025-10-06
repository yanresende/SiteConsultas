document.addEventListener("DOMContentLoaded", function () {
	fetch("../backend/admin/get_consultas.php")
		.then((response) => response.json())
		.then((data) => {
			if (data.erro) {
				console.error("Erro:", data.erro);
				return;
			}

			// Consultas normais
			mostrarConsultas("Hoje", data.dia);
			mostrarConsultas("Nesta Semana", data.semana);
			mostrarConsultas("Neste Mês", data.mes);

			// Consultas Landing Page
			mostrarLandingPageConsultas("Landing Page", data.landing_page);
		})
		.catch((error) => console.error("Erro ao carregar consultas:", error));
});

function mostrarConsultas(periodo, dados) {
	const container = document.querySelector(".consultas-tabs");
	const bloco = document.createElement("div");
	bloco.classList.add("consulta-bloco");
	bloco.innerHTML = `<h3>${periodo}</h3>`;

	if (dados.length === 0) {
		bloco.innerHTML += "<p>Sem consultas neste período.</p>";
	} else {
		const lista = document.createElement("ul");
		dados.forEach((item) => {
			lista.innerHTML += `<li><strong>${item.modulo_nome}:</strong> ${item.total} consulta(s)</li>`;
		});
		bloco.appendChild(lista);
	}
	container.appendChild(bloco);
}

function mostrarLandingPageConsultas(titulo, dados) {
	const container = document.querySelector(".consultas-tabs");
	const bloco = document.createElement("div");
	bloco.classList.add("consulta-bloco", "landing-page");
	bloco.innerHTML = `<h3>${titulo}</h3>
        <ul>
            <li><strong>Hoje:</strong> ${dados.dia} consulta(s)</li>
            <li><strong>Nesta Semana:</strong> ${dados.semana} consulta(s)</li>
            <li><strong>Neste Mês:</strong> ${dados.mes} consulta(s)</li>
        </ul>`;
	container.appendChild(bloco);
}

function consultarPeriodo() {
	const dataInicio = document.getElementById("dataInicio").value;
	const dataFim = document.getElementById("dataFim").value;

	if (!dataInicio || !dataFim) {
		alert("Por favor, selecione as duas datas.");
		return;
	}

	fetch(
		`../backend/admin/get_consultas_periodo.php?inicio=${dataInicio}&fim=${dataFim}`
	)
		.then((response) => response.json())
		.then((data) => {
			const container = document.querySelector(".resultado-periodo");
			container.innerHTML = "<h3>Resultado Período Personalizado</h3>";

			if (data.erro) {
				container.innerHTML += `<p>${data.erro}</p>`;
				return;
			}

			let html = "<ul>";
			data.forEach((item) => {
				html += `<li><strong>${item.modulo_nome}:</strong> ${item.total} consulta(s)</li>`;
			});
			html += "</ul>";
			container.innerHTML += html;
		})
		.catch((error) => {
			console.error("Erro:", error);
		});
}

function consultarPeriodo() {
	const dataInicio = document.getElementById("dataInicio").value;
	const dataFim = document.getElementById("dataFim").value;

	if (!dataInicio || !dataFim) {
		alert("Por favor, selecione as duas datas.");
		return;
	}

	fetch(
		`../backend/admin/get_consultas_periodo.php?inicio=${dataInicio}&fim=${dataFim}`
	)
		.then((response) => response.json())
		.then((data) => {
			const container = document.querySelector(".resultado-periodo");
			container.innerHTML = "<h3>Resultado Período Personalizado</h3>";

			if (data.erro) {
				container.innerHTML += `<p>${data.erro}</p>`;
				return;
			}

			let html = "<ul>";
			data.forEach((item) => {
				html += `<li><strong>${item.modulo_nome}:</strong> ${item.total} consulta(s)</li>`;
			});
			html += "</ul>";
			container.innerHTML += html;
		})
		.catch((error) => {
			console.error("Erro:", error);
		});
}
