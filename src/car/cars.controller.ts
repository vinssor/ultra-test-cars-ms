import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation
} from '@nestjs/swagger';
import {
  Crud,
  CrudRequest,
  CrudRequestInterceptor,
  ParsedRequest
} from '@nestjsx/crud';
import { Manufacturer } from '../manufacturer/manufacturer.entity';
import { DuplicateEntityError } from '../orm/orm.error-transformer';
import { Car } from './car.entity';
import { CarsService } from './cars.service';
import { JobDto } from './job.dto';
import { NoManufacturerFoundError } from './no-manufacturer-found.error';

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

  @ApiOperation({ summary: 'Retrieve one Manufacturer associated with a Car' })
  @ApiOkResponse({ type: Manufacturer })
  @ApiNotFoundResponse()
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

  @ApiOperation({ summary: 'Create one Job' })
  @ApiCreatedResponse({
    type: JobDto
  })
  @Post('jobs')
  async createCarJob(): Promise<JobDto> {
    return this.service.createJob();
  }

  @ApiOperation({ summary: 'Retrieve many Jobs' })
  @ApiOkResponse({
    type: JobDto,
    isArray: true
  })
  @Get('jobs')
  async listCarJob(): Promise<Array<JobDto>> {
    return this.service.listJobs();
  }

  @ApiOperation({ summary: 'Retrieve one Job' })
  @ApiOkResponse({
    type: JobDto
  })
  @ApiNotFoundResponse()
  @Get('jobs/:id')
  async getCarJob(@Param('id') id: string): Promise<JobDto> {
    return this.service
      .getOneJob(id)
      .then(job => (job ? job : Promise.reject(new NotFoundException())));
  }
}
