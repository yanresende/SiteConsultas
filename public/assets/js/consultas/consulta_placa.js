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

function consultarPlaca() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const placaInput = document.getElementById("placa");
	const placa = placaInput.value;
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	if (placa.length < 8) {
		resultadoElement.innerText = "Placa inválido!";
		consultarBtn.disabled = false;
		return;
	}

	resultadoElement.innerText = "Consultando...";
	dadosElement.style.display = "none";

	const placaLimpo = placa.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

	const modulo = "consulta_placa";

	// 1. Verificar limite
	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
		.then((response) => response.json())
		.then((verificacao) => {
			if (!verificacao.autorizado) {
				throw new Error("Limite atingido ou acesso negado.");
			}

			resultadoElement.innerText = "Consultando...";

			// 2. Fazer a consulta real SOMENTE SE AUTORIZADO
			return fetch("../../backend/consultas/api_placa.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ placa: placaLimpo }),
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
			if (data.erro) {
				throw new Error(data.erro);
			}

			if (!data.sucesso || !Array.isArray(data.dados)) {
				throw new Error("Dados inexistentes / Limite diario atingido");
			}

			let html = `<h3>Resultados encontrados: ${data.dados.length}</h3>`;

			data.dados.forEach((veiculo, index) => {
				const restricoes = veiculo.restrictions || {};
				const faturamento = veiculo.billing || {};
				const ano = veiculo.year || {};
				const local = veiculo.location || {};
				const dono = veiculo.owner || {};
				const multas = veiculo.fines || {};
				const pagamentos = veiculo.payments || {};

				html += `<div style="margin-bottom: 16px; border-bottom: 1px solid #ccc; padding-bottom: 8px;">
    <strong>Veículo ${index + 1}</strong><br>
    ${exibirCampo("Placa", veiculo.plate)}
    ${exibirCampo("Status", veiculo.status)}
    ${exibirCampo("Chassi", veiculo.chassis)}
    ${exibirCampo("Status do Chassi", veiculo.chassis_status)}
    ${exibirCampo("Motor", veiculo.engine)}
    ${exibirCampo("Renavam", veiculo.renavam)}
    ${exibirCampo("Marca", veiculo.brand)}
    ${exibirCampo("Modelo", veiculo.model)}
    ${exibirCampo("Cor", veiculo.color)}
    ${exibirCampo("Ano Fabricação", ano.manufacturing)}
    ${exibirCampo("Ano Modelo", ano.model)}
    ${exibirCampo("Tipo de Veículo", veiculo.vehicle_type)}
    ${exibirCampo("Espécie", veiculo.vehicle_species)}
    ${exibirCampo("Capacidade de Passageiros", veiculo.passenger_capacity)}
    ${exibirCampo("Combustível", veiculo.fuel)}
    ${exibirCampo("Potência", veiculo.power)}
    ${exibirCampo("Capacidade de Carga", veiculo.load_capacity)}
    ${exibirCampo("Nacionalidade", veiculo.nationality)}
    ${exibirCampo("Cilindrada", veiculo.cylinder_capacity)}
    ${exibirCampo("Tipo de Carroceria", veiculo.body_type)}
    ${exibirCampo("Capacidade Máxima de Tração", veiculo.max_traction_capacity)}
    ${exibirCampo("Peso Bruto", veiculo.gross_weight)}
    ${exibirCampo("Câmbio", veiculo.gearbox)}
    ${exibirCampo("Eixos", veiculo.axles)}
    ${exibirCampo("Diferencial Traseiro", veiculo.rear_axle_differential)}
    ${exibirCampo("Terceiro Eixo", veiculo.third_axle)}
    ${exibirCampo("Modelo da Placa Antiga", veiculo.old_plate_model)}
    ${exibirCampo("Modelo da Nova Placa", veiculo.new_plate_model)}
    ${exibirCampo("Nova Placa", veiculo.new_plate)}
    ${exibirCampo("Tipo de Documento do Importador", veiculo.importer_doc_type)}
    ${exibirCampo("Documento do Importador", veiculo.importer_id)}
    ${exibirCampo("DI", veiculo.di)}
    ${exibirCampo("Registro DI", veiculo.di_registration)}
    ${exibirCampo("Unidade Local SRF", veiculo.srf_local_unit)}
    ${exibirCampo("Cidade", local.city)}
    ${exibirCampo("Estado", local.state)}

    <br><strong>Restrições:</strong><br>
    ${exibirCampo("Restrição 1", restricoes.restriction_1)}
    ${exibirCampo("Restrição 2", restricoes.restriction_2)}
    ${exibirCampo("Restrição 3", restricoes.restriction_3)}
    ${exibirCampo("Restrição 4", restricoes.restriction_4)}
    ${exibirCampo(
			"Limite de Restrição Fiscal",
			restricoes.tax_restriction_limit
		)}

    <br><strong>Multas:</strong><br>
    ${exibirCampo("Comprometimento", multas.commitment)}
    ${exibirCampo("Status", multas.status)}
    ${exibirCampo("Valor", multas.value)}

    <br><strong>Pagamentos:</strong><br>
    ${exibirCampo("Tipo", pagamentos.type)}
    ${exibirCampo("Banco", pagamentos.bank)}
    ${exibirCampo("Status", pagamentos.status)}
    ${exibirCampo("Valor", pagamentos.value)}

    <br><strong>Faturamento:</strong><br>
    ${exibirCampo("Documento", faturamento.document)}
    ${exibirCampo("Tipo de Pessoa", faturamento.person_type)}
    ${exibirCampo("Estado", faturamento.state)}

    <br><strong>Proprietário:</strong><br>
    ${exibirCampo("Nome", dono.name)}
    ${exibirCampo("Documento", dono.document)}
  </div>`;
			});

			dadosElement.innerHTML = html;
			dadosElement.style.display = "block";
			resultadoElement.innerText = `Consulta realizada para a placa: ${placa}`;
			document.getElementById("acoes").style.display = "block";
			return fetch("../../backend/consultas/registrar_consulta.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `modulo=${modulo}`,
			});
		})

		.catch((error) => {
			console.error("Erro ao consultar placa:", error);
			resultadoElement.innerText = `Erro: ${error.message}`;
			dadosElement.style.display = "none";
		})
		.finally(() => {
			consultarBtn.disabled = false;
			resetCaptcha();
		});
}

function formatarPlaca(placa) {
  const placaLimpa = placa.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  if (placaLimpa.length === 7) {
    return placaLimpa.replace(/^([A-Z]{3})(\d{4})$/, "$1-$2");
  }

  return placaLimpa;
}


function formatPlaca(input) {
  let value = input.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  if (value.length > 7) {
    value = value.slice(0, 7);
  }

  if (value.length === 7) {
    value = value.replace(/^([A-Z]{3})(\d{4})$/, "$1-$2");
  }

  input.value = value;
}
