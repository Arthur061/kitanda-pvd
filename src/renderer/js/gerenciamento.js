document.addEventListener('DOMContentLoaded', () => {
    const salesDatePicker = document.getElementById('sales-date-picker');
    const salesReportDiv = document.getElementById('sales-report');
    const restockReportDiv = document.getElementById('restock-report');

    async function loadSalesReport(date) {
        salesReportDiv.innerHTML = '<p>Carregando...</p>';
        const sales = await window.api.getSalesByDate(date);

        if (sales.length === 0) {
            salesReportDiv.innerHTML = '<p>Nenhuma venda encontrada para esta data.</p>';
            return;
        }

        let total = 0;
        const salesByPaymentMethod = sales.reduce((acc, sale) => {
            if (!acc[sale.payment_method]) {
                acc[sale.payment_method] = 0;
            }
            acc[sale.payment_method] += sale.total;
            total += sale.total;
            return acc;
        }, {});

        let reportHtml = `
            <p><strong>Total de Vendas: R$ ${total.toFixed(2)}</strong></p>
            <h4>Vendas por Forma de Pagamento:</h4>
            <ul>
        `;
        for (const method in salesByPaymentMethod) {
            reportHtml += `<li>${method}: R$ ${salesByPaymentMethod[method].toFixed(2)}</li>`;
        }
        reportHtml += '</ul>';
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

    // Carrega os relatórios para a data de hoje ao abrir a página
    const today = new Date().toISOString().split('T')[0];
    salesDatePicker.value = today;
    loadSalesReport(today);
    loadRestockReport();
});