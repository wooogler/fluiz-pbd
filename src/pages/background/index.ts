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
      files: [
        'src/pages/contentInjected/index.js',
        'src/pages/contentUI/index.js',
      ],
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
      console.log('Message sending failed: ', chrome.runtime.lastError.message);
    } else {
      console.log(`Message sent to tab: ${tabId}`);
    }
  });
}

// 새로운 탭이 생길 경우 해당 탭에 content script 주입 + 탭 URL이 변경될 경우 저장소 업데이트
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    tabUrls[tabId] = changeInfo.url;
  }
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    !tab.url.includes('chrome://') &&
    !tab.url.includes('about:') &&
    !tab.url.includes('chrome-extension://')
  ) {
    injectContentScriptToTab(tabId);
  }
});

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
    if (
      tabs.length > 0 &&
      !tabs[0].pendingUrl.includes('chrome://') &&
      !tabs[0].pendingUrl.includes('about:') &&
      !tabs[0].pendingUrl.includes('chrome-extension://')
    ) {
      const firstTab = tabs[0];
      await addEventIfRecording({
        type: 'window-created',
        targetId: 'N/A',
        tabId: firstTab.id,
        windowId: window.id,
        url: firstTab.pendingUrl,
      });
    }
  });
});

const tabUrls = {};

chrome.tabs.onCreated.addListener(async tab => {
  if (
    tab.pendingUrl &&
    !tab.pendingUrl.includes('chrome://') &&
    !tab.pendingUrl.includes('about:') &&
    !tab.pendingUrl.includes('chrome-extension://')
  ) {
    await addEventIfRecording({
      type: 'tab-created',
      targetId: 'N/A',
      tabId: tab.id,
      windowId: tab.windowId,
      url: tab.pendingUrl,
    });
    tabUrls[tab.id] = tab.pendingUrl;
  }
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const tabUrl = tabUrls[tabId];
  if (
    tabUrl &&
    !tabUrl.includes('chrome://') &&
    !tabUrl.includes('about:') &&
    !tabUrl.includes('chrome-extension://')
  ) {
    await addEventIfRecording({
      type: 'tab-removed',
      targetId: 'N/A',
      tabId: tabId,
      windowId: removeInfo.windowId,
      url: 'N/A',
    });
  }
  delete tabUrls[tabId];
});

// 브라우저에서 URL 이동이 발생했을 경우 이벤트 저장소에 저장
chrome.webNavigation.onCommitted.addListener(
  details => {
    if (details.frameId === 0) {
      if (
        details.transitionType === 'typed' ||
        details.transitionType === 'auto_bookmark'
      ) {
        chrome.tabs.get(details.tabId, async tab => {
          if (tab) {
            await addEventIfRecording({
              type: 'navigation-url',
              targetId: 'N/A',
              tabId: tab.id,
              windowId: tab.windowId,
              url: details.url,
            });
          }
        });
      }
    }
  },
  { url: [{ schemes: ['http', 'https'] }] },
);

// 브라우저에서 뒤로 가기/앞으로 가기를 했을 경우 이벤트 저장소에 저장
chrome.webNavigation.onHistoryStateUpdated.addListener(
  details => {
    if (
      details.frameId === 0 &&
      details.transitionQualifiers.includes('forward_back')
    ) {
      chrome.tabs.get(details.tabId, async tab => {
        if (tab) {
          await addEventIfRecording({
            type: 'navigation-back-forward',
            targetId: 'N/A',
            tabId: tab.id,
            windowId: tab.windowId,
            url: details.url,
          });
        }
      });
    }
  },
  { url: [{ schemes: ['http', 'https'] }] },
);
