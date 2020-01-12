import {
  ArgumentsHost,
  BadRequestException,
  Body,
  Catch,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Res,
  UseFilters
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiTags
} from '@nestjs/swagger';
import { Response } from 'express';
import { RecordDTO } from '../common/common.dto';
import { ManufacturerDTO } from '../manufacturer/manufacturer.dto';
import { ManufacturerService } from '../manufacturer/manufacturer.service';
import { CarDTO } from './car.dto';
import { CarService, ManufacturerNotFoundException } from './car.service';

@Catch(ManufacturerNotFoundException)
class CarExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (exception instanceof ManufacturerNotFoundException) {
      exception = new BadRequestException(
        `No manufacturer found with id [${exception.id}]`
      );
    }
    super.catch(exception, host);
  }
}

class CarRecordDTO {
  @ApiProperty()
  readonly id: string;
  @ApiProperty()
  readonly payload: CarDTO;
}

@UseFilters(CarExceptionFilter)
@ApiTags('cars')
@Controller('cars')
export class CarController {
  constructor(
    private readonly carService: CarService,
    private readonly manufacturerService: ManufacturerService
  ) {}

  @ApiOkResponse({
    type: CarRecordDTO,
    isArray: true
  })
  @Get()
  list(): RecordDTO<string, CarDTO>[] {
    return Array.from(this.carService.values());
  }

  @ApiNotFoundResponse()
  @ApiOkResponse({
    type: CarDTO
  })
  @Get(':id')
  read(@Param('id') id: string): CarDTO {
    const carRecord = this.carService.load(id);
    if (!carRecord) {
      throw new NotFoundException();
    }
    return carRecord.payload;
  }

  @ApiNotFoundResponse()
  @ApiOkResponse({
    type: ManufacturerDTO
  })
  @Get(':id/manufacturer')
  readManufacturer(@Param('id') id: string): ManufacturerDTO {
    const manufacturerRecord = this.manufacturerService.load(
      this.read(id).manufacturerId
    );
    if (!manufacturerRecord) {
      throw new NotFoundException();
    }
    return manufacturerRecord.payload;
  }

  @ApiBadRequestResponse()
  @ApiCreatedResponse({ type: CarRecordDTO })
  @Post()
  create(@Body() car: CarDTO): RecordDTO<string, CarDTO> {
    return this.carService.add(car);
  }

  @ApiBadRequestResponse()
  @ApiOkResponse()
  @ApiCreatedResponse()
  @Put(':id')
  createOrUpdate(
    @Param('id') id: string,
    @Body() car: CarDTO,
    @Res() response: Response
  ): void {
    const carRecord = new RecordDTO(id, car);
    if (this.carService.store(carRecord)) {
      response.status(HttpStatus.OK).send();
    } else {
      response.status(HttpStatus.CREATED).send();
    }
  }

  @ApiNotFoundResponse()
  @ApiOkResponse()
  @Delete(':id')
  delete(@Param('id') id: string): void {
    if (!this.carService.remove(id)) {
      throw new NotFoundException();
    }
  }
}
