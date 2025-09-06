// renderer.js (Versão Final Corrigida)

const produtosDiv = document.getElementById('produtos');
const listaPedidoUl = document.getElementById('lista-pedido');
const valorTotalSpan = document.getElementById('valor-total');
const manageProductsBtn = document.getElementById('manage-products-btn');
const categoryButtonsContainer = document.getElementById('category-buttons-container');

let pedidoAtual = [];
let todosOsProdutos = [];

// Categorias padrão que sempre devem aparecer
const categoriasPadrao = ["Lanches", "Bebidas", "Combos", "Outros"];

/**
 * Função principal que carrega os dados e inicia a tela
 */
async function carregarDadosIniciais() {
    // Busca os produtos e categorias do banco de dados
    todosOsProdutos = await window.api.getProducts();
    const categoriasDoBanco = await window.api.getCategories();

    // Junta as categorias padrão com as do banco de dados, sem duplicados
    const todasAsCategorias = new Set([...categoriasPadrao, ...categoriasDoBanco]);

    renderizarBotoesDeCategoria(todasAsCategorias);
    filtrarProdutosPorCategoria('Todos'); // Mostra todos por padrão
}

/**
 * Cria os botões de categoria na barra lateral
 */
function renderizarBotoesDeCategoria(categorias) {
    categoryButtonsContainer.innerHTML = '';

    const btnTodos = document.createElement('button');
    btnTodos.className = 'categoria-btn';
    btnTodos.innerText = 'Todos';
    btnTodos.onclick = () => filtrarProdutosPorCategoria('Todos');
    categoryButtonsContainer.appendChild(btnTodos);

    // Converte o Set para Array e ordena para manter a ordem
    const categoriasOrdenadas = Array.from(categorias).sort();

    categoriasOrdenadas.forEach(categoria => {
        const btn = document.createElement('button');
        btn.className = 'categoria-btn';
        btn.innerText = categoria;
        btn.onclick = () => filtrarProdutosPorCategoria(categoria);
        categoryButtonsContainer.appendChild(btn);
    });
}

/**
 * Filtra e exibe os produtos na área principal
 */
function filtrarProdutosPorCategoria(categoria) {
    produtosDiv.innerHTML = '';
    const produtosFiltrados = (categoria === 'Todos')
        ? todosOsProdutos
        : todosOsProdutos.filter(p => p.category === categoria);

    produtosFiltrados.forEach(produto => {
        const btn = document.createElement('button');
        btn.className = 'produto-btn';
        btn.innerHTML = `${produto.name}<br>R$ ${produto.price.toFixed(2)}`;
        btn.onclick = () => adicionarAoPedido(produto);
        produtosDiv.appendChild(btn);
    });
}

/**
 * Adiciona um item ao pedido atual
 */
function adicionarAoPedido(produto) {
    // Futuramente, verificar se há estoque (produto.stock > 0)
    pedidoAtual.push(produto);
    renderizarPedido();
}

/**
 * Atualiza a lista de itens e o total do pedido
 */
function renderizarPedido() {
    listaPedidoUl.innerHTML = '';
    let total = 0;
    pedidoAtual.forEach(item => {
        const li = document.createElement('li');
        li.innerText = `${item.name} - R$ ${item.price.toFixed(2)}`;
        listaPedidoUl.appendChild(li);
        total += item.price;
    });
    valorTotalSpan.innerText = `R$ ${total.toFixed(2)}`;
}

/**
 * Abre a janela de gestão de produtos
 */
manageProductsBtn.addEventListener('click', () => {
    window.api.openProductsWindow();
});

// Inicia a aplicação
carregarDadosIniciais();