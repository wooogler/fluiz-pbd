import { Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const Console = () => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const handleMessage = (request, sender, sendResponse) => {
      if (request.type === 'LOG') {
        setLogs(prevLogs => [...prevLogs, request.payload]);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <Box w={300} h="100%">
      {logs.map((log, index) => (
        <div key={index}>{log}</div>
      ))}
    </Box>
  );
};

export default Console;
