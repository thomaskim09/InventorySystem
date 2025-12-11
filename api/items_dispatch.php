<?php
// api/items_dispatch.php
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

/**
 * SIMPLE VERSION:
 * Treat "dispatch" as "delete from inventory".
 *
 * ADVANCED VERSION (optional):
 *  - Add a `status` column (IN_STOCK / DISPATCHED)
 *  - Replace this DELETE with an UPDATE.
 */

try {
    $sql = "DELETE FROM items WHERE id = ?";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception('Prepare failed.');
    }

    $stmt->bind_param('i', $id);

    if (!$stmt->execute()) {
        throw new Exception('Dispatch(delete) failed.');
    }

    if ($stmt->affected_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Item not found or already dispatched.'
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Item dispatched (removed from inventory).'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error while dispatching item.'
    ]);
}
