import { BaseStorage, StorageType, createStorage } from '@src/shared/storages/base';

type DocumentInfo = Record<string, string>[];

type DocumentInfoStorage = BaseStorage<DocumentInfo> & {
  newInfo: (info: DocumentInfo) => Promise<void>;
};

const storage = createStorage<DocumentInfo>('document-info-storage-key', [], {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const documentInfoStorage: DocumentInfoStorage = {
  ...storage,
  newInfo: async info => {
    await storage.set(info);
  },
};

export default documentInfoStorage;
