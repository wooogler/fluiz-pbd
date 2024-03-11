import { BaseStorage, StorageType, createStorage } from './base';

export type TaskInfo = {
  uid: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

type TaskInfoStorage = BaseStorage<TaskInfo[]> & {
  addTask: () => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  editTaskName: (taskId: string, newName: string) => Promise<void>;
  // fetchTasks: () => Promise<TaskInfo[]>;
};

const storage = createStorage<TaskInfo[]>('task-info-storage-key', [], {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const taskInfoStorage: TaskInfoStorage = {
  ...storage,
  addTask: async () => {
    const uniqueId = Date.now().toString();
    const newTask = {
      uid: uniqueId,
      name: 'new task',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await storage.set([...(await storage.get()), newTask]);
  },
  deleteTask: async taskId => {
    await storage.set(
      (await storage.get()).filter(task => task.uid !== taskId),
    );
  },
  editTaskName: async (taskId, newName) => {
    const tasks = await storage.get();
    const taskIndex = tasks.findIndex(task => task.uid === taskId);
    if (taskIndex === -1) {
      return;
    }
    tasks[taskIndex].name = newName;
    tasks[taskIndex].updatedAt = Date.now();
    await storage.set(tasks);
  },
};

export default taskInfoStorage;
