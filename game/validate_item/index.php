<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Control Center</title>
    <style>
        body {
            margin: 0;
            background: #1a1a1a; /* 工业深灰 */
            color: #ccc;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
            border-bottom: 2px solid #e67e22; /* 警示橙色 */
            padding-bottom: 10px;
            width: 800px;
        }
        h1 {
            margin: 0;
            color: #e67e22; 
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 24px;
        }
        p { margin: 5px 0; font-size: 14px; }
        
        canvas {
            border: 4px solid #333;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
            background-color: #000;
        }
        
        a {
            color: #3498db;
            text-decoration: none;
            font-weight: bold;
            font-size: 12px;
        }
        a:hover { color: #fff; }
    </style>

    <script src="../phaser.min.js"></script>
    
    <script src="../common.js"></script>

    <script src="main.js" defer></script>
</head>
<body>

    <div id="game-ui">
        <h1>🏭 Factory Control Station</h1>
        <p>
        MISSION: Check the <b>LIST</b>. 
            <span style="color:#e74c3c">REJECT</span> if the price is wrong. 
            <span style="color:#2ecc71">PASS</span> only if it matches exactly.</p>
        <a href="../hub.php">⬅ BACK TO HUB</a>
    </div>

    <div id="game-container"></div>

</body>
</html>