## 1. 项目架构已经搭好

现在整个仓库大概长这样（只说重点）：

* `normal/`

  * 正常的 PHP + MySQL 库存系统（老师评分主要看这里）

* `game/`

  * `hub.php`：游戏选择大厅
  * `common.js`：封装好的 API 调用函数（`apiCreateItem`、`apiDeleteItem` 等）
  * `phaser.min.js`：Phaser 引擎
  * 四个**核心功能游戏文件夹**：

    * `create_item/`
    * `delete_item/`
    * `validate_item/`
    * `dispatch_item/`

* `api/`

  * `items_list.php`、`items_create.php`、`items_update.php`、`items_delete.php`、`items_dispatch.php`
  * 所有游戏和 normal 模式都通过这些 PHP API 操作数据库

* `assets/`

  * `create_item/`、`delete_item/`、`validate_item/`、`dispatch_item/`：各自功能对应的素材文件夹
  * `global/`：公共素材（按钮、UI 等）

* `docs/`

  * `README.md`：整体项目说明
  * `GAME_DEV_GUIDE.md`：给做小游戏的开发指南
  * `schema.sql`：数据库结构（队友本地建库用）

---

## 2. 可以选择的核心功能游戏模式

目前规划了 **4 个核心 feature**，每个 feature 可以用任何游戏形式来表现：

1. `create_item`

   * 主题：**新增库存**
   * 对应 API：`apiCreateItem`（底层是 `items_create.php`）
   * 已经有一个超简易示范版：拖动箱子 + Prompt 输入 → 创建数据库记录
   * 你可以把它改成：摆货、合成、种树、炼药等…

2. `delete_item`

   * 主题：**删除库存**
   * 对应 API：`apiDeleteItem`（`items_delete.php`）
   * 游戏可以是：射击靶子、丢垃圾、粉碎机、清仓大甩卖等
   * 只要最后有动作会触发删除某个 ID 的 item 即可

3. `validate_item`

   * 主题：**校验 / 检查数据是否合理**
   * 可以利用：

     * `apiCreateItem` / `apiUpdateItem`
     * 故意传错数据，看 API 返回的错误信息
   * 游戏可以是：海关检查、机器人验货、帮 NPC 改错价钱等

4. `dispatch_item`

   * 主题：**发货 / 出库 / 派送**
   * 简单版目前用 `apiDispatchItem`，底层暂时当成删除（视为发出去）
   * 游戏可以是：卡车送货、传送带、船运、快递路线规划等

> 核心原则：
> 每个游戏至少要**真的调用一次对应的 API**，对数据库产生影响或读取数据。

---

## 3. 开始前请先看这些文件

1. `docs/README.md`

   * 了解项目架构、文件夹结构、运行方式
   * normal / game 两层是怎么分开的

2. `docs/GAME_DEV_GUIDE.md`

   * 专门写给做小游戏的队友
   * 教你：

     * 游戏应该放在哪个文件夹
     * `index.php` 怎么写
     * `main.js` 怎么用 Phaser 初始化
     * `common.js` 里的 API 怎么调用
     * 怎么在 `game/hub.php` 里挂上你的游戏入口

3. `game/create_item/` 里的示例

   * `index.php` + `main.js` 是一个可以运行的 demo
   * 点箱子 / 按空格 → 会调用 `apiCreateItem` → 真的写进 MySQL
   * 你可以直接 copy 结构当模板，然后改成自己的玩法和美术

---

## 4. 每个队友的推荐起步步骤

1. **本地跑通项目**

   * 用 XAMPP 起 Apache + MySQL
   * 在 phpMyAdmin 创建 `inventory_db`
   * 导入 `docs/schema.sql`
   * 打开：`http://localhost/INVENTORY_SYSTEM/index.php`
   * 测试 normal 模式是否能正常增删改查

2. **选一个功能文件夹**

   * 从 `create_item / delete_item / validate_item / dispatch_item` 中选一个
   * 这就是你主要负责的小游戏模块

3. **在 game 子目录里搭游戏页面**

   * 在 `game/你的功能/` 里面编辑 / 创建：

     * `index.php`（已写好基本模板，可参考）
     * `main.js`（游戏逻辑写这里）

4. **学一点 Phaser.js（够用就好）**
   建议先看这些关键点：

   * 游戏配置：`new Phaser.Game(config)`
   * `preload() / create() / update()` 生命周期
   * 如何加载图片：`this.load.image(...)`
   * 如何显示图片：`this.add.image(...)`
   * 如何监听点击 / 拖拽：

     * `setInteractive()`
     * `this.input.on('pointerdown', ...)`
     * `this.input.setDraggable(sprite)`

   官方网站 / 文档可以自己 Google「Phaser 3 tutorial」，看几个简单例子就能上手。

5. **通过 common.js 调用 API**

   示例（创建 item）：

   ```js
   apiCreateItem({
     name: "测试道具",
     quantity: 5,
     price: 9.90
   }).then(res => {
     if (res.success) {
       // 在游戏里播个特效 / 显示成功文字
     } else {
       // 提示错误信息
     }
   });
   ```

---

## 5. GitHub 协作流程（简化版）

为了大家一起改代码不打架，建议用这个流程：

1. **先把仓库 clone 下来**

   ```bash
   git clone <repo-url>
   cd INVENTORY_SYSTEM
   ```

2. **每个人开自己的分支**
   分支名可以这样起：

   * `feature/create_item-game`
   * `feature/delete_item-game`

   ```bash
   git checkout -b feature/create_item-game
   ```

3. **在自己的分支上开发**

   * 改 `game/你的功能/` 下面的文件
   * 用 `git status` 看改了哪些文件

4. **本地 commit**

   ```bash
   git add .
   git commit -m "Add basic crate game for create_item feature"
   ```

5. **推到远程并发 Pull Request**

   ```bash
   git push origin feature/create_item-game
   ```

   然后去 GitHub 上，新建 Pull Request：

   * 目标分支：`main` 或 `master`（看你们现在叫什么）
   * 写一下这个 PR 做了什么

6. **队友互相 code review**（随便看一看就行）

   * 看是否有冲突、路径是否合理
   * 没问题就合并

> 重点：**每个功能独立分支开发 + PR 合并**，可以减少互相覆盖代码的风险。

---

## 6. 心态部分：这是一个「玩着交作业」的机会 😆

* normal 层已经满足作业基本要求，比较稳。
* game 层是 bonus，大家可以当成一边玩一边学：

  * 学一点前端框架 / 游戏引擎
  * 学会调用后端 API、看 Network 请求
  * 学会 GitHub 协作、Pull Request 流程

只要能够：

* 游戏能跑起来
* 至少有一个操作真正改动 / 读取数据库
* 把自己的游戏入口挂在 `game/hub.php` 里

就已经很不错、很有展示性了。剩下的就是看你想堆多少特效 & 动画。

看完的话，可以开始看点英文文档了 - 可以从这边开始看 `START.md`
