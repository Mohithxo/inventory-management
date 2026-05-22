# Inventory Management System

A simple web application to manage purchased items — built with **Node.js**, **Express.js**, and **MySQL**.

---

## What This App Does

- Add multiple items in a single purchase using a dynamic form
- View all items in a clean table with item type, purchase date, and stock status
- Edit or delete any item directly from the table
- All data is saved to a MySQL database

---

## Tech Stack

| Layer    | Technology         |
|----------|--------------------|
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Backend  | Node.js + Express.js |
| Database | MySQL              |

---

## Project Structure

```
inventory-management/
├── public/
│   ├── index.html       # Main UI page
│   ├── style.css        # All styling
│   └── script.js        # Frontend logic (form, table, CRUD)
├── routes/
│   └── items.js         # All API routes (GET, POST, PUT, DELETE)
├── db.js                # MySQL database connection
├── server.js            # Express server setup
├── database.sql         # Database schema + seed data
├── .env                 # Environment config (DB credentials)
└── package.json         # Project dependencies
```

---

## How to Run This Project Locally

### 1. Prerequisites
Make sure you have these installed:
- [Node.js](https://nodejs.org/) (v16 or above)
- [XAMPP](https://www.apachefriends.org/) or any MySQL server

---

### 2. Set Up the Database

1. Start **MySQL** (via XAMPP or any MySQL tool)
2. Open **phpMyAdmin** → go to the **SQL** tab
3. Copy and paste the contents of `database.sql` and click **Go**

This will automatically create:
- The `inventory_db` database
- The `item_types` table (with 8 default categories)
- The `items` table

---

### 3. Configure Environment Variables

Open the `.env` file and update your MySQL password:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=inventory_db
PORT=3000
```

> If you are using XAMPP with default settings, leave `DB_PASSWORD=` empty.

---

### 4. Install Dependencies

```bash
npm install
```

---

### 5. Start the Server

```bash
npm start
```

---

### 6. Open the App

Visit **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Endpoint          | Description                  |
|--------|-------------------|------------------------------|
| GET    | /api/item-types   | Fetch all item type options  |
| GET    | /api/items        | Fetch all items (with JOIN)  |
| POST   | /api/items        | Add one or more items        |
| PUT    | /api/items/:id    | Update an existing item      |
| DELETE | /api/items/:id    | Delete an item               |

---

## Database Design

```
item_types                     items
-----------                    -------------------------
id (PK)                        id (PK)
type_name                      name
                               purchase_date
                               stock_available
                               item_type_id (FK) ──────> item_types.id
                               created_at
```

A **JOIN** is used when fetching items to get the type name from the `item_types` table.

---

## Features Implemented

- Multi-item form (add as many items as needed in one purchase)
- Backend validation for all required fields
- Graceful error messages returned to the frontend
- Color-coded stock status badges (In Stock / Out of Stock)
- Edit modal with pre-filled values
- Delete with confirmation dialog
- Responsive design (works on mobile too)
