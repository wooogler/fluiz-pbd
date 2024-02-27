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
    width: 400,
    height: 600,
  });

  console.log('window created');

  chrome.tabs.query({}, tabs => {
    console.log(tabs);
    tabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['src/pages/contentInjected/index.js'],
      });
      console.log('script executed');
    });
  });
});
