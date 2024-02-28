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

chrome.action.onClicked.addListener(tab => {
  handlePopupWindow();
  injectContentScriptToAllTabs();
});

function handlePopupWindow() {
  if (popupWindowId !== null) {
    chrome.windows.get(popupWindowId, {}, window => {
      if (chrome.runtime.lastError) {
        createPopupWindow();
      }
    });
  } else {
    createPopupWindow();
  }
}

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
        injectContentScriptToTab(tab.id);
      }
    });
  });
}

function injectContentScriptToTab(tabId: number) {
  chrome.scripting
    .executeScript({
      target: { tabId, allFrames: true },
      files: ['src/pages/contentInjected/index.js'],
    })
    .then(async () => {
      const mode = await modeStorage.get();
      const action =
        mode === 'record' ? 'activateEventTracking' : 'deactivateEventTracking';
      sendMessageToTab(tabId, { action });
    })
    .catch(err => console.error('Failed to inject content script: ', err));
}

function sendMessageToTab(tabId: number, message: { action: string }) {
  chrome.tabs.sendMessage(tabId, message, () => {
    if (chrome.runtime.lastError) {
      console.error(
        'Message sending failed: ',
        chrome.runtime.lastError.message,
      );
    } else {
      console.log(`Message sent to tab: ${tabId}`);
    }
  });
}

// 새로운 탭이 생길 경우 해당 탭에 content script 주입
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    !tab.url.includes('chrome://') &&
    !tab.url.includes('about:') &&
    !tab.url.includes('chrome-extension://')
  ) {
    injectContentScriptToTab(tab.id);
  }
});

chrome.windows.onCreated.addListener(() => {
  injectContentScriptToAllTabs();
});

// chrome.windows.onCreated.addListener(async window => {
//   chrome.tabs.query({ windowId: window.id }, async tabs => {
//     const mode = await modeStorage.get();
//     const action =
//       mode === 'record' ? 'activateEventTracking' : 'deactivateEventTracking';

//     tabs.forEach(tab => {
//       if (
//         tab.url &&
//         !tab.url.includes('chrome://') &&
//         !tab.url.includes('about:') &&
//         !tab.url.includes('chrome-extension://')
//       ) {
//         chrome.scripting
//           .executeScript({
//             target: { tabId: tab.id, allFrames: true },
//             files: ['src/pages/contentInjected/index.js'],
//           })
//           .then(() => {
//             console.log('Content script injected into new window tab.');
//             chrome.tabs.sendMessage(tab.id, { action }, () => {
//               console.log(`Message sent to tab: ${tab.id}`);
//             });
//           })
//           .catch(err =>
//             console.error('Failed to inject content script: ', err),
//           );
//       }
//     });
//   });
// });
