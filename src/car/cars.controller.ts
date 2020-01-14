import { Controller, Get, UseFilters, UseInterceptors } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Crud, CrudRequest, CrudRequestInterceptor, ParsedRequest } from '@nestjsx/crud';
import { Manufacturer } from '../manufacturer/manufacturer.entity';
import { Car } from './car.entity';
import { CarsExceptionFilter } from './cars.exception-filter';
import { CarsService } from './cars.service';
import { Owner } from './owner.entity';

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
@UseFilters(CarsExceptionFilter)
@Controller('cars')
export class CarsController {
  constructor(public service: CarsService) { }

  @ApiResponse({ type: Manufacturer })
  @UseInterceptors(CrudRequestInterceptor)
  @Get(':id/manufacturer')
  async getCarManufacturer(
    @ParsedRequest() req: CrudRequest
  ): Promise<Manufacturer> {
    req.options.query.join.manufacturer = {
      eager: true
    };
    return this.service.getOne(req).then(car => car.manufacturer);
  }

  @ApiResponse({ type: Owner, isArray: true })
  @UseInterceptors(CrudRequestInterceptor)
  @Get(':id/owners')
  async getCarOwners(@ParsedRequest() req: CrudRequest): Promise<Owner[]> {
    req.options.query.join.owners = {
      eager: true
    };
    return this.service.getOne(req).then(car => car.owners);
  }
}
