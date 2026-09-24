# 開發復盤與 AI 協作紀錄 (RETROSPECTIVE.md)

本文件紀錄《月夜大廚：中秋烤肉大作戰》在 SDD (Spec-Driven Development) 模式下的開發復盤、各階段演進、AI 協作中的成功經驗與失敗案例分析。

---

## 1. 規格與架構設計復盤 (Spec & Architecture)

### 亮點與決策
- **分階段 Milestone 規劃**：將複雜的 Overcooked 機制拆解成 6 個獨立可驗證的里程碑，避免一次性生成過多程式碼造成的邏輯混亂。
- **純前端輕量架構**：採用 Vite + Canvas 2D + ES Modules + Web Audio API，兼顧極速載入與手機/電腦雙平台流暢度。

---

## 2. AI 協作踩坑與失敗案例紀錄 (AI Failures & Recovery)

| 階段 / 功能 | 遇到之問題或 AI 偏差 | 根本原因分析 | 修正與調整方案 |
| :--- | :--- | :--- | :--- |
| **Milestone 0: 初始化** | Git root 預設抓到使用者家目錄 | 家目錄存在殘留 `.git` | 手動在專案資料夾執行 `git init` 確保專案獨立版本控制 |
| *(後續開發實施時持續更新)* | | | |

---

## 3. 開發成果與 Commit 追蹤

- [x] Milestone 1: 基礎架構、地圖網格、角色移動與物件拿放
  - 完成 Vite + ES Modules + High-DPI Canvas 2D 骨架
  - 完成廚房網格（地磚、備料台、炭火烤爐、食材箱、餐盤架、水槽、出餐口、垃圾桶）
  - 完成主角（月白之隱/玉兔大廚）平滑移動、AABB 碰撞檢測、朝向判定與物件拿起/放下系統
- [ ] Milestone 2: 食材箱、切菜台與炭火烤肉狀態機
- [ ] Milestone 3: 裝盤配方、訂單倒數、出餐計分與洗碗循環
- [ ] Milestone 4: Web Audio 擬真音效與中秋節慶粒子特效
- [ ] Milestone 5: 玩家帳號註冊/登入與排行榜系統
- [ ] Milestone 6: 雙人合作/對抗模式與行動端虛擬搖桿
