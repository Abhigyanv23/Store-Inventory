#Full-Stack Inventory Management System

This is a comprehensive, enterprise-ready inventory management application built from scratch. It provides a secure, multi-user environment for managing products, tracking stock levels, and analyzing inventory data through a dynamic dashboard.

The system is built with a React frontend, a secure Node.js/Express backend API, and a MySQL database. It features a complete authentication system with distinct user roles, a full audit trail for stock changes, and a paginated, filterable interface designed for scalability.

#Features

1. Security & Authentication

Secure JWT Authentication: The entire application is protected. Access is granted via jsonwebtoken (JWT) after successful login.

Password Hashing: User passwords are never stored in plain text. They are securely hashed using bcryptjs.

Login & Registration: Users can securely register new accounts and log in.

Admin-First Registration: The first user to register is automatically assigned the "admin" role. All subsequent users default to "staff".

2. User Roles & Permissions

The app has two distinct user roles with different capabilities:

Admin Role:

Full CRUD (Create, Read, Update, Delete) access to Products.

Full CRUD access to Categories and Suppliers via a dedicated "Manage" page.

Access to the Stock Audit Log to see a full history of all changes.

Ability to Export the product list to CSV.

Full access to all dashboard filters.

Staff Role:

View-only access to the dashboard and product list.

Limited Edit Power: Can only update the Quantity and Min. Stock of a product. All other fields (Name, Price, SKU, etc.) are locked.

No Access to "Manage," "Logs," "Add Product," "Delete Product," or "Export" features.

3. Interactive Dashboard

At-a-Glance Stats: Real-time cards for Total Products, Total Stock Value, Low Stock Items, and Out of Stock Items.

Data Visualization:

Products by Category: A dynamic pie chart.

Top 5 Products by Stock Value: A dynamic bar chart.

Date-Range Filtering: Users can select a "Start Date" and "End Date" to filter the charts, showing only products added within that period.

4. Product & Data Management

Full Product List: A paginated list of all products, showing stock status and details.

Advanced Filtering: Filter the product list by Search (Name/SKU), Category, Supplier, and Stock Status.

Pagination: The product list is paginated (20 items per page) to ensure fast performance, even with thousands of products.

Export to CSV: (Admin) Download the complete, filtered product list as a .csv file.

5. Stock Audit Log (Admin Only)

Full Accountability: A dedicated page showing the 200 most recent stock changes.

Detailed Records: Each log entry records the User, Product, Old Quantity, New Quantity, Reason (e.g., "Stock Update," "Product Created"), and a precise Timestamp.

#Tech Stack

Frontend:

React (with Hooks & Functional Components)

react-datepicker (for date filtering)

recharts (for charts)

axios (for API requests)

lucide-react (for icons)

Standard CSS Modules

Backend:

Node.js & Express

mysql2 (database driver)

jsonwebtoken (for authentication)

bcryptjs (for password hashing)

json2csv (for CSV export)

cors & dotenv

Database:

MySQL

#Getting Started

Follow these instructions to get the project running on your local machine.

Prerequisites

Node.js (which includes npm)

MySQL Workbench (or any MySQL client)

1. Clone the Repository

git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name


2. Backend Setup

Navigate to the backend folder:

cd backend


Install all required npm packages:

npm install


Create a .env file in the backend folder and add your credentials. The JWT_SECRET is new and required.

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=inventory_system
PORT=5000
JWT_SECRET=a-very-long-and-random-secret-key-123!@#


Start the backend server:

npm run dev


The server will be running at http://localhost:5000.

3. Database Setup

Open MySQL Workbench and connect to your local server.

Run the following single SQL command:

CREATE DATABASE inventory_system;


The backend server will automatically create all 5 tables (users, products, categories, suppliers, stock_logs) and insert sample data on its first run.

4. Frontend Setup

Open a new terminal and navigate to the frontend folder:

cd frontend


Install all required npm packages:

npm install


Start the React application:

npm start


Your browser will automatically open to http://localhost:3000.

5. First Use

You will be on the login page. Click "Need an account? Register".

Create your first user. This account will be the Admin.

You will be sent back to the login page. Log in with the account you just created.

You will have full access to all features.
