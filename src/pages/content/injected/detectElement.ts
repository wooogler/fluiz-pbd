import eventInfoStorage from '@root/src/shared/storages/eventInfoStorage';
import modeStorage from '@root/src/shared/storages/modeStorage';
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

const handleClickEvent = (event: MouseEvent) => {
  const targetElement = event.target as HTMLElement;
  const uniqueElementId = getElementUniqueId(targetElement);
  const currentPageUrl = document.location.href;
  if (uniqueElementId) {
    eventInfoStorage.addEvent({
      type: 'click',
      targetId: uniqueElementId,
      url: currentPageUrl,
    });
  }
};

// document.addEventListener('click', handleClickEvent);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'activateEventTracking') {
    document.addEventListener('click', handleClickEvent);
    console.log('Event tracking activated');
  } else if (message.action === 'deactivateEventTracking') {
    document.removeEventListener('click', handleClickEvent);
    console.log('Event tracking deactivated');
  }
});
