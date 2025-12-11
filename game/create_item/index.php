<?php
// game/create_item/index.php
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Create Item Game</title>
  <style>
    body {
      margin: 0;
      background: #020617;
      color: #e5e7eb;
      font-family: Arial, sans-serif;
      text-align: center;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    header {
      padding: 16px;
      background: #0f172a;
      border-bottom: 1px solid #1f2937;
    }

    header h1 {
      margin: 0;
      font-size: 24px;
    }

    header p {
      margin: 6px 0 0;
      font-size: 13px;
      color: #9ca3af;
    }

    .top-links {
      margin-top: 8px;
      font-size: 13px;
    }

    .top-links a {
      color: #60a5fa;
      text-decoration: none;
      margin: 0 6px;
    }

    .top-links a:hover {
      text-decoration: underline;
    }

    #game-container {
      width: 800px;
      height: 600px;
      margin: 20px auto;
      border: 2px solid #1f2937;
      background: #020617;
    }

    footer {
      margin-top: auto;
      padding: 10px;
      font-size: 11px;
      color: #6b7280;
      border-top: 1px solid #1f2937;
      background: #020617;
    }
  </style>

  <!-- Phaser engine -->
  <script src="../phaser.min.js"></script>

  <!-- Shared API helpers -->
  <script src="../common.js"></script>

  <!-- Game logic -->
  <script src="main.js"></script>
</head>
<body>

<header>
  <h1>Create Item Game</h1>
  <p>Drag the crate and click to create items in the inventory database.</p>
  <div class="top-links">
    <a href="../hub.php">&larr; Back to Game Hub</a> |
    <a href="../../index.php">Go to Normal Inventory System</a>
  </div>
</header>

<div id="game-container"></div>

<footer>
  Mini game hooks: drop tokens on the table, combine Herb + Crystal, stock the shelf, or hit Produce to create items via the API.
</footer>

</body>
</html>
