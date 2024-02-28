import { Box } from '@chakra-ui/react';
import useStorage from '@root/src/shared/hooks/useStorage';
import modeStorage from '@root/src/shared/storages/modeStorage';
import { useEffect } from 'react';

export default function App() {
  const mode = useStorage(modeStorage);

  useEffect(() => {
    console.log('mode', mode);
  }, [mode]);

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      w="100vw"
      h="100vh"
      pointerEvents="none"
      border="5px solid red"
      zIndex="9999"
      boxSizing="border-box"
      hidden={mode !== 'record'}
    />
  );
}
