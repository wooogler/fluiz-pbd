import { BaseStorage, StorageType, createStorage } from './base';

export type EventInfo = {
  uid: string;
  type:
    | 'click'
    | 'input'
    | 'navigation-url'
    | 'navigation-back-forward'
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
  addEvent: (event: Omit<EventInfo, 'uid'>) => Promise<void>;
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
    const uniqueId = Date.now().toString();
    const newEvent = { ...event, uid: uniqueId };
    await storage.set([...(await storage.get()), newEvent]);
  },
  clearEvents: async () => {
    await storage.set([]);
  },
  deleteEvent: async eventId => {
    await storage.set(
      (await storage.get()).filter(event => event.uid !== eventId),
    );
  },
};

export default eventInfoStorage;
