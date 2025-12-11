<?php
// normal/list_items.php
require_once __DIR__ . '/../db.php';

$search = isset($_GET['search']) ? trim($_GET['search']) : '';

$sql = "SELECT id, item_name, quantity, price, created_at
        FROM items";
$params = [];
if ($search !== '') {
    $sql .= " WHERE item_name LIKE ?";
    $params[] = '%' . $search . '%';
}
$sql .= " ORDER BY id DESC";

$stmt = $conn->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param('s', $params[0]);
}
$stmt->execute();
$result = $stmt->get_result();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inventory - Item List</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
    rel="stylesheet"
  >
  <style>
    body { background: #020617; color: #e5e7eb; }
    .table thead th {
      background: #0f172a;
      color: #e5e7eb;
      border-color: #1f2937;
    }
    .table tbody tr {
      background: #020617;
      border-color: #1f2937;
    }
    .badge-id {
      font-size: 0.75rem;
    }
  </style>
</head>
<body>

<nav class="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary mb-3">
  <div class="container-fluid">
    <a class="navbar-brand" href="index.php">Inventory System</a>
    <div class="d-flex">
      <a class="btn btn-outline-light btn-sm me-2" href="add_item.php">+ Add Item</a>
      <a class="btn btn-outline-info btn-sm" href="../game/hub.php">Game Mode</a>
    </div>
  </div>
</nav>

<div class="container py-3">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2 class="h4 mb-0">Item List</h2>
    <form class="d-flex" method="get">
      <input
        type="text"
        class="form-control form-control-sm me-2"
        name="search"
        placeholder="Search by name..."
        value="<?php echo htmlspecialchars($search); ?>"
      >
      <button class="btn btn-sm btn-outline-light" type="submit">Search</button>
    </form>
  </div>

  <div class="table-responsive shadow-sm">
    <table class="table table-dark table-hover align-middle mb-0">
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">Item Name</th>
          <th scope="col" class="text-center">Quantity</th>
          <th scope="col" class="text-end">Price (RM)</th>
          <th scope="col">Created At</th>
          <th scope="col" class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
      <?php if ($result->num_rows > 0): ?>
        <?php while ($row = $result->fetch_assoc()): ?>
          <tr>
            <td>
              <span class="badge bg-secondary badge-id">#<?php echo $row['id']; ?></span>
            </td>
            <td><?php echo htmlspecialchars($row['item_name']); ?></td>
            <td class="text-center"><?php echo (int)$row['quantity']; ?></td>
            <td class="text-end"><?php echo number_format((float)$row['price'], 2); ?></td>
            <td><?php echo $row['created_at']; ?></td>
            <td class="text-end">
              <a href="edit_item.php?id=<?php echo $row['id']; ?>"
                 class="btn btn-sm btn-outline-primary me-1">
                Edit
              </a>
              <a href="delete_item.php?id=<?php echo $row['id']; ?>"
                 class="btn btn-sm btn-outline-danger"
                 onclick="return confirm('Delete this item?');">
                Delete
              </a>
            </td>
          </tr>
        <?php endwhile; ?>
      <?php else: ?>
        <tr>
          <td colspan="6" class="text-center text-secondary py-4">
            No items found. <a href="add_item.php" class="link-light">Add your first item.</a>
          </td>
        </tr>
      <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
