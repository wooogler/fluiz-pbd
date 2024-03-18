import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export type Task = {
  taskId: string;
  taskName: string;
  createdAt: number;
  updatedAt: number;
};

interface TaskAddPayload {
  taskName: string;
  taskId: string;
}

interface TaskEditPayload {
  taskId: string;
  newName: string;
}

const useTaskInfo = () => {
  const queryClient = useQueryClient();

  const fetchTasks = async (): Promise<Task[]> => {
    const response = await axios.get<Task[]>('https://api.fluiz.io/api/tasks');
    return response.data;
  };

  const addTask = async (payload: TaskAddPayload): Promise<void> => {
    await axios.post('https://api.fluiz.io/api/tasks', payload);
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    await axios.delete(`https://api.fluiz.io/api/tasks/${taskId}`);
  };

  const editTaskName = async ({
    taskId,
    newName,
  }: TaskEditPayload): Promise<void> => {
    await axios.put(`https://api.fluiz.io/api/tasks/${taskId}`, {
      taskName: newName,
    });
  };

  const {
    data: tasks,
    isLoading,
    isError,
    error,
  } = useQuery<Task[], Error>({ queryKey: ['tasks'], queryFn: fetchTasks });

  const mutationAddTask = useMutation<void, Error, TaskAddPayload>({
    mutationFn: addTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const mutationDeleteTask = useMutation<void, Error, string>({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const mutationEditTaskName = useMutation<void, Error, TaskEditPayload>({
    mutationFn: editTaskName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks,
    isLoading,
    isError,
    error,
    addTask: (payload: TaskAddPayload) => mutationAddTask.mutate(payload),
    deleteTask: (taskId: string) => mutationDeleteTask.mutate(taskId),
    editTaskName: (payload: TaskEditPayload) =>
      mutationEditTaskName.mutate(payload),
  };
};

export default useTaskInfo;
