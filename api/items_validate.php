<?php
// api/items_validate.php
// Validate payloads for create or update without mutating the database.
header('Content-Type: application/json');

require_once __DIR__ . '/../db.php';

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]);
    exit;
}

$rawId = isset($_POST['id']) ? trim($_POST['id']) : '';
$operation = ($rawId !== '') ? 'update' : 'create';
$errors = [];
$validated = [];

// If validating an update, confirm the ID is numeric and exists.
if ($operation === 'update') {
    if (!is_numeric($rawId)) {
        $errors[] = 'A valid numeric item ID is required for update validation.';
    } else {
        $id = (int)$rawId;
        $validated['id'] = $id;

        $checkStmt = $conn->prepare('SELECT id FROM items WHERE id = ?');
        $checkStmt->bind_param('i', $id);
        $checkStmt->execute();
        $result = $checkStmt->get_result();

        if ($result->num_rows === 0) {
            $errors[] = 'Item not found for update validation.';
        }
    }
}

// Track which fields the caller is trying to validate.
$hasName = array_key_exists('item_name', $_POST);
$hasQuantity = array_key_exists('quantity', $_POST);
$hasPrice = array_key_exists('price', $_POST);
$hasCategory = array_key_exists('category', $_POST);

// Enforce required fields for create.
if ($operation === 'create') {
    if (!$hasName) {
        $errors[] = 'Item name is required.';
    }
    if (!$hasQuantity) {
        $errors[] = 'Quantity is required.';
    }
    if (!$hasPrice) {
        $errors[] = 'Price is required.';
    }
}

// Prevent empty update payloads.
if ($operation === 'update' && !$hasName && !$hasQuantity && !$hasPrice && !$hasCategory) {
    $errors[] = 'Provide at least one field to validate for update.';
}

// Field validations.
if ($hasName) {
    $name = trim($_POST['item_name']);
    if ($name === '') {
        $errors[] = 'Item name cannot be empty.';
    } elseif (strlen($name) > 100) {
        $errors[] = 'Item name must be 100 characters or fewer.';
    } else {
        $validated['item_name'] = $name;
    }
}

if ($hasQuantity) {
    $quantityRaw = trim($_POST['quantity']);
    if (!is_numeric($quantityRaw) || (int)$quantityRaw < 0) {
        $errors[] = 'Quantity must be a non-negative number.';
    } else {
        $validated['quantity'] = (int)$quantityRaw;
    }
}

if ($hasPrice) {
    $priceRaw = trim($_POST['price']);
    if (!is_numeric($priceRaw) || (float)$priceRaw < 0) {
        $errors[] = 'Price must be a non-negative number.';
    } else {
        $validated['price'] = (float)$priceRaw;
    }
}

if ($hasCategory) {
    $category = trim($_POST['category']);
    if (strlen($category) > 50) {
        $errors[] = 'Category must be 50 characters or fewer.';
    } else {
        $validated['category'] = $category;
    }
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Validation failed.',
        'errors' => $errors
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Validation passed for ' . $operation . '.',
    'operation' => $operation,
    'data' => $validated
]);
