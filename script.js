// FASE 1: Modelagem dos dados (Classe Base)
class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = parseFloat(preco);
        this.quantidade = parseInt(quantidade);
    }

    // Método que calcula o subtotal do produto
    calcularSubtotal() {
        return this.preco * this.quantidade;
    }
}

// FASE 2: Gerenciamento de Estado (Memória)
const listaDeProdutos = [];
const CHAVE_STORAGE = "sistema_estoque_produtos";

// 1. Função para SALVAR os dados no navegador
function salvarNoLocalStorage() {
    const listaEmTexto = JSON.stringify(listaDeProdutos);
    localStorage.setItem(CHAVE_STORAGE, listaEmTexto);
}

// 2. Função para CARREGAR os dados salvos quando a página abrir
function carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);

    if (dadosSalvos) {
        const produtosObjetos = JSON.parse(dadosSalvos);

        produtosObjetos.forEach((prod) => {
            const produtoInstanciado = new Produto(prod.nome, prod.preco, prod.quantidade);
            listaDeProdutos.push(produtoInstanciado);
        });
    }
}

// FASE 3: Captura de Elementos do DOM
const formProduto = document.getElementById("produto-form");
const btnLimparTudo = document.getElementById("limpar-tabela");
const totalEstoqueEl = document.getElementById("total-estoque");
const nomeInput = document.getElementById("nome");
const precoInput = document.getElementById("preco");
const quantidadeInput = document.getElementById("quantidade");
const datalistProdutos = document.getElementById("produtos-sugeridos");

// FASE 4: Escuta de Eventos

// 1. Adicionar ou Editar Produto pelo Formulário
formProduto.addEventListener("submit", function (event) {
    event.preventDefault();

    const nomeVal = nomeInput.value.trim();
    const precoVal = precoInput.value;
    const quantidadeVal = quantidadeInput.value;

    // Se o produto já existir na lista, removemos a versão antiga antes de inserir a nova
    const indexExistente = listaDeProdutos.findIndex(p => p.nome.toLowerCase() === nomeVal.toLowerCase());
    if (indexExistente !== -1) {
        listaDeProdutos.splice(indexExistente, 1);
    }

    const novoProduto = new Produto(nomeVal, precoVal, quantidadeVal);
    listaDeProdutos.push(novoProduto);

    salvarNoLocalStorage();
    atualizarInterface();
    formProduto.reset();
});

// 2. Detectar quando o usuário digita/seleciona um produto existente da lista
nomeInput.addEventListener("input", function () {
    const termoBuscado = nomeInput.value.trim().toLowerCase();
    
    // Procura se o texto bate exatamente com algum produto da lista
    const produtoEncontrado = listaDeProdutos.find(p => p.nome.toLowerCase() === termoBuscado);
    
    // Se encontrar, preenche os inputs de preço e quantidade automaticamente
    if (produtoEncontrado) {
        precoInput.value = produtoEncontrado.preco;
        quantidadeInput.value = produtoEncontrado.quantidade;
    }
});

// 3. Limpar toda a tabela
btnLimparTudo.addEventListener("click", function () {
    if (listaDeProdutos.length === 0) {
        alert("A tabela já está vazia!");
        return;
    }

    if (confirm("Tem certeza que deseja remover todos os produtos?")) {
        listaDeProdutos.length = 0;
        localStorage.removeItem(CHAVE_STORAGE);
        atualizarInterface();
        formProduto.reset();
    }
});

// FASE 5: Funções de Atualização e Renderização da Interface

// Função para atualizar dinamicamente a lista de sugestões enquanto o usuário digita
function atualizarDatalist() {
    datalistProdutos.innerHTML = "";
    listaDeProdutos.forEach(produto => {
        const option = document.createElement("option");
        option.value = produto.nome;
        datalistProdutos.appendChild(option);
    });
}

// Função responsável por remover um único produto pelo índice
function removerProduto(index) {
    listaDeProdutos.splice(index, 1);
    salvarNoLocalStorage();
    atualizarInterface();
}

// Função responsável por calcular e renderizar o total geral em estoque
function atualizarTotalEstoque() {
    const total = listaDeProdutos.reduce((acc, produto) => {
        return acc + produto.calcularSubtotal();
    }, 0);

    totalEstoqueEl.textContent = `Total em Estoque: R$ ${total.toFixed(2)}`;
}

// Função responsável por re-desenhar a tabela
function renderizarTabela() {
    const tabelaBody = document.querySelector("#tabela-produtos tbody");
    tabelaBody.innerHTML = "";

    listaDeProdutos.forEach((produto, index) => {
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>${produto.quantidade}</td>
            <td>R$ ${produto.calcularSubtotal().toFixed(2)}</td>
            <td>
                <button class="btn-remover">Remover</button>
            </td>
        `;

        const btnRemover = linha.querySelector(".btn-remover");
        btnRemover.addEventListener("click", () => removerProduto(index));

        tabelaBody.appendChild(linha);
    });
}

// Função principal que sincroniza a tela com os dados e as sugestões
function atualizarInterface() {
    renderizarTabela();
    atualizarTotalEstoque();
    atualizarDatalist();
}

// FASE 6: Inicialização da Aplicação
carregarDoLocalStorage();
atualizarInterface();
