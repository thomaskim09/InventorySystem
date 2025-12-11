<?php
// normal/index.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inventory System - Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Bootstrap 5 -->
  <link
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
    rel="stylesheet"
  >

  <style>
    body {
      background: radial-gradient(circle at top, #0f172a, #020617);
      min-height: 100vh;
      color: #e5e7eb;
    }
    .card {
      border-radius: 1rem;
    }
    .btn-main {
      min-width: 180px;
    }
  </style>
</head>
<body>

<nav class="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">Inventory System</a>
    <div class="d-flex">
      <a class="btn btn-outline-light btn-sm me-2" href="../index.php">Mode Selector</a>
      <a class="btn btn-outline-info btn-sm" href="../game/hub.php">Game Mode</a>
    </div>
  </div>
</nav>

<div class="container py-5">
  <div class="row justify-content-center mb-4">
    <div class="col-lg-8 text-center">
      <h1 class="display-6 fw-semibold text-light mb-3">Normal Inventory Mode</h1>
      <p class="text-secondary">
        This is the standard PHP + MySQL version used for the assignment marking.
        You can add, edit, delete and view items in a clean interface.
      </p>
    </div>
  </div>

  <div class="row justify-content-center g-4">
    <div class="col-md-5">
      <div class="card shadow-sm bg-dark text-light">
        <div class="card-body text-center">
          <h5 class="card-title mb-3">View Inventory</h5>
          <p class="card-text text-secondary">
            Browse all items, search by name, and navigate to edit or delete actions.
          </p>
          <a href="list_items.php" class="btn btn-primary btn-main">
            Open Item List
          </a>
        </div>
      </div>
    </div>
    <div class="col-md-5">
      <div class="card shadow-sm bg-dark text-light">
        <div class="card-body text-center">
          <h5 class="card-title mb-3">Add New Item</h5>
          <p class="card-text text-secondary">
            Quickly insert a new record into the inventory with validation.
          </p>
          <a href="add_item.php" class="btn btn-success btn-main">
            Add Item
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
