const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const bcrypt = require('bcrypt');
const { initDb, getDb } = require('./database.js');

// Variável para manter a referência da janela principal
let mainWindow;
let currentUser;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });
  mainWindow.maximize();
  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, '../renderer/views/index.html'));

  // Garante que a referência seja limpa quando a janela for fechada
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const createLoginWindow = () => {
  const loginWindow = new BrowserWindow({
    width: 500,
    height: 650,
    resizable: false,
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });
  loginWindow.setMenu(null);
  loginWindow.loadFile(path.join(__dirname, '../renderer/views/login.html'));
};

const createRegisterWindow = () => {
  const registerWindow = new BrowserWindow({
    width: 500,
    height: 650,
    resizable: false,
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });
  registerWindow.setMenu(null);
  registerWindow.loadFile(path.join(__dirname, '../renderer/views/register.html'));
};

const createProductsWindow = () => {
  const productsWindow = new BrowserWindow({
    width: 900,
    height: 700,
    parent: mainWindow, // A janela principal é sempre o "pai"
    modal: true,
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });
  productsWindow.setMenu(null);
  productsWindow.loadFile(path.join(__dirname, '../renderer/views/produtos.html'));
};

const createManagementWindow = () => {
  const managementWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    parent: mainWindow, // A janela principal é sempre o "pai"
    modal: true,
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });
  managementWindow.setMenu(null);
  managementWindow.loadFile(path.join(__dirname, '../renderer/views/gerenciamento.html'));
};

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


// --- IPC Listeners ---

// Navegação entre janelas de login/registro
ipcMain.on('navigate:to-register', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
    createRegisterWindow();
});
ipcMain.on('navigate:to-login', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
    createLoginWindow();
});

// Abertura de janelas modais a partir da principal
ipcMain.on('open-products-window', createProductsWindow);
ipcMain.on('open-management-window', createManagementWindow);

// Comunicação para atualização de dados
ipcMain.on('products-changed', () => {
    // Envia o evento de atualização apenas para a `mainWindow` se ela existir
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-products-list');
    }
});


// Handlers de banco de dados
ipcMain.handle('login:submit', async (event, username, password) => {
    const db = getDb();
    return new Promise((resolve) => {
        const sql = 'SELECT * FROM users WHERE username = ?';
        db.get(sql, [username], (err, user) => {
            if (err) return resolve({ success: false, message: 'Erro no banco de dados.' });
            if (!user) return resolve({ success: false, message: 'Utilizador não encontrado.' });

            const passwordIsValid = bcrypt.compareSync(password, user.password);
            if (passwordIsValid) {
                currentUser = { username: user.username, role: user.role };
                createMainWindow();
                BrowserWindow.fromWebContents(event.sender)?.close();
                resolve({ success: true, user: currentUser });
            } else {
                resolve({ success: false, message: 'Senha incorreta.' });
            }
        });
    });
});

ipcMain.handle('auth:get-current-user', () => currentUser);

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
        const sql = 'SELECT * FROM products ORDER BY name COLLATE NOCASE';
        db.all(sql, [], (err, rows) => {
            if (err) { resolve([]); } else { resolve(rows); }
        });
    });
});

ipcMain.handle('products:update', async (event, { id, product }) => {
    const db = getDb();
    return new Promise((resolve) => {
        const { name, price, stock, category, min_stock } = product;
        const sql = 'UPDATE products SET name = ?, price = ?, stock = ?, category = ?, min_stock = ? WHERE id = ?';
        db.run(sql, [name, price, stock, category, min_stock, id], function(err) {
            if (err) {
                resolve({ success: false, message: err.message });
            } else {
                resolve({ success: true });
            }
        });
    });
});

ipcMain.handle('products:delete', async (event, id) => {
    const db = getDb();
    return new Promise((resolve) => {
        const sql = 'DELETE FROM products WHERE id = ?';
        db.run(sql, [id], function(err) {
            if (err) {
                resolve({ success: false, message: err.message });
            } else {
                resolve({ success: true });
            }
        });
    });
});

ipcMain.handle('categories:get', async () => {
  const db = getDb();
    return new Promise((resolve) => {
        const sql = `SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category`;
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

ipcMain.handle('sale:finalize', async (event, saleData) => {
  const db = getDb();
  const { items, total, paymentMethod } = saleData;
  return new Promise((resolve) => {
    db.serialize(() => {
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
            db.run(itemSql, [saleId, item.id, 1, item.price], function (itemErr) {
              if (itemErr) return itemReject(itemErr);
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

// <<<<<<<<<<<<<<< INÍCIO DA MODIFICAÇÃO >>>>>>>>>>>>>>>>>
ipcMain.handle('reports:get-sales-by-date', async (event, date) => {
  const db = getDb();
  return new Promise((resolve) => {
    const sql = `
      SELECT
        s.id as sale_id,
        s.total as sale_total,
        s.payment_method,
        s.created_at,
        p.name as product_name,
        si.price as item_price
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE date(s.created_at) = ?
      ORDER BY s.created_at DESC;
    `;
    db.all(sql, [date], (err, rows) => {
      if (err) {
        console.error("Erro ao buscar relatório de vendas detalhado:", err);
        return resolve([]);
      }
      
      // Agrupa os itens de produto dentro de cada venda
      const salesById = {};
      rows.forEach(row => {
        if (!salesById[row.sale_id]) {
          salesById[row.sale_id] = {
            id: row.sale_id,
            total: row.sale_total,
            paymentMethod: row.payment_method,
            createdAt: row.created_at,
            items: []
          };
        }
        salesById[row.sale_id].items.push({
          name: row.product_name,
          price: row.item_price
        });
      });

      // Converte o objeto de volta para um array
      const detailedSales = Object.values(salesById);
      resolve(detailedSales);
    });
  });
});

ipcMain.handle('reports:get-products-to-restock', async () => {
  const db = getDb();
  return new Promise((resolve) => {
    const sql = 'SELECT * FROM products WHERE stock <= min_stock ORDER BY stock ASC';
    db.all(sql, [], (err, rows) => {
      if (err) { resolve([]); } else { resolve(rows); }
    });
  });
});