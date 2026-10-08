const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const db = new sqlite3.Database("./orders.db", (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Create Orders Table
db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderType TEXT,
    customerName TEXT,
    phone TEXT,
    pizzaType TEXT,
    size TEXT,
    toppings TEXT,
    instructions TEXT,
    total REAL,
    orderDate DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
db.run(`
  ALTER TABLE orders
  ADD COLUMN status TEXT DEFAULT 'Pending'
`, (err) => {
  // Ignore error if column already exists
});
db.run(`
  ALTER TABLE orders
  ADD COLUMN orderType TEXT DEFAULT 'Pizza'
`, (err) => {
  // Ignore error if column already exists
});
// Home Route
app.get("/", (req, res) => {
  res.send("Rollin Dough API Running!");
});

// Save Pizza Order
app.post("/api/orders", (req, res) => {
  const {
    customerName,
    phone,
    pizzaType,
    size,
    toppings,
    instructions,
    total,
    orderType
  } = req.body;

  db.run(
    `
  INSERT INTO orders
(customerName, phone, pizzaType, size, toppings, instructions, total, orderType)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      customerName,
      phone,
      pizzaType,
      size,
      JSON.stringify(toppings),
      instructions,
      total,
      orderType || "Pizza"
    ],
    function (err) {
      if (err) {
        console.error("Database error:", err.message);

        return res.status(500).json({
          success: false,
          message: "Database error"
        });
      }

      console.log("Order saved! ID:", this.lastID);

      res.json({
        success: true,
        message: "Order received!",
        orderId: this.lastID
      });
    }
  );
});

// View All Orders
app.get("/api/orders", (req, res) => {
  db.all(
    "SELECT * FROM orders ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      res.json(rows);
    }
  );
});

// Admin Page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin-orders.html"));
});

// Test Route
app.get("/test", (req, res) => {
  res.send("Test route works");
});
app.put("/api/orders/:id/status", (req, res) => {

  const { status } = req.body;

  db.run(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, req.params.id],
    function (err) {

      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }

      res.json({
        success: true,
        message: "Status updated"
      });

    }
  );

});
app.delete("/api/orders/completed", (req, res) => {

  db.run(
    "DELETE FROM orders WHERE status = 'Completed'",
    function(err) {

      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }

      res.json({
        success: true,
        deleted: this.changes
      });

    }
  );

});
// Start Server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});