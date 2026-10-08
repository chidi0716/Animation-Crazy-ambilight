import { isWatchPageUrl, wrapErrorHandler } from './generic';
import { injectedScript } from './messaging/injected';
import ErrorReporter from './errors/reporter';
import { storage } from './storage';

const THEME_LIGHT = -1;
const THEME_DEFAULT = 0;
const THEME_DARK = 1;

// ani.gamer.com.tw switches between the light and dark theme with the data-theme attribute
// on the html element: <html data-theme="light|dark">
// The ambient light only changes the attribute and not the dark mode switch in the menu of the page,
// so that the theme that has been selected on ani.gamer.com.tw (ANIME_dark_theme) is not changed.
export default class Theming {
  constructor(ambientlight) {
    this.ambientlight = ambientlight;
    this.settings = ambientlight.settings;
  }

  initListeners() {
    // The theme that has been selected on ani.gamer.com.tw
    this.siteTheme = this.isDarkTheme() ? THEME_DARK : THEME_LIGHT;

    try {
      matchMedia('(prefers-color-scheme: dark)').addEventListener(
        'change',
        wrapErrorHandler(() => {
          // Give the page the time to apply the system theme first
          setTimeout(() => this.handleSiteThemeChange(), 100);
        }, true)
      );
    } catch (ex) {
      ErrorReporter.captureException(ex);
    }

    let themeCorrections = 0;
    this.themeObserver = new MutationObserver(
      wrapErrorHandler(
        function themeMutation() {
          if (this.updatingTheme) return;
          if (!this.isForcingTheme()) {
            this.handleSiteThemeChange();
            return;
          }
          if (!this.shouldToggleTheme()) return;

          // The page has changed the theme back. Correct it a few times to prevent an infinite loop
          themeCorrections++;
          this.updateTheme();
          if (themeCorrections === 5) this.themeObserver.disconnect();
        }.bind(this),
        true
      )
    );
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  handleSiteThemeChange = () => {
    if (this.isForcingTheme()) return;

    this.siteTheme = this.isDarkTheme() ? THEME_DARK : THEME_LIGHT;
  };

  // Whether the ambient light has changed the theme of the page to the theme setting
  isForcingTheme = () =>
    this.settings.enabled &&
    !this.ambientlight.isHidden &&
    this.settings.theme !== THEME_DEFAULT;

  isDarkTheme = () =>
    document.documentElement.getAttribute('data-theme') === 'dark';

  shouldBeDarkTheme = (enabledAndVisible) => {
    const disabled =
      enabledAndVisible === undefined
        ? !this.settings.enabled || this.ambientlight.isHidden
        : !enabledAndVisible;
    const toTheme =
      disabled || this.settings.theme === THEME_DEFAULT
        ? this.siteTheme
        : this.settings.theme;
    return toTheme === THEME_DARK;
  };

  shouldToggleTheme = () => {
    const toDark = this.shouldBeDarkTheme();
    return !(this.isDarkTheme() === toDark || (toDark && !isWatchPageUrl()));
  };

  updateTheme = wrapErrorHandler(
    async function updateTheme(fromSettings = false) {
      if (
        this.updatingTheme ||
        (!fromSettings && this.settings.theme === THEME_DEFAULT) ||
        !this.shouldToggleTheme()
      )
        return;

      this.updatingTheme = true;

      if (this.themeToggleFailed !== false) {
        const lastFailedThemeToggle = await new Promise(
          // eslint-disable-next-line no-async-promise-executor
          async (resolve, reject) => {
            try {
              let timeout = setTimeout(() => {
                timeout = undefined;
                resolve();
              }, 5000);
              const result = await storage.get('last-failed-theme-toggle');
              if (!timeout) return;

              clearTimeout(timeout);
              resolve(result);
            } catch (ex) {
              reject(ex);
            }
          }
        );

        if (lastFailedThemeToggle) {
          const now = new Date().getTime();
          const withinThresshold = now - 10000 < lastFailedThemeToggle;
          if (withinThresshold) {
            this.settings.setWarning(
              `上一次切換主題失敗。為了避免頁面不斷重新整理，自動切換成${
                this.isDarkTheme() ? '淺色' : '深色'
              }外觀的功能暫停 10 秒。\n\n如果一直失敗，可以把「外觀（主題）」設為「跟隨動畫瘋」來永久停用自動切換。`
            );
            this.updatingTheme = false;
            return;
          }
          storage.set('last-failed-theme-toggle', undefined);
        }
        if (this.themeToggleFailed) {
          this.settings.setWarning('');
          this.themeToggleFailed = false;
        }

        if (!this.shouldToggleTheme()) {
          this.updatingTheme = false;
          return;
        }
      }

      await this.toggleDarkTheme();
      this.updatingTheme = false;
    }.bind(this),
    true
  );

  async updateDocumentTheme(toDark) {
    await injectedScript.postAndReceiveMessage('update-theme', toDark);
  }

  async toggleDarkTheme() {
    const wasDark = this.isDarkTheme();
    await this.updateDocumentTheme(!wasDark);

    const isDark = this.isDarkTheme();
    if (wasDark !== isDark) return;

    this.themeToggleFailed = true;
    await storage.set('last-failed-theme-toggle', new Date().getTime());
    this.settings.setWarning(
      `無法把頁面主題從${wasDark ? '深色' : '淺色'}切換成${
        wasDark ? '淺色' : '深色'
      }。\n\n如果一直失敗，可以把「外觀（主題）」設為「跟隨動畫瘋」來永久停用自動切換。`
    );
  }
}
