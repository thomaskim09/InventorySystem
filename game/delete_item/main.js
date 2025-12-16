// game/delete_item/main.js

const API_BASE_URL = "../../api"; 

// API 1: 获取列表
function apiListItems() {
    return fetch(`${API_BASE_URL}/items_list.php`)
        .then(response => response.text().then(text => {
            try { return JSON.parse(text); } 
            catch (e) { console.error("PHP Error:", text); throw new Error("PHP Error"); }
        }));
}

// API 2: 删除整行
function apiDeleteItem(id) {
    const formData = new FormData();
    formData.append('id', id); 
    return fetch(`${API_BASE_URL}/items_delete.php`, {
        method: 'POST',
        body: formData 
    }).then(response => response.json());
}

// API 3: 更新数量
function apiUpdateItem(id, newQuantity) {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('quantity', newQuantity);
    return fetch(`${API_BASE_URL}/items_update.php`, {
        method: 'POST',
        body: formData
    }).then(response => response.json());
}

// 📦 货架配置
const SHELF_CONFIG = {
    yPositions: [460, 370, 270], 
    startX: 120,   
    stepX: 110,   
    maxPerShelf: 3,
    capacity: 9 
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game-container",
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', '../../assets/delete_item/bg.jpg'); 
    this.load.image('crusher', '../../assets/delete_item/crusher.png'); 
    this.load.image('crate', '../../assets/delete_item/crate.png');
    this.load.image('shelf', '../../assets/delete_item/shelf.png');
}

function create() {
    const scene = this;
    
    scene.allInventoryData = []; 
    scene.activeCrates = [];     

    // 1. 背景
    this.add.image(400, 300, 'background').setDisplaySize(800, 600);

    // 2. 货架
    const shelf = this.add.image(230, 390, 'shelf').setScale(0.9); 

    // ✨ 3. 新增：退出按钮 (Exit Button) - 左上角
    const exitBtn = this.add.text(10, 10, '⬅ Exit', {
        fontSize: '18px', 
        backgroundColor: '#dc2626', // 红色背景
        color: '#ffffff',
        padding: { x: 12, y: 6 },
        fontStyle: 'bold',
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
    })
    .setInteractive({ useHandCursor: true });

    // 退出按钮交互
    exitBtn.on('pointerover', () => exitBtn.setStyle({ backgroundColor: '#b91c1c' }));
    exitBtn.on('pointerout', () => exitBtn.setStyle({ backgroundColor: '#dc2626' }));
    exitBtn.on('pointerdown', () => {
        // 跳转回 Hub 页面
        window.location.href = '../hub.php';
    });

    // 4. 状态文字 (位置下移到 y: 50，避开退出按钮)
    scene.statusText = this.add.text(10, 50, 'Loading...', { 
        fontSize: '16px', fill: '#ffffff', stroke: '#000000', strokeThickness: 3
    });
    
    // 5. 剩余数量提示 (右上角)
    scene.backlogText = this.add.text(780, 20, '', {
        fontSize: '22px', fill: '#00ff00', stroke: '#000000', strokeThickness: 4, align: 'right', fontStyle: 'bold'
    }).setOrigin(1, 0);

    // 6. "Next Batch" 按钮 (右上角)
    const nextBtn = this.add.text(780, 60, 'Next Batch ⏩', {
        fontSize: '20px', 
        backgroundColor: '#2563eb', 
        color: '#ffffff',
        padding: { x: 15, y: 10 },
        fontStyle: 'bold',
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, fill: true }
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true });

    scene.nextBtn = nextBtn;

    nextBtn.on('pointerover', () => { if (nextBtn.input.enabled) nextBtn.setStyle({ backgroundColor: '#1d4ed8' }); });
    nextBtn.on('pointerout', () => { if (nextBtn.input.enabled) nextBtn.setStyle({ backgroundColor: '#2563eb' }); });
    nextBtn.on('pointerdown', () => cycleInventory(scene)); 

    // 7. 粉碎机
    const crusher = this.add.image(600, 450, 'crusher').setScale(0.8);
    const dropZone = this.add.zone(600, 450, 150, 150).setRectangleDropZone(150, 150);

    // 8. 动态指示箭头
    const arrow = this.add.text(530, 380, 'Drag Here ↘️', {
        fontSize: '28px', fill: '#fbbf24', stroke: '#000000', strokeThickness: 5, fontStyle: 'bold'
    }).setOrigin(0.5).setRotation(0.2);

    scene.tweens.add({
        targets: arrow, y: 400, x: 540, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // 加载数据
    apiListItems().then(response => {
        if (response.success) {
            const items = response.data || response.items || [];
            if (items.length === 0) {
                scene.statusText.setText('No items found.');
            } else {
                scene.statusText.setText('Drag items to the Crusher!'); 
                scene.allInventoryData = items;
                fillShelf(scene);
            }
        } else {
            scene.statusText.setText('Error loading items.');
        }
    }).catch(err => {
        console.error(err);
        scene.statusText.setText('Connection Error.');
    });

    // --- 拖拽逻辑 ---
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
        gameObject.setScale(0.35); 
        gameObject.setDepth(999); 
        if (gameObject.dataLabel) {
            gameObject.dataLabel.x = dragX;
            gameObject.dataLabel.y = dragY;
            gameObject.dataLabel.setDepth(1000);
        }
    });

    this.input.on('dragend', (pointer, gameObject, dropped) => {
        if (!dropped) {
            gameObject.x = gameObject.input.dragStartX;
            gameObject.y = gameObject.input.dragStartY;
            gameObject.setScale(0.25); 
            gameObject.setDepth(1);
            if (gameObject.dataLabel) {
                gameObject.dataLabel.x = gameObject.x;
                gameObject.dataLabel.y = gameObject.y;
                gameObject.dataLabel.setDepth(1);
            }
        }
    });

    this.input.on('drop', (pointer, gameObject, dropZone) => {
        handleDeleteProcess(scene, gameObject, crusher); 
    });
}

