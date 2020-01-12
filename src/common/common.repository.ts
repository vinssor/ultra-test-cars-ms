import { RecordDTO } from './common.dto';

/**
 * A repository of records based on id and payload types.
 */
export interface Repository<I, P> {
  /**
   * Returns a record by the given id or null if not found
   * @param id the requested record id
   */
  get(id: I): RecordDTO<I, P>;

  /**
   * Inserts a record with the given payload
   * @param payload the payload to insert
   * @returns the inserted record
   */
  insert(payload: P): RecordDTO<I, P>;

  /**
   * Updates a record with the given id
   * @param id the id of the record to update
   * @param fields the up-to-date payload fields
   * @returns the updated record or null if not found
   */
  update(id: I, fields: Partial<P>): RecordDTO<I, P>;

  /**
   * Updates or inserts a record
   * @param record the record to update or insert
   * @returns true if the record has been upated, or false if the record has been inserted
   */
  upsert(record: RecordDTO<I, P>): boolean;

  /**
   * Deletes a record
   * @param id the id of the record to delete
   * @returns true if a record existed and has been removed, or false if the record does not exist
   */
  delete(id: I): boolean;
}
