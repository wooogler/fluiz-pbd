import eventInfoStorage from '@root/src/shared/storages/eventInfoStorage';
import modeStorage from '@root/src/shared/storages/modeStorage';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';

refreshOnUpdate('pages/content/injected/detectElement');

function getElementUniqueId(element: HTMLElement): string {
  const representativeAttrs = [
    'id',
    'class',
    'name',
    'role',
    'type',
    'aria-label',
    'href',
  ];
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

  console.log('Clicked element: ', uniqueElementId);

  chrome.runtime.sendMessage({ action: 'getContextId' }, response => {
    console.log(response);
    if (response) {
      const { tabId, windowId } = response;
      if (uniqueElementId) {
        eventInfoStorage.addEvent({
          type: 'click',
          targetId: uniqueElementId,
          url: currentPageUrl,
          tabId,
          windowId,
        });
      }
    }
  });
};

const createRecordingBorder = () => {
  const borderDiv = document.createElement('div');
  borderDiv.setAttribute('id', 'recording-border');
  borderDiv.style.position = 'fixed';
  borderDiv.style.top = '0';
  borderDiv.style.left = '0';
  borderDiv.style.width = '100vw';
  borderDiv.style.height = '100vh';
  borderDiv.style.pointerEvents = 'none';
  borderDiv.style.border = '5px solid red';
  borderDiv.style.zIndex = '9999';
  borderDiv.style.boxSizing = 'border-box';
  return borderDiv;
};

const toggleRecordingBorder = (add: boolean) => {
  const existingBorder = document.getElementById('recording-border');
  if (add) {
    if (!existingBorder) {
      const borderDiv = createRecordingBorder();
      document.body.appendChild(borderDiv);
    }
  } else {
    if (existingBorder) {
      document.body.removeChild(existingBorder);
    }
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'activateEventTracking') {
    toggleRecordingBorder(true);
    document.addEventListener('click', handleClickEvent);
    console.log('Event tracking activated');
    sendResponse({ status: 'Event tracking activated' });
  } else if (message.action === 'deactivateEventTracking') {
    toggleRecordingBorder(false);
    document.removeEventListener('click', handleClickEvent);
    console.log('Event tracking deactivated');
    sendResponse({ status: 'Event tracking deactivated' });
  }
});
