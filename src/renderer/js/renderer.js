// --- Seletores de Elementos do DOM ---
const produtosDiv = document.getElementById('produtos');
const listaPedidoUl = document.getElementById('lista-pedido');
const valorTotalSpan = document.getElementById('valor-total');
const manageProductsBtn = document.getElementById('manage-products-btn');
// Adicionamos o seletor para o container dos botões de categoria
const categoryButtonsContainer = document.getElementById('category-buttons-container');
const finalizarVendaBtn = document.querySelector('.btn-finalizar');
const paymentModal = document.getElementById('payment-modal');
const modalTotal = document.getElementById('modal-total');
const paymentOptions = document.querySelectorAll('.payment-btn');
const selectedPaymentDisplay = document.getElementById('selected-payment');
const cancelSaleBtn = document.getElementById('cancel-sale-btn');
const confirmSaleBtn = document.getElementById('confirm-sale-btn');

// --- Variáveis de Estado da Aplicação ---
let pedidoAtual = [];
let todosOsProdutos = [];
let selectedPaymentMethod = null;


// --- Funções ---

/**
 * Carrega os produtos do banco de dados e configura os eventos iniciais.
 */
async function carregarDadosIniciais() {
    try {
        todosOsProdutos = await window.api.getProducts();
        // A chamada para renderizar o dropdown foi REMOVIDA
        filtrarProdutosPorCategoria('Todos');
    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
    }
}


/**
 * Filtra os produtos com base na categoria clicada.
 */
function filtrarProdutosPorCategoria(categoria) {
    produtosDiv.innerHTML = '';
    const produtosFiltrados = (categoria.toLowerCase() === 'todos')
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
 * Adiciona um produto ao pedido atual e atualiza a exibição.
 */
function adicionarAoPedido(produto) {
    pedidoAtual.push(produto);
    renderizarPedido();
}

/**
 * Atualiza a lista de itens e o valor total na barra lateral do pedido.
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
    const totalFormatado = `R$ ${total.toFixed(2)}`;
    valorTotalSpan.innerText = totalFormatado;
    modalTotal.innerText = totalFormatado;
}

/**
 * Reseta o modal de pagamento para o estado inicial.
 */
function resetPaymentModal() {
    selectedPaymentMethod = null;
    selectedPaymentDisplay.innerText = '-';
    paymentOptions.forEach(btn => btn.classList.remove('selected'));
    confirmSaleBtn.disabled = true;
}


// Evento para o botão "Gerir Produtos"
manageProductsBtn.addEventListener('click', () => {
    window.api.openProductsWindow();
});

// Adiciona eventos de clique para os novos botões de categoria

// 1. Seleciona todos os botões de categoria dentro do container
const botoesDeCategoria = categoryButtonsContainer.querySelectorAll('.categoria-btn');

// 2. Adiciona um "ouvinte" de clique para cada um deles
botoesDeCategoria.forEach(botao => {
    botao.addEventListener('click', () => {
        // 3. Pega o texto do botão clicado (ex: "Lanches")
        const categoriaClicada = botao.innerText;
        
        // 4. Chama a função de filtro com a categoria
        filtrarProdutosPorCategoria(categoriaClicada);
    });
});


// Evento para abrir o modal de pagamento
finalizarVendaBtn.addEventListener('click', () => {
    if (pedidoAtual.length === 0) {
        alert('Adicione itens ao pedido antes de finalizar!');
        return;
    }
    paymentModal.classList.remove('hidden');
});

// Evento para fechar o modal
cancelSaleBtn.addEventListener('click', () => {
    paymentModal.classList.add('hidden');
    resetPaymentModal();
});

// Eventos para selecionar o método de pagamento
paymentOptions.forEach(button => {
    button.addEventListener('click', () => {
        paymentOptions.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedPaymentMethod = button.dataset.method;
        selectedPaymentDisplay.innerText = selectedPaymentMethod;
        confirmSaleBtn.disabled = false;
    });
});

// Evento para confirmar e finalizar a venda
confirmSaleBtn.addEventListener('click', async () => {
    const saleData = {
        items: pedidoAtual,
        total: pedidoAtual.reduce((sum, item) => sum + item.price, 0),
        paymentMethod: selectedPaymentMethod
    };

    const result = await window.api.finalizeSale(saleData);

    if (result.success) {
        alert('Venda finalizada com sucesso!');
        pedidoAtual = [];
        renderizarPedido();
        paymentModal.classList.add('hidden');
        resetPaymentModal();
        carregarDadosIniciais();
    } else {
        alert(`Erro ao finalizar a venda: ${result.message}`);
    }
});

// --- Inicialização da Página ---
carregarDadosIniciais();