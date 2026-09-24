// ========================================
// CLASSE PRODUTO
// ========================================

// Essa classe serve de modelo para criar os produtos da loja
class Produto {

    constructor(codigo, nome, categoria, valor, estoque) {
        this.codigo = codigo;
        this.nome = nome;
        this.categoria = categoria;
        this.valor = valor;
        this.estoque = estoque;
    }


    // Devolve uma unidade para o estoque
    devolver() {
        this.estoque++;
    }

}


// ========================================
// PRODUTOS DA LOJA
// ========================================

// Aqui criamos os 6 produtos
// Ordem: codigo, nome, categoria, preço e estoque

const fone = new Produto(
    "cod001",
    "Fone Gamer",
    "audio",
    220,
    10
);

const teclado = new Produto(
    "cod002",
    "Teclado Gamer",
    "perifericos",
    250,
    5
);

const mouse = new Produto(
    "cod003",
    "Mouse Gamer",
    "perifericos",
    150,
    2
);

const microfone = new Produto(
    "cod004",
    "Microfone Gamer",
    "audio",
    250,
    10
);

const mousepad = new Produto(
    "cod005",
    "Mouse Pad Gamer",
    "acessorios",
    70,
    15
);

const cadeira = new Produto(
    "cod006",
    "Cadeira Gamer",
    "acessorios",
    1000,
    12
);


// Coloca todos os produtos dentro de uma lista
const produtos = [
    fone,
    teclado,
    mouse,
    microfone,
    mousepad,
    cadeira
];


// ========================================
// LOCAL STORAGE
// ========================================

/*
    O localStorage serve para salvar informações no navegador.

    Estamos usando ele para o carrinho e o estoque não sumirem
    quando a pessoa trocar de uma pagina para outra.

    Sem ele, quando saísse da pagina do produto e entrasse
    no carrinho, o JavaScript começaria novamente e perderia
    as informações.
*/


// ========================================
// CARREGAR ESTOQUE SALVO
// ========================================

// Procura se já existe estoque salvo no navegador
const estoqueSalvo = JSON.parse(
    localStorage.getItem("estoqueEskillows")
);


// Se já existir estoque salvo usa esses valores
if (estoqueSalvo) {

    for (let i = 0; i < produtos.length; i++) {

        const produto = produtos[i];


        // Procura o estoque pelo codigo do produto
        if (estoqueSalvo[produto.codigo] !== undefined) {

            produto.estoque =
                estoqueSalvo[produto.codigo];

        }

    }

}


// ========================================
// SALVAR ESTOQUE
// ========================================

// Essa função salva o estoque atual no navegador
function salvarEstoque() {

    const estoqueAtual = {};


    for (let i = 0; i < produtos.length; i++) {

        estoqueAtual[produtos[i].codigo] =
            produtos[i].estoque;

    }


    // Transforma os dados em texto e salva
    localStorage.setItem(
        "estoqueEskillows",
        JSON.stringify(estoqueAtual)
    );

}


// ========================================
// BARRA DE PESQUISA
// ========================================

// Pega a barra de pesquisa do HTML
const searchInput =
    document.getElementById("search");


// Começa mostrando todas as categorias
let categoriaSelecionada = "todos";


// Deixa o texto mais fácil de comparar
function formatString(value) {

    return value
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


// ========================================
// PESQUISAR E FILTRAR PRODUTOS
// ========================================

function filtrarProdutos() {

    // Pega todos os produtos que aparecem no catalogo
    const produtosTela =
        document.querySelectorAll(".link-produto");


    // Pega a mensagem de produto não encontrado
    const mensagem =
        document.getElementById("nenhum-produto");


    let pesquisa = "";


    // Só pega o texto se a barra existir nessa pagina
    if (searchInput) {

        pesquisa =
            formatString(searchInput.value);

    }


    // Conta quantos produtos foram encontrados
    let produtosEncontrados = 0;


    produtosTela.forEach(function (produtoTela) {

        // Pega o nome que colocamos no HTML
        const nome =
            formatString(
                produtoTela.dataset.nome || ""
            );


        // Pega a categoria do produto
        const categoria =
            produtoTela.dataset.categoria || "";


        // Verifica se o nome combina com o que foi digitado
        const encontrouNome =
            nome.includes(pesquisa);


        // Verifica se combina com a categoria escolhida
        const encontrouCategoria =
            categoriaSelecionada === "todos" ||
            categoria === categoriaSelecionada;


        // Só mostra se passar pela pesquisa e pelo filtro
        if (encontrouNome && encontrouCategoria) {

            produtoTela.style.display = "block";

            produtosEncontrados++;

        } else {

            // Os produtos que não combinam somem
            produtoTela.style.display = "none";

        }

    });


    // Se não encontrar nenhum produto mostra a mensagem
    if (mensagem) {

        if (produtosEncontrados === 0) {

            mensagem.style.display = "block";

        } else {

            mensagem.style.display = "none";

        }

    }

}


// Faz a pesquisa acontecer enquanto a pessoa digita
if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            filtrarProdutos();

        }
    );

}


