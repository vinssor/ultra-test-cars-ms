import { Test } from '@nestjs/testing';
import { Connection } from 'typeorm';
import { CarsErrorTransformer } from './cars.error-transformer';
import { EntityRelationError } from '../orm/orm.error-transformer';
import { NoManufacturerFoundError } from './no-manufacturer-found.error';

describe('CarsErrorTransformer', () => {
  const MockConnection = jest.fn(() => ({
    options: {
      type: 'mysql'
    }
  }));
  let carsErrorTransformer: CarsErrorTransformer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        { provide: Connection, useClass: MockConnection },
        CarsErrorTransformer
      ]
    }).compile();

    carsErrorTransformer = module.get<CarsErrorTransformer>(
      CarsErrorTransformer
    );
  });

  describe('Overall errors', () => {
    it('Unsupported error', () => {
      const error = {};
      const mappedError = carsErrorTransformer.transform(error);
      expect(mappedError).toEqual(error);
    });
    it('Unsupported Entity Relation', () => {
      const error = new EntityRelationError('unsupportedField');
      const mappedError = carsErrorTransformer.transform(error);
      expect(mappedError).toEqual(error);
    });
  });

  describe('No manufacturer found', () => {
    it('without parameters', () => {
      const mappedError = carsErrorTransformer.transform(
        new EntityRelationError('manufacturerId')
      );
      expect(mappedError).toBeDefined();
      expect(mappedError).toBeInstanceOf(NoManufacturerFoundError);
      const noManufacturerFoundError: NoManufacturerFoundError = <
        NoManufacturerFoundError
      >mappedError;
      expect(noManufacturerFoundError.id).toBeUndefined();
    });
    it('with parameters', () => {
      const mappedError = carsErrorTransformer.transform(
        new EntityRelationError('manufacturerId', ['a', 'b'])
      );
      expect(mappedError).toBeDefined();
      expect(mappedError).toBeInstanceOf(NoManufacturerFoundError);
      const noManufacturerFoundError: NoManufacturerFoundError = <
        NoManufacturerFoundError
      >mappedError;
      expect(noManufacturerFoundError.id).toEqual('b');
    });
  });
});
