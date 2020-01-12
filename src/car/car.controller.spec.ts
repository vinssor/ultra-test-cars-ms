import { NotFoundException } from '@nestjs/common';
import { RecordDTO } from '../common/common.dto';
import { ManufacturerDTO } from '../manufacturer/manufacturer.dto';
import { ManufacturerService } from '../manufacturer/manufacturer.service';
import { CarController } from './car.controller';
import { CarDTO } from './car.dto';
import { CarService, ManufacturerNotFoundException } from './car.service';

describe('CarController', () => {
  let carController: CarController;
  let carService: CarService;
  let manufacturerService: ManufacturerService;

  beforeEach(async () => {
    manufacturerService = new ManufacturerService(null);
    carService = new CarService(null, manufacturerService);
    carController = new CarController(carService, manufacturerService);
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  describe('list', () => {
    it('should list same cars', () => {
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
        .spyOn(carService, 'values')
        .mockImplementationOnce(() => cars.values());
      expect(carController.list()).toEqual(cars);
    });
  });

  describe('read', () => {
    it('should read car', () => {
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
        .spyOn(carService, 'load')
        .mockImplementationOnce(id => (carRecord.id === id ? carRecord : null));
      expect(carController.read(carRecord.id)).toEqual(carRecord.payload);
    });
    it('car to read does not exist', () => {
      jest.spyOn(carService, 'load').mockImplementationOnce(id => null);
      expect(() => carController.read('1')).toThrowError(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create car', () => {
      const car: CarDTO = {
        manufacturerId: '1',
        price: 10,
        firstRegistrationDate: new Date(),
        owners: []
      };
      jest
        .spyOn(carService, 'add')
        .mockImplementationOnce(
          input => new RecordDTO(Math.random().toString(), input)
        );
      const result = carController.create(car);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.payload).toEqual(car);
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
        carController.create({
          manufacturerId: '1',
          price: 10,
          firstRegistrationDate: new Date(),
          owners: []
        })
      ).toThrowError(ManufacturerNotFoundException);
    });
  });

  describe('put', () => {
    it('should create car', () => {
      const carRecord: RecordDTO<string, CarDTO> = {
        id: '1',
        payload: {
          manufacturerId: '1',
          price: 10,
          firstRegistrationDate: new Date(),
          owners: []
        }
      };
      jest.spyOn(carService, 'store').mockImplementationOnce(input => false);
      // TODO find how to mock response !
      /*const result = carController.createOrUpdate(carRecord.id, carRecord.payload, null);
      expect(result).toBeDefined();*/
    });
  });

  describe('delete', () => {
    it('should delete car', () => {
      const spy = jest
        .spyOn(carService, 'remove')
        .mockImplementationOnce(id => true);
      carController.delete('1');
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith('1');
    });
    it('car to remove does not exist', () => {
      jest.spyOn(carService, 'remove').mockImplementationOnce(id => false);
      expect(() => carController.delete('1')).toThrowError(NotFoundException);
    });
  });
});
