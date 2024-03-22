import { BaseStorage, StorageType, createStorage } from './base';

type Modal = {
  description: string;
  isOpen: boolean;
  location: { x: number; y: number };
  value: string;
};

type ModalStorage = BaseStorage<Modal> & {
  change: (modal: Modal) => Promise<void>;
};

const storage = createStorage<Modal>(
  'modal-storage-key',
  {
    description: '',
    isOpen: false,
    location: { x: 0, y: 0 },
    value: '',
  },
  {
    liveUpdate: true,
    storageType: StorageType.Local,
  },
);

const modalStorage: ModalStorage = {
  ...storage,
  change: async modal => {
    await storage.set(modal);
  },
};

export default modalStorage;
