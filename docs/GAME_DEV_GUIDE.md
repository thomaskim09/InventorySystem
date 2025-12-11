# **GAME_DEV_GUIDE.md**

### How to Build Your Own Mini-Game (Phaser + PHP API)

Welcome to the **Inventory Arcade**!
Each teammate will create a small mini-game inside the `game/` folder, and each mini-game is linked to **one API theme**:

* `create_item`
* `delete_item`
* `validate_item`
* `dispatch_item`

Each folder contains a separate game, but all games share:

* The same **Inventory database**
* The same **PHP API**
* The same **Phaser engine**
* A set of **common helper functions**

---

## API endpoints you can mix and match

Use these as your gameplay “lego blocks.” All responses are JSON.

- `GET /api/items_list.php` — optional `search` query; returns the inventory list for picking targets or showing leaderboards.
- `POST /api/items_create.php` — body: `item_name`, `quantity`, `price`, optional `category`; creates a new item.
- `POST /api/items_update.php` — body: `id` (required) plus any of `item_name`, `quantity`, `price`, `category`; only provided fields change.
- `POST /api/items_delete.php` — body: `id`; hard deletes an item.
- `POST /api/items_dispatch.php` — body: `id`; “dispatches” by deleting (or swap to status-based logic if your game prefers).
- `POST /api/items_quantity.php` — body: `id` plus **either** `delta` (can be negative/positive, clamped at 0) **or** `quantity` (absolute set); returns the new quantity. Perfect for damage/loot/ammo-style mechanics.

This guide teaches you exactly how to build your game without breaking the main system.

---

# 1. Project Overview

## Where your game lives

Your game will be placed inside:

```
inventory_system/game/<feature>/
```

For example:

```
game/create_item/
game/delete_item/
game/validate_item/
game/dispatch_item/
```

Each folder represents the **feature/API you will interact with**, **not the game style**.

This means you can build ANY type of game mechanic as long as it involves your assigned feature.

---

# 2. Game Folder Structure

Each game folder should contain:

```
index.php       # Webpage wrapper that loads Phaser
main.js         # Phaser game code
```

Example:

```
game/create_item/
  index.php
  main.js
```

---

# 3. Where to put your assets

Put your images, audio, sprites, etc. inside:

```
assets/<feature>/
```

Example:

```
assets/create_item/
  shelf.png
  potion.png
  crate.png
```

If you need shared UI icons, place those into:

```
assets/global/
```

Do NOT place your assets in other teammates’ folders.

---

# 4. How your game communicates with PHP (very important!)

Every game talks to the same backend using helper functions in:

```
game/common.js
```

These helpers wrap the `/api/*.php` scripts.

You do NOT need to write SQL.
You only call functions like:

```js
apiCreateItem({ name, quantity, price, category });
apiDeleteItem(itemId);
apiListItems();
apiUpdateItem({...});
```

Example:

```js
apiCreateItem({
  name: "Healing Potion",
  quantity: 3,
  price: 12.50,
  category: "Magic"
}).then(res => {
  if (res.success) {
    console.log("Created successfully!");
  }
});
```

This keeps every teammate safe from breaking backend logic.

---

# 5. Understanding Your Feature Folder

## 🟢 **1. create_item/**

Uses:

```
api/items_create.php
```

Your game needs **at least one moment** where something the player does creates an item in the database.

Examples:

* Drag objects onto a crafting table → item is created
* Combine ingredients → new item is created
* Place stock on a shelf → added to DB
* Click a button to “produce” items

As long as you call `apiCreateItem()`, the game is valid.

---

## 🔴 **2. delete_item/**

Uses:

```
api/items_delete.php
```

Your game must remove an item from the DB.

Possible gameplay:

* Shooting items
* Throwing items into a trash bin
* Crushing items
* Sorting items incorrectly → deleted

Calling `apiDeleteItem(id)` is the key.

You can fetch items first:

```js
apiListItems().then(data => {
  // choose which items to show as targets
});
```

---

## 🟡 **3. validate_item/**

