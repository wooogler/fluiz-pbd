import eventInfoStorage from '@root/src/shared/storages/eventInfoStorage';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { finder } from '@medv/finder';

refreshOnUpdate('pages/content/injected/detectElement');

// function getElementXPath(element: HTMLElement): string {
//   // 해당 요소의 상대적인 XPath를 구하는 함수
//   const getXPath = (elm: HTMLElement): string | null => {
//     if (elm.id !== '') return `id("${elm.id}")`;
//     if (elm === document.body) return elm.tagName;

//     let idx = 1;
//     for (
//       let sib = elm.previousElementSibling;
//       sib;
//       sib = sib.previousElementSibling
//     ) {
//       if (sib.tagName === elm.tagName) idx++;
//     }

//     return `${getXPath(elm.parentElement as HTMLElement)}/${elm.tagName}[${idx}]`;
//   };

//   return getXPath(element);
// }

// export function getElementUniqueId(element: HTMLElement): string {
//   const representativeAttrs = [
//     'id',
//     'class',
//     'type',
//     'name',
//     'role',
//     'type',
//     'aria-label',
//     'href',
//     'src',
//   ];
//   const uniqueAttrs: string[] = [];
//   uniqueAttrs.push(element.tagName.toLowerCase());
//   if (element.textContent) {
//     uniqueAttrs.push(element.textContent.trim().slice(0, 20));
//   }
//   let classValue: string | null = null;
//   for (const attr of representativeAttrs) {
//     let attrValue = element.getAttribute(attr);
//     if (attrValue) {
//       if (!['id', 'class', 'name'].includes(attr) && attrValue.length > 15) {
//         attrValue = attrValue.slice(0, 15);
//       }
//       uniqueAttrs.push(`${attr}=${attrValue}`);
//       if (attr === 'class') {
//         classValue = attrValue;
//       }
//     }
//   }

//   if (classValue && classValue.startsWith('kpd-')) {
//     const relativeXPath = getElementXPath(element);
//     uniqueAttrs.push(`xpath=${relativeXPath}`);
//   }
//   return uniqueAttrs.join(',');
// }

export function getElementUniqueId(element: HTMLElement) {
  if (element.id) {
    return `id=${element.id}`;
  }

  if (element.getAttribute('name')) {
    return `name=${element.getAttribute('name')}`;
  }

  if (
    element.tagName.toLowerCase() === 'a' &&
    element.textContent.trim().length > 0
  ) {
    return `linkText=${element.textContent.trim()}`;
  }

  const cssSelector = finder(element);
  return `css=${cssSelector}`;
}

function detectClickEvent(event: MouseEvent) {
  const targetElement = event.target as HTMLElement;
  // console.log(targetElement, 'targetElement');
  const isClickable =
    window.getComputedStyle(targetElement).cursor === 'pointer' ||
    targetElement.hasAttribute('tabindex');

  const isInputable =
    window.getComputedStyle(targetElement).cursor === 'text' ||
    (targetElement.tagName.toLowerCase() === 'input' &&
      targetElement.getAttribute('type') !== 'button');

  const isClickCert = targetElement.className.includes('kpd-');
  // const isClickCert = false;

  if ((isClickable || isInputable) && !isClickCert) {
    const isInputCert =
      targetElement.id ===
      'certselect_tek_input1_xwup_certselect_tek_form_toggle_';

    const uniqueElementId = getElementUniqueId(targetElement);
    const currentPageUrl = document.location.href;

    chrome.runtime.sendMessage({ action: 'getContextId' }, async response => {
      if (response) {
        const { tabId, windowId } = response;
        if (uniqueElementId) {
          const lastEvent = (await eventInfoStorage.get()).slice(-1)[0];
          if (
            lastEvent.type !== 'input' ||
            lastEvent.targetId !== uniqueElementId
          )
            eventInfoStorage.addEvent({
              type: isInputCert
                ? 'input-cert'
                : isInputable
                  ? 'input'
                  : 'click',
              targetId: uniqueElementId,
              url: currentPageUrl,
              tabId,
              windowId,
              replayed: false,
            });
        }
      }
    });
  }
}

function detectSelectEvent(event: Event) {
  const targetElement = event.target as HTMLSelectElement;
  if (targetElement.tagName.toLowerCase() === 'select') {
    const selectedOptionText =
      targetElement.options[targetElement.selectedIndex].text;
    const uniqueElementId = getElementUniqueId(targetElement);
    const currentPageUrl = document.location.href;

    chrome.runtime.sendMessage({ action: 'getContextId' }, response => {
      if (response) {
        const { tabId, windowId } = response;
        eventInfoStorage.addEvent({
          type: 'select-option',
          targetId: uniqueElementId,
          url: currentPageUrl,
          tabId,
          windowId,
          replayed: false,
          inputValue: selectedOptionText,
        });
      }
    });
  }
}

function attachEventListeners() {
  document.body.addEventListener('click', detectClickEvent, true);
  document.body.addEventListener('mouseup', detectTextSelection, true);
  document.body.addEventListener('keydown', detectEnterPress, true);
  document.body.addEventListener('change', detectSelectEvent, true);
}

function detachEventListeners() {
  document.body.removeEventListener('click', detectClickEvent, true);
  document.body.removeEventListener('mouseup', detectTextSelection, true);
  document.body.removeEventListener('keydown', detectEnterPress, true);
  document.body.removeEventListener('change', detectSelectEvent, true);
}

function findDeepestNode(
  node: Node,
  char: string,
  isLastChar: boolean = false,
) {
  if (!node) return null;
  let foundNode: Node | null = null;
  if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(char)) {
    return node;
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    for (const child of node.childNodes) {
      const result = findDeepestNode(child, char, isLastChar);
      if (result) {
        foundNode = result;
        if (!isLastChar || (isLastChar && child.contains(foundNode))) {
          break;
        }
      }
    }
  }
  return foundNode;
}

function findCommonAncestor(nodeA: Node, nodeB: Node) {
  const pathA = [];
  let currentA = nodeA;
  while (currentA) {
    pathA.push(currentA);
    currentA = currentA.parentNode;
  }
  let currentB = nodeB;
  while (currentB) {
    if (pathA.includes(currentB)) {
      return currentB;
    }
    currentB = currentB.parentNode;
  }

  return null;
}

function detectTextSelection(event: MouseEvent) {
  const selection = window.getSelection();
  if (
    selection &&
    selection.rangeCount > 0 &&
    selection.toString().length > 0
  ) {
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    const firstChar = selectedText.charAt(0);
    const lastChar = selectedText.charAt(selectedText.length - 1);

    const commonAncestor = range.commonAncestorContainer;

    const startNode = findDeepestNode(commonAncestor, firstChar);
    const endNode = findDeepestNode(commonAncestor, lastChar, true);

    if (startNode && endNode) {
      const startElement =
        startNode.nodeType === Node.TEXT_NODE
          ? startNode.parentElement
          : startNode;
      const endElement =
        endNode.nodeType === Node.TEXT_NODE ? endNode.parentElement : endNode;

      const deepestCommonAncestor = findCommonAncestor(
        startElement,
        endElement,
      );

      if (deepestCommonAncestor) {
        const currentPageUrl = document.location.href;
        chrome.runtime.sendMessage({ action: 'getContextId' }, response => {
          if (response) {
            const { tabId, windowId } = response;
            eventInfoStorage.addEvent({
              type: 'extract',
              targetId: getElementUniqueId(
                deepestCommonAncestor as HTMLElement,
              ),
              url: currentPageUrl,
              tabId,
              windowId,
              inputValue: selectedText,
              replayed: false,
            });
          }
        });
      }
    }
  }
}

function detectEnterPress(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    const targetElement = event.target as HTMLElement;
    const uniqueElementId = getElementUniqueId(targetElement);
    const currentPageUrl = document.location.href;

    chrome.runtime.sendMessage({ action: 'getContextId' }, response => {
      if (response) {
        const { tabId, windowId } = response;
        eventInfoStorage.addEvent({
          type: 'enter-press',
          targetId: uniqueElementId,
          url: currentPageUrl,
          tabId,
          windowId,
          replayed: false,
        });
      }
    });
  }
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
          replayed: false,
        });
      }
    });
  }
}

// 이미 focus되어 있는 경우 currentFocusedInput에 저장
// (() => {
//   attachInputEventListeners();

//   const focusedElement = document.activeElement as
//     | HTMLInputElement
//     | HTMLTextAreaElement;
//   if (
//     focusedElement.tagName === 'INPUT' ||
//     focusedElement.tagName === 'TEXTAREA'
//   ) {
//     console.log(focusedElement);
//     detectFocusInputEvent({ target: focusedElement });
//     currentFocusedInput = focusedElement;
//   }
// })();

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
    attachEventListeners();
  } else if (message.action === 'deactivateEventTracking') {
    detachEventListeners();
  }
});
