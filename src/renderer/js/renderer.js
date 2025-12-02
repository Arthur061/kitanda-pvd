// --- SELEÇÃO DE ELEMENTOS DO DOM DO MODAL DE PAGAMENTO ---
const modalTotalDisplay = document.getElementById('modal-total-display');
const discountSection = document.getElementById('discount-section');
const discountInput = document.getElementById('discount-input');
const modalFinalTotal = document.getElementById('modal-final-total');

// --- SELEÇÃO DE ELEMENTOS DO DOM PRINCIPAL ---
const produtosDiv = document.getElementById('produtos');
const listaPedidoUl = document.getElementById('lista-pedido');
const valorTotalSpan = document.getElementById('valor-total');
const finalizarVendaBtn = document.querySelector('.btn-finalizar');

// Sidebar e Menu
const categoryToggleBtn = document.getElementById('category-toggle-btn');
const categoryContainer = document.getElementById('category-buttons-container');
const manageProductsBtn = document.getElementById('manage-products-btn');
const botoesDeCategoria = document.querySelectorAll('.categoria-btn');
const logoutBtn = document.getElementById('logout-btn');

// ELEMENTOS DO MODAL DE LOGOUT
const logoutModal = document.getElementById('logout-confirmation-modal');
const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
const confirmLogoutBtn = document.getElementById('confirm-logout-btn');

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
let percentualDesconto = 0; // Armazena a porcentagem do desconto

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
        
        // --- ATUALIZAR PERFIL (Se existir no HTML) ---
        if (user) {
            const nomeUsuario = document.getElementById('display-username');
            if (nomeUsuario) nomeUsuario.innerText = user.username;

            const roleBadge = document.getElementById('display-role');
            if (roleBadge) {
                roleBadge.innerText = user.role === 'admin' ? 'Administrador' : 'Vendedor';
                if (user.role !== 'admin') {
                    roleBadge.style.backgroundColor = '#e0f7fa';
                    roleBadge.style.color = '#006064';
                }
            }

            const avatar = document.getElementById('user-avatar');
            if (avatar) {
                avatar.innerText = user.username.charAt(0).toUpperCase();
            }
        } 
        
        // Se for admin, adiciona o botão de Relatórios no menu
        if (user && user.role === 'admin' && !document.getElementById('btn-relatorios')) {
            const reportsBtn = document.createElement('button');
            reportsBtn.id = 'btn-relatorios';
            reportsBtn.className = 'categoria-btn'; 
            reportsBtn.innerHTML = '📈 Relatórios Admin';
            reportsBtn.style.borderLeft = '4px solid #795548'; 
            
            reportsBtn.addEventListener('click', () => {
                window.api.openManagementWindow();
            });

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

function filtrarProdutosPorCategoria(categoriaTexto) {
    if (!produtosDiv) return;
    produtosDiv.innerHTML = '';
    
    // Tratamento simples para remover emojis caso o texto venha com eles (ex: "🍔 Lanches" -> "Lanches")
    // Se você não usar emojis no HTML, isso não atrapalha.
    const categoriaLimpa = categoriaTexto.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27FF]/g, "").replace(/📦|🍔|🥤|🍟|🍩|📈/g, "").trim();

    if (categoriaLimpa === 'Relatórios Admin') return;

    const produtosFiltrados = (categoriaLimpa.toLowerCase() === 'todos')
        ? todosOsProdutos
        : todosOsProdutos.filter(p => p.category === categoriaLimpa);

    produtosFiltrados.forEach(produto => {
        const btn = document.createElement('button');
        btn.className = 'produto-btn';
        btn.innerHTML = `<strong>${produto.name}</strong><br>R$ ${produto.price.toFixed(2)}`;
        btn.onclick = () => adicionarAoPedido(produto);
        produtosDiv.appendChild(btn);
    });
}

