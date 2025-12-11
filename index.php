<?php
// root index.php
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Inventory System – Mode Selector</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #0f172a;
      color: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .container {
      text-align: center;
    }
    h1 { margin-bottom: 8px; }
    p  { margin-bottom: 20px; color: #9ca3af; }
    .btn {
      display: inline-block;
      margin: 8px;
      padding: 10px 18px;
      border-radius: 6px;
      text-decoration: none;
      color: #f9fafb;
      font-size: 14px;
    }
    .btn-normal { background: #10b981; }
    .btn-normal:hover { background: #059669; }
    .btn-game { background: #3b82f6; }
    .btn-game:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Inventory System</h1>
    <p>Select which layer you want to open.</p>
    <a class="btn btn-normal" href="normal/index.php">Normal Mode (Assignment)</a>
    <a class="btn btn-game" href="game/hub.php">Game Mode (Inventory Arcade)</a>
  </div>
</body>
</html>
