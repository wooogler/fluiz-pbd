import eventInfoStorage, {
  EventInfo,
} from '@root/src/shared/storages/eventInfoStorage';
import { getElementUniqueId } from './detectEvent';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import documentInfoStorage from '@root/src/shared/storages/documentInfoStorage';

refreshOnUpdate('pages/content/injected/replayEvent');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'replayEvent') {
    const event = message.event;

    console.log('Replaying event: ', event);

    (async () => {
      // 즉시 실행 함수로 비동기 로직을 감싸기
      try {
        const data = await documentInfoStorage.get();

        if (event.type === 'click') {
          await replayClickEvent(event);
        } else if (event.type === 'input') {
          await replayInputEvent(event, data);
        }

        eventInfoStorage.replayedEvent(event.uid);
        sendResponse({ success: true }); // 비동기 작업이 성공적으로 끝난 후 응답 보내기
      } catch (error) {
        console.error(error);
        sendResponse({ success: false, error: error.toString() }); // 에러 발생 시 응답 보내기
      }
    })();

    return true; // 비동기 응답을 처리하기 위해 true 반환
  }
});

async function replayClickEvent(event: EventInfo) {
  const elements = document.querySelectorAll(event.targetId.split(',')[0]);
  let elementFound = false;
  for (const element of elements) {
    const uniqueId = getElementUniqueId(element as HTMLElement);
    if (uniqueId === event.targetId) {
      console.log('target element: ', element);
      element.setAttribute('data-unique-id', uniqueId);
      const clickCode = `(function() {
        const elements = document.querySelectorAll('[data-unique-id="${uniqueId}"]');
        elements.forEach(el => {
          el.click();
          el.removeAttribute('data-unique-id'); // Remove the attribute after clicking
        });
      })();`;
      document.documentElement.setAttribute('onreset', clickCode);
      document.documentElement.dispatchEvent(new CustomEvent('reset'));
      document.documentElement.removeAttribute('onreset');

      elementFound = true;
    }
  }
  if (!elementFound) {
    console.log('Element not found', event.targetId);
  }
}

async function replayInputEvent(
  event: EventInfo,
  data: Record<string, string>,
) {
  console.log(data);
  const elements = document.querySelectorAll(event.targetId.split(',')[0]);
  for (const element of elements) {
    const uniqueId = getElementUniqueId(element as HTMLElement);
    if (uniqueId === event.targetId) {
      let inputValue = event.inputValue;
      const pattern = /\{(\w+)\}/g;
      const matches = inputValue.match(pattern);

      if (matches) {
        matches.forEach(match => {
          const key = match.replace(/\{|\}/g, '');
          if (data[key] !== undefined) {
            inputValue = inputValue.replace(match, data[key]);
          }
        });
      }

      await simulateKeyInput(
        element as HTMLInputElement | HTMLTextAreaElement,
        inputValue,
      );
      break;
    }
  }
}

async function simulateKeyInput(element, value) {
  for (let i = 0; i < value.length; i++) {
    const char = value.charAt(i);
    // Create and dispatch the key events
    ['keydown', 'keypress', 'keyup'].forEach(type => {
      const event = new KeyboardEvent(type, {
        key: char,
        code: `Key${char.toUpperCase()}`,
        bubbles: true,
      });
      element.dispatchEvent(event);
    });
    // Update the element's value directly
    element.value += char;
    // Wait for a random delay to simulate typing speed variability
    await new Promise(resolve => setTimeout(resolve, 600 * Math.random() + 50));
  }
}
