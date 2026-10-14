const API_KEY = "f83e1633";
const API_URL = "https://www.omdbapi.com/";
const BUSCA_PADRAO = "star wars";

const lista = document.getElementById("lista");
const campoBusca = document.getElementById("busca");
const contagem = document.getElementById("contagem");

// Evita que aspas ou < > de um título quebrem o HTML
function esc(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML.replace(/"/g, "&quot;");
}

// Converte o filtro da tela para o formato da OMDb
function tipoSelecionado() {
    const marcado = document.querySelector('input[name="tipo"]:checked').value;
    if (marcado === "Filme") return "movie";
    if (marcado === "Série") return "series";
    return "";
}

// Busca na OMDb pelo título
async function buscarFilmes(termo, tipo) {
    let url = `${API_URL}?apikey=${API_KEY}&s=${encodeURIComponent(termo)}`;
    if (tipo) {
        url += `&type=${tipo}`;
    }
    const resposta = await fetch(url);
    return await resposta.json();
}

// Desenha os cards na tela
async function mostrarFilmes() {
    const termo = campoBusca.value.trim() || BUSCA_PADRAO;
    lista.innerHTML = '<p class="text-body-secondary">Carregando...</p>';
    contagem.textContent = "";

    try {
        const dados = await buscarFilmes(termo, tipoSelecionado());

        if (dados.Response === "False") {
            const msg = dados.Error === "Movie not found!" ? "Nenhum título encontrado." : dados.Error;
            lista.innerHTML = `<p class="text-body-secondary">${esc(msg)}</p>`;
            return;
        }

        let html = "";
        dados.Search.forEach((f) => {
            const poster = f.Poster !== "N/A"
                ? f.Poster
                : "https://placehold.co/300x450/222/eee?text=" + encodeURIComponent(f.Title);

            html += `
            <div class="col">
                <div class="card bg-dark border-0 card-filme" data-id="${f.imdbID}">
                    <img src="${poster}" class="card-img-top rounded shadow-sm" alt="${esc(f.Title)}">
                    <div class="card-body px-0">
                        <h3 class="card-title fs-6">${esc(f.Title)}</h3>
                        <p class="text-body-secondary small mb-0">${esc(f.Year)}</p>
                    </div>
                </div>
            </div>`;
        });

        lista.innerHTML = html;
        contagem.textContent = `(${dados.totalResults})`;

    } catch (erro) {
        lista.innerHTML = '<p class="text-danger">Erro ao buscar. Veja sua internet.</p>';
    }
}

// Buscar ao apertar Enter no campo
campoBusca.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        mostrarFilmes();
    }
});

// Buscar de novo ao trocar Todos / Filmes / Séries
document.querySelectorAll('input[name="tipo"]').forEach((radio) => {
    radio.addEventListener("change", mostrarFilmes);
});

mostrarFilmes();

// ---------- Armazenamento das avaliações ----------
// Formato: { "tt0076759": [ { email, nota, texto, data }, ... ] }
function lerAvaliacoes() {
    return JSON.parse(localStorage.getItem("avaliacoes")) || {};
}

function salvarAvaliacoes(todas) {
    localStorage.setItem("avaliacoes", JSON.stringify(todas));
}

// ---------- Aviso  ----------
function avisar(texto) {
    document.getElementById("avisoTxt").textContent = texto;
    new bootstrap.Toast(document.getElementById("aviso"), { delay: 3000 }).show();
}

// ---------- Modal do título ----------
const modalTitulo = new bootstrap.Modal(document.getElementById("mTitulo"));
let filmeAtual = null;
let notaEscolhida = 0;

async function buscarDetalhes(id) {
    const resposta = await fetch(`${API_URL}?apikey=${API_KEY}&i=${id}&plot=short`);
    return await resposta.json();
}

async function abrirTitulo(id) {
    try {
        const dados = await buscarDetalhes(id);
        if (dados.Response === "False") {
            avisar("Não foi possível carregar o título.");
            return;
        }

        filmeAtual = dados;

        const poster = dados.Poster !== "N/A"
            ? dados.Poster
            : "https://placehold.co/300x450/222/eee?text=" + encodeURIComponent(dados.Title);

        document.getElementById("mNome").textContent = dados.Title;
        document.getElementById("mPoster").innerHTML = `<img src="${poster}" class="img-fluid w-100" alt="${esc(dados.Title)}">`;
        document.getElementById("mSinopse").textContent = dados.Plot !== "N/A" ? dados.Plot : "Sem sinopse.";
        document.getElementById("mImdb").textContent = dados.imdbRating !== "N/A" ? dados.imdbRating : "–";

        // Selos: ano, gêneros e duração
        const selos = [dados.Year, ...dados.Genre.split(", "), dados.Runtime].filter((s) => s && s !== "N/A");
        document.getElementById("mMeta").innerHTML = selos
            .map((s) => `<span class="badge text-bg-secondary">${esc(s)}</span>`)
            .join("");

        // Se a pessoa já avaliou, começa com a nota dela
        const minha = (lerAvaliacoes()[dados.imdbID] || []).find((a) => a.email === usuario);
        notaEscolhida = minha ? minha.nota : 0;

        mostrarAvaliacoes();
        modalTitulo.show();

    } catch (erro) {
        avisar("Erro ao carregar. Veja sua internet.");
    }
}

