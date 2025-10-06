let captchaValidado = false;

function onCaptchaSuccess() {
  captchaValidado = true;
  document.getElementById("consultarBtn").disabled = false;
}

function resetCaptcha() {
  captchaValidado = false;
  document.getElementById("consultarBtn").disabled = true;

  setTimeout(() => {
    const captchaContainer = document.getElementById("captcha");
    if (captchaContainer) {
      captchaContainer.innerHTML = "";
      turnstile.render("#captcha", {
        sitekey: "0x4AAAAAABCUfVi2iZQzzgzx",
        callback: onCaptchaSuccess,
      });
    } else {
      console.warn("Elemento CAPTCHA não encontrado!");
    }
  }, 500);
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

function consultarCNPJ() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const cnpjInput = document.getElementById("cnpj");
	const cnpj = cnpjInput.value;
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	if (cnpj.length < 12) {
		resultadoElement.innerText = "CNPJ inválido!";
		consultarBtn.disabled = false;
		return;
	}

	resultadoElement.innerText = "Consultando...";
	dadosElement.style.display = "none";

	const cnpjLimpo = cnpj.replace(/\D/g, "");
	const modulo = "consulta_cnpj";

	// 1. Verificar limite
	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
		.then((response) => response.json())
		.then((verificacao) => {
			if (!verificacao.autorizado) {
				throw new Error("Limite atingido ou acesso negado.");
			}

			resultadoElement.innerText = "Consultando...";

			// 2. Fazer a consulta real
			return fetch("../../backend/consultas/api_cnpj.php", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cnpj: cnpjLimpo }),
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

			let empresa = data.dados;
			const endereco = empresa.address || {};
			const contato = empresa.contact || {};
			const atividades = empresa.activities || {};
			const socios = empresa.partners || [];

			let html = `<h3>Resultado da consulta</h3>`;

			html += `
        ${exibirCampo("CNPJ", empresa.document)}
        ${exibirCampo("Nome Empresarial", empresa.name)}
        ${exibirCampo("Nome Fantasia", empresa.trade_name)}
        ${exibirCampo("Tipo", empresa.type)}
        ${exibirCampo("Situação Cadastral", empresa.status)}
        ${exibirCampo("Data de Abertura", empresa.opening_date)}
        ${exibirCampo("Porte", empresa.size)}
        ${exibirCampo("Natureza Jurídica", empresa.legal_nature)}
        ${exibirCampo("Capital Social", `R$ ${empresa.capital}`)}
        ${exibirCampo("Telefone", contato.phone)}

        <br><strong>Endereço:</strong><br>
        ${exibirCampo("Rua", endereco.street)}
        ${exibirCampo("Número", endereco.number)}
        ${exibirCampo("Complemento", endereco.complement)}
        ${exibirCampo("Bairro", endereco.neighborhood)}
        ${exibirCampo("CEP", endereco.postal_code)}
        ${exibirCampo("Cidade", endereco.city)}
        ${exibirCampo("Estado", endereco.state)}
      `;

			if (atividades.secondary && atividades.secondary.length > 0) {
				html += `<br><strong>Atividades Secundárias:</strong><ul>`;
				atividades.secondary.forEach((atividade) => {
					html += `<li>${atividade.codigo} - ${atividade.descricao}</li>`;
				});
				html += `</ul>`;
			}

			if (socios.length > 0) {
				html += `<br><strong>Sócios:</strong><br>`;

				const promises = socios.map(async (socio) => {
					let cpfCompleto = socio.cpf_cnpj;

					// Verifica se o CPF está mascarado com *
					if (cpfCompleto && cpfCompleto.includes("*")) {
						cpfCompleto = cpfCompleto.replace(/\*/g, ""); // remove os asteriscos

						try {
							const response = await fetch(
								"../../backend/consultas/api_pix.php",
								{
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({ cpf: cpfCompleto, nome: socio.nome }),
								}
							);

							if (response.ok) {
								const data = await response.json();

								// Se a API retornar um CPF completo, substituímos
								if (data && data.sucesso && Array.isArray(data.dados)) {
									const pessoa = data.dados[0];
									if (pessoa && pessoa.cpf) {
										cpfCompleto = pessoa.cpf;
									}
								}
							}
						} catch (error) {
							console.warn("Erro ao buscar CPF completo via PIX:", error);
						}
					}

					html += `
		<div style="margin-bottom: 8px; border: 1px solid #ccc; padding: 6px;">
			${exibirCampo("Nome", socio.nome)}
			<p><strong>CPF/CNPJ:</strong> <span style="color: yellow;">Disponível no Premium ⭐⭐⭐⭐⭐</span></p>
			${exibirCampo("Faixa Etária", socio.faixa_etaria)}
			${exibirCampo("Qualificação", socio.qualificacao)}
			${exibirCampo("Data de Entrada", socio.data_entrada)}
		</div>
	`;
				});

				Promise.all(promises).then(() => {
					dadosElement.innerHTML = html;
					dadosElement.style.display = "block";
					resultadoElement.innerText = `Consulta realizada para o CNPJ: ${cnpj}`;
					document.getElementById("acoes").style.display = "block";

					// Registro da consulta
					return fetch("../../backend/consultas/registrar_consulta.php", {
						method: "POST",
						headers: { "Content-Type": "application/x-www-form-urlencoded" },
						body: `modulo=${modulo}`,
					});
				});
			} else {
				// Sem sócios, exibe mesmo assim
				dadosElement.innerHTML = html;
				dadosElement.style.display = "block";
				resultadoElement.innerText = `Consulta realizada para o CNPJ: ${cnpj}`;
				document.getElementById("acoes").style.display = "block";
			}
		})
		.catch((error) => {
			resultadoElement.innerText = `Erro: ${error.message}`;
		})
		.finally(() => {
			consultarBtn.disabled = false;
		});
}

function formatarCNPJ(cnpj) {
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

function formatCNPJ(input) {
  let value = input.value.replace(/\D/g, "");
  value = value.replace(/^(\d{2})(\d)/, "$1.$2");
  value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4");
  value = value.replace(
    /^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/,
    "$1.$2.$3/$4-$5"
  );

  input.value = value;
}
