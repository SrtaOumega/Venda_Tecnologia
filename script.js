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

const addcarrinho = document.querySelectorAll(".addcarrinho");
const carrinho = document.getElementById("carrinho");
const total = document.getElementById("total");

// CLASSE PRODUTO

class Produto {
  constructor(codigo, nome, valor, estoque) {
    this.codigo = codigo;
    this.nome = nome;
    this.valor = valor;
    this.estoque = estoque;
  }

  addcarrinho() {
    if (this.estoque > 0) {
      this.estoque--;
      return true;
    }

    return false;
  }

  devolver() {
    this.estoque++;
  }
}


// PRODUTO

const fone = new Produto("cod001", "Fone", 220, 10);
const teclado = new Produto("cod002", "Teclado", 250, 5);
const mouse = new Produto("cod003", "Mouse", 150, 2);
const microfone = new Produto("cod004", "Microfone", 250, 10);
const mousepad = new Produto("cod005", "Mousepad", 1000, 15);
const cadeira = new Produto("cod006", "Cadeira Gamer", 70, 12);

const produtos = [fone, teclado, mouse, microfone, mousepad, cadeira];

// CLASSE ITEMCARRINH

class ItemCarrinho {
  constructor(produto, quantidade) {
    this.produto = produto;
    this.quantidade = quantidade;
  }

  subtotal() {
    return this.produto.valor * this.quantidade;
  }
}

// CLASSE CARRINH

class Carrinho {
  constructor() {
    this.itens = [];
    this.total = 0;
    this.desconto = 0;
    this.valorFinal = 0;
  }

  adicionar(produto) {
    if (produto.addcarrinho()) {
      let item = this.itens.find((item) => item.produto === produto);

      if (item) {
        item.quantidade++;
      } else {
        item = new ItemCarrinho(produto, 1);
        this.itens.push(item);
      }

      this.atualizarTotal();
    }
  }

  atualizarTotal() {
    this.total = 0;

    for (let i = 0; i < this.itens.length; i++) {
      this.total += this.itens[i].subtotal();
    }

    this.calcularDesconto();

    this.valorFinal = this.total - this.desconto;
  }

  calcularDesconto() {
    if (this.total >= 300) {
      this.desconto = this.total * 0.1;
    } else {
      this.desconto = 0;
    }
  }

  limpar() {
    this.itens = [];
    this.total = 0;
    this.desconto = 0;
    this.valorFinal = 0;
  }
}

// CARRINH

const meuCarrinho = new Carrinho();

// ATUALIZAR TOTAL NA TEL

