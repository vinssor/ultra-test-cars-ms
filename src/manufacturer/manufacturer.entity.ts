import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  MaxLength
} from 'class-validator';
import { Column, Entity, Generated, PrimaryColumn } from 'typeorm';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity()
export class Manufacturer {
  @ApiPropertyOptional()
  @IsOptional({ always: true })
  @IsString({ always: true })
  @MaxLength(36)
  @PrimaryColumn()
  @Generated('uuid')
  id: string;

  @ApiProperty()
  @IsNotEmpty({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @IsString({ always: true })
  @Column({ nullable: false, unique: true })
  name: string;

  @ApiPropertyOptional()
  @IsOptional({ always: true })
  @IsPhoneNumber('ZZ', { always: true })
  @Column({ nullable: true, default: null })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional({ always: true })
  @IsInt({ always: true })
  @IsPositive({ always: true })
  @Column({ nullable: true, default: null })
  siret?: number;
}