// ========================================
// FILTRO POR CATEGORIA
// ========================================

// Pega os botões das categorias
const botoesFiltro =
    document.querySelectorAll(".filtro-categoria");


botoesFiltro.forEach(function (botao) {

    botao.addEventListener(
        "click",
        function () {

            // Guarda qual categoria foi escolhida
            categoriaSelecionada =
                this.dataset.categoria;


            // Tira o ativo dos outros botões
            botoesFiltro.forEach(
                function (outroBotao) {

                    outroBotao.classList.remove(
                        "ativo"
                    );

                }
            );


            // Marca o botão que foi clicado
            this.classList.add("ativo");


            // Atualiza os produtos mostrados
            filtrarProdutos();

        }
    );

});


// ========================================
// CLASSE ITEM DO CARRINHO
// ========================================

// Representa um produto que foi colocado no carrinho
class ItemCarrinho {

    constructor(produto, quantidade) {
        this.produto = produto;
        this.quantidade = quantidade;
    }


    // Calcula preço vezes quantidade
    subtotal() {

        return this.produto.valor *
            this.quantidade;

    }

}


// ========================================
// CLASSE CARRINHO
// ========================================

// Essa classe controla o carrinho inteiro
class Carrinho {

    constructor() {

        // Guarda os produtos adicionados
        this.itens = [];

        // Valor antes do desconto
        this.total = 0;

        // Valor do desconto
        this.desconto = 0;

        // Valor depois do desconto
        this.valorFinal = 0;

    }


    // Adiciona um produto no carrinho
    adicionar(produto, quantidade = 1) {

        // Não aceita quantidade menor que 1
        if (quantidade < 1) {

            return false;

        }


        // Não deixa comprar mais do que existe no estoque
        if (produto.estoque < quantidade) {

            return false;

        }


        // Procura se o produto já esta no carrinho
        let item = this.itens.find(
            function (item) {

                return item.produto.codigo ===
                    produto.codigo;

            }
        );


        // Tira do estoque a quantidade escolhida
        produto.estoque -= quantidade;


        // Se já estiver no carrinho aumenta a quantidade
        if (item) {

            item.quantidade += quantidade;

        } else {

            // Se ainda não estiver cria um item novo
            item = new ItemCarrinho(
                produto,
                quantidade
            );


            this.itens.push(item);

        }


        // Recalcula os valores
        this.atualizarTotal();


        // Salva as mudanças no navegador
        salvarEstoque();
        salvarCarrinho();


        return true;

    }


    // Soma o valor de todos os produtos
    atualizarTotal() {

        this.total = 0;


        for (let i = 0; i < this.itens.length; i++) {

            this.total +=
                this.itens[i].subtotal();

        }


        // Depois de somar calcula o desconto
        this.calcularDesconto();


        // Calcula o valor final
        this.valorFinal =
            this.total - this.desconto;

    }


    // Da 10% de desconto quando chegar a R$ 300
    calcularDesconto() {

        if (this.total >= 300) {

            this.desconto =
                this.total * 0.10;

        } else {

            this.desconto = 0;

        }

    }


    // Limpa o carrinho depois de finalizar
    limpar() {

        this.itens = [];

        this.total = 0;

        this.desconto = 0;

        this.valorFinal = 0;


        // Atualiza o localStorage
        salvarCarrinho();

    }

}


// Cria o carrinho que vamos usar no site
const meuCarrinho =
    new Carrinho();


// ========================================
// SALVAR CARRINHO NO LOCAL STORAGE
// ========================================

/*
    Aqui salvamos o codigo do produto e a quantidade.

    Assim quando a pessoa sair da pagina do produto
    e abrir o carrinho, os produtos continuam lá.
*/

function salvarCarrinho() {

    const carrinhoParaSalvar =
        meuCarrinho.itens.map(
            function (item) {

                return {

                    codigo:
                        item.produto.codigo,

                    quantidade:
                        item.quantidade

                };

            }
        );


    localStorage.setItem(
        "carrinhoEskillows",
        JSON.stringify(carrinhoParaSalvar)
    );

}


