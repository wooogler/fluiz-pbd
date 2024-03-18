import { BaseStorage, StorageType, createStorage } from './base';

type Mode = 'record' | 'stop' | 'replay' | 'extract';

type ModeStorage = BaseStorage<Mode> & {
  change: (mode: Mode) => Promise<void>;
};

const storage = createStorage<Mode>('mode-storage-key', 'stop', {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const modeStorage: ModeStorage = {
  ...storage,
  change: async mode => {
    await storage.set(mode);
  },
};

export default modeStorage;
