const API_URL = "http://localhost:3000/admin";

const token = localStorage.getItem("tokenEskillows");

let produtos = [];

const formProduto = document.getElementById("formProduto");
const formEstoque = document.getElementById("formEstoque");


function exibirPainel(permitido) {

    document.querySelectorAll(".painel section").forEach(secao => {

        secao.style.display = permitido ? "" : "none";

    });

}


exibirPainel(false);


function mostrarMensagem(texto, tipo) {

    const mensagem = document.getElementById("mensagem");

    mensagem.textContent = texto;
    mensagem.className = tipo;

    mensagem.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


async function requisicao(rota, metodo = "GET", dados = null) {

    const resposta = await fetch(API_URL + rota, {

        method: metodo,

        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },

        body: dados ? JSON.stringify(dados) : undefined

    });

    const resultado = await resposta.json();

    if (!resposta.ok) {

        if (resposta.status === 401) {

            exibirPainel(false);

            localStorage.removeItem("tokenEskillows");

            window.location.href = "login.html";

        }

        if (resposta.status === 403) {

            exibirPainel(false);

        }

        throw new Error(resultado.erro || "Erro na operação.");

    }

    return resultado;

}


async function carregarIndicadores() {

    const dados = await requisicao("/indicadores");

    document.getElementById("totalProdutos").textContent =
        dados.totalProdutos;

    document.getElementById("totalPedidos").textContent =
        dados.totalPedidos;

    document.getElementById("estoqueBaixo").textContent =
        dados.estoqueBaixo;

}


async function carregarCategorias() {

    const categorias = await requisicao("/categorias");

    const select = document.getElementById("categoria");

    select.replaceChildren(
        new Option("Selecione uma categoria", "")
    );

    categorias.forEach(categoria => {

        select.add(
            new Option(categoria.nome, categoria.id)
        );

    });

}


function adicionarCelula(linha, valor) {

    const celula = linha.insertCell();

    celula.textContent = valor ?? "";

    return celula;

}


async function carregarProdutos() {

    produtos = await requisicao("/produtos");

    const tabela = document.getElementById("listaProdutos");

    const select = document.getElementById("produtoEstoque");

    tabela.replaceChildren();

    select.replaceChildren(
        new Option("Selecione um produto", "")
    );

    produtos.forEach(produto => {

        const linha = tabela.insertRow();

        adicionarCelula(linha, produto.id);
        adicionarCelula(linha, produto.codigo);
        adicionarCelula(linha, produto.nome);

        adicionarCelula(
            linha,
            Number(produto.preco).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            })
        );

        const estoque = adicionarCelula(
            linha,
            produto.estoque
        );

        adicionarCelula(linha, produto.estoque_minimo);


        if (
            Number(produto.estoque) <=
            Number(produto.estoque_minimo)
        ) {

            estoque.style.color = "#dc2626";
            estoque.style.fontWeight = "bold";

        }

        const acoes = linha.insertCell();

        const botao = document.createElement("button");

        botao.textContent = "Editar";

        botao.addEventListener("click", () => {

            editarProduto(produto.id);

        });

        acoes.appendChild(botao);

        select.add(
            new Option(
                produto.nome + " - Estoque: " + produto.estoque,
                produto.id
            )
        );

    });

}


function editarProduto(id) {

    const produto = produtos.find(item => item.id === id);

    if (!produto) {
        return;
    }

    document.getElementById("produtoId").value = produto.id;

    document.getElementById("codigo").value = produto.codigo;

    document.getElementById("nome").value = produto.nome;

    document.getElementById("descricao").value =
        produto.descricao || "";

    document.getElementById("categoria").value =
        produto.categoria_id;

    document.getElementById("preco").value = produto.preco;

    document.getElementById("estoqueMinimo").value =
        produto.estoque_minimo;

    document.getElementById("imagem").value = produto.imagem;

    document.getElementById("btnSalvar").textContent =
        "Atualizar produto";

    formProduto.scrollIntoView({
        behavior: "smooth"
    });

}


formProduto.addEventListener("reset", () => {

    document.getElementById("produtoId").value = "";

    document.getElementById("btnSalvar").textContent =
        "Salvar produto";

});