function atualizarTelaTotal() {
  total.textContent =
    `\nSubtotal: R$ ${meuCarrinho.total.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}\n` +
    `\nDesconto: R$ ${meuCarrinho.desconto.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}\n` +
    `\nValor final: R$ ${meuCarrinho.valorFinal.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;
}

// ADICIONAR PRODUT

for (let i = 0; i < addcarrinho.length; i++) {
  addcarrinho[i].addEventListener("click", function () {
    const codigo = this.value;

    for (let j = 0; j < produtos.length; j++) {
      if (produtos[j].codigo === codigo) {
        const produto = produtos[j];

        if (produto.addcarrinho()) {
          let item = meuCarrinho.itens.find((item) => item.produto === produto);

          if (item) {
            item.quantidade++;
          } else {
            item = new ItemCarrinho(produto, 1);
            meuCarrinho.itens.push(item);
          }

          meuCarrinho.atualizarTotal();

          document.getElementById(`estoque-${produto.codigo}`).textContent =
            produto.estoque;

          // ATUALIZAR CARRINHO

          carrinho.innerHTML = "";

          for (let k = 0; k < meuCarrinho.itens.length; k++) {
            let itemCarrinho = meuCarrinho.itens[k];

            let li = document.createElement("li");

            li.textContent =
              `${itemCarrinho.produto.nome} - ` +
              `R$ ${itemCarrinho.produto.valor.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })} `;

            // QUANTIDADE

            let quantidade = document.createElement("span");

            quantidade.textContent = `Quantidade: ${itemCarrinho.quantidade}`;

            li.appendChild(quantidade);

            // SUBTOTAL

            let subtotal = document.createElement("span");

            subtotal.textContent = ` | Subtotal: R$ ${itemCarrinho
              .subtotal()
              .toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`;

            li.appendChild(subtotal);

            // BOTÃO +

            let botaoMais = document.createElement("button");

            botaoMais.textContent = "+";

            botaoMais.addEventListener("click", function () {
              if (itemCarrinho.produto.addcarrinho()) {
                itemCarrinho.quantidade++;

                meuCarrinho.atualizarTotal();

                quantidade.textContent = `Quantidade: ${itemCarrinho.quantidade}`;

                subtotal.textContent = ` | Subtotal: R$ ${itemCarrinho
                  .subtotal()
                  .toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`;

                document.getElementById(
                  `estoque-${itemCarrinho.produto.codigo}`,
                ).textContent = itemCarrinho.produto.estoque;

                atualizarTelaTotal();
              }
            });

            li.appendChild(botaoMais);

            // BOTÃO -

            let botaoMenos = document.createElement("button");

            botaoMenos.textContent = "-";

            botaoMenos.addEventListener("click", function () {
              if (itemCarrinho.quantidade > 1) {
                itemCarrinho.quantidade--;

                itemCarrinho.produto.devolver();

                meuCarrinho.atualizarTotal();

                quantidade.textContent = `Quantidade: ${itemCarrinho.quantidade}`;

                subtotal.textContent = ` | Subtotal: R$ ${itemCarrinho
                  .subtotal()
                  .toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`;

                document.getElementById(
                  `estoque-${itemCarrinho.produto.codigo}`,
                ).textContent = itemCarrinho.produto.estoque;

                atualizarTelaTotal();
              }
            });

            li.appendChild(botaoMenos);

            // BOTÃO EXCLUIR

            let botaoExcluir = document.createElement("button");

            botaoExcluir.textContent = "Excluir";

            botaoExcluir.addEventListener("click", function () {
              for (
                let quantidadeDevolver = 0;
                quantidadeDevolver < itemCarrinho.quantidade;
                quantidadeDevolver++
              ) {
                itemCarrinho.produto.devolver();
              }

              let indice = meuCarrinho.itens.indexOf(itemCarrinho);

              if (indice !== -1) {
                meuCarrinho.itens.splice(indice, 1);
              }

              meuCarrinho.atualizarTotal();

              document.getElementById(
                `estoque-${itemCarrinho.produto.codigo}`,
              ).textContent = itemCarrinho.produto.estoque;

              li.remove();

              atualizarTelaTotal();
            });

            li.appendChild(botaoExcluir);

            // ADICIONAR ITEM AO CARRINHO

            carrinho.appendChild(li);
          }

          atualizarTelaTotal();
        }

        break;
      }
    }
  });
}

// FINALIZAR COMPR

let finalizarcomp = document.getElementById("finalizarcomp");

let recibo = document.getElementById("recibo");

finalizarcomp.addEventListener("click", function () {
  if (meuCarrinho.itens.length === 0) {
    return;
  }

  // QUANTIDADE TOTAL DE ITENS

  let quantidadeTotal = 0;

  for (let i = 0; i < meuCarrinho.itens.length; i++) {
    quantidadeTotal += meuCarrinho.itens[i].quantidade;
  }

  // CRIAR RECIBO

  let nota = document.createElement("p");

  nota.textContent =
    `Compra finalizada com sucesso!\n` +
    `Produtos:\n` +
    meuCarrinho.itens
      .map((item) => `${item.produto.nome} (x${item.quantidade})`)
      .join("\n") +
    `\n\nTotal de itens: ${quantidadeTotal}\n` +
    `Subtotal: R$ ${meuCarrinho.total.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}\n` +
    `Desconto: R$ ${meuCarrinho.desconto.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}\n` +
    `Valor final: R$ ${meuCarrinho.valorFinal.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;

  recibo.appendChild(nota);

  // LIMPAR CARRINHO

  meuCarrinho.limpar();

  carrinho.innerHTML = "";

  total.textContent = "";
});
