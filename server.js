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
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      transaction_type TEXT CHECK(transaction_type IN ('DEPOSIT', 'WITHDRAWAL')) NOT NULL,
      user_id INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED')) DEFAULT 'PENDING'
  );
`;
await db.exec(createTableQuery);
};

initiateDBAndServer();



// POST /api/transactions - Create a new transaction
app.post('/api/transactions', async (req, res) => {
  const { amount, transaction_type, user_id } = req.body;

  if (!amount || !transaction_type || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
      const query = `
          INSERT INTO transactions (amount, transaction_type, user_id)
          VALUES (?, ?, ?);
      `;
      const result = await db.run(query, [amount, transaction_type, user_id]);
      const transactionId = result.lastID;

      const newTransaction = await db.get(
          `SELECT * FROM transactions WHERE id = ?`,
          [transactionId]
      );
      res.status(201).json(newTransaction);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions - Retrieve transactions for a user
app.get('/api/transactions', async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
      return res.status(400).json({ error: 'Query parameter "user_id" is required' });
  }

  try {
      const query = `SELECT * FROM transactions WHERE user_id = ?`;
      const transactions = await db.all(query, [user_id]);
      res.status(200).json({ transactions });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/:id - Get a specific transaction
app.get('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;

  try {
      const transaction = await db.get(`SELECT * FROM transactions WHERE id = ?`, [id]);

      if (!transaction) {
          return res.status(404).json({ error: 'Transaction not found' });
      }

      res.status(200).json(transaction);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// PUT /api/transactions/:id - Update transaction status
app.put('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
  }

  try {
      const query = `UPDATE transactions SET status = ? WHERE id = ?`;
      const result = await db.run(query, [status, id]);

      if (result.changes === 0) {
          return res.status(404).json({ error: 'Transaction not found' });
      }

      const updatedTransaction = await db.get(
          `SELECT * FROM transactions WHERE id = ?`,
          [id]
      );
      res.status(200).json(updatedTransaction);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});
