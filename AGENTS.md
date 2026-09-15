# AGENTS.md — Ivan Project Development Rules

本文件是此 Repository 的長期開發規則。
Codex 每次分析、修改、重構或新增功能時，都應遵守以下要求。
除非當次任務有明確相反指示，否則以下規則持續適用。

## 1. 核心原則

- 優先保持現有功能、計算邏輯、資料及使用流程。
- 不要因為修改一個功能而重寫或破壞其他無關部分。
- 優先作最小而有效的修改。
- 不要自行刪除現有功能。
- 不要隨意改變現有設計風格，除非任務明確要求。
- 修改前先理解相關 HTML、CSS、JavaScript 及相互依賴關係。
- 避免 hard-code 不必要的尺寸、位置或裝置解像度。

## 2. Responsive Design

所有介面必須同時適合：

- iPad / Tablet
- 一般手機
- HONOR Magic V5 摺機
- 摺機摺合狀態
- 摺機展開狀態

必須根據 viewport 自動調整版面。

Responsive Design 應優先使用：

- fluid layout
- flexbox
- grid
- relative sizing
- max-width / min-width
- clamp()
- 適當的 media queries

不要只針對單一固定解像度。

畫面寬度改變時，內容應自然重新排列，而不是單純縮細整個頁面。

## 3. iPad / Tablet UX

iPad 是主要使用裝置之一。

必須確保：

- 字體大小適合實際閱讀。
- 不應因為內容較多而過度縮細文字。
- 按鈕及可點擊區域適合手指操作。
- 表格保持清晰及容易閱讀。
- 避免不必要的橫向捲動。
- 卡片、輸入欄、選項及按鈕保持合理間距。
- landscape 及 portrait viewport 都應保持可用。

## 4. Mobile / HONOR Magic V5 UX

手機版不是單純將 iPad 畫面縮小。

窄屏幕時：

- 多欄內容應按需要轉為單欄或較少欄。
- 卡片可以重新排列。
- 表格如無法完整顯示，應採取合適 responsive 處理。
- 按鈕不能細到難以點擊。
- 重要數字及結果必須保持容易閱讀。
- 不應出現文字互相覆蓋。
- 不應出現內容超出 viewport。
- 不應因固定 width 導致版面破裂。

HONOR Magic V5 展開時：

- 應善用較大畫面。
- 不要把手機窄屏 layout 單純拉闊。
- 內容寬度、卡片排列及留白應自然調整。

## 5. Typography

整個程式應保持一致及清晰的字體層級。

包括：

- Page title
- Section title
- Card title
- Description
- Option text
- Form label
- Table text
- Amount / Number
- Button text
- Helper text

原則：

- 重要內容比次要內容突出。
- 避免過細字體。
- 不要為了塞入更多內容而犧牲可讀性。
- iPad 及手機實際觀看時都應舒適。
- 金額、百分比及重要結果應容易辨認。

## 6. Existing Logic Protection

修改 UI / UX 時，不應改變既有：

- 計算公式
- JavaScript business logic
- Google Sheet mapping
- API mapping
- LocalStorage / SessionStorage
- 資料結構
- 選項邏輯
- 頁面流程
- Manifest
- Service Worker
- PWA 功能

除非任務明確要求修改以上內容。

如修改可能影響既有計算或資料流程，應先檢查依賴關係。

## 7. UI Consistency

保持整個 Repository 的設計語言一致。

包括：

- 字體
- 圓角
- 卡片
- Shadow
- Border
- Spacing
- Button
- Form controls
- Table
- Navigation
- Header

新增元素應盡量沿用現有 Design System，而不是建立另一套不一致風格。

## 8. Preserve Existing Features

每次修改後必須確認：

- 原有功能仍然存在。
- 原有按鈕仍然有效。
- 原有計算仍然正常。
- 原有頁面導航沒有被破壞。
- 原有資料 mapping 沒有意外改變。
- 沒有因 CSS 修改令其他區域變形。

## 9. Preview / Testing

每次修改完成後，應盡可能進行適用的檢查。

至少包括：

- HTML 結構
- CSS syntax
- JavaScript syntax
- Console / runtime error
- Broken references
- Responsive layout
- git diff check

如環境容許，應建立 Preview。

Preview 應優先檢查：

1. iPad / Tablet
2. 一般手機
3. HONOR Magic V5 窄屏
4. HONOR Magic V5 展開狀態

如果環境限制導致無法產生真正 Browser Preview 或 Screenshot：

- 不要假裝已經完成視覺驗證。
- 清楚說明限制原因。
- 仍然完成其他可執行的靜態及程式檢查。

## 10. Modification Report

每次修改完成後，清楚列出：

- 修改了哪些檔案
- 每個檔案修改了甚麼
- 修改原因
- 有沒有影響原有功能
- Responsive Design 做了甚麼處理
- 執行了哪些測試
- 哪些測試成功
- 哪些測試因環境限制未能執行
- 是否有需要注意的已知問題

## 11. Safety Rule

如果任務要求可能：

- 大量刪除現有程式碼
- 改變核心計算
- 改變資料 mapping
- 改變資料儲存方式
- 破壞 backward compatibility
- 大幅重構整個程式

應優先採取最小改動方案。

不要為了「整理程式碼」而修改與任務無關的部分。

## 12. Completion / Git Workflow

完成每次實際程式修改後：

1. 檢查所有修改內容。
2. 執行可用的測試及 validation。
3. 執行 git diff / git status，確認沒有意外修改。
4. Commit 本次任務的所有相關修改。
5. Commit message 必須簡潔並清楚描述本次修改。
6. 建立 Pull Request，目標 branch 為 `main`。
7. Pull Request 內清楚列出：
   - Summary
   - Files changed
   - Testing
   - Responsive / UI checks（如適用）
   - Known limitations（如有）
8. 不要將與本次任務無關的修改加入 Commit。
9. 如 Repository 已設定 GitHub Auto Merge，建立 Pull Request 後交由 GitHub workflow 處理合併。
10. 除非當次任務明確要求，Codex 不需要自行直接 merge `main`。
