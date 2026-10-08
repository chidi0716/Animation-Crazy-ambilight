export const origin = 'https://ani.gamer.com.tw';
export const extensionId = 'ani-gamer-ambient-light-extension';

export const isSameWindowMessage = (event) =>
  event.source === window && event.origin === origin;
