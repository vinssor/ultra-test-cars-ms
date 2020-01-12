import { RecordDTO } from '../common/common.dto';
import { ManufacturerService } from '../manufacturer/manufacturer.service';
import { CarDTO } from './car.dto';
import { CarRepository } from './car.repository';
import { CarService, ManufacturerNotFoundException } from './car.service';

class MockCarRepository implements CarRepository {
  values(): IterableIterator<RecordDTO<string, CarDTO>> {
    throw new Error('Method not implemented.');
  }
  get(id: string): RecordDTO<string, CarDTO> {
    throw new Error('Method not implemented.');
  }
  insert(payload: CarDTO): RecordDTO<string, CarDTO> {
    throw new Error('Method not implemented.');
  }
  update(id: string, fields: Partial<CarDTO>): RecordDTO<string, CarDTO> {
    throw new Error('Method not implemented.');
  }
  upsert(record: RecordDTO<string, CarDTO>): boolean {
    throw new Error('Method not implemented.');
  }
  delete(id: string): boolean {
    throw new Error('Method not implemented.');
  }
}

describe('CarService', () => {
  let carRepository: CarRepository;
  let manufacturerService: ManufacturerService;
  let carService: CarService;

  beforeEach(async () => {
    carRepository = new MockCarRepository();
    manufacturerService = new ManufacturerService(null);
    carService = new CarService(carRepository, manufacturerService);
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  describe('values', () => {
    it('should return same cars', () => {
      const cars: RecordDTO<string, CarDTO>[] = [
        {
          id: '1',
          payload: {
            manufacturerId: '1',
            price: 10,
            firstRegistrationDate: new Date(),
            owners: []
          }
        }
      ];
      jest
        .spyOn(carRepository, 'values')
        .mockImplementationOnce(() => cars.values());
      const result = carService.values();
      expect(result).toBeDefined();
      expect(Array.from(result)).toEqual(cars);
    });
  });

  describe('load', () => {
    it('should load car', () => {
      const carRecord: RecordDTO<string, CarDTO> = {
        id: '1',
        payload: {
          manufacturerId: '1',
          price: 10,
          firstRegistrationDate: new Date(),
          owners: []
        }
      };
      jest
        .spyOn(carRepository, 'get')
        .mockImplementationOnce(id => (carRecord.id === id ? carRecord : null));
      expect(carService.load(carRecord.id)).toEqual(carRecord);
    });
    it('car to load does not exist', () => {
      jest.spyOn(carRepository, 'get').mockImplementationOnce(id => null);
      expect(carService.load('1')).toBeFalsy();
    });
  });

  describe('add', () => {
    it('should add car', () => {
      const car: CarDTO = {
        manufacturerId: '1',
        price: 10,
        firstRegistrationDate: new Date(),
        owners: []
      };
      jest
        .spyOn(manufacturerService, 'load')
        .mockImplementationOnce(id =>
          car.manufacturerId === id
            ? { id: car.manufacturerId, payload: { name: 'Test' } }
            : null
        );
      jest
        .spyOn(carRepository, 'insert')
        .mockImplementationOnce(
          input => new RecordDTO(Math.random().toString(), input)
        );
      const result = carService.add(car);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.payload).toEqual(car);
    });
    it('manufacturer not found', () => {
      const car: CarDTO = {
        manufacturerId: '1',
        price: 10,
        firstRegistrationDate: new Date(),
        owners: []
      };
      jest
        .spyOn(manufacturerService, 'load')
        .mockImplementationOnce(() => null);
      expect(() =>
        carService.add({
          manufacturerId: '1',
          price: 10,
          firstRegistrationDate: new Date(),
          owners: []
        })
      ).toThrowError(ManufacturerNotFoundException);
    });
  });

  describe('store', () => {
    it('should store new car', () => {
      const car: CarDTO = {
        manufacturerId: '1',
        price: 10,
        firstRegistrationDate: new Date(),
        owners: []
      };
      const carRecord: RecordDTO<string, CarDTO> = {
        id: '1',
        payload: car
      };
      jest
        .spyOn(manufacturerService, 'load')
        .mockImplementationOnce(id =>
          car.manufacturerId === id
            ? { id: car.manufacturerId, payload: { name: 'Test' } }
            : null
        );
      jest
        .spyOn(carRepository, 'upsert')
        .mockImplementationOnce(input => false);
      expect(carService.store(carRecord)).toBeFalsy();
    });
    it('should store up-to-date car', () => {
      const car: CarDTO = {
        manufacturerId: '1',
        price: 10,
        firstRegistrationDate: new Date(),
        owners: []
      };
      const carRecord: RecordDTO<string, CarDTO> = {
        id: '1',
        payload: car
      };
      jest
        .spyOn(manufacturerService, 'load')
        .mockImplementationOnce(id =>
          car.manufacturerId === id
            ? { id: car.manufacturerId, payload: { name: 'Test' } }
            : null
        );
      jest
        .spyOn(carRepository, 'upsert')
        .mockImplementationOnce(input => input.id === carRecord.id);
      expect(carService.store(carRecord)).toBeTruthy();
    });
    it('manufacturer does not exist', () => {
      const car: CarDTO = {
        manufacturerId: '1',
        price: 10,
        firstRegistrationDate: new Date(),
        owners: []
      };
      jest
        .spyOn(manufacturerService, 'load')
        .mockImplementationOnce(() => null);
      expect(() =>
        carService.store({
          id: '1',
          payload: {
            manufacturerId: '1',
            price: 10,
            firstRegistrationDate: new Date(),
            owners: []
          }
        })
      ).toThrowError(ManufacturerNotFoundException);
    });
  });

  describe('merge', () => {
    it('should merge car', () => {
      const car: CarDTO = {
        manufacturerId: '1',
        price: 10,
        firstRegistrationDate: new Date(),
        owners: []
      };
      const carRecord: RecordDTO<string, CarDTO> = {
        id: '1',
        payload: car
      };
      jest
        .spyOn(manufacturerService, 'load')
        .mockImplementationOnce(id =>
          car.manufacturerId === id
            ? { id: car.manufacturerId, payload: { name: 'Test' } }
            : null
        );
      jest
        .spyOn(carRepository, 'update')
        .mockImplementationOnce((id, input) =>
          carRecord.id === id
            ? new RecordDTO(id, { ...carRecord.payload, ...input })
            : null
        );
      expect(carService.merge(carRecord.id, carRecord.payload)).toEqual(
        carRecord
      );
    });
    it('car to merge does not exist', () => {
      const car: CarDTO = {
        manufacturerId: '1',
        price: 10,
        firstRegistrationDate: new Date(),
        owners: []
      };
      const carRecord: RecordDTO<string, CarDTO> = {
        id: '1',
        payload: car
      };
      jest
        .spyOn(manufacturerService, 'load')
        .mockImplementationOnce(id =>
          car.manufacturerId === id
            ? { id: car.manufacturerId, payload: { name: 'Test' } }
            : null
        );
      jest.spyOn(carRepository, 'update').mockImplementationOnce(() => null);
      expect(carService.merge(carRecord.id, carRecord.payload)).toBeFalsy();
    });
    it('manufacturer does not exist', () => {
      const car: CarDTO = {
        manufacturerId: '1',
        price: 10,
        firstRegistrationDate: new Date(),
        owners: []
      };
      jest
        .spyOn(manufacturerService, 'load')
        .mockImplementationOnce(() => null);
      expect(() =>
        carService.store({
          id: '1',
          payload: {
            manufacturerId: '1',
            price: 10,
            firstRegistrationDate: new Date(),
            owners: []
          }
        })
      ).toThrowError(ManufacturerNotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove car', () => {
      const id = '1';
      jest
        .spyOn(carRepository, 'delete')
        .mockImplementationOnce(input => input === id);
      expect(carService.remove(id)).toBeTruthy();
    });
    it('car to remove does not exist', () => {
      jest
        .spyOn(carRepository, 'delete')
        .mockImplementationOnce(input => false);
      expect(carService.remove('1')).toBeFalsy();
    });
  });
});
