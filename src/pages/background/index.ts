import eventInfoStorage, {
  EventInfo,
} from '@root/src/shared/storages/eventInfoStorage';
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
      width: 1200,
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
      console.log('Content script injected: ', tabId);
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
      console.log(message);
    }
  });
}

let firstTabIdInNewWindow: number | null = null;

chrome.windows.onCreated.addListener(window => {
  chrome.tabs.query({ windowId: window.id }, tabs => {
    if (tabs.length > 0) {
      firstTabIdInNewWindow = tabs[0].id;
    }
  });
});

// 새로운 탭이 생길 경우 해당 탭에 content script 주입
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    !tab.url.includes('chrome://') &&
    !tab.url.includes('about:') &&
    !tab.url.includes('chrome-extension://')
  ) {
    if (tabId === firstTabIdInNewWindow || firstTabIdInNewWindow === null) {
      injectContentScriptToTab(tabId);
      if (tabId === firstTabIdInNewWindow) {
        firstTabIdInNewWindow = null;
      }
    }
  }
});

// chrome.windows.onCreated.addListener(window => {
//   chrome.tabs.query({ windowId: window.id }, tabs => {
//     tabs.forEach(tab => {
//       if (
//         tab.url &&
//         !tab.url.includes('chrome://') &&
//         !tab.url.includes('about:') &&
//         !tab.url.includes('chrome-extension://')
//       ) {
//         injectContentScriptToTab(tab.id);
//       }
//     });
//   });
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getContextId' && sender.tab) {
    sendResponse({
      tabId: sender.tab.id,
      windowId: sender.tab.windowId,
    });
  } else if (
    message.action === 'activateEventTracking' ||
    message.action === 'deactivateEventTracking'
  ) {
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, message, response => {
          console.log('Message sent to tab: ' + tab.id);
        });
      });
    });
  }
});

async function addEventIfRecording(eventInfo: Omit<EventInfo, 'uid'>) {
  const mode = await modeStorage.get();
  if (mode === 'record') {
    eventInfoStorage.addEvent(eventInfo);
  }
}

chrome.windows.onCreated.addListener(window => {
  chrome.tabs.query({ windowId: window.id }, async tabs => {
    if (tabs.length > 0) {
      const firstTab = tabs[0];
      await addEventIfRecording({
        type: 'window-created',
        targetId: 'N/A',
        tabId: firstTab.id,
        windowId: window.id,
        url: firstTab.url || 'N/A',
      });
    } else {
      await addEventIfRecording({
        type: 'window-created',
        targetId: 'N/A',
        tabId: -1,
        windowId: window.id,
        url: 'N/A',
      });
    }
  });
});

chrome.tabs.onCreated.addListener(async tab => {
  await addEventIfRecording({
    type: 'tab-created',
    targetId: 'N/A',
    tabId: tab.id,
    windowId: tab.windowId,
    url: tab.url || 'N/A',
  });
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  await addEventIfRecording({
    type: 'tab-removed',
    targetId: 'N/A',
    tabId: tabId,
    windowId: removeInfo.windowId,
    url: 'N/A',
  });
});
