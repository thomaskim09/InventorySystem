/**
 * THE STELLAR FORGE v5.1 - ASSET INTEGRATION
 * Fixed: Now uses the loaded images instead of white shapes.
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

// --- 1. GAME DATA ---
const ELEMENTS = {
    RED:    { color: 0xFF4444, name: "Plasma" }, // Heat
    BLUE:   { color: 0x4444FF, name: "Fluid" },  // Liquid
    GREEN:  { color: 0x44FF44, name: "Bio" },    // Life
    YELLOW: { color: 0xFFFF44, name: "Volt" }    // Energy
};

const RECIPES = [
    { ingredients: ["RED", "RED"],       name: "Titanium Ingot", category: "Raw Material", basePrice: 50 },
    { ingredients: ["BLUE", "BLUE"],     name: "Heavy Water",    category: "Chemical",     basePrice: 45 },
    { ingredients: ["GREEN", "GREEN"],   name: "Dense Algae",    category: "Organic",      basePrice: 30 },
    { ingredients: ["YELLOW", "YELLOW"], name: "Arc Pylon",      category: "Energy",       basePrice: 80 },
    { ingredients: ["RED", "BLUE"],      name: "Steam Turbine",  category: "Machinery",    basePrice: 150 },
    { ingredients: ["RED", "GREEN"],     name: "Spice Melange",  category: "Luxury",       basePrice: 500 },
    { ingredients: ["RED", "YELLOW"],    name: "Fusion Cell",    category: "Ammo",         basePrice: 200 },
    { ingredients: ["BLUE", "GREEN"],    name: "Growth Stim",    category: "Medical",      basePrice: 120 },
    { ingredients: ["BLUE", "YELLOW"],   name: "Coolant Pump",   category: "Parts",        basePrice: 100 },
    { ingredients: ["GREEN", "YELLOW"],  name: "Neural Net",     category: "Electronics",  basePrice: 350 },
    { ingredients: ["RED", "BLUE", "YELLOW"], name: "Hyper Engine", category: "Vehicle", basePrice: 800 },
    { ingredients: ["RED", "GREEN", "BLUE"],  name: "Terraform Kit",category: "Tool",    basePrice: 950 }
];

// --- STATE ---
let gameState = "MENU";
let score = 0;
let lives = 3;
let level = 1;
let timeLimit = 15000;
let memoryTime = 3000; 
let currentMix = [];
let activeOrder = null;
let isBusy = false;
let isRecipeHidden = false;
let currentHeldOrb = null; 

// --- PHASER OBJECTS ---
let forgeCore, forgeZone;
let timerBar, timerBg;
let labels = {}; 
let orderTimerEvent;
let memoryTimerEvent;
let hazardsGroup, orbsGroup;
let bgParticles;

// --- ASSET KEYS ---
// Make sure these match the filenames you generated!
const ASSETS = {
    BG: 'bg_space',
    FORGE: 'forge',
    HAZARD: 'hazard',
    FLARE: 'flare',
    ORB_RED: 'orb_red',
    ORB_BLUE: 'orb_blue',
    ORB_GREEN: 'orb_green',
    ORB_YELLOW: 'orb_yellow'
};

const SOUNDS = {
    drag: 'sfx_drag',
    drop: 'sfx_drop',
    success: 'sfx_success',
    fail: 'sfx_fail',
    alarm: 'sfx_alarm'
};

function preload() {
    // --- IMAGES ---
    // Ensure these paths match exactly where you put the files
    this.load.image(ASSETS.BG, '../../assets/create_item/img/bg_space.png');
    this.load.image(ASSETS.FORGE, '../../assets/create_item/img/forge.png');
    this.load.image(ASSETS.HAZARD, '../../assets/create_item/img/hazard.png');
    this.load.image(ASSETS.FLARE, '../../assets/create_item/img/flare.png');
    
    this.load.image(ASSETS.ORB_RED, '../../assets/create_item/img/orb_red.png');
    this.load.image(ASSETS.ORB_BLUE, '../../assets/create_item/img/orb_blue.png');
    this.load.image(ASSETS.ORB_GREEN, '../../assets/create_item/img/orb_green.png');
    this.load.image(ASSETS.ORB_YELLOW, '../../assets/create_item/img/orb_yellow.png');

    // --- AUDIO (Uncomment when you have files) ---
    // this.load.audio(SOUNDS.drag, '../../assets/create_item/sfx_drag.wav');
    // this.load.audio(SOUNDS.drop, '../../assets/create_item/sfx_drop.wav');
    // this.load.audio(SOUNDS.success, '../../assets/create_item/sfx_success.wav');
    // this.load.audio(SOUNDS.fail, '../../assets/create_item/sfx_fail.wav');
}

function create() {
    // 1. Background Image (Replaces black rectangle)
    // If the image doesn't load, it falls back to a dark color.
    if(this.textures.exists(ASSETS.BG)) {
        this.add.image(400, 300, ASSETS.BG).setDisplaySize(800, 600);
    } else {
        this.add.rectangle(400, 300, 800, 600, 0x050510);
    }
    
    // 2. Starfield (Using loaded flare or generating one)
    if(!this.textures.exists(ASSETS.FLARE)) {
        const graphics = this.make.graphics({x:0, y:0, add:false});
        graphics.fillStyle(0xffffff,1); graphics.fillCircle(4,4,4);
        graphics.generateTexture(ASSETS.FLARE, 8, 8);
    }
    
    // Generate 100 breathing stars
    for(let i=0; i<100; i++) {
        const x = Phaser.Math.Between(0, 800);
        const y = Phaser.Math.Between(0, 600);
        const scale = Phaser.Math.FloatBetween(0.1, 0.4);
        const star = this.add.image(x, y, ASSETS.FLARE)
            .setScale(scale)
            .setAlpha(Phaser.Math.FloatBetween(0.1, 0.5));
        
        this.tweens.add({
            targets: star,
            alpha: { from: 0.2, to: 0.8 },
            scale: { from: scale, to: scale * 1.5 },
            duration: Phaser.Math.Between(2000, 5000),
            yoyo: true,
            repeat: -1,
            delay: Phaser.Math.Between(0, 2000),
            ease: 'Sine.easeInOut'
        });
    }

    // 3. Physics Groups
    hazardsGroup = this.physics.add.group();
    orbsGroup = this.physics.add.group();

    // 4. UI Setup
    createMenuUI(this);
    createGameUI(this);
    createGameOverUI(this);

    // 5. Global Input for Instant Drag
    this.input.on('pointermove', (pointer) => {
        if (currentHeldOrb) {
            currentHeldOrb.x = pointer.x;
            currentHeldOrb.y = pointer.y;
        }
    });

    this.input.on('pointerup', () => {
        if (currentHeldOrb) {
            dropOrb(this, currentHeldOrb);
            currentHeldOrb = null;
        }
    });

    switchState(this, "MENU");
}

function update(time, delta) {
    if (gameState === "PLAY") {
        if (activeOrder && !isBusy && orderTimerEvent) {
            const progress = orderTimerEvent.getProgress();
            timerBar.width = 400 * (1 - progress);
            if(progress > 0.8) {
                timerBar.fillColor = 0xff0000;
                if(Math.floor(time)%200 < 50) labels.timerText.setText("CRITICAL!");
            } else {
                timerBar.fillColor = 0x00ff00;
                labels.timerText.setText("");
            }
        }

        // Rotate Hazards
        hazardsGroup.getChildren().forEach(h => {
            h.angle += 2;
            if(h.x < -50 || h.x > 850) h.destroy();
        });

        this.physics.overlap(orbsGroup, hazardsGroup, (orb, hazard) => {
            destroyOrb(this, orb, true);
        });
    }
}

// --- CORE GAMEPLAY ---

function switchState(scene, newState) {
    gameState = newState;
    labels.menuContainer.setVisible(false);
    labels.gameContainer.setVisible(false);
    labels.overContainer.setVisible(false);

    if (newState === "MENU") {
        labels.menuContainer.setVisible(true);
        score = 0; lives = 3; level = 1;
    } else if (newState === "PLAY") {
        labels.gameContainer.setVisible(true);
        updateHUD();
        startNewOrder(scene);
    } else if (newState === "GAMEOVER") {
        labels.overContainer.setVisible(true);
        labels.finalScore.setText(`SCORE: ${score}\nITEMS CRAFTED: ${level-1}`);
        if(orderTimerEvent) orderTimerEvent.remove();
        hazardsGroup.clear(true, true);
    }
}

function startNewOrder(scene) {
    currentMix = [];
    isBusy = false;
    isRecipeHidden = false;
    
    // Reset Forge Visuals
    forgeCore.setTint(0xffffff);
    labels.mixText.setText("Forge Empty");
    
    activeOrder = Phaser.Utils.Array.GetRandom(RECIPES);
    
    labels.orderText.setText(`REQUEST: ${activeOrder.name.toUpperCase()}`);
    labels.orderText.setColor('#ffffff');
    labels.catText.setText(`[ ${activeOrder.category} ]`);

    renderRecipeIcons(scene, activeOrder.ingredients, true);

    if(memoryTimerEvent) memoryTimerEvent.remove();
    const memTime = Math.max(1000, memoryTime - (level * 200));
    
    memoryTimerEvent = scene.time.delayedCall(memTime, () => {
        if(!isBusy && gameState === "PLAY") {
            isRecipeHidden = true;
            renderRecipeIcons(scene, activeOrder.ingredients, false);
            playSound(scene, 'alarm');
        }
    });

    if(orderTimerEvent) orderTimerEvent.remove();
    orderTimerEvent = scene.time.delayedCall(timeLimit, () => {
        failOrder(scene, "ORDER TIMED OUT");
    });

    if(Math.random() * 10 < level) spawnHazard(scene);
}

function createSpawner(scene, x, y, color, type) {
    // Spawner Ring
    const bg = scene.add.circle(x, y, 35, color, 0.2).setStrokeStyle(2, color);
    
    // Inner Icon (using the Orb Image scaled down)
    const iconKey = 'orb_' + type.toLowerCase();
    if(scene.textures.exists(iconKey)) {
        scene.add.image(x, y, iconKey).setDisplaySize(40, 40).setAlpha(0.8);
    }

    const hit = scene.add.circle(x, y, 35, color, 0.001).setInteractive({ cursor: 'pointer' });
    
    hit.on('pointerdown', (pointer) => {
        if(gameState !== "PLAY" || isBusy) return;
        playSound(scene, 'drag');

        // Create the Orb IMAGE instead of a circle
        const orbKey = 'orb_' + type.toLowerCase();
        let orb;
        
        if (scene.textures.exists(orbKey)) {
            orb = scene.add.image(x, y, orbKey);
            orb.setDisplaySize(48, 48); // Scale it nicely
        } else {
            // Fallback if image missing
            orb = scene.add.circle(x, y, 22, color);
        }

        orb.setDepth(10);
        scene.physics.add.existing(orb);
        // Physics body is a circle for collision
        orb.body.setCircle(20); 
        orb.typeCode = type;
        
        // Trail
        const particles = scene.add.particles(0, 0, ASSETS.FLARE, {
            speed: 40, scale: { start: 0.4, end: 0 }, blendMode: 'ADD', tint: color
        });
        particles.startFollow(orb);
        orb.particles = particles;

        orbsGroup.add(orb);
        currentHeldOrb = orb; 
    });
}

function dropOrb(scene, orb) {
    if (scene.physics.overlap(orb, forgeZone)) {
        addIngredient(scene, orb.typeCode);
        createExplosion(scene, orb.x, orb.y, 0xffffff);
        playSound(scene, 'drop');
        destroyOrb(scene, orb, false);
    } else {
        destroyOrb(scene, orb, true);
    }
}

function addIngredient(scene, type) {
    currentMix.push(type);
    
    // Animate Forge Pulse
    scene.tweens.add({
        targets: forgeCore,
        scale: { from: 1.1, to: 1 },
        duration: 100
    });

    labels.mixText.setText(`Contains: ${currentMix.length} Elements`);

    const sortedMix = [...currentMix].sort();
    const sortedReq = [...activeOrder.ingredients].sort();

    if (sortedMix.length > sortedReq.length) {
        failOrder(scene, "MIXTURE UNSTABLE!");
        return;
    }

    if (JSON.stringify(sortedMix) === JSON.stringify(sortedReq)) {
        succeedOrder(scene);
    }
}

function succeedOrder(scene) {
    isBusy = true;
    orderTimerEvent.remove();
    memoryTimerEvent.remove();
    playSound(scene, 'success');

    const timeLeftPct = 1 - orderTimerEvent.getProgress();
    let producedQty = 1;
    let qualityMsg = "Standard Quality";

    if (timeLeftPct > 0.7) {
        producedQty = 5;
        qualityMsg = "MASTERWORK! (5x)";
    } else if (timeLeftPct > 0.4) {
        producedQty = 3;
        qualityMsg = "Great Quality (3x)";
    }

    labels.orderText.setText(qualityMsg);
    labels.orderText.setColor("#00ff00");
    forgeCore.setTint(0x00ff00);
    renderRecipeIcons(scene, activeOrder.ingredients, true);

    apiCreateItem({
        name: activeOrder.name,
        quantity: producedQty,
        price: activeOrder.basePrice,
        category: activeOrder.category
    }).then(res => {
        if(res.success) {
            score += Math.floor(activeOrder.basePrice * producedQty);
            level++;
            updateHUD();
            showFloatText(scene, 400, 300, `+${producedQty} Stock`, 0x00ff00);
            scene.time.delayedCall(1500, () => {
                if(gameState === "PLAY") startNewOrder(scene);
            });
        }
    });
}

function failOrder(scene, reason) {
    isBusy = true;
    orderTimerEvent.remove();
    memoryTimerEvent.remove();
    playSound(scene, 'fail');
    
    lives--;
    updateHUD();
    
    labels.orderText.setText(reason);
    labels.orderText.setColor("#ff0000");
    forgeCore.setTint(0xff0000);
    renderRecipeIcons(scene, activeOrder.ingredients, true);

    scene.cameras.main.shake(200, 0.01);

    if (lives <= 0) {
        scene.time.delayedCall(1000, () => switchState(scene, "GAMEOVER"));
    } else {
        scene.time.delayedCall(2000, () => {
            if(gameState === "PLAY") startNewOrder(scene);
        });
    }
}

// --- HELPERS ---

function destroyOrb(scene, orb, explode) {
    if(orb.particles) orb.particles.destroy();
    if(explode) createExplosion(scene, orb.x, orb.y, 0xffaa00);
    orb.destroy();
    if(currentHeldOrb === orb) currentHeldOrb = null;
}

function createExplosion(scene, x, y, color) {
    const emitter = scene.add.particles(x, y, ASSETS.FLARE, {
        speed: { min: 50, max: 150 }, scale: { start: 0.5, end: 0 },
        blendMode: 'ADD', tint: color, lifespan: 400, quantity: 15
    });
    scene.time.delayedCall(400, () => emitter.destroy());
}

function spawnHazard(scene) {
    const side = Phaser.Math.Between(0, 1);
    const x = side === 0 ? -50 : 850;
    const y = Phaser.Math.Between(100, 500);
    
    // Use Hazard Image
    let h;
    if (scene.textures.exists(ASSETS.HAZARD)) {
        h = scene.add.image(x, y, ASSETS.HAZARD);
        h.setDisplaySize(64, 64);
    } else {
        h = scene.add.rectangle(x, y, 40, 40, 0xaa0000);
    }

    scene.physics.add.existing(h);
    h.body.setVelocity(side === 0 ? 150 : -150, Phaser.Math.Between(-50, 50));
    hazardsGroup.add(h);
}

function renderRecipeIcons(scene, ingredients, visible) {
    labels.recipeContainer.removeAll(true);
    if(!visible) {
        const q = scene.add.text(0, 0, "???  ???", { fontSize: '24px', color: '#555' }).setOrigin(0.5);
        labels.recipeContainer.add(q);
        return;
    }
    
    let startX = -((ingredients.length - 1) * 20);
    ingredients.forEach((ing, i) => {
        // Use small versions of the element images
        const key = 'orb_' + ing.toLowerCase();
        let icon;
        if(scene.textures.exists(key)) {
            icon = scene.add.image(startX + (i * 40), 0, key).setDisplaySize(30, 30);
        } else {
            icon = scene.add.circle(startX + (i * 40), 0, 15, ELEMENTS[ing].color).setStrokeStyle(2, 0xffffff);
        }
        labels.recipeContainer.add(icon);
    });
}

function showFloatText(scene, x, y, msg, color) {
    const t = scene.add.text(x, y, msg, { fontSize: '24px', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    t.setTint(color);
    scene.tweens.add({ targets: t, y: y-50, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
}

function playSound(scene, key) {
    if(scene.cache.audio.exists(SOUNDS[key])) scene.sound.play(SOUNDS[key]);
}

// --- UI LAYOUT ---

function createGameUI(scene) {
    const c = scene.add.container(0, 0);
    
    labels.scoreText = scene.add.text(780, 20, "0", { fontSize: '24px', color: '#00ff00' }).setOrigin(1, 0);
    labels.livesText = scene.add.text(20, 20, "SHIELDS: 3", { fontSize: '24px', color: '#00ffff' }).setOrigin(0, 0);
    labels.timerText = scene.add.text(400, 140, "", { fontSize: '12px', color: '#ff0000' }).setOrigin(0.5);
    
    labels.orderText = scene.add.text(400, 60, "READY", { fontSize: '28px', fontStyle: 'bold' }).setOrigin(0.5);
    labels.catText = scene.add.text(400, 90, "", { fontSize: '14px', color: '#aaa' }).setOrigin(0.5);
    
    labels.recipeContainer = scene.add.container(400, 120);

    timerBg = scene.add.rectangle(400, 160, 400, 8, 0x333333);
    timerBar = scene.add.rectangle(200, 160, 400, 8, 0x00ff00).setOrigin(0, 0.5);

    // Use Forge Image if available
    if(scene.textures.exists(ASSETS.FORGE)) {
        forgeCore = scene.add.image(400, 360, ASSETS.FORGE).setDisplaySize(200, 200);
    } else {
        forgeCore = scene.add.circle(400, 360, 75, 0x222222).setStrokeStyle(4, 0x666666);
    }
    
    forgeZone = scene.physics.add.sprite(400, 360, null).setSize(160, 160).setVisible(false);
    labels.mixText = scene.add.text(400, 360, "Empty", { fontSize: '14px', color: '#666' }).setOrigin(0.5);

    createSpawner(scene, 180, 520, ELEMENTS.RED.color, "RED");
    createSpawner(scene, 320, 520, ELEMENTS.BLUE.color, "BLUE");
    createSpawner(scene, 480, 520, ELEMENTS.GREEN.color, "GREEN");
    createSpawner(scene, 620, 520, ELEMENTS.YELLOW.color, "YELLOW");

    c.add([labels.scoreText, labels.livesText, labels.timerText, labels.orderText, labels.catText, labels.recipeContainer, timerBg, timerBar, forgeCore, forgeZone, labels.mixText]);
    labels.gameContainer = c;
}

function updateHUD() {
    labels.scoreText.setText(`$${score}`);
    labels.livesText.setText(`SHIELDS: ${lives}`);
}

function createMenuUI(scene) {
    const c = scene.add.container(0, 0);
    const bg = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
    const title = scene.add.text(400, 200, "STELLAR FORGE", { fontSize: '60px', fontStyle: 'bold', color: '#00ffff' }).setOrigin(0.5);
    const sub = scene.add.text(400, 260, "MEMORIZE. SYNTHESIZE. SURVIVE.", { fontSize: '20px', color: '#aaa' }).setOrigin(0.5);
    const start = scene.add.text(400, 400, "CLICK TO START", { fontSize: '28px', color: '#fff' }).setOrigin(0.5).setInteractive({cursor: 'pointer'});
    start.on('pointerdown', () => switchState(scene, "PLAY"));
    c.add([bg, title, sub, start]);
    labels.menuContainer = c;
}

function createGameOverUI(scene) {
    const c = scene.add.container(0, 0);
    const bg = scene.add.rectangle(400, 300, 800, 600, 0x220000, 0.95);
    const title = scene.add.text(400, 200, "CRITICAL FAILURE", { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);
    labels.finalScore = scene.add.text(400, 300, "", { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
    const rst = scene.add.text(400, 450, "REBOOT SYSTEM", { fontSize: '24px' }).setOrigin(0.5).setInteractive({cursor: 'pointer'});
    rst.on('pointerdown', () => switchState(scene, "MENU"));
    c.add([bg, title, labels.finalScore, rst]);
    labels.overContainer = c;
}