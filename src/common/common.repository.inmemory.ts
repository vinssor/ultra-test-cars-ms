import { RecordDTO } from './common.dto';
import { Repository } from './common.repository';

export interface HasId<I> {
  (id: I): boolean;
}

export interface IdGenerator<I> {
  generateId(hasId: HasId<I>): I;
}

export class StringIdGenerator implements IdGenerator<string> {
  private inc: number = 0;

  private nextId(): string {
    this.inc++;
    return this.inc.toString(16);
  }

  generateId(hasId: HasId<string>): string {
    let id = this.nextId();
    while (hasId(id)) {
      id = this.nextId();
    }
    return id;
  }
}

export class InMemoryRepository<I, P> implements Repository<I, P> {
  private readonly records: Map<I, RecordDTO<I, P>> = new Map();
  private payloadObjectTypeChecked: boolean;
  private payloadObjectType: boolean;
  constructor(
    readonly idGenerator: IdGenerator<I>,
    values?: RecordDTO<I, P>[]
  ) {
    this.payloadObjectTypeChecked = false;
    this.payloadObjectType = false;
    if (values) {
      values.forEach(element => {
        this.resolvePayloadObjectType(element.payload);
        this.records.set(element.id, element);
      });
    }
  }

  private resolvePayloadObjectType(payload: P): void {
    if (!this.payloadObjectTypeChecked) {
      this.payloadObjectType = typeof payload === 'object';
      this.payloadObjectTypeChecked = true;
    }
  }

  private isPayloadObjectType(payload: P): boolean {
    this.resolvePayloadObjectType(payload);
    return this.payloadObjectType;
  }

  private updateRecordPayload(
    record: RecordDTO<I, P>,
    payload: Partial<P>
  ): RecordDTO<I, P> {
    if (!this.isPayloadObjectType(record.payload)) {
      return new RecordDTO(record.id, <P>payload);
    }
    return new RecordDTO(record.id, { ...record.payload, ...payload });
  }

  private generateId(): I {
    return this.idGenerator.generateId(id => this.records.has(id));
  }

  /**
   * Returns an iterable of records stored into this repository
   */
  values(): IterableIterator<RecordDTO<I, P>> {
    return this.records.values();
  }

  /** @inheritdoc */
  get(id: I): RecordDTO<I, P> {
    return this.records.get(id);
  }

  /** @inheritdoc */
  insert(car: P): RecordDTO<I, P> {
    const storedCar = new RecordDTO(this.generateId(), car);
    this.records.set(storedCar.id, storedCar);
    return storedCar;
  }

  /** @inheritdoc */
  upsert(record: RecordDTO<I, P>): boolean {
    let storedRecord = this.records.get(record.id);
    let updated: boolean;
    if (storedRecord != null) {
      storedRecord = this.updateRecordPayload(storedRecord, record.payload);
      updated = true;
    } else {
      storedRecord = record;
      updated = false;
    }
    this.records.set(storedRecord.id, storedRecord);
    return updated;
  }

  /** @inheritdoc */
  update(id: I, fields: Partial<P>): RecordDTO<I, P> {
    let storedRecord = this.records.get(id);
    if (!storedRecord) {
      return null;
    }
    storedRecord = this.updateRecordPayload(storedRecord, fields);
    this.records.set(storedRecord.id, storedRecord);
    return storedRecord;
  }

  /** @inheritdoc */
  delete(id: I): boolean {
    return this.records.delete(id);
  }
}
