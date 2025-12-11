<?php
// api/items_quantity.php
// Flexible quantity endpoint: supports absolute set or delta-based adjust.
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

// Ensure the item exists
$check = $conn->prepare("SELECT id, quantity FROM items WHERE id = ?");
$check->bind_param('i', $id);
$check->execute();
$itemResult = $check->get_result();

if ($itemResult->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Item not found.'
    ]);
    exit;
}

// Decide mode: set or delta
$hasDelta    = array_key_exists('delta', $_POST);
$hasQuantity = array_key_exists('quantity', $_POST);

if (!$hasDelta && !$hasQuantity) {
    echo json_encode([
        'success' => false,
        'message' => 'Provide either delta (change) or quantity (absolute).'
    ]);
    exit;
}

if ($hasDelta && $hasQuantity) {
    echo json_encode([
        'success' => false,
        'message' => 'Provide only one of delta or quantity.'
    ]);
    exit;
}

try {
    if ($hasDelta) {
        $deltaRaw = trim($_POST['delta']);
        if (!is_numeric($deltaRaw)) {
            throw new Exception('Delta must be numeric.');
        }
        $delta = (int)$deltaRaw;

        $sql = "UPDATE items
                SET quantity = GREATEST(quantity + ?, 0)
                WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Prepare failed for delta update.');
        }
        $stmt->bind_param('ii', $delta, $id);
        $mode = 'delta';
        $change = $delta;
    } else {
        $quantityRaw = trim($_POST['quantity']);
        if (!is_numeric($quantityRaw) || (int)$quantityRaw < 0) {
            throw new Exception('Quantity must be a non-negative number.');
        }
        $quantity = (int)$quantityRaw;

        $sql = "UPDATE items
                SET quantity = ?
                WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Prepare failed for set update.');
        }
        $stmt->bind_param('ii', $quantity, $id);
        $mode = 'set';
        $change = $quantity;
    }

    if (!$stmt->execute()) {
        throw new Exception('Update failed.');
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception('Item not found or no change applied.');
    }

    // Fetch latest quantity to return
    $fetch = $conn->prepare("SELECT quantity FROM items WHERE id = ?");
    $fetch->bind_param('i', $id);
    $fetch->execute();
    $newQty = $fetch->get_result()->fetch_assoc()['quantity'];

    echo json_encode([
        'success' => true,
        'message' => 'Quantity updated.',
        'mode' => $mode,
        'value' => $change,
        'quantity' => (int)$newQty
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
