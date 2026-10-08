# 動畫瘋環境光

在[巴哈姆特動畫瘋](https://ani.gamer.com.tw/)的影片周圍加上環境光（Ambilight）效果的瀏覽器擴充功能，讓影片畫面的顏色延伸到播放器外，看動畫更有沉浸感。

> 本擴充功能為非官方作品，與巴哈姆特動畫瘋無關。

## 功能

- 依照影片畫面即時產生環境光，支援 WebGL 與 Canvas2D 渲染
- 支援播放器的一般模式、劇院模式（`T`）與全螢幕（`F`）
- 自動偵測並移除影片的上下／左右黑邊，也能放大影片填滿移除黑邊後的空間
- 開啟環境光時自動切換成深色主題，關閉後恢復原本的主題（不會更改你在動畫瘋選單中的「深色模式」設定）
- 頁首、彈幕列表、動畫資訊與留言區可以融入背景
- 亮度、對比、飽和度、模糊、擴散範圍等細部調整
- 設定可以匯出成檔案，或同步到瀏覽器帳號

## 安裝

### 下載安裝

1. 到 [Releases](https://github.com/chidi0716/Animation-Crazy-ambilight/releases) 下載最新版本
2. Chrome / Edge：下載 `-chrome.zip` 並解壓縮，開啟 `chrome://extensions`，打開「開發人員模式」，點「載入未封裝項目」並選擇解壓縮後的資料夾
3. Firefox：下載 `-firefox.zip`，開啟 `about:debugging#/runtime/this-firefox`，點「載入暫用附加元件」並選擇 zip 檔（沒有經過 Mozilla 簽署的版本在重新啟動 Firefox 後會被移除）
4. 重新整理動畫瘋的播放頁

### 自行建置

需要 Node.js 22 以上。

```sh
git clone https://github.com/chidi0716/Animation-Crazy-ambilight.git
cd Animation-Crazy-ambilight
npm install
npm run build          # Chrome / Edge，輸出到 dist 資料夾
npm run build:firefox  # Firefox
```

再依照上面的步驟載入 `dist` 資料夾（Firefox 選擇 `dist/manifest.json`）。

## 使用方式

- 支援的頁面：`https://ani.gamer.com.tw/animeVideo.php?sn=*`（動畫播放頁）
- 播放器右下角控制列中，畫質按鈕左邊的「光芒螢幕」圖示就是環境光設定選單
- 快捷鍵（可在設定選單中修改，不會和動畫瘋的快捷鍵衝突）：
  - `G`：開啟／關閉環境光
  - `B`：自動移除上下黑邊
  - `V`：自動移除左右黑邊
  - `H`：將影片放大填滿移除黑邊後的空間
- 外觀：預設在開啟環境光時切換成深色主題，可在「基本設定 → 外觀（主題）」改成「跟隨動畫瘋」或「淺色」
- 設定選單的「沉浸」區塊：
  - 頁首與搜尋框融入背景：頁面在最上方時頁首（Logo、搜尋框、選單列）透明，往下捲動後變成半透明模糊（預設開啟）
  - 劇院模式時隱藏捲軸
  - 彈幕列表融入背景：影片右邊的彈幕列表與進階設定（預設開啟）
  - 動畫資訊融入背景：影片下方的標題、集數列表與作品資料（預設開啟）
  - 留言區融入背景：留言的排序列與留言列表（預設開啟）
  - 融入背景的元素透明度都跟隨「頁面內容 → 按鈕與區塊背景不透明度」

## 疑難排解

### 找不到設定按鈕

重新整理網頁。如果還是沒有出現，按 `F12` 開啟瀏覽器的 Console，搜尋以「動畫瘋環境光」開頭的錯誤或警告，並附上內容到 [Issues](https://github.com/chidi0716/Animation-Crazy-ambilight/issues) 回報。

### 效能問題

如果影片或環境光不順暢：

1. 確認瀏覽器已開啟硬體加速（Chrome：設定 → 系統 →「使用圖形加速功能」）
2. 在設定選單的「品質與效能」中開啟「WebGL 渲染器」
3. 調低「解析度」，或設定「影格率上限」
4. 關閉不需要的效果，例如「平滑動態（影格混合）」與「去色帶」
5. 同時開啟太多個動畫瘋分頁也會讓 GPU 負擔過重

### 影片抖動

Chromium 核心的瀏覽器在螢幕更新率高於 60Hz 時，影片播放可能會抖動。開啟「顯示進階設定」後，在「影片」區塊打開「影片抖動修正」，會強制瀏覽器以螢幕的更新率運作。這個修正會多使用一些 CPU 與 GPU 效能。

### 影片破圖

在 Windows 上，影片使用硬體加速疊加層（MPO）時，可能出現隨機的黑色／白色方塊、閃爍或影片被壓扁。開啟「顯示進階設定」後，在「影片」區塊打開「影片破圖修正」可以解決。

使用 NVIDIA RTX Video Super Resolution（VSR）或 RTX Video HDR 時必須關閉這個修正，否則 VSR 不會生效。

### 回報問題與建議

到 [GitHub Issues](https://github.com/chidi0716/Animation-Crazy-ambilight/issues) 回報，請附上瀏覽器版本、作業系統與動畫瘋的影片網址。

## 隱私

這個擴充功能不會傳送任何資料，詳見 [PRIVACY-POLICY.md](PRIVACY-POLICY.md)。

## 專案結構

| 檔案 | 說明 |
| --- | --- |
| `src/scripts/content.js` | 內容腳本進入點：載入 CSS、注入 `injected.js`、載入 `content-main.js` |
| `src/scripts/content-main.js` | 偵測動畫瘋的播放器（video.js），並在換集或播放器被替換時重新綁定 |
| `src/scripts/injected.js` | 在頁面主環境中執行：切換動畫瘋的深色／淺色主題（`html[data-theme]`） |
| `src/scripts/libs/ambientlight.js` | 環境光主邏輯：位置計算、檢視模式、影格排程 |
| `src/scripts/libs/settings.js`、`settings-config.js` | 播放器內的設定選單 |
| `src/scripts/libs/theming.js` | 頁面主題切換 |
| `src/styles/content.scss` | 頁面、播放器與設定選單的樣式 |

## 授權

MIT License，詳見 [LICENSE](LICENSE)。
