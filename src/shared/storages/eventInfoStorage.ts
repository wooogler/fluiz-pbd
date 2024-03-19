import axios from 'axios';
import { BaseStorage, StorageType, createStorage } from './base';
import taskInfoStorage from './taskInfoStorage';

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
    | 'window-removed'
    | 'input-cert'
    | 'extract'
    | 'enter-press'
    | 'select-option'
    | 'screenshot';
  targetId: string;
  url: string;
  tabId: number;
  windowId: number;
  inputValue?: string;
  replayed: boolean | 'error';
};

type ServerEvent = EventInfo & {
  nextEvent?: ServerEvent | null;
};

interface TaskResponse {
  taskId: string;
  taskName: string;
  createdAt: string;
  updatedDt: string;
  events: ServerEvent[];
}

interface TaskRequest {
  taskName: string;
  taskId: string;
  events: ServerEvent[];
}

type EventInfoStorage = BaseStorage<EventInfo[]> & {
  addEvent: (event: Omit<EventInfo, 'uid'>) => Promise<void>;
  editEventInputValue: (eventId: string, inputValue: string) => Promise<void>;
  clearEvents: () => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  replayedEvent: (eventId: string, error?: boolean) => Promise<void>;
  resetReplayedEvents: () => Promise<void>;
  loadEventsFromServer: (taskId: string) => Promise<void>;
  saveEventsToServer: (taskName: string, taskId: string) => Promise<void>;
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
    const { selectedTaskId, selectedTaskName } = await taskInfoStorage.get();
    await storage.set([...(await storage.get()), newEvent]);
    if (selectedTaskId) {
      await eventInfoStorage.saveEventsToServer(
        selectedTaskName,
        selectedTaskId,
      );
    }
  },
  clearEvents: async () => {
    const { selectedTaskId, selectedTaskName } = await taskInfoStorage.get();
    await storage.set([]);
    if (selectedTaskId) {
      try {
        const response = await fetch(
          `https://api.fluiz.io/api/tasks/${selectedTaskId}/events`,
          {
            method: 'DELETE',
          },
        );
        if (!response.ok) throw new Error('Failed to clear events from server');
      } catch (e) {
        console.error('Failed to clear events from server', e);
        throw e;
      }
    }
  },
  editEventInputValue: async (eventId, inputValue) => {
    const { selectedTaskId, selectedTaskName } = await taskInfoStorage.get();
    const events = await storage.get();
    const eventIndex = events.findIndex(event => event.uid === eventId);
    if (eventIndex === -1) {
      return;
    }
    events[eventIndex].inputValue = inputValue;
    await storage.set(events);
    if (selectedTaskId) {
      try {
        const response = await fetch(
          `https://api.fluiz.io/api/tasks/${selectedTaskId}/events/${eventId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputValue }),
          },
        );
        if (!response.ok)
          throw new Error('Failed to edit event input value from server');
      } catch (e) {
        console.error('Failed to edit event input value from server', e);
        throw e;
      }
    }
  },
  deleteEvent: async eventId => {
    const { selectedTaskId, selectedTaskName } = await taskInfoStorage.get();
    await storage.set(
      (await storage.get()).filter(event => event.uid !== eventId),
    );
    try {
      const response = await fetch(
        `https://api.fluiz.io/api/tasks/${selectedTaskId}/events/${eventId}`,
        { method: 'DELETE' },
      );
      if (!response.ok) throw new Error('Failed to delete event from server');
    } catch (e) {
      console.error('Failed to delete event from server', e);
      throw e;
    }
  },
  replayedEvent: async (eventId, error) => {
    const events = await storage.get();
    const eventIndex = events.findIndex(event => event.uid === eventId);
    if (eventIndex === -1) {
      return;
    }
    if (error) {
      events[eventIndex].replayed = 'error';
    } else {
      events[eventIndex].replayed = true;
    }
    await storage.set(events);
  },
  resetReplayedEvents: async () => {
    const events = await storage.get();
    events.forEach(event => {
      event.replayed = false;
    });
    await storage.set(events);
  },
  loadEventsFromServer: async (taskId: string) => {
    try {
      const response = await fetch(`https://api.fluiz.io/api/tasks/${taskId}`);
      if (!response.ok) throw new Error('Failed to load events from server');
      const data: TaskResponse = await response.json();
      const flattenEvents = (
        event: ServerEvent | null,
        events: EventInfo[] = [],
      ): EventInfo[] => {
        while (event !== null) {
          const { nextEvent, ...restEvent } = event;
          events.push({ ...restEvent, replayed: false });
          event = nextEvent ? { ...nextEvent, replayed: false } : null;
        }
        return events;
      };

      const events: EventInfo[] = [];
      data.events.map(event => {
        flattenEvents(event, events);
      });
      await storage.set(events);
    } catch (error) {
      console.error('Failed to load events from server', error);
      throw error;
    }
  },
  saveEventsToServer: async (taskName: string, taskId: string) => {
    try {
      const events = await storage.get();
      const response = await fetch(`https://api.fluiz.io/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskName, taskId, events }),
      });
      if (!response.ok) throw new Error('Failed to save events to server');
    } catch (error) {
      console.error('Failed to save events to server', error);
      throw error;
    }
  },
};

export default eventInfoStorage;
