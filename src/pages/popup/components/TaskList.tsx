import {
  Flex,
  VStack,
  Text,
  Spacer,
  IconButton,
  Box,
  Table,
  Tr,
  Thead,
  Th,
  Tbody,
  Td,
  ButtonGroup,
  Input,
} from '@chakra-ui/react';
import useStorage from '@root/src/shared/hooks/useStorage';
import taskInfoStorage from '@root/src/shared/storages/taskInfoStorage';
import { useState } from 'react';
import { PiCheck, PiPencilSimple, PiPlus, PiTrash } from 'react-icons/pi';

const TaskList = () => {
  const taskInfo = useStorage(taskInfoStorage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleEditClick = (taskId: string) => {
    if (editingId === taskId) {
      handleSubmit(taskId);
    } else {
      setEditingId(taskId);
      const taskToEdit = taskInfo.find(task => task.uid === taskId);
      if (taskToEdit) {
        setEditedName(taskToEdit.name);
      }
    }
  };

  const handleNameChange = e => {
    setEditedName(e.target.value);
  };

  const handleSubmit = async (taskId: string) => {
    await taskInfoStorage.editTaskName(taskId, editedName);
    setEditingId(null);
  };

  const handleAddTask = async () => {
    await taskInfoStorage.addTask();
  };

  const handleDelete = async (taskId: string) => {
    await taskInfoStorage.deleteTask(taskId);
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(selectedTaskId === taskId ? null : taskId);
  };

  return (
    <VStack w={250} mr={2}>
      <Flex w="100%" align="center">
        <Text fontSize="xl" fontWeight="bold" mr={2}>
          Tasks
        </Text>
        <Text>{`(${taskInfo.length})`}</Text>
        <Spacer />
        <IconButton
          aria-label="add task"
          icon={<PiPlus />}
          size="sm"
          variant="outline"
          onClick={handleAddTask}
        />
      </Flex>
      <Box overflowY="auto" w="100%" flex={1}>
        <Table variant="simple" size="sm" w="100%">
          <Thead position="sticky" top={0} bgColor="white" zIndex={1}>
            <Tr>
              <Th>Task</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {taskInfo.map(item => (
              <Tr
                key={item.uid}
                onClick={() => handleSelectTask(item.uid)}
                cursor="pointer"
                bg={selectedTaskId === item.uid ? 'blue.100' : 'transparent'}>
                <Td>
                  {editingId === item.uid ? (
                    <Input
                      value={editedName}
                      onChange={handleNameChange}
                      onKeyDown={e =>
                        e.key === 'Enter' && handleSubmit(item.uid)
                      }
                      onBlur={() => {
                        handleSubmit(item.uid);
                      }}
                      size="sm"
                    />
                  ) : (
                    item.name
                  )}
                </Td>
                <Td isNumeric>
                  <ButtonGroup size="sm" variant="ghost">
                    <IconButton
                      aria-label={`edit task ${item.name}`}
                      icon={
                        editingId === item.uid ? (
                          <PiCheck />
                        ) : (
                          <PiPencilSimple />
                        )
                      }
                      onClick={() => {
                        handleEditClick(item.uid);
                      }}
                    />
                    <IconButton
                      colorScheme="red"
                      aria-label={`delete task ${item.name}`}
                      icon={<PiTrash />}
                      onClick={() => handleDelete(item.uid)}
                    />
                  </ButtonGroup>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
};
export default TaskList;
