# Keylio 錢包spec

**版本:** 2.1 (優化版)

**最後更新:** 2025年11月16日

**核心理念:** 匿名優先、雙層加密、完美 UI/UX

---

## 目錄

1. [產品概述](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
2. [使用者流程設計](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
3. [功能需求](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
4. [UI/UX 設計規範](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
5. [技術架構](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
6. [安全性設計](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
7. [效能需求](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
8. [相容性需求](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
9. [測試策略](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
10. [發布計畫](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
11. [成功指標](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
12. [風險與緩解](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
13. [團隊與資源](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)
14. [附錄](https://www.notion.so/Keylio-spec-2adcd159d54780f4820bc233c54fc93c?pvs=21)

---

## 1. 產品概述

### 1.1 產品定位

Plasma Wallet 是一款去中心化的 HD 錢包 Web 應用，專為 Plasma 鏈穩定幣用戶設計，結合 Passkey 生物辨識、雙層加密技術與現代化 UI/UX，提供零手續費、快速且完全匿名的轉帳體驗。

### 1.2 核心價值

- **即開即用**: 3 秒完成錢包創建，無需註冊
- **完全匿名**: 預設模式下零資料收集，私鑰永不離開裝置
- **雙層加密**: 密碼 + Passkey 雙重保護
- **零手續費**: 充分利用 Plasma 鏈特性
- **多錢包管理**: 單一助記詞管理無限子錢包
- **可選帳號**: 需要跨裝置同步時才創建帳號

### 1.3 目標用戶

- **主要用戶**: 日常使用穩定幣的個人用戶，重視隱私
- **次要用戶**: 需要多錢包資金隔離的進階用戶
- **用戶特徵**: 熟悉 Web2 體驗，對加密錢包門檻有顧慮

### 1.4 技術棧

### 前端框架

- Next.js 15 (App Router)
- TypeScript 5.x (strict mode)
- React 19.x

### UI 框架與工具

- TailwindCSS 4.x
- shadcn/ui (元件庫)
- Radix UI (無障礙元件)
- Framer Motion (動畫)
- Recharts 2.x (圖表)
- Lucide React (圖示)

### 區塊鏈與錢包

- ethers.js v6
- @simplewebauthn/browser & server
- bip39 (助記詞生成)
- Web Crypto API (加密)

### 狀態管理與資料

- Zustand (全域狀態)
- React Query / TanStack Query (伺服器狀態)
- Dexie.js (IndexedDB ORM)

### 後端與資料庫

- Supabase (認證、資料庫)
- Next.js API Routes (中間層)
- PostgreSQL (用戶資料、偏好設定)

---

## 2. 使用者流程設計

### 2.1 首次使用流程（優化版）

### 步驟 0: 歡迎畫面 (3秒)

**顯示內容**:

- 品牌 Logo 動畫
- 標語：「快速、匿名、零手續費的智能錢包」
- 副標語：「🔒 完全去中心化 • 私鑰由你掌控」

**背景處理**:

- 自動在背景生成 12 字助記詞（用戶暫時看不到）
- 使用瀏覽器原生 crypto.getRandomValues() 生成熵
- 3 秒後自動轉場至設定流程

---

### 步驟 1/3: 設定錢包身份

**輸入項目**:

1. **錢包名稱** (必填)
    - 本地別名，如「我的主錢包」、「儲蓄錢包」
    - 字元限制：1-20 字元
    - 僅用於本地識別，可隨時修改
2. **ENS 名稱** (可選)
    - 格式：xxx.eth
    - 說明：「留空可之後再設定，ENS 需單獨在以太坊主網註冊並支付費用」
    - 僅保留名稱，不進行實際註冊

**UI 元素**:

- 進度條顯示：[━━━○○○] 1/3
- 即時預覽卡片：💼 我的主錢包 | alice.eth (未驗證)
- 底部按鈕：[下一步]

**驗證規則**:

- 錢包名稱不得為空
- ENS 格式驗證（若填寫，需以 .eth 結尾）

---

### 步驟 2/3: 設定錢包密碼

**輸入項目**:

1. **錢包密碼** (必填)
    - 最小長度：12 字元
    - 眼睛圖示切換可見性
2. **確認密碼** (必填)
    - 需與密碼相符

**密碼強度要求** (全部滿足才能繼續):

- ✅ 至少 8 字元
- ✅ 包含大寫字母 (A-Z)
- ✅ 包含小寫字母 (a-z)
- ✅ 包含數字 (0-9)
- ✅ 包含特殊符號 (!@#$%^&*)

**UI 元素**:

- 進度條顯示：[━━━━━○○] 2/3
- 即時密碼強度指示器：紅🔴/黃🟡/綠🟢
- 進度條分數：[████████████████░░] 16/20
- 檢查清單（即時打勾動畫）
- 警告文字：「⚠️ 此密碼用於加密你的錢包，無法找回」

**驗證規則**:

- 密碼強度必須達到「強」等級（≥15 分）
- 兩次密碼輸入必須相同

---

### 步驟 3/3: 設定 Passkey（必須）

**功能說明**:

使用生物辨識快速安全地存取你的錢包：

- ✅ 無需每次輸入密碼
- ✅ 比密碼更安全（防釣魚）
- ✅ 本地加密，永不上傳伺服器

**流程**:

1. 顯示 Passkey 說明畫面
    - 中央顯示指紋/臉部辨識動畫
    - 說明「為什麼需要 Passkey？」
2. 點擊「✨ 設定第一個 Passkey」按鈕
    - 觸發系統 WebAuthn 提示
    - 使用 Face ID / Touch ID / Windows Hello
3. 設定成功後顯示：📱 iPhone 15 Pro | Face ID | 剛剛 [✓]
4. 可選操作：點擊「+ 新增更多 Passkey（建議）」

**UI 元素**:

- 進度條顯示：[━━━━━━━] 3/3
- 已設定的 Passkey 列表
- 底部按鈕：[上一步] | [完成設定]

**要求**:

- **至少需要一個 Passkey 才能完成設定**
- 強烈建議在多個裝置設定 Passkey

---

### 步驟 4: 雙層加密助記詞（背景處理）

**處理流程**（用戶無感，自動完成）:

1. **第一層加密：使用密碼**
    - 算法：AES-256-GCM
    - 金鑰派生：PBKDF2 (100,000 iterations)
2. **第二層加密：使用 Passkey**
    - 算法：AES-256-GCM
    - 金鑰派生：從 Passkey credential ID 派生
3. **儲存至 IndexedDB**
    - 表：settings
    - 鍵：encrypted_mnemonic
4. **生成第一個子錢包**
    - BIP44 路徑：m/44'/60'/0'/0/0
5. **清除敏感資料**
    - 清除記憶體中的明文助記詞和密碼

---

### 步驟 5: 助記詞備份提醒

**彈窗提示**:

你的錢包已成功創建！但還需要最後一步...

助記詞備份是恢復錢包的唯一方式。沒有備份 = 永久失去資金。

**選項**:

- **[🔐 現在備份助記詞]** (推薦)
- **[⏰ 稍後提醒（24小時內）]**

---

### 步驟 5.1: 備份助記詞流程

**子步驟 1: 安全提醒**

⚠️ 請在安全的環境下進行：

- 確保周圍沒有攝影機
- 不要截圖或拍照
- 建議手寫在紙上

[👀 顯示助記詞] ← 需 Passkey 驗證

**子步驟 2: Passkey 驗證**

點擊「顯示助記詞」後，觸發 Passkey 驗證（Face ID / Touch ID）

**子步驟 3: 顯示助記詞**

請按順序抄寫這 12 個字：

1. abandon | 7. gauge
2. ability | 8. happy
3. able | 9. harvest
4. about | 10. hazard
5. above | 11. heart
6. absent | 12. heavy

[📋 複製到剪貼簿] ← 3秒後自動清除

☐ 我已安全地記錄這些字詞
☐ 我理解遺失後無法找回

[下一步]

---

### 步驟 5.2: 驗證備份

**隨機提問 3 個字**:

第 3 個字是？
[able] [about] [above] [absent]

第 7 個字是？
[gauge] [grace] [grant] [grape]

第 11 個字是？
[heart] [heavy] [habit] [house]

[驗證]

**驗證成功後**:

✅ 備份完成！

你已成功備份助記詞，現在可以安心使用錢包了。

記住：

- 將助記詞放在安全的地方
- 不要與任何人分享
- 不要儲存在網路上

[進入錢包]

---

### 步驟 6: 進入錢包

**主畫面顯示**:

```
┌─────────────────────────────┐
│ [≡] 💼 我的主錢包 🕶️匿名   │
│     [🔔] [⚙️]              │
├─────────────────────────────┤
│                             │
│ 總資產：$0.00 USDT          │
│ --                          │
│                             │
│ 💡 開始使用                  │
│ 1. 充值 USDT 到你的錢包      │
│ 2. 享受零手續費轉帳          │
│                             │
│ ┌───────────────────────┐   │
│ │ 💼 我的主錢包 (預設)   │   │
│ │ 0x1234...5678      📋 │   │
│ │ 0 USDT                │   │
│ │ [📥 接收] [💸 發送]   │   │
│ └───────────────────────┘   │
│                             │
│ [+ 創建新的子錢包]           │
│                             │
└─────────────────────────────┘

```

---

### 2.2 日常使用流程

### 解鎖錢包

**流程**:

1. 開啟網頁
2. 自動偵測本地錢包
3. 顯示 Passkey 驗證提示
4. 驗證成功進入主畫面

**備用方案**:

- Passkey 失敗 → 輸入密碼解鎖
- 密碼忘記 → 使用助記詞恢復

---

### 查看資產

**主畫面顯示**:

- 總資產金額（大字號 48px）
- 24 小時變化（綠漲/紅跌）
- Area Chart 顯示資產趨勢（1D/1W/1M/3M/1Y/All）
- Doughnut Chart 顯示子錢包分佈
- 子錢包列表卡片

---

### 發送 USDT

**流程**:

1. 選擇發送的子錢包
2. 輸入收款地址（支援掃描 QR Code、聯絡人選擇）
3. 輸入金額（支援快捷按鈕：100/500/1000/最大）
4. 預覽：顯示「零手續費」和「< 2 秒到帳」
5. Passkey 確認交易
6. 廣播至 Plasma 鏈
7. 顯示交易狀態（待確認 → 已確認）

---

### 接收 USDT

**流程**:

1. 選擇接收的子錢包
2. 顯示 QR Code
3. 一鍵複製地址
4. 分享地址（生成分享連結）

---

### 創建子錢包

**流程**:

1. 點擊「+ 創建新的子錢包」
2. 輸入錢包名稱
3. 選擇 Emoji 圖示
4. 選擇顏色標籤
5. 自動派生新地址（m/44'/60'/0'/0/x）
6. 添加至錢包列表

---

### 2.3 可選帳號模式（啟用雲端備份）

### 啟用雲端備份流程

1. 進入「設定」→「啟用雲端備份」
2. 說明雲端備份的好處與安全性（雙層加密）
3. 選擇登入方式：Email / Google / Apple ID
4. 創建 Supabase 帳號
5. 將雙層加密的助記詞上傳至 Supabase
6. 完成，現在支援跨裝置同步

---

### 跨裝置恢復（帳號模式）

1. 新裝置開啟網頁
2. 點擊「使用帳號登入」
3. 輸入 Email + 密碼（或社交登入）
4. 下載雙層加密的助記詞
5. 使用密碼解密第一層
6. 設定新裝置的 Passkey
7. 用新 Passkey 重新加密第二層
8. 完成恢復

---

### 2.4 恢復錢包流程（匿名模式）

1. 開啟網頁
2. 點擊「恢復錢包」
3. 輸入 12 字助記詞
4. 客戶端驗證助記詞格式
5. 重建 HD 錢包
6. 掃描區塊鏈找出已使用的派生地址
7. 設定新密碼
8. 設定新 Passkey
9. 完成恢復

---

## 3. 功能需求

### 3.1 核心功能 (P0 - Must Have)

### 3.1.1 錢包管理

- **創建錢包**: 自動生成 BIP39 標準 12 字助記詞
- **恢復錢包**: 支援助記詞或帳號登入恢復
- **HD 錢包**: BIP44 路徑 m/44'/60'/0'/0/x
- **子錢包管理**: 無限創建、自訂名稱/圖示/顏色、拖曳排序
- **錢包命名**: 本地別名 + 可選 ENS 保留

### 3.1.2 安全機制

- **雙層加密**: 密碼 + Passkey 加密助記詞
- **強制密碼強度**: 至少 8 字元混合字元
- **必須 Passkey**: 至少設定一個 Passkey 才能使用
- **本地儲存**: 所有敏感資料僅存 IndexedDB
- **助記詞備份**: 強制提醒備份，驗證機制

### 3.1.3 Plasma 鏈整合

- **USDT 轉帳**: 發送/接收 USDT
- **零手續費**: 使用 USDT 作為 gas token
- **快速確認**: 交易確認時間 < 2 秒
- **餘額查詢**: 即時查詢所有子錢包餘額
- **交易記錄**: 本地快取交易歷史

### 3.1.4 基礎 UI

- **資產總覽**: 顯示總資產和 24h 變化
- **子錢包列表**: 卡片式顯示所有子錢包
- **交易列表**: 時間倒序顯示交易記錄
- **深色主題**: 預設深色模式

---

### 3.2 進階功能 (P1 - Should Have)

### 3.2.1 資產視覺化

- **Area Chart**: 資產趨勢圖，支援時間範圍篩選
- **Doughnut Chart**: 子錢包資產分佈
- **交易詳情**: 點擊查看完整交易資訊
- **區塊鏈瀏覽器連結**: 跳轉至 Plasma 瀏覽器

### 3.2.2 輔助功能

- **聯絡人地址簿**: 儲存常用地址
- **QR Code 掃描**: 掃描地址
- **金額快捷按鈕**: 100/500/1000/最大
- **複製地址**: 一鍵複製
- **分享地址**: 生成分享連結

### 3.2.3 UI/UX 優化

- **淺色/深色主題**: 系統自動跟隨
- **多語言**: 繁中/英文
- **動畫過場**: Framer Motion 動畫
- **響應式設計**: 桌面/平板/手機
- **骨架屏**: Loading 狀態
- **觸覺回饋**: 按鈕點擊振動

### 3.2.4 雲端備份（可選）

- **帳號創建**: Email / Google / Apple ID
- **雙層加密上傳**: 上傳加密的助記詞
- **跨裝置同步**: 登入後自動同步
- **資產快照**: 雲端儲存資產歷史（用於圖表）

---

### 3.3 未來功能 (P2 - Nice to Have)

- **多穩定幣**: 支援 USDC、DAI
- **NFT 展示**: 顯示持有的 Plasma NFT
- **WalletConnect**: 連接 DApp
- **跨鏈橋接**: 從 Ethereum/Polygon 橋接
- **硬體錢包**: Ledger / Trezor 整合
- **多簽錢包**: 企業級多簽支援
- **IPFS 部署**: 完全去中心化前端

---

## 4. UI/UX 設計規範

### 4.1 設計系統

### 4.1.1 色彩系統

**主色調 (Plasma Brand)**:

- Primary: #14b8a6 (青綠色)
- Primary Hover: #0d9488
- Primary Light: #5eead4

**深色主題背景**:

- Background: #0a0e27 (深藍黑)
- Card: #141b3d (深藍灰)
- Border: #1e2749 (邊框藍)

**語意色彩**:

- Success: #10b981 (綠色，收入)
- Error: #ef4444 (紅色，支出)
- Warning: #f59e0b (橙色，警告)
- Info: #3b82f6 (藍色，資訊)

### 4.1.2 字體系統

- **字體**: Inter (英文) + Noto Sans TC (繁中)
- **標題**: 600-700 weight
- **正文**: 400-500 weight
- **大金額**: 48px / 56px, Tabular Numbers
- **次要資訊**: 14px / 16px

### 4.1.3 間距系統

- 基準: 4px grid system
- 卡片內距: 16px / 24px
- 元件間距: 12px / 16px / 24px
- 區塊間距: 32px / 48px

### 4.1.4 圓角與陰影

- 小元件: 8px border-radius
- 卡片: 16px border-radius
- 大卡片: 24px border-radius
- 陰影: 0 4px 6px rgba(0, 0, 0, 0.1)

---

### 4.2 核心頁面設計

### 4.2.1 歡迎畫面

- 品牌 Logo 居中（300px）
- 漸變背景（深藍到青綠）
- 標語（24px 字體）
- 3 秒自動轉場動畫

### 4.2.2 錢包設定流程

**共通元素**:

- 頂部進度條（1/3, 2/3, 3/3）
- 標題（24px）
- 說明文字（16px，灰色）
- 主要輸入框（48px 高度）
- 底部按鈕（「上一步」左對齐，「下一步」右對齐）

### 4.2.3 助記詞備份畫面

**顯示助記詞**:

- 警告標語（紅色，粗體）
- 12 字網格排列（2 欄 x 6 列）
- 每個字帶編號（1-12）
- 複製按鈕 + 列印按鈕
- 勾選框（「我已安全備份」）

**驗證備份**:

- 隨機提問 3 個字
- 每題 4 個選項（卡片式按鈕）
- 選中後顯示綠色勾選或紅色叉叉

### 4.2.4 主畫面（Dashboard）

**頂部導航**:

- 漢堡選單（左）
- 錢包名稱 + 匿名模式標籤（中）
- 通知 + 設定圖示（右）

**資產總覽區**:

- 總資產標題（18px）
- 金額（48px，粗體）
- 24h 變化（綠色/紅色，帶箭頭）

**圖表區**:

- Area Chart（高度 300px，漸層填充）
- 時間範圍按鈕（1D/1W/1M/3M/1Y/All）
- Doughnut Chart（中心顯示總額）

**子錢包列表**:

- 卡片式設計（白色/深色卡片）
- 每張卡片顯示：Emoji + 名稱 + 地址 + 餘額 + 百分比
- 點擊展開顯示「發送」和「接收」按鈕

### 4.2.5 發送頁面

**步驟式設計**:

1. 選擇發送錢包（單選卡片）
2. 輸入收款地址（帶掃描和聯絡人按鈕）
3. 輸入金額（大輸入框 + 快捷按鈕）
4. 預覽（顯示手續費和到帳時間）
5. Passkey 確認（全螢幕模態）
6. 交易狀態（loading → 成功/失敗）

**預覽卡片設計**:

- 發送錢包（上）
- 箭頭動畫（中）
- 收款地址（下）
- 金額（大字號）
- 手續費：「✨ 免費」（青綠色）
- 到帳時間：「⚡ < 2秒」（青綠色）

### 4.2.6 接收頁面

**簡潔設計**:

- QR Code（居中，300px）
- 地址（下方，可點擊複製）
- 複製按鈕（大按鈕，青綠色）
- 分享按鈕（次要按鈕）

---

### 4.3 設計原則

- **極簡主義**: 每頁最多 3 個主要行動
- **資訊層級**: 使用大小、顏色、間距建立層級
- **即時回饋**: 所有操作有 loading 和成功/失敗提示
- **防錯設計**: 重要操作需二次確認
- **無障礙**: 符合 WCAG 2.1 AA 標準
- **一致性**: 統一的視覺語言和互動模式

---

## 5. 技術架構

### 5.1 系統架構

```
┌─────────────────────────────────┐
│  Browser (用戶完全控制)          │
├─────────────────────────────────┤
│ Next.js App (Static Export)     │
│ ├─ Pages (App Router)           │
│ ├─ Components (shadcn/ui)       │
│ ├─ HD Wallet Engine (ethers.js) │
│ ├─ Passkey Manager (WebAuthn)   │
│ ├─ Encryption Layer (Web Crypto)│
│ └─ State Management (Zustand)   │
├─────────────────────────────────┤
│ IndexedDB (本地儲存)             │
│ ├─ encrypted_mnemonic           │
│ ├─ sub_wallets                  │
│ ├─ transactions                 │
│ ├─ contacts                     │
│ └─ preferences                  │
└─────────────────────────────────┘
      ↕ (僅帳號模式時通訊)
┌─────────────────────────────────┐
│ Supabase (可選雲端備份)          │
│ ├─ auth.users                   │
│ ├─ encrypted_backups            │
│ └─ asset_snapshots              │
└─────────────────────────────────┘
      ↕
┌─────────────────────────────────┐
│ Plasma RPC (去中心化節點)        │
│ ├─ 查詢餘額                     │
│ ├─ 廣播交易                     │
│ └─ 監聽事件                     │
└─────────────────────────────────┘

```

---

### 5.2 HD 錢包架構

**助記詞生成**:

- 使用 BIP39 標準生成 12 字助記詞
- 熵來源：瀏覽器 crypto.getRandomValues()
- 128 bits 熵 = 12 words

**派生路徑**:

- 標準：BIP44 Ethereum 路徑
- 主路徑：m/44'/60'/0'/0/x
- x = 0, 1, 2, ... (子錢包索引)
- 使用 Hardened Derivation 確保安全

**私鑰管理**:

- 助記詞 → Master Seed → Master Key
- 每個子錢包獨立私鑰
- 私鑰永不儲存明文
- 使用時才從助記詞派生

---

### 5.3 加密架構

**雙層加密設計**:

**第一層：密碼加密**

- 算法：AES-256-GCM
- 金鑰派生：PBKDF2 (100,000 iterations)
- Salt：隨機 16 bytes
- IV：隨機 12 bytes
- 輸入：明文助記詞
- 輸出：加密的助記詞 JSON

**第二層：Passkey 加密**

- 算法：AES-256-GCM
- 金鑰派生：從 Passkey credential ID 派生
- Salt：固定 salt (plasma-wallet-passkey-salt)
- IV：隨機 12 bytes
- 輸入：第一層加密的助記詞
- 輸出：雙層加密的助記詞 JSON

**儲存位置**:

- 匿名模式：僅 IndexedDB
- 帳號模式：IndexedDB + Supabase (雙層加密)

---

### 5.4 Passkey 整合

**註冊流程**:

1. 生成隨機 challenge (32 bytes)
2. 調用 navigator.credentials.create()
3. 參數：rp, user, pubKeyCredParams, authenticatorSelection
4. 儲存 credential ID 至 IndexedDB

**驗證流程**:

1. 生成隨機 challenge
2. 調用 navigator.credentials.get()
3. 參數：rpId, userVerification
4. 驗證成功後解密助記詞

**多裝置支援**:

- 每個裝置獨立註冊 Passkey
- 儲存多個 credential ID
- 任一 Passkey 都可解鎖

---

### 5.5 Plasma 鏈整合

**RPC 連接**:

- Provider: JsonRpcProvider (ethers.js)
- RPC URL: [https://rpc.plasma.network](https://rpc.plasma.network/)
- Chain ID: (Plasma 鏈 ID)

**USDT 合約**:

- 合約地址: 0x... (Plasma USDT)
- ABI: ERC-20 標準
- Decimals: 6

**餘額查詢**:

- 方法：balanceOf(address)
- 輪詢間隔：5 秒
- 快取至 IndexedDB

**轉帳交易**:

- 方法：transfer(to, amount)
- Gas token: USDT (零手續費)
- 簽名：使用派生的子錢包私鑰
- 廣播：sendTransaction()

**交易監聽**:

- 監聽 Transfer 事件
- 過濾：from 或 to 為用戶地址
- 更新本地交易記錄

---

### 5.6 資料模型

**IndexedDB Schema**:

**settings 表**:

- key (PK): 設定鍵名
- value: 設定值
- 範例：encrypted_mnemonic, wallet_identity, backup_reminder

**sub_wallets 表**:

- id (PK, auto): 唯一 ID
- index: 派生路徑索引
- address: 錢包地址
- name: 錢包名稱
- emoji: Emoji 圖示
- color: 顏色標籤
- isDefault: 是否預設
- order: 排序
- createdAt: 創建時間

**passkeys 表**:

- id (PK): credential ID
- deviceName: 裝置名稱
- createdAt: 創建時間
- lastUsedAt: 最後使用時間

**contacts 表**:

- id (PK, auto): 唯一 ID
- name: 聯絡人名稱
- address: 地址
- avatar: 頭像 URL
- tags: 標籤陣列
- createdAt: 創建時間

**transactions 表**:

- id (PK): 交易 hash
- subWalletId (FK): 子錢包 ID
- from: 發送地址
- to: 接收地址
- amount: 金額 (string)
- type: 'send' | 'receive'
- status: 'pending' | 'confirmed' | 'failed'
- timestamp: 時間戳
- blockNumber: 區塊號

---

### 5.7 狀態管理

**Zustand Store 設計**:

**walletStore**:

- currentWallet: 當前選中的子錢包
- subWallets: 所有子錢包陣列
- totalBalance: 總餘額
- isLocked: 錢包是否鎖定
- actions: unlock, lock, addSubWallet, selectWallet

**transactionStore**:

- transactions: 交易記錄陣列
- pendingTx: 待確認交易
- actions: addTx, updateTxStatus, fetchHistory

**uiStore**:

- theme: 'dark' | 'light'
- language: 'zh-TW' | 'en'
- showBackupReminder: boolean
- actions: setTheme, setLanguage, dismissReminder

---

## 6. 安全性設計

### 6.1 威脅模型

**威脅場景 A: 伺服器被駭**

- 攻擊者取得 Supabase 完整存取權
- 能看到：Email、雙層加密的助記詞、公開地址、資產快照
- 無法解密：缺少用戶密碼和 Passkey
- 結果：❌ 無法存取資金

**威脅場景 B: 裝置被盜**

- 攻擊者偷走手機/電腦
- 需要：Passkey (生物辨識) 或密碼
- 緩解：用戶可在其他裝置登入並轉移資金
- 結果：❌ 無法解鎖（若有生物辨識保護）

**威脅場景 C: 中間人攻擊**

- 攻擊者攔截網路流量
- 匿名模式：無加密資料傳輸
- 帳號模式：僅能看到雙層加密資料
- 結果：❌ 無法解密

**威脅場景 D: 釣魚攻擊**

- 攻擊者仿冒網站
- Passkey 防護：WebAuthn 綁定 domain
- 結果：✅ Passkey 在假網站無法使用

**威脅場景 E: 助記詞洩露**

- 用戶助記詞被竊
- 結果：⚠️ 資金全失（無法防禦）
- 緩解：強調備份安全性，提供加密備份選項

---

### 6.2 安全最佳實踐

**程式碼層級**:

- Content Security Policy (CSP) 防止 XSS
- Subresource Integrity (SRI) 確保 CDN 安全
- 依賴套件定期審計（Snyk / Dependabot）
- 敏感操作後立即清除記憶體

**加密層級**:

- 使用瀏覽器原生 Web Crypto API
- AES-256-GCM 對稱加密
- PBKDF2 金鑰派生（100,000 iterations）
- 隨機 salt 和 IV

**部署層級**:

- Next.js Static Export（純靜態網站）
- 部署至 Vercel / Cloudflare Pages / IPFS
- HTTPS Strict Transport Security (HSTS)
- 定期備份 Supabase 資料庫

**用戶教育**:

- 強調助記詞重要性
- 提示不要截圖或拍照
- 建議手寫備份
- 警告不要與任何人分享

---

### 6.3 隱私保護

**匿名模式**:

- 零資料收集（無 IP、無地址、無交易）
- 所有操作在客戶端完成
- 直接連接 Plasma RPC（與 MetaMask 相同）

**帳號模式**:

- 僅收集 Email（可選社交登入）
- 助記詞雙層加密，伺服器無法解密
- 區塊鏈交易仍公開（區塊鏈特性）
- 不會將 Email 與鏈上地址關聯

**資料最小化**:

- 僅儲存必要資料
- 資產快照僅儲存金額，無交易詳情
- 用戶偏好不包含敏感資訊

---

## 7. 效能需求

### 7.1 效能指標

**Core Web Vitals**:

- First Contentful Paint (FCP): < 1.5 秒
- Largest Contentful Paint (LCP): < 2.5 秒
- First Input Delay (FID): < 100 毫秒
- Cumulative Layout Shift (CLS): < 0.1

**應用效能**:

- 錢包解鎖時間: < 1 秒
- 交易廣播時間: < 500 毫秒
- 餘額查詢時間: < 2 秒
- 圖表渲染時間: < 500 毫秒

**Lighthouse 分數**:

- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80

---

### 7.2 優化策略

**程式碼分割**:

- 動態匯入大型依賴（ethers.js, recharts）
- 路由層級程式碼分割
- 延遲載入非關鍵元件

**資料快取**:

- IndexedDB 快取餘額和交易
- React Query 快取 RPC 查詢
- Service Worker 快取靜態資源

**圖片優化**:

- Next.js Image 元件
- WebP 格式
- Lazy loading

**打包優化**:

- Tree shaking 移除未使用程式碼
- Minification 壓縮
- Gzip / Brotli 壓縮

---

## 8. 相容性需求

### 8.1 瀏覽器支援

**桌面**:

- ✅ Chrome / Edge 90+
- ✅ Safari 16+
- ✅ Firefox 91+
- ❌ Internet Explorer (不支援)

**行動**:

- ✅ iOS 16+ (Safari)
- ✅ Android 11+ (Chrome)

**關鍵 API 需求**:

- WebAuthn Level 2 (Passkey)
- Web Crypto API (加密)
- IndexedDB (儲存)
- ES2020 (JavaScript)

---

### 8.2 裝置支援

**Passkey 支援**:

- iOS: Face ID / Touch ID
- Android: Fingerprint / Face Unlock
- macOS: Touch ID
- Windows: Windows Hello
- Linux: FIDO2 相容認證器

**螢幕尺寸**:

- 手機: 360px - 480px (單欄)
- 平板: 768px - 1024px (兩欄)
- 桌面: 1280px+ (三欄)

---

## 9. 測試策略

### 9.1 測試類型

**單元測試**:

- HD 錢包邏輯（派生路徑、簽名）
- 加密/解密函數
- 密碼強度驗證
- 助記詞驗證

**整合測試**:

- Passkey 註冊/驗證流程
- Plasma RPC 連接
- IndexedDB 儲存/讀取
- 交易簽名和廣播

**端對端測試**:

- 完整錢包創建流程
- 發送/接收 USDT
- 子錢包創建
- 雲端備份啟用

**安全測試**:

- 加密強度測試
- XSS / CSRF 防護測試
- 依賴套件漏洞掃描
- 第三方安全審計

---

### 9.2 測試環境

**Plasma Testnet**:

- 使用測試網進行開發和測試
- 免費測試 USDT
- 測試交易和餘額查詢

**本地環境**:

- 模擬 Plasma RPC
- 模擬 Passkey (Chrome DevTools)
- 使用 IndexedDB 測試工具

---

## 10. 發布計畫

### 10.1 MVP (Q1 2026)

**目標**: 驗證核心概念，取得早期用戶回饋

**功能範圍**:

- ✅ 匿名錢包創建（優化流程）
- ✅ 雙層加密（密碼 + Passkey）
- ✅ HD 錢包（最多 5 個子錢包）
- ✅ Plasma USDT 轉帳
- ✅ 助記詞備份提醒
- ✅ 基本資產總覽
- ✅ 交易歷史
- ✅ 深色主題

**不包含**:

- ❌ 雲端備份
- ❌ 圖表視覺化
- ❌ 聯絡人地址簿
- ❌ 淺色主題

**成功指標**:

- 500 匿名用戶測試
- 完成 2,000+ 筆測試交易
- 零重大安全事故
- 用戶滿意度 > 4.0/5.0

---

### 10.2 V1.0 正式版 (Q2 2026)

**新增功能**:

- ✅ 可選雲端備份（雙層加密）
- ✅ 帳號註冊（Email / 社交登入）
- ✅ 跨裝置同步
- ✅ 資產圖表（Area + Doughnut）
- ✅ 無限子錢包
- ✅ 聯絡人地址簿
- ✅ QR Code 掃描
- ✅ 淺色/深色主題切換
- ✅ 多語言（繁中/英文）

**技術優化**:

- Lighthouse 分數 > 90
- 第三方安全審計完成
- Plasma mainnet 上線
- Service Worker 離線支援

**成功指標**:

- 5,000 活躍用戶
- 30% 用戶啟用雲端備份
- 單日交易量 > 10,000 筆
- 第三方審計通過

---

### 10.3 V1.1 功能擴展 (Q3 2026)

**新增功能**:

- ✅ CSV/PDF 匯出
- ✅ 交易限額設定
- ✅ 進階統計
- ✅ PWA 推播通知
- ✅ 桌面版應用（Tauri）

---

### 10.4 V2.0 生態擴展 (Q4 2026)

**新增功能**:

- ✅ 多穩定幣（USDC、DAI）
- ✅ NFT 展示
- ✅ WalletConnect 整合
- ✅ 跨鏈橋接
- ✅ 硬體錢包整合
- ✅ IPFS 部署

---

## 11. 成功指標 (KPIs)

### 11.1 產品指標

**用戶增長**:

- 月活躍用戶 (MAU): 10,000 (6 個月)
- 日活躍用戶 (DAU): 3,000
- DAU/MAU 比率: > 30%

**用戶留存**:

- D7 留存率: > 40%
- D30 留存率: > 20%
- M3 留存率: > 10%

**使用深度**:

- 平均單用戶子錢包數: > 2.5
- 平均每日交易次數: > 2
- 日交易量: > 50,000 筆

**轉換率**:

- 完成錢包創建率: > 80%
- 完成助記詞備份率: > 60%
- 啟用雲端備份率: > 25%

---

### 11.2 技術指標

**效能**:

- Core Web Vitals 達標率: > 95%
- 錯誤率: < 0.1%
- API 回應時間 P95: < 500ms

**安全**:

- 交易成功率: > 99.9%
- Passkey 驗證成功率: > 98%
- 零資金安全事故

---

### 11.3 用戶體驗指標

**滿意度**:

- NPS (淨推薦值): > 50
- App Store / Chrome Web Store 評分: > 4.5/5.0
- 用戶支援票單量: < 5% 用戶數

**易用性**:

- 新用戶完成首筆交易率: > 80%
- 平均完成首筆交易時間: < 3 分鐘
- 錢包創建流程完成率: > 85%

---

## 12. 風險與緩解

### 12.1 技術風險

| 風險 | 影響 | 機率 | 緩解策略 |
| --- | --- | --- | --- |
| Passkey 瀏覽器相容性 | 高 | 中 | 提供備用密碼驗證；顯示相容性警告 |
| Plasma RPC 不穩定 | 高 | 中 | 配置多個 RPC fallback；本地快取 |
| IndexedDB 資料遺失 | 極高 | 低 | 強制助記詞備份；定期提醒 |
| HD 錢包實作漏洞 | 極高 | 低 | 使用標準庫；第三方審計 |
| Web Crypto API 效能 | 中 | 低 | 優化加密流程；使用 Web Worker |

---

### 12.2 產品風險

| 風險 | 影響 | 機率 | 緩解策略 |
| --- | --- | --- | --- |
| 用戶不理解雙層加密 | 中 | 高 | 簡化術語；提供視覺化說明 |
| Plasma 採用率低 | 高 | 中 | 強調零手續費；建立社群 |
| 競品出現 | 中 | 中 | 專注 UI/UX 差異化；快速迭代 |
| 助記詞備份率低 | 高 | 中 | 強制提醒；驗證機制；獎勵 |

---

### 12.3 法規風險

| 風險 | 影響 | 機率 | 緩解策略 |
| --- | --- | --- | --- |
| KYC/AML 要求 | 高 | 中 | 預留身份驗證模組；監控法規 |
| 穩定幣監管 | 極高 | 低 | 支援多幣種；快速適應 |
| 去中心化錢包合規 | 中 | 低 | 法律諮詢；不涉及法幣 |

---

## 13. 團隊與資源

### 13.1 開發團隊

| 角色 | 人數 | 職責 |
| --- | --- | --- |
| 產品經理 | 1 | 需求定義、用戶研究、路線圖 |
| 前端工程師 | 2 | Next.js 開發、UI 實作 |
| 區塊鏈工程師 | 1 | Plasma 整合、安全審查 |
| UI/UX 設計師 | 1 | 介面設計、互動原型 |
| QA 工程師 | 1 | 測試計畫、安全測試 |

---

### 13.2 時程表

```
2025 Q4: 技術預研與設計
├─ 11月: 技術選型、架構設計
├─ 12月: UI/UX 設計、原型製作

2026 Q1: MVP 開發
├─ 1月: HD 錢包核心 + 雙層加密
├─ 2月: Plasma 連接 + 轉帳功能
├─ 3月: 測試 + 早期用戶招募

2026 Q2: V1.0 正式發布
├─ 4月: 雲端備份 + 圖表功能
├─ 5月: 安全審計 + Bug 修復
├─ 6月: Mainnet 上線 + 行銷推廣

2026 Q3-Q4: 功能擴展與生態建設

```

---

## 14. 附錄

### 14.1 術語表

| 術語 | 解釋 |
| --- | --- |
| HD 錢包 | Hierarchical Deterministic Wallet，可從單一助記詞派生多個子錢包 |
| Passkey | 基於 WebAuthn 標準的無密碼認證，使用生物辨識 |
| BIP39 | 定義助記詞生成標準 |
| BIP44 | 定義 HD 錢包派生路徑標準 |
| Plasma | 高效能 Layer 1 區塊鏈，支援零手續費穩定幣交易 |
| Hardened Derivation | 強化派生，確保子私鑰洩露不影響其他錢包 |
| WebAuthn | W3C 網頁認證標準 |
| AES-GCM | 對稱加密算法 |
| PBKDF2 | 金鑰派生函數 |
| RLP | 遞迴長度前綴編碼 |

---

### 14.2 常見問題

**Q: 雙層加密會影響效能嗎？**

A: 加密/解密操作在現代瀏覽器中非常快速（< 100ms），對用戶體驗無明顯影響。

---

**Q: 如果忘記密碼怎麼辦？**

A: 可使用助記詞恢復錢包，重新設定密碼。這就是為什麼助記詞備份如此重要。

---

**Q: Passkey 比密碼更安全嗎？**

A: 是的。Passkey 防釣魚、防重放攻擊，且綁定特定 domain，無法在假網站使用。

---

**Q: 為什麼要強制設定 Passkey？**

A: 確保用戶有便利的解鎖方式，避免頻繁輸入複雜密碼，同時提升安全性。

---

**Q: 匿名模式真的完全匿名嗎？**

A: 是的。我們的伺服器完全看不到你的資料。唯一的連線是你的瀏覽器直接與 Plasma 區塊鏈通訊。

---

**Q: 啟用雲端備份後還安全嗎？**

A: 是的。助記詞經過雙層加密，即使伺服器被駭也無法解密。

---

### 14.3 參考資料

- BIP39: [https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- BIP44: [https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- WebAuthn: [https://www.w3.org/TR/webauthn-2/](https://www.w3.org/TR/webauthn-2/)
- ethers.js: [https://docs.ethers.org/v6/](https://docs.ethers.org/v6/)
- Plasma 文件: [https://plasma.io/docs](https://plasma.io/docs)

---

**文件狀態**: Final v2.1

**核心理念**: Privacy First, Security Built-in, User Experience Perfected

**下次審查**: 2026-01-15