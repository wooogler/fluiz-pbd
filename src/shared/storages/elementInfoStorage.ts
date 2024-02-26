import { BaseStorage, StorageType, createStorage } from './base';

type ElementInfoStorage = BaseStorage<string> & {
  update: (info: string) => Promise<void>;
};

const storage = createStorage<string>('element-info-storage-key', '', {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const elementInfoStorage: ElementInfoStorage = {
  ...storage,
  update: async info => {
    await storage.set(info);
  },
};

export default elementInfoStorage;
