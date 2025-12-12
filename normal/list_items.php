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
              <button
                type="button"
                class="btn btn-sm btn-outline-danger js-delete-btn"
                data-item-id="<?php echo $row['id']; ?>"
                data-item-name="<?php echo htmlspecialchars($row['item_name'], ENT_QUOTES, 'UTF-8'); ?>"
              >
                Delete
              </button>
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

<div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content bg-dark text-light border border-secondary">
      <div class="modal-header border-secondary">
        <h5 class="modal-title">Confirm Deletion</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <p class="mb-2">Delete <strong id="deleteItemName"></strong>?</p>
        <p class="text-warning small mb-0">This action cannot be undone.</p>
      </div>
      <div class="modal-footer border-secondary">
        <button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">Cancel</button>
        <form id="deleteForm" method="post" action="delete_item.php" class="mb-0">
          <input type="hidden" name="id" id="deleteItemId">
          <button type="submit" class="btn btn-danger">Yes, Delete</button>
        </form>
      </div>
    </div>
  </div>
</div>

<script>
  const deleteModalElement = document.getElementById('deleteModal');
  const deleteModal = new bootstrap.Modal(deleteModalElement);
  const deleteItemName = document.getElementById('deleteItemName');
  const deleteItemId = document.getElementById('deleteItemId');

  document.querySelectorAll('.js-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      deleteItemName.textContent = btn.dataset.itemName;
      deleteItemId.value = btn.dataset.itemId;
      deleteModal.show();
    });
  });
</script>
</body>
</html>
