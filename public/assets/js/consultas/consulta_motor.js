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

function consultarMotor() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const motorInput = document.getElementById("motor");
	const motor = motorInput.value;
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	if (motor.length < 13) {
		resultadoElement.innerText = "Motor inválido!";
		consultarBtn.disabled = false;
		return;
	}

	resultadoElement.innerText = "Verificando limite...";
	dadosElement.style.display = "none";

	const motorLimpo = motor.toUpperCase().replace(/[^A-Z0-9]/g, "");
	const modulo = "consulta_motor";

	// 1. Verificar limite
	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
		.then((response) => response.json())
		.then((verificacao) => {
			if (!verificacao.autorizado) {
				throw new Error("Limite atingido ou acesso negado.");
			}

			resultadoElement.innerText = "Consultando...";

			// 2. Fazer a consulta real
			return fetch("../../backend/consultas/api_motor.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ motor: motorLimpo }),
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
			if (!data || typeof data !== "object" || !data.dados) {
				throw new Error("Dados inexistentes / Limite diário atingido");
			}

			const dados = data.dados;
			let html = "";

			html += "<h3>Informações do Veículo</h3>";
			html += exibirCampo("Placa", dados.license_plate);
			html += exibirCampo("Chassi", dados.chassis);
			html += exibirCampo("Motor", dados.engine);
			html += exibirCampo("Status do Chassi", dados.chassis_status);
			html += exibirCampo("Combustível", dados.fuel);
			html += exibirCampo("Potência (cv)", dados.power);
			html += exibirCampo("Capacidade de Carga (kg)", dados.load_capacity);
			html += exibirCampo("Nacionalidade", dados.nationality);
			html += exibirCampo("Modelo", dados.model);
			html += exibirCampo("Cor", dados.color);
			html += exibirCampo("Cilindrada (cm³)", dados.displacement);
			html += exibirCampo("Tipo de Veículo", dados.vehicle_type);
			html += exibirCampo("Espécie de Veículo", dados.vehicle_species);
			html += exibirCampo(
				"Quantidade de Passageiros",
				dados.passenger_quantity
			);
			html += exibirCampo(
				"Transmissão",
				dados.transmission || "Não disponível"
			);
			html += exibirCampo("Eixos", dados.axles);
			html += exibirCampo(
				"Capacidade Máxima de Tração (kg)",
				dados.max_traction_capacity
			);
			html += exibirCampo("Peso Bruto Total (kg)", dados.gross_weight);

			html += "<h3>Placas</h3>";
			html += exibirCampo(
				"Modelo de Placa Antigo",
				dados.old_license_plate_model
			);
			html += exibirCampo(
				"Modelo de Placa Novo",
				dados.new_license_plate_model
			);
			html += exibirCampo("Nova Placa", dados.new_license_plate);

			html += "<h3>Importação</h3>";
			html += exibirCampo(
				"Tipo Doc Importador",
				dados.importer_doc_type || "Não disponível"
			);
			html += exibirCampo(
				"ID Importador",
				dados.importer_id || "Não disponível"
			);
			html += exibirCampo("DI", dados.di || "Não disponível");
			html += exibirCampo(
				"Registro DI",
				dados.di_registration || "Não disponível"
			);
			html += exibirCampo(
				"Unidade Local SRF",
				dados.srf_local_unit || "Não disponível"
			);

			html += "<h3>Outros Dados</h3>";
			html += exibirCampo("Status", dados.status || "Não disponível");
			html += exibirCampo("Carroceria", dados.body || "Não disponível");
			html += exibirCampo(
				"Diferencial do Eixo Traseiro",
				dados.rear_axle_diff || "Não disponível"
			);
			html += exibirCampo(
				"Terceiro Eixo",
				dados.third_axle || "Não disponível"
			);

			html += "<h3>Localização</h3>";
			html += exibirCampo("Cidade", dados.location?.city);
			html += exibirCampo("Estado", dados.location?.state);

			html += "<h3>Proprietário</h3>";
			html += exibirCampo("Nome", dados.owner?.name || "Não disponível");
			html += exibirCampo("CPF/CNPJ", dados.owner?.cpf);
			html += exibirCampo("Estado", dados.owner?.state);

			html += "<h3>Ano</h3>";
			html += exibirCampo("Fabricação", dados.year?.manufacturing);
			html += exibirCampo("Modelo", dados.year?.model);

			html += "<h3>Faturamento</h3>";
			if (dados.billing) {
				html += exibirCampo("CNPJ", dados.billing.cnpj);
				html += exibirCampo("Tipo de Pessoa", dados.billing.person_type);
				html += exibirCampo("Estado", dados.billing.state);
			} else {
				html += "<p>Não disponível</p>";
			}

			html += "<h3>Restrições</h3>";
			if (dados.restrictions) {
				for (const key in dados.restrictions) {
					html += exibirCampo(
						key.replace("_", " ").toUpperCase(),
						dados.restrictions[key] || "Sem restrição"
					);
				}
			} else {
				html += "<p>Não disponível</p>";
			}

			html += "<h3>Multas</h3>";
			if (
				dados.fines &&
				(dados.fines.commitment || dados.fines.status || dados.fines.value)
			) {
				html += exibirCampo(
					"Comprometimento",
					dados.fines.commitment || "Não disponível"
				);
				html += exibirCampo("Status", dados.fines.status || "Não disponível");
				html += exibirCampo("Valor", dados.fines.value || "0,00");
			} else {
				html += "<p>Não disponível</p>";
			}

			html += "<h3>Pagamentos</h3>";
			if (
				dados.payments &&
				(dados.payments.type ||
					dados.payments.bank ||
					dados.payments.status ||
					dados.payments.value)
			) {
				html += exibirCampo("Tipo", dados.payments.type || "Não disponível");
				html += exibirCampo("Banco", dados.payments.bank || "Não disponível");
				html += exibirCampo(
					"Status",
					dados.payments.status || "Não disponível"
				);
				html += exibirCampo("Valor", dados.payments.value || "0,00");
			} else {
				html += "<p>Não disponível</p>";
			}

			dadosElement.innerHTML = html;
			dadosElement.style.display = "block";
			resultadoElement.innerText = `Consulta realizada para o Motor: ${motor}`;
			document.getElementById("acoes").style.display = "block";

			// 4. Registrar a consulta no banco
			return fetch("../../backend/consultas/registrar_consulta.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `modulo=${modulo}`,
			});
		})
		.catch((error) => {
			console.error("Erro ao consultar Motor:", error);
			resultadoElement.innerText = `Erro: ${error.message}`;
			dadosElement.style.display = "none";
		})
		.finally(() => {
			consultarBtn.disabled = false;
			resetCaptcha();
		});
}
