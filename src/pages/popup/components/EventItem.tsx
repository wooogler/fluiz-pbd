import { Button, IconButton, Input, Td, Tr } from '@chakra-ui/react';
import useAsyncInput from '@root/src/shared/hooks/useAsyncInput';
import eventInfoStorage, {
  EventInfo,
} from '@root/src/shared/storages/eventInfoStorage';
import ScrollableTextBox from './ScrollableTextBox';
import { PiTrash } from 'react-icons/pi';

const EventItem = ({ item }: { item: EventInfo }) => {
  const [inputValue, handleChange, handleBlur] = useAsyncInput(
    item.inputValue,
    eventInfoStorage.editEventInputValue,
    item.uid,
  );

  return (
    <Tr bgColor={item.replayed && 'blue.50'}>
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
        {item.type.startsWith('input') && (
          <Input
            size="sm"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            bgColor="white"
          />
        )}
      </Td>
      <Td>
        <IconButton
          size="sm"
          colorScheme="red"
          variant="ghost"
          aria-label={`delete event ${item.uid}`}
          onClick={() => eventInfoStorage.deleteEvent(item.uid)}
          icon={<PiTrash />}
        />
      </Td>
    </Tr>
  );
};

export default EventItem;