function update() {}

// 换一批
function cycleInventory(scene) {
    if (!scene.allInventoryData || scene.allInventoryData.length <= scene.activeCrates.length) {
        scene.cameras.main.shake(100, 0.005);
        return;
    }

    const countOnScreen = scene.activeCrates.length;
    for (let i = 0; i < countOnScreen; i++) {
        const item = scene.allInventoryData.shift(); 
        scene.allInventoryData.push(item);           
    }

    scene.activeCrates.forEach(crate => {
        if(crate.dataLabel) crate.dataLabel.destroy();
        crate.destroy();
    });
    scene.activeCrates = [];

    fillShelf(scene);
}

// 填充货架
function fillShelf(scene) {
    const currentOnScreen = scene.activeCrates.length;
    const targetCount = Math.min(SHELF_CONFIG.capacity, scene.allInventoryData.length);
    
    if (currentOnScreen < targetCount) {
        const displayedIds = scene.activeCrates.map(c => c.getData('id'));
        
        for (let i = 0; i < scene.allInventoryData.length; i++) {
            if (scene.activeCrates.length >= SHELF_CONFIG.capacity) break;

            const itemData = scene.allInventoryData[i];
            if (!displayedIds.includes(itemData.id)) {
                spawnOneCrate(scene, itemData);
                displayedIds.push(itemData.id);
            }
        }
        rearrangeShelf(scene);
    }
    
    updateUI(scene);
}

// 更新UI
function updateUI(scene) {
    const hiddenCount = Math.max(0, scene.allInventoryData.length - scene.activeCrates.length);
    
    if (hiddenCount > 0) {
        scene.backlogText.setText(`+${hiddenCount} more in storage`);
        scene.backlogText.setStyle({ fill: '#00ff00' });
        
        scene.nextBtn.setText('Next Batch ⏩');
        scene.nextBtn.setStyle({ backgroundColor: '#2563eb' });
        scene.nextBtn.input.enabled = true;
    } else {
        scene.backlogText.setText("STORAGE EMPTY");
        scene.backlogText.setStyle({ fill: '#ef4444' });
        
        scene.nextBtn.setText('No More Items');
        scene.nextBtn.setStyle({ backgroundColor: '#6b7280' });
        scene.nextBtn.input.enabled = false;
    }
}

