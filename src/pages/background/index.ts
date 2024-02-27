import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

console.log('background loaded');

chrome.action.onClicked.addListener(tab => {
  chrome.windows.create({
    url: 'src/pages/popup/index.html',
    type: 'popup',
    width: 600,
    height: 600,
  });
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['src/pages/contentInjected/index.js'],
      });
      console.log('script executed');
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'activateEventTracking' || message.action === 'deactivateEventTracking') {
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, message, response => {
          console.log('Message sent to tab: ' + tab.id);
        });
      });
    });
  }
});

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'activateEventTracking' || request.action === 'deactivateEventTracking') {
//     chrome.tabs.query({}, tabs => {
//       tabs.forEach(tab => {
//         chrome.scripting.executeScript({
//           target: { tabId: tab.id, allFrames: true },
//           files: ['src/pages/contentInjected/index.js'],
//         });
//         console.log('script executed');
//       });
//     });
//   }
// });
