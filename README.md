# 🥮 月白之隱：中秋烤肉大作戰 (Moon BBQ Panic)

一款以「中秋節烤肉狂歡」為主題的 Overcooked 風格 2D 俯視角協作烹飪 H5 遊戲。玩家扮演月宮大廚，在時限內拿取食材、切備料、烤肉、裝盤出餐與洗碗，爭奪排行榜寶座！

---

## 🎮 遊戲特色與核心玩法
- **Overcooked 經典烹飪循環**：食材拿取 $\rightarrow$ 砧板備料 $\rightarrow$ 炭火烘烤 $\rightarrow$ 餐盤裝盤 $\rightarrow$ 出餐得分 $\rightarrow$ 水槽洗碗。
- **🚀 物品前拋系統 (Throwing Physics)**：長按空白鍵蓄力，放開將食材飛拋越過工作台拋給隊友或直接飛入鍋盤！
- **🔥 炭火火候狀態機**：生料 $\rightarrow$ 烘烤中 $\rightarrow$ 完美熟成 (金光) $\rightarrow$ 燒焦警告 $\rightarrow$ 焦炭 (濃煙)。
- **🍽️ 限量 2 餐盤洗碗循環**：全場僅 2 個餐盤，出餐後髒盤回流，需至水槽清洗乾淨才能循環使用。
- **👥 1P 單人 / 2P 雙人同機協作**：一鍵切換單人修練或雙人同台聯手大作戰！
- **👤 玩家帳號與天梯排行榜**：支援訪客、註冊登入、個人最高分保存與即時中秋廚神排行榜。
- **🔊 純程式化 Web Audio 音效**：切菜、火花、拋物、出餐鈴聲、警報、洗滌咕嚕聲，零外部音檔依賴。

---

## 🕹️ 遊戲操作指南 (Controls)

| 模式 | 角色 | 移動 | 拿放 / 蓄力前拋 | 備料切菜 / 水槽洗碗 | 查看食譜 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1P 單人** | 🐰 玉兔大廚 | `W A S D` 或 `方向鍵` | `Space` 或 `F` | `E` 或 `G` (長按) | `H` 或 `R` (空白鍵關閉) |
| **2P 雙人 - 玩家 1** | 🐰 玉兔大廚 | `W A S D` | `Space` 或 `F` | `E` 或 `G` (長按) | `H` 或 `R` |
| **2P 雙人 - 玩家 2** | 🪓 吳剛大廚 | `↑ ↓ ← →` (方向鍵) | `K` (短按拿放/長按前拋) | `L` (長按) | `H` 或 `R` |
| **行動端 H5** | 🐰 觸控大廚 | 螢幕左側虛擬搖桿 | 「✋ 拿/放」按鈕 | 「⚡ 切/洗」按鈕 | 點擊頂部 `📖` 按鈕 |

---

## 🚀 本地執行與 Vercel 部署 (Local Setup & Deployment)

### 本地開發
```bash
# 1. 安裝依賴套件
npm install

# 2. 啟動本機開發伺服器
npm run dev

# 3. 建置生產版本
npm run build
```

### Vercel 雲端部署
本專案為標準純前端 Vite 架構，支援零配置一鍵上線 Vercel：
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 🤖 AI 協作工具與開發流程
- **開發模式**：SDD (Spec-Driven Development，規格驅動開發)
- **AI 助手**：Gemini 3.7 (Advanced Agentic Pair Programmer)
- **輔助工具**：Antigravity IDE

---

## 📄 專案文件導引
- [SPEC.md](file:///Users/pikachpika123/Desktop/moon-festival-homework/SPEC.md) - 詳細功能規格、狀態機與驗收標準
- [RETROSPECTIVE.md](file:///Users/pikachpika123/Desktop/moon-festival-homework/RETROSPECTIVE.md) - 開發復盤與 AI 協作經驗總結
