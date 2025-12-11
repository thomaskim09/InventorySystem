// game/create_item/main.js
// Mini-sandbox for creating items via multiple interactions:
// - Drag to crafting table
// - Combine ingredients
// - Drop stock onto a shelf
// - Click a produce button

const createItemConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#020617',
  scene: { preload, create }
};

new Phaser.Game(createItemConfig);

let statusText;
let tableInfoText;
let tableIngredients;

function preload() {
  // No external assets required; we draw simple shapes.
}

function create() {
  const scene = this;
  tableIngredients = new Set();

  // Make dragging feel easier/sensitive
  scene.input.dragDistanceThreshold = 2;

  // Zones
  const tableZone = makeDropZone(scene, 320, 340, 320, 220, 'table', 'Crafting Table\nDrop stuff here');
  const shelfZone = makeDropZone(scene, 640, 340, 230, 220, 'shelf', 'Shelf\nStock items here');

  // UI texts
  scene.add.text(24, 16,
    'Create Item Workshop\nDrag tokens onto the table or shelf, or click Produce.',
    { fontFamily: 'Arial', fontSize: '18px', color: '#e5e7eb' }
  );

  tableInfoText = scene.add.text(24, 80,
    'Table: waiting for a recipe. Drop Herb + Crystal to craft a brew.',
    { fontFamily: 'Arial', fontSize: '14px', color: '#a5b4fc' }
  );

  statusText = scene.add.text(24, 560,
    'Ready. Interact to create items via the API.',
    { fontFamily: 'Arial', fontSize: '14px', color: '#cbd5f5' }
  );

  // Tokens
  const tokens = [
    makeToken(scene, 'Crate', 0xc08457, 120, 150, 'crate'),
    makeToken(scene, 'Herb', 0x16a34a, 120, 240, 'herb'),
    makeToken(scene, 'Crystal', 0x38bdf8, 120, 330, 'crystal'),
    makeToken(scene, 'Cogwheel', 0x6b7280, 120, 420, 'cog')
  ];

  // Produce button
  makeButton(scene, 640, 120, 'Produce Items', () => {
    produceBatch(scene);
  });

  // Drag handlers
  scene.input.on('dragstart', (pointer, gameObject) => {
    gameObject.setDepth(10);
    gameObject.setScale(1.05);
  });

  scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
    gameObject.x = dragX;
    gameObject.y = dragY;
  });

  scene.input.on('dragend', (pointer, gameObject, dropped) => {
    gameObject.setDepth(1);
    gameObject.setScale(1);
    if (!dropped) {
      resetToken(gameObject);
    }
  });

  // Drop handler
  scene.input.on('drop', (pointer, gameObject, dropZone) => {
    if (dropZone.name === 'table') {
      handleTableDrop(scene, gameObject);
    } else if (dropZone.name === 'shelf') {
      handleShelfDrop(scene, gameObject);
    }
    resetToken(gameObject);
  });
}

// Helpers --------------------------------------------------------------------

function makeDropZone(scene, x, y, w, h, name, label) {
  const rect = scene.add.rectangle(x, y, w, h, 0x0f172a, 0.5)
    .setStrokeStyle(2, 0x1f2937);
  const zone = scene.add.zone(x, y, w, h).setRectangleDropZone(w, h);
  zone.name = name;
  scene.add.text(x, y - h / 2 + 12, label, {
    fontFamily: 'Arial',
    fontSize: '14px',
    color: '#cbd5f5',
    align: 'center'
  }).setOrigin(0.5, 0);
  return zone;
}

function makeToken(scene, label, color, x, y, type) {
  const rect = scene.add.rectangle(0, 0, 110, 60, color, 0.9)
    .setStrokeStyle(2, 0xffffff, 0.4);
  const text = scene.add.text(0, 0, label, {
    fontFamily: 'Arial',
    fontSize: '14px',
    color: '#0b0f1a'
  }).setOrigin(0.5);
  const container = scene.add.container(x, y, [rect, text]);
  container.setSize(140, 90); // larger hit box for easier grabs
  container.setData('type', type);
  container.setData('label', label);
  container.setData('homeX', x);
  container.setData('homeY', y);
  container.setInteractive(
    new Phaser.Geom.Rectangle(-70, -45, 140, 90),
    Phaser.Geom.Rectangle.Contains,
    { useHandCursor: true }
  );
  scene.input.setDraggable(container);
  return container;
}

function resetToken(token) {
  token.x = token.getData('homeX');
  token.y = token.getData('homeY');
}

function makeButton(scene, x, y, label, onClick) {
  const btn = scene.add.rectangle(x, y, 180, 50, 0x1d4ed8, 0.9)
    .setStrokeStyle(2, 0x60a5fa)
    .setInteractive({ useHandCursor: true });
  scene.add.text(x, y, label, {
    fontFamily: 'Arial',
    fontSize: '15px',
    color: '#e5e7eb'
  }).setOrigin(0.5);
  btn.on('pointerdown', () => {
    btn.setFillStyle(0x1e3a8a);
    onClick();
  });
  btn.on('pointerup', () => btn.setFillStyle(0x1d4ed8));
  btn.on('pointerout', () => btn.setFillStyle(0x1d4ed8));
  return btn;
}

function handleTableDrop(scene, token) {
  const type = token.getData('type');
  const label = token.getData('label');

  if (type === 'herb' || type === 'crystal') {
    tableIngredients.add(type);
    updateTableInfo(`Table has: ${Array.from(tableIngredients).join(' + ')}`);

    if (tableIngredients.has('herb') && tableIngredients.has('crystal')) {
      tableIngredients.clear();
      craftItem(scene, 'Herb + Crystal Brew', 1, randomPrice(8, 18), 'Alchemy');
    }
    return;
  }

  // Generic craft
  craftItem(scene, `Crafted ${label}`, Phaser.Math.Between(1, 3), randomPrice(3, 12), 'Table');
}

function handleShelfDrop(scene, token) {
  const label = token.getData('label');
  craftItem(scene, `Shelf Stock: ${label}`, Phaser.Math.Between(2, 6), randomPrice(4, 15), 'Shelf');
}

function produceBatch(scene) {
  // Quick click-to-produce action
  const qty = Phaser.Math.Between(1, 4);
  craftItem(scene, 'Produced Batch', qty, randomPrice(5, 10), 'Factory');
}

function craftItem(scene, name, quantity, price, category) {
  setStatus(`Creating "${name}"...`, '#fbbf24');
  apiCreateItem({
    name,
    quantity,
    price,
    category
  }).then(res => {
    if (res.success) {
      setStatus(`Created "${name}" x${quantity} (ID ${res.id || '?'})`, '#22c55e');
      updateTableInfo('Table: waiting for next recipe. Drop Herb + Crystal to craft a brew.');
    } else {
      setStatus(`Create failed: ${res.message || 'Unknown error'}`, '#f87171');
    }
  }).catch(err => {
    console.error(err);
    setStatus('Network/JS error while creating item.', '#f87171');
  });
}

function setStatus(text, color = '#cbd5f5') {
  if (!statusText) return;
  statusText.setText(text);
  statusText.setColor(color);
}

function updateTableInfo(text) {
  if (!tableInfoText) return;
  tableInfoText.setText(text);
}

function randomPrice(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}
