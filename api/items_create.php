<?php
// api/items_create.php
header('Content-Type: application/json');

require_once __DIR__ . '/../db.php';

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]);
    exit;
}

// Read POST values
$name     = isset($_POST['item_name']) ? trim($_POST['item_name']) : '';
$quantity = isset($_POST['quantity'])  ? trim($_POST['quantity'])  : '';
$price    = isset($_POST['price'])     ? trim($_POST['price'])     : '';
$category = isset($_POST['category'])  ? trim($_POST['category'])  : '';

if ($name === '' || $quantity === '' || $price === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Item name, quantity and price are required.'
    ]);
    exit;
}

if (!is_numeric($quantity) || (int)$quantity < 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Quantity must be a non-negative number.'
    ]);
    exit;
}

if (!is_numeric($price) || (float)$price < 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Price must be a non-negative number.'
    ]);
    exit;
}

try {
    $sql = "INSERT INTO items (item_name, quantity, price, category)
            VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception('Prepare failed.');
    }

    $qty  = (int)$quantity;
    $prc  = (float)$price;

    $stmt->bind_param('sids', $name, $qty, $prc, $category);

    if (!$stmt->execute()) {
        throw new Exception('Insert failed.');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Item created.',
        'id'      => $stmt->insert_id
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error while creating item.'
    ]);
}
