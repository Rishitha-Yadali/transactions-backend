// const express = require('express')
// const app = express()

// const {open} = require('sqlite')
// const sqlite3 = require('sqlite3')
// const path = require('path')

// const dbPath = path.join(__dirname, 'transactions.db')
// const bcrypt = require('bcrypt')
// const jwt = require('jsonwebtoken')
// app.use(express.json())

// let db = null
// const initateDBAndServer = async () => {
//   try {
//     db = await open({
//       filename: dbPath,
//       driver: sqlite3.Database,
//     })

//     app.listen(3000, () => {
//       console.log('Server Running http://localhost:3000')
//     })
//   } catch (error) {
//     console.log(`DB Error..${error.message}`)
//     process.exit(1)
//   }
// }
// initateDBAndServer()


// app.js
const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'transactions.db');
let db = null;

// Function to initialize the database and server
const initiateDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Initialize the database schema
    await initializeDatabase();

    app.listen(3000, () => {
      console.log('Server Running http://localhost:3000');
    });
  } catch (error) {
    console.log(`DB Error..${error.message}`);
    process.exit(1);
  }
};

// Function to create the necessary tables
const initializeDatabase = async () => {
  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL
    );`;

  const createTransactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT
    );`;

  await db.exec(createCategoriesTable);
  await db.exec(createTransactionsTable);
};

initiateDBAndServer();



// POST /transactions - Adds a new transaction (income or expense)
app.post('/transactions', async (req, res) => {
  const { type, category, amount, date, description } = req.body;

  // Check if category exists
  const categoryQuery = `SELECT * FROM categories WHERE name = ? AND type = ?`;
  const existingCategory = await db.get(categoryQuery, [category, type]);

  // If category does not exist, add it
  if (!existingCategory) {
    const insertCategoryQuery = `INSERT INTO categories (name, type) VALUES (?, ?)`;
    await db.run(insertCategoryQuery, [category, type]);
  }

  const query = `INSERT INTO transactions (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)`;
  
  try {
    const result = await db.run(query, [type, category, amount, date, description]);
    res.status(201).send("Transaction successfully added")
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// GET /transactions - Retrieves all transactions
app.get("/transactions", async (req, res) => {
  const getTransactionsQuery = `SELECT * FROM transactions;`;
  const transactions = await db.all(getTransactionsQuery);
  res.send(transactions);
});

// GET /transactions/:id - Retrieves a transaction by ID
app.get('/transactions/:id', async (req, res) => {
  const query = `SELECT * FROM transactions WHERE id = ?`;
  
  try {
    const transaction = await db.get(query, [req.params.id]);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /transactions/:id - Updates a transaction by ID
app.put('/transactions/:id', async (req, res) => {
  const { type, category, amount, date, description } = req.body;

  const query = `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, description = ? WHERE id = ?`;
  
  try {
    const existingTransaction = await db.get(`SELECT * FROM transactions WHERE id = ?`, [req.params.id]);
    
    // Check if the category has changed
    if (existingTransaction && existingTransaction.category !== category) {
      // Check if the new category exists
      const categoryQuery = `SELECT * FROM categories WHERE name = ? AND type = ?`;
      const existingCategory = await db.get(categoryQuery, [category, type]);
      
      // If category does not exist, add it
      if (!existingCategory) {
        const insertCategoryQuery = `INSERT INTO categories (name, type) VALUES (?, ?)`;
        await db.run(insertCategoryQuery, [category, type]);
      }
    }

    const result = await db.run(query, [type, category, amount, date, description, req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.send("Transaction successfully updated" );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /transactions/:id - Deletes a transaction by ID
app.delete('/transactions/:id', async (req, res) => {
  const query = `DELETE FROM transactions WHERE id = ?`;
  
  try {
    const transaction = await db.get(`SELECT category FROM transactions WHERE id = ?`, [req.params.id]);
    const result = await db.run(query, [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Check if the category can be deleted
    const categoryQuery = `SELECT COUNT(*) as count FROM transactions WHERE category = ?`;
    const categoryCount = await db.get(categoryQuery, [transaction.category]);

    // If no transactions are using the category, delete it
    if (categoryCount.count === 0) {
      await db.run(`DELETE FROM categories WHERE name = ?`, [transaction.category]);
    }

    res.json({ deleted: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /summary - Retrieves a summary of transactions
app.get('/summary', async (req, res) => {
  const query = `
      SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses
      FROM transactions;
  `;
  
  try {
    const row = await db.get(query);
    row.balance = row.total_income - row.total_expenses;
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
