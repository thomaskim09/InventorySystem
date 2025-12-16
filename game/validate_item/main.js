/**
 * FACTORY VALIDATOR - Final Version (Custom Data)
 * Feature: Start Menu + Time Attack + Auto-Pause Mechanism
 */

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

// --- 游戏状态变量 ---
let score = 0;
let timeLeft = 60; 
let isGameRunning = false; // [新增] 控制游戏是否开始
let isGameOver = false;
let currentItem = null; 
let spawnTimer;         
let gameTimer;          

// --- 资源键名 ---
const ASSETS = {
    BG: 'bg_factory',
    BELT: 'conveyor_belt',
    BOX: 'box_normal',
    SCANNER: 'scanner_overlay',
    BTN_PASS: 'btn_approve',
    BTN_FAIL: 'btn_reject'
};

function preload() {
    this.load.image(ASSETS.BG, '../../assets/validate_item/img/bg_factory.png');
    this.load.image(ASSETS.BELT, '../../assets/validate_item/img/conveyor_belt.png');
    this.load.image(ASSETS.BOX, '../../assets/validate_item/img/box_normal.png');
    this.load.image(ASSETS.SCANNER, '../../assets/validate_item/img/scanner_overlay.png');
    this.load.image(ASSETS.BTN_PASS, '../../assets/validate_item/img/btn_approve.png');
    this.load.image(ASSETS.BTN_FAIL, '../../assets/validate_item/img/btn_reject.png');
}

