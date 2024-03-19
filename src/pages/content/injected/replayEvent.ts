import eventInfoStorage, {
  EventInfo,
} from '@root/src/shared/storages/eventInfoStorage';
import { getElementUniqueId } from './detectEvent';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import documentInfoStorage from '@root/src/shared/storages/documentInfoStorage';

refreshOnUpdate('pages/content/injected/replayEvent');

// const originalConsoleLog = console.log;
// console.log = (...args) => {
//   originalConsoleLog(...args);
//   chrome.runtime.sendMessage({ type: 'LOG', payload: args.join(' ') });
// };

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'replayEvent') {
    const event = message.event;

    console.log('Replaying event: ', event);

    (async () => {
      // 즉시 실행 함수로 비동기 로직을 감싸기
      try {
        const data = await documentInfoStorage.get();

        if (event.type === 'click') {
          await replayClickEvent(event);
        } else if (event.type === 'input') {
          await replayInputEvent(event, data);
        } else if (event.type === 'input-cert') {
          await replayInputCertEvent(event);
        }

        eventInfoStorage.replayedEvent(event.uid);
        sendResponse({ success: true }); // 비동기 작업이 성공적으로 끝난 후 응답 보내기
      } catch (error) {
        console.error(error);
        sendResponse({ success: false, error: error.toString() }); // 에러 발생 시 응답 보내기
      }
    })();

    return true; // 비동기 응답을 처리하기 위해 true 반환
  }
});

