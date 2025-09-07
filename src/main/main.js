const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const bcrypt = require('bcrypt');
const { initDb, getDb } = require('./database.js');

let currentWindow;

// --- FUNÇÕES DE CRIAÇÃO DE JANELAS ---

const createMainWindow = () => {
  currentWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../../assets/icon.ico'), // CORRIGIDO
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'), // CORRIGIDO
    },
  });
  currentWindow.maximize();
  currentWindow.setMenu(null);
  currentWindow.loadFile(path.join(__dirname, '../renderer/views/index.html')); // CORRIGIDO
};

const createLoginWindow = () => {
  currentWindow = new BrowserWindow({
    width: 500,
    height: 650,
    resizable: false,
    icon: path.join(__dirname, '../../assets/icon.ico'), // CORRIGIDO
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'), // CORRIGIDO
    },
  });
  currentWindow.setMenu(null);
  currentWindow.loadFile(path.join(__dirname, '../renderer/views/login.html')); // CORRIGIDO
};

const createRegisterWindow = () => {
  currentWindow = new BrowserWindow({
    width: 500,
    height: 650,
    resizable: false,
    icon: path.join(__dirname, '../../assets/icon.ico'), // CORRIGIDO
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'), // CORRIGIDO
    },
  });
  currentWindow.setMenu(null);
  currentWindow.loadFile(path.join(__dirname, '../renderer/views/register.html')); // CORRIGIDO
};

const createProductsWindow = () => {
  const productsWindow = new BrowserWindow({
    width: 900,
    height: 700,
    parent: currentWindow,
    modal: true,
    icon: path.join(__dirname, '../../assets/icon.ico'), // CORRIGIDO
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'), // CORRIGIDO
    },
  });
  productsWindow.setMenu(null);
  productsWindow.loadFile(path.join(__dirname, '../renderer/views/produtos.html')); // CORRIGIDO
};

// --- INICIALIZAÇÃO DA APLICAÇÃO ---

app.whenReady().then(() => {
  initDb();
  createLoginWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createLoginWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


ipcMain.on('navigate:to-register', () => { currentWindow.close(); createRegisterWindow(); });
ipcMain.on('navigate:to-login', () => { currentWindow.close(); createLoginWindow(); });
ipcMain.on('open-products-window', createProductsWindow);

ipcMain.handle('login:submit', async (event, username, password) => {
    const db = getDb();
    return new Promise((resolve) => {
        const sql = 'SELECT * FROM users WHERE username = ?';
        db.get(sql, [username], (err, user) => {
            if (err) {
                resolve({ success: false, message: 'Erro no banco de dados.' });
            } else if (!user) {
                resolve({ success: false, message: 'Utilizador não encontrado.' });
            } else {
                const passwordIsValid = bcrypt.compareSync(password, user.password);
                if (passwordIsValid) {
                    createMainWindow();
                    BrowserWindow.fromWebContents(event.sender).close();
                    resolve({ 
                        success: true, 
                        user: { 
                            username: user.username, 
                            role: user.role 
                        } 
                    });
                } else {
                    resolve({ success: false, message: 'Senha incorreta.' });
                }
            }
        });
    });
});

ipcMain.handle('register:submit', async (event, username, password) => {
  const db = getDb();
    return new Promise((resolve) => {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.run(sql, [username, hashedPassword], function (err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
            resolve({ success: false, message: 'Este nome de utilizador já existe.' });
            } else {
            resolve({ success: false, message: 'Erro ao registar no banco de dados.' });
            }
        } else {
            resolve({ success: true, message: 'Utilizador registado com sucesso!' });
        }
        });
    });
});

ipcMain.handle('products:add', async (event, product) => {
  const db = getDb();
    return new Promise((resolve) => {
        const { name, price, stock, category, min_stock } = product;
        const sql = 'INSERT INTO products (name, price, stock, category, min_stock) VALUES (?, ?, ?, ?, ?)';
        db.run(sql, [name, price, stock, category, min_stock], function(err) {
            if (err) {
                resolve({ success: false, message: err.message });
            } else {
                resolve({ success: true, id: this.lastID });
            }
        });
    });
});
ipcMain.handle('products:get', async () => {
  const db = getDb();
    return new Promise((resolve) => {
        const sql = 'SELECT * FROM products ORDER BY name';
        db.all(sql, [], (err, rows) => {
            if (err) {
                resolve([]);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('categories:get', async () => {
  const db = getDb();
    return new Promise((resolve) => {
        const sql = `
            SELECT DISTINCT category 
            FROM products 
            WHERE category IS NOT NULL AND category != '' 
            ORDER BY category
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("Erro ao buscar categorias:", err);
                resolve([]);
            } else {
                resolve(rows.map(row => row.category));
            }
        });
    });
});

// --- NOVA FUNÇÃO PARA PROCESSAR A VENDA ---

ipcMain.handle('sale:finalize', async (event, saleData) => {
  const db = getDb();
  const { items, total, paymentMethod } = saleData;

  return new Promise((resolve) => {
    db.serialize(() => {
      // Inicia uma transação para garantir que tudo aconteça ou nada aconteça
      db.run('BEGIN TRANSACTION;');

      const saleSql = 'INSERT INTO sales (total, payment_method) VALUES (?, ?)';
      db.run(saleSql, [total, paymentMethod], function (err) {
        if (err) {
          db.run('ROLLBACK;');
          return resolve({ success: false, message: err.message });
        }

        const saleId = this.lastID;
        const itemsPromises = items.map(item => {
          return new Promise((itemResolve, itemReject) => {
            const itemSql = 'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
            // Estamos a vender 1 unidade de cada item clicado
            db.run(itemSql, [saleId, item.id, 1, item.price], function (itemErr) {
              if (itemErr) return itemReject(itemErr);

              // Atualiza o estoque do produto
              const stockSql = 'UPDATE products SET stock = stock - 1 WHERE id = ?';
              db.run(stockSql, [item.id], function (stockErr) {
                if (stockErr) return itemReject(stockErr);
                itemResolve();
              });
            });
          });
        });

        Promise.all(itemsPromises)
          .then(() => {
            db.run('COMMIT;');
            resolve({ success: true });
          })
          .catch((transactionErr) => {
            db.run('ROLLBACK;');
            resolve({ success: false, message: transactionErr.message });
          });
      });
    });
  });
});