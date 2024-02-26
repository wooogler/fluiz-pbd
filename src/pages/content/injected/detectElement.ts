import elementInfoStorage from '@root/src/shared/storages/elementInfoStorage';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';

refreshOnUpdate('pages/content/injected/detectElement');

document.addEventListener('mouseover', event => {
  const hoverText = (event.target as HTMLElement).innerText;
  if (hoverText) {
    elementInfoStorage.update(hoverText);
  }
});
