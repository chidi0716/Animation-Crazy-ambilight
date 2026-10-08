const getNodeSelector = (elem) => {
  if (!elem.tagName) return elem.nodeName; // Document

  const idSelector = elem.id ? `#${elem.id}` : '';
  const classSelector = elem.classList?.length
    ? `.${Array.from(elem.classList).sort().join('.')}`
    : '';
  return `${elem.tagName.toLowerCase()}${idSelector}${classSelector}`;
};

const getNodeTree = (elem) => {
  if (!elem) return [];

  const tree = [];
  tree.push(elem);
  while (elem.parentNode && elem.parentNode.tagName) {
    tree.unshift(elem.parentNode);
    elem = elem.parentNode;
  }
  return tree;
};

export const getNodeTreeString = (elem) =>
  getNodeTree(elem)
    .map((node, i) => `${' '.repeat(i)}${getNodeSelector(node)}`)
    .join('\n');

export const getPageElems = () => {
  const allSelector =
    'html, body, .BH_background, .container-player, .player, .videoframe, .video, #video-container, .video-js, video';

  return {
    counts: allSelector.split(',').reduce((counts, selector) => {
      selector = selector.trim();
      counts[selector] = document.querySelectorAll(selector).length;
      return counts;
    }, {}),
  };
};