function create() {
    // --- 1. 初始化变量 ---
    isGameRunning = false;
    isGameOver = false;
    score = 0;
    timeLeft = 60;

    // --- 2. 场景搭建 (保留你的坐标设置) ---
    this.add.image(400, 300, ASSETS.BG).setDisplaySize(800, 600);
    
    // [用户设置] 传送带 Y = 400
    this.belt = this.add.tileSprite(400, 400, 800, 100, ASSETS.BELT); 

    // [用户设置] 扫描仪 Y = 350
    this.add.image(400, 350, ASSETS.SCANNER).setAlpha(0.6).setDisplaySize(300, 220);
    
    // [用户设置] 文字 Y = 300
    this.scannerText = this.add.text(400, 300, "", {
        font: '18px monospace', fill: '#00ff00', align: 'center', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    createButtons(this);

    // --- 3. UI 信息 ---
    this.scoreText = this.add.text(20, 20, "SCORE: 0", { 
        fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 4 
    });
    
    this.timerText = this.add.text(600, 20, "TIME: 60", { 
        fontSize: '32px', fill: '#00ff00', stroke: '#000', strokeThickness: 4 
    });

    // --- 4. 游戏逻辑组 ---
    this.boxes = this.physics.add.group();

    // 生成定时器 (默认暂停)
    spawnTimer = this.time.addEvent({
        delay: 2500, 
        callback: spawnBox,
        callbackScope: this,
        loop: true,
        paused: true // [关键] 一开始是暂停的，等待点击开始
    });

    // 倒计时定时器 (默认暂停)
    gameTimer = this.time.addEvent({
        delay: 1000,
        callback: onSecondTick,
        callbackScope: this,
        loop: true,
        paused: true // [关键] 一开始是暂停的
    });

    // --- 5. 创建开始菜单 ---
    createStartMenu(this);
}

function update(time, delta) {
    // [新增] 如果游戏还没开始，或者结束了，什么都不做
    if (!isGameRunning || isGameOver) return;

    // --- 游戏主循环 ---

    if (currentItem) {
        // [状态: 暂停检查中]
        spawnTimer.paused = true;
        
        // 让所有未处理的箱子停下
        this.boxes.getChildren().forEach(box => {
            if (!box.processed) box.body.setVelocityX(0);
        });

    } else {
        // [状态: 流水线运行中]
        spawnTimer.paused = false;
        
        const moveDistance = 200 * (delta / 1000); 
        
        this.belt.tilePositionX -= moveDistance;

        // 箱子移动
        this.boxes.getChildren().forEach(box => {
            // [用户设置] 箱子速度 200
            if (!box.processed) box.body.setVelocityX(200);
            
            // 销毁出界
            if (box.x > 850) box.destroy();
        });
        
        // 寻找新目标
        let foundBox = null;
        this.boxes.getChildren().forEach(box => {
            if (!box.processed && box.x > 390 && box.x < 410) {
                foundBox = box;
            }
        });

        if (foundBox) {
            currentItem = foundBox;
            this.scannerText.setText(`ITEM DETECTED\nPRICE: $${currentItem.itemData.price}`);
            currentItem.body.setVelocityX(0);
        } else {
             if(!currentItem) this.scannerText.setText("WAITING...");
        }
    }
}

// --- 功能函数 ---

function createStartMenu(scene) {
    scene.startMenuContainer = scene.add.container(0, 0);

    // 1. 背景
    const bg = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.85).setInteractive();

    // 2. 标题
    const title = scene.add.text(400, 200, "FACTORY CONTROL", {
        fontSize: '50px', fontStyle: 'bold', color: '#e67e22', stroke: '#fff', strokeThickness: 2
    }).setOrigin(0.5);

    // 3. 说明
    const desc = scene.add.text(400, 280, "GOAL: Validate items in 60 seconds.\n\nNegative Price = REJECT (Red)\nPositive Price = PASS (Green)", {
        fontSize: '20px', color: '#ccc', align: 'center', lineSpacing: 10
    }).setOrigin(0.5);

    // 4. 开始按钮
    const startBtn = scene.add.text(400, 450, "[ CLICK TO START ]", {
        fontSize: '32px', color: '#00ff00', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

    scene.tweens.add({
        targets: startBtn, alpha: 0.5, duration: 800, yoyo: true, repeat: -1
    });

    // 5. 点击事件
    startBtn.on('pointerdown', () => {
        scene.startMenuContainer.setVisible(false);
        isGameRunning = true;
        spawnTimer.paused = false;
        gameTimer.paused = false;
        spawnBox.call(scene); // 立即生成第一个
    });

    scene.startMenuContainer.add([bg, title, desc, startBtn]);
    scene.startMenuContainer.setDepth(9999);
}

function onSecondTick() {
    timeLeft--;
    this.timerText.setText("TIME: " + timeLeft);
    if (timeLeft <= 10) this.timerText.setColor('#ff0000');
    if (timeLeft <= 0) gameOver(this);
}

function spawnBox() {
    if (isGameOver || !isGameRunning) return;

    const isBad = Math.random() < 0.5;
    let priceVal = isBad ? Phaser.Math.Between(-99, -1) : Phaser.Math.Between(10, 99);

    // [用户设置] 生成高度 Y = 380
    const box = this.boxes.create(-50, 380, ASSETS.BOX); 
    box.setDisplaySize(64, 64);
    box.itemData = { price: priceVal, isValid: !isBad };
    box.processed = false;
}

function createButtons(scene) {
    const btnPass = scene.add.image(500, 540, ASSETS.BTN_PASS).setInteractive({ cursor: 'pointer' }).setDisplaySize(120, 120);
    const btnFail = scene.add.image(300, 540, ASSETS.BTN_FAIL).setInteractive({ cursor: 'pointer' }).setDisplaySize(120, 120);

    const scalePass = btnPass.scale;
    btnPass.on('pointerdown', () => {
        btnPass.setScale(scalePass * 0.9);
        processDecision(scene, 'PASS');
    });
    btnPass.on('pointerup', () => btnPass.setScale(scalePass));
    btnPass.on('pointerout', () => btnPass.setScale(scalePass));

    const scaleFail = btnFail.scale;
    btnFail.on('pointerdown', () => {
        btnFail.setScale(scaleFail * 0.9);
        processDecision(scene, 'REJECT');
    });
    btnFail.on('pointerup', () => btnFail.setScale(scaleFail));
    btnFail.on('pointerout', () => btnFail.setScale(scaleFail));
}

function processDecision(scene, decision) {
    if (!currentItem || isGameOver || !isGameRunning) return; 

    const data = currentItem.itemData;
    let correct = false;

    if (decision === 'PASS') {
        if (data.isValid) {
            correct = true;
            callValidateApi(scene, data.price);
        }
    } else if (decision === 'REJECT') {
        if (!data.isValid) correct = true;
    }

    if (correct) {
        score += 10;
        scene.scoreText.setText("SCORE: " + score);
        showFloatText(scene, currentItem.x, currentItem.y - 50, "OK!", 0x00ff00);
    } else {
        score = Math.max(0, score - 5);
        scene.scoreText.setText("SCORE: " + score);
        handleMistake(scene, "WRONG!");
    }

    currentItem.processed = true;
    
    if (decision === 'REJECT') {
        currentItem.body.setVelocityY(200); 
        scene.tweens.add({ targets: currentItem, alpha: 0, duration: 500 });
    } else {
        // [用户设置] 离开速度 200 (匹配传送带)
        currentItem.body.setVelocityX(200); 
        currentItem.setTint(0x55ff55);
    }
    
    currentItem = null; 
}

function handleMistake(scene, msg) {
    showFloatText(scene, 400, 300, msg, 0xff0000);
    scene.cameras.main.shake(200, 0.01);
}

function callValidateApi(scene, price) {
    const payload = { name: "Factory Item", quantity: 1, price: price };
    apiValidateItem(payload); 
}

function showFloatText(scene, x, y, message, color) {
    const txt = scene.add.text(x, y, message, { fontSize: '32px', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 });
    txt.setTint(color).setOrigin(0.5);
    scene.tweens.add({
        targets: txt, y: y - 100, alpha: 0, duration: 1000,
        onComplete: () => txt.destroy()
    });
}

function gameOver(scene) {
    isGameOver = true;
    spawnTimer.paused = true; 
    gameTimer.paused = true;  
    
    const bg = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.9).setDepth(2000);
    const txt1 = scene.add.text(400, 200, "SHIFT COMPLETE", { fontSize: '60px', color: '#e67e22', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2001);
    const txt2 = scene.add.text(400, 320, "FINAL SCORE: " + score, { fontSize: '48px', color: '#fff' }).setOrigin(0.5).setDepth(2001);
    
    const restartBtn = scene.add.text(400, 450, "RESTART SYSTEM", { fontSize: '28px', color: '#00ff00' })
        .setOrigin(0.5).setInteractive({ cursor: 'pointer' }).setDepth(2001);
        
    restartBtn.on('pointerdown', () => {
        scene.scene.restart(); // 重启场景
    });
}