async function replayClickEvent(event: EventInfo) {
  const elements = document.querySelectorAll(event.targetId.split(',')[0]);
  let elementFound = false;
  for (const element of elements) {
    const uniqueId = getElementUniqueId(element as HTMLElement);
    if (uniqueId === event.targetId) {
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
  }
  if (!elementFound) {
    console.log('Element not found', event.targetId);
  }
}

async function replayInputEvent(
  event: EventInfo,
  data: Record<string, string>,
) {
  const elements = document.querySelectorAll(event.targetId.split(',')[0]);
  for (const element of elements) {
    const uniqueId = getElementUniqueId(element as HTMLElement);
    if (uniqueId === event.targetId) {
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

      (element as HTMLInputElement | HTMLTextAreaElement).value = inputValue;

      // await simulateKeyInput(
      //   element as HTMLInputElement | HTMLTextAreaElement,
      //   inputValue,
      // );
      break;
    }
  }
}

const keyDict = getKeyDict();

async function replayInputCertEvent(eventInfo: EventInfo) {
  const delay = ms => new Promise(res => setTimeout(res, ms));
  const elements = document.querySelectorAll(eventInfo.targetId.split(',')[0]);
  for (const element of elements) {
    const uniqueId = getElementUniqueId(element as HTMLElement);
    if (uniqueId === eventInfo.targetId) {
      (element as HTMLElement).click();
      break;
    }
  }

  await delay(300);

  const certPwd = eventInfo.inputValue;
  const keySequence = getKeySequence(certPwd);
  const keyboardTypes = identifyKeyboardType(keySequence);

  for (const [index, key] of keySequence.entries()) {
    const targetId = `img,class=kpd-data,src=data:image/png;,xpath=id("nppfs-keypad-certselect_tek_input1")/DIV[1]/DIV[${keyboardTypes[index]}]/IMG[${keyDict[key]}]`;
    if (targetId) {
      const elements = document.querySelectorAll('img');
      for (const element of elements) {
        const uniqueId = getElementUniqueId(element as HTMLElement);
        if (uniqueId === targetId) {
          (element as HTMLImageElement).click();
          console.log('key: ' + ', ' + uniqueId);
          break;
        }
      }
      await delay(300);
    }
  }
}

// async function simulateKeyInput(element, value) {
//   for (let i = 0; i < value.length; i++) {
//     const char = value.charAt(i);
//     // Create and dispatch the key events
//     ['keydown', 'keypress', 'keyup'].forEach(type => {
//       const event = new KeyboardEvent(type, {
//         key: char,
//         code: `Key${char.toUpperCase()}`,
//         bubbles: true,
//       });
//       element.dispatchEvent(event);
//     });
//     // Update the element's value directly
//     element.value += char;
//     // Wait for a random delay to simulate typing speed variability
//     await new Promise(resolve => setTimeout(resolve, 600 * Math.random() + 50));
//   }
// }

function identifyKeyboardType(keySequence: string[]): number[] {
  let currentKeyboardType = 1;
  const output: number[] = [];

  keySequence.forEach(key => {
    output.push(currentKeyboardType);
    if (currentKeyboardType === 1) {
      // 현재 기본 키보드
      if (key === 'shift') {
        currentKeyboardType = 2;
      } else if (key === 'symbol') {
        currentKeyboardType = 3;
      }
    } else if (currentKeyboardType === 2) {
      // 현재 쉬프트 키보드
      if (key === 'shift') {
        currentKeyboardType = 1;
      } else if (key === 'symbol') {
        currentKeyboardType = 3;
      }
    } else if (currentKeyboardType === 3) {
      // 현재 심볼 키보드
      if (key === 'symbol') {
        currentKeyboardType = 1;
      } else if (key === 'shift') {
        currentKeyboardType = 2;
      }
    }
  });

  return output;
}

function getKeySequence(inputValue: string): string[] {
  const output: string[] = [];
  let isShift = false; // 대문자 입력 상태
  let isSymbol = false; // 심볼 입력 상태

  // 심볼 문자를 확인하기 위한 맵
  const symbolMap: { [key: string]: boolean } = {
    '!': true,
    '@': true,
    // 추가 심볼이 필요하면 여기에 추가
  };

  for (const char of inputValue) {
    if (/[A-Z]/.test(char)) {
      // 대문자인 경우
      if (!isShift) {
        output.push('shift');
        isShift = true;
      }
      output.push(char.toLowerCase());
    } else if (/[a-z]/.test(char)) {
      // 소문자인 경우
      if (isShift) {
        output.push('shift');
        isShift = false;
      }
      output.push(char);
    } else if (symbolMap[char]) {
      // 심볼인 경우
      if (!isSymbol) {
        output.push('symbol');
        isSymbol = true;
      }
      output.push(char);
    } else {
      // 그 외 문자
      if (isShift) {
        output.push('shift');
        isShift = false;
      }
      if (isSymbol) {
        output.push('symbol');
        isSymbol = false;
      }
      output.push(char);
    }
  }

  // 마지막으로 토글 상태 복원
  if (isShift) {
    output.push('shift');
  }
  if (isSymbol) {
    output.push('symbol');
  }

  output.push('enter');

  return output;
}

function getKeyDict() {
  const keyDict: { [key: string]: string } = {};
  let keyValue = 2;
  const keyList = [
    'close',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '0',
    'q',
    'w',
    'e',
    'r',
    't',
    'y',
    'u',
    'i',
    'o',
    'p',
    'a',
    's',
    'd',
    'f',
    'g',
    'h',
    'j',
    'k',
    'l',
    'z',
    'x',
    'c',
    'v',
    'b',
    'n',
    'm',
    'enter',
    'shift',
    'symbol',
    'space',
    'backspace',
    'clear',
    'refresh',
  ];
  keyList.forEach(key => {
    keyDict[key] = `${keyValue}`;
    keyValue++;
  });
  let symbolKeyValue = 3;
  const symbolKeyList = [
    '!',
    '@',
    '#',
    '$',
    '%',
    '^',
    '&',
    '*',
    '(',
    ')',
    '-',
    '_',
    '=',
    '+',
    '\\',
    '|',
    '{',
    '}',
    '[',
    ']',
    ';',
    ':',
    "'",
    '"',
    ',',
    '.',
    '<',
    '>',
    '$',
    '~',
    '`',
    '!',
    '@',
    '#',
    '/',
    '?',
  ];
  symbolKeyList.forEach(key => {
    keyDict[key] = `${symbolKeyValue}`;
    symbolKeyValue++;
  });
  return keyDict;
}
