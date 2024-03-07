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
  replayed: boolean;
};

type EventInfoStorage = BaseStorage<EventInfo[]> & {
  addEvent: (event: Omit<EventInfo, 'uid'>) => Promise<void>;
  editEventInputValue: (eventId: string, inputValue: string) => Promise<void>;
  clearEvents: () => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  replayedEvent: (eventId: string) => Promise<void>;
  resetReplayedEvents: () => Promise<void>;
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
  editEventInputValue: async (eventId, inputValue) => {
    const events = await storage.get();
    const eventIndex = events.findIndex(event => event.uid === eventId);
    if (eventIndex === -1) {
      return;
    }
    events[eventIndex].inputValue = inputValue;
    await storage.set(events);
  },
  deleteEvent: async eventId => {
    await storage.set(
      (await storage.get()).filter(event => event.uid !== eventId),
    );
  },
  replayedEvent: async eventId => {
    const events = await storage.get();
    const eventIndex = events.findIndex(event => event.uid === eventId);
    if (eventIndex === -1) {
      return;
    }
    events[eventIndex].replayed = true;
    await storage.set(events);
  },
  resetReplayedEvents: async () => {
    const events = await storage.get();
    events.forEach(event => {
      event.replayed = false;
    });
    await storage.set(events);
  },
};

export default eventInfoStorage;
