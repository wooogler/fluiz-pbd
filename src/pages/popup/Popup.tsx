import React, { useState, KeyboardEventHandler } from 'react';
import '@pages/popup/Popup.css';
import useStorage from '@src/shared/hooks/useStorage';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import {
  Box,
  Table,
  Thead,
  Tr,
  Tbody,
  Td,
  Th,
  Text,
  Flex,
  Button,
  Spacer,
  VStack,
  StackDivider,
  HStack,
  Input,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import documentInfoStorage from '@root/src/shared/storages/documentInfoStorage';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import eventInfoStorage from '@root/src/shared/storages/eventInfoStorage';
import { DeleteIcon } from '@chakra-ui/icons';
import { PiRecordFill, PiStopFill } from 'react-icons/pi';
import modeStorage from '@root/src/shared/storages/modeStorage';
import ScrollableTextBox from './components/ScrollableTextBox';
import isURL from 'validator/lib/isURL';

const Popup = () => {
  const [inputUrl, setInputUrl] = useState('');
  const documentInfo = useStorage(documentInfoStorage);
  const eventInfo = useStorage(eventInfoStorage);
  const mode = useStorage(modeStorage);

  const isValidUrl = (url: string): boolean => {
    return isURL(url);
  };

  const inputUrlBorderColor =
    inputUrl !== '' && !isValidUrl(inputUrl) ? 'red.400' : 'gray.200';
  const inputUrlBorderWidth = inputUrl !== '' && !isValidUrl(inputUrl) ? 2 : 1;

  const onDrop = acceptedFiles => {
    acceptedFiles.forEach(file => {
      Papa.parse(file, {
        complete: result => {
          console.log(result.data);
          documentInfoStorage.newInfo(result.data);
        },
        header: true,
        skipEmptyLines: true,
      });
    });
  };

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      'text/csv': ['.csv'],
    },
  });

  const handleEnterNewWindow: KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.key === 'Enter') {
      handleClickNewWindow();
    }
  };

  const handleClickNewWindow = () => {
    const hasProtocol =
      inputUrl.startsWith('http://') || inputUrl.startsWith('https://');
    const windowUrl = hasProtocol ? inputUrl : `http://${inputUrl}`;
    chrome.windows.create({
      url: windowUrl,
      type: 'normal',
    });
  };

  const handleChangeMode = () => {
    if (mode === 'record') {
      modeStorage.change('stop');
      chrome.runtime.sendMessage({ action: 'deactivateEventTracking' });
    } else {
      modeStorage.change('record');
      chrome.runtime.sendMessage({ action: 'activateEventTracking' });
    }
  };

  return (
    <VStack
      w="100%"
      divider={<StackDivider borderColor="gray.200" />}
      spacing={4}
      p={4}
      h="full"
      flex={1}>
      <VStack w="100%">
        <Box
          {...getRootProps()}
          p={5}
          border="2px"
          borderColor={isDragActive ? 'green.300' : 'gray.200'}
          bg={isDragActive ? 'green.50' : 'gray.50'}
          borderRadius="md"
          textAlign="center"
          cursor="pointer"
          onClick={open}>
          <input {...getInputProps()} />
          <Text>여기에 파일을 가져다놓거나 클릭하여 파일을 선택하세요.</Text>
        </Box>
        {documentInfo.length > 0 && (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                {Object.keys(documentInfo[0]).map(header => (
                  <Th key={header}>{header}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {documentInfo.map((row, index) => (
                <Tr key={index}>
                  {Object.keys(row).map(cell => (
                    <Td key={cell}>{row[cell]}</Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </VStack>
      <VStack w="100%" flex={1} overflowY="hidden">
        <Flex w="100%" align="center" py={2}>
          <Text fontSize="xl" fontWeight="bold" mr={2}>
            Event List
          </Text>
          <Text>{`(${eventInfo.length} Events)`}</Text>
          <Spacer />
          <HStack align="center" spacing={2}>
            <Tooltip
              label="Start recording to use this"
              isDisabled={mode === 'record'}
              hasArrow
              placement="bottom">
              <Flex>
                <Input
                  size="sm"
                  w="15rem"
                  borderRadius="0.375rem 0 0 0.375rem"
                  placeholder="https://"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  borderColor={inputUrlBorderColor}
                  borderWidth={inputUrlBorderWidth}
                  _hover={{ borderColor: inputUrlBorderColor, borderWidth: 2 }}
                  _focus={{ borderColor: inputUrlBorderColor, borderWidth: 2 }}
                  disabled={mode !== 'record'}
                  onKeyDown={handleEnterNewWindow}
                />
                <Button
                  size="sm"
                  onClick={handleClickNewWindow}
                  borderRadius="0 0.375rem 0.375rem 0"
                  isDisabled={!isValidUrl(inputUrl)}>
                  Go
                </Button>
              </Flex>
            </Tooltip>
            <IconButton
              onClick={handleChangeMode}
              size="sm"
              colorScheme={mode === 'record' ? 'red' : 'gray'}
              variant={mode === 'record' ? 'solid' : 'outline'}
              aria-label={mode === 'record' ? 'stop' : 'record'}
              icon={
                mode === 'record' ? (
                  <PiStopFill />
                ) : (
                  <PiRecordFill color="red" />
                )
              }
            />
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => eventInfoStorage.clearEvents()}>
              Clear Events
            </Button>
          </HStack>
        </Flex>
        <Box overflowY="auto" w="100%" flex={1}>
          <Table variant="simple" size="sm" w="100%">
            <Thead position="sticky" top={0} bgColor="white" zIndex={1}>
              <Tr>
                <Th w={50}>Event</Th>
                <Th w={50}>Window ID</Th>
                <Th w={50}>Tab ID</Th>
                <Th w={100}>URL</Th>
                <Th w={100}>Target ID</Th>
                <Th w={50}>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {eventInfo.map(item => (
                <Tr key={item.targetId}>
                  <Td>{item.type}</Td>
                  <Td>{item.windowId}</Td>
                  <Td>{item.tabId}</Td>
                  <Td>
                    <ScrollableTextBox maxW={100} text={item.url} />
                  </Td>
                  <Td>
                    <ScrollableTextBox maxW={100} text={item.targetId} />
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => eventInfoStorage.deleteEvent(item.uid)}>
                      <DeleteIcon />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </VStack>
  );
};

export default withErrorBoundary(
  withSuspense(Popup, <div> Loading ... </div>),
  <div> Error Occur </div>,
);
