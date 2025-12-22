/**
 * FACTORY VALIDATOR - "Papers, Please" Style
 * Feature: Compare items against a Reference List (Manifest).
 * Mechanic: Check if Name AND Price match the daily list.
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
let isGameRunning = false;
let isGameOver = false;
let currentItem = null; 
let spawnTimer;         
let gameTimer;          

// 数据相关
let dbItems = [];       // 数据库里的所有商品
let dailyManifest = []; // 今天合法的商品清单 (子集)

// --- 资源键名 ---
const ASSETS = {
    BG: 'bg_factory',
    BELT: 'conveyor_belt',
    BOX: 'box_normal',
    SCANNER: 'scanner_overlay',
    BTN_PASS: 'btn_approve',
    BTN_FAIL: 'btn_reject',
    UI_MANIFEST: 'ui_manifest_bg',
    ICON_LIST: 'icon_list'
 
};

const dialogueData = [
    { text: "Hey rookie! Stop daydreaming.", speaker: "Foreman Zhang" },
    { text: "I'm Zhang, the shift supervisor. See that [ LIST ] on your desk?", speaker: "Foreman Zhang" },
    { text: "Your job is simple: Check the items on the belt against that list.", speaker: "Foreman Zhang" },
    { text: "The Name AND Price must match EXACTLY. Even a cent off means REJECT!", speaker: "Foreman Zhang" },
    { text: "Now get to work. Don't make me look bad.", speaker: "Foreman Zhang" }
];

function preload() {
    this.load.image(ASSETS.BG, '../../assets/validate_item/img/bg_factory.png');
    this.load.image(ASSETS.BELT, '../../assets/validate_item/img/conveyor_belt.png');
    this.load.image(ASSETS.BOX, '../../assets/validate_item/img/box_normal.png');
    this.load.image(ASSETS.SCANNER, '../../assets/validate_item/img/scanner_overlay.png');
    this.load.image(ASSETS.BTN_PASS, '../../assets/validate_item/img/btn_approve.png');
    this.load.image(ASSETS.BTN_FAIL, '../../assets/validate_item/img/btn_reject.png');
    this.load.image(ASSETS.UI_MANIFEST, '../../assets/validate_item/img/manifest_bg.png');
    this.load.image(ASSETS.ICON_LIST, '../../assets/validate_item/img/icon_list.png');
}

function create() {
    // 2. 初始化
    isGameRunning = false;
    isGameOver = false;
    score = 0;
    timeLeft = 60;

    // 3. 场景
    this.add.image(400, 300, ASSETS.BG).setDisplaySize(800, 600);
    this.belt = this.add.tileSprite(400, 400, 800, 100, ASSETS.BELT); 

    this.add.image(400, 350, ASSETS.SCANNER).setAlpha(0.6).setDisplaySize(300, 220);
    this.scannerText = this.add.text(400, 300, "", {
        font: '18px monospace', fill: '#00ff00', align: 'center', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    createButtons(this);

    // 4. UI
    this.scoreText = this.add.text(20, 20, "SCORE: 0", { fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 4 });
    this.timerText = this.add.text(600, 20, "TIME: 60", { fontSize: '32px', fill: '#00ff00', stroke: '#000', strokeThickness: 4 });

    // --- 新增：清单按钮 UI ---
    createManifestUI(this);

        // 请求数据
    apiListItems().then(res => {
        if (res.success && res.items.length > 0) {
            dbItems = res.items;
            console.log("DB Loaded: " + dbItems.length);
        } else {
            console.log("DB Error, using mock data");
            // 备用假数据，防止没连数据库时游戏崩溃
            dbItems = [
                { item_name: "Apple", price: "5.00" },
                { item_name: "Banana", price: "3.50" },
                { item_name: "GPU", price: "999.00" },
                { item_name: "Mouse", price: "25.00" },
                { item_name: "Keyboard", price: "50.00" }
            ];
        }
        // 数据加载完后，生成今天的“每日清单”
        generateDailyManifest();
        // 刷新一下UI里的清单显示
        updateManifestUI(this);
    });

    // 5. 逻辑
    this.boxes = this.physics.add.group();

    spawnTimer = this.time.addEvent({
        delay: 3000, // 稍微慢一点，给玩家看清单的时间
        callback: spawnBox,
        callbackScope: this,
        loop: true,
        paused: true 
    });

    gameTimer = this.time.addEvent({
        delay: 1000,
        callback: onSecondTick,
        callbackScope: this,
        loop: true,
        paused: true 
    });

    createStartMenu(this);
}

function update(time, delta) {
    if (!isGameRunning || isGameOver) return;

    if (currentItem) {
        spawnTimer.paused = true;
        this.boxes.getChildren().forEach(box => { if (!box.processed) box.body.setVelocityX(0); });
    } else {
        spawnTimer.paused = false;
        const moveDistance = 200 * (delta / 1000); 
        this.belt.tilePositionX -= moveDistance;

        this.boxes.getChildren().forEach(box => {
            if (!box.processed) box.body.setVelocityX(200);
            if (box.x > 850) box.destroy();
        });
        
        let foundBox = null;
        this.boxes.getChildren().forEach(box => {
            if (!box.processed && box.x > 390 && box.x < 410) foundBox = box;
        });

        if (foundBox) {
            currentItem = foundBox;
            this.scannerText.setText(`${currentItem.itemData.name}\n$${currentItem.itemData.price}`);
            currentItem.body.setVelocityX(0);
        } else {
             if(!currentItem) this.scannerText.setText("WAITING...");
        }
    }
}

// --- 核心逻辑修改区域 ---

// 1. 生成“每日清单” (从大库里随机抽4个)
function generateDailyManifest() {
    // 随机打乱 dbItems
    const shuffled = dbItems.sort(() => 0.5 - Math.random());
    // 取前 4 个 (如果不够4个就全取)
    dailyManifest = shuffled.slice(0, 4);
}

// 2. 创建查看清单的 UI
function createManifestUI(scene) {
    

    const panel = scene.add.container(400, 300);

    // 背景图
    const bg = scene.add.image(0, 0, ASSETS.UI_MANIFEST).setDisplaySize(1000, 500);
    
    // [修改点] 删除了之前的 "DAILY ORDERS" 标题代码
    // 因为你的背景图里已经印着这行字了，再写一遍就重影了

    const closeBtn = scene.add.text(0, 200, "[ CLOSE ]", { 
        fontSize: '20px', color: '#ff0000', fontStyle: 'bold', backgroundColor: '#ffffff'
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

    // [修改点] 调整文字坐标
    // x: -120 (稍微靠左一点，留出边距)
    // y: -80 (往下移，避开顶部的夹子和标题)
    const listText = scene.add.text(-100, -110, "Loading data...", { 
        fontSize: '20px',        // 稍微加大一点字体
        color: '#000000',        // 纯黑色
        fontFamily: 'Courier',   // 换个字体试试，看起来更像打印出来的
        fontStyle: 'bold',       // 加粗
        lineSpacing: 5          // 行间距加大
    });

    panel.add([bg, listText, closeBtn]);
    panel.setVisible(false); 
    panel.setDepth(2000);   

    scene.manifestPanel = panel;
    scene.manifestText = listText;

    const listIcon = scene.add.image(750, 530, ASSETS.ICON_LIST)
        .setDisplaySize(120, 150) // 设置大小
        .setInteractive({ cursor: 'pointer' })
        .setDepth(100);

    // --- 3. 绑定事件 ---
    
    // 图标点击事件
    listIcon.on('pointerdown', () => {
        if(isGameRunning) {
            // 切换面板的显示/隐藏
            panel.setVisible(!panel.visible);
        }
    });

    closeBtn.on('pointerdown', () => { panel.setVisible(false); });
}

function updateManifestUI(scene) {
    if (!scene.manifestText) return;
    
    let content = "";
    dailyManifest.forEach(item => {
        // 格式: Name ...... $Price
        content += `• ${item.item_name}\n  $${parseFloat(item.price).toFixed(2)}\n\n`;
    });
    scene.manifestText.setText(content);
}
// 3. 生成箱子 (难度升级版)
function spawnBox() {
    if (isGameOver || !isGameRunning) return;

    // 决定这是否是一个合法的箱子 (50% 概率)
    const isValid = Math.random() < 0.5;
    
    let boxName, boxPrice;
    
    // 从每日清单里随机选一个作为“模板”
    if (dailyManifest.length === 0) return; // 还没加载完
    const templateItem = Phaser.Utils.Array.GetRandom(dailyManifest);
    const realPrice = parseFloat(templateItem.price);

    if (isValid) {
        // 情况 A: 这是一个完美的合法商品
        boxName = templateItem.item_name;
        boxPrice = realPrice;
    } else {
        // 情况 B: 这是一个伪造/错误的商品
        // 随机决定是 "改价格" 还是 "改名字" (这里我们主要做改价格，因为改名字需要更多数据)
        
        // 错误类型: 价格偏差
        // 随机加减 10-50% 的价格
        const variance = (Math.random() * 0.5) + 0.1; // 0.1 ~ 0.6
        const sign = Math.random() < 0.5 ? 1 : -1;
        
        let fakePrice = realPrice + (realPrice * variance * sign);
        if (fakePrice < 0) fakePrice = 1.00; // 保证不出现负数，增加迷惑性
        
        boxName = templateItem.item_name;
        boxPrice = fakePrice; // 名字对，但价格不对！
    }

    const box = this.boxes.create(-50, 380, ASSETS.BOX); 
    box.setDisplaySize(64, 64);
    
    // 绑定数据
    box.itemData = { 
        name: boxName, 
        price: boxPrice.toFixed(2), // 显示两位小数
        isValid: isValid // 判定结果早已注定
    };
    box.processed = false;
}

// --- 通用功能保持不变 ---

function createStartMenu(scene) {
    scene.startMenuContainer = scene.add.container(0, 0);
    const bg = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.85).setInteractive();
    const title = scene.add.text(400, 180, "QUALITY CONTROL", { fontSize: '50px', fontStyle: 'bold', color: '#e67e22', stroke: '#fff', strokeThickness: 2 }).setOrigin(0.5);
    
    // 修改说明文案
    const desc = scene.add.text(400, 280, 
        "MISSION: Verify incoming boxes against the Manifest.\n\n" +
        "1. Click [LIST] to see valid prices.\n" +
        "2. If Name & Price match -> PASS\n" +
        "3. If Price is WRONG -> REJECT", 
        { fontSize: '20px', color: '#ccc', align: 'center', lineSpacing: 10 }
    ).setOrigin(0.5);

    const startBtn = scene.add.text(400, 450, "[ CLICK TO START ]", { fontSize: '32px', color: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
    
    scene.tweens.add({ targets: startBtn, alpha: 0.5, duration: 800, yoyo: true, repeat: -1 });

    startBtn.on('pointerdown', () => {
        scene.startMenuContainer.setVisible(false);
        isGameRunning = true;
        spawnTimer.paused = false;
        gameTimer.paused = false;
        spawnBox.call(scene);
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

    // 逻辑：VALID 的必须 PASS，INVALID 的必须 REJECT
    if (decision === 'PASS') {
        if (data.isValid) correct = true;
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
    // 依然发送到后端 API，假装在验证
    const payload = { name: "Game Check", quantity: 1, price: price };
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
        scene.scene.restart(); 
    });
}

