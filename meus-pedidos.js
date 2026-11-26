
(() => {
    "use strict";

    const API_URL = "http://localhost:3000";

    const token = localStorage.getItem("tokenEskillows");

    const mensagem = document.getElementById("pedidos-mensagem");
    const listaPedidos = document.getElementById("lista-pedidos");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    function criarElemento(tag, classe, texto) {
        const elemento = document.createElement(tag);

        if (classe) {
            elemento.className = classe;
        }

        if (texto !== undefined) {
            elemento.textContent = texto;
        }

        return elemento;
    }

    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function formatarData(data) {
        if (!data) return "Data não informada";

        const dataConvertida = new Date(data);

        if (Number.isNaN(dataConvertida.getTime())) {
            return "Data não informada";
        }

        return dataConvertida.toLocaleString("pt-BR");
    }

    function criarResumo(linha, rotulo, valor, classe = "") {
        const div = criarElemento("div", classe);
        div.appendChild(criarElemento("span", "", rotulo));
        div.appendChild(criarElemento("strong", "", valor));

        linha.appendChild(div);

        return div;
    }

    function mostrarPedidos(pedidos) {
        listaPedidos.replaceChildren();
        mensagem.hidden = true;

        if (!Array.isArray(pedidos) || pedidos.length === 0) {
            const vazio = criarElemento("div", "pedidos-vazio");

            vazio.appendChild(
                criarElemento("i", "fa-solid fa-box-open")
            );

            vazio.appendChild(
                criarElemento("h2", "", "Você ainda não tem pedidos.")
            );

            vazio.appendChild(
                criarElemento("p", "", "Quando realizar uma compra, ela aparecerá aqui.")
            );

            const link = criarElemento("a", "botao-pedidos", "Conhecer produtos");
            link.href = "index.html";

            vazio.appendChild(link);
            listaPedidos.appendChild(vazio);

            return;
        }

        pedidos.forEach(pedido => {
            const card = criarElemento("article", "pedido");

            const cabecalho = criarElemento("div", "pedido-cabecalho");

            const identificacao = document.createElement("div");

            identificacao.appendChild(
                criarElemento("div", "pedido-numero", `Pedido #${pedido.id}`)
            );

            identificacao.appendChild(
                criarElemento("div", "pedido-data", formatarData(pedido.data))
            );

            const status = criarElemento(
                "span",
                "pedido-status",
                pedido.status || "Não informado"
            );

            cabecalho.appendChild(identificacao);
            cabecalho.appendChild(status);

            card.appendChild(cabecalho);

            const itens = criarElemento("div", "pedido-itens");

            (pedido.itens || []).forEach(item => {
                const produto = criarElemento("div", "pedido-item");

                const informacao = document.createElement("div");

                informacao.appendChild(
                    criarElemento("strong", "", item.nome || "Produto")
                );

                informacao.appendChild(
                    criarElemento(
                        "small",
                        "",
                        `Quantidade: ${item.quantidade}`
                    )
                );

                const preco = criarElemento(
                    "strong",
                    "",
                    formatarMoeda(item.subtotal)
                );

                produto.appendChild(informacao);
                produto.appendChild(preco);

                itens.appendChild(produto);
            });

            card.appendChild(itens);

            const resumo = criarElemento("div", "pedido-resumo");

            criarResumo(
                resumo,
                "Subtotal",
                formatarMoeda(pedido.subtotal)
            );

            criarResumo(
                resumo,
                "Desconto",
                `- ${formatarMoeda(pedido.desconto)}`,
                "pedido-desconto"
            );

            criarResumo(
                resumo,
                "Valor final",
                formatarMoeda(pedido.valorTotal),
                "pedido-total"
            );

            card.appendChild(resumo);

            listaPedidos.appendChild(card);
        });
    }

    async function carregarPedidos() {
        try {
            const resposta = await fetch(`${API_URL}/meus-pedidos`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const dados = await resposta.json();

            if (resposta.status === 401) {
                localStorage.removeItem("tokenEskillows");
                window.location.href = "login.html";
                return;
            }

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível carregar os pedidos."
                );
            }

            mostrarPedidos(dados.pedidos);

        } catch (erro) {
            console.error("Erro ao carregar histórico:", erro);

            mensagem.hidden = false;
            mensagem.textContent =
                erro.message || "Erro ao carregar seu histórico de compras.";
        }
    }

    carregarPedidos();

})();
