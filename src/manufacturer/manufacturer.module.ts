import { Module } from '@nestjs/common';
import {
  ManufacturerRepository,
  ManufacturerRepositoryToken
} from './manufacturer.repository';
import { InMemoryManufacturerRepository } from './manufacturer.repository.inmemory';
import { ManufacturerService } from './manufacturer.service';

@Module({
  imports: [ManufacturerModule],
  providers: [
    {
      provide: ManufacturerRepositoryToken,
      useValue: new InMemoryManufacturerRepository([
        { id: '1', payload: { name: 'Volkswagen' } },
        { id: '2', payload: { name: 'Toyota' } },
        { id: '3', payload: { name: 'Renault' } }
      ])
    },
    ManufacturerService
  ],
  exports: [ManufacturerService]
})
export class ManufacturerModule {}
