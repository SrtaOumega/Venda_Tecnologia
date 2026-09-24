
class Produto {

    constructor(codigo, nome, categoria, valor, estoque) {
        this.codigo = codigo;
        this.nome = nome;
        this.categoria = categoria;
        this.valor = valor;
        this.estoque = estoque;
    }

    devolver() {
        this.estoque++;
    }

}

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


const produtos = [
    fone,
    teclado,
    mouse,
    microfone,
    mousepad,
    cadeira
];

const estoqueSalvo = JSON.parse(
    localStorage.getItem("estoqueEskillows")
);

if (estoqueSalvo) {

    for (let i = 0; i < produtos.length; i++) {

        const produto = produtos[i];

        if (estoqueSalvo[produto.codigo] !== undefined) {

            produto.estoque =
                estoqueSalvo[produto.codigo];

        }

    }

}

function salvarEstoque() {

    const estoqueAtual = {};


    for (let i = 0; i < produtos.length; i++) {

        estoqueAtual[produtos[i].codigo] =
            produtos[i].estoque;

    }


    localStorage.setItem(
        "estoqueEskillows",
        JSON.stringify(estoqueAtual)
    );

}



const searchInput =
    document.getElementById("search");


let categoriaSelecionada = "todos";


function formatString(value) {

    return value
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}



function filtrarProdutos() {

    const produtosTela =
        document.querySelectorAll(".link-produto");


    const mensagem =
        document.getElementById("nenhum-produto");


    let pesquisa = "";


    if (searchInput) {

        pesquisa =
            formatString(searchInput.value);

    }


    let produtosEncontrados = 0;


    produtosTela.forEach(function (produtoTela) {

        const nome =
            formatString(
                produtoTela.dataset.nome || ""
            );
        const categoria =
            produtoTela.dataset.categoria || "";

        const encontrouNome =
            nome.includes(pesquisa);

        const encontrouCategoria =
            categoriaSelecionada === "todos" ||
            categoria === categoriaSelecionada;


        if (encontrouNome && encontrouCategoria) {

            produtoTela.style.display = "block";

            produtosEncontrados++;

        } else {

            produtoTela.style.display = "none";

        }

    });


    if (mensagem) {

        if (produtosEncontrados === 0) {

            mensagem.style.display = "block";

        } else {

            mensagem.style.display = "none";

        }

    }

}


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            filtrarProdutos();

        }
    );

}

const botoesFiltro =
    document.querySelectorAll(".filtro-categoria");


botoesFiltro.forEach(function (botao) {

    botao.addEventListener(
        "click",
        function () {

            categoriaSelecionada =
                this.dataset.categoria;

            botoesFiltro.forEach(
                function (outroBotao) {

                    outroBotao.classList.remove(
                        "ativo"
                    );

                }
            );


            this.classList.add("ativo");

            filtrarProdutos();

        }
    );

});



class ItemCarrinho {

    constructor(produto, quantidade) {
        this.produto = produto;
        this.quantidade = quantidade;
    }



    subtotal() {

        return this.produto.valor *
            this.quantidade;

    }

}



class Carrinho {

    constructor() {

        this.itens = [];

        this.total = 0;


        this.desconto = 0;


        this.valorFinal = 0;

    }



    adicionar(produto, quantidade = 1) {

        if (quantidade < 1) {

            return false;

        }


        if (produto.estoque < quantidade) {

            return false;

        }



        let item = this.itens.find(
            function (item) {

                return item.produto.codigo ===
                    produto.codigo;

            }
        );


        produto.estoque -= quantidade;

        if (item) {

            item.quantidade += quantidade;

        } else {


            item = new ItemCarrinho(
                produto,
                quantidade
            );


            this.itens.push(item);

        }



        this.atualizarTotal();



        salvarEstoque();
        salvarCarrinho();


        return true;

    }


    atualizarTotal() {

        this.total = 0;


        for (let i = 0; i < this.itens.length; i++) {

            this.total +=
                this.itens[i].subtotal();

        }


        this.calcularDesconto();


        this.valorFinal =
            this.total - this.desconto;

    }



    calcularDesconto() {

        if (this.total >= 300) {

            this.desconto =
                this.total * 0.10;

        } else {

            this.desconto = 0;

        }

    }



    limpar() {

        this.itens = [];

        this.total = 0;

        this.desconto = 0;

        this.valorFinal = 0;


        salvarCarrinho();

    }

}



const meuCarrinho =
    new Carrinho();



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

function carregarCarrinho() {

    const carrinhoSalvo =
        JSON.parse(
            localStorage.getItem(
                "carrinhoEskillows"
            )
        );


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


        const produto =
            produtos.find(
                function (produto) {

                    return produto.codigo ===
                        itemSalvo.codigo;

                }
            );


        if (produto) {

            const item =
                new ItemCarrinho(
                    produto,
                    itemSalvo.quantidade
                );


            meuCarrinho.itens.push(item);

        }

    }



    meuCarrinho.atualizarTotal();

}



carregarCarrinho();


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



function atualizarTelaTotal() {


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



function atualizarEstoqueTela(produto) {


    const estoqueTela =
        document.getElementById(
            `estoque-${produto.codigo}`
        );



    if (estoqueTela) {

        estoqueTela.textContent =
            produto.estoque;

    }



    const mensagem =
        document.getElementById(
            `mensagem-${produto.codigo}`
        );


    const botao =
        document.querySelector(
            `.addcarrinho[value="${produto.codigo}"]`
        );



    const quantidade =
        document.getElementById("quantidade");



    if (produto.estoque <= 0) {


        if (mensagem) {

            mensagem.textContent =
                "Produto esgotado";

            mensagem.classList.add(
                "esgotado"
            );

        }



        if (botao) {

            botao.disabled = true;

            botao.textContent =
                "Produto esgotado";

        }


        if (quantidade) {

            quantidade.disabled = true;

        }

    } else {

        if (mensagem) {

            mensagem.textContent =
                `Produto disponível em estoque: ${produto.estoque}`;

            mensagem.classList.remove(
                "esgotado"
            );

        }


        if (botao) {

            botao.disabled = false;

            botao.innerHTML =
                '<i class="fa-solid fa-cart-shopping"></i> Adicionar ao carrinho';

        }


        if (quantidade) {

            quantidade.disabled = false;

            quantidade.max =
                produto.estoque;

        }

    }

}


function atualizarTodosEstoques() {

    for (let i = 0; i < produtos.length; i++) {

        atualizarEstoqueTela(
            produtos[i]
        );

    }

}




function atualizarCarrinhoTela() {

    if (!carrinhoLista) {

        return;

    }


    carrinhoLista.innerHTML = "";


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


    for (
        let i = 0;
        i < meuCarrinho.itens.length;
        i++
    ) {

        const itemCarrinho =
            meuCarrinho.itens[i];


        const li =
            document.createElement("li");


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




        const quantidade =
            document.createElement("span");


        quantidade.textContent =
            ` | Quantidade: ${itemCarrinho.quantidade}`;


        li.appendChild(quantidade);



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



        const botaoMais =
            document.createElement("button");


        botaoMais.textContent = "+";


        botaoMais.addEventListener(
            "click",
            function () {

                if (
                    itemCarrinho.produto.estoque > 0
                ) {

                    itemCarrinho.quantidade++;


                    itemCarrinho.produto.estoque--;


                    meuCarrinho.atualizarTotal();


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

        const botaoMenos =
            document.createElement("button");


        botaoMenos.textContent = "-";


        botaoMenos.addEventListener(
            "click",
            function () {


                if (
                    itemCarrinho.quantidade > 1
                ) {

                    itemCarrinho.quantidade--;


                    itemCarrinho.produto.devolver();


                    meuCarrinho.atualizarTotal();


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


        const botaoExcluir =
            document.createElement("button");


        botaoExcluir.textContent =
            "Excluir";


        botaoExcluir.addEventListener(
            "click",
            function () {

                for (
                    let quantidadeDevolver = 0;
                    quantidadeDevolver <
                    itemCarrinho.quantidade;
                    quantidadeDevolver++
                ) {

                    itemCarrinho.produto.devolver();

                }


                const indice =
                    meuCarrinho.itens.indexOf(
                        itemCarrinho
                    );



                if (indice !== -1) {

                    meuCarrinho.itens.splice(
                        indice,
                        1
                    );

                }


                meuCarrinho.atualizarTotal();


                salvarEstoque();
                salvarCarrinho();


                // Atualiza a tela
                atualizarCarrinhoTela();
                atualizarTelaTotal();
                atualizarTodosEstoques();

            }
        );


        li.appendChild(botaoExcluir);


        carrinhoLista.appendChild(li);

    }

}

const botoesAdicionar =
    document.querySelectorAll(".addcarrinho");



var i = 0;

while (i < botoesAdicionar.length) {
    botoesAdicionar[i].addEventListener("click", function () {

        const codigo = this.value;

        const produto = produtos.find(function (produto) {
            return produto.codigo === codigo;
        });

        if (!produto) {
            return;
        }

        let quantidadeEscolhida = 1;


        const inputQuantidade = document.getElementById("quantidade");


        if (inputQuantidade) {
            quantidadeEscolhida = parseInt(inputQuantidade.value);
        }

        if (isNaN(quantidadeEscolhida) || quantidadeEscolhida < 1) {
            alert("Escolha uma quantidade válida.");

            return;
        }

        if (quantidadeEscolhida > produto.estoque) {
            alert('Só temos ${produto.estoque} unidade(s) em estoque.');

            return;
        }
        if (meuCarrinho.adicionar(produto, quantidadeEscolhida)) {
            alert("Produto adicionado ao carrinho!");

            // Atualiza tudo
            atualizarTodosEstoques();
            atualizarCarrinhoTela();
            atualizarTelaTotal();
        } else {
            alert("Esse produto está esgotado.");
        }
    });

    i++;
}


if (finalizarcomp) {

    finalizarcomp.addEventListener(
        "click",
        function () {

            if (
                meuCarrinho.itens.length === 0
            ) {

                alert(
                    "O carrinho está vazio."
                );

                return;

            }

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


            meuCarrinho.limpar();


            // Atualiza a tela
            atualizarCarrinhoTela();
            atualizarTelaTotal();

        }
    );

}






atualizarTodosEstoques();


atualizarCarrinhoTela();


atualizarTelaTotal();