import { BaseStorage, StorageType, createStorage } from './base';

export type ReplayInfo = {
  tabId: number;
  windowId: number;
};

type ReplayInfoStorage = BaseStorage<ReplayInfo[]> & {
  addReplaySession: (session: ReplayInfo) => Promise<void>;
  clearReplaySessions: () => Promise<void>;
};

const storage = createStorage<ReplayInfo[]>('play-info-storage-key', [], {
  storageType: StorageType.Session,
  liveUpdate: true,
});

const replayInfoStorage: ReplayInfoStorage = {
  ...storage,
  addReplaySession: async session => {
    await storage.set([session, ...(await storage.get())]);
  },
  clearReplaySessions: async () => {
    await storage.set([]);
  },
};

export default replayInfoStorage;
