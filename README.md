# Personal Expense Tracker API

## Setup and Run Instructions

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the server:

   ```bash
   node app.js
   ```

4. API will be available at `http://localhost:3000`

## API Documentation

### Transactions

- **POST /api/transactions**

  - Request Body:
    ```json
    {
      "amount": 1000,
      "transaction_type": "DEPOSIT",
      "user_id": 1
    }
    ```
  - Description: Create a new transaction. This endpoint expects the transaction amount, type (either 'DEPOSIT' or 'WITHDRAWAL'), and the user ID.
  - Response:
    ```json
    {
      "id": 1,
      "amount": 1000,
      "transaction_type": "DEPOSIT",
      "user_id": 1,
      "timestamp": "2024-11-21T10:00:00",
      "status": "PENDING"
    }
    ```

- **GET /api/transactions**

  - Query Parameters:
    - `user_id` (required)
  - Description: Retrieve all transactions for a specific user. You must pass the `user_id` as a query parameter.
  - Example request: `GET /api/transactions?user_id=1`
  - Response:
    ```json
    {
      "transactions": [
        {
          "id": 1,
          "amount": 1000,
          "transaction_type": "DEPOSIT",
          "user_id": 1,
          "timestamp": "2024-11-21T10:00:00",
          "status": "PENDING"
        },
        ...
      ]
    }
    ```

- **GET /api/transactions/:id**

  - Description: Retrieve a specific transaction by its ID.
  - Response:
    ```json
    {
      "id": 1,
      "amount": 1000,
      "transaction_type": "DEPOSIT",
      "user_id": 1,
      "timestamp": "2024-11-21T10:00:00",
      "status": "PENDING"
    }
    ```

- **PUT /api/transactions/:id**
  - Request Body:
    ```json
    {
      "status": "COMPLETED"
    }
    ```
  - Description: Update the status of a transaction. Valid statuses are 'COMPLETED' or 'FAILED'.
  - Response:
    ```json
    {
      "id": 1,
      "amount": 1000,
      "transaction_type": "DEPOSIT",
      "user_id": 1,
      "timestamp": "2024-11-21T10:00:00",
      "status": "COMPLETED"
    }
    ```
- **Test Error Case: Transaction Not Found**

  - Request:
    ```http
    GET http://localhost:3000/api/transactions/99
    ```
  - Response:

    ```json
    {
      "error": "Transaction not found"
    }
    ```

  - **Test Error Case: Update Non-Existent Transaction**

    - Request:

      ```http
      PUT http://localhost:3000/api/transactions/99
      Content-Type: application/json

      {
        "status": "FAILED"
      }
      ```

    - Response:
      ```json
      {
        "error": "Transaction not found"
      }
      ```

    **Test Error Case: Missing Required Fields**

- **Request**:

  ```http
  POST http://localhost:3000/api/transactions
  Content-Type: application/json

  {
    "amount": 500
  }
  ```

- **Response**:
  ````json
  {
    "error": "Missing required fields"
  }
  ```  ```
  ````

### Database Schema

The `transactions` table is structured as follows:

```sql
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  transaction_type TEXT CHECK(transaction_type IN ('DEPOSIT', 'WITHDRAWAL')) NOT NULL,
  user_id INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED')) DEFAULT 'PENDING'
);



## API Call Screenshots



### 1. Post Transaction
![Post Transaction](screenshots\post_transaction.png)

### 2. Get All Transactions for a User
![Retrieve all transactions for a specific user](screenshots\get_transaction_by_user.png)

### 3. Get Transaction by ID
![Get Transaction by ID](screenshots\get_transactions_by_id.png)

### 4. Update Transaction
![Update Transaction](screenshots\put_transaction.png)

### 5. Transaction Not Found
![Get Transaction by ID](screenshots\not_found_transaction.png)

### 6. Update Non-Existent Transaction
![Update Transaction](screenshots\failed_put_transaction.png)

### 7. Missing Required Fields
![Create Transaction](screenshots\failed_put_transaction.png)
```
