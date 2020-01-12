import { RecordDTO } from './common.dto';
import {
  InMemoryRepository,
  StringIdGenerator
} from './common.repository.inmemory';

describe('InMemoryRepository', () => {
  const records: RecordDTO<string, string>[] = [
    {
      id: '1',
      payload: 'a'
    },
    {
      id: '2',
      payload: 'b'
    },
    {
      id: '3',
      payload: 'c'
    }
  ];
  let idGenerator: StringIdGenerator;
  let repository: InMemoryRepository<string, string>;

  beforeEach(async () => {
    idGenerator = new StringIdGenerator();
    repository = new InMemoryRepository(idGenerator, records);
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  describe('values', () => {
    it('should return same records', () => {
      const result = repository.values();
      expect(result).toBeDefined();
      expect(Array.from(result)).toEqual(records);
    });
  });

  describe('get', () => {
    it('should get record', () => {
      records.forEach(record =>
        expect(repository.get(record.id)).toEqual(record)
      );
    });
    it('record to get does not exist', () => {
      expect(repository.get('-1')).toBeFalsy();
    });
  });

  describe('insert', () => {
    it('should insert payload', () => {
      const payload = 'z';
      const storedRecord = repository.insert(payload);
      expect(storedRecord).toBeDefined();
      expect(storedRecord.id).toBeDefined();
      expect(storedRecord.payload).toEqual(payload);
      expect(repository.get(storedRecord.id)).toEqual(storedRecord);
      expect(
        Array.from(repository.values()).find(input => input.payload === payload)
      ).toEqual(storedRecord);
    });
  });

  describe('upsert', () => {
    it('should insert record', () => {
      const record: RecordDTO<string, string> = {
        id: '100',
        payload: 'z'
      };
      expect(repository.upsert(record)).toBeFalsy();
      expect(repository.get(record.id)).toEqual(record);
      expect(
        Array.from(repository.values()).find(input => input.id === record.id)
      ).toEqual(record);
    });
    it('should update record', () => {
      const record: RecordDTO<string, string> = {
        id: '1',
        payload: 'z'
      };
      expect(repository.upsert(record)).toBeTruthy();
      expect(repository.get(record.id)).toEqual(record);
      expect(
        Array.from(repository.values()).find(input => input.id === record.id)
      ).toEqual(record);
    });
  });

  describe('update', () => {
    it('should update record', () => {
      const id = '1';
      const payload = 'z';
      const storedRecord = repository.update(id, payload);
      expect(storedRecord?.id).toEqual(id);
      expect(storedRecord?.payload).toEqual(payload);
      expect(repository.get(id)).toEqual(storedRecord);
      expect(
        Array.from(repository.values()).find(input => input.id === id)
      ).toEqual(storedRecord);
    });
    it('record to update does not exist', () => {
      const payload = 'z';
      expect(repository.update('-1', payload)).toBeFalsy();
      expect(
        Array.from(repository.values()).findIndex(
          input => input.payload === payload
        )
      ).toBeLessThan(0);
    });
  });

  describe('delete', () => {
    it('should delete record', () => {
      const id = '1';
      expect(repository.delete(id)).toBeTruthy();
      expect(
        Array.from(repository.values()).findIndex(input => input.id === id)
      ).toBeLessThan(0);
    });
    it('record to update does not exist', () => {
      expect(repository.delete('-1')).toBeFalsy();
    });
  });
});
