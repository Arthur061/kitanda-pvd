// --- SELEÇÃO DE ELEMENTOS DO DOM ---
const produtosDiv = document.getElementById('produtos');
const listaPedidoUl = document.getElementById('lista-pedido');
const valorTotalSpan = document.getElementById('valor-total');
const finalizarVendaBtn = document.querySelector('.btn-finalizar');

// Sidebar e Menu
const categoryToggleBtn = document.getElementById('category-toggle-btn');
const categoryContainer = document.getElementById('category-buttons-container');
const manageProductsBtn = document.getElementById('manage-products-btn');
const botoesDeCategoria = document.querySelectorAll('.categoria-btn');

// Modal de Pagamento
const paymentModal = document.getElementById('payment-modal');
const modalTotal = document.getElementById('modal-total');
const paymentOptions = document.querySelectorAll('.payment-btn');
const selectedPaymentDisplay = document.getElementById('selected-payment');
const cancelSaleBtn = document.getElementById('cancel-sale-btn');
const confirmSaleBtn = document.getElementById('confirm-sale-btn');

// Modal de Alerta
const alertModal = document.getElementById('alert-modal');
const alertMessage = document.getElementById('alert-message');
const alertTitle = document.getElementById('alert-title');
const alertOkBtn = document.getElementById('alert-ok-btn');

// --- VARIÁVEIS GLOBAIS ---
let pedidoAtual = [];
let todosOsProdutos = [];
let selectedPaymentMethod = null;

// --- FUNÇÕES AUXILIARES ---

// Função de Alerta Personalizado
function showAlert(message, title = 'Atenção') {
    if (alertMessage && alertTitle && alertModal) {
        alertMessage.innerText = message;
        alertTitle.innerText = title;
        alertModal.classList.remove('hidden');
    } else {
        alert(message); // Fallback
    }
}

if (alertOkBtn) {
    alertOkBtn.addEventListener('click', () => {
        alertModal.classList.add('hidden');
    });
}

// --- LÓGICA DE NEGÓCIO ---

async function carregarDadosIniciais() {
    try {
        const user = await window.api.getCurrentUser();
        
        // Se for admin, adiciona o botão de Relatórios no menu
        // (O botão de Estoque já está fixo no HTML agora)
        if (user && user.role === 'admin' && !document.getElementById('btn-relatorios')) {
            const reportsBtn = document.createElement('button');
            reportsBtn.id = 'btn-relatorios';
            reportsBtn.className = 'categoria-btn'; // Usa o mesmo estilo da lista
            reportsBtn.innerHTML = '📈 Relatórios Admin';
            reportsBtn.style.borderLeft = '4px solid #795548'; // Destaque visual
            
            reportsBtn.addEventListener('click', () => {
                window.api.openManagementWindow();
            });

            // Adiciona no final da lista de categorias
            if(categoryContainer) {
                categoryContainer.appendChild(reportsBtn);
            }
        }

        const produtosDoBanco = await window.api.getProducts();
        todosOsProdutos = produtosDoBanco.filter(produto => produto.stock > 0);
        filtrarProdutosPorCategoria('Todos');
    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        showAlert("Erro ao conectar com o banco de dados.");
    }
}

function filtrarProdutosPorCategoria(categoria) {
    if (!produtosDiv) return;
    produtosDiv.innerHTML = '';
    
    // Se a categoria for "Relatórios Admin", não faz nada (já tratado no clique)
    if (categoria === '📈 Relatórios Admin') return;

    const produtosFiltrados = (categoria.toLowerCase() === 'todos')
        ? todosOsProdutos
        : todosOsProdutos.filter(p => p.category === categoria);

    produtosFiltrados.forEach(produto => {
        const btn = document.createElement('button');
        btn.className = 'produto-btn';
        btn.innerHTML = `<strong>${produto.name}</strong><br>R$ ${produto.price.toFixed(2)}`;
        btn.onclick = () => adicionarAoPedido(produto);
        produtosDiv.appendChild(btn);
    });
}

function adicionarAoPedido(produto) {
    // Atualiza dados frescos
    const produtoNoBanco = todosOsProdutos.find(p => p.id === produto.id);
    const estoqueAtual = produtoNoBanco?.stock || 0;
    const estoqueMinimo = produtoNoBanco?.min_stock || 0;
    const quantidadeNoPedido = pedidoAtual.filter(p => p.id === produto.id).length;

    if (quantidadeNoPedido < estoqueAtual) {
        pedidoAtual.push(produto);
        renderizarPedido();

        // Verifica nível de alerta
        const restante = estoqueAtual - (quantidadeNoPedido + 1);
        if (restante <= estoqueMinimo) {
            showAlert(`O produto "${produto.name}" está com estoque baixo!\nRestam ${restante} unidades.`, 'Alerta de Estoque');
        }
    } else {
        showAlert(`Estoque insuficiente para "${produto.name}".`, 'Ops!');
    }
}

