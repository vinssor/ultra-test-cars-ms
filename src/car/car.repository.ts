import { RecordDTO } from '../common/common.dto';
import { Repository } from '../common/common.repository';
import { CarDTO } from './car.dto';

export const CarRepositoryToken: string = 'CarRepository';

export interface CarRepository extends Repository<string, CarDTO> {
  /**
   * Returns an iterable of car records stored into this repository
   */
  values(): IterableIterator<RecordDTO<string, CarDTO>>;
}