// ========================================
// CARREGAR CARRINHO
// ========================================

/*
    Quando uma pagina abre essa função olha no localStorage
    para saber se já tinha algum produto no carrinho.
*/

function carregarCarrinho() {

    const carrinhoSalvo =
        JSON.parse(
            localStorage.getItem(
                "carrinhoEskillows"
            )
        );


    // Se não tiver nada salvo para aqui
    if (!carrinhoSalvo) {

        return;

    }


    for (
        let i = 0;
        i < carrinhoSalvo.length;
        i++
    ) {

        const itemSalvo =
            carrinhoSalvo[i];


        // Procura o produto usando o codigo salvo
        const produto =
            produtos.find(
                function (produto) {

                    return produto.codigo ===
                        itemSalvo.codigo;

                }
            );


        // Se achar coloca ele novamente no carrinho
        if (produto) {

            const item =
                new ItemCarrinho(
                    produto,
                    itemSalvo.quantidade
                );


            meuCarrinho.itens.push(item);

        }

    }


    // Recalcula subtotal, desconto e total
    meuCarrinho.atualizarTotal();

}


// Carrega o carrinho quando a pagina abrir
carregarCarrinho();


// ========================================
// ELEMENTOS DA PAGINA DO CARRINHO
// ========================================

// Esses elementos existem no carrinho.html

const carrinhoLista =
    document.getElementById("lista-carrinho");

const total =
    document.getElementById("total");

const recibo =
    document.getElementById("recibo");

const finalizarcomp =
    document.getElementById("finalizarcomp");

const carrinhoVazio =
    document.getElementById("carrinho-vazio");


// ========================================
// MOSTRAR OS VALORES DA COMPRA
// ========================================

function atualizarTelaTotal() {

    // Se não estiver no carrinho não precisa continuar
    if (!total) {

        return;

    }


    total.textContent =
        `Subtotal: R$ ${meuCarrinho.total.toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 2
            }
        )}\n` +

        `Desconto: R$ ${meuCarrinho.desconto.toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 2
            }
        )}\n` +

        `Valor final: R$ ${meuCarrinho.valorFinal.toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 2
            }
        )}`;

}


// ========================================
// ATUALIZAR ESTOQUE NA TELA
// ========================================

function atualizarEstoqueTela(produto) {

    // Procura onde aparece o numero do estoque
    const estoqueTela =
        document.getElementById(
            `estoque-${produto.codigo}`
        );


    // Atualiza o numero mostrado
    if (estoqueTela) {

        estoqueTela.textContent =
            produto.estoque;

    }


    // Procura a mensagem de estoque
    const mensagem =
        document.getElementById(
            `mensagem-${produto.codigo}`
        );


    // Procura o botão de adicionar
    const botao =
        document.querySelector(
            `.addcarrinho[value="${produto.codigo}"]`
        );


    // Procura a caixa de quantidade
    const quantidade =
        document.getElementById("quantidade");


    // Se o estoque zerar
    if (produto.estoque <= 0) {

        // Troca a mensagem
        if (mensagem) {

            mensagem.textContent =
                "Produto esgotado";

            mensagem.classList.add(
                "esgotado"
            );

        }


        // Desativa o botão
        if (botao) {

            botao.disabled = true;

            botao.textContent =
                "Produto esgotado";

        }


        // Desativa a quantidade
        if (quantidade) {

            quantidade.disabled = true;

        }

    } else {

        // Se ainda tiver estoque mostra normalmente
        if (mensagem) {

            mensagem.textContent =
                `Produto disponível em estoque: ${produto.estoque}`;

            mensagem.classList.remove(
                "esgotado"
            );

        }


        // Deixa o botão funcionando
        if (botao) {

            botao.disabled = false;

            botao.innerHTML =
                '<i class="fa-solid fa-cart-shopping"></i> Adicionar ao carrinho';

        }


        // Deixa escolher quantidade
        if (quantidade) {

            quantidade.disabled = false;

            // Não deixa escolher mais do que tem
            quantidade.max =
                produto.estoque;

        }

    }

}


// Atualiza o estoque de todos os produtos
function atualizarTodosEstoques() {

    for (let i = 0; i < produtos.length; i++) {

        atualizarEstoqueTela(
            produtos[i]
        );

    }

}


// ========================================
// MOSTRAR PRODUTOS NO CARRINHO
// ========================================

