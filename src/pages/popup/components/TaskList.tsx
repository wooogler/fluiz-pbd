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
import useTaskInfo from '@root/src/shared/hooks/useTaskInfo';
import { useState } from 'react';
import { PiCheck, PiPencilSimple, PiPlus, PiTrash } from 'react-icons/pi';

const TaskList = () => {
  // const taskInfo = useStorage(taskInfoStorage);
  const { tasks, addTask, deleteTask, editTaskName, isLoading, isError } =
    useTaskInfo();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleEditClick = (taskId: string) => {
    if (editingId === taskId) {
      editTaskName({ taskId, newName: editedName });
      setEditingId(null);
    } else {
      setEditingId(taskId);
      const taskToEdit = tasks?.find(task => task.taskId === taskId);
      if (taskToEdit) {
        setEditedName(taskToEdit.taskName);
      }
    }
  };

  const handleNameChange = e => {
    setEditedName(e.target.value);
  };

  const handleAddTaskClick = async () => {
    await addTask({
      taskName: 'New Task',
      taskId: Date.now().toString(),
    });
  };

  const handleDeleteClick = async (taskId: string) => {
    await deleteTask(taskId);
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(selectedTaskId === taskId ? null : taskId);
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  return (
    <VStack w={250} mr={2}>
      <Flex w="100%" align="center">
        <Text fontSize="xl" fontWeight="bold" mr={2}>
          Tasks
        </Text>
        <Text>{`(${tasks.length})`}</Text>
        <Spacer />
        <IconButton
          aria-label="add task"
          icon={<PiPlus />}
          size="sm"
          variant="outline"
          onClick={handleAddTaskClick}
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
            {tasks.map(item => (
              <Tr
                key={item.taskId}
                onClick={() => handleSelectTask(item.taskId)}
                cursor="pointer"
                bg={
                  selectedTaskId === item.taskId ? 'blue.100' : 'transparent'
                }>
                <Td>
                  {editingId === item.taskId ? (
                    <Input
                      value={editedName}
                      onChange={handleNameChange}
                      onKeyDown={e =>
                        e.key === 'Enter' && handleEditClick(item.taskId)
                      }
                      size="sm"
                    />
                  ) : (
                    item.taskName
                  )}
                </Td>
                <Td isNumeric>
                  <ButtonGroup size="sm" variant="ghost">
                    <IconButton
                      aria-label={`edit task ${item.taskName}`}
                      icon={
                        editingId === item.taskId ? (
                          <PiCheck />
                        ) : (
                          <PiPencilSimple />
                        )
                      }
                      onClick={() => {
                        handleEditClick(item.taskId);
                      }}
                    />
                    <IconButton
                      colorScheme="red"
                      aria-label={`delete task ${item.taskName}`}
                      icon={<PiTrash />}
                      onClick={() => handleDeleteClick(item.taskId)}
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
