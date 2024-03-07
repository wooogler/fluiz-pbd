import { Button, Input, Td, Tr } from '@chakra-ui/react';
import useAsyncInput from '@root/src/shared/hooks/useAsyncInput';
import eventInfoStorage, {
  EventInfo,
} from '@root/src/shared/storages/eventInfoStorage';
import React, { useState } from 'react';
import ScrollableTextBox from './ScrollableTextBox';
import { DeleteIcon } from '@chakra-ui/icons';

const EventItem = ({ item }: { item: EventInfo }) => {
  const [inputValue, handleChange, handleBlur] = useAsyncInput(
    item.inputValue,
    eventInfoStorage.editEventInputValue,
    item.uid,
  );

  return (
    <Tr bgColor={item.replayed && 'blue.100'}>
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
        {item.type === 'input' && (
          <Input
            size="sm"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        )}
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
  );
};

export default EventItem;