function adicionarAoPedido(produto) {
    const produtoNoBanco = todosOsProdutos.find(p => p.id === produto.id);
    const estoqueAtual = produtoNoBanco?.stock || 0;
    const estoqueMinimo = produtoNoBanco?.min_stock || 0;
    const quantidadeNoPedido = pedidoAtual.filter(p => p.id === produto.id).length;

    if (quantidadeNoPedido < estoqueAtual) {
        pedidoAtual.push(produto);
        renderizarPedido();

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
}

// --- LÓGICA DO MODAL DE PAGAMENTO E DESCONTO ---

function resetPaymentModal() {
    selectedPaymentMethod = null;
    percentualDesconto = 0;
    
    if(selectedPaymentDisplay) selectedPaymentDisplay.innerText = '-';
    if(discountInput) discountInput.value = '';
    
    // Esconde a seção de desconto e remove seleção dos botões
    if(discountSection) discountSection.classList.add('hidden');
    paymentOptions.forEach(btn => btn.classList.remove('selected'));
    
    if(confirmSaleBtn) confirmSaleBtn.disabled = true;
}

function calcularTotalComDesconto() {
    const totalOriginal = pedidoAtual.reduce((sum, item) => sum + item.price, 0);
    
    // Cálculo: Total * (Porcentagem / 100)
    const valorDoDesconto = totalOriginal * (percentualDesconto / 100);
    const totalFinal = totalOriginal - valorDoDesconto;

    if(modalFinalTotal) modalFinalTotal.innerText = `R$ ${totalFinal.toFixed(2)}`;
}

// --- EVENT LISTENERS (BOTÕES) ---

// 1. Menu Cascata (Abrir/Fechar)
if (categoryToggleBtn && categoryContainer) {
    if (categoryToggleBtn.classList.contains('collapsed')) {
        categoryContainer.classList.add('hidden-content');
    }

    categoryToggleBtn.addEventListener('click', () => {
        categoryContainer.classList.toggle('hidden-content');
        categoryToggleBtn.classList.toggle('collapsed');
    });
}

// 2. Botões de Categoria (Seleção)
botoesDeCategoria.forEach(botao => {
    botao.addEventListener('click', (e) => {
        document.querySelectorAll('.categoria-btn').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        
        const categoria = e.target.innerText;
        filtrarProdutosPorCategoria(categoria);
    });
});

// 3. Botão Gerenciar Estoque
if (manageProductsBtn) {
    manageProductsBtn.addEventListener('click', () => {
        window.api.openProductsWindow();
    });
}

// 4. Botões de Venda (Abrir Modal)
if (finalizarVendaBtn) {
    finalizarVendaBtn.addEventListener('click', () => {
        if (pedidoAtual.length === 0) {
            showAlert('O pedido está vazio.', 'Aviso');
            return;
        }
        
        resetPaymentModal();
        
        // Exibe o total inicial
        const total = pedidoAtual.reduce((sum, item) => sum + item.price, 0);
        if(modalTotalDisplay) modalTotalDisplay.innerText = `R$ ${total.toFixed(2)}`;
        
        paymentModal.classList.remove('hidden');
    });
}

// Botão Cancelar Venda
if (cancelSaleBtn) {
    cancelSaleBtn.addEventListener('click', () => {
        paymentModal.classList.add('hidden');
        resetPaymentModal();
    });
}

// 5. Opções de Pagamento (Ao clicar, mostra o desconto)
paymentOptions.forEach(button => {
    button.addEventListener('click', () => {
        paymentOptions.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedPaymentMethod = button.dataset.method;
        selectedPaymentDisplay.innerText = selectedPaymentMethod;
        confirmSaleBtn.disabled = false;

        // MOSTRAR A ÁREA DE DESCONTO AGORA
        if(discountSection) {
            discountSection.classList.remove('hidden');
            // Recalcula para garantir que o total final apareça
            calcularTotalComDesconto();
        }
    });
});

// Listener do Input de Desconto (Apenas Porcentagem)
if (discountInput) {
    discountInput.addEventListener('input', (e) => {
        let valor = parseFloat(e.target.value);
        if (isNaN(valor)) valor = 0;
        
        // Trava entre 0 e 100%
        if (valor < 0) valor = 0;
        if (valor > 100) valor = 100;
        
        percentualDesconto = valor;
        calcularTotalComDesconto();
    });
}

// 6. Confirmar Venda (Envia os dados corretos)
if (confirmSaleBtn) {
    confirmSaleBtn.addEventListener('click', async () => {
        const totalOriginal = pedidoAtual.reduce((sum, item) => sum + item.price, 0);
        
        // Recalcula o final para garantir integridade
        const valorDoDesconto = totalOriginal * (percentualDesconto / 100);
        const totalFinal = totalOriginal - valorDoDesconto;

        const saleData = {
            items: pedidoAtual,
            total: totalFinal,
            discount: percentualDesconto, // Salva a % no banco
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

// 8. Logout (Lógica MODERNA)
if (logoutBtn && logoutModal) {
    logoutBtn.addEventListener('click', () => {
        logoutModal.classList.remove('hidden');
    });
}

if (cancelLogoutBtn && logoutModal) {
    cancelLogoutBtn.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
    });
}

if (confirmLogoutBtn && logoutModal) {
    confirmLogoutBtn.addEventListener('click', async () => {
        logoutModal.classList.add('hidden');
        window.api.logout();
    });
}

if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.classList.add('hidden');
        }
    });
}

// --- COMUNICAÇÃO ENTRE JANELAS ---
window.api.onProductsUpdate(() => {
    carregarDadosIniciais();
});

// Inicialização
carregarDadosIniciais();