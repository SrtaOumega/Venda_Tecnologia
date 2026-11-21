// Eskillows — validação da interface de autenticação.
// A autenticação real será conectada aos endpoints definidos pela equipe do backend.

(() => {
    "use strict";

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
        mensagem.className = tipo ? `auth-mensagem ${tipo}` : "auth-mensagem";
    }

    function limparErros(formulario) {
        formulario.querySelectorAll(".auth-campo").forEach((campo) => {
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

        formulario.querySelectorAll("input[required]").forEach((input) => {
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

            if (senha.value && confirmar.value && senha.value !== confirmar.value) {
                marcarErro(confirmar, "As senhas não são iguais.");
                valido = false;
            }
        }

        return valido;
    }

    tabLogin.addEventListener("click", () => alternarAba("login"));
    tabCadastro.addEventListener("click", () => alternarAba("cadastro"));

    document.querySelectorAll("[data-abrir]").forEach((botao) => {
        botao.addEventListener("click", () => alternarAba(botao.dataset.abrir));
    });

    document.querySelectorAll("[data-toggle-senha]").forEach((botao) => {
        botao.addEventListener("click", () => {
            const input = document.getElementById(botao.dataset.toggleSenha);
            if (!input) return;

            const mostrar = input.type === "password";
            input.type = mostrar ? "text" : "password";
            botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
            botao.innerHTML = mostrar
                ? '<i class="fa-regular fa-eye-slash" aria-hidden="true"></i>'
                : '<i class="fa-regular fa-eye" aria-hidden="true"></i>';
        });
    });

    document.querySelectorAll(".auth-form input").forEach((input) => {
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

    formLogin.addEventListener("submit", (evento) => {
        evento.preventDefault();

        if (!validar(formLogin)) {
            exibirMensagem("Confira os campos destacados antes de continuar.", "erro");
            return;
        }

        // Não simula login nem armazena senha. A equipe deve ligar este ponto à API.
        exibirMensagem(
            "Dados preenchidos corretamente. A autenticação será ativada quando a API estiver disponível.",
            "info"
        );
    });

    formCadastro.addEventListener("submit", (evento) => {
        evento.preventDefault();

        if (!validar(formCadastro)) {
            exibirMensagem("Confira os campos destacados antes de continuar.", "erro");
            return;
        }

        // Não cria conta localmente. O cadastro real será enviado ao backend.
        exibirMensagem(
            "Formulário validado! O cadastro será concluído quando a API estiver integrada.",
            "sucesso"
        );
    });
})();
