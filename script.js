//BARRA DE PESQUISA
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', (event) => {
    const value = formatString(event.target.value);
    //FUNCAO PRA ENCONTRAR OS ITENS
    const items = document.querySelectorAll('.items .item');
    items.forEach(item => {
        if (formatString(item.textContent).indexOf(value) !== -1) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
        })
});

//FUNÇAO PARA TIRAR ESPAÇOS E LETRAS MINUSCULAS E MAIUSCULAS INDESEJADAS
function formatString(value) {
    return value
        .toLowerCase()
        .trim();

}

