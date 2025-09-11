const produtosDiv = document.getElementById('produtos');
const listaPedidoUl = document.getElementById('lista-pedido');
const valorTotalSpan = document.getElementById('valor-total');
const manageProductsBtn = document.getElementById('manage-products-btn');
const categoryButtonsContainer = document.getElementById('category-buttons-container');
const finalizarVendaBtn = document.querySelector('.btn-finalizar');
const paymentModal = document.getElementById('payment-modal');
const modalTotal = document.getElementById('modal-total');
const paymentOptions = document.querySelectorAll('.payment-btn');
const selectedPaymentDisplay = document.getElementById('selected-payment');
const cancelSaleBtn = document.getElementById('cancel-sale-btn');
const confirmSaleBtn = document.getElementById('confirm-sale-btn');

let pedidoAtual = [];
let todosOsProdutos = [];
let selectedPaymentMethod = null;

async function carregarDadosIniciais() {
    try {
        const user = await window.api.getCurrentUser();
        if (user && user.role === 'admin' && !document.getElementById('open-management-btn')) {
            const adminButton = document.createElement('button');
            adminButton.id = 'open-management-btn';
            adminButton.className = 'categoria-btn';
            adminButton.innerText = 'Gerenciamento';
            adminButton.addEventListener('click', () => {
                window.api.openManagementWindow();
            });
            manageProductsBtn.insertAdjacentElement('afterend', adminButton);
        }

        const produtosDoBanco = await window.api.getProducts();
        todosOsProdutos = produtosDoBanco.filter(produto => produto.stock > 0);
        filtrarProdutosPorCategoria('Todos');
    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
    }
}

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

function adicionarAoPedido(produto) {
    const estoqueAtual = todosOsProdutos.find(p => p.id === produto.id)?.stock || 0;
    const quantidadeNoPedido = pedidoAtual.filter(p => p.id === produto.id).length;

    if (quantidadeNoPedido < estoqueAtual) {
        pedidoAtual.push(produto);
        renderizarPedido();
    } else {
        alert(`Não há mais estoque disponível para "${produto.name}".`);
    }
}

function renderizarPedido() {
    listaPedidoUl.innerHTML = '';
    let total = 0;
    
    // Atualizado para incluir o botão de remoção com o índice do item
    pedidoAtual.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.name} - R$ ${item.price.toFixed(2)}</span>
            <button class="btn-remove-item" data-index="${index}" title="Remover item">x</button>
        `;
        listaPedidoUl.appendChild(li);
        total += item.price;
    });

    const totalFormatado = `R$ ${total.toFixed(2)}`;
    valorTotalSpan.innerText = totalFormatado;
    modalTotal.innerText = totalFormatado;
}

function resetPaymentModal() {
    selectedPaymentMethod = null;
    selectedPaymentDisplay.innerText = '-';
    paymentOptions.forEach(btn => btn.classList.remove('selected'));
    confirmSaleBtn.disabled = true;
}

// --- EVENT LISTENERS ---

manageProductsBtn.addEventListener('click', () => {
    window.api.openProductsWindow();
});

const botoesDeCategoria = categoryButtonsContainer.querySelectorAll('.categoria-btn');
botoesDeCategoria.forEach(botao => {
    botao.addEventListener('click', () => {
        const categoriaClicada = botao.innerText;
        filtrarProdutosPorCategoria(categoriaClicada);
    });
});

finalizarVendaBtn.addEventListener('click', () => {
    if (pedidoAtual.length === 0) {
        alert('Adicione itens ao pedido antes de finalizar!');
        return;
    }
    paymentModal.classList.remove('hidden');
});

cancelSaleBtn.addEventListener('click', () => {
    paymentModal.classList.add('hidden');
    resetPaymentModal();
});

paymentOptions.forEach(button => {
    button.addEventListener('click', () => {
        paymentOptions.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedPaymentMethod = button.dataset.method;
        selectedPaymentDisplay.innerText = selectedPaymentMethod;
        confirmSaleBtn.disabled = false;
    });
});

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

// Event listener para remover itens do pedido
listaPedidoUl.addEventListener('click', (e) => {
    // Verifica se o elemento clicado é o botão de remover
    if (e.target.classList.contains('btn-remove-item')) {
        const indexToRemove = parseInt(e.target.dataset.index, 10);
        
        pedidoAtual.splice(indexToRemove, 1);
        
        renderizarPedido();
    }
});


// --- CARREGAMENTO INICIAL E ATUALIZAÇÕES ---
window.api.onProductsUpdate(() => {
    console.log('Recebida notificação para atualizar produtos.');
    carregarDadosIniciais();
});

carregarDadosIniciais();