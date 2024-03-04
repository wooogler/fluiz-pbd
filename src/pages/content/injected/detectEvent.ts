import eventInfoStorage from '@root/src/shared/storages/eventInfoStorage';
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
    'src',
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

function handleClickEvent(event: MouseEvent) {
  const targetElement = event.target as HTMLElement;
  const uniqueElementId = getElementUniqueId(targetElement);
  const currentPageUrl = document.location.href;

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
}

function attachClickEventListners() {
  document.querySelectorAll('a').forEach(anchorElement => {
    anchorElement.addEventListener('click', handleClickEvent);
  });
  document.querySelectorAll('button').forEach(buttonElement => {
    buttonElement.addEventListener('click', handleClickEvent);
  });
}

function detachClickEventListners() {
  document.querySelectorAll('a').forEach(anchorElement => {
    anchorElement.removeEventListener('click', handleClickEvent);
  });
  document.querySelectorAll('button').forEach(buttonElement => {
    buttonElement.removeEventListener('click', handleClickEvent);
  });
}

let currentFocusedInput: HTMLInputElement | HTMLTextAreaElement | null = null;

function handleInputEvent(event) {
  const targetElement = event.target as HTMLInputElement | HTMLTextAreaElement;
  targetElement.dataset.valueChanged = 'true';
}

function handleFocusInputEvent(event) {
  const targetElement = event.target as HTMLInputElement | HTMLTextAreaElement;
  targetElement.dataset.initialValue = targetElement.value;
  targetElement.addEventListener('input', handleInputEvent, { once: true });
}

function handleBlurInputEvent(event) {
  const targetElement = event.target as HTMLInputElement | HTMLTextAreaElement;
  const valueChanged = event.target.dataset.valueChanged === 'true';

  if (valueChanged) {
    saveInputValue(targetElement);
  }
  targetElement.removeEventListener('input', handleInputEvent);
  delete targetElement.dataset.valueChanged;
  delete targetElement.dataset.initialValue;
}

function handlePageTransition() {
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
    inputElement.addEventListener('focus', handleFocusInputEvent);
    inputElement.addEventListener('blur', handleBlurInputEvent);
  });
  window.addEventListener('beforeunload', handlePageTransition);
  window.addEventListener('popstate', handlePageTransition);
}

function detachInputEventListeners() {
  document.querySelectorAll('input, textarea').forEach(inputElement => {
    inputElement.removeEventListener('focus', handleFocusInputEvent);
    inputElement.removeEventListener('blur', handleBlurInputEvent);
    inputElement.removeEventListener('input', handleInputEvent);
  });
  window.removeEventListener('beforeunload', handlePageTransition);
  window.removeEventListener('popstate', handlePageTransition);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'activateEventTracking') {
    attachClickEventListners();
    attachInputEventListeners();
  } else if (message.action === 'deactivateEventTracking') {
    detachClickEventListners();
    detachInputEventListeners();
  }
});
