import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  Controller,
  Get,
  UseFilters,
  UseInterceptors,
  ConflictException
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ApiResponse } from '@nestjs/swagger';
import {
  Crud,
  CrudRequest,
  CrudRequestInterceptor,
  ParsedRequest
} from '@nestjsx/crud';
import { Manufacturer } from '../manufacturer/manufacturer.entity';
import { Car } from './car.entity';
import { CarsService } from './cars.service';
import { NoManufacturerFoundError } from './no-manufacturer-found.error';
import { Owner } from './owner.entity';
import { DuplicateEntityError } from '../orm/orm.error-transformer';

@Catch(DuplicateEntityError)
class DuplicateEntityExceptionFilter extends BaseExceptionFilter {
  catch(exception: DuplicateEntityError, host: ArgumentsHost) {
    super.catch(
      new ConflictException(
        `A car with id [${exception.parameters[0]}] already exists`
      ),
      host
    );
  }
}

@Catch(NoManufacturerFoundError)
class NoManufacturerExceptionFilter extends BaseExceptionFilter {
  catch(exception: NoManufacturerFoundError, host: ArgumentsHost) {
    super.catch(
      new BadRequestException(
        `No manufacturer found with given id [${exception.id}]`
      ),
      host
    );
  }
}

@Crud({
  model: {
    type: Car
  },
  validation: {
    transform: true
  },
  params: {
    id: {
      field: 'id',
      type: 'string',
      primary: true
    }
  },
  query: {
    join: {
      manufacturers: {
        eager: false
      },
      owners: {
        eager: true
      }
    }
  }
})
@UseFilters(NoManufacturerExceptionFilter, DuplicateEntityExceptionFilter)
@Controller('cars')
export class CarsController {
  constructor(public service: CarsService) {}

  @ApiResponse({ type: Manufacturer })
  @UseInterceptors(CrudRequestInterceptor)
  @Get(':id/manufacturer')
  async getCarManufacturer(
    @ParsedRequest() req: CrudRequest
  ): Promise<Manufacturer> {
    const eagerRequest: CrudRequest = {
      ...req,
      ...{ options: { query: { join: { manufacturer: { eager: true } } } } }
    };
    return this.service.getOne(eagerRequest).then(car => car.manufacturer);
  }
}
