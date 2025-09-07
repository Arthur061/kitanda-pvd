// src/renderer/js/produtos.js (VERSÃO FINAL E CORRIGIDA)

const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const formMessage = document.getElementById('form-message');
const categorySelect = document.getElementById('category-select');

// Lista de categorias padrão que sempre devem existir no dropdown
const categoriasPadrao = ["Lanches", "Bebidas", "Combos", "Outros"];

/**
 * Busca as categorias do BD, junta com as padrão e preenche o dropdown.
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
            <td>${product.min_stock}</td> <td>${product.category}</td>
        `;
        productList.appendChild(row);
    });
}

/**
 * Busca e exibe todos os produtos na tabela.
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
            <td>${product.min_stock || 0}</td> 
            <td>${product.category}</td>
        `;
        productList.appendChild(row);
    });
}

/**
 * Lida com o envio do formulário de novo produto.
 */
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newProduct = {
        name: document.getElementById('name').value,
        price: parseFloat(document.getElementById('price').value),
        stock: parseInt(document.getElementById('stock').value),
        category: categorySelect.value,
        min_stock: parseInt(document.getElementById('min_stock').value)
    };

    // Validação para garantir que uma categoria foi selecionada
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

async function renderCategories() {
  try {
    // Verifica se a API está disponível antes de usá-la
    if (window.api && typeof window.api.getCategories === 'function') {
      const categoriesFromDB = await window.api.getCategories();
      
      categorySelect.innerHTML = '<option value="">-- Selecione uma Categoria --</option>';

      // Usa um Set para juntar as categorias padrão com as do banco, sem duplicados
      const allCategories = new Set([...categoriasPadrao, ...categoriesFromDB]);
      const categoriasOrdenadas = Array.from(allCategories).sort();

      categoriasOrdenadas.forEach(category => {
          const option = document.createElement('option');
          option.value = category;
          option.innerText = category;
          categorySelect.appendChild(option);
      });
    } else {
      // Se a API não carregar, exibe um erro claro
      console.error('A API do preload (window.api.getCategories) não está disponível.');
      // E carrega pelo menos as categorias padrão para a UI não ficar quebrada
      categorySelect.innerHTML = '<option value="">-- Erro ao carregar --</option>';
      categoriasPadrao.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.innerText = category;
        categorySelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Ocorreu um erro ao renderizar as categorias:', error);
    formMessage.innerText = 'Erro ao carregar categorias.';
    formMessage.style.color = 'red';
  }
}

/**
 * Função inicial que carrega todos os dados da página.
 */
function initializePage() {
    renderProducts();
    renderCategories();
}

initializePage();