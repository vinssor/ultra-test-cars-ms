import { Inject, Injectable } from '@nestjs/common';
import { RecordDTO } from 'src/common/common.dto';
import { ManufacturerService } from '../manufacturer/manufacturer.service';
import { CarDTO } from './car.dto';
import { CarRepository, CarRepositoryToken } from './car.repository';

export class ManufacturerNotFoundException extends Error {
  constructor(readonly id: string) {
    super(id);
    this.id = id;
    this.name = this.constructor.name;
  }
}

@Injectable()
export class CarService {
  constructor(
    @Inject(CarRepositoryToken)
    private readonly carResposiory: CarRepository,
    private readonly manufacturerService: ManufacturerService
  ) {}

  private doValidateInputCar(car: Partial<CarDTO>, partial: boolean) {
    if (
      (!partial || car.manufacturerId) &&
      !this.manufacturerService.load(car.manufacturerId)
    ) {
      throw new ManufacturerNotFoundException(car.manufacturerId);
    }
  }

  private validatePartialInputCar(car: Partial<CarDTO>) {
    this.doValidateInputCar(car, true);
  }

  private validateInputCar(car: CarDTO) {
    this.doValidateInputCar(car, false);
  }

  /**
   * Returns an iterable of car records
   */
  values(): IterableIterator<RecordDTO<string, CarDTO>> {
    return this.carResposiory.values();
  }

  /**
   * Loads a car record
   * @param id the requested car record id
   * @returns the car record with gieven id, or null if the record does not exist
   */
  load(id: string): RecordDTO<string, CarDTO> {
    return this.carResposiory.get(id);
  }

  /**
   * Adds a car
   * @param car the car to add
   * @returns the added car record
   * @throws a ManufacturerNotFoundException if car.manufacturerId does not match any manufacturer
   */
  add(car: CarDTO): RecordDTO<string, CarDTO> {
    this.validateInputCar(car);
    return this.carResposiory.insert(car);
  }

  /**
   * Stores a car record
   * @param carRecord the car record to store
   * @returns true if a car record has been updated, or false if the car record has been added
   * @throws a ManufacturerNotFoundException if car.manufacturerId does not match any manufacturer
   */
  store(carRecord: RecordDTO<string, CarDTO>): boolean {
    this.validateInputCar(carRecord.payload);
    return this.carResposiory.upsert(carRecord);
  }

  /**
   * Merges a car record with given car fields
   * @param id the car record id to merge with
   * @param car the car to merge with record
   * @returns the up-to-date car record
   * @throws a ManufacturerNotFoundException if car.manufacturerId does not match any manufacturer
   */
  merge(id: string, car: Partial<CarDTO>): RecordDTO<string, CarDTO> {
    this.validatePartialInputCar(car);
    return this.carResposiory.update(id, car);
  }

  /**
   * Removes a car record
   * @param id the car record id to remove
   * @returns true if a car record existed and has been removed, or false if the record does not exist
   */
  remove(id: string): boolean {
    return this.carResposiory.delete(id);
  }
}
