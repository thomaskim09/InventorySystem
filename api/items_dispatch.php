<?php
// api/items_dispatch.php
// Deprecated placeholder: dispatch is not supported without a status column.
// Returns a clear failure response so callers know to switch to update/delete.
header('Content-Type: application/json');
http_response_code(410); // Gone

echo json_encode([
    'success' => false,
    'message' => 'Dispatch is not supported. Use items_update.php or items_delete.php instead.'
]);
