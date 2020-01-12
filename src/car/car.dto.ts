import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  ValidateNested
} from 'class-validator';
import { ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';

export class OwnerDTO {
  @ApiProperty()
  @IsNotEmpty()
  readonly id: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty()
  @IsDateString()
  readonly purchaseDate: Date;
}

export class CarDTO {
  @ApiProperty()
  @IsNotEmpty()
  readonly manufacturerId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly price: number;

  @ApiProperty()
  @IsDateString()
  readonly firstRegistrationDate: Date;

  @ApiProperty({ type: OwnerDTO, isArray: true })
  @ValidateNested()
  @IsArray()
  readonly owners: OwnerDTO[];
}
