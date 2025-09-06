// main.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const bcrypt = require('bcrypt');
const { db, initDb } = require('./database.js');

let currentWindow;

// --- FUNÇÕES DE CRIAÇÃO DE JANELAS ---
const createMainWindow = () => {
  currentWindow = new BrowserWindow({
    width: 1200, height: 800,
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  currentWindow.maximize();
  currentWindow.setMenu(null);
  currentWindow.loadFile('index.html');
};

const createLoginWindow = () => {
  currentWindow = new BrowserWindow({
    width: 500, height: 650, resizable: false,
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  currentWindow.setMenu(null);
  currentWindow.loadFile('login.html');
};

const createRegisterWindow = () => {
  currentWindow = new BrowserWindow({
    width: 500, height: 650, resizable: false,
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  currentWindow.setMenu(null);
  currentWindow.loadFile('register.html');
};

// --- NOVA JANELA DE PRODUTOS ---
const createProductsWindow = () => {
    const productsWindow = new BrowserWindow({
        width: 900, height: 700,
        parent: currentWindow, // Define a janela principal como "pai"
        modal: true, // Bloqueia a interação com a janela "pai"
        icon: path.join(__dirname, 'assets/icon.ico'),
        webPreferences: { preload: path.join(__dirname, 'preload.js') },
    });
    productsWindow.setMenu(null);
    productsWindow.loadFile('produtos.html');
};

// --- CICLO DE VIDA DA APLICAÇÃO ---
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


// --- COMUNICAÇÃO IPC ---

// Navegação
ipcMain.on('navigate:to-register', () => { currentWindow.close(); createRegisterWindow(); });
ipcMain.on('navigate:to-login', () => { currentWindow.close(); createLoginWindow(); });
ipcMain.on('open-products-window', createProductsWindow);

// Login e Registo
  ipcMain.handle('login:submit', async (event, username, password) => {
    console.log(`--- Tentativa de Login ---`);
    console.log(`Utilizador recebido: '${username}'`);
    console.log(`Senha recebida: '${password}'`);

    return new Promise((resolve) => {
      const sql = 'SELECT * FROM users WHERE username = ?';
      db.get(sql, [username], (err, user) => {
        if (err) {
          console.error('ERRO NO BANCO DE DADOS:', err);
          resolve({ success: false, message: 'Erro no servidor. Tente novamente.' });
          return;
        }

        if (!user) {
          console.log('RESULTADO: Utilizador não encontrado na base de dados.');
          resolve({ success: false, message: 'Utilizador não encontrado.' });
          return;
        }

        console.log('Utilizador encontrado:', user);

        // Compara a senha digitada com a senha criptografada do banco de dados
        console.log('A comparar senhas...');
        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (passwordIsValid) {
          console.log('RESULTADO: Senha válida! A abrir a janela principal.');
          createMainWindow();
          BrowserWindow.fromWebContents(event.sender).close();
          resolve({ success: true });
        } else {
          console.log('RESULTADO: Senha incorreta.');
          resolve({ success: false, message: 'Senha incorreta.' });
        }
      });
    });
  });
  ipcMain.handle('register:submit', async (event, username, password) => {
    console.log(`--- Tentativa de Registo ---`);
    console.log(`Utilizador para registar: '${username}'`);
    console.log(`Senha para registar: '${password}'`);

    return new Promise((resolve) => {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      console.log(`Senha criptografada: ${hashedPassword.substring(0, 20)}...`); // Mostra um pedaço da senha criptografada

      const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
      db.run(sql, [username, hashedPassword], function (err) {
        if (err) {
          console.error('ERRO NO BANCO DE DADOS (Registo):', err);
          // O erro 'SQLITE_CONSTRAINT' indica que o username já existe
          if (err.code === 'SQLITE_CONSTRAINT') {
            console.log('RESULTADO: Falha, utilizador já existe.');
            resolve({ success: false, message: 'Este nome de utilizador já existe.' });
          } else {
            console.log('RESULTADO: Falha, erro desconhecido na base de dados.');
            resolve({ success: false, message: 'Erro ao registar no banco de dados.' });
          }
        } else {
          console.log(`RESULTADO: Sucesso! Utilizador '${username}' inserido com ID: ${this.lastID}`);
          resolve({ success: true, message: 'Utilizador registado com sucesso!' });
        }
      });
    });
  });

// --- NOVAS FUNÇÕES DO BANCO DE DADOS DE PRODUTOS ---

// Adicionar um produto
ipcMain.handle('products:add', async (event, product) => {
    return new Promise((resolve) => {
        const { name, price, stock, category } = product;
        const sql = 'INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)';
        db.run(sql, [name, price, stock, category], function(err) {
            if (err) {
                resolve({ success: false, message: err.message });
            } else {
                resolve({ success: true, id: this.lastID });
            }
        });
    });
});

// Obter todos os produtos
ipcMain.handle('products:get', async () => {
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