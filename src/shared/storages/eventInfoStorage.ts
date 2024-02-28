import { BaseStorage, StorageType, createStorage } from './base';

export type EventInfo = {
  type:
    | 'click'
    | 'input'
    | 'access'
    | 'tab-created'
    | 'window-created'
    | 'tab-removed'
    | 'window-removed';
  targetId: string;
  url: string;
  tabId: number;
  windowId: number;
  inputValue?: string;
};

type EventInfoStorage = BaseStorage<EventInfo[]> & {
  addEvent: (event: EventInfo) => Promise<void>;
  clearEvents: () => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
};

const storage = createStorage<EventInfo[]>('event-info-storage-key', [], {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const eventInfoStorage: EventInfoStorage = {
  ...storage,
  addEvent: async event => {
    await storage.set([...(await storage.get()), event]);
  },
  clearEvents: async () => {
    await storage.set([]);
  },
  deleteEvent: async eventId => {
    await storage.set(
      (await storage.get()).filter(event => event.targetId !== eventId),
    );
  },
};

export default eventInfoStorage;
