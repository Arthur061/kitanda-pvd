// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Funções de Autenticação
  login: (username, password) => ipcRenderer.invoke('login:submit', username, password),
  register: (username, password) => ipcRenderer.invoke('register:submit', username, password),

  // Funções de Navegação
  goToRegister: () => ipcRenderer.send('navigate:to-register'),
  goToLogin: () => ipcRenderer.send('navigate:to-login'),
  openProductsWindow: () => ipcRenderer.send('open-products-window'),

  // Funções de Produtos
  getProducts: () => ipcRenderer.invoke('products:get'),
  addProduct: (product) => ipcRenderer.invoke('products:add', product),

  // --- NOVA FUNÇÃO DE CATEGORIAS ---
  getCategories: () => ipcRenderer.invoke('categories:get'),
});