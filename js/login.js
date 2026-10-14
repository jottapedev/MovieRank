console.log("login.js carregou");


// Alterna entre a tela de login e a de cadastro
function trocar() {
    console.log("trocou");
    const formLogin = document.getElementById("form-login");
    const formCadastro = document.getElementById("form-cadastro");

    formLogin.classList.toggle("d-none");
    formCadastro.classList.toggle("d-none");
}

// Cria a conta
function cadastrar(e) {
    e.preventDefault();

    const email = document.getElementById("cad-email").value.trim();
    const senha = document.getElementById("cad-senha").value;
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    if (usuarios.find((u) => u.email === email)) {
        alert("Esse e-mail já está cadastrado.");
        return;
    }

    usuarios.push({ email, senha });
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    localStorage.setItem("logado", email);
    window.location.href = "index.html";
}

// Entra na conta
function entrar(e) {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const senha = document.getElementById("login-senha").value;
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    const usuario = usuarios.find((u) => u.email === email && u.senha === senha);

    if (!usuario) {
        alert("E-mail ou senha incorretos.");
        return;
    }


    localStorage.setItem("logado", email);
    window.location.href = "index.html";
}