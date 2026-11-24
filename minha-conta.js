
(() => {
    "use strict";

    const API_URL = "http://localhost:3000";

    const mensagem = document.getElementById("conta-mensagem");
    const nomeElemento = document.getElementById("usuario-nome");
    const emailElemento = document.getElementById("usuario-email");
    const perfilElemento = document.getElementById("usuario-perfil");
    const botaoSair = document.getElementById("botao-sair");

    const token = localStorage.getItem("tokenEskillows");

    function exibirMensagem(texto) {
        mensagem.textContent = texto;
    }

    function mostrarUsuario(usuario) {
        nomeElemento.textContent = usuario.nome || "Não informado";
        emailElemento.textContent = usuario.email || "Não informado";
        perfilElemento.textContent = usuario.perfil || "Cliente";
    }

    function sairDaConta() {
        localStorage.removeItem("tokenEskillows");
        localStorage.removeItem("usuarioEskillows");

        window.location.href = "login.html";
    }

    if (botaoSair) {
        botaoSair.addEventListener("click", sairDaConta);
    }

    async function carregarPerfil() {
        if (!token) {
            exibirMensagem("Você precisa entrar na sua conta.");

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);

            return;
        }

        // Mostra os dados salvos enquanto consulta o servidor.
        try {
            const usuarioSalvo = JSON.parse(
                localStorage.getItem("usuarioEskillows") || "null"
            );

            if (usuarioSalvo) {
                mostrarUsuario(usuarioSalvo);
            }
        } catch (erro) {
            console.error("Erro ao ler usuário salvo:", erro);
        }

        exibirMensagem("Confirmando suas informações...");

        try {
            const resposta = await fetch(`${API_URL}/perfil`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const resultado = await resposta.json();

            if (resposta.status === 401) {
                sairDaConta();
                return;
            }

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro || "Não foi possível consultar sua conta."
                );
            }

            if (!resultado.usuario) {
                throw new Error("O servidor não retornou os dados do usuário.");
            }

            mostrarUsuario(resultado.usuario);

            localStorage.setItem(
                "usuarioEskillows",
                JSON.stringify(resultado.usuario)
            );

            exibirMensagem(
                `Olá, ${resultado.usuario.nome}! Seus dados foram carregados com sucesso.`
            );

        } catch (erro) {
            console.error("Erro ao carregar perfil:", erro);

            exibirMensagem(
                "Não foi possível atualizar seus dados. Verifique se o servidor está funcionando."
            );
        }
    }

    carregarPerfil();
})();
