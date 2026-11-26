
(() => {
    "use strict";

    const API_URL = "http://localhost:3000";

    const formLogin = document.getElementById("form-login");
    const formCadastro = document.getElementById("form-cadastro");
    const tabLogin = document.getElementById("tab-login");
    const tabCadastro = document.getElementById("tab-cadastro");
    const mensagem = document.getElementById("auth-mensagem");

    if (!formLogin || !formCadastro || !tabLogin || !tabCadastro || !mensagem) {
        return;
    }

    function exibirMensagem(texto = "", tipo = "") {
        mensagem.textContent = texto;
        mensagem.className = tipo
            ? `auth-mensagem ${tipo}`
            : "auth-mensagem";
    }

    function limparErros(formulario) {
        formulario.querySelectorAll(".auth-campo").forEach(campo => {
            campo.classList.remove("invalido");

            const erro = campo.querySelector(".auth-erro");
            const input = campo.querySelector("input");

            if (erro) erro.textContent = "";
            if (input) input.removeAttribute("aria-invalid");
        });
    }

    function marcarErro(input, texto) {
        const campo = input.closest(".auth-campo");
        if (!campo) return;

        campo.classList.add("invalido");

        const erro = campo.querySelector(".auth-erro");
        if (erro) erro.textContent = texto;

        input.setAttribute("aria-invalid", "true");
    }

    function alternarAba(aba) {
        const mostrarCadastro = aba === "cadastro";

        formLogin.hidden = mostrarCadastro;
        formCadastro.hidden = !mostrarCadastro;

        tabLogin.classList.toggle("ativa", !mostrarCadastro);
        tabCadastro.classList.toggle("ativa", mostrarCadastro);

        tabLogin.setAttribute("aria-selected", String(!mostrarCadastro));
        tabCadastro.setAttribute("aria-selected", String(mostrarCadastro));

        limparErros(formLogin);
        limparErros(formCadastro);
        exibirMensagem("");

        const primeiroCampo = (mostrarCadastro ? formCadastro : formLogin)
            .querySelector("input");

        if (primeiroCampo) primeiroCampo.focus();
    }

    function validar(formulario) {
        limparErros(formulario);
        let valido = true;

        formulario.querySelectorAll("input[required]").forEach(input => {
            const valor = input.value.trim();
            let erro = "";

            if (!valor) {
                erro = "Este campo é obrigatório.";
            } else if (
                input.type === "email" &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
            ) {
                erro = "Informe um e-mail válido.";
            } else if (
                input.type === "password" &&
                input.minLength > 0 &&
                input.value.length < input.minLength
            ) {
                erro = "A senha deve ter pelo menos 8 caracteres.";
            } else if (
                input.id === "cadastro-nome" &&
                valor.length < 3
            ) {
                erro = "Informe um nome com pelo menos 3 caracteres.";
            }

            if (erro) {
                marcarErro(input, erro);
                valido = false;
            }
        });

        if (formulario === formCadastro) {
            const senha = document.getElementById("cadastro-senha");
            const confirmar = document.getElementById("cadastro-confirmar");

            if (
                senha.value &&
                confirmar.value &&
                senha.value !== confirmar.value
            ) {
                marcarErro(confirmar, "As senhas não são iguais.");
                valido = false;
            }
        }

        return valido;
    }

    async function enviarDados(endpoint, dados) {
        const resposta = await fetch(`${API_URL}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível concluir a operação."
            );
        }

        return resultado;
    }

   
    tabLogin.addEventListener("click", () => alternarAba("login"));
    tabCadastro.addEventListener("click", () => alternarAba("cadastro"));

    document.querySelectorAll("[data-abrir]").forEach(botao => {
        botao.addEventListener("click", () => {
            alternarAba(botao.dataset.abrir);
        });
    });


    document.querySelectorAll("[data-toggle-senha]").forEach(botao => {
        botao.addEventListener("click", () => {
            const input = document.getElementById(botao.dataset.toggleSenha);
            if (!input) return;

            const mostrar = input.type === "password";
            input.type = mostrar ? "text" : "password";

            botao.setAttribute(
                "aria-label",
                mostrar ? "Ocultar senha" : "Mostrar senha"
            );

            botao.innerHTML = mostrar
                ? '<i class="fa-regular fa-eye-slash" aria-hidden="true"></i>'
                : '<i class="fa-regular fa-eye" aria-hidden="true"></i>';
        });
    });

  
    document.querySelectorAll(".auth-form input").forEach(input => {
        input.addEventListener("input", () => {
            const campo = input.closest(".auth-campo");

            if (campo) {
                campo.classList.remove("invalido");

                const erro = campo.querySelector(".auth-erro");
                if (erro) erro.textContent = "";
            }

            input.removeAttribute("aria-invalid");
            exibirMensagem("");
        });
    });


    formCadastro.addEventListener("submit", async evento => {
        evento.preventDefault();

        if (!validar(formCadastro)) {
            exibirMensagem("Confira os campos destacados.", "erro");
            return;
        }

        const botao = formCadastro.querySelector('[type="submit"]');
        botao.disabled = true;

        exibirMensagem("Criando sua conta...", "info");

        try {
            const nome = document.getElementById("cadastro-nome").value.trim();
            const email = document.getElementById("cadastro-email").value.trim();
            const senha = document.getElementById("cadastro-senha").value;

            await enviarDados("cadastro", {
                nome,
                email,
                senha
            });

            exibirMensagem(
                "Conta criada com sucesso! Agora você pode entrar.",
                "sucesso"
            );

            formCadastro.reset();
            alternarAba("login");

            document.getElementById("login-email").value = email;

        } catch (erro) {
            exibirMensagem(erro.message, "erro");

        } finally {
            botao.disabled = false;
        }
    });


    formLogin.addEventListener("submit", async evento => {
        evento.preventDefault();

        if (!validar(formLogin)) {
            exibirMensagem("Confira os campos destacados.", "erro");
            return;
        }

        const botao = formLogin.querySelector('[type="submit"]');
        botao.disabled = true;

        exibirMensagem("Entrando na sua conta...", "info");

        try {
            const email = document.getElementById("login-email").value.trim();
            const senha = document.getElementById("login-senha").value;

            const resultado = await enviarDados("login", {
                email,
                senha
            });

            if (!resultado.token || !resultado.usuario) {
                throw new Error(
                    "O servidor não retornou os dados completos da conta."
                );
            }

            
            localStorage.setItem("tokenEskillows", resultado.token);

            localStorage.setItem(
                "usuarioEskillows",
                JSON.stringify(resultado.usuario)
            );

            exibirMensagem("Login realizado com sucesso!", "sucesso");

         
            setTimeout(() => {
                window.location.href = "minha-conta.html";
            }, 1000);

        } catch (erro) {
            exibirMensagem(erro.message, "erro");

        } finally {
            botao.disabled = false;
        }
    });

})();
