<?php
// db.php - central database connection file

$host = 'localhost';
$user = 'root';        // default in XAMPP
$password = '';        // default empty
$database = 'inventory_db';

$conn = new mysqli($host, $user, $password, $database);

// Check connection
if ($conn->connect_error) {
    die('Database connection failed: ' . $conn->connect_error);
}

// Optional: set character set
$conn->set_charset('utf8mb4');

// Alias for compatibility if any code still expects $mysqli
$mysqli = $conn;
