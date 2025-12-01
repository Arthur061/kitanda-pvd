const { app } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

let db; 

const initDb = () => {
  // A criação do caminho e a conexão com o banco foram movidas para DENTRO desta função
  const dbPath = path.join(app.getPath('userData'), 'kitanda.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Erro ao abrir o banco de dados', err.message);
    } else {
      console.log('Conectado ao banco de dados SQLite.');
    }
  });

  db.serialize(() => {
    // Tabela de usuários com a nova coluna 'role'
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
      )
    `);

    // Tabela de produtos com a nova coluna 'min_stock'
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        category TEXT,
        min_stock INTEGER NOT NULL DEFAULT 5
      )
    `);

    // Tabela para guardar cada venda (transação)
    db.run(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        payment_method TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        seller_name TEXT  -- Nova coluna para o vendedor
      )
    `, (err) => {
        // Tenta adicionar a coluna caso a tabela já exista (Migração para versões antigas)
        if (!err) {
            db.run("ALTER TABLE sales ADD COLUMN seller_name TEXT", (alterErr) => {
                // Se der erro é porque a coluna já existe, então ignoramos
            });
        }
    });

    // Tabela para guardar os itens de cada venda
    db.run(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL, 
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // Lógica para criar o usuário 'admin' e garantir que ele tenha a role 'admin'
    const adminUser = 'kitanda';
    db.get('SELECT * FROM users WHERE username = ?', [adminUser], (err, row) => {
      if (!row) {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync('kitanda2025', salt);
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [adminUser, hashedPassword, 'admin'], (insertErr) => {
          if (!insertErr) {
            console.log('Banco de dados inicializado. Usuário "admin" criado com senha "1234".');
          }
        });
      } else {
        db.run("UPDATE users SET role = 'admin' WHERE username = 'admin'");
      }
    });
  });
};

const getDb = () => db;

module.exports = { initDb, getDb };