This folder is about **data validation, correctness, or checking**.

You may call:

* `apiCreateItem()`
* or `apiUpdateItem()`
* or simply simulate validation and show errors returned by the API.

Game ideas:

* Border checkpoint where items have “wrong” fields
* Robot that inspects and rejects invalid items
* Puzzle where player fixes incorrect prices before submitting

You should intentionally provoke API errors to show validation:

```js
apiCreateItem({
  name: "",
  quantity: -5,
  price: -1
}).then(res => {
  alert(res.message); // API will return failure message
});
```

---

## 🔵 **4. dispatch_item/**

This relates to **moving items out of inventory** (shipping, delivery, etc.).

There are 2 approaches:

### Option A (Easy)

Use `apiDeleteItem()` as your “dispatch” (meaning shipped = removed).

### Option B (Advanced)

Add a new column to DB:

```
status ENUM('IN_STOCK', 'DISPATCHED')
```

And create a small new API endpoint:

```
api/items_dispatch.php
```

This endpoint updates the item’s status.

Game ideas:

* Drive truck to deliver items
* Conveyor belt sending parcels
* Drag items onto a boat to ship

---

# 6. Writing Your Game’s index.php

Every game’s `index.php` looks like this:

```php
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Create Item Game</title>
  <style>
    body { margin: 0; background: #111; color: #fff; text-align: center; }
    #game-container { width: 800px; height: 600px; margin: auto; }
  </style>

  <!-- Phaser engine -->
  <script src="../phaser.min.js"></script>

  <!-- Common API functions -->
  <script src="../common.js"></script>

  <!-- Your game code -->
  <script src="main.js"></script>
</head>

<body>
  <h1>Create Item Game</h1>
  <a href="../hub.php">Back to Game Hub</a>

  <div id="game-container"></div>
</body>
</html>
```

---

# 7. Example main.js (Phaser Template)

```js
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image('box', '../../assets/create_item/box.png');
}

function create() {
  const box = this.add.image(100, 300, 'box').setInteractive();
  this.input.on('pointerdown', () => {
    apiCreateItem({
      name: "Box Item",
      quantity: 5,
      price: 1.99,
      category: "Game"
    }).then(res => {
      if (res.success) alert("Item created!");
    });
  });
}

function update() {}
```

This is intentionally simple so beginners can start immediately.

---

# 8. Game Hub Registration

To make your game appear in the menu, add your link to:

```
game/hub.php
```

Example:

```php
<li><a href="create_item/index.php">Create Item Game</a></li>
<li><a href="delete_item/index.php">Delete Item Game</a></li>
<li><a href="validate_item/index.php">Validate Item Game</a></li>
<li><a href="dispatch_item/index.php">Dispatch Item Game</a></li>
```

---

# 9. Rules & Freedom

### ✔ You *must*

* Use your assigned folder
* Use the correct API (`create_item`, `delete_item`, etc.)
* Keep your assets inside `assets/<feature>/`
* Make sure the game loads successfully in XAMPP

### ✔ You *can*

* Use Phaser or plain JS
* Add sound, animations, particles
* Make 2D or pseudo-3D gameplay
* Create UI or overlays
* Collaborate across games

### ✔ You *don’t need to*

* Make a complete or commercial-quality game
* Write SQL
* Modify other people’s assets
* Change the core PHP pages

---

# 10. Troubleshooting

### White screen?

Check your console:

* Missing image path
* Wrong relative directory (`../../assets/...`)
* Typo in `phaser.min.js` path

### API returning errors?

* Check `db.php` database credentials
* Make sure your XAMPP MySQL server is running
* Check required fields (`item_name`, `quantity`, `price`)

### Phaser doesn’t appear?

* Ensure `<div id="game-container">` exists
* Ensure `main.js` is loaded after Phaser

---

# 11. Have Fun

This is the creative part of the assignment.
Experiment with:

* Physics
* Drag-and-drop
* Particles
* Animated sprites
* Unique UI ideas

Your game is your playground.
As long as it ties back to its API goal, you're free to build anything.
