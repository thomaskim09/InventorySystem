<?php
// api/items_update.php
header('Content-Type: application/json');

require_once __DIR__ . '/../db.php';

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]);
    exit;
}

$id = isset($_POST['id']) ? trim($_POST['id']) : '';

if ($id === '' || !is_numeric($id)) {
    echo json_encode([
        'success' => false,
        'message' => 'Valid item ID is required.'
    ]);
    exit;
}

$id = (int)$id;

// Check item exists up front
$existsStmt = $conn->prepare("SELECT id FROM items WHERE id = ?");
$existsStmt->bind_param('i', $id);
$existsStmt->execute();
$existsResult = $existsStmt->get_result();

if ($existsResult->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Item not found.'
    ]);
    exit;
}

// Dynamically build updates for only the fields provided
$fields = [];
$types  = '';
$values = [];

if (isset($_POST['item_name'])) {
    $name = trim($_POST['item_name']);
    if ($name === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Item name cannot be empty.'
        ]);
        exit;
    }
    $fields[] = 'item_name = ?';
    $types   .= 's';
    $values[] = $name;
}

if (isset($_POST['quantity'])) {
    $quantity = trim($_POST['quantity']);
    if (!is_numeric($quantity) || (int)$quantity < 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Quantity must be a non-negative number.'
        ]);
        exit;
    }
    $fields[] = 'quantity = ?';
    $types   .= 'i';
    $values[] = (int)$quantity;
}

if (isset($_POST['price'])) {
    $price = trim($_POST['price']);
    if (!is_numeric($price) || (float)$price < 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Price must be a non-negative number.'
        ]);
        exit;
    }
    $fields[] = 'price = ?';
    $types   .= 'd';
    $values[] = (float)$price;
}

if (isset($_POST['category'])) {
    $category = trim($_POST['category']);
    $fields[] = 'category = ?';
    $types   .= 's';
    $values[] = $category;
}

if (empty($fields)) {
    echo json_encode([
        'success' => false,
        'message' => 'No fields provided to update.'
    ]);
    exit;
}

try {
    $sqlUpdate = "UPDATE items SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmtUpdate = $conn->prepare($sqlUpdate);

    if (!$stmtUpdate) {
        throw new Exception('Prepare failed for update.');
    }

    // Bind parameters dynamically
    $types .= 'i';
    $values[] = $id;
    $stmtUpdate->bind_param($types, ...$values);

    if (!$stmtUpdate->execute()) {
        throw new Exception('Update failed.');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Item updated.',
        'updated_fields' => array_map(function ($field) {
            return trim(str_replace(' = ?', '', $field));
        }, $fields)
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error while updating item.'
    ]);
}
