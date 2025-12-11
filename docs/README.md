# Inventory System + Inventory Arcade

PHP + MySQL + Phaser.js

This project contains **two layers**:

1. **Normal Mode** – the required PHP/MySQL Inventory System for assignment marking.
2. **Game Mode** – a bonus “Inventory Arcade” where each teammate creates a mini-game based on one part of the inventory workflow, using Phaser.js.

Both layers share the **same database**, **same API**, and run entirely inside **XAMPP**.

---

## Documentation map (read me first)

- `docs/GITHUB.md` — how we branch, commit, pull, and open PRs. Read before you start coding with git.
- `docs/GAME_DEV_GUIDE.md` — how to build mini-games and use the API helpers. Read before working in `game/`.
- `docs/README.md` (this file) — project overview, setup, and API summary.

---

## 1. Features Overview

### ✔ Normal Mode (Assignment Requirements)

* Add new items
* Edit existing items
* Delete items
* Search and list items
* Server-side validation
* MySQL database with `items` table
* Clear screenshots + documentation (for lecturer)

### ✔ Game Mode (Extra / Creative Layer)

A playful layer built on top of the same backend.

Each mini-game links to **one main API function**:

* `create_item`
* `delete_item`
* `validate_item`
* `dispatch_item`

Examples:

* "Create Item" could be stocking shelves, mixing potions, crafting items.
* "Delete Item" could be shredding papers, throwing trash, demolition game.
* "Validate Item" could be border checkpoint, robot inspector, security scanner.
* "Dispatch Item" could be truck delivery, conveyor belt, shipping puzzle.

**Teammates have full freedom** to design any game they like, as long as it calls the corresponding API.

---

## 2. Project Structure

```
inventory_system/
│
├── index.php           # Main landing page – Normal Mode + Game Mode
├── add_item.php
├── edit_item.php
├── delete_item.php
├── list_items.php
├── db.php              # MySQL connection
│
├── api/                # API endpoints used by BOTH modes
│   ├── items_list.php
│   ├── items_create.php
│   ├── items_update.php
│   └── items_delete.php
│
├── game/               # Phaser mini-games
│   ├── hub.php         # Game selection menu
│   ├── phaser.min.js   # Phaser engine
│   ├── common.js       # Shared JS helpers for API calls
│   │
│   ├── create_item/    # Mini-game for ADD logic
│   │   ├── index.php
│   │   └── main.js
│   │
│   ├── delete_item/    # Mini-game for DELETE logic
│   │   ├── index.php
│   │   └── main.js
│   │
│   ├── validate_item/  # Mini-game themed around validation
│   │   ├── index.php
│   │   └── main.js
│   │
│   └── dispatch_item/  # Mini-game for delivery / shipping logic
│       ├── index.php
│       └── main.js
│
├── assets/             # Artwork / audio for each feature
│   ├── global/         # Shared assets (buttons, UI frames, etc.)
│   ├── create_item/    # Assets for the create_item game
│   ├── delete_item/
│   ├── validate_item/
│   └── dispatch_item/
│
└── docs/
    ├── README.md
    ├── GAME_DEV_GUIDE.md
    └── schema.sql
```

---

## 3. Installation (XAMPP)

### Step 1: Clone or copy project

Place the folder into:

```
C:\xampp\htdocs\inventory_system
```

### Step 2: Start XAMPP

* Start **Apache**
* Start **MySQL**

### Step 3: Create database

Open phpMyAdmin → Create database:

```sql
CREATE DATABASE inventory_db;
```

Import `docs/schema.sql` or run your `CREATE TABLE` manually.

### Step 4: Configure `db.php`

```php
$host = 'localhost';
$user = 'root';
$pass = '';   // default XAMPP
$dbname = 'inventory_db';
```

### Step 5: Run

* **Normal Mode:**
  [http://localhost/inventory_system/index.php](http://localhost/inventory_system/index.php)

* **Game Mode:**
  Click “Game Mode” on index page
  or go to
  [http://localhost/inventory_system/game/hub.php](http://localhost/inventory_system/game/hub.php)

---

## 4. API Endpoints (used by both normal mode & games)

### List Items

`GET api/items_list.php`

### Create Item

`POST api/items_create.php`

### Update Item

`POST api/items_update.php`

### Delete Item

`POST api/items_delete.php`

Responses are always JSON:

```json
{
  "success": true,
  "message": "Item created.",
  "id": 12
}
```

---

## 5. Game Development Overview

Each mini-game:

* Uses Phaser.js (or plain JS)
* Lives inside its own folder (`game/create_item`, etc.)
* Loads its own `main.js`
* Calls backend via `common.js` helpers:

```js
apiCreateItem({
  name: "Apple",
  quantity: 10,
  price: 3.50,
  category: "Fruit"
});
```

The rules:

1. **Your game must at least call one API (create/delete/validate/dispatch).**
2. You may add animations, physics, sound effects, UI elements, etc.
3. All game assets go into `assets/<feature>/`.
4. Do not modify other teammates’ assets or code.

See full instructions in `GAME_DEV_GUIDE.md`.

---

## 6. Credits

* Inventory System: Entire team
* Game Mode: Group collaboration & creativity
* Phaser.js: [https://phaser.io](https://phaser.io)
* XAMPP Environment: Apache + PHP + MySQL
