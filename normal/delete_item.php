<?php
// normal/delete_item.php
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: list_items.php');
    exit;
}

$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
if ($id <= 0) {
    header('Location: list_items.php');
    exit;
}

$sqlDel = "DELETE FROM items WHERE id = ?";
$stmtDel = $conn->prepare($sqlDel);
$stmtDel->bind_param('i', $id);
$stmtDel->execute();

header('Location: list_items.php');
exit;
