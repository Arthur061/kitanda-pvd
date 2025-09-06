const { app } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(app.getPath('userData'), 'kitanda.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        category TEXT
      )
    `);


    const adminUser = 'admin';
    db.get('SELECT * FROM users WHERE username = ?', [adminUser], (err, row) => {
      if (!row) {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync('1234', salt);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [adminUser, hashedPassword], (insertErr) => {
          if (!insertErr) {
            console.log('Banco de dados inicializado. Usuário "admin" criado com senha "1234".');
          }
        });
      }
    });
  });
};

module.exports = { db, initDb };