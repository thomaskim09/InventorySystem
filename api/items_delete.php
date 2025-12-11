<?php
// api/items_delete.php
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

try {
    $sql = "DELETE FROM items WHERE id = ?";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception('Prepare failed.');
    }

    $stmt->bind_param('i', $id);

    if (!$stmt->execute()) {
        throw new Exception('Delete failed.');
    }

    if ($stmt->affected_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Item not found or already deleted.'
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Item deleted.'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error while deleting item.'
    ]);
}
