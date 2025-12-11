<?php
// normal/delete_item.php
require_once __DIR__ . '/../db.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    header('Location: list_items.php');
    exit;
}

// Optional: fetch item name to show in confirmation message
$sql = "SELECT item_name FROM items WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $id);
$stmt->execute();
$result = $stmt->get_result();
$item = $result->fetch_assoc();

if (!$item) {
    header('Location: list_items.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $sqlDel = "DELETE FROM items WHERE id = ?";
    $stmtDel = $conn->prepare($sqlDel);
    $stmtDel->bind_param('i', $id);
    $stmtDel->execute();
    header('Location: list_items.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Delete Item</title>
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
          <h2 class="h4 mb-3">Delete Item</h2>
          <p>
            Are you sure you want to delete
            <strong><?php echo htmlspecialchars($item['item_name']); ?></strong>
            (ID #<?php echo $id; ?>) from the inventory?
          </p>
          <p class="text-warning small mb-4">
            This action cannot be undone.
          </p>

          <form method="post">
            <div class="d-flex justify-content-between">
              <a href="list_items.php" class="btn btn-outline-light">Cancel</a>
              <button type="submit" class="btn btn-danger">Yes, Delete</button>
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
