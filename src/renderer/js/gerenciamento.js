document.addEventListener('DOMContentLoaded', () => {
    const salesDatePicker = document.getElementById('sales-date-picker');
    const salesReportDiv = document.getElementById('sales-report');
    const restockReportDiv = document.getElementById('restock-report');

    async function loadSalesReport(date) {
        salesReportDiv.innerHTML = '<p>Carregando...</p>';
        // A API agora retorna os detalhes completos de cada venda
        const sales = await window.api.getSalesByDate(date);

        if (sales.length === 0) {
            salesReportDiv.innerHTML = '<p>Nenhuma venda encontrada para esta data.</p>';
            return;
        }

        let grandTotal = 0;
        // Agrupa as vendas completas por método de pagamento
        const salesByPaymentMethod = sales.reduce((acc, sale) => {
            const method = sale.paymentMethod;
            if (!acc[method]) {
                acc[method] = {
                    total: 0,
                    salesList: []
                };
            }
            acc[method].total += sale.total;
            acc[method].salesList.push(sale);
            grandTotal += sale.total;
            return acc;
        }, {});

        // Monta o HTML do relatório
        let reportHtml = `<p><strong>Total de Vendas: R$ ${grandTotal.toFixed(2)}</strong></p><h4>Vendas por Forma de Pagamento:</h4>`;
        
        reportHtml += '<div class="payment-accordion">';
        for (const method in salesByPaymentMethod) {
            const group = salesByPaymentMethod[method];
            reportHtml += `
                <div class="payment-method-group">
                    <div class="payment-summary">
                        <span>${method}: R$ ${group.total.toFixed(2)}</span>
                        <span class="arrow">▼</span>
                    </div>
                    <div class="sales-details">
            `;

            group.salesList.forEach(sale => {
                const saleTime = new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                reportHtml += `
                    <div class="sale-record">
                        <p><strong>Venda de ${saleTime} - Total: R$ ${sale.total.toFixed(2)}</strong></p>
                        <ul>
                `;
                sale.items.forEach(item => {
                    reportHtml += `<li>${item.name} - R$ ${item.price.toFixed(2)}</li>`;
                });
                reportHtml += `</ul></div>`;
            });

            reportHtml += `</div></div>`;
        }
        reportHtml += '</div>';
        salesReportDiv.innerHTML = reportHtml;
    }

    async function loadRestockReport() {
        restockReportDiv.innerHTML = '<p>Carregando...</p>';
        const products = await window.api.getProductsToRestock();

        if (products.length === 0) {
            restockReportDiv.innerHTML = '<p>Nenhum produto com baixo estoque.</p>';
            return;
        }

        let reportHtml = '<ul>';
        products.forEach(product => {
            reportHtml += `<li>${product.name} (Estoque atual: ${product.stock}, Mínimo recomendado: ${product.min_stock})</li>`;
        });
        reportHtml += '</ul>';
        restockReportDiv.innerHTML = reportHtml;
    }

    salesDatePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            loadSalesReport(e.target.value);
        }
    });

    // Adiciona o event listener para o "acordeão"
    salesReportDiv.addEventListener('click', (e) => {
        const header = e.target.closest('.payment-summary');
        if (header) {
            const group = header.parentElement;
            const details = group.querySelector('.sales-details');
            const arrow = header.querySelector('.arrow');

            group.classList.toggle('active');
            
            if (group.classList.contains('active')) {
                details.style.maxHeight = details.scrollHeight + "px";
                arrow.style.transform = 'rotate(180deg)';
            } else {
                details.style.maxHeight = null;
                arrow.style.transform = 'rotate(0deg)';
            }
        }
    });

    // Carrega os relatórios para a data de hoje ao abrir a página
    const today = new Date().toISOString().split('T')[0];
    salesDatePicker.value = today;
    loadSalesReport(today);
    loadRestockReport();
});