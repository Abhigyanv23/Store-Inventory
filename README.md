# Full-Stack Inventory Management System

Enterprise-grade inventory, stock tracking, and dashboard analytics — built with React, Node.js, and MySQL.

<p align="center"> <img src="https://img.shields.io/badge/Frontend-React-blue" /> <img src="https://img.shields.io/badge/Backend-Node.js-green" /> <img src="https://img.shields.io/badge/Database-MySQL-orange" /> <img src="https://img.shields.io/badge/Status-Production%20Ready-success" /> </p>

# Overview

The Full-Stack Inventory Management System is a scalable and secure solution for managing real-world business inventory operations.

It includes:

* Role-based access

* Complete stock audit trail

* Dashboard analytics & visualizations

* Paginated + filterable product management

* Export & reporting features

The system is optimized for speed, security, and clean UI/UX.

# Screenshot
<p align="center"> <img width="80%" src="https://github.com/user-attachments/assets/a504648c-1fe0-466d-b9b3-cb9c26fb6541" /> </p>

# Features
 **1. Security & Authentication**

* JWT-based authentication

* Passwords hashed using bcryptjs

* Protected routes for all sensitive endpoints

* First user → Admin

* Subsequent users → Staff

 **2. User Roles & Permissions**<br>
 <br>
***Admin***

* Full CRUD on Products, Categories, Suppliers

* Access to Stock Audit Logs

* Export products to CSV

* Full dashboard filters enabled

* Can edit all product fields

***Staff***

* View-only access to dashboard & product list

* Can only update quantity, minimum stock

* No access to add product, delete product

* Cannot manage (categories/suppliers), view logs, export

 **3. Interactive Dashboard**

* Total Products

* Total Stock Value

* Low Stock Count

* Out of Stock Count

* Pie Chart: Products by Category

* Bar Chart: Top 5 Products by Stock Value

* Date-Range Filtering for all charts