function spawnOneCrate(scene, item) {
    const name = item.item_name || "Unknown";
    const qty = parseInt(item.quantity) || 0;
    
    const index = scene.activeCrates.length; 
    const pos = calculatePosition(index);

    let crate = scene.add.image(pos.x, pos.y, 'crate')
        .setInteractive()
        .setScale(0.5) 
        .setDepth(1);
    
    crate.alpha = 0;
    scene.tweens.add({ targets: crate, alpha: 1, duration: 500 });

    scene.input.setDraggable(crate);
    crate.input.dragStartX = pos.x; 
    crate.input.dragStartY = pos.y;

    crate.setData('id', item.id);
    crate.setData('quantity', qty);
    crate.setData('name', name);

    let labelText = `${name}\nQty: ${qty}`;
    let label = scene.add.text(pos.x, pos.y, labelText, { 
        fontSize: '12px', align: 'center', color: '#ffffff',
        stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);

    crate.dataLabel = label;
    label.alpha = 0;
    scene.tweens.add({ targets: label, alpha: 1, duration: 500 });

    crate.on('destroy', () => label.destroy());
    scene.activeCrates.push(crate);
}

function calculatePosition(index) {
    let rowIndex = Math.floor(index / SHELF_CONFIG.maxPerShelf); 
    let colIndex = index % SHELF_CONFIG.maxPerShelf;
    if (rowIndex >= SHELF_CONFIG.yPositions.length) rowIndex = SHELF_CONFIG.yPositions.length - 1;
    return {
        x: SHELF_CONFIG.startX + (colIndex * SHELF_CONFIG.stepX),
        y: SHELF_CONFIG.yPositions[rowIndex]
    };
}

function rearrangeShelf(scene) {
    scene.activeCrates.forEach((crate, index) => {
        const newPos = calculatePosition(index);
        scene.tweens.add({
            targets: [crate, crate.dataLabel],
            x: newPos.x,
            y: newPos.y,
            duration: 500,
            ease: 'Power2' 
        });
        crate.input.dragStartX = newPos.x;
        crate.input.dragStartY = newPos.y;
    });
}

function handleDeleteProcess(scene, gameObject, target) {
    const itemId = gameObject.getData('id');
    const currentQty = parseInt(gameObject.getData('quantity'));
    const itemName = gameObject.getData('name');

    gameObject.disableInteractive();

    const input = window.prompt(`How many "${itemName}" to crush?\n(Current: ${currentQty})`, "1");

    if (input === null || input.trim() === "") {
        returnToShelf(gameObject);
        return;
    }

    const deleteAmount = parseInt(input);

    if (isNaN(deleteAmount) || deleteAmount <= 0) {
        returnToShelf(gameObject);
        return;
    }

    if (deleteAmount > currentQty) {
        alert(`You only have ${currentQty}!`);
        returnToShelf(gameObject);
        return;
    }

    const isConfirmed = window.confirm(`Crush ${deleteAmount} x ${itemName}?`);
    if (!isConfirmed) {
        returnToShelf(gameObject);
        return;
    }

    const remainingQty = currentQty - deleteAmount;

    scene.tweens.add({
        targets: [gameObject, gameObject.dataLabel],
        x: target.x,
        y: target.y,
        scale: 0.05,
        alpha: 0,
        duration: 600,
        onComplete: () => {
            if (remainingQty === 0) {
                apiDeleteItem(itemId).then(res => {
                    if (res.success) {
                        console.log("Crushed completely");
                        scene.activeCrates = scene.activeCrates.filter(c => c !== gameObject);
                        scene.allInventoryData = scene.allInventoryData.filter(i => i.id != itemId);
                        gameObject.destroy();
                        rearrangeShelf(scene);
                        fillShelf(scene); 
                    } else {
                        alert("Error: " + res.message);
                        resetCrate(gameObject);
                    }
                });
            } else {
                apiUpdateItem(itemId, remainingQty).then(res => {
                    if (res.success) {
                        gameObject.setData('quantity', remainingQty);
                        gameObject.dataLabel.setText(`${itemName}\nQty: ${remainingQty}`);
                        const dataItem = scene.allInventoryData.find(i => i.id == itemId);
                        if(dataItem) dataItem.quantity = remainingQty;
                        resetCrate(gameObject);
                    } else {
                        alert("Error: " + res.message);
                        resetCrate(gameObject);
                    }
                });
            }
        }
    });
}

function returnToShelf(gameObject) {
    gameObject.x = gameObject.input.dragStartX;
    gameObject.y = gameObject.input.dragStartY;
    gameObject.setScale(0.25);
    gameObject.setInteractive();
    if (gameObject.dataLabel) {
        gameObject.dataLabel.x = gameObject.x;
        gameObject.dataLabel.y = gameObject.y;
        gameObject.dataLabel.setAlpha(1);
    }
}

function resetCrate(gameObject) {
    gameObject.x = gameObject.input.dragStartX;
    gameObject.y = gameObject.input.dragStartY;
    gameObject.alpha = 1;
    gameObject.scale = 0.25;
    gameObject.rotation = 0; 
    gameObject.setInteractive();
    if (gameObject.dataLabel) {
        gameObject.dataLabel.x = gameObject.x;
        gameObject.dataLabel.y = gameObject.y;
        gameObject.dataLabel.alpha = 1;
        gameObject.dataLabel.scale = 1;
        gameObject.dataLabel.rotation = 0; 
    }
}