<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Stellar Forge</title>
    <style>
        body {
            margin: 0;
            background: #050510; /* Deep Space Dark */
            color: #fff;
            font-family: 'Courier New', Courier, monospace;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
        }
        #game-ui {
            margin-bottom: 10px;
            text-align: center;
        }
        canvas {
            border: 2px solid #444;
            box-shadow: 0 0 20px rgba(0, 150, 255, 0.2);
        }
        a {
            color: #00ffff;
            text-decoration: none;
            font-weight: bold;
        }
    </style>

    <script src="../phaser.min.js"></script>
    
    <script src="../common.js"></script>

    <script src="main.js" defer></script>
</head>
<body>

    <div id="game-ui">
        <h1>✨ THE STELLAR FORGE</h1>
        <p>Drag 2 Elements into the Core to synthesize items.</p>
        <a href="../hub.php">⬅ Back to Hub</a>
    </div>

    <div id="game-container"></div>

</body>
</html>