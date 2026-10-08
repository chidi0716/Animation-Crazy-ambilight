# 動畫瘋環境光（Ambient light for ani.gamer.com.tw）

在[巴哈姆特動畫瘋](https://ani.gamer.com.tw/)的影片周圍加上環境光（Ambilight）效果的瀏覽器擴充功能。

> 本專案為非官方的第三方擴充功能，與巴哈姆特動畫瘋、嗶哩嗶哩（Bilibili）及 YouTube 無關。

本專案以 iceorange-dev 的 [Bilibili 環境光](https://github.com/iceorange-dev/bilibili-ambilight) 為基礎修改，而它是 [Ambient light for YouTube™](https://github.com/WesselKroos/youtube-ambilight)（作者 Wessel Kroos，MIT License）的移植版。渲染引擎（WebGL / Canvas2D 投影、黑邊偵測、統計）沿用原專案，網站整合的部分改寫給動畫瘋的播放器（video.js）使用。

## 支援的頁面

- `https://ani.gamer.com.tw/animeVideo.php?sn=*`（動畫播放頁）

支援播放器的一般模式、劇院模式（`T`）與全螢幕（`F`）。

## 安裝（開發者模式）

需要 Node.js 22 以上。

```sh
git clone https://github.com/chidi0716/Animation-Crazy-ambilight.git
cd Animation-Crazy-ambilight
npm install
npm run build
```

1. Chrome / Edge：開啟 `chrome://extensions`，打開「開發人員模式」
2. 點「載入未封裝項目」，選擇 `dist` 資料夾
3. 重新整理動畫瘋的播放頁

Firefox：改用 `npm run build:firefox` 建置（Firefox 的 manifest 需要 `background.scripts`，Chrome 則只接受 `background.service_worker`），再開啟 `about:debugging#/runtime/this-firefox` →「載入暫用附加元件」→ 選擇 `dist/manifest.json`。

## 使用方式

- 播放器右下角的控制列中，畫質按鈕左邊的「光芒螢幕」圖示就是環境光設定選單
- 快捷鍵（可在設定選單中修改，不會和動畫瘋的快捷鍵衝突）：
  - `G`：開啟／關閉環境光
  - `B`：自動移除上下黑邊
  - `V`：自動移除左右黑邊
  - `H`：將影片放大填滿移除黑邊後的空間
- 預設在開啟環境光時會把頁面切換成深色主題。可在「基本設定 → 外觀（主題）」改成「跟隨動畫瘋」或「淺色」。擴充功能只會暫時切換頁面的主題，不會更改你在動畫瘋選單中的「深色模式」設定
- 設定選單的「沉浸」區塊：
  - 頁首與搜尋框融入背景：頁面在最上方時頁首（Logo、搜尋框、選單列）透明，往下捲動後變成半透明模糊（預設開啟）
  - 劇院模式時隱藏捲軸
  - 彈幕列表融入背景：影片右邊的彈幕列表與進階設定（預設開啟）
  - 動畫資訊融入背景：影片下方的標題、集數列表與作品資料（預設開啟）
  - 留言區融入背景：留言的排序列與留言列表（預設開啟）
  - 融入背景的元素透明度都跟隨「頁面內容 → 按鈕與區塊背景不透明度」

## 與 Bilibili 版的差異

- 偵測動畫瘋的 video.js 播放器（`.videoframe` → `.video-js` → `video.vjs-tech`），並在換集、廣告結束後播放器或影片元素被替換時重新綁定
- 劇院模式以 `.videoframe.vjs-fullwindow` 判斷；全螢幕時動畫瘋會讓整個網頁（`<html>`）進入全螢幕並用 `body.fullscreen` 隱藏播放器以外的元素，所以環境光會被移到 `.videoframe` 裡面
- 深色／淺色主題是切換 `<html data-theme="dark|light">`
- 移除 B 站專屬的鏡像畫面、小窗播放器與彈幕輸入列相關功能

## 專案結構

| 檔案 | 說明 |
| --- | --- |
| `src/scripts/content.js` | 內容腳本進入點：載入 CSS、注入 `injected.js`、載入 `content-main.js` |
| `src/scripts/content-main.js` | 偵測動畫瘋的播放器，並在播放器／影片元素被替換時重新綁定 |
| `src/scripts/injected.js` | 在頁面主環境中執行：切換動畫瘋的深色／淺色主題（`html[data-theme]`） |
| `src/scripts/libs/ambientlight.js` | 環境光主邏輯：位置計算、檢視模式、影格排程 |
| `src/scripts/libs/settings.js`、`settings-config.js` | 播放器內的設定選單 |
| `src/scripts/libs/theming.js` | 頁面主題切換 |
| `src/styles/content.scss` | 頁面、播放器與設定選單的樣式 |

## 授權

MIT License，詳見 [LICENSE](LICENSE)。

- 原始作品 Ambient light for YouTube™：Copyright (c) 2017 Wessel Kroos
- Bilibili 移植與修改：Copyright (c) 2026 iceorange-dev
- 動畫瘋移植與修改：Copyright (c) 2026 chidi0716

原專案與 Bilibili 版的 git 歷史完整保留在本 repo 中。
