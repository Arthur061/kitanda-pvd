// produtos.js (Versão Final Corrigida)

const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const formMessage = document.getElementById('form-message');
const categorySelect = document.getElementById('category-select');

// Categorias padrão que sempre devem aparecer
const categoriasPadrao = ["Lanches", "Bebidas", "Combos", "Outros"];

/**
 * Busca as categorias do BD, junta com as padrão e preenche o dropdown
 */
async function renderCategories() {
    const categoriesFromDB = await window.api.getCategories();

    categorySelect.innerHTML = '<option value="">-- Selecione uma Categoria --</option>';

    // Junta as categorias padrão com as do banco de dados, sem duplicados
    const allCategories = new Set([...categoriasPadrao, ...categoriesFromDB]);

    // Converte para Array e ordena alfabeticamente para consistência
    const categoriasOrdenadas = Array.from(allCategories).sort();

    categoriasOrdenadas.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.innerText = category;
        categorySelect.appendChild(option);
    });
}

/**
 * Busca e exibe os produtos na tabela
 */
async function renderProducts() {
    const products = await window.api.getProducts();
    productList.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>R$ ${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>${product.category}</td>
        `;
        productList.appendChild(row);
    });
}

/**
 * Lida com o envio do formulário de novo produto
 */
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newProduct = {
        name: document.getElementById('name').value,
        price: parseFloat(document.getElementById('price').value),
        stock: parseInt(document.getElementById('stock').value),
        category: categorySelect.value,
    };

    // Validação simples para garantir que uma categoria foi selecionada
    if (!newProduct.category) {
        formMessage.innerText = 'Erro: Por favor, selecione uma categoria.';
        formMessage.style.color = 'red';
        return;
    }

    const result = await window.api.addProduct(newProduct);

    if (result.success) {
        formMessage.innerText = 'Produto adicionado com sucesso!';
        formMessage.style.color = 'green';
        productForm.reset();
        renderProducts();
        renderCategories();
    } else {
        formMessage.innerText = `Erro: ${result.message}`;
        formMessage.style.color = 'red';
    }
});

/**
 * Função inicial que carrega tudo
 */
function initializePage() {
    renderProducts();
    renderCategories();
}

initializePage();