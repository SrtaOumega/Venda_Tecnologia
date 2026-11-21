
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
    "Fone Gamer — Branco e vinho",
    "audio",
    220,
    10
);
const fone2 = new Produto("cod008", "Fone Gamer — RGB preto", "audio", 220, 10);

const teclado = new Produto(
    "cod002",
    "Teclado Gamer — Preto RGB",
    "perifericos",
    250,
    5
);
const teclado2 = new Produto("cod009", "Teclado Gamer — Azul e branco", "perifericos", 250, 5);

const mouse = new Produto(
    "cod003",
    "Mouse Gamer — RGB com fio",
    "perifericos",
    150,
    2
);
const mouse2 = new Produto("cod010", "Mouse Gamer — RGB sem fio", "perifericos", 150, 2);

const microfone = new Produto(
    "cod004",
    "Microfone Gamer — Mesa RGB",
    "audio",
    250,
    10
);
const microfone2 = new Produto("cod011", "Microfone Gamer — Braço articulado", "audio", 250, 10);

const caixadesom = new Produto(
    "cod007",
    "Caixa de Som Gamer",
    "audio",
    170,
    10
);
const webcam = new Produto("cod014", "Webcam Full HD", "perifericos", 120, 10);

const mousepad = new Produto(
    "cod005",
    "Mouse Pad Gamer — Dragão",
    "acessorios",
    70,
    15
);
const mousepad2 = new Produto("cod012", "Mouse Pad Gamer — Rosa com gatos", "acessorios", 70, 15);

const cadeira = new Produto(
    "cod006",
    "Cadeira Gamer — Preto e azul",
    "acessorios",
    1000,
    12
);
const cadeira2 = new Produto("cod013", "Cadeira Gamer — Branca e azul", "acessorios", 1000, 12);


const produtos = [
    fone,
    fone2,
    teclado,
    teclado2,
    mouse,
    mouse2,
    microfone,
    microfone2,
    caixadesom,
    webcam,
    mousepad,
    mousepad2,
    cadeira,
    cadeira2
];

const variantesPorPagina = {
    fone: [
        { produto: fone, imagem: "../imagens/fone.jpeg" },
        { produto: fone2, imagem: "../imagens/fone%202.jpeg" }
    ],
    teclado: [
        { produto: teclado, imagem: "../imagens/teclado.png" },
        { produto: teclado2, imagem: "../imagens/teclado%202.jpeg" }
    ],
    mouse: [
        { produto: mouse, imagem: "../imagens/mouse.jpeg" },
        { produto: mouse2, imagem: "../imagens/mouse%202.jpeg" }
    ],
    microfone: [
        { produto: microfone, imagem: "../imagens/microfone.jpeg" },
        { produto: microfone2, imagem: "../imagens/microfone%202.jpeg" }
    ],
    mousepad: [
        { produto: mousepad, imagem: "../imagens/mousepad.jpeg" },
        { produto: mousepad2, imagem: "../imagens/mousepad%202.jpeg" }
    ],
    cadeira: [
        { produto: cadeira, imagem: "../imagens/cadeira%203.jpeg" },
        { produto: cadeira2, imagem: "../imagens/cadeira%202.jpeg" }
    ]
};

const nomePaginaProduto = window.location.pathname.split("/").pop().replace(".html", "");
const variantesProdutoAtual = variantesPorPagina[nomePaginaProduto];
if (variantesProdutoAtual) {
    const opcao = new URLSearchParams(window.location.search).get("variante") === "2" ? 1 : 0;
    const varianteAtual = variantesProdutoAtual[opcao];
    const imagem = document.getElementById("imagem-detalhes-principal");
    const titulo = document.querySelector(".informacoes-produto h1");
    const mensagemEstoque = document.querySelector(".estoque-produto");
    const numeroEstoque = document.querySelector(".quantidade-estoque span");
    const botaoAdicionar = document.querySelector(".addcarrinho");

    if (imagem) {
        imagem.src = varianteAtual.imagem;
        imagem.alt = varianteAtual.produto.nome;
    }
    if (titulo) titulo.textContent = varianteAtual.produto.nome;
    if (mensagemEstoque) mensagemEstoque.id = `mensagem-${varianteAtual.produto.codigo}`;
    if (numeroEstoque) numeroEstoque.id = `estoque-${varianteAtual.produto.codigo}`;
    if (botaoAdicionar) botaoAdicionar.value = varianteAtual.produto.codigo;
    document.title = `${varianteAtual.produto.nome} | Eskillows`;
}

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

let avisoLojaTimer;

function mostrarAviso(texto, tipo = "") {
    let aviso = document.getElementById("aviso-loja");

    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "aviso-loja";
        aviso.className = "aviso-loja";
        aviso.setAttribute("role", "status");
        aviso.setAttribute("aria-live", "polite");
        document.body.appendChild(aviso);
    }

    aviso.textContent = texto;
    aviso.className = `aviso-loja${tipo ? ` ${tipo}` : ""}`;
    window.clearTimeout(avisoLojaTimer);
    avisoLojaTimer = window.setTimeout(() => aviso.remove(), 4200);
}

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

                    mostrarAviso("Esse produto está esgotado.", "erro");

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
            mostrarAviso("Escolha uma quantidade válida.", "erro");

            return;
        }

        if (quantidadeEscolhida > produto.estoque) {
            mostrarAviso(`Temos apenas ${produto.estoque} unidade(s) em estoque.`, "erro");

            return;
        }
        if (meuCarrinho.adicionar(produto, quantidadeEscolhida)) {
            mostrarAviso("Produto adicionado ao carrinho!", "sucesso");

            // Atualiza tudo
            atualizarTodosEstoques();
            atualizarCarrinhoTela();
            atualizarTelaTotal();
        } else {
            mostrarAviso("Esse produto está esgotado.", "erro");
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

                mostrarAviso("Seu carrinho está vazio. Adicione um produto para continuar.", "erro");

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
