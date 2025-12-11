<?php
// normal/add_item.php
require_once __DIR__ . '/../db.php';

$name = '';
$quantity = '';
$price = '';
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name     = trim($_POST['item_name'] ?? '');
    $quantity = trim($_POST['quantity'] ?? '');
    $price    = trim($_POST['price'] ?? '');

    if ($name === '' || $quantity === '' || $price === '') {
        $error = 'Please fill in all fields.';
    } elseif (!is_numeric($quantity) || (int)$quantity < 0) {
        $error = 'Quantity must be a non-negative number.';
    } elseif (!is_numeric($price) || (float)$price < 0) {
        $error = 'Price must be a non-negative number.';
    } else {
        $sql = "INSERT INTO items (item_name, quantity, price) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $qty = (int)$quantity;
        $prc = (float)$price;
        $stmt->bind_param('sid', $name, $qty, $prc);

        if ($stmt->execute()) {
            $success = 'Item added successfully.';
            // Clear fields
            $name = $quantity = $price = '';
        } else {
            $error = 'Failed to add item. Please try again.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Add Item</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
    rel="stylesheet"
  >
  <style>
    body { background: #020617; color: #e5e7eb; }
    .card { border-radius: 1rem; }
  </style>
</head>
<body>

<nav class="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary mb-3">
  <div class="container-fluid">
    <a class="navbar-brand" href="index.php">Inventory System</a>
    <div class="d-flex">
      <a class="btn btn-outline-light btn-sm me-2" href="list_items.php">Item List</a>
      <a class="btn btn-outline-info btn-sm" href="../game/hub.php">Game Mode</a>
    </div>
  </div>
</nav>

<div class="container py-4">
  <div class="row justify-content-center">
    <div class="col-md-6">
      <div class="card bg-dark text-light shadow-sm">
        <div class="card-body">
          <h2 class="h4 mb-3">Add New Item</h2>
          <p class="text-secondary mb-3">
            Fill in the details below to insert a new record into the inventory.
          </p>

          <?php if ($error): ?>
            <div class="alert alert-danger py-2"><?php echo htmlspecialchars($error); ?></div>
          <?php endif; ?>
          <?php if ($success): ?>
            <div class="alert alert-success py-2"><?php echo htmlspecialchars($success); ?></div>
          <?php endif; ?>

          <form method="post" novalidate>
            <div class="mb-3">
              <label for="item_name" class="form-label">Item Name</label>
              <input
                type="text"
                class="form-control"
                id="item_name"
                name="item_name"
                value="<?php echo htmlspecialchars($name); ?>"
                required
              >
            </div>

            <div class="mb-3">
              <label for="quantity" class="form-label">Quantity</label>
              <input
                type="number"
                class="form-control"
                id="quantity"
                name="quantity"
                min="0"
                value="<?php echo htmlspecialchars($quantity); ?>"
                required
              >
            </div>

            <div class="mb-3">
              <label for="price" class="form-label">Price (RM)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                class="form-control"
                id="price"
                name="price"
                value="<?php echo htmlspecialchars($price); ?>"
                required
              >
            </div>

            <div class="d-flex justify-content-between">
              <a href="list_items.php" class="btn btn-outline-light">Cancel</a>
              <button type="submit" class="btn btn-success">Save Item</button>
            </div>
          </form>

        </div>
      </div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
