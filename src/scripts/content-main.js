import {
  wrapErrorHandler,
  isWatchPageUrl,
  setErrorHandler,
  setWarning,
  playerContainerSelector,
  videoSelector,
} from './libs/generic';
import ErrorReporter from './libs/errors/reporter';
import Ambientlight from './libs/ambientlight';
import Settings from './libs/settings';

setErrorHandler((ex) => ErrorReporter.captureException(ex));

const getVideoElem = () => document.querySelector(videoSelector);

// The top level element of the page that contains the player: #BH_background
const getAppElem = (videoElem) => videoElem.closest('body > *');

// The header of the page (logo, search bar and the menu)
const getMastheadElem = () => document.querySelector('body > .top_sky');

// The right side of the control bar of the player (quality, danmaku, speed, theater mode and fullscreen buttons)
const settingsMenuBtnParentSelector = '.vjs-control-bar .control-bar-rightbtn';

const tryInitAmbientlight = async () => {
  if (window.ambientlight) return true;
  if (!isWatchPageUrl()) return;

  const videoElem = getVideoElem();
  if (!videoElem) return;

  const settingsMenuBtnParent = videoElem
    .closest(playerContainerSelector)
    ?.querySelector(settingsMenuBtnParentSelector);
  if (!settingsMenuBtnParent) return;

  const appElem = getAppElem(videoElem);
  if (!appElem) return;

  window.ambientlight = await new Ambientlight(
    videoElem,
    appElem,
    getMastheadElem()
  );

  detectReplacedPlayerElems();
  return true;
};

// The video.js player can be recreated with a new video element.
// For example: After the advertisement or when navigating to another episode
const detectReplacedPlayerElems = () => {
  let scheduled = false;
  let checking = false;

  const check = wrapErrorHandler(async function checkReplacedPlayerElems() {
    scheduled = false;
    if (checking || !isWatchPageUrl()) return;

    const ambientlight = window.ambientlight;
    if (!ambientlight?.settings) return;

    const videoElem = getVideoElem();
    if (!videoElem) return;

    checking = true;
    try {
      const pageElemsChanged = ambientlight.updatePageElems(
        getAppElem(videoElem),
        getMastheadElem()
      );

      const playerChanged =
        !ambientlight.videoPlayerElem?.isConnected ||
        !ambientlight.videoPlayerElem.contains(videoElem);
      const videoChanged =
        playerChanged || ambientlight.videoElem !== videoElem;

      if (playerChanged) {
        await ambientlight.reinitPlayerElems(videoElem);
      } else if (videoChanged) {
        ambientlight.initVideoElem(videoElem);
      }

      // The control bar of the player could have been re-rendered
      if (!ambientlight.settingsMenuBtnParent?.isConnected) {
        const settingsMenuBtnParent =
          ambientlight.videoPlayerElem.querySelector(
            settingsMenuBtnParentSelector
          );
        if (settingsMenuBtnParent)
          ambientlight.settingsMenuBtnParent = settingsMenuBtnParent;
      }
      ambientlight.settings.attachToPlayer(
        ambientlight.settingsMenuBtnParent,
        ambientlight.videoAreaElem
      );

      if (ambientlight.elem && !ambientlight.elem.isConnected) {
        ambientlight.appendElemToViewContainer();
        ambientlight.sizesChanged = true;
      }

      if (videoChanged) {
        await ambientlight.start();
      } else if (pageElemsChanged) {
        await ambientlight.optionalFrame();
      }
    } finally {
      checking = false;
    }
  }, true);

  // Throttled, because the danmaku (comments that fly over the video) and the danmaku list mutate the page continuously
  const observer = new MutationObserver(function onPageMutation() {
    if (scheduled) return;

    scheduled = true;
    setTimeout(check, 250);
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
  });
};

const loadAmbientlight = async () => {
  if (await tryInitAmbientlight()) return;
  // The video player has not been loaded yet

  try {
    await Settings.getStoredSettingsCached();
  } catch (ex) {
    setWarning(
      `無法載入先前的設定，請重新整理網頁再試一次。${'\n'}更新擴充功能後可能會發生這種情況。${'\n\n'}${ex?.toString()}`
    );

    if (
      !(
        ex.message === 'uninstalled' ||
        ex.message?.includes('QuotaExceededError')
      )
    ) {
      console.error(ex);
    }
  }

  // Listen to DOM changes
  let initializing = false;
  let tryAgain = true;
  const observer = new MutationObserver(
    wrapErrorHandler(async function pageObserved(mutationsList, observer) {
      if (initializing) {
        tryAgain = true;
        return;
      }

      if (window.ambientlight) {
        observer.disconnect();
        return;
      }

      initializing = true;
      try {
        if (await tryInitAmbientlight()) {
          // Initialized
          observer.disconnect();
        } else {
          while (tryAgain && !window.ambientlight) {
            tryAgain = false;
            if (await tryInitAmbientlight()) {
              // Initialized
              observer.disconnect();
              tryAgain = false;
            }
          }
          initializing = false;
        }
      } catch (ex) {
        // Disconnect to prevent infinite loops
        observer.disconnect();
        throw ex;
      }
    }, true)
  );
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
};

const onLoad = wrapErrorHandler(async function onLoadCallback() {
  if (window.ambientlight !== undefined) return;

  window.ambientlight = false;
  await loadAmbientlight();
});

(function setup() {
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onLoad, { once: true });
    } else {
      onLoad();
    }
  } catch (ex) {
    ErrorReporter.captureException(ex);
  }
})();
