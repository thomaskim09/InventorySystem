<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bio-Gel Storage Control</title>
    <style>
        body {
            margin: 0;
            background: radial-gradient(circle at center, #1a1a2e 0%, #000000 100%);
            color: #4682B4;
            font-family: 'Courier New', Courier, monospace;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
        }
        #game-ui {
            margin-bottom: 15px;
            text-align: center;
            text-shadow: 0 0 10px rgba(70, 130, 180, 0.5);
        }
        h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            color: #00FFFF;
            letter-spacing: 2px;
        }
        p {
            font-size: 14px;
            color: #87CEEB;
            opacity: 0.8;
        }
        canvas {
            border: 2px solid #4682B4;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.3); 
            border-radius: 4px;
        }
        a {
            display: inline-block;
            margin-top: 10px;
            color: #008080;
            text-decoration: none;
            font-weight: bold;
            border: 1px solid #008080;
            padding: 8px 16px;
            transition: all 0.3s ease;
        }
        a:hover {
            background-color: #008080;
            color: #000;
            box-shadow: 0 0 15px rgba(0, 128, 128, 0.6);
        }
    </style>

    <script src="../phaser.min.js"></script>
    <script src="../common.js"></script>
</head>
<body>

    <div id="game-ui">
        <h1>BIO-GEL STORAGE FACILITY</h1>
        <p>Inject or extract matter to stabilize containment levels.</p>
        
        <a href="../hub.php">⬅ TERMINAL HUB</a>
    </div>

    <div id="game-container"></div>

    <script src="main.js"></script>
</body>
</html>