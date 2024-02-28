import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import useStorage from '@root/src/shared/hooks/useStorage';
import modeStorage from '@root/src/shared/storages/modeStorage';
import { PiRecordFill } from 'react-icons/pi';

export default function App() {
  const mode = useStorage(modeStorage);

  return (
    <Box>
      <Box
        position="fixed"
        top={0}
        left={0}
        w="100%"
        h="4px"
        bg="red.500"
        zIndex="9999"></Box>
      <Flex
        position="fixed"
        top={0}
        left="50%"
        transform="translateX(-50%)"
        justify="center"
        align="center"
        height="30px"
        pointerEvents="none"
        bg="red.500"
        zIndex="9999"
        hidden={mode !== 'record'}
        px={3}
        borderRadius="0 0 0.5rem 0.5rem">
        <Box mr={1}>
          <PiRecordFill color="white" />
        </Box>
        <Text color="white">Recording...</Text>
      </Flex>
    </Box>
  );
}
