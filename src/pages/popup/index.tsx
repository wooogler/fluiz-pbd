import React from 'react';
import { createRoot } from 'react-dom/client';
import '@pages/popup/index.css';
import Popup from '@pages/popup/Popup';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import theme from './theme';

refreshOnUpdate('pages/popup');

const queryClient = new QueryClient();

function init() {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);
  root.render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <Popup />
      </ChakraProvider>
    </QueryClientProvider>,
  );
}

init();
