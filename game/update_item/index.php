<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cargo Logistics Center</title>
    <style>
        body {
            margin: 0;
            background: #1a1a2e;
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
            border: 2px solid #555;
            box-shadow: 0 0 20px rgba(255, 165, 0, 0.4); 
        }
        a {
            color: #ffa500;
            text-decoration: none;
            font-weight: bold;
        }
    </style>

    <script src="../phaser.min.js"></script>
    <script src="../common.js"></script>
</head>
<body>

    <div id="game-ui">
        <h1>📦 CARGO LOGISTICS CENTER</h1>
        <p>Update stock quantity to dispatch items.</p>
        <a href="../hub.php">⬅ Back to Hub</a>
    </div>

    <div id="game-container"></div>

    <script src="main.js"></script>
</body>
</html>