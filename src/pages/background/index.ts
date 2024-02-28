import modeStorage from '@root/src/shared/storages/modeStorage';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

console.log('background loaded');

let popupWindowId: number | null = null;

// chrome.action.onClicked.addListener(tab => {
//   chrome.windows.create({
//     url: 'src/pages/popup/index.html',
//     type: 'popup',
//     width: 600,
//     height: 600,
//   });
//   chrome.tabs.query({}, tabs => {
//     tabs.forEach(tab => {
//       if (
//         tab.url &&
//         !tab.url.includes('chrome://') &&
//         !tab.url.includes('about:') &&
//         !tab.url.includes('chrome-extension://')
//       ) {
//         chrome.scripting.executeScript({
//           target: { tabId: tab.id, allFrames: true },
//           files: ['src/pages/contentInjected/index.js'],
//         });
//       }
//     });
//   });
// });

chrome.action.onClicked.addListener(tab => {
  if (popupWindowId !== null) {
    chrome.windows.get(popupWindowId, {}, window => {
      if (chrome.runtime.lastError) {
        createPopupWindow();
      } else {
        chrome.windows.update(popupWindowId, { focused: true });
      }
    });
  } else {
    createPopupWindow();
  }

  injectContentScriptToAllTabs();
});

function createPopupWindow() {
  chrome.windows.create(
    {
      url: 'src/pages/popup/index.html',
      type: 'popup',
      width: 600,
      height: 600,
    },
    newWindow => {
      popupWindowId = newWindow.id;
      chrome.windows.onRemoved.addListener(function (windowId) {
        if (windowId === popupWindowId) {
          popupWindowId = null;
        }
      });
    },
  );
}

function injectContentScriptToAllTabs() {
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      if (
        tab.url &&
        !tab.url.includes('chrome://') &&
        !tab.url.includes('about:') &&
        !tab.url.includes('chrome-extension://')
      ) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ['src/pages/contentInjected/index.js'],
        });
      }
    });
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    !tab.url.includes('chrome://') &&
    !tab.url.includes('about:') &&
    !tab.url.includes('chrome-extension://')
  ) {
    chrome.scripting
      .executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['src/pages/contentInjected/index.js'],
      })
      .then(async () => {
        const mode = await modeStorage.get();
        const action =
          mode === 'record'
            ? 'activateEventTracking'
            : 'deactivateEventTracking';
        chrome.tabs.sendMessage(tab.id, { action });
      })
      .catch(err => console.error('Failed to inject content script: ', err));
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message.action === 'activateEventTracking' ||
    message.action === 'deactivateEventTracking'
  ) {
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        if (
          tab.url &&
          !tab.url.includes('chrome://') &&
          !tab.url.includes('about:') &&
          !tab.url.includes('chrome-extension://')
        ) {
          chrome.tabs.sendMessage(tab.id, message, response => {
            console.log('Message sent to tab: ' + tab.id);
          });
        }
      });
    });
  }
});

chrome.windows.onCreated.addListener(async window => {
  chrome.tabs.query({ windowId: window.id }, async tabs => {
    const mode = await modeStorage.get();
    const action =
      mode === 'record' ? 'activateEventTracking' : 'deactivateEventTracking';

    tabs.forEach(tab => {
      if (
        tab.url &&
        !tab.url.includes('chrome://') &&
        !tab.url.includes('about:') &&
        !tab.url.includes('chrome-extension://')
      ) {
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id, allFrames: true },
            files: ['src/pages/contentInjected/index.js'],
          })
          .then(() => {
            console.log('Content script injected into new window tab.');
            chrome.tabs.sendMessage(tab.id, { action }, () => {
              console.log(`Message sent to tab: ${tab.id}`);
            });
          })
          .catch(err =>
            console.error('Failed to inject content script: ', err),
          );
      }
    });
  });
});