formProduto.addEventListener("submit", async evento => {

    evento.preventDefault();

    const id = document.getElementById("produtoId").value;

    const dados = {

        codigo: document.getElementById("codigo").value.trim(),

        nome: document.getElementById("nome").value.trim(),

        descricao: document.getElementById("descricao").value.trim(),

        categoria_id: Number(
            document.getElementById("categoria").value
        ),

        preco: Number(
            document.getElementById("preco").value
        ),

        estoque_minimo: Number(
            document.getElementById("estoqueMinimo").value
        ),

        imagem: document.getElementById("imagem").value.trim()

    };

    const botao = document.getElementById("btnSalvar");

    botao.disabled = true;

    try {

        let resultado;

        if (id) {

            resultado = await requisicao(
                `/produtos/${id}`,
                "PUT",
                dados
            );

        } else {

            resultado = await requisicao(
                "/produtos",
                "POST",
                dados
            );

        }

        formProduto.reset();

        mostrarMensagem(resultado.mensagem, "sucesso");

        await atualizarPainel();

    } catch (erro) {

        mostrarMensagem(erro.message, "erro");

    } finally {

        botao.disabled = false;

    }

});


function atualizarCampoQuantidade() {

    const tipo = document.getElementById("tipo").value;

    const quantidade = document.getElementById("quantidade");

    const label = document.getElementById("labelQuantidade");

    if (tipo === "ajuste") {

        quantidade.min = 0;
        label.textContent = "Nova quantidade total";

    } else {

        quantidade.min = 1;
        label.textContent = "Quantidade";

    }

}

document.getElementById("tipo").addEventListener(
    "change",
    atualizarCampoQuantidade
);


formEstoque.addEventListener("submit", async evento => {

    evento.preventDefault();

    const dados = {

        produto_id: Number(
            document.getElementById("produtoEstoque").value
        ),

        tipo: document.getElementById("tipo").value,

        quantidade: Number(
            document.getElementById("quantidade").value
        ),

        motivo: document.getElementById("motivo").value.trim()

    };


    if (
        !Number.isInteger(dados.quantidade) ||
        dados.quantidade < 0 ||
        (dados.tipo !== "ajuste" && dados.quantidade === 0)
    ) {

        mostrarMensagem("Informe uma quantidade válida.", "erro");

        return;

    }

    const produto = produtos.find(
        item => item.id === dados.produto_id
    );


    if (
        dados.tipo === "saida" &&
        produto &&
        dados.quantidade > Number(produto.estoque)
    ) {

        mostrarMensagem("Estoque insuficiente.", "erro");

        return;

    }

    const botao = formEstoque.querySelector(
        'button[type="submit"]'
    );

    botao.disabled = true;

    try {

        const resultado = await requisicao(
            "/estoque",
            "POST",
            dados
        );

        formEstoque.reset();

        atualizarCampoQuantidade();

        mostrarMensagem(resultado.mensagem, "sucesso");

        await atualizarPainel();

    } catch (erro) {

        mostrarMensagem(erro.message, "erro");

    } finally {

        botao.disabled = false;

    }

});


async function carregarHistorico() {

    const historico = await requisicao("/estoque/historico");

    const tabela = document.getElementById("historicoEstoque");

    tabela.replaceChildren();

    historico.forEach(movimentacao => {

        const linha = tabela.insertRow();

        adicionarCelula(
            linha,
            new Date(
                movimentacao.data_movimentacao
            ).toLocaleString("pt-BR")
        );

        adicionarCelula(linha, movimentacao.produto_nome);

        const tipos = {
            entrada: "Entrada",
            saida: "Saída",
            ajuste: "Ajuste"
        };

        adicionarCelula(linha, tipos[movimentacao.tipo]);

        adicionarCelula(linha, movimentacao.quantidade);

        adicionarCelula(linha, movimentacao.saldo_resultante);

        adicionarCelula(linha, movimentacao.motivo);

    });

}


async function atualizarPainel() {

    await Promise.all([

        carregarIndicadores(),

        carregarProdutos(),

        carregarHistorico()

    ]);

}


async function iniciarPainel() {

    if (!token) {

        window.location.href = "login.html";

        return;

    }

    try {

        await carregarCategorias();

        await atualizarPainel();

        atualizarCampoQuantidade();


        exibirPainel(true);

    } catch (erro) {

        exibirPainel(false);

        mostrarMensagem(erro.message, "erro");

    }

}

iniciarPainel();