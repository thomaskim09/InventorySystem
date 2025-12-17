/**
 * CARGO LOGISTICS CENTER - UPDATE MODULE
 * Gameplay: Adjust stock quantities to match shipping manifests.
 * API: Calls apiUpdateItem(id, quantity)
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

// --- 1. GAME STATE ---
let gameState = "MENU";
let gameMode = "RANDOM"; // "RANDOM" = Match target mode, "ADJUST" = Free adjust mode
let availableItems = []; // All items from database
let selectedItemIndex = 0; // Currently selected item index
let score = 0;
let level = 1;
let totalTime = 30000; // 30 seconds per round
let isBusy = false;

// The current task data
let currentTask = {
    id: 0,          // Item ID from database
    name: "",       // Item Name
    currentQty: 0,  // What we have now
    targetQty: 0    // What the manifest wants
};

let userInputValue = 0; // The value player is adjusting

// Base scale for box sprite (adjust if image is too large)
const BOX_BASE_SCALE = 0.37; // Change this to resize: 0.05=tiny, 0.08=medium, 0.12=large

// --- PHASER OBJECTS ---
let timerEvent;
let boxSprite;
let particles;
let arrowUpBtn, arrowDownBtn, dispatchBtn;

// UI Labels
let labels = {}; 

// --- ASSET KEYS ---
const ASSETS = {
    BG: 'bg_logistics',
    BOX: 'box_crate',
    ARROW_UP: 'btn_arrow_up',
    ARROW_DOWN: 'btn_arrow_down',
    BTN_SEND: 'btn_dispatch',
    FLARE: 'flare'
};

function preload() {
    // --- LOAD IMAGES ---
    this.load.image(ASSETS.BG, '../../assets/update_item/img/bg_warehouse.png');
    this.load.image(ASSETS.BOX, '../../assets/update_item/img/box_create.png');
    this.load.image(ASSETS.ARROW_UP, '../../assets/update_item/img/arrow_up.png');
    this.load.image(ASSETS.ARROW_DOWN, '../../assets/update_item/img/arrow_down.png');
    this.load.image(ASSETS.BTN_SEND, '../../assets/update_item/img/btn_send.png');
    this.load.image(ASSETS.FLARE, '../../assets/global/flare.png');

    // Fallback if images don't load
    this.load.on('loaderror', (file) => {
        console.warn('Failed to load:', file.key);
    });
}

function create() {
    // Background
    if (this.textures.exists(ASSETS.BG)) {
        this.add.image(400, 300, ASSETS.BG);
    } else {
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);
    }

    // Box sprite (hidden initially)
    // Box size controlled by BOX_BASE_SCALE constant at top
    if (this.textures.exists(ASSETS.BOX)) {
        boxSprite = this.add.image(400, 300, ASSETS.BOX);
    } else {
        boxSprite = this.add.rectangle(400, 300, 180, 180, 0x8B4513);
    }
    boxSprite.setScale(0); // Initially hidden

    // Particle emitter
    if (this.textures.exists(ASSETS.FLARE)) {
        particles = this.add.particles(0, 0, ASSETS.FLARE, {
            speed: { min: 50, max: 150 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 600,
            gravityY: -100
        });
        particles.stop();
    }

    // Timer bar
    labels.timerBg = this.add.rectangle(400, 30, 400, 20, 0x333333);
    labels.timerBar = this.add.rectangle(200, 30, 400, 20, 0x00ff88);
    labels.timerBar.setOrigin(0, 0.5);

    // Score and level
    labels.scoreText = this.add.text(20, 20, 'SCORE: 0', {
        fontSize: '20px',
        fill: '#FFD700',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    });

    labels.levelText = this.add.text(700, 20, 'LV: 1', {
        fontSize: '20px',
        fill: '#00FFFF',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    });

    switchState(this, "MENU");
}

function update(time, delta) {
    if (gameState === "PLAYING") {
        // Update timer bar
        if (timerEvent) {
            const progress = timerEvent.getProgress();
            labels.timerBar.width = 400 * (1 - progress);
            
            if (progress >= 1) {
                failOrder(this);
            }
        }
    }
}

// --- CORE GAMEPLAY LOGIC ---
function switchState(scene, newState) {
    console.log('🔄 Switching to:', newState);
    gameState = newState;
    const keepObjects = [labels.scoreText, labels.levelText, labels.timerBg, labels.timerBar, boxSprite, particles];
    
    if (scene.children && scene.children.list) {
        const toDestroy = scene.children.list.filter(obj => {
            return !keepObjects.includes(obj) && 
                   (obj.type === 'Text' || obj.type === 'Container' || obj.type === 'Rectangle');
        });
        
        toDestroy.forEach(obj => {
            if (obj && obj.destroy) {
                obj.destroy();
            }
        });
    }

    if (arrowUpBtn) {
        arrowUpBtn = null;
    }
    if (arrowDownBtn) {
        arrowDownBtn = null;
    }
    if (dispatchBtn) {
        dispatchBtn = null;
    }

    const keepLabels = ['scoreText', 'levelText', 'timerBg', 'timerBar'];
    Object.keys(labels).forEach(key => {
        if (!keepLabels.includes(key)) {
            delete labels[key];
        }
    });
    
    if (boxSprite) {
        boxSprite.setScale(0);
        boxSprite.setAlpha(1);
        boxSprite.y = 300;
    }

    if (newState === "MENU") {
        createMenuUI(scene);
    } else if (newState === "SELECT_MODE") {
        createModeSelectionUI(scene);
    } else if (newState === "SELECT_ITEM") {
        loadAndShowItemSelection(scene);
    } else if (newState === "PLAYING") {
        createGameUI(scene);
        startNewRound(scene);
    } else if (newState === "GAMEOVER") {
        createGameOverUI(scene);
    }
}

function startNewRound(scene) {
    isBusy = false;

    if (timerEvent) timerEvent.remove();
    timerEvent = scene.time.delayedCall(totalTime, () => {
        failOrder(scene);
    });

    generateNewTask(scene);
}

function generateNewTask(scene) {
    labels.statusText.setText("📡 LOADING MANIFEST...");
    labels.statusText.setColor('#ffaa00');
    
    if (availableItems.length === 0) {
        labels.statusText.setText("❌ NO ITEMS AVAILABLE!");
        labels.statusText.setColor('#ff0000');
        labels.instructions.setText("Please select an item first.");
        return;
    }
    
    const selectedItem = availableItems[selectedItemIndex];
    const currentQty = parseInt(selectedItem.quantity) || 0;
    
    if (gameMode === "RANDOM") {
        // RANDOM mode: Generate a target value for player to match
        const adjustment = Phaser.Math.Between(-5, 10);
        let targetQty = currentQty + adjustment;
        if (targetQty < 0) targetQty = 0;
        
        currentTask = {
            id: parseInt(selectedItem.id),
            name: selectedItem.item_name,
            currentQty: currentQty,
            targetQty: targetQty
        };
        
        userInputValue = currentTask.currentQty;
    } else {
        // ADJUST mode: Player directly adjusts quantity
        currentTask = {
            id: parseInt(selectedItem.id),
            name: selectedItem.item_name,
            currentQty: currentQty,
            targetQty: currentQty // Sync target with current
        };
        
        userInputValue = currentQty;
    }
    
    updateDisplayValues();
    
    scene.tweens.add({
        targets: boxSprite,
        scale: { from: 0, to: BOX_BASE_SCALE },
        duration: 400,
        ease: 'Back.out'
    });
    
    labels.statusText.setText("📋 NEW ORDER RECEIVED");
    labels.statusText.setColor('#001F3D');
    
    console.log("✅ Task generated:", currentTask);
}

function adjustValue(scene, amount) {
    if (isBusy) return;
    
    userInputValue += amount;
    if (userInputValue < 0) userInputValue = 0;
    
    updateDisplayValues();
    
    // Visual feedback - slight wobble instead of scale
    // Stop all rotation animations first and reset angle
    scene.tweens.killTweensOf(boxSprite);
    boxSprite.angle = 0;
    
    scene.tweens.add({
        targets: boxSprite,
        angle: amount > 0 ? 5 : -5,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut'
    });
}

function updateDisplayValues() {
    if (labels.itemName) {
        labels.itemName.setText(`ITEM: ${currentTask.name}`);
    }
    if (labels.currentQtyText) {
        labels.currentQtyText.setText(`DATABASE: ${currentTask.currentQty}`);
    }
    
    if (gameMode === "RANDOM") {
        if (labels.targetQtyText) {
            labels.targetQtyText.setText(`TARGET: ${currentTask.targetQty}`);
        }
        if (labels.userValueText) {
            const isCorrect = userInputValue === currentTask.targetQty;
            labels.userValueText.setText(`YOUR INPUT: ${userInputValue}`);
            labels.userValueText.setColor(isCorrect ? '#00FF88' : '#FFFF00');
        }
    } else {
        // Free adjust mode
        if (labels.targetQtyText) {
            labels.targetQtyText.setText(`MODE: FREE ADJUST`);
        }
        if (labels.userValueText) {
            const changed = userInputValue !== currentTask.currentQty;
            labels.userValueText.setText(`NEW QTY: ${userInputValue}`);
            labels.userValueText.setColor(changed ? '#FFD700' : '#87CEEB');
        }
    }
}

function attemptDispatch(scene) {
    if (isBusy) return;
    isBusy = true;

    if (gameMode === "RANDOM") {
        // Random mode: Check if value matches target
        if (userInputValue !== currentTask.targetQty) {
            labels.statusText.setText("❌ QUANTITY MISMATCH!");
            labels.statusText.setColor('#ff3333');
            
            scene.cameras.main.shake(200, 0.01);
            
            scene.time.delayedCall(1000, () => {
                labels.statusText.setText("TRY AGAIN");
                labels.statusText.setColor('#ffaa00');
                isBusy = false;
            });
            return;
        }
    } else {
        // Adjust mode: Update directly
        if (userInputValue === currentTask.currentQty) {
            labels.statusText.setText("⚠️ NO CHANGES MADE!");
            labels.statusText.setColor('#ffaa00');
            isBusy = false;
            return;
        }
    }

    // SUCCESS - Update database
    labels.statusText.setText("📤 DISPATCHING...");
    labels.statusText.setColor('#00aaff');

    console.log("Calling API with:", { id: currentTask.id, quantity: userInputValue });
    
    apiUpdateItem({
        id: currentTask.id,
        quantity: userInputValue
    }).then(res => {
        console.log("API Update Response:", res);
        
        if (res.success) {
            handleSuccess(scene);
        } else {
            labels.statusText.setText("❌ " + (res.message || "UPDATE FAILED"));
            labels.statusText.setColor('#ff0000');
            
            scene.time.delayedCall(2000, () => {
                isBusy = false;
                labels.statusText.setText("RETRY");
            });
        }
    }).catch(err => {
        console.error("❌ API Error:", err);
        labels.statusText.setText("⚠ NETWORK ERROR");
        labels.statusText.setColor('#ff0000');
        
        scene.time.delayedCall(2000, () => {
            isBusy = false;
        });
    });
}

function handleSuccess(scene) {
    labels.statusText.setText("✅ DISPATCHED!");
    labels.statusText.setColor('#00ff00');

    // Particle effect
    if (particles) {
        particles.emitParticleAt(boxSprite.x, boxSprite.y, 30);
    }

    // Box success animation: jump + flicker
    scene.tweens.add({
        targets: boxSprite,
        y: 200,
        duration: 300,
        ease: 'Cubic.out',
        yoyo: true,
        onComplete: () => {
            // Flicker effect
            scene.tweens.add({
                targets: boxSprite,
                alpha: 0.3,
                duration: 100,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    // Update current task database value to new value
                    currentTask.currentQty = userInputValue;
                    
                    // Update availableItems array so next round reads correct value
                    if (availableItems[selectedItemIndex]) {
                        availableItems[selectedItemIndex].quantity = userInputValue;
                    }
                    
                    // Update display
                    if (labels.currentQtyText) {
                        labels.currentQtyText.setText(`DATABASE: ${currentTask.currentQty}`);
                    }
                    
                    if (gameMode === "RANDOM") {
                        // Random mode: Update score
                        const points = 100 + (level * 10);
                        score += points;
                        labels.scoreText.setText(`SCORE: ${score}`);
                        
                        // Level up every 3 rounds
                        if (score % 300 === 0) {
                            level++;
                            labels.levelText.setText(`LV: ${level}`);
                            totalTime = Math.max(15000, totalTime - 2000);
                        }
                    }
                    
                    // Continue to next round
                    scene.time.delayedCall(800, () => {
                        startNewRound(scene);
                    });
                }
            });
        }
    });
}

function failOrder(scene) {
    labels.statusText.setText("⏰ TIME'S UP!");
    labels.statusText.setColor('#ff0000');
    
    scene.cameras.main.shake(300, 0.015);
    
    scene.time.delayedCall(2000, () => {
        switchState(scene, "GAMEOVER");
    });
}

// --- UI BUILDER FUNCTIONS ---

function createModeSelectionUI(scene) {
    scene.add.text(400, 120, '🎮 SELECT GAME MODE', {
        fontSize: '28px',
        fill: '#FFD700',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Random target mode
    scene.add.text(400, 220, '🎲 RANDOM TARGET', {
        fontSize: '22px',
        fill: '#00FFFF',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    
    scene.add.text(400, 255, 'Match the target quantity to dispatch', {
        fontSize: '14px',
        fill: '#CCCCCC',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    const randomBtn = createButton(scene, 400, 300, 'PLAY RANDOM MODE', () => {
        gameMode = "RANDOM";
        switchState(scene, "SELECT_ITEM");
    });
    randomBtn.setScale(1.2);
    
    // Free adjust mode
    scene.add.text(400, 360, '⚙️ FREE ADJUST', {
        fontSize: '22px',
        fill: '#FFD700',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    
    scene.add.text(400, 395, 'Freely adjust inventory quantities', {
        fontSize: '14px',
        fill: '#CCCCCC',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    const adjustBtn = createButton(scene, 400, 440, 'PLAY ADJUST MODE', () => {
        gameMode = "ADJUST";
        switchState(scene, "SELECT_ITEM");
    });
    adjustBtn.setScale(1.2);
    
    // Back button
    const backBtn = createButton(scene, 400, 520, 'BACK TO MENU', () => {
        switchState(scene, "MENU");
    });
}

function loadAndShowItemSelection(scene) {
    const loadingText = scene.add.text(400, 300, '⏳ LOADING ITEMS...', {
        fontSize: '24px',
        fill: '#00FFFF',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    apiListItems().then(res => {
        loadingText.destroy();
        
        if (!res.success || !res.items || res.items.length === 0) {
            scene.add.text(400, 250, '❌ NO ITEMS IN DATABASE', {
                fontSize: '24px',
                fill: '#ff0000',
                fontFamily: 'Courier New'
            }).setOrigin(0.5);
            
            scene.add.text(400, 300, 'Please add items using Normal Mode', {
                fontSize: '16px',
                fill: '#FFFFFF',
                fontFamily: 'Courier New'
            }).setOrigin(0.5);
            
            const backBtn = createButton(scene, 400, 400, 'BACK TO MENU', () => {
                switchState(scene, "MENU");
            });
            return;
        }
        
        availableItems = res.items;
        selectedItemIndex = 0;
        createItemSelectionUI(scene);
    }).catch(err => {
        loadingText.destroy();
        scene.add.text(400, 300, '⚠️ CONNECTION ERROR', {
            fontSize: '24px',
            fill: '#ff0000',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
    });
}

function createItemSelectionUI(scene) {
    const modeIcon = gameMode === "RANDOM" ? '🎲' : '⚙️';
    const modeText = gameMode === "RANDOM" ? 'RANDOM TARGET' : 'FREE ADJUST';
    
    scene.add.text(400, 60, `MODE: ${modeIcon} ${modeText}`, {
        fontSize: '18px',
        fill: '#87CEEB',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    scene.add.text(400, 100, '📦 SELECT ITEM', {
        fontSize: '28px',
        fill: '#FFD700',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Display current selected item (position raised)
    const currentItem = availableItems[selectedItemIndex];
    
    labels.itemDisplay = scene.add.text(400, 180, '', {
        fontSize: '20px',
        fill: '#FFFFFF',
        fontFamily: 'Courier New',
        align: 'center'
    }).setOrigin(0.5);
    
    labels.itemCounter = scene.add.text(400, 240, '', {
        fontSize: '16px',
        fill: '#87CEEB',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    updateItemDisplay();
    
    // Item navigation buttons (moved down to avoid text overlap)
    const prevBtn = createButton(scene, 280, 300, '◀ PREV', () => {
        selectedItemIndex = (selectedItemIndex - 1 + availableItems.length) % availableItems.length;
        updateItemDisplay();
    });
    
    const nextBtn = createButton(scene, 520, 300, 'NEXT ▶', () => {
        selectedItemIndex = (selectedItemIndex + 1) % availableItems.length;
        updateItemDisplay();
    });
    
    // Start game button
    const startBtn = createButton(scene, 400, 400, '▶ START PLAYING', () => {
        switchState(scene, "PLAYING");
    });
    startBtn.setScale(1.3);
    
    // Back button
    const backBtn = createButton(scene, 400, 480, 'BACK TO MODE SELECT', () => {
        switchState(scene, "SELECT_MODE");
    });
    
    function updateItemDisplay() {
        const item = availableItems[selectedItemIndex];
        labels.itemDisplay.setText(
            `${item.item_name}\n` +
            `Qty: ${item.quantity} | Price: $${item.price}`
        );
        labels.itemCounter.setText(`Item ${selectedItemIndex + 1} / ${availableItems.length}`);
    }
}

function createGameUI(scene) {
    // Mode display
    const modeIcon = gameMode === "RANDOM" ? '🎲' : '⚙️';
    const modeText = gameMode === "RANDOM" ? 'RANDOM TARGET' : 'FREE ADJUST';
    scene.add.text(400, 50, `${modeIcon} MODE: ${modeText}`, {
        fontSize: '16px',
        fill: '#87CEEB',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Top status text
    labels.statusText = scene.add.text(400, 85, 'GET READY', {
        fontSize: '24px',
        fill: '#00FFFF',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Item name
    labels.itemName = scene.add.text(400, 220, '', {
        fontSize: '22px',
        fill: '#FFD700',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instruction text
    const instruction = gameMode === "RANDOM" ? 'ADJUST TO MATCH TARGET' : 'ADJUST QUANTITY AS NEEDED';
    labels.instructions = scene.add.text(400, 250, instruction, {
        fontSize: '14px',
        fill: '#CCCCCC',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Left info panel (avoid box overlap)
    const leftX = 150;
    const startY = 320;
    
    // Database current value
    labels.currentQtyText = scene.add.text(leftX, startY, '', {
        fontSize: '16px',
        fill: '#87CEEB',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Target value
    labels.targetQtyText = scene.add.text(leftX, startY + 35, '', {
        fontSize: '18px',
        fill: '#00FF88',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Player input value
    labels.userValueText = scene.add.text(leftX, startY + 75, '', {
        fontSize: '24px',
        fill: '#FFFF00',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Right control buttons
    arrowUpBtn = createButton(scene, 650, 330, '▲', () => adjustValue(scene, 1));
    arrowDownBtn = createButton(scene, 650, 380, '▼', () => adjustValue(scene, -1));

    // Bottom buttons (uniform size)
    dispatchBtn = createButton(scene, 320, 530, '📦 DISPATCH', () => attemptDispatch(scene));
    dispatchBtn.setScale(1.1);
    
    // Back button
    const backBtn = createButton(scene, 540, 530, '⬅ BACK', () => {
        if (timerEvent) timerEvent.remove();
        switchState(scene, "SELECT_MODE");
    });
    backBtn.setScale(1.1);
}

function createButton(scene, x, y, text, callback) {
    const container = scene.add.container(x, y);
    
    // Dynamically calculate width based on text length
    const textWidth = text.length > 10 ? 240 : (text.length > 5 ? 200 : 60);
    const bg = scene.add.rectangle(0, 0, textWidth, 40, 0x2C3E50);
    const txt = scene.add.text(0, 0, text, {
        fontSize: '20px',
        fill: '#FFFFFF',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, txt]);
    container.setSize(bg.width, bg.height);

    bg.setInteractive({ useHandCursor: true });
    
    bg.on('pointerover', () => {
        bg.setFillStyle(0x34495E);
        txt.setColor('#FFD700');
        scene.tweens.add({ targets: container, scale: 1.1, duration: 100 });
    });

    bg.on('pointerout', () => {
        bg.setFillStyle(0x2C3E50);
        txt.setColor('#FFFFFF');
        scene.tweens.add({ targets: container, scale: 1.0, duration: 100 });
    });

    bg.on('pointerdown', () => {
        scene.tweens.add({
            targets: container,
            scale: 0.95,
            duration: 50,
            yoyo: true,
            onComplete: callback
        });
    });

    return container;
}

function createMenuUI(scene) {
    scene.add.text(400, 180, '📦 CARGO LOGISTICS CENTER', {
        fontSize: '28px',
        fill: '#FFD700',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    scene.add.text(400, 260, 'Update stock quantities to dispatch items', {
        fontSize: '16px',
        fill: '#FFFFFF',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);

    scene.add.text(400, 310, '🎲 RANDOM: Match target quantity', {
        fontSize: '14px',
        fill: '#87CEEB',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    scene.add.text(400, 335, '⚙️ ADJUST: Freely change inventory', {
        fontSize: '14px',
        fill: '#87CEEB',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);

    const startBtn = createButton(scene, 400, 420, 'START GAME', () => {
        switchState(scene, "SELECT_MODE");
    });
    startBtn.setScale(1.3);
}

function createGameOverUI(scene) {
    scene.add.text(400, 200, 'MISSION COMPLETE', {
        fontSize: '32px',
        fill: '#00FFFF',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    scene.add.text(400, 280, `FINAL SCORE: ${score}`, {
        fontSize: '24px',
        fill: '#FFD700',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    scene.add.text(400, 320, `LEVEL REACHED: ${level}`, {
        fontSize: '20px',
        fill: '#00FF88',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const restartBtn = createButton(scene, 400, 420, 'RESTART', () => {
        score = 0;
        level = 1;
        totalTime = 30000;
        labels.scoreText.setText('SCORE: 0');
        labels.levelText.setText('LV: 1');
        switchState(scene, "PLAYING");
    });

    const menuBtn = createButton(scene, 400, 480, 'MAIN MENU', () => {
        score = 0;
        level = 1;
        totalTime = 30000;
        labels.scoreText.setText('SCORE: 0');
        labels.levelText.setText('LV: 1');
        switchState(scene, "MENU");
    });
}