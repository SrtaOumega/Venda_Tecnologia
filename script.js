
const API_URL = "http://localhost:3000";

let produtos = [];
let categoriaSelecionada = "todos";
let avisoLojaTimer;

const searchInput = document.getElementById("search");
const listaProdutos = document.getElementById("lista-produtos");
const mensagemNenhumProduto = document.getElementById("nenhum-produto");

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

function formatString(value) {
    return String(value ?? "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function prepararProduto(dado) {
    const nome = dado.nome || "Produto";
    const nomeNormalizado = formatString(nome);

    let categoria = "acessorios";

    if (
        nomeNormalizado.includes("mouse") ||
        nomeNormalizado.includes("teclado") ||
        nomeNormalizado.includes("webcam")
    ) {
        categoria = "perifericos";
    } else if (
        nomeNormalizado.includes("cadeira") ||
        nomeNormalizado.includes("mousepad") ||
        nomeNormalizado.includes("mouse pad")
    ) {
        categoria = "acessorios";
    } else if (
        nomeNormalizado.includes("fone") ||
        nomeNormalizado.includes("headset") ||
        nomeNormalizado.includes("microfone") ||
        nomeNormalizado.includes("som")
    ) {
        categoria = "audio";
    }

    return {
        id: dado.id,
        codigo: dado.codigo,
        nome: nome,
        descricao: dado.descricao || "",
        categoria: categoria,
        valor: Number(dado.preco),
        estoque: Number(dado.estoque),
        imagem: dado.imagem || "../imagens/site.png",
        ativo: Number(dado.ativo) === 1
    };
}

function caminhoDetalhe(produto) {
    const paginas = {
        "PROD-001": "mouse.html",
        "PROD-002": "teclado.html",
        "PROD-003": "mousepad.html",
        "PROD-004": "fone.html",
        "PROD-005": "microfone.html",
        "PROD-006": "caixadesom.html",
        "PROD-007": "webcam.html",
        "PROD-008": "cadeira.html"
    };

    return paginas[produto.codigo] || "#";
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function renderizarProdutos() {
    if (!listaProdutos) return;

    listaProdutos.innerHTML = "";

    const produtosAtivos = produtos.filter(produto => produto.ativo);

    produtosAtivos.forEach(produto => {
        const link = document.createElement("a");
        link.href = caminhoDetalhe(produto);
        link.className = "link-produto";
        link.dataset.nome = produto.nome;
        link.dataset.categoria = produto.categoria;

        const card = document.createElement("div");
        card.className = "produto";

        const imagem = document.createElement("img");
        imagem.src = produto.imagem;
        imagem.alt = produto.nome;
        imagem.className = "imagem-produto";

        imagem.onerror = function () {
            this.onerror = null;
            this.src = "../imagens/site.png";
        };

        const titulo = document.createElement("h3");
        titulo.textContent = produto.nome;

        const preco = document.createElement("p");
        preco.className = "preco";
        preco.textContent = formatarPreco(produto.valor);

        const estoque = document.createElement("p");
        estoque.className = "ver-produto";
        estoque.textContent = produto.estoque > 0
            ? "Ver produto"
            : "Produto esgotado";

        card.append(imagem, titulo, preco, estoque);
        link.appendChild(card);
        listaProdutos.appendChild(link);
    });

    filtrarProdutos();
}

async function carregarProdutos() {
    if (listaProdutos) {
        listaProdutos.innerHTML = "<p>Carregando produtos...</p>";
    }

    try {
        const resposta = await fetch(`${API_URL}/produtos`);

        if (!resposta.ok) {
            throw new Error("Não foi possível buscar os produtos.");
        }

        const dados = await resposta.json();
        produtos = dados.map(prepararProduto);

        carregarCarrinho();
        renderizarProdutos();
        configurarBotoesAdicionar();
        configurarPaginaDetalhe();

        atualizarTodosEstoques();
        atualizarCarrinhoTela();
        atualizarTelaTotal();

    } catch (erro) {
        console.error("Erro ao carregar catálogo:", erro);

        if (listaProdutos) {
            listaProdutos.innerHTML =
                "<p>Não foi possível carregar os produtos. Confira se o servidor Node está ligado.</p>";
        }

        mostrarAviso(
            "Não conseguimos carregar os produtos. Verifique se a API está funcionando.",
            "erro"
        );
    }
}

function filtrarProdutos() {
    const produtosTela = document.querySelectorAll(".link-produto");
    const pesquisa = searchInput ? formatString(searchInput.value) : "";

    let encontrados = 0;

    produtosTela.forEach(card => {
        const nome = formatString(card.dataset.nome);
        const categoria = card.dataset.categoria;

        const combinaNome = nome.includes(pesquisa);

        const combinaCategoria =
            categoriaSelecionada === "todos" ||
            categoria === categoriaSelecionada;

        if (combinaNome && combinaCategoria) {
            card.style.display = "block";
            encontrados++;
        } else {
            card.style.display = "none";
        }
    });

    if (mensagemNenhumProduto) {
        mensagemNenhumProduto.style.display =
            encontrados === 0 ? "block" : "none";
    }
}

if (searchInput) {
    searchInput.addEventListener("input", filtrarProdutos);
}

document.querySelectorAll(".filtro-categoria").forEach(botao => {
    botao.addEventListener("click", function () {
        categoriaSelecionada = this.dataset.categoria || "todos";

        document.querySelectorAll(".filtro-categoria").forEach(outro => {
            outro.classList.remove("ativo");
        });

        this.classList.add("ativo");
        filtrarProdutos();
    });
});

class ItemCarrinho {
    constructor(produto, quantidade) {
        this.produto = produto;
        this.quantidade = quantidade;
    }

    subtotal() {
        return this.produto.valor * this.quantidade;
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
        if (!produto || quantidade < 1 || produto.estoque < quantidade) {
            return false;
        }

        const item = this.itens.find(
            atual => atual.produto.codigo === produto.codigo
        );

        produto.estoque -= quantidade;

        if (item) {
            item.quantidade += quantidade;
        } else {
            this.itens.push(new ItemCarrinho(produto, quantidade));
        }

        this.atualizarTotal();
        salvarCarrinho();

        return true;
    }

    atualizarTotal() {
        this.total = this.itens.reduce(
            (soma, item) => soma + item.subtotal(),
            0
        );

        this.desconto = this.total >= 300 ? this.total * 0.10 : 0;
        this.valorFinal = this.total - this.desconto;
    }

    limpar() {
        this.itens = [];
        this.atualizarTotal();
        salvarCarrinho();
    }
}

const meuCarrinho = new Carrinho();

function salvarCarrinho() {
    const dados = meuCarrinho.itens.map(item => ({
        codigo: item.produto.codigo,
        quantidade: item.quantidade
    }));

    localStorage.setItem("carrinhoEskillows", JSON.stringify(dados));
}

function carregarCarrinho() {
    meuCarrinho.itens = [];

    let salvos = [];

    try {
        salvos = JSON.parse(
            localStorage.getItem("carrinhoEskillows") || "[]"
        );
    } catch (erro) {
        console.warn("Carrinho salvo inválido:", erro);
    }

    salvos.forEach(itemSalvo => {
        const produto = produtos.find(
            item => item.codigo === itemSalvo.codigo
        );

        const quantidade = Number(itemSalvo.quantidade);

        if (produto && Number.isInteger(quantidade) && quantidade > 0) {
            produto.estoque = Math.max(0, produto.estoque - quantidade);

            meuCarrinho.itens.push(
                new ItemCarrinho(produto, quantidade)
            );
        }
    });

    meuCarrinho.atualizarTotal();
}

const carrinhoLista = document.getElementById("lista-carrinho");
const total = document.getElementById("total");
const recibo = document.getElementById("recibo");
const finalizarcomp = document.getElementById("finalizarcomp");
const carrinhoVazio = document.getElementById("carrinho-vazio");

function atualizarTelaTotal() {
    if (!total) return;

    total.textContent =
        `Subtotal: ${formatarPreco(meuCarrinho.total)}\n` +
        `Desconto: ${formatarPreco(meuCarrinho.desconto)}\n` +
        `Valor final: ${formatarPreco(meuCarrinho.valorFinal)}`;
}

function atualizarEstoqueTela(produto) {
    const estoqueTela = document.getElementById(`estoque-${produto.codigo}`);
    const mensagem = document.getElementById(`mensagem-${produto.codigo}`);

    const botao = document.querySelector(
        `.addcarrinho[value="${produto.codigo}"]`
    );

    if (estoqueTela) {
        estoqueTela.textContent = produto.estoque;
    }

    if (mensagem) {
        mensagem.textContent = produto.estoque > 0
            ? `Produto disponível em estoque: ${produto.estoque}`
            : "Produto esgotado";

        mensagem.classList.toggle("esgotado", produto.estoque <= 0);
    }

    if (botao) {
        botao.disabled = produto.estoque <= 0;

        if (produto.estoque <= 0) {
            botao.textContent = "Produto esgotado";
        }
    }
}

function atualizarTodosEstoques() {
    produtos.forEach(atualizarEstoqueTela);
}

function atualizarCarrinhoTela() {
    if (!carrinhoLista) return;

    carrinhoLista.innerHTML = "";

    if (carrinhoVazio) {
        carrinhoVazio.style.display =
            meuCarrinho.itens.length === 0 ? "block" : "none";
    }

    meuCarrinho.itens.forEach(itemCarrinho => {
        const li = document.createElement("li");

        const nome = document.createElement("span");
        nome.textContent =
            `${itemCarrinho.produto.nome} - ${formatarPreco(itemCarrinho.produto.valor)}`;

        const quantidade = document.createElement("span");
        quantidade.textContent =
            ` | Quantidade: ${itemCarrinho.quantidade}`;

        const subtotal = document.createElement("span");
        subtotal.textContent =
            ` | Subtotal: ${formatarPreco(itemCarrinho.subtotal())}`;

        const botaoMais = document.createElement("button");
        botaoMais.type = "button";
        botaoMais.textContent = "+";

        botaoMais.addEventListener("click", () => {
            if (itemCarrinho.produto.estoque <= 0) {
                mostrarAviso("Esse produto está esgotado.", "erro");
                return;
            }

            itemCarrinho.quantidade++;
            itemCarrinho.produto.estoque--;

            meuCarrinho.atualizarTotal();
            salvarCarrinho();

            atualizarCarrinhoTela();
            atualizarTelaTotal();
            atualizarTodosEstoques();
        });

        const botaoMenos = document.createElement("button");
        botaoMenos.type = "button";
        botaoMenos.textContent = "-";

        botaoMenos.addEventListener("click", () => {
            if (itemCarrinho.quantidade <= 1) return;

            itemCarrinho.quantidade--;
            itemCarrinho.produto.estoque++;

            meuCarrinho.atualizarTotal();
            salvarCarrinho();

            atualizarCarrinhoTela();
            atualizarTelaTotal();
            atualizarTodosEstoques();
        });

        const botaoExcluir = document.createElement("button");
        botaoExcluir.type = "button";
        botaoExcluir.textContent = "Excluir";

        botaoExcluir.addEventListener("click", () => {
            itemCarrinho.produto.estoque += itemCarrinho.quantidade;

            meuCarrinho.itens = meuCarrinho.itens.filter(
                item => item !== itemCarrinho
            );

            meuCarrinho.atualizarTotal();
            salvarCarrinho();

            atualizarCarrinhoTela();
            atualizarTelaTotal();
            atualizarTodosEstoques();
        });

        li.append(
            nome,
            quantidade,
            subtotal,
            document.createTextNode(" "),
            botaoMais,
            botaoMenos,
            botaoExcluir
        );

        carrinhoLista.appendChild(li);
    });
}

function adicionarAoCarrinho(codigo, quantidadeEscolhida = 1) {
    const produto = produtos.find(item => item.codigo === codigo);

    if (!produto) {
        mostrarAviso("Produto não encontrado no catálogo.", "erro");
        return;
    }

    const quantidade = Number.parseInt(quantidadeEscolhida, 10);

    if (!Number.isInteger(quantidade) || quantidade < 1) {
        mostrarAviso("Escolha uma quantidade válida.", "erro");
        return;
    }

    if (quantidade > produto.estoque) {
        mostrarAviso(
            `Temos apenas ${produto.estoque} unidade(s) em estoque.`,
            "erro"
        );
        return;
    }

    if (meuCarrinho.adicionar(produto, quantidade)) {
        mostrarAviso("Produto adicionado ao carrinho!", "sucesso");

        atualizarTodosEstoques();
        atualizarCarrinhoTela();
        atualizarTelaTotal();
    }
}

function configurarBotoesAdicionar() {
    document.querySelectorAll(".addcarrinho").forEach(botao => {
        if (botao.dataset.eventoConfigurado === "sim") return;

        botao.dataset.eventoConfigurado = "sim";

        botao.addEventListener("click", function () {
            const inputQuantidade = document.getElementById("quantidade");

            const quantidade = inputQuantidade
                ? inputQuantidade.value
                : 1;

            adicionarAoCarrinho(this.value, quantidade);
        });
    });
}

function configurarPaginaDetalhe() {
    const pagina = window.location.pathname
        .split("/")
        .pop()
        .replace(".html", "");

    const codigoPorPagina = {
        mouse: "PROD-001",
        teclado: "PROD-002",
        mousepad: "PROD-003",
        fone: "PROD-004",
        microfone: "PROD-005",
        caixadesom: "PROD-006",
        webcam: "PROD-007",
        cadeira: "PROD-008"
    };

    const codigo = codigoPorPagina[pagina];

    if (!codigo) return;

    const produto = produtos.find(item => item.codigo === codigo);

    if (!produto) return;

    const imagem = document.getElementById("imagem-detalhes-principal");
    const titulo = document.querySelector(".informacoes-produto h1");
    const mensagemEstoque = document.querySelector(".estoque-produto");
    const numeroEstoque = document.querySelector(".quantidade-estoque span");
    const botaoAdicionar = document.querySelector(".addcarrinho");

    if (imagem) {
        imagem.src = produto.imagem;
        imagem.alt = produto.nome;
    }

    if (titulo) {
        titulo.textContent = produto.nome;
    }

    if (mensagemEstoque) {
        mensagemEstoque.id = `mensagem-${produto.codigo}`;
    }

    if (numeroEstoque) {
        numeroEstoque.id = `estoque-${produto.codigo}`;
        numeroEstoque.textContent = produto.estoque;
    }

    if (botaoAdicionar) {
        botaoAdicionar.value = produto.codigo;
    }

    document.title = `${produto.nome} | Eskillows`;

    configurarBotoesAdicionar();
}

let finalizacaoEmAndamento = false;

if (finalizarcomp) {
    finalizarcomp.addEventListener("click", async function () {
        if (finalizacaoEmAndamento) return;

        if (meuCarrinho.itens.length === 0) {
            mostrarAviso(
                "Seu carrinho está vazio. Adicione um produto para continuar.",
                "erro"
            );
            return;
        }

        const token = localStorage.getItem("tokenEskillows");

        if (!token) {
            mostrarAviso(
                "Faça login para finalizar sua compra.",
                "erro"
            );

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);

            return;
        }

        finalizacaoEmAndamento = true;
        finalizarcomp.disabled = true;

        const textoOriginal = finalizarcomp.textContent;
        finalizarcomp.textContent = "Finalizando compra...";

        try {
            const itens = meuCarrinho.itens.map(item => ({
                codigo: item.produto.codigo,
                quantidade: item.quantidade
            }));

            const resposta = await fetch(`${API_URL}/pedidos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ itens })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                if (resposta.status === 401) {
                    localStorage.removeItem("tokenEskillows");
                    localStorage.removeItem("usuarioEskillows");
                }

                throw new Error(
                    dados.erro || "Não foi possível finalizar a compra."
                );
            }

            const pedido = dados.pedido;

            const quantidadeTotal = meuCarrinho.itens.reduce(
                (soma, item) => soma + item.quantidade,
                0
            );

            const produtosComprados = meuCarrinho.itens.map(item => ({
                nome: item.produto.nome,
                quantidade: item.quantidade
            }));

        
            meuCarrinho.limpar();

            atualizarCarrinhoTela();
            atualizarTelaTotal();

            await carregarProdutos();

            const nota = document.createElement("p");
            nota.style.whiteSpace = "pre-line";

            nota.textContent =
                `Compra finalizada com sucesso!\n` +
                `Pedido: #${pedido.id}\n\n` +
                `Produtos:\n` +
                produtosComprados.map(item =>
                    `${item.nome} (x${item.quantidade})`
                ).join("\n") +
                `\n\nTotal de itens: ${quantidadeTotal}\n` +
                `Subtotal: ${formatarPreco(pedido.subtotal)}\n` +
                `Desconto: ${formatarPreco(pedido.desconto)}\n` +
                `Valor final: ${formatarPreco(pedido.valorTotal)}\n` +
                `Status: ${pedido.status}`;

            if (recibo) {
                recibo.innerHTML = "";
                recibo.appendChild(nota);
            }

            mostrarAviso(
                `Pedido #${pedido.id} registrado com sucesso!`,
                "sucesso"
            );

        } catch (erro) {
            console.error("Erro ao finalizar compra:", erro);

            mostrarAviso(
                erro.message || "Erro ao finalizar a compra.",
                "erro"
            );

        } finally {
            finalizacaoEmAndamento = false;
            finalizarcomp.disabled = false;
            finalizarcomp.textContent = textoOriginal;
        }
    });
}

carregarProdutos();
