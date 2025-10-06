function copiarDados() {
	const dados = document.getElementById("dados").innerText;
	navigator.clipboard
		.writeText(dados)
		.then(() => {
			alert("Dados copiados para a área de transferência!");
		})
		.catch((err) => {
			alert("Erro ao copiar os dados: " + err);
		});
}

function baixarPDF() {
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF();
	const texto = document.getElementById("dados").innerText;

	const margem = 10;
	const larguraTexto = 180; // largura do texto dentro da página (210 - 2x margem)
	const alturaLinha = 7;
	const linhas = doc.splitTextToSize(texto, larguraTexto);

	let y = margem;

	for (let i = 0; i < linhas.length; i++) {
		if (y > 280) {
			// Altura máxima da página A4 (297mm) - margem inferior
			doc.addPage();
			y = margem;
		}
		doc.text(linhas[i], margem, y);
		y += alturaLinha;
	}

	doc.save("dados_cpf.pdf");
}

function baixarTXT() {
	const dados = document.getElementById("dados").innerText;
	const blob = new Blob([dados], { type: "text/plain;charset=utf-8" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "dados_cpf.txt";
	link.click();
}

function ativarBotoes() {
	document.getElementById("acoes").style.display = "flex";
}