function renderizarPedido() {
    if (!listaPedidoUl) return;
    listaPedidoUl.innerHTML = '';
    let total = 0;
    
    pedidoAtual.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.name}</span>
            <div style="display:flex; align-items:center; gap:10px;">
                <span>R$ ${item.price.toFixed(2)}</span>
                <button class="btn-remove-item" data-index="${index}">x</button>
            </div>
        `;
        listaPedidoUl.appendChild(li);
        total += item.price;
    });

    const totalFormatado = `R$ ${total.toFixed(2)}`;
    if (valorTotalSpan) valorTotalSpan.innerText = totalFormatado;
    if (modalTotal) modalTotal.innerText = totalFormatado;
}

function resetPaymentModal() {
    selectedPaymentMethod = null;
    if(selectedPaymentDisplay) selectedPaymentDisplay.innerText = '-';
    paymentOptions.forEach(btn => btn.classList.remove('selected'));
    if(confirmSaleBtn) confirmSaleBtn.disabled = true;
}

// --- EVENT LISTENERS (BOTÕES) ---

// 1. Menu Cascata (Abrir/Fechar)
if (categoryToggleBtn && categoryContainer) {
    // Estado inicial: Se tiver a classe 'collapsed' no HTML, esconde o conteúdo
    if (categoryToggleBtn.classList.contains('collapsed')) {
        categoryContainer.classList.add('hidden-content');
    }

    categoryToggleBtn.addEventListener('click', () => {
        categoryContainer.classList.toggle('hidden-content'); // CSS controla a altura
        categoryToggleBtn.classList.toggle('collapsed');      // CSS gira a seta
    });
}

// 2. Botões de Categoria (Seleção)
botoesDeCategoria.forEach(botao => {
    botao.addEventListener('click', (e) => {
        // Limpa seleção anterior
        document.querySelectorAll('.categoria-btn').forEach(btn => btn.classList.remove('selected'));
        // Marca novo
        e.target.classList.add('selected');
        
        const categoria = e.target.innerText;
        filtrarProdutosPorCategoria(categoria);
    });
});

// 3. Botão Gerenciar Estoque (Abre janela de Produtos)
if (manageProductsBtn) {
    manageProductsBtn.addEventListener('click', () => {
        window.api.openProductsWindow();
    });
}

// 4. Botões de Venda
if (finalizarVendaBtn) {
    finalizarVendaBtn.addEventListener('click', () => {
        if (pedidoAtual.length === 0) {
            showAlert('O pedido está vazio.', 'Aviso');
            return;
        }
        paymentModal.classList.remove('hidden');
    });
}

if (cancelSaleBtn) {
    cancelSaleBtn.addEventListener('click', () => {
        paymentModal.classList.add('hidden');
        resetPaymentModal();
    });
}

// 5. Opções de Pagamento
paymentOptions.forEach(button => {
    button.addEventListener('click', () => {
        paymentOptions.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedPaymentMethod = button.dataset.method;
        selectedPaymentDisplay.innerText = selectedPaymentMethod;
        confirmSaleBtn.disabled = false;
    });
});

// 6. Confirmar Venda
if (confirmSaleBtn) {
    confirmSaleBtn.addEventListener('click', async () => {
        const saleData = {
            items: pedidoAtual,
            total: pedidoAtual.reduce((sum, item) => sum + item.price, 0),
            paymentMethod: selectedPaymentMethod
        };
        const result = await window.api.finalizeSale(saleData);
        if (result.success) {
            showAlert('Venda realizada com sucesso!', 'Sucesso');
            pedidoAtual = [];
            renderizarPedido();
            paymentModal.classList.add('hidden');
            resetPaymentModal();
            carregarDadosIniciais(); 
        } else {
            showAlert(`Erro: ${result.message}`, 'Erro na Venda');
        }
    });
}

// 7. Remover Item
if (listaPedidoUl) {
    listaPedidoUl.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-item')) {
            const index = parseInt(e.target.dataset.index, 10);
            pedidoAtual.splice(index, 1);
            renderizarPedido();
        }
    });
}

// --- COMUNICAÇÃO ENTRE JANELAS ---
window.api.onProductsUpdate(() => {
    carregarDadosIniciais();
});

// Inicialização
carregarDadosIniciais();