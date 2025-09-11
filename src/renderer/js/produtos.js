const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const formMessage = document.getElementById('form-message');
const categorySelect = document.getElementById('category-select');

// Elementos do Modal de Edição
const editModal = document.getElementById('edit-modal');
const editProductForm = document.getElementById('edit-product-form');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editCategorySelect = document.getElementById('edit-category-select');

const categoriasPadrao = ["Lanches", "Bebidas", "Combos", "Outros"];
let allProducts = []; 

// --- FUNÇÕES DE RENDERIZAÇÃO ---

async function renderProducts() {
    allProducts = await window.api.getProducts();
    productList.innerHTML = '';
    allProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>R$ ${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>${product.min_stock || 0}</td>
            <td>${product.category}</td>
            <td>
                <button class="btn-edit" data-id="${product.id}">Editar</button>
                <button class="btn-delete" data-id="${product.id}">Excluir</button>
            </td>
        `;
        productList.appendChild(row);
    });
}

async function renderCategories(selectElement) {
  try {
    if (window.api && typeof window.api.getCategories === 'function') {
      const categoriesFromDB = await window.api.getCategories();
      selectElement.innerHTML = '<option value="">-- Selecione uma Categoria --</option>';
      const allCategories = new Set([...categoriasPadrao, ...categoriesFromDB]);
      const categoriasOrdenadas = Array.from(allCategories).sort();

      categoriasOrdenadas.forEach(category => {
          const option = document.createElement('option');
          option.value = category;
          option.innerText = category;
          selectElement.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Ocorreu um erro ao renderizar as categorias:', error);
  }
}

// --- LÓGICA DE EVENTOS ---

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
        window.api.notifyProductsChanged();
        await initializePage();
    } else {
        formMessage.innerText = `Erro: ${result.message}`;
        formMessage.style.color = 'red';
    }
});

// Delegação de eventos para os botões de ação na tabela
productList.addEventListener('click', (e) => {
    const target = e.target;
    const id = parseInt(target.getAttribute('data-id'));

    if (target.classList.contains('btn-edit')) {
        openEditModal(id);
    }
    if (target.classList.contains('btn-delete')) {
        handleDeleteProduct(id);
    }
});

editProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-id').value);
    const updatedProduct = {
        name: document.getElementById('edit-name').value,
        price: parseFloat(document.getElementById('edit-price').value),
        stock: parseInt(document.getElementById('edit-stock').value),
        min_stock: parseInt(document.getElementById('edit-min_stock').value),
        category: document.getElementById('edit-category-select').value,
    };

    const result = await window.api.updateProduct(id, updatedProduct);
    if (result.success) {
        closeEditModal();
        window.api.notifyProductsChanged();
        await initializePage(); 
    } else {
        alert(`Erro ao atualizar produto: ${result.message}`);
    }
});

cancelEditBtn.addEventListener('click', closeEditModal);

// --- FUNÇÕES AUXILIARES ---

function openEditModal(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    // Preenche o formulário do modal com os dados do produto
    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-stock').value = product.stock;
    document.getElementById('edit-min_stock').value = product.min_stock;
    document.getElementById('edit-category-select').value = product.category;

    editModal.classList.remove('hidden');
}

function closeEditModal() {
    editModal.classList.add('hidden');
    editProductForm.reset();
}

async function handleDeleteProduct(id) {
    const confirmed = confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.');
    if (confirmed) {
        const result = await window.api.deleteProduct(id);
        if (result.success) {
            window.api.notifyProductsChanged(); 
            await initializePage();
        } else {
            alert(`Erro ao excluir produto: ${result.message}`);
        }
    }
}

async function initializePage() {
    await renderProducts();
    await renderCategories(categorySelect);
    await renderCategories(editCategorySelect);
}

// --- INICIALIZAÇÃO ---
initializePage();