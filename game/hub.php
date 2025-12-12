<?php
// game/hub.php
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Inventory Arcade - Game Hub</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #111827;
      color: #e5e7eb;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    header {
      padding: 20px;
      text-align: center;
      background: #1f2933;
      border-bottom: 1px solid #374151;
    }

    header h1 {
      margin: 0;
      font-size: 28px;
    }

    header p {
      margin: 8px 0 0;
      font-size: 14px;
      color: #9ca3af;
    }

    main {
      flex: 1;
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .back-link {
      margin-bottom: 20px;
    }

    .back-link a {
      color: #60a5fa;
      text-decoration: none;
      font-size: 14px;
    }

    .back-link a:hover {
      text-decoration: underline;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .card {
      background: #1f2937;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #374151;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 160px;
    }

    .card h2 {
      font-size: 18px;
      margin: 0 0 8px;
      color: #f9fafb;
    }

    .card p {
      font-size: 14px;
      margin: 0 0 16px;
      color: #9ca3af;
    }

    .card a {
      align-self: flex-start;
      background: #3b82f6;
      color: #f9fafb;
      text-decoration: none;
      font-size: 14px;
      padding: 8px 14px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
    }

    .card a:hover {
      background: #2563eb;
    }

    footer {
      padding: 10px 20px;
      font-size: 12px;
      text-align: center;
      color: #6b7280;
      border-top: 1px solid #374151;
      background: #111827;
    }
  </style>
</head>
<body>

<header>
  <h1>Inventory Arcade</h1>
  <p>Mini games built on top of the same PHP + MySQL inventory backend.</p>
</header>

<main>
  <div class="back-link">
    <a href="../index.php">&larr; Back to Normal Inventory System</a>
  </div>

  <section class="grid">
    <article class="card">
      <h2>Create Item Game</h2>
      <p>
        Use a game mechanic to create new items in the database.  
        Example - stocking shelves, crafting, growing plants, mixing potions.
      </p>
      <a href="create_item/index.php">Play</a>
    </article>

    <article class="card">
      <h2>Delete Item Game</h2>
      <p>
        Focus on deleting items.  
        Example - trash bin, shooting targets, crushing broken items.
      </p>
      <a href="delete_item/index.php">Play</a>
    </article>

    <article class="card">
      <h2>Validate Item Game</h2>
      <p>
        Focus on validation and correctness.  
        Example - checkpoint inspector, robot scanner, error fixer puzzle.
      </p>
      <a href="validate_item/index.php">Play</a>
    </article>

    <article class="card">
      <h2>Update Item Game</h2>
      <p>
        Focus on editing existing inventory records.  
        Example - repair bay, calibration lab, retagging mislabeled stock.
      </p>
      <a href="update_item/index.php">Play</a>
    </article>
  </section>
</main>

<footer>
  Inventory Arcade - powered by PHP, MySQL and Phaser.js
</footer>

</body>
</html>
