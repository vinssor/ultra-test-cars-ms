import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import {
  IsDateString,
  IsDefined,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator';
import {
  Column,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm';
import { Car } from './car.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity()
export class Owner {
  @ApiPropertyOptional()
  @IsOptional({ always: true })
  @IsString({ always: true })
  @MaxLength(36)
  @PrimaryColumn()
  @Generated('uuid')
  id: string;

  @ApiProperty()
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @IsString({ always: true })
  @Column()
  name: string;

  @ApiProperty()
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @IsDateString({ always: true })
  @Column()
  purchaseDate: Date;

  @ManyToOne(
    type => Car,
    car => car.owners,
    {
      nullable: false
    }
  )
  @JoinColumn()
  car?: Car;
}
