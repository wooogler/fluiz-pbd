import { EventInfo } from '@root/src/shared/storages/eventInfoStorage';
import { getElementUniqueId } from './detectEvent';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';

refreshOnUpdate('pages/content/injected/replayEvent');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('message', message);

  if (message.action === 'replayEvent') {
    const event = message.event as EventInfo;
    if (event.type === 'click') {
      const elements = document.querySelectorAll(event.targetId.split(',')[0]);
      elements.forEach(element => {
        const uniqueId = getElementUniqueId(element as HTMLElement);
        if (uniqueId === event.targetId) {
          console.log(uniqueId);
          (element as HTMLElement).click();
        }
      });
    }
  }
});
