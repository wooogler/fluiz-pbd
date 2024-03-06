import { EventInfo } from '@root/src/shared/storages/eventInfoStorage';
import { getElementUniqueId } from './detectEvent';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import documentInfoStorage from '@root/src/shared/storages/documentInfoStorage';

refreshOnUpdate('pages/content/injected/replayEvent');

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'replayEvent') {
    const event = message.event as EventInfo;
    const data = await documentInfoStorage.get();
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
    } else if (event.type === 'input') {
      const elements = document.querySelectorAll(event.targetId.split(',')[0]);
      console.log(data);

      elements.forEach(element => {
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

        const uniqueId = getElementUniqueId(element as HTMLElement);
        if (uniqueId === event.targetId) {
          (element as HTMLInputElement).value = inputValue;
        }
      });
    }
  }
});
