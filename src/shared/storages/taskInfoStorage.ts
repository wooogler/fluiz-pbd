import { BaseStorage, StorageType, createStorage } from './base';

export type TaskInfo = {
  selectedTaskId: string | null;
  selectedTaskName: string | null;
};

type TaskInfoStorage = BaseStorage<TaskInfo> & {
  selectTask: (taskId: string, taskName: string) => Promise<void>;
};

const storage = createStorage<TaskInfo>(
  'task-info-storage-key',
  {
    selectedTaskId: null,
    selectedTaskName: null,
  },
  {
    storageType: StorageType.Local,
    liveUpdate: true,
  },
);

const taskInfoStorage: TaskInfoStorage = {
  ...storage,
  selectTask: async (taskId, taskName) => {
    await storage.set({
      selectedTaskId: taskId,
      selectedTaskName: taskName,
    });
  },
};

export default taskInfoStorage;