function atualizarCarrinhoTela() {

    // Se não estiver no carrinho para aqui
    if (!carrinhoLista) {

        return;

    }


    // Limpa a lista antes de montar novamente
    carrinhoLista.innerHTML = "";


    // Mostra ou esconde a mensagem de carrinho vazio
    if (meuCarrinho.itens.length === 0) {

        if (carrinhoVazio) {

            carrinhoVazio.style.display =
                "block";

        }

    } else {

        if (carrinhoVazio) {

            carrinhoVazio.style.display =
                "none";

        }

    }


    // Passa por todos os produtos do carrinho
    for (
        let i = 0;
        i < meuCarrinho.itens.length;
        i++
    ) {

        const itemCarrinho =
            meuCarrinho.itens[i];


        // Cria uma linha para o produto
        const li =
            document.createElement("li");


        // Nome e preço do produto
        const nome =
            document.createElement("span");


        nome.textContent =
            `${itemCarrinho.produto.nome} - ` +
            `R$ ${itemCarrinho.produto.valor.toLocaleString(
                "pt-BR",
                {
                    minimumFractionDigits: 2
                }
            )}`;


        li.appendChild(nome);


        // ========================================
        // QUANTIDADE
        // ========================================

        const quantidade =
            document.createElement("span");


        quantidade.textContent =
            ` | Quantidade: ${itemCarrinho.quantidade}`;


        li.appendChild(quantidade);


        // ========================================
        // SUBTOTAL DO PRODUTO
        // ========================================

        const subtotal =
            document.createElement("span");


        subtotal.textContent =
            ` | Subtotal: R$ ${itemCarrinho
                .subtotal()
                .toLocaleString(
                    "pt-BR",
                    {
                        minimumFractionDigits: 2
                    }
                )}`;


        li.appendChild(subtotal);


        // ========================================
        // BOTÃO +
        // ========================================

        const botaoMais =
            document.createElement("button");


        botaoMais.textContent = "+";


        botaoMais.addEventListener(
            "click",
            function () {

                // Só aumenta se ainda tiver estoque
                if (
                    itemCarrinho.produto.estoque > 0
                ) {

                    // Aumenta a quantidade no carrinho
                    itemCarrinho.quantidade++;


                    // Tira uma unidade do estoque
                    itemCarrinho.produto.estoque--;


                    // Recalcula os valores
                    meuCarrinho.atualizarTotal();


                    // Salva as alterações
                    salvarEstoque();
                    salvarCarrinho();


                    // Atualiza a tela
                    atualizarCarrinhoTela();
                    atualizarTelaTotal();
                    atualizarTodosEstoques();

                } else {

                    alert(
                        "Esse produto está esgotado."
                    );

                }

            }
        );


        li.appendChild(botaoMais);


        // ========================================
        // BOTÃO -
        // ========================================

        const botaoMenos =
            document.createElement("button");


        botaoMenos.textContent = "-";


        botaoMenos.addEventListener(
            "click",
            function () {

                // Não deixa a quantidade ficar menor que 1
                if (
                    itemCarrinho.quantidade > 1
                ) {

                    // Diminui a quantidade
                    itemCarrinho.quantidade--;


                    // Devolve uma unidade para o estoque
                    itemCarrinho.produto.devolver();


                    // Recalcula os valores
                    meuCarrinho.atualizarTotal();


                    // Salva as alterações
                    salvarEstoque();
                    salvarCarrinho();


                    // Atualiza a tela
                    atualizarCarrinhoTela();
                    atualizarTelaTotal();
                    atualizarTodosEstoques();

                }

            }
        );


        li.appendChild(botaoMenos);


        // ========================================
        // BOTÃO EXCLUIR
        // ========================================

        const botaoExcluir =
            document.createElement("button");


        botaoExcluir.textContent =
            "Excluir";


        botaoExcluir.addEventListener(
            "click",
            function () {

                /*
                    Se excluir o produto do carrinho,
                    todas as unidades voltam pro estoque.
                */

                for (
                    let quantidadeDevolver = 0;
                    quantidadeDevolver <
                    itemCarrinho.quantidade;
                    quantidadeDevolver++
                ) {

                    itemCarrinho.produto.devolver();

                }


                // Descobre a posição do produto
                const indice =
                    meuCarrinho.itens.indexOf(
                        itemCarrinho
                    );


                // Remove do carrinho
                if (indice !== -1) {

                    meuCarrinho.itens.splice(
                        indice,
                        1
                    );

                }


                // Recalcula os valores
                meuCarrinho.atualizarTotal();


                // Salva as mudanças
                salvarEstoque();
                salvarCarrinho();


                // Atualiza a tela
                atualizarCarrinhoTela();
                atualizarTelaTotal();
                atualizarTodosEstoques();

            }
        );


        li.appendChild(botaoExcluir);


        // Coloca o produto dentro da lista
        carrinhoLista.appendChild(li);

    }

}


