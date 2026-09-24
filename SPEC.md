# 規格說明書 (SPEC.md) - 月白之隱：中秋烤肉大作戰 (Moonlit Hermit: BBQ Panic)

> **專案代號**：`moonlit-hermit-bbq`  
> **版本**：v0.1.1 (Draft)  
> **技術棧**：HTML5 Canvas / Vanilla JS (ES Modules) + Vite + Web Audio API + LocalStorage/Mock API Backend  
> **部署目標**：Vercel (支援 SPA / 靜態一鍵極速部署)

---

## 1. 專案願景與目標 (Vision & Goals)
打造一款以「中秋節烤肉狂歡」為主題的 2D 俯視角（Top-down）/ 斜角（Isometric）時間管理協作烹飪遊戲（類似 Overcooked 煮過頭）。
玩家需要扮演月宮隱士廚神「月白之隱」及夥伴（玉兔 / 吳剛 / 嫦娥），在混亂的後廚地圖中移動，拿取食材、切備料、烤肉烤串、組裝出餐、洗滌髒盤子，並在時限內滿足挑剔的神仙顧客訂單，爭奪「中秋廚神排行榜」榜首。

---

## 2. 核心遊戲循環與機制 (Core Gameplay Mechanics)

### 2.1 廚房地圖與工作站 (Stations & Tiles)
地圖由 2D 網格構成，包含以下核心工作台：
1. **食材箱 (Ingredient Crates)**：
   - 頂級牛肉/豬肉片 (Meat)
   - 新竹貢丸/甜不辣 (Skewer base)
   - 鮮脆青椒/玉米 (Veggies)
   - 吐司 (Toast)
2. **切菜備料台 (Cutting Board)**：將食材切片或串起（長按或互動觸發進度條）。
3. **炭火烤爐 (BBQ Grill)**：
   - 可同時放置多份食材。
   - 狀態機：`Raw (生)` $\rightarrow$ `Cooking (烘烤中)` $\rightarrow$ `Perfect (完美熟度)` $\rightarrow$ `Burnt (燒焦冒煙)`。
   - 燒焦若未及時移開會引發小火災或報廢。
4. **餐盤架 (Clean Plate Crate)**：提供乾淨盤子。
5. **備料組裝台 (Countertop)**：放置餐盤，將烤好的食材與吐司組裝成指定料理。
6. **出餐口 (Serving Counter)**：將裝好餐點的盤子交付，核對訂單並得分。
7. **水槽洗碗台 (Sink Station)**：收回顧客吃完的髒盤子，洗滌後放回乾淨餐盤架。
8. **垃圾桶 (Trash Bin)**：丟棄失敗或燒焦的食材。

### 2.2 訂單系統 (Order System)
- **隨機生成訂單**：如「經典炭烤牛五花吐司」、「綜合蔬菜肉串拼盤」、「豪華全熟海陸烤盤」。
- **倒數計時**：每個訂單有獨立耐性條。綠色（全額金幣 + 額外小費）、黃色（標準得分）、紅色（扣分或顧客氣跑）。
- **連擊加成 (Combo)**：連續完美出餐獲得分數乘數（1.2x ~ 2.0x）。

### 2.3 角色與控制系統 (Player Controls)
- **單人模式 (Single Player)**：
  - 鍵盤：`WASD` 或方向鍵移動，`Space` 抓取/放下 (Pickup/Drop)，`J` 或 `E` 進行互動切菜/滅火。
  - 行動端 / H5 觸控：虛擬搖桿 (Virtual Joystick) + 動作按鈕 (Action Buttons)。
- **雙人本地合作模式 (2P Local Co-op)**：
  - Player 1 (玉兔): `WASD` 移動，`F` 抓放，`G` 互動。
  - Player 2 (吳剛): `方向鍵` 移動，`K` 抓放，`L` 互動。

---

## 3. 玩家系統與排行榜 (Player Auth & Leaderboard)

### 3.1 玩家帳號與訪客模式 (Authentication)
- **訪客快速遊玩 (Guest Mode)**：隨機暱稱（如「飢餓的玉兔 #882」），本地存檔。
- **註冊 / 登入 (Register & Login)**：
  - 輸入使用者名稱與密碼（密碼本地加密雜湊，支援 Mock Auth 與 LocalStorage / API Server 雙模式）。
  - 個人戰績記錄（歷史最高分、遊玩次數、解鎖成就、中秋徽章）。

