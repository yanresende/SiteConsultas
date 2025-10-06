function consultarCPF() {
	if (!captchaValidado) {
		document.getElementById("resultado").innerText =
			"Por favor, resolva o CAPTCHA.";
		return;
	}

	const consultarBtn = document.getElementById("consultarBtn");
	consultarBtn.disabled = true;

	const cpfInput = document.getElementById("cpf");
	const cpf = cpfInput.value;
	const resultadoElement = document.getElementById("resultado");
	const dadosElement = document.getElementById("dados");

	if (cpf.length < 14) {
		resultadoElement.innerText = "CPF inválido!";
		consultarBtn.disabled = false;
		return;
	}

	resultadoElement.innerText = "Verificando limite...";
	dadosElement.style.display = "none";

	const cpfLimpo = cpf.replace(/\D/g, "");
	const modulo = "consulta_cpf";

	// Verifica se já existe cache desta API
	if (
		cacheConsultas[apiSelecionada] &&
		cacheConsultas[apiSelecionada].chave === cpf
	) {
		console.log("Usando cache para a consulta.");
		const cached = cacheConsultas[apiSelecionada];
		resultadoElement.innerText = `Consulta realizada para a pesquisa: ${cached.chave} (cache)`;
		dadosElement.innerHTML = cached.html;
		dadosElement.style.display = "block";
		ativarBotoes();
		consultarBtn.disabled = false;
		resetCaptcha();
		return;
	}

	// 1. Verificar limite
	fetch(`../../backend/consultas/verificar_limite.php?modulo=${modulo}`)
		.then((response) => response.json())
		.then((verificacao) => {
			if (!verificacao.autorizado) {
				throw new Error("Limite atingido ou acesso negado.");
			}

			resultadoElement.innerText = "Consultando...";

			// 2. Fazer a consulta real
			let endpoint = "";

			switch (apiSelecionada) {
				case "api1":
					endpoint = "api_cpf.php";
					break;
				case "api2":
					endpoint = "api_cpf_2.php";
					break;
				case "api3":
					endpoint = "api_cpf_3.php";
					break;
				default:
					throw new Error("API selecionada inválida.");
			}

			return fetch(`../../backend/consultas/${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cpf: cpfLimpo }),
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
			// 3. Exibir os dados
			let html = "";

			if (apiSelecionada === "api1") {
				if (!data || !data.dados || typeof data.dados !== "object") {
					throw new Error("Dados inexistentes / Limite diario atingido");
				}
				const dados = data.dados;

				const info = dados.personal_info || {};
				html += "<h3>Informações Pessoais</h3>";
				html += exibirCampo("Nome", info.name);
				html += exibirCampo("CPF", formatarCPF(info.document_number));
				html += exibirCampo("Nascimento", info.birthday_date);
				html += exibirCampo(
					"Sexo",
					info.gender === "M" ? "Masculino" : "Feminino"
				);
				html += exibirCampo("Nome da Mãe", info.mother_name);
				html += exibirCampo("Nome do Pai", info.father_name);
				html += exibirCampo("Nacionalidade", info.nationality);
				html += exibirCampo("Renda", info.income);

				const identificacao = dados.identification || {};
				html += "<h3>Documentos</h3>";
				html += exibirCampo("CNS", identificacao.cns);

				const rg = identificacao.rg || {};
				html += exibirCampo("RG", rg.number);
				html += exibirCampo("Órgão Emissor", rg.issuing_body);
				html += exibirCampo("UF de Emissão", rg.uf_emission);
				html += exibirCampo("Data de Emissão", rg.emission_date);

				const titulo = identificacao.voter_title || {};
				html += exibirCampo("Título de Eleitor", titulo.number);
				html += exibirCampo("Zona Eleitoral", titulo.zone);
				html += exibirCampo("Seção Eleitoral", titulo.section);

				const ctps = identificacao.work_card || {};
				html += exibirCampo("Carteira de Trabalho", ctps.number);
				html += exibirCampo("Série", ctps.series);
				html += exibirCampo("Ano de Registro", ctps.registration_year);

				const status = dados.status?.registration_status || {};
				html += "<h3>Status</h3>";
				html += exibirCampo("Status Receita", status.description);
				html += exibirCampo("Data", status.date);
				html += exibirCampo("Óbito", dados.status?.death ? "Sim" : "Não");

				const score = dados.score || {};
				html += "<h3>Score</h3>";
				html += exibirCampo("Score CSBA", score.score_csba);
				html += exibirCampo("Risco", score.score_csba_risk_range);

				const serasa = dados.serasa?.new_mosaic || {};
				html += "<h3>Perfil Serasa</h3>";
				html += exibirCampo("Código", serasa.code);
				html += exibirCampo("Descrição", serasa.description);
				html += exibirCampo("Classe", serasa.class);

				const poderCompra = dados.purchasing_power || {};
				html += "<h3>Poder de Compra</h3>";
				html += exibirCampo("Descrição", poderCompra.description);
				html += exibirCampo("Faixa", poderCompra.range);
				html += exibirCampo("Renda Estimada", poderCompra.income);

				html += "<h3>Endereços</h3>";
				if (dados.addresses?.length) {
					dados.addresses.forEach((end) => {
						html += `<p>${end.type || ""} ${end.place || ""}, ${
							end.number || "s/n"
						} - ${end.neighborhood || ""}, ${end.city || ""} - ${
							end.state || ""
						} (${end.zip_code || ""})</p>`;
					});
				} else {
					html += "<p>Não disponível</p>";
				}

				html += "<h3>Telefones</h3>";
				if (dados.phones?.length) {
					html += dados.phones.map((tel) => `<p>${tel.number}</p>`).join("");
				} else {
					html += "<p>Não disponível</p>";
				}

				html += "<h3>Empregos</h3>";
				if (dados.jobs?.length) {
					dados.jobs.forEach((emp) => {
						html += `<p><strong>Empresa:</strong> ${
							emp.trade_name || "N/A"
						} | <strong>Admissão:</strong> ${
							emp.admission_date
						} | <strong>Saída:</strong> ${emp.termination_date}</p>`;
					});
				} else {
					html += "<p>Não disponível</p>";
				}

				html += "<h3>Compras</h3>";
				if (dados.purchases?.length) {
					dados.purchases.forEach((compra) => {
						html += `<p><strong>Produto:</strong> ${
							compra.product || "N/A"
						} | <strong>Quantidade:</strong> ${
							compra.quantity || "1"
						} | <strong>Preço:</strong> R$ ${compra.price || "0,00"}</p>`;
					});
				} else {
					html += "<p>Não disponível</p>";
				}

				html += "<h3>Vacinas</h3>";
				if (dados.vaccines?.length) {
					dados.vaccines.forEach((vac) => {
						html += `<p><strong>${vac.vaccine}</strong> - ${vac.dose}, ${vac.date} - ${vac.establishment}</p>`;
					});
				} else {
					html += "<p>Não disponível</p>";
				}

				html += "<h3>Interesses</h3>";
				const interesses = dados.interests;
				if (interesses && Object.keys(interesses).length) {
					for (const chave in interesses) {
						const label = interessesLabels[chave] || chave;
						const valor = interesses[chave];

						let exibicao;
						if (typeof valor === "boolean") {
							exibicao = valor ? "Sim" : "Não";
						} else if (typeof valor === "number") {
							exibicao = valor.toFixed(0) + "%";
						} else if (valor === null || valor === undefined) {
							exibicao = "Não disponível";
						} else {
							exibicao = valor;
						}

						html += `<p><strong>${label}:</strong> ${exibicao}</p>`;
					}
				}
			} else if (apiSelecionada === "api2") {
				if (!data || !data.dados) {
					dadosElement.innerHTML =
						"<p>Nenhuma resposta ou dados recebidos da API.</p>";
					dadosElement.style.display = "block";
					if (typeof cpf !== "undefined") {
						resultadoElement.innerText = `Falha ao consultar CPF: ${cpf}`;
					} else {
						resultadoElement.innerText = `Falha ao realizar consulta.`;
					}
					document.getElementById("acoes").style.display = "none";
					return;
				}
				const dados = data.dados;
				const cpfConsultado =
					dados.cpf || (typeof cpf !== "undefined" ? cpf : "Não identificado");

				html += `<h3 style="margin-bottom: 20px;">Resultado da Consulta para o CPF: ${cpfConsultado}</h3>`;

				// --- DADOS GERAIS / CADASTRAIS ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Dados Pessoais e Cadastrais</h4>`;
				html += exibirCampo("ID Contato", dados.contatos_id);
				html += exibirCampo("CPF", dados.cpf);
				html += exibirCampo("Nome Completo", dados.nome);
				html += exibirCampo("Sexo", dados.sexo);
				html += exibirCampo("Data de Nascimento", dados.nasc);
				html += exibirCampo("Nome da Mãe", dados.nome_mae);
				html += exibirCampo("Nome do Pai", dados.nome_pai);
				html += exibirCampo("ID do Cadastro", dados.cadastro_id);
				html += exibirCampo("Estado Civil (Cadastro)", dados.estciv);
				html += exibirCampo("RG", dados.rg);
				html += exibirCampo("Nacionalidade (Cadastro)", dados.nacionalid);
				html += exibirCampo("ID Contato Cônjuge", dados.contatos_id_conjuge);
				html += exibirCampo("SO (Flag)", dados.so);
				html += exibirCampo("Cód. Situação Cadastral", dados.cd_sit_cad);
				html += exibirCampo("Data Situação Cadastral", dados.dt_sit_cad);
				html += exibirCampo(
					"Data da Informação (Cadastro)",
					dados.dt_informacao
				);
				html += exibirCampo("CBO (Cadastro)", dados.cbo);
				html += exibirCampo("Órgão Emissor do RG", dados.orgao_emissor);
				html += exibirCampo("UF de Emissão do RG", dados.uf_emissao);
				html += exibirCampo("Data de Óbito", dados.dt_ob);
				html += exibirCampo("Cód. Mosaic (Principal)", dados.cd_mosaic);
				html += exibirCampo("Renda (Cadastro)", dados.renda);
				html += exibirCampo("Faixa de Renda ID", dados.faixa_renda_id);
				html += exibirCampo("Título de Eleitor", dados.titulo_eleitor);
				html += exibirCampo("Cód. Mosaic Novo", dados.cd_mosaic_novo);
				html += exibirCampo(
					"Cód. Mosaic Secundário",
					dados.cd_mosaic_secundario
				);
				html += `</div>`;

				// --- DADOS DE SCORE ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Dados de Score</h4>`;
				if (dados.dados_score) {
					html += exibirCampo("ID (Score)", dados.dados_score.id);
					html += exibirCampo("Idade (dias)", dados.dados_score.idade);
					html += exibirCampo("Estado Civil (Score)", dados.dados_score.estciv);
					html += exibirCampo(
						"Escolaridade (Score)",
						dados.dados_score.escolaridade
					);
					html += exibirCampo("CBO (Score)", dados.dados_score.cbo);
					html += exibirCampo("Descrição CBO", dados.dados_score.descricao_cbo);
					html += exibirCampo("Empresário", dados.dados_score.empresario);
					html += exibirCampo("Aposentado", dados.dados_score.aposentado);
					html += exibirCampo("Óbito (Score)", dados.dados_score.obito);
					html += exibirCampo(
						"Nacionalidade (Score)",
						dados.dados_score.nacionalidade
					);
					html += exibirCampo(
						"Renda Estimada (Score)",
						dados.dados_score.renda
					);
					html += exibirCampo("Score de Crédito", dados.dados_score.score);
					html += exibirCampo("Faixa de Risco", dados.dados_score.faixa_risco);
					html += exibirCampo("Endereço (Score)", dados.dados_score.endereco);
					html += exibirCampo("Número (Score)", dados.dados_score.numero);
					html += exibirCampo("Bairro (Score)", dados.dados_score.bairro);
					html += exibirCampo("Cidade (Score)", dados.dados_score.cidade);
					html += exibirCampo("UF (Score)", dados.dados_score.uf);
					html += exibirCampo("Latitude (Score)", dados.dados_score.latitude);
					html += exibirCampo("Longitude (Score)", dados.dados_score.longitude);
					html += exibirCampo(
						"Telefones (Compilado Score)",
						dados.dados_score.telefones
					);
					html += exibirCampo(
						"Emails (Compilado Score)",
						dados.dados_score.emails
					);
					html += exibirCampo("Observações (Score)", dados.dados_score.obs);
				} else {
					html += `<p>Nenhuma informação de score disponível.</p>`;
				}
				html += `</div>`;

				// --- ESCOLARIDADE ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Escolaridade</h4>`;
				if (dados.escolaridade) {
					html += exibirCampo(
						"Nível de Escolaridade",
						dados.escolaridade.escolaridade
					);
					html += exibirCampo(
						"Origem da Informação",
						dados.escolaridade.origem_esc
					);
					html += exibirCampo(
						"Conselho/Órgão Profissional",
						dados.escolaridade.conselho_orgao
					);
				} else {
					html += `<p>Nenhuma informação de escolaridade disponível.</p>`;
				}
				html += `</div>`;

				// --- PODER AQUISITIVO ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Poder Aquisitivo</h4>`;
				if (dados.poder_aquisitivo) {
					html += exibirCampo(
						"Cód. Poder Aquisitivo",
						dados.poder_aquisitivo.cod_poder_aquisitivo
					);
					html += exibirCampo(
						"Classificação Poder Aquisitivo",
						dados.poder_aquisitivo.poder_aquisitivo
					);
					html += exibirCampo(
						"Renda Estimada (Poder Aquisitivo)",
						dados.poder_aquisitivo.renda_poder_aquisitivo
					);
					html += exibirCampo(
						"Faixa (Poder Aquisitivo)",
						dados.poder_aquisitivo.fx_poder_aquisitivo
					);
				} else {
					html += `<p>Nenhuma informação de poder aquisitivo disponível.</p>`;
				}
				html += `</div>`;

				// --- AVALIAÇÃO SCORE ADICIONAL ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Avaliação Score Adicional</h4>`;
				if (dados.avalicao_score) {
					// Nota: "avalicao" no JSON
					html += exibirCampo("Score CSB8", dados.avalicao_score.csb8);
					html += exibirCampo("Faixa CSB8", dados.avalicao_score.csb8_faixa);
					html += exibirCampo("Score CSBA", dados.avalicao_score.csba);
					html += exibirCampo("Faixa CSBA", dados.avalicao_score.csba_faixa);
				} else {
					html += `<p>Nenhuma avaliação de score adicional disponível.</p>`;
				}
				html += `</div>`;

				// --- ENDEREÇOS ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Endereços</h4>`;
				if (Array.isArray(dados.enderecos) && dados.enderecos.length > 0) {
					const enderecosUnicos = [];
					const enderecosProcessados = new Set();
					dados.enderecos.forEach((end) => {
						const chaveUnica = `${end.cep}-${end.logradouro}-${end.numero}-${end.complemento}`;
						if (!enderecosProcessados.has(chaveUnica)) {
							enderecosUnicos.push(end);
							enderecosProcessados.add(chaveUnica);
						}
					});
					enderecosUnicos.forEach((end, index) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Endereço ${
							index + 1
						}</strong>`;
						html += exibirCampo("ID Histórico", end.historico_enderecos_id);
						html += exibirCampo("Tipo", end.tipo_logradouro);
						html += exibirCampo("Título", end.titulo_logradouro);
						html += exibirCampo("Logradouro", end.logradouro);
						html += exibirCampo("Número", end.numero);
						html += exibirCampo("Complemento", end.complemento);
						html += exibirCampo("Bairro", end.bairro);
						html += exibirCampo("Cidade", end.cidade);
						html += exibirCampo("UF", end.uf);
						html += exibirCampo("CEP", end.cep);
						html += exibirCampo("Endereço Formatado (API)", end.endereco);
						html += exibirCampo("CEP Nota", end.cep_nota);
						html += exibirCampo("ID Cadastro (End.)", end.cadastro_id);
						html += exibirCampo("Data Inclusão", end.dt_inclusao);
						html += exibirCampo("Data Atualização", end.dt_atualizacao);
						html += exibirCampo("Data Informação", end.dt_informacao);
						html += exibirCampo("NSU", end.nsu);
						html += exibirCampo("Origem SRS", end.origem_srs);
						html += exibirCampo("Latitude", end.latitude);
						html += exibirCampo("Longitude", end.longitude);
						html += exibirCampo("Status Geo", end.status_geo);
						html += exibirCampo("Cód. Setor Censitário", end.cod_setor);
						html += exibirCampo("Match Geo (API)", end.math_geo);
						html += exibirCampo("Tipo Endereço ID", end.tipo_endereco_id);
						html += exibirCampo("Prioridade", end.prioridade);
						html += exibirCampo("Classificação", end.classsificacao);
						html += exibirCampo("Fonte", end.fonte_name);
						html += `</div>`;
					});
				} else {
					html += `<p>Nenhum endereço encontrado.</p>`;
				}
				html += `</div>`;

				// --- TELEFONES (Lista principal) ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Telefones</h4>`;
				if (Array.isArray(dados.telefones) && dados.telefones.length > 0) {
					const telefonesUnicos = [];
					const numerosProcessados = new Set();
					dados.telefones.forEach((tel) => {
						if (!numerosProcessados.has(tel.telefone)) {
							telefonesUnicos.push(tel);
							numerosProcessados.add(tel.telefone);
						}
					});
					telefonesUnicos.forEach((tel, index) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Telefone ${
							index + 1
						}</strong>`;
						html += exibirCampo("Número", tel.telefone);
						html += exibirCampo("Operadora", tel.operadora);
						html += `</div>`;
					});
				} else if (dados.dados_score?.telefones) {
					html += exibirCampo(
						"Telefones (Info Score)",
						dados.dados_score.telefones
					);
				} else {
					html += `<p>Nenhum telefone encontrado.</p>`;
				}
				html += `</div>`;

				// --- EMAILS ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Emails</h4>`;
				if (Array.isArray(dados.emails) && dados.emails.length > 0) {
					dados.emails.forEach((email, index) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Email ${
							index + 1
						}</strong>`;
						html += exibirCampo("Endereço", email.email);
						html += exibirCampo("Prioridade", email.prioridade);
						html += exibirCampo("Score do Email", email.email_score);
						html += exibirCampo("Pessoal", email.email_pessoal);
						html += exibirCampo("Duplicado", email.email_duplicado);
						html += exibirCampo("Blacklist", email.blacklist);
						html += exibirCampo("Estrutura", email.estrutura);
						html += exibirCampo("Status VT", email.status_vt);
						html += exibirCampo("Domínio", email.dominio);
						html += exibirCampo("Mapas", email.mapas);
						html += exibirCampo("Peso", email.peso);
						html += exibirCampo("ID Cadastro (Email)", email.cadastro_id);
						html += exibirCampo("Data Inclusão", email.dt_inclusao);
						html += `</div>`;
					});
				} else {
					html += `<p>Nenhum email encontrado.</p>`;
				}
				html += `</div>`;

				// --- VEÍCULOS ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Veículos</h4>`;
				if (Array.isArray(dados.veiculos) && dados.veiculos.length > 0) {
					const veiculosUnicos = [];
					const veiculosProcessados = new Set();
					dados.veiculos.forEach((veiculo) => {
						const chaveUnica = `${veiculo.placa}-${veiculo.chassi}`;
						if (!veiculosProcessados.has(chaveUnica)) {
							veiculosUnicos.push(veiculo);
							veiculosProcessados.add(chaveUnica);
						}
					});
					veiculosUnicos.forEach((veiculo, index) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Veículo ${
							index + 1
						}</strong>`;
						html += exibirCampo("Placa", veiculo.placa);
						html += exibirCampo("Marca/Modelo", veiculo.marca);
						html += exibirCampo("Renavam", veiculo.renavan);
						html += exibirCampo("Ano Fabricação", veiculo.anofab);
						html += exibirCampo("Ano Modelo", veiculo.anomode);
						html += exibirCampo("Chassi", veiculo.chassi);
						html += exibirCampo("Combustível", veiculo.combu);
						html += exibirCampo("Tipo", veiculo.tipo);
						html += exibirCampo("Espécie", veiculo.espec);
						html += exibirCampo("Data Inclusão (Veíc.)", veiculo.daincl);
						html += exibirCampo("Data Licenciamento", veiculo.dalice);
						html += exibirCampo("Data Movimentação", veiculo.damovi);
						html += exibirCampo("Proprietário", veiculo.propri);
						let enderecoVeiculo = `${veiculo.end || ""} ${veiculo.num || ""} ${
							veiculo.compl || ""
						}`.trim();
						enderecoVeiculo +=
							enderecoVeiculo && (veiculo.bairro || veiculo.cidade)
								? " - "
								: "";
						enderecoVeiculo += `${veiculo.bairro || ""}`;
						enderecoVeiculo += veiculo.bairro && veiculo.cidade ? ", " : "";
						enderecoVeiculo += `${veiculo.cidade || ""}`;
						enderecoVeiculo += veiculo.cidade && veiculo.estado ? " - " : "";
						enderecoVeiculo += `${veiculo.estado || ""}`;
						enderecoVeiculo += veiculo.cep ? `. CEP: ${veiculo.cep}` : "";
						html += exibirCampo(
							"Endereço (Veículo)",
							enderecoVeiculo.replace(/^ - |^, /, "").trim()
						);
						html += `</div>`;
					});
				} else {
					html += `<p>Nenhum veículo encontrado.</p>`;
				}
				html += `</div>`;

				// --- PARENTES ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Parentes</h4>`;
				if (Array.isArray(dados.parentes) && dados.parentes.length > 0) {
					dados.parentes.forEach((parente, index) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Parente ${
							index + 1
						}</strong>`;
						html += exibirCampo("Nome", parente.nome);
						html += exibirCampo("CPF (Parente)", parente.cpf_completo);
						html += exibirCampo("CPF (Parente, parcial)", parente.cpf);
						html += exibirCampo("Vínculo com", parente.nome_vinculo);
						html += exibirCampo("CPF Vínculo", parente.cpf_vinculo);
						html += exibirCampo("CPF Vínculo (parcial)", parente.cpf_vinculo_9);
						html += exibirCampo("Relação de Parentesco", parente.vinculo);
						html += `</div>`;
					});
				} else {
					html += `<p>Nenhum parente encontrado.</p>`;
				}
				html += `</div>`;

				// --- DETALHES IRPF (Última consulta) ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Detalhes IRPF (Consulta Recente)</h4>`;
				if (dados.detalhes_irpf) {
					html += exibirCampo("Documento (CPF)", dados.detalhes_irpf.docnumber);
					html += exibirCampo(
						"Instituição Bancária",
						dados.detalhes_irpf.instituicao_bancaria
					);
					html += exibirCampo("Cód. Agência", dados.detalhes_irpf.cod_agencia);
					html += exibirCampo("Lote", dados.detalhes_irpf.lote);
					html += exibirCampo(
						"Ano de Referência",
						dados.detalhes_irpf.ano_referencia
					);
					html += exibirCampo("Data do Lote", dados.detalhes_irpf.dt_lote);
					html += exibirCampo(
						"Situação na Receita Federal",
						dados.detalhes_irpf.sit_receita_federal
					);
					html += exibirCampo(
						"Data da Consulta",
						dados.detalhes_irpf.dt_consulta
					);
				} else {
					html += `<p>Nenhuma informação de IRPF (consulta recente) disponível.</p>`;
				}
				html += `</div>`;

				// --- HISTÓRICO IRPF ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Histórico de Declarações IRPF</h4>`;
				if (Array.isArray(dados.irpf) && dados.irpf.length > 0) {
					dados.irpf.forEach((item, index) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Registro IRPF ${
							index + 1
						}</strong>`;
						html += exibirCampo("Documento (CPF)", item.docnumber);
						html += exibirCampo(
							"Instituição Bancária",
							item.instituicao_bancaria
						);
						html += exibirCampo("Cód. Agência", item.cod_agencia);
						html += exibirCampo("Lote", item.lote);
						html += exibirCampo(
							"Situação na Receita Federal",
							item.sit_receita_federal
						);
						html += exibirCampo("ID Cadastro (IRPF)", item.cadastro_id);
						html += `</div>`;
					});
				} else {
					html += `<p>Nenhum histórico de IRPF encontrado.</p>`;
				}
				html += `</div>`;

				// --- NIS / PIS / DETALHES PIS ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Informações Sociais (NIS/PIS)</h4>`;
				html += exibirCampo("NIS (Número de Identificação Social)", dados.nis);
				html += exibirCampo("PIS/PASEP", dados.pis);
				if (dados.detalhes_pis) {
					html += `<h5>Detalhes PIS</h5>`;
					for (const chave in dados.detalhes_pis) {
						if (Object.hasOwnProperty.call(dados.detalhes_pis, chave)) {
							const rotulo = chave
								.replace(/_/g, " ")
								.replace(/\b\w/g, (l) => l.toUpperCase());
							html += exibirCampo(rotulo, dados.detalhes_pis[chave]);
						}
					}
				} else {
					html += exibirCampo("Detalhes PIS", null); // Para mostrar a mensagem do premium
				}
				html += `</div>`;

				// --- FGTS ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>FGTS</h4>`;
				if (Array.isArray(dados.fgts) && dados.fgts.length > 0) {
					dados.fgts.forEach((item_fgts, index) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Registro FGTS ${
							index + 1
						}</strong>`;
						for (const chave in item_fgts) {
							if (Object.hasOwnProperty.call(item_fgts, chave)) {
								const rotulo = chave
									.replace(/_/g, " ")
									.replace(/\b\w/g, (l) => l.toUpperCase());
								html += exibirCampo(rotulo, item_fgts[chave]);
							}
						}
						html += `</div>`;
					});
				} else {
					html += `<p>Nenhuma informação de FGTS encontrada.</p>`;
				}
				html += `</div>`;

				// --- BENEFÍCIOS (Array genérico) ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Outros Benefícios Registrados</h4>`;
				if (Array.isArray(dados.beneficios) && dados.beneficios.length > 0) {
					dados.beneficios.forEach((beneficio, index) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Benefício ${
							index + 1
						}</strong>`;
						for (const chave in beneficio) {
							if (Object.hasOwnProperty.call(beneficio, chave)) {
								const rotulo = chave
									.replace(/_/g, " ")
									.replace(/\b\w/g, (l) => l.toUpperCase());
								html += exibirCampo(rotulo, beneficio[chave]);
							}
						}
						html += `</div>`;
					});
				} else {
					html += `<p>Nenhum outro benefício registrado encontrado.</p>`;
				}
				html += `</div>`;

				// --- VÍNCULOS EMPRESARIAIS (EMPRESAS) ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Participação em Empresas (QSA/Representação)</h4>`;
				if (Array.isArray(dados.empresas) && dados.empresas.length > 0) {
					dados.empresas.forEach((empresa, index) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Vínculo Empresarial ${
							index + 1
						}</strong>`;
						html += exibirCampo("CNPJ da Empresa", empresa.cnpj);
						html += exibirCampo(
							"Documento do Sócio/Representante",
							empresa.cpf_cnpj
						);
						html += exibirCampo("Tipo do Documento", empresa.tipo_documento);
						html += exibirCampo("País", empresa.pais);
						html += exibirCampo("Nome (Sócio/Representante)", empresa.nome);
						html += exibirCampo("Tipo de Relação (API)", empresa.tipo_relacao);
						html += exibirCampo("Qualificação/Cargo", empresa.relacao);
						html += exibirCampo("Tipo de Participação", empresa.tipo);
						html += exibirCampo("Fonte da Informação", empresa.fonte);
						html += exibirCampo(
							"Data de Atualização do Vínculo",
							empresa.atualizacao
						);
						html += exibirCampo("Data de Saída/Demissão", empresa.demissao);
						html += exibirCampo("Data de Entrada/Admissão", empresa.ademissao);
						html += `</div>`;
					});
				} else {
					html += `<p>Nenhum vínculo empresarial encontrado.</p>`;
				}
				html += `</div>`;

				// --- HISTÓRICO DE EMPREGOS ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Histórico de Empregos</h4>`;
				if (Array.isArray(dados.empregos) && dados.empregos.length > 0) {
					dados.empregos.forEach((emprego, index) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Emprego ${
							index + 1
						}</strong>`;
						for (const chave in emprego) {
							if (Object.hasOwnProperty.call(emprego, chave)) {
								const rotulo = chave
									.replace(/_/g, " ")
									.replace(/\b\w/g, (l) => l.toUpperCase());
								html += exibirCampo(rotulo, emprego[chave]);
							}
						}
						html += `</div>`;
					});
				} else {
					html += `<p>Nenhum histórico de empregos formais encontrado.</p>`;
				}
				html += `</div>`;

				// --- INTERESSES E PERFIL DE CONSUMO ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Interesses e Perfil de Consumo</h4>`;
				if (
					dados.interesses &&
					typeof dados.interesses === "object" &&
					Object.keys(dados.interesses).length > 0
				) {
					for (const chave in dados.interesses) {
						if (
							Object.hasOwnProperty.call(dados.interesses, chave) &&
							chave !== "cpf"
						) {
							let rotulo = chave
								.replace(/_/g, " ")
								.replace(/\b\w/g, (l) => l.toUpperCase());
							html += exibirCampo(rotulo, dados.interesses[chave]);
						}
					}
				} else {
					html += `<p>Nenhuma informação de interesses ou perfil de consumo disponível.</p>`;
				}
				html += `</div>`;

				// --- COMPRAS (Objeto genérico) ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Perfil de Compras (Geral)</h4>`;
				if (
					dados.compras &&
					typeof dados.compras === "object" &&
					Object.keys(dados.compras).length > 0
				) {
					for (const chave in dados.compras) {
						if (Object.hasOwnProperty.call(dados.compras, chave)) {
							const rotulo = chave
								.replace(/_/g, " ")
								.replace(/\b\w/g, (l) => l.toUpperCase());
							html += exibirCampo(rotulo, dados.compras[chave]);
						}
					}
				} else {
					html += exibirCampo("Perfil Geral de Compras", null); // Para usar a mensagem do premium ou "Não informado"
				}
				html += `</div>`;

				// --- ORDENS DE COMPRAS ---
				html += `<div style="margin-bottom: 16px; border: 1px solid #ccc; padding: 10px;"><h4>Ordens de Compras Registradas</h4>`;
				if (
					Array.isArray(dados.ordens_de_compras) &&
					dados.ordens_de_compras.length > 0
				) {
					dados.ordens_de_compras.forEach((ordem, index) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Ordem de Compra ${
							index + 1
						}</strong>`;
						for (const chave in ordem) {
							if (Object.hasOwnProperty.call(ordem, chave)) {
								const rotulo = chave
									.replace(/_/g, " ")
									.replace(/\b\w/g, (l) => l.toUpperCase());
								html += exibirCampo(rotulo, ordem[chave]);
							}
						}
						html += `</div>`;
					});
				} else {
					html += `<p>Nenhuma ordem de compra registrada encontrada.</p>`;
				}
				html += `</div>`;
			} else if (apiSelecionada === "api3") {
				if (!data || !data.dados) {
					dadosElement.innerHTML =
						"<p>Nenhuma resposta ou dados recebidos da API.</p>";
					dadosElement.style.display = "block";
					if (typeof cpf !== "undefined") {
						resultadoElement.innerText = `Falha ao consultar CPF: ${cpf}`;
					} else {
						resultadoElement.innerText = `Falha ao realizar consulta.`;
					}
					document.getElementById("acoes").style.display = "none";
					return;
				}
				const dados = data.dados;
				const dadosBasicos = dados.dados_basicos;
				const endereco = dados.endereco;
				const empregos = dados.empregos;
				const veiculos = dados.veiculos;
				const telefones = dados.telefones;
				const celulares = dados.celulares;

				html += "<h3>Dados Básicos</h3>";
				html += `<p><strong>Nome:</strong> ${dadosBasicos.nome || "N/A"}</p>`;
				html += `<p><strong>CPF:</strong> ${dadosBasicos.cpf || "N/A"}</p>`;
				html += `<p><strong>Nascimento:</strong> ${
					dadosBasicos.nascimento || "N/A"
				}</p>`;
				html += `<p><strong>Nome da Mãe:</strong> ${
					dadosBasicos.nome_mae || "N/A"
				}</p>`;
				html += `<p><strong>Sexo:</strong> ${dadosBasicos.sexo || "N/A"}</p>`;
				html += `<p><strong>Email:</strong> ${dadosBasicos.email || "N/A"}</p>`;
				html += `<p><strong>Óbito:</strong> ${
					dadosBasicos.obito ? dadosBasicos.obito.status : "N/A"
				}</p>`;
				html += `<p><strong>Status Receita:</strong> ${
					dadosBasicos.status_receita || "N/A"
				}</p>`;
				html += `<p><strong>Quantidade de Veículos:</strong> ${
					dadosBasicos.qt_veiculos || "0"
				}</p>`;
				html += `<p><strong>Faixa de Renda:</strong> ${
					dadosBasicos.faixa_renda || "N/A"
				}</p>`;

				html += "<h3>Endereço</h3>";
				html += `<p><strong>Tipo:</strong> ${endereco.tipo || "N/A"}</p>`;
				html += `<p><strong>Logradouro:</strong> ${
					endereco.logradouro || "N/A"
				}</p>`;
				html += `<p><strong>Número:</strong> ${endereco.numero || "N/A"}</p>`;
				html += `<p><strong>Complemento:</strong> ${
					endereco.complemento || "N/A"
				}</p>`;
				html += `<p><strong>Bairro:</strong> ${endereco.bairro || "N/A"}</p>`;
				html += `<p><strong>Cidade:</strong> ${endereco.cidade || "N/A"}</p>`;
				html += `<p><strong>Estado:</strong> ${endereco.estado || "N/A"}</p>`;
				html += `<p><strong>UF:</strong> ${endereco.uf || "N/A"}</p>`;
				html += `<p><strong>CEP:</strong> ${endereco.cep || "N/A"}</p>`;

				html += "<h3>Telefones</h3>";
				if (telefones && telefones.length > 0) {
					html += "<ul>";
					telefones.forEach((tel) => {
						html += `<li>${tel}</li>`;
					});
					html += "</ul>";
				} else {
					html += "<p>Nenhum telefone encontrado.</p>";
				}

				html += "<h3>Celulares</h3>";
				if (celulares && celulares.length > 0) {
					html += "<ul>";
					celulares.forEach((cel) => {
						html += `<li>${cel}</li>`;
					});
					html += "</ul>";
				} else {
					html += "<p>Nenhum celular encontrado.</p>";
				}

				html += "<h3>Empregos</h3>";
				if (empregos && empregos.length > 0) {
					empregos.forEach((emp, idx) => {
						html += `<div style="margin-bottom: 8px; border: 1px solid #ddd; padding: 8px;"><strong>Emprego ${
							idx + 1
						}</strong>`;
						html += exibirCampo("Documento", emp.docnumber);
						html += exibirCampo("Setor", emp.setor);
						html += exibirCampo("País", emp.pais);
						html += exibirCampo(
							"CNPJ Empregador",
							emp.numero_identificacao_empregador
						);
						html += exibirCampo("Nome do Empregador", emp.nome_empregador);
						html += exibirCampo("Área", emp.area);
						html += exibirCampo("Nível", emp.nivel);
						html += exibirCampo("Status", emp.status);
						html += exibirCampo(
							"Remuneração Estimada",
							emp.remuneracao_estimada
						);
						html += exibirCampo("Remuneração", emp.remuneracao);
						html += exibirCampo("Data Início", emp.data_inicio_trabalho);
						html += exibirCampo("Data Término", emp.data_termino_trabalho);
						html += exibirCampo("Rating", emp.rating);
						html += exibirCampo("Habilidades", emp.habilidades);
						html += exibirCampo("Interesses", emp.interesses);
						html += exibirCampo("Cidade", emp.cidade);
						html += exibirCampo("Estado", emp.estado);
						html += exibirCampo("Situação", emp.situacao);
						html += exibirCampo("Está Morto", emp.esta_morto);
						html += exibirCampo("Data Admissão", emp.data_admissao);
						html += exibirCampo("Função de Trabalho", emp.funcao_trabalho);
						html += exibirCampo("Cargo de Trabalho", emp.cargo_trabalho);
						html += exibirCampo("Tipo Servidor", emp.tipo_servidor);
						html += exibirCampo("Carga Horária", emp.carga_horaria_trabalho);
						html += exibirCampo("Tipo Órgão", emp.tipo_orgao);
						html += exibirCampo("Órgão Superior", emp.orgao_superior);
						html += exibirCampo(
							"Histórico Remuneração",
							emp.historico_remuneracao
						);
						html += exibirCampo("Remuneração Média", emp.remuneracao_media);
						html += exibirCampo("Remuneração Máxima", emp.remuneracao_maxima);
						html += exibirCampo("Remuneração Mínima", emp.remuneracao_minima);
						html += `</div>`;
					});
				} else {
					html += "<p>Nenhum emprego encontrado.</p>";
				}

				html += "<h3>Veículos</h3>";
				if (veiculos && veiculos.length > 0) {
					html += "<ul>";
					veiculos.forEach((veic) => {
						html += `<li>${JSON.stringify(veic)}</li>`;
					});
					html += "</ul>";
				} else {
					html += "<p>Nenhum veículo encontrado.</p>";
				}
			}

			dadosElement.innerHTML = html;
			dadosElement.style.display = "block";
			resultadoElement.innerText = `Consulta realizada para o CPF: ${cpf}`;
			ativarBotoes();

			// Salva no cache
			cacheConsultas[apiSelecionada] = {
				dados: data,
				html: html,
				chave: cpf,
			};

			// 4. Registrar a consulta no banco
			return fetch("../../backend/consultas/registrar_consulta.php", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `modulo=${modulo}`,
			});
		})
		.catch((error) => {
			console.error("Erro ao consultar CPF:", error);
			resultadoElement.innerText = `Erro: ${error.message}`;
			dadosElement.style.display = "none";
		})
		.finally(() => {
			consultarBtn.disabled = false;
			resetCaptcha();
		});
}

function formatarCPF(cpf) {
	if (!cpf) return "";
	return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatCPF(input) {
	let value = input.value.replace(/\D/g, "");
	value = value.replace(/(\d{3})(\d)/, "$1.$2");
	value = value.replace(/(\d{3})(\d)/, "$1.$2");
	value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
	input.value = value;
}

const interessesLabels = {
	credit_personal_pre_approved: "Crédito Pessoal Pré-Aprovado",
	credit_real_estate_pre_approved: "Crédito Imobiliário Pré-Aprovado",
	vehicle_financing_pre_approved: "Financiamento de Veículos Pré-Aprovado",
	middle_class: "Classe Média",
	automatic_debit: "Débito Automático",
	has_luxury: "Possui Itens de Luxo",
	has_investments: "Possui Investimentos",
	has_credit_card: "Possui Cartão de Crédito",
	has_multiple_cards: "Possui Múltiplos Cartões",
	has_high_standard_account: "Conta de Alto Padrão",
	has_black_card: "Possui Cartão Black",
	has_prime_card: "Possui Cartão Prime",
	has_prepaid_cell: "Celular Pré-Pago",
	has_postpaid_cell: "Celular Pós-Pago",
	has_accumulated_miles: "Possui Milhas Acumuladas",
	has_own_house: "Possui Casa Própria",
	has_discounts: "Utiliza Descontos",
	has_checking_accounts: "Possui Conta Corrente",
	has_auto_insurance: "Possui Seguro Automotivo",
	has_private_pension: "Possui Previdência Privada",
	has_internet_banking: "Utiliza Internet Banking",
	has_token_installed: "Token de Segurança Instalado",
	has_traveled: "Já Viajou",

	// Probabilidades
	personal_credit_probability: "Probabilidade de Crédito Pessoal",
	vehicle_financing_probability: "Probabilidade de Financiamento de Veículos",
	internet_shopping_probability: "Probabilidade de Compras Online",
	multiple_cards_probability: "Probabilidade de Múltiplos Cartões",
	prime_card_probability: "Probabilidade de Cartão Prime",
	cable_tv_probability: "Probabilidade de TV por Assinatura",
	broadband_probability: "Probabilidade de Banda Larga",
	own_house_probability: "Probabilidade de Ter Casa Própria",
	prepaid_cell_probability: "Probabilidade de Celular Pré-Pago",
	postpaid_cell_probability: "Probabilidade de Celular Pós-Pago",
	real_estate_credit_probability: "Probabilidade de Crédito Imobiliário",
	auto_insurance_probability: "Probabilidade de Seguro Automotivo",
	health_insurance_probability: "Probabilidade de Plano de Saúde",
	life_insurance_probability: "Probabilidade de Seguro de Vida",
	home_insurance_probability: "Probabilidade de Seguro Residencial",
	investments_probability: "Probabilidade de Ter Investimentos",
	consigned_probability: "Probabilidade de Empréstimo Consignado",
	private_pension_probability: "Probabilidade de Previdência Privada",
	miles_redemption_probability: "Probabilidade de Resgate de Milhas",
	discount_hunter_probability: "Probabilidade de Ser Caçador de Descontos",
	fitness_probability: "Probabilidade de Estilo de Vida Fitness",
	tourism_probability: "Probabilidade de Interesse em Turismo",
	luxury_probability: "Probabilidade de Interesse em Luxo",
	cinephile_probability: "Probabilidade de Ser Cinéfilo",
	public_transport_probability: "Probabilidade de Uso de Transporte Público",
	online_games_probability: "Probabilidade de Interesse em Jogos Online",
	video_game_probability: "Probabilidade de Interesse em Video Games",
	early_adopters_probability:
		"Probabilidade de Ser um Inovador (Early Adopter)",
};