// ========================================
// ADICIONAR PRODUTO AO CARRINHO
// ========================================

// Pega todos os botões de adicionar
const botoesAdicionar =
    document.querySelectorAll(".addcarrinho");


for (
    let i = 0;
    i < botoesAdicionar.length;
    i++
) {

    botoesAdicionar[i].addEventListener(
        "click",
        function () {

            // O value do botão guarda o codigo do produto
            const codigo =
                this.value;


            // Procura o produto pelo codigo
            const produto =
                produtos.find(
                    function (produto) {

                        return produto.codigo ===
                            codigo;

                    }
                );


            // Se não achar para aqui
            if (!produto) {

                return;

            }


            // Começa com uma unidade
            let quantidadeEscolhida = 1;


            // Procura a caixa de quantidade
            const inputQuantidade =
                document.getElementById(
                    "quantidade"
                );


            // Se tiver a caixa pega o valor escolhido
            if (inputQuantidade) {

                quantidadeEscolhida =
                    parseInt(
                        inputQuantidade.value
                    );

            }


            // Não aceita numero errado
            if (
                isNaN(quantidadeEscolhida) ||
                quantidadeEscolhida < 1
            ) {

                alert(
                    "Escolha uma quantidade válida."
                );

                return;

            }


            // Não deixa comprar mais do que tem
            if (
                quantidadeEscolhida >
                produto.estoque
            ) {

                alert(
                    `Só temos ${produto.estoque} unidade(s) em estoque.`
                );

                return;

            }


            // Adiciona no carrinho
            if (
                meuCarrinho.adicionar(
                    produto,
                    quantidadeEscolhida
                )
            ) {

                alert(
                    "Produto adicionado ao carrinho!"
                );


                // Atualiza tudo
                atualizarTodosEstoques();
                atualizarCarrinhoTela();
                atualizarTelaTotal();

            } else {

                alert(
                    "Esse produto está esgotado."
                );

            }

        }
    );

}


// ========================================
// FINALIZAR COMPRA
// ========================================

if (finalizarcomp) {

    finalizarcomp.addEventListener(
        "click",
        function () {

            // Não deixa finalizar se estiver vazio
            if (
                meuCarrinho.itens.length === 0
            ) {

                alert(
                    "O carrinho está vazio."
                );

                return;

            }


            // Conta quantos itens foram comprados
            let quantidadeTotal = 0;


            for (
                let i = 0;
                i < meuCarrinho.itens.length;
                i++
            ) {

                quantidadeTotal +=
                    meuCarrinho.itens[i]
                        .quantidade;

            }


            // ========================================
            // CRIAR RECIBO
            // ========================================

            const nota =
                document.createElement("p");


            nota.textContent =
                `Compra finalizada com sucesso!\n\n` +

                `Produtos:\n` +

                meuCarrinho.itens
                    .map(
                        function (item) {

                            return (
                                `${item.produto.nome} ` +
                                `(x${item.quantidade})`
                            );

                        }
                    )
                    .join("\n") +

                `\n\nTotal de itens: ${quantidadeTotal}\n` +

                `Subtotal: R$ ${meuCarrinho.total.toLocaleString(
                    "pt-BR",
                    {
                        minimumFractionDigits: 2
                    }
                )}\n` +

                `Desconto: R$ ${meuCarrinho.desconto.toLocaleString(
                    "pt-BR",
                    {
                        minimumFractionDigits: 2
                    }
                )}\n` +

                `Valor final: R$ ${meuCarrinho.valorFinal.toLocaleString(
                    "pt-BR",
                    {
                        minimumFractionDigits: 2
                    }
                )}`;


            // Coloca o recibo na tela
            if (recibo) {

                recibo.innerHTML = "";

                recibo.appendChild(nota);

            }


            /*
                Depois que a compra termina limpamos o carrinho.

                Não devolvemos os produtos para o estoque
                porque a compra realmente foi finalizada.
            */

            meuCarrinho.limpar();


            // Atualiza a tela
            atualizarCarrinhoTela();
            atualizarTelaTotal();

        }
    );

}


// ========================================
// QUANDO A PAGINA ABRIR
// ========================================

// Mostra o estoque correto
atualizarTodosEstoques();


// Mostra os produtos que estavam salvos no carrinho
atualizarCarrinhoTela();


// Mostra subtotal, desconto e valor final
atualizarTelaTotal();