### 3.2 排行榜系統 (Leaderboard)
- **個人最高分 (Personal Best)**：本地持久化保存。
- **全局排行榜 (Global Leaderboard)**：
  - 顯示前 50 名玩家（排名、暱稱、分數、模式、日期）。
  - 內建種子數據與即時更新機制（可擴充接真實雲端後端）。

---

## 4. 階段式開發里程碑 (Milestones & Sprints)

我們採取小步疊代、功能逐一實作並分段 Commit 的策略：

### 📌 Milestone 1: 基礎架構與網格移動引擎
- [ ] 建立專案骨架（Vite + Modular ES6 + CSS Design Tokens）。
- [ ] 建立 Canvas 2D 網格地圖渲染系統（地板、障礙牆面、工作台輪廓）。
- [ ] 實作單人角色移動物理（碰撞檢測、平滑轉向、網格對齊）。
- [ ] 實作物件拿取與放下（Pickup & Drop）機制。
- *Commit: `feat(core): setup game loop, map grid, player movement & basic pickup/drop`*

### 📌 Milestone 2: 切料與炭火烤肉狀態機
- [ ] 實作食材箱生成（肉片、蔬菜、吐司）。
- [ ] 實作切菜台互動與長按進度條。
- [ ] 實作炭火烤爐（烤肉進度條、生肉 $\rightarrow$ 完美熟 $\rightarrow$ 燒焦狀態機轉換、火花粒子）。
- *Commit: `feat(kitchen): add prep cutting station & bbq grill state machine`*

### 📌 Milestone 3: 裝盤、訂單系統、出餐與洗碗循環
- [ ] 實作餐盤系統（食材放入盤中組裝、多重食材配方判定）。
- [ ] 實作訂單生成器與倒數計時 UI（動態訂單卡片、耐性條、出餐判定）。
- [ ] 實作髒盤回收與水槽洗碗循環。
- [ ] 實作計分、連擊（Combo）與遊戲局數倒數結算畫面。
- *Commit: `feat(gameplay): implement plate assembly, orders, dirty dish cycle & scoring`*

### 📌 Milestone 4: 視聽覺饗宴（Web Audio 音效與中秋美學特效）
- [ ] 導入 Web Audio API 合成音效（烤肉滋滋聲、切菜聲、洗碗水流、訂單完成慶祝音）。
- [ ] 視覺特效：炭火微粒、烹飪油煙、燒焦警報閃爍、滿意顧客飄心動畫。
- [ ] 中秋月宮主題 UI/HUD（古典金與現代霓虹融合美學、雙人模式切換）。
- *Commit: `feat(audio-fx): integrate procedural web audio and festive visual effects`*

### 📌 Milestone 5: 玩家註冊登入與排行榜系統
- [ ] 實作玩家狀態模組（訪客模式、註冊、登入、LocalStorage 持久化）。
- [ ] 實作排行榜彈窗（今日榜、總榜、個人歷史紀錄、結算自動上榜）。
- *Commit: `feat(auth-leaderboard): add player registration, login, and high score leaderboard`*

### 📌 Milestone 6: 雙人合作模式與行動端適配
- [ ] 實作雙人鍵盤控制與雙角色物理碰撞互讓。
- [ ] 實作 H5 行動端觸控虛擬搖桿與雙按鍵。
- [ ] 撰寫完整 README.md 與 RETROSPECTIVE.md。
- *Commit: `feat(co-op-mobile): add 2-player local co-op and mobile touch controls`*

---

## 5. 驗收標準 (Acceptance Criteria)

1. **操作性**：角色移動流暢無卡頓，工作台判定距離合理，拿放物體直覺。
2. **完整循環**：玩家能夠完成「拿肉 $\rightarrow$ 烤肉 $\rightarrow$ 裝盤 $\rightarrow$ 送餐 $\rightarrow$ 得分 $\rightarrow$ 收髒盤 $\rightarrow$ 洗盤子」的完整流程。
3. **時間壓力**：訂單有明確超時處罰，烤肉超時會燒焦，營造 Overcooked 緊張感。
4. **帳號與榜單**：玩家可註冊暱稱，遊玩結算後可將成績寫入排行榜並即時查詢。
5. **無外部相依與穩定性**：所有音效與圖形皆採程式化合成或標準 Web API，保證在任何現代瀏覽器與手機端即開即玩。

---

## 6. 非本期目標 (Non-goals)
- ❌ 複雜的線上 WebRTC / WebSocket 多人連線（本期聚焦於純前端、單機雙人與本地排行榜）。
- ❌ 超過 10 張複雜關卡地圖（本期提供 2 張精心調校的中秋主題經典地圖）。
