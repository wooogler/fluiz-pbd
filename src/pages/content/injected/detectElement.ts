import elementInfoStorage from '@root/src/shared/storages/elementInfoStorage';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';

refreshOnUpdate('pages/content/injected/detectElement');

function getElementUniqueId(element: HTMLElement): string {
  const representativeAttrs = ['id', 'class', 'name', 'role', 'type', 'aria-label', 'href'];
  const uniqueAttrs: string[] = [];
  if (element.textContent) {
    uniqueAttrs.push(element.textContent.trim().slice(0, 20));
  }
  uniqueAttrs.push(element.tagName.toLowerCase());
  for (const attr of representativeAttrs) {
    const attrValue = element.getAttribute(attr);
    if (attrValue) {
      uniqueAttrs.push(`${attr}=${attrValue}`);
    }
  }
  return uniqueAttrs.join(',');
}

document.addEventListener('mouseover', event => {
  const targetElement = event.target as HTMLElement;
  const uniqueElementId = getElementUniqueId(targetElement);
  if (uniqueElementId) {
    elementInfoStorage.update(uniqueElementId);
  }
});
