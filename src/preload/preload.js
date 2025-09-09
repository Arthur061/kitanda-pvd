// src/preload/preload.js (VERSÃO RESTAURADA)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Funções de Autenticação
  login: (username, password) => ipcRenderer.invoke('login:submit', username, password),
  register: (username, password) => ipcRenderer.invoke('register:submit', username, password),
  getCurrentUser: () => ipcRenderer.invoke('auth:get-current-user'),

  // Funções de Navegação
  goToRegister: () => ipcRenderer.send('navigate:to-register'),
  goToLogin: () => ipcRenderer.send('navigate:to-login'),
  openProductsWindow: () => ipcRenderer.send('open-products-window'),
  openManagementWindow: () => ipcRenderer.send('open-management-window'),

  // Funções de Produtos
  getProducts: () => ipcRenderer.invoke('products:get'),
  addProduct: (product) => ipcRenderer.invoke('products:add', product),
  
  // Funções de Categorias
  getCategories: () => ipcRenderer.invoke('categories:get'),
  
  // Funções de Venda
  finalizeSale: (saleData) => ipcRenderer.invoke('sale:finalize', saleData),

  // Funções de Relatórios
  getSalesByDate: (date) => ipcRenderer.invoke('reports:get-sales-by-date', date),
  getProductsToRestock: () => ipcRenderer.invoke('reports:get-products-to-restock'),
});