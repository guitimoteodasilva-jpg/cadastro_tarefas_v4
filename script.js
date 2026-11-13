"use strict";

class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = Number(preco);
        this.quantidade = Number.parseInt(quantidade, 10);
    }

    calcularSubtotal() {
        return this.preco * this.quantidade;
    }
}

const CHAVE_STORAGE = "sistema_estoque_produtos";
const listaDeProdutos = [];

const formProduto = document.getElementById("produto-form");
const btnLimparTudo = document.getElementById("limpar-tabela");
const totalEstoqueEl = document.getElementById("total-estoque");
const nomeInput = document.getElementById("nome");
const precoInput = document.getElementById("preco");
const quantidadeInput = document.getElementById("quantidade");
const datalistProdutos = document.getElementById("produtos-sugeridos");
const mensagemErro = document.getElementById("mensagem-erro");
const estadoVazio = document.getElementById("estado-vazio");
const modalConfirmacao = document.getElementById("modal-confirmacao");
const modalTitulo = document.getElementById("modal-titulo");
const modalMensagem = document.getElementById("modal-mensagem");
const btnCancelarAcao = document.getElementById("cancelar-acao");
const btnConfirmarAcao = document.getElementById("confirmar-acao");
const modalBootstrap = document.getElementById("modal-bootstrap");
const toastContainer = document.getElementById("toast-container");

let resolverConfirmacao = null;
let focoAntesModal = null;

function salvarNoLocalStorage() {
    try {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaDeProdutos));
        return true;
    } catch (error) {
        mostrarToast("Não foi possível salvar os dados neste navegador.", "error");
        return false;
    }
}

function carregarDoLocalStorage() {
    try {
        const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);
        if (!dadosSalvos) return;

        const produtos = JSON.parse(dadosSalvos);
        if (!Array.isArray(produtos)) throw new Error("Formato de dados inválido");

        produtos.forEach((produto) => {
            if (produto && typeof produto.nome === "string" && Number.isFinite(Number(produto.preco)) && Number.isInteger(Number(produto.quantidade))) {
                listaDeProdutos.push(new Produto(produto.nome, produto.preco, produto.quantidade));
            }
        });
    } catch (error) {
        mostrarToast("Os dados salvos não puderam ser carregados.", "error");
    }
}

function mostrarErro(texto) {
    mensagemErro.textContent = texto;
    mensagemErro.classList.add("visible");
}

function limparErro() {
    mensagemErro.textContent = "";
    mensagemErro.classList.remove("visible");
}

function mostrarToast(texto, tipo = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.setAttribute("role", tipo === "error" ? "alert" : "status");
    toast.textContent = texto;
    toastContainer.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3500);
}

function pedirConfirmacao({ titulo, mensagem, textoBotao = "Confirmar" }) {
    focoAntesModal = document.activeElement;
    modalTitulo.textContent = titulo;
    modalMensagem.textContent = mensagem;
    btnConfirmarAcao.textContent = textoBotao;
    modalConfirmacao.classList.remove("hidden");
    btnCancelarAcao.focus();

    return new Promise((resolve) => {
        resolverConfirmacao = resolve;
    });
}

function fecharModalConfirmacao(resultado) {
    modalConfirmacao.classList.add("hidden");
    const resolver = resolverConfirmacao;
    resolverConfirmacao = null;
    if (resolver) resolver(resultado);
    if (focoAntesModal && typeof focoAntesModal.focus === "function") focoAntesModal.focus();
}

function validarFormulario() {
    const nome = nomeInput.value.trim();
    const preco = Number(precoInput.value);
    const quantidade = Number(quantidadeInput.value);

    if (!nome) {
        mostrarErro("Informe o nome do produto.");
        nomeInput.focus();
        return false;
    }

    if (precoInput.value.trim() === "" || !Number.isFinite(preco) || preco <= 0) {
        mostrarErro("Informe um preço válido maior que zero.");
        precoInput.focus();
        return false;
    }

    if (quantidadeInput.value.trim() === "" || !Number.isInteger(quantidade) || quantidade <= 0) {
        mostrarErro("Informe uma quantidade inteira maior que zero.");
        quantidadeInput.focus();
        return false;
    }

    limparErro();
    return true;
}

formProduto.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validarFormulario()) {
        return;
    }

    const nome = nomeInput.value.trim();
    const indexExistente = listaDeProdutos.findIndex((produto) => produto.nome.toLocaleLowerCase() === nome.toLocaleLowerCase());
    const produto = new Produto(nome, precoInput.value, quantidadeInput.value);

    if (indexExistente >= 0) {
        listaDeProdutos[indexExistente] = produto;
    } else {
        listaDeProdutos.push(produto);
    }

    salvarNoLocalStorage();
    atualizarInterface();
    formProduto.reset();
    limparErro();
    mostrarToast(indexExistente >= 0 ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.");
    nomeInput.focus();
});

