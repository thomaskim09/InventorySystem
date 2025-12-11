<?php
// api/items_list.php
header('Content-Type: application/json');

require_once __DIR__ . '/../db.php';

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]);
    exit;
}

// Optional search by item_name
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

try {
    if ($search !== '') {
        $sql = "SELECT id, item_name, quantity, price, category, created_at
                FROM items
                WHERE item_name LIKE ?
                ORDER BY id DESC";
        $stmt = $conn->prepare($sql);
        $like = '%' . $search . '%';
        $stmt->bind_param('s', $like);
    } else {
        $sql = "SELECT id, item_name, quantity, price, category, created_at
                FROM items
                ORDER BY id DESC";
        $stmt = $conn->prepare($sql);
    }

    if (!$stmt->execute()) {
        throw new Exception('Query failed.');
    }

    $result = $stmt->get_result();
    $items = [];

    while ($row = $result->fetch_assoc()) {
        // Cast numeric fields to proper type for JSON
        $row['id'] = (int) $row['id'];
        $row['quantity'] = (int) $row['quantity'];
        $row['price'] = (float) $row['price'];
        $items[] = $row;
    }

    echo json_encode([
        'success' => true,
        'items' => $items
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching items.'
    ]);
}
