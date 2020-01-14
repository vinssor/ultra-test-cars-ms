import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { Type, Exclude } from 'class-transformer';
import {
  IsDateString,
  IsDefined,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString
} from 'class-validator';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId
} from 'typeorm';
import { Manufacturer } from '../manufacturer/manufacturer.entity';
import { Owner } from './owner.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity()
export class Car extends BaseEntity {
  @ApiPropertyOptional()
  @IsOptional({ always: true })
  @IsString({ always: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @IsString({ always: true })
  @RelationId((car: Car) => car.manufacturer)
  @Column({ nullable: false })
  manufacturerId: string;

  @ManyToOne(
    type => Manufacturer,
    manufacturer => manufacturer.id,
    {
      nullable: false
    }
  )
  @JoinColumn()
  manufacturer: Manufacturer;

  @ApiProperty()
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @IsNumber({}, { always: true })
  @IsPositive({ always: true })
  @Column()
  price: number;

  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  @Column({ default: false })
  reduced: boolean;

  @ApiProperty()
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @IsDateString({ always: true })
  @Column()
  firstRegistrationDate: Date;

  @ApiPropertyOptional({ type: Owner })
  @OneToMany(
    () => Owner,
    owner => owner.car,
    {
      cascade: true
    }
  )
  @Type(() => Owner)
  owners: Owner[];
}
