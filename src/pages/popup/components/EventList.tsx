import {
  VStack,
  Flex,
  Spacer,
  HStack,
  Tooltip,
  Input,
  Button,
  IconButton,
  Box,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
} from '@chakra-ui/react';
import eventInfoStorage from '@root/src/shared/storages/eventInfoStorage';
import {
  PiStopFill,
  PiRecordFill,
  PiPlayFill,
  PiPlusBold,
} from 'react-icons/pi';
import EventItem from './EventItem';
import { useState, KeyboardEventHandler } from 'react';
import useStorage from '@root/src/shared/hooks/useStorage';
import modeStorage from '@root/src/shared/storages/modeStorage';
import isURL from 'validator/lib/isURL';
import taskInfoStorage from '@root/src/shared/storages/taskInfoStorage';

const isValidUrl = (url: string): boolean => {
  return isURL(url);
};

const EventList = () => {
  const [inputUrl, setInputUrl] = useState('http://www.iros.go.kr/PMainJ.jsp');

  const eventInfo = useStorage(eventInfoStorage);
  const taskInfo = useStorage(taskInfoStorage);
  const mode = useStorage(modeStorage);

  const [recordWindowId, setRecordWindowId] = useState<number | null>(null);

  const inputUrlBorderColor =
    inputUrl !== '' && !isValidUrl(inputUrl) ? 'red.400' : 'gray.200';
  const inputUrlBorderWidth = inputUrl !== '' && !isValidUrl(inputUrl) ? 2 : 1;

  const handleEnterNewWindow: KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.key === 'Enter') {
      handleClickNewWindow();
    }
  };

  const handleClickNewWindow = () => {
    const hasProtocol =
      inputUrl.startsWith('http://') || inputUrl.startsWith('https://');
    const windowUrl = hasProtocol ? inputUrl : `http://${inputUrl}`;
    chrome.windows.create(
      {
        url: windowUrl,
        type: 'normal',
      },
      window => {
        setRecordWindowId(window.id);
      },
    );
  };

  const handleClickCloseWindow = () => {
    if (recordWindowId) {
      chrome.windows.remove(recordWindowId);
      setRecordWindowId(null);
    }
  };

  const handleChangeMode = () => {
    if (mode === 'record') {
      modeStorage.change('stop');
      chrome.runtime.sendMessage({ action: 'deactivateEventTracking' });
      handleClickCloseWindow();
    } else {
      modeStorage.change('record');
      chrome.runtime.sendMessage({ action: 'activateEventTracking' });
    }
  };

  const handleAddPopupEvent = () => {
    const lastEvent = eventInfo[eventInfo.length - 1];
    eventInfoStorage.addEvent({
      type: 'accept-popup',
      targetId: 'N/A',
      url: lastEvent?.url || '',
      tabId: lastEvent?.tabId || 0,
      windowId: lastEvent?.windowId || 0,
      replayed: false,
    });
  };

  return (
    <VStack w="100%" ml={2}>
      <Flex w="100%" align="center">
        <Text fontSize="xl" fontWeight="bold" mr={2}>
          Events
        </Text>
        <Text>{`(${eventInfo.length})`}</Text>
        <Spacer />
        <HStack align="center">
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
                _hover={{
                  borderColor: inputUrlBorderColor,
                  borderWidth: 2,
                }}
                _focus={{
                  borderColor: inputUrlBorderColor,
                  borderWidth: 2,
                }}
                disabled={mode !== 'record'}
                onKeyDown={handleEnterNewWindow}
              />
              <Button
                size="sm"
                onClick={handleClickNewWindow}
                borderRadius="0 0.375rem 0.375rem 0"
                isDisabled={mode !== 'record' || !isValidUrl(inputUrl)}>
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
              mode === 'record' ? <PiStopFill /> : <PiRecordFill color="red" />
            }
          />
          {/* <Tooltip
            label={
              eventInfo.length === 0
                ? 'No events to play'
                : 'Stop recording to play events'
            }
            isDisabled={!(eventInfo.length === 0 || mode === 'record')}
            hasArrow
            placement="bottom">
            <IconButton
              size="sm"
              variant="outline"
              aria-label="play"
              isDisabled={eventInfo.length === 0 || mode === 'record'}
              icon={<PiPlayFill />}
              onClick={handleClickReplay}
            />
          </Tooltip> */}

          <Button
            size="sm"
            colorScheme="blue"
            onClick={() => eventInfoStorage.clearEvents()}>
            Clear Events
          </Button>
          <Popover>
            <PopoverTrigger>
              <Button size="sm" leftIcon={<PiPlusBold />}>
                Event
              </Button>
            </PopoverTrigger>
            <PopoverContent width="auto">
              <PopoverArrow />
              <PopoverBody>
                <Button size="sm" onClick={handleAddPopupEvent}>
                  Popup
                </Button>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </HStack>
      </Flex>
      <Box overflowY="auto" w="100%" flex={1}>
        <Table variant="simple" size="sm" w="100%">
          <Thead position="sticky" top={0} bgColor="white" zIndex={1}>
            <Tr>
              <Th w={30}>Event</Th>
              <Th w={30}>Window ID</Th>
              <Th w={30}>Tab ID</Th>
              <Th w={100}>URL</Th>
              <Th w={100}>Target ID</Th>
              <Th w={100}>Value</Th>
              <Th w={10}></Th>
            </Tr>
          </Thead>
          <Tbody>
            {taskInfo.selectedTaskId &&
              eventInfo.map(item => <EventItem key={item.uid} item={item} />)}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
};

export default EventList;
