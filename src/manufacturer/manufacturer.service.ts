import { Injectable, Inject } from '@nestjs/common';
import { ManufacturerDTO } from './manufacturer.dto';
import {
  ManufacturerRepository,
  ManufacturerRepositoryToken
} from './manufacturer.repository';
import { RecordDTO } from '../common/common.dto';

@Injectable()
export class ManufacturerService {
  constructor(
    @Inject(ManufacturerRepositoryToken)
    private readonly manufacturerRepository: ManufacturerRepository
  ) {}

  /**
   * Loads a manufacturer record
   * @param id the requested manufacturer record id
   * @returns the manufacturer record with gieven id, or null if the record does not exist
   */
  load(id: string): RecordDTO<string, ManufacturerDTO> {
    return this.manufacturerRepository.get(id);
  }
}