// ---------- Estrelas ----------
function desenharEstrelas() {
    let html = "";
    for (let i = 1; i <= 5; i++) {
        const tipo = i <= notaEscolhida ? "bi-star-fill" : "bi-star";
        html += `<i class="bi ${tipo} text-warning fs-3" data-nota="${i}" role="button"></i> `;
    }
    document.getElementById("estrelas").innerHTML = html;
}

// ---------- Nota média, distribuição, formulário e lista ----------
function mostrarAvaliacoes() {
    const todas = lerAvaliacoes()[filmeAtual.imdbID] || [];
    const minha = todas.find((a) => a.email === usuario);

    // Média
    const soma = todas.reduce((total, a) => total + a.nota, 0);
    document.getElementById("mUsers").textContent = todas.length ? (soma / todas.length).toFixed(1) : "–";

    // Distribuição (quantas avaliações de 5 a 1)
    let dist = "";
    for (let n = 5; n >= 1; n--) {
        const qtd = todas.filter((a) => a.nota === n).length;
        const pct = todas.length ? (qtd / todas.length) * 100 : 0;
        dist += `
        <div class="d-flex align-items-center gap-2 small">
            <span>${n}</span>
            <div class="progress flex-grow-1" style="height: 6px;">
                <div class="progress-bar" style="width: ${pct}%"></div>
            </div>
            <span>${qtd}</span>
        </div>`;
    }
    document.getElementById("mDist").innerHTML = dist;

    // Formulário para avaliar
    document.getElementById("blocoAvaliar").innerHTML = `
        <h3 class="fs-6 mb-2">Sua avaliação</h3>
        <div id="estrelas" class="mb-2"></div>
        <textarea id="textoAv" class="form-control mb-2" rows="3" placeholder="Escreva uma review (opcional)">${esc(minha ? minha.texto : "")}</textarea>
        <button id="bSalvarAv" class="btn btn-primary btn-sm">Salvar avaliação</button>`;
    desenharEstrelas();

    // Lista de avaliações
    document.getElementById("avaliacoes").innerHTML = todas.length
        ? todas.map((a) => `
            <div class="border-bottom border-secondary py-2">
                <div class="d-flex justify-content-between">
                    <strong class="small">${esc(a.email.split("@")[0])}</strong>
                    <span class="text-warning">${"★".repeat(a.nota)}${"☆".repeat(5 - a.nota)}</span>
                </div>
                ${a.texto ? `<p class="mb-0 small text-body-secondary">${esc(a.texto)}</p>` : ""}
            </div>`).join("")
        : '<p class="small text-body-secondary">Ainda não há avaliações.</p>';
}

// ----------------------------  Salvar avaliação ---------------------------------------------------------------------------

function salvarAvaliacao() {
    if (notaEscolhida === 0) {
        avisar("Escolha de 1 a 5 estrelas.");
        return;
    }

    const todas = lerAvaliacoes();
    const id = filmeAtual.imdbID;
    const lista = todas[id] || [];

    const nova = {
        email: usuario,
        nota: notaEscolhida,
        texto: document.getElementById("textoAv").value.trim(),
        data: new Date().toLocaleDateString("pt-BR")
    };

    const pos = lista.findIndex((a) => a.email === usuario);
    if (pos >= 0) {
        lista[pos] = nova;   // já tinha avaliado: atualiza
    } else {
        lista.push(nova);
    }

    todas[id] = lista;
    salvarAvaliacoes(todas);
    mostrarAvaliacoes();
    avisar("Avaliação salva!");
}


// Clicar no card e abrir o modal
lista.addEventListener("click", (e) => {
    const card = e.target.closest("[data-id]");
    if (card) {
        abrirTitulo(card.dataset.id);
    }
});

// Clicar na estrela ou no botão de salvar avaliação
document.getElementById("blocoAvaliar").addEventListener("click", (e) => {
    const estrela = e.target.closest("[data-nota]");
    if (estrela) {
        notaEscolhida = Number(estrela.dataset.nota);
        desenharEstrelas();
        return;
    }
    if (e.target.id === "bSalvarAv") {
        salvarAvaliacao();
    }
});