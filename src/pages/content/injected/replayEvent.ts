import { EventInfo } from '@root/src/shared/storages/eventInfoStorage';
import { getElementUniqueId } from './detectEvent';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';

refreshOnUpdate('pages/content/injected/replayEvent');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'replayEvent') {
    const event = message.event as EventInfo;
    if (event.type === 'click') {
      console.log(event.targetId.split(',')[0]);
      const elements = document.querySelectorAll(event.targetId.split(',')[0]);
      let elementFound = false;
      elements.forEach(element => {
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
      });
      if (!elementFound) {
        console.log('Element not found', event.targetId);
      }
    }
  }
});
