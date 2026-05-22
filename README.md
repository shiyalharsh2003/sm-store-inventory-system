# Small Business Inventory Manager 📦

An ultra-premium, full-stack web application designed for small shop owners and retail merchants to manage their catalogs, trace real-time stock balances, receive visual low-stock warning banners, and compile sales transactions audit logs.

Designed to scale seamlessly from manual spreadsheets to a fully automated relational client-server layout.

---

## 🚀 Key Features

* **High-Fidelity Dashboard Analytics:** Dynamic dashboards showing real-time product counts, overall stock valuation assets (in INR), cumulative sales turnover, and a rolling 7-day visual sales trend chart.
* **Point of Sale (POS) Sales Register:** A split-pane register where merchants search products, simulate barcode scanners via instant SKU lookup, increment cart counts, calculate taxes/bills, and record checkout sales (Stock OUT).
* **Inventory Control & Alerts:** Visual low-stock banners, blinking amber widgets, and immediate reorder replenishment recommendations. Can trigger automatic email warnings via **Nodemailer** if configured.
* **Replenishment Workflows (Stock IN):** Instant single-click shortcut forms in the catalog lists to record restock supplies.
* **Suppliers Registry:** Maintain clean records of supplier businesses, emails, and phone numbers, binding them dynamically to catalog products.
* **Flexible Dual-Database Core (Zero-Config out-of-the-box):**
  1. **MySQL Mode:** High-performance Relational database with automatic table schema generation.
  2. **Local JSON Database File (`local_db.json`):** Dynamic, robust pure-JS in-memory transaction log database with realistic seeded records. It boots instantly without installing MySQL!
* **Alphanumeric CSV Data Exporter:** One-click tabular data exporters embedded inside Products, Suppliers, and Transactions audit lists.

---

## 🛠️ Technology Stack

* **Frontend Client:** React.js, Vite, Tailwind CSS (Class-based Dark Mode support), Recharts, Lucide-React.
* **Backend Server:** Node.js, Express.js, JWT Auth (sessions encryption), Bcrypt.js (salted password hashing), Nodemailer, MySQL2 driver client.
* **Database Engine:** MySQL (relational) or Local JSON seed file fallback.

---

## 🗄️ Relational Database Schema (MySQL)

If using MySQL, execute the following SQL scripts inside your database console (e.g., MySQL Workbench or phpMyAdmin):

```sql
-- 1. Create Database
CREATE DATABASE IF NOT EXISTS `store_mgt`;
USE `store_mgt`;

-- 2. Users Table (JWT Authentications)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Suppliers Table (Directory)
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products Catalog Table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  min_stock_level INT NOT NULL DEFAULT 5,
  supplier_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- 5. Stock Transactions Ledger (Audit Trail)
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  transaction_type ENUM('IN', 'OUT') NOT NULL,
  quantity INT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

---

## ⚙️ Quick Start Installation

Follow these simple steps to download packages and boot the entire client-server environment.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (version 16 or newer) installed.

### 1. Auto-Install All Dependencies
Run this command from the root workspace directory (`e:\store_mgt`) to install dependencies for the root coordinator, backend server, and frontend client:

```bash
npm run install:all
```

*This command automatically triggers sequential sub-directory package resolutions.*

### 2. Configure Environment Variables (Optional)
Check the `backend/.env` configuration file:
* Out of the box, the server uses the **Local JSON Database fallback** if no MySQL server is reachable.
* To connect MySQL, start your local MySQL server (like XAMPP or native service), make sure a database user exists, and set the parameters in `backend/.env`:
  ```env
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=your_mysql_password
  DB_NAME=store_mgt
  DB_PORT=3306
  ```

### 3. Launch Development Servers Together!
Run the master script in the root directory:

```bash
npm run dev
```

This single command triggers both:
* **Express API Server** on `http://localhost:5000`
* **Vite React UI** on `http://localhost:5173`

---

## 🔒 Security & Authentication Details
The client communicates via JWT sessions:
1. Register/Login at the portal (`POST /api/auth/register` or `/api/auth/login`).
2. The server encrypts user info, hashes passwords with `bcryptjs` (10 rounds), and generates an encrypted JWT token.
3. The React app stores the token in `localStorage` and automatically attaches it to the `Authorization: Bearer <token>` header of every outgoing Axios request using request interceptors.
4. If a token expires or is rejected (401), response interceptors automatically clear credentials and redirect to the auth portal.
