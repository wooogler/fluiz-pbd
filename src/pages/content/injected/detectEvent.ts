import eventInfoStorage from '@root/src/shared/storages/eventInfoStorage';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';

refreshOnUpdate('pages/content/injected/detectElement');

export function getElementUniqueId(element: HTMLElement): string {
  const representativeAttrs = [
    'id',
    'class',
    'name',
    'role',
    'type',
    'aria-label',
    'href',
    'src',
    'style',
  ];
  const uniqueAttrs: string[] = [];
  uniqueAttrs.push(element.tagName.toLowerCase());
  if (element.textContent) {
    uniqueAttrs.push(element.textContent.trim().slice(0, 20));
  }
  for (const attr of representativeAttrs) {
    let attrValue = element.getAttribute(attr);
    if (attrValue) {
      if (attrValue.length > 20) {
        attrValue = attrValue.slice(0, 15);
      }
      uniqueAttrs.push(`${attr}=${attrValue}`);
    }
  }
  return uniqueAttrs.join(',');
}

function detectClickEvent(event: MouseEvent) {
  const targetElement = event.target as HTMLElement;
  console.log(targetElement, 'targetElement');
  const isClickable =
    window.getComputedStyle(targetElement).cursor === 'pointer' ||
    targetElement.hasAttribute('tabindex');
  console.log('isClickable', isClickable);

  if (isClickable) {
    const uniqueElementId = getElementUniqueId(targetElement);
    const currentPageUrl = document.location.href;

    chrome.runtime.sendMessage({ action: 'getContextId' }, response => {
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
  }
}

function attachClickEventListeners() {
  document.body.addEventListener('click', detectClickEvent, true);
}

function detachClickEventListeners() {
  document.body.removeEventListener('click', detectClickEvent, true);
}

let currentFocusedInput: HTMLInputElement | HTMLTextAreaElement | null = null;

function detectInputEvent(event) {
  const targetElement = event.target as HTMLInputElement | HTMLTextAreaElement;
  targetElement.dataset.valueChanged = 'true';
}

function detectFocusInputEvent(event) {
  const targetElement = event.target as HTMLInputElement | HTMLTextAreaElement;
  targetElement.dataset.initialValue = targetElement.value;
  targetElement.addEventListener('input', detectInputEvent, { once: true });
}

function detectBlurInputEvent(event) {
  const targetElement = event.target as HTMLInputElement | HTMLTextAreaElement;
  const valueChanged = event.target.dataset.valueChanged === 'true';

  if (valueChanged) {
    saveInputValue(targetElement);
  }
  targetElement.removeEventListener('input', detectInputEvent);
  delete targetElement.dataset.valueChanged;
  delete targetElement.dataset.initialValue;
}

function detectPageTransition() {
  if (currentFocusedInput) {
    saveInputValue(currentFocusedInput);
    currentFocusedInput = null;
  }
}

function saveInputValue(targetElement: HTMLInputElement | HTMLTextAreaElement) {
  const currentPageUrl = document.location.href;
  const uniqueElementId = getElementUniqueId(targetElement);
  const initialValue = targetElement.dataset.initialValue;
  const finalValue = targetElement.value;

  if (initialValue !== finalValue) {
    chrome.runtime.sendMessage({ action: 'getContextId' }, response => {
      if (response) {
        const { tabId, windowId } = response;
        eventInfoStorage.addEvent({
          type: 'input',
          targetId: uniqueElementId,
          url: currentPageUrl,
          tabId,
          windowId,
          inputValue: finalValue,
        });
      }
    });
  }
}

function attachInputEventListeners() {
  document.querySelectorAll('input, textarea').forEach(inputElement => {
    inputElement.addEventListener('focus', detectFocusInputEvent);
    inputElement.addEventListener('blur', detectBlurInputEvent);
  });
  window.addEventListener('beforeunload', detectPageTransition);
  window.addEventListener('popstate', detectPageTransition);
}

function detachInputEventListeners() {
  document.querySelectorAll('input, textarea').forEach(inputElement => {
    inputElement.removeEventListener('focus', detectFocusInputEvent);
    inputElement.removeEventListener('blur', detectBlurInputEvent);
    inputElement.removeEventListener('input', detectInputEvent);
  });
  window.removeEventListener('beforeunload', detectPageTransition);
  window.removeEventListener('popstate', detectPageTransition);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'activateEventTracking') {
    attachClickEventListeners();
    attachInputEventListeners();
  } else if (message.action === 'deactivateEventTracking') {
    detachClickEventListeners();
    detachInputEventListeners();
  }
});
