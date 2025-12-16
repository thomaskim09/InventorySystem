<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Crusher - Delete Item</title>
    <style>
        body { 
            margin: 0; 
            background: #1e1e1e; 
            color: #fff; 
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
        h1 { margin-bottom: 10px; }
        p { color: #aaa; margin-bottom: 20px; }
        #game-container {
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            border: 2px solid #444;
        }
        .back-link {
            margin-top: 20px;
            color: #4ade80;
            text-decoration: none;
            font-size: 1.1rem;
        }
        .back-link:hover { text-decoration: underline; }
    </style>

    <script src="../phaser.min.js"></script>

    <script src="../common.js"></script>

    <script src="main.js"></script>
</head>
<body>

    <h1>🗑️ Inventory Crusher</h1>
    <p>Drag items into the Crusher to delete them from the database.</p>

    <div id="game-container"></div>

    <a href="../hub.php" class="back-link">&larr; Back to Game Hub</a>

</body>
</html>