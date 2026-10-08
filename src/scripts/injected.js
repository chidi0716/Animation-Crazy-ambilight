import { setErrorHandler } from './libs/generic';
import { contentScript } from './libs/messaging/content';

let reporting = false; // Prevent infinite loops
setErrorHandler((ex) => {
  if (reporting) return;

  try {
    reporting = true;
    contentScript.postMessage('error', {
      name: ex.name,
      message: ex.message,
      stack: ex.stack,
      details: ex.details,
    });
  } catch (reportEx) {
    console.warn('Failed to report error:', ex, 'innerError:', reportEx);
  } finally {
    reporting = false;
  }
});

const getElem = (() => {
  const elems = {};
  return (name) => {
    if (!elems[name]?.isConnected) {
      if (elems[name] && !elems[name].isConnected) {
        elems[name].dataset.ytalElem = name;
      }
      elems[name] = document.querySelector(`[data-ytal-elem="${name}"]`);
      if (elems[name]) {
        delete elems[name].dataset.ytalElem;
      }
    }
    return elems[name];
  };
})();

// ani.gamer.com.tw styles the page with the light theme by default and with the dark theme when
// the html element has the data-theme="dark" attribute. Only the attribute is changed, because the
// dark mode switch in the menu of the page would also save the theme as the preference of the user.
function updateTheme(toDark) {
  const theme = toDark ? 'dark' : 'light';
  if (document.documentElement.getAttribute('data-theme') === theme) return;

  document.documentElement.setAttribute('data-theme', theme);
}

contentScript.addMessageListener(
  'update-theme',
  function onUpdateTheme(toDark) {
    updateTheme(toDark);
    contentScript.postMessage('update-theme');
  }
);

const updateImmersiveMode = function updateImmersiveMode(enable) {
  document.documentElement.toggleAttribute(
    'data-ambientlight-immersive',
    enable
  );
};

contentScript.addMessageListener(
  'update-immersive-mode',
  function onUpdateImmersiveMode(enable) {
    updateImmersiveMode(enable);
    contentScript.postMessage('update-immersive-mode');
  }
);

// Only used by browsers that do not support VideoFrame.colorSpace
contentScript.addMessageListener('is-hdr-video', function isHdrVideo() {
  contentScript.postMessage('is-hdr-video', false);
});

contentScript.addMessageListener(
  'video-player-set-size',
  function onVideoPlayerSetSize() {
    contentScript.postMessage('sizes-changed');
    contentScript.postMessage('video-player-set-size');
  }
);

contentScript.addMessageListener(
  'show',
  function show({ toDark, hideScrollbar, immersiveMode }) {
    const html = document.documentElement;
    if (hideScrollbar)
      html.toggleAttribute('data-ambientlight-hide-scrollbar', true);
    if (immersiveMode) updateImmersiveMode(true);

    updateTheme(toDark);

    html.toggleAttribute('data-ambientlight-enabled', true);

    contentScript.postMessage('sizes-changed');
    contentScript.postMessage('show');
  }
);

contentScript.addMessageListener('hide', function hide({ toDark }) {
  const html = document.documentElement;
  html.toggleAttribute('data-ambientlight-enabled', false);
  html.toggleAttribute('data-ambientlight-hide-scrollbar', false);

  updateImmersiveMode(false);

  updateTheme(toDark);

  contentScript.postMessage('sizes-changed');
  contentScript.postMessage('hide');
});

let videoObserver;
let videoObserverElem;
contentScript.addMessageListener(
  'apply-chromium-bug-1142112-workaround',
  function applyChromiumBug1142112Workaround() {
    try {
      const videoElem = getElem('video');
      if (videoObserverElem === videoElem) return;

      if (videoObserver) {
        videoObserver.disconnect();
        videoObserver = undefined;
      }
      videoObserverElem = videoElem;
      if (!videoElem || videoElem.ambientlightGetVideoPlaybackQuality) return;

      let videoIsHidden = false; // IntersectionObserver is always executed at least once when the observation starts
      let videoVisibilityChangeTime;
      videoObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (videoObserverElem !== entry.target) continue;
            videoIsHidden = entry.intersectionRatio === 0;
            videoVisibilityChangeTime = performance.now();
          }
        },
        {
          rootMargin: '-105px 0px 0px 0px', // header height (100px) + additional pixels to be safe
          threshold: 0.0001, // Because sometimes a pixel in not visible on screen but the intersectionRatio is already 0
        }
      );
      videoObserver.observe(videoElem);

      Object.defineProperty(videoElem, 'ambientlightGetVideoPlaybackQuality', {
        value: videoElem.getVideoPlaybackQuality,
      });

      let previousDroppedVideoFrames = 0;
      let droppedVideoFramesCorrection = 0;
      let previousTime = performance.now();

      videoElem.getVideoPlaybackQuality = function () {
        // Use scoped properties instead of this from here on
        const original = videoElem.ambientlightGetVideoPlaybackQuality();
        let droppedVideoFrames = original.droppedVideoFrames;
        if (droppedVideoFrames < previousDroppedVideoFrames) {
          previousDroppedVideoFrames = 0;
          droppedVideoFramesCorrection = 0;
        }
        // Ignore dropped frames for 2 seconds due to requestVideoFrameCallback dropping frames when the video is offscreen
        if (videoIsHidden || videoVisibilityChangeTime > previousTime - 2000) {
          droppedVideoFramesCorrection +=
            droppedVideoFrames - previousDroppedVideoFrames;
        }
        previousDroppedVideoFrames = droppedVideoFrames;
        droppedVideoFrames = Math.max(
          0,
          droppedVideoFrames - droppedVideoFramesCorrection
        );
        previousTime = performance.now();
        return {
          corruptedVideoFrames: original.corruptedVideoFrames,
          creationTime: original.creationTime,
          droppedVideoFrames,
          totalVideoFrames: original.totalVideoFrames,
        };
      };
    } catch (ex) {
      console.warn(
        'Failed to apply getVideoPlaybackQuality workaround. Continuing ambientlight initialization...'
      );
      throw ex;
    }
  }.bind(this)
);
