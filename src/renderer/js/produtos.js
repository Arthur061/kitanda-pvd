// src/renderer/js/produtos.js (VERSÃO RESTAURADA)
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const formMessage = document.getElementById('form-message');
const categorySelect = document.getElementById('category-select');

const categoriasPadrao = ["Lanches", "Bebidas", "Combos", "Outros"];

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

async function renderCategories() {
  try {
    if (window.api && typeof window.api.getCategories === 'function') {
      const categoriesFromDB = await window.api.getCategories();
      categorySelect.innerHTML = '<option value="">-- Selecione uma Categoria --</option>';
      const allCategories = new Set([...categoriasPadrao, ...categoriesFromDB]);
      const categoriasOrdenadas = Array.from(allCategories).sort();

      categoriasOrdenadas.forEach(category => {
          const option = document.createElement('option');
          option.value = category;
          option.innerText = category;
          categorySelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Ocorreu um erro ao renderizar as categorias:', error);
  }
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newProduct = {
        name: document.getElementById('name').value,
        price: parseFloat(document.getElementById('price').value),
        stock: parseInt(document.getElementById('stock').value),
        category: categorySelect.value,
        min_stock: parseInt(document.getElementById('min_stock').value)
    };
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

function initializePage() {
    renderProducts();
    renderCategories();
}

initializePage();