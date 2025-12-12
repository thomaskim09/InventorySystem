<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update Item Lab</title>
  <style>
    body {
      margin: 0;
      background: #0b1220;
      color: #e5e7eb;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 100vh;
      padding: 24px;
      box-sizing: border-box;
    }
    h1 { margin-bottom: 6px; }
    p { margin: 0 0 12px; color: #9ca3af; }
    .panel {
      width: min(920px, 100%);
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      padding: 18px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 14px 0;
    }
    button {
      background: #3b82f6;
      border: none;
      color: #f9fafb;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover { background: #2563eb; }
    pre {
      background: #0f172a;
      border: 1px solid #1f2937;
      border-radius: 10px;
      padding: 12px;
      color: #d1d5db;
      overflow-x: auto;
      min-height: 120px;
    }
    .back-link { margin-top: 10px; display: inline-block; color: #60a5fa; }
    #game-container { margin-top: 18px; }
  </style>

  <script src="../phaser.min.js"></script>
  <script src="../common.js"></script>
  <script src="main.js" defer></script>
</head>
<body>
  <div class="panel">
    <h1>Update Item Lab</h1>
    <p>
      Prototype space for the update-focused mini-game. Use the buttons below to ping the new validation API
      before wiring in your Phaser scene or UI flow.
    </p>
    <div class="actions">
      <button id="btn-validate-create">Validate sample create payload</button>
      <button id="btn-validate-update">Validate sample update payload</button>
    </div>
    <pre id="dev-log">// Responses will appear here</pre>
    <p class="back-link">
      <a class="back-link" href="../hub.php">&#8592; Back to Hub</a>
    </p>
  </div>

  <div id="game-container"></div>
</body>
</html>
