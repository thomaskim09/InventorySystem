/**
 * THE STELLAR FORGE v5.1 - ATMOSPHERE POLISH
 * Features: Smoother Starfield, 4 Elements, Hidden Recipes, Speed-based Quantity
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

// --- 1. GAME DATA (LOGICAL RECIPES) ---
const ELEMENTS = {
    RED:    { color: 0xFF4444, name: "Plasma" }, // Heat
    BLUE:   { color: 0x4444FF, name: "Fluid" },  // Liquid
    GREEN:  { color: 0x44FF44, name: "Bio" },    // Life
    YELLOW: { color: 0xFFFF44, name: "Volt" }    // Energy
};

// Logical Combinations
const RECIPES = [
    // Double Elements (Pure)
    { ingredients: ["RED", "RED"],       name: "Titanium Ingot", category: "Raw Material", basePrice: 50 },
    { ingredients: ["BLUE", "BLUE"],     name: "Heavy Water",    category: "Chemical",     basePrice: 45 },
    { ingredients: ["GREEN", "GREEN"],   name: "Dense Algae",    category: "Organic",      basePrice: 30 },
    { ingredients: ["YELLOW", "YELLOW"], name: "Arc Pylon",      category: "Energy",       basePrice: 80 },

    // Mixed Elements (Compounds)
    { ingredients: ["RED", "BLUE"],      name: "Steam Turbine",  category: "Machinery",    basePrice: 150 }, // Heat + Fluid
    { ingredients: ["RED", "GREEN"],     name: "Spice Melange",  category: "Luxury",       basePrice: 500 }, // Heat + Bio
    { ingredients: ["RED", "YELLOW"],    name: "Fusion Cell",    category: "Ammo",         basePrice: 200 }, // Heat + Energy
    { ingredients: ["BLUE", "GREEN"],    name: "Growth Stim",    category: "Medical",      basePrice: 120 }, // Fluid + Bio
    { ingredients: ["BLUE", "YELLOW"],   name: "Coolant Pump",   category: "Parts",        basePrice: 100 }, // Fluid + Energy
    { ingredients: ["GREEN", "YELLOW"],  name: "Neural Net",     category: "Electronics",  basePrice: 350 }, // Bio + Energy
    
    // Complex (Triples)
    { ingredients: ["RED", "BLUE", "YELLOW"], name: "Hyper Engine", category: "Vehicle", basePrice: 800 },
    { ingredients: ["RED", "GREEN", "BLUE"],  name: "Terraform Kit",category: "Tool",    basePrice: 950 }
];

// --- STATE ---
let gameState = "MENU";
let score = 0;
let lives = 3;
let level = 1;
let timeLimit = 15000; // Time to solve
let memoryTime = 3000; // Time before recipe hides
let currentMix = [];
let activeOrder = null;
let isBusy = false;
let isRecipeHidden = false;
let currentHeldOrb = null; // Instant grab reference

// --- PHASER OBJECTS ---
let forgeCore, forgeZone;
let timerBar, timerBg;
let labels = {}; 
let orderTimerEvent;
let memoryTimerEvent;
let hazardsGroup, orbsGroup;

const SOUNDS = {
    drag: 'sfx_drag',
    drop: 'sfx_drop',
    success: 'sfx_success',
    fail: 'sfx_fail',
    alarm: 'sfx_alarm'
};

function preload() {
    // Placeholder for audio/images
}

function create() {
    // 1. Background
    this.add.rectangle(400, 300, 800, 600, 0x050510);
    
    // 2. Smoother Starfield (Static Tweens instead of Particles)
    if(!this.textures.exists('flare')) {
        const graphics = this.make.graphics({x:0, y:0, add:false});
        graphics.fillStyle(0xffffff,1); graphics.fillCircle(4,4,4);
        graphics.generateTexture('flare',8,8);
    }
    
    // Generate 100 stars with individual tweens for smooth blinking
    for(let i=0; i<100; i++) {
        const x = Phaser.Math.Between(0, 800);
        const y = Phaser.Math.Between(0, 600);
        const scale = Phaser.Math.FloatBetween(0.1, 0.4);
        const star = this.add.image(x, y, 'flare')
            .setScale(scale)
            .setAlpha(Phaser.Math.FloatBetween(0.1, 0.5)); // Random start alpha
        
        // The "Breathing" Tween
        this.tweens.add({
            targets: star,
            alpha: { from: 0.2, to: 0.8 },
            scale: { from: scale, to: scale * 1.5 },
            duration: Phaser.Math.Between(2000, 5000), // 2 to 5 seconds (Slow!)
            yoyo: true,
            repeat: -1,
            delay: Phaser.Math.Between(0, 2000),
            ease: 'Sine.easeInOut' // Smooth wave
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
        // Update Timer Visuals
        if (activeOrder && !isBusy && orderTimerEvent) {
            const progress = orderTimerEvent.getProgress();
            timerBar.width = 400 * (1 - progress);
            
            // Critical time flash
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

        // Hazard Collision
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
    
    // Reset Visuals
    forgeCore.setFillStyle(0x222222);
    forgeCore.setStrokeStyle(4, 0x666666);
    labels.mixText.setText("Forge Empty");
    
    // 1. Pick a Recipe
    activeOrder = Phaser.Utils.Array.GetRandom(RECIPES);
    
    // 2. Display Request
    labels.orderText.setText(`REQUEST: ${activeOrder.name.toUpperCase()}`);
    labels.orderText.setColor('#ffffff');
    labels.catText.setText(`[ ${activeOrder.category} ]`);

    // 3. Show Ingredients (Briefly)
    renderRecipeIcons(scene, activeOrder.ingredients, true);

    // 4. Set Memory Timer (Hide recipe after X seconds)
    if(memoryTimerEvent) memoryTimerEvent.remove();
    const memTime = Math.max(1000, memoryTime - (level * 200)); // Harder over time
    
    memoryTimerEvent = scene.time.delayedCall(memTime, () => {
        if(!isBusy && gameState === "PLAY") {
            isRecipeHidden = true;
            renderRecipeIcons(scene, activeOrder.ingredients, false); // Hide icons
            playSound(scene, 'alarm'); // Tiny sound cue
        }
    });

    // 5. Set Fail Timer
    if(orderTimerEvent) orderTimerEvent.remove();
    orderTimerEvent = scene.time.delayedCall(timeLimit, () => {
        failOrder(scene, "ORDER TIMED OUT");
    });

    // 6. Spawn Hazard (Chance increases with level)
    if(Math.random() * 10 < level) spawnHazard(scene);
}

function createSpawner(scene, x, y, color, type) {
    const bg = scene.add.circle(x, y, 35, color, 0.2).setStrokeStyle(2, color);
    const hit = scene.add.circle(x, y, 35, color, 0.001).setInteractive({ cursor: 'pointer' });
    
    // "Instant Grab" Spawning
    hit.on('pointerdown', (pointer) => {
        if(gameState !== "PLAY" || isBusy) return;
        playSound(scene, 'drag');

        const orb = scene.add.circle(x, y, 22, color).setDepth(10);
        scene.physics.add.existing(orb);
        orb.body.setCircle(22);
        orb.typeCode = type;
        
        // Particle Trail
        const particles = scene.add.particles(0, 0, 'flare', {
            speed: 40, scale: { start: 0.4, end: 0 }, blendMode: 'ADD', tint: color
        });
        particles.startFollow(orb);
        orb.particles = particles;

        orbsGroup.add(orb);
        currentHeldOrb = orb; // Attach to mouse immediately
    });
}

function dropOrb(scene, orb) {
    // Check overlap with Forge
    if (scene.physics.overlap(orb, forgeZone)) {
        addIngredient(scene, orb.typeCode);
        createExplosion(scene, orb.x, orb.y, orb.fillColor);
        playSound(scene, 'drop');
        destroyOrb(scene, orb, false); // Clean destroy
    } else {
        // Dropped in space -> Destroy
        destroyOrb(scene, orb, true);
    }
}

function addIngredient(scene, type) {
    currentMix.push(type);
    
    // Animation
    scene.tweens.add({
        targets: forgeCore,
        scale: { from: 1.1, to: 1 },
        duration: 100
    });

    // Show what's inside (Text)
    labels.mixText.setText(`Contains: ${currentMix.length} Elements`);

    // Check Recipe Logic
    const sortedMix = [...currentMix].sort();
    const sortedReq = [...activeOrder.ingredients].sort();

    // Fail if too many ingredients
    if (sortedMix.length > sortedReq.length) {
        failOrder(scene, "MIXTURE UNSTABLE!");
        return;
    }

    // Check exact match
    if (JSON.stringify(sortedMix) === JSON.stringify(sortedReq)) {
        succeedOrder(scene);
    }
}

function succeedOrder(scene) {
    isBusy = true;
    orderTimerEvent.remove();
    memoryTimerEvent.remove();
    playSound(scene, 'success');

    // --- QUANTITY CALCULATION ---
    // Speed determines quantity!
    // > 70% time left = 5 items (Batch production)
    // > 40% time left = 3 items
    // < 40% time left = 1 item
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

    // Visuals
    labels.orderText.setText(qualityMsg);
    labels.orderText.setColor("#00ff00");
    forgeCore.setFillStyle(0x00ff00);
    renderRecipeIcons(scene, activeOrder.ingredients, true); // Reveal recipe again

    // Call API
    apiCreateItem({
        name: activeOrder.name,
        quantity: producedQty, // Dynamic Quantity!
        price: activeOrder.basePrice,
        category: activeOrder.category
    }).then(res => {
        if(res.success) {
            score += Math.floor(activeOrder.basePrice * producedQty);
            level++;
            updateHUD();
            
            // Popups
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
    forgeCore.setFillStyle(0xff0000);
    renderRecipeIcons(scene, activeOrder.ingredients, true); // Show what it was

    scene.cameras.main.shake(200, 0.01);

    if (lives <= 0) {
        scene.time.delayedCall(1000, () => switchState(scene, "GAMEOVER"));
    } else {
        scene.time.delayedCall(2000, () => { // Longer penalty wait
            if(gameState === "PLAY") startNewOrder(scene);
        });
    }
}

// --- HELPERS ---

function destroyOrb(scene, orb, explode) {
    if(orb.particles) orb.particles.destroy();
    if(explode) createExplosion(scene, orb.x, orb.y, orb.fillColor);
    orb.destroy();
    if(currentHeldOrb === orb) currentHeldOrb = null;
}

function createExplosion(scene, x, y, color) {
    const emitter = scene.add.particles(x, y, 'flare', {
        speed: { min: 50, max: 150 }, scale: { start: 0.5, end: 0 },
        blendMode: 'ADD', tint: color, lifespan: 400, quantity: 15
    });
    scene.time.delayedCall(400, () => emitter.destroy());
}

function spawnHazard(scene) {
    const side = Phaser.Math.Between(0, 1);
    const x = side === 0 ? -50 : 850;
    const y = Phaser.Math.Between(100, 500);
    const h = scene.add.rectangle(x, y, 40, 40, 0xaa0000);
    scene.physics.add.existing(h);
    h.body.setVelocity(side === 0 ? 150 : -150, Phaser.Math.Between(-50, 50));
    hazardsGroup.add(h);
}

function renderRecipeIcons(scene, ingredients, visible) {
    labels.recipeContainer.removeAll(true);
    if(!visible) {
        // Show "???" icons
        const q = scene.add.text(0, 0, "???  ???", { fontSize: '24px', color: '#555' }).setOrigin(0.5);
        labels.recipeContainer.add(q);
        return;
    }
    
    // Show Actual Colors
    let startX = -((ingredients.length - 1) * 20);
    ingredients.forEach((ing, i) => {
        const circ = scene.add.circle(startX + (i * 40), 0, 15, ELEMENTS[ing].color)
            .setStrokeStyle(2, 0xffffff);
        labels.recipeContainer.add(circ);
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
    
    // Top Info
    labels.scoreText = scene.add.text(780, 20, "0", { fontSize: '24px', color: '#00ff00' }).setOrigin(1, 0);
    labels.livesText = scene.add.text(20, 20, "SHIELDS: 3", { fontSize: '24px', color: '#00ffff' }).setOrigin(0, 0);
    labels.timerText = scene.add.text(400, 140, "", { fontSize: '12px', color: '#ff0000' }).setOrigin(0.5);
    
    // Center Info
    labels.orderText = scene.add.text(400, 60, "READY", { fontSize: '28px', fontStyle: 'bold' }).setOrigin(0.5);
    labels.catText = scene.add.text(400, 90, "", { fontSize: '14px', color: '#aaa' }).setOrigin(0.5);
    
    // Recipe Container
    labels.recipeContainer = scene.add.container(400, 120);

    // Bars
    timerBg = scene.add.rectangle(400, 160, 400, 8, 0x333333);
    timerBar = scene.add.rectangle(200, 160, 400, 8, 0x00ff00).setOrigin(0, 0.5);

    // Forge
    forgeCore = scene.add.circle(400, 360, 75, 0x222222).setStrokeStyle(4, 0x666666);
    forgeZone = scene.physics.add.sprite(400, 360, null).setSize(160, 160).setVisible(false);
    labels.mixText = scene.add.text(400, 360, "Empty", { fontSize: '14px', color: '#666' }).setOrigin(0.5);

    // Spawners (4 Elements)
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