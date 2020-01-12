import { IsInt, IsNotEmpty, IsPhoneNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManufacturerDTO {
  @ApiProperty()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty()
  @IsPhoneNumber('ZZ')
  readonly phone?: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  readonly siret?: number;
}
