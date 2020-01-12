import { ManufacturerDTO } from './manufacturer.dto';
import { Repository } from '../common/common.repository';
import { RecordDTO } from '../common/common.dto';

export const ManufacturerRepositoryToken: string = 'ManufacturerRepository';
export interface ManufacturerRepository
  extends Repository<string, ManufacturerDTO> {
  /**
   * Returns an iterable of manufacturer records stored into this repository
   */
  values(): IterableIterator<RecordDTO<string, ManufacturerDTO>>;
}