function preencherProdutoExistente() {
    const termo = nomeInput.value.trim().toLowerCase();
    const produto = listaDeProdutos.find((item) => item.nome.toLowerCase() === termo);

    if (produto) {
        precoInput.value = produto.preco;
        quantidadeInput.value = produto.quantidade;
    }
}

nomeInput.addEventListener("input", () => {
    limparErro();
    preencherProdutoExistente();
});

precoInput.addEventListener("input", limparErro);
quantidadeInput.addEventListener("input", limparErro);

btnLimparTudo.addEventListener("click", async () => {
    if (listaDeProdutos.length === 0) {
        mostrarToast("O estoque já está vazio.", "warning");
        return;
    }

    const confirmado = await pedirConfirmacao({
        titulo: "Limpar todo o estoque?",
        mensagem: `Serão removidos ${listaDeProdutos.length} produto(s). Esta ação não pode ser desfeita.`,
        textoBotao: "Limpar tudo"
    });

    if (!confirmado) return;

    listaDeProdutos.length = 0;
    try {
        localStorage.removeItem(CHAVE_STORAGE);
    } catch (error) {
        // sem efeito crítico
    }

    atualizarInterface();
    formProduto.reset();
    limparErro();
    mostrarToast("Todos os produtos foram removidos.");
});

btnConfirmarAcao.addEventListener("click", () => fecharModalConfirmacao(true));
btnCancelarAcao.addEventListener("click", () => fecharModalConfirmacao(false));

modalConfirmacao.addEventListener("click", (event) => {
    if (event.target === modalConfirmacao) {
        fecharModalConfirmacao(false);
    }
});

function removerProduto(index) {
    const produto = listaDeProdutos[index];
    if (!produto) return;

    pedirConfirmacao({
        titulo: "Remover produto?",
        mensagem: `O produto "${produto.nome}" será removido do estoque.`,
        textoBotao: "Remover"
    }).then((confirmado) => {
        if (!confirmado) return;

        listaDeProdutos.splice(index, 1);
        salvarNoLocalStorage();
        atualizarInterface();
        mostrarToast("Produto removido do estoque.");
    });
}

function atualizarDatalist() {
    datalistProdutos.replaceChildren();
    listaDeProdutos.forEach((produto) => {
        const option = document.createElement("option");
        option.value = produto.nome;
        datalistProdutos.appendChild(option);
    });
}

function renderizarTabela() {
    const tabelaBody = document.querySelector("#tabela-produtos tbody");
    tabelaBody.replaceChildren();

    listaDeProdutos.forEach((produto, index) => {
        const linha = document.createElement("tr");
        const valores = [
            produto.nome,
            `R$ ${produto.preco.toFixed(2)}`,
            String(produto.quantidade),
            `R$ ${produto.calcularSubtotal().toFixed(2)}`
        ];

        valores.forEach((valor) => {
            const celula = document.createElement("td");
            celula.textContent = valor;
            linha.appendChild(celula);
        });

        const celulaAcoes = document.createElement("td");
        const botaoRemover = document.createElement("button");
        botaoRemover.type = "button";
        botaoRemover.className = "btn-remover";
        botaoRemover.textContent = "Remover";
        botaoRemover.setAttribute("aria-label", `Remover ${produto.nome}`);
        botaoRemover.addEventListener("click", () => removerProduto(index));
        celulaAcoes.appendChild(botaoRemover);
        linha.appendChild(celulaAcoes);

        tabelaBody.appendChild(linha);
    });

    estadoVazio.hidden = listaDeProdutos.length > 0;
}

function atualizarInterface() {
    renderizarTabela();
    atualizarDatalist();
    const total = listaDeProdutos.reduce((soma, produto) => soma + produto.calcularSubtotal(), 0);
    totalEstoqueEl.textContent = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const btnConceitoBootstrap = document.getElementById("btn-conceito-bootstrap");
const btnFecharModalBootstrap = document.getElementById("fechar-modal-bootstrap");

btnConceitoBootstrap.addEventListener("click", () => {
    focoAntesModal = document.activeElement;
    modalBootstrap.classList.remove("hidden");
    btnFecharModalBootstrap.focus();
});

function fecharModalBootstrap() {
    modalBootstrap.classList.add("hidden");
    if (focoAntesModal && typeof focoAntesModal.focus === "function") focoAntesModal.focus();
}

btnFecharModalBootstrap.addEventListener("click", fecharModalBootstrap);

modalBootstrap.addEventListener("click", (event) => {
    if (event.target === modalBootstrap) {
        fecharModalBootstrap();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (!modalConfirmacao.classList.contains("hidden")) {
        fecharModalConfirmacao(false);
    }

    if (!modalBootstrap.classList.contains("hidden")) {
        fecharModalBootstrap();
    }
});

carregarDoLocalStorage();
atualizarInterface();
