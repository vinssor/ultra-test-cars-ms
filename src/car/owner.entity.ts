import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { IsDateString, IsDefined, IsOptional, IsString } from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Car } from './car.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity()
export class Owner {
  @ApiPropertyOptional()
  @IsOptional({ always: true })
  @IsString({ always: true })
  @PrimaryGeneratedColumn('uuid')
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
  @JoinColumn({ name: 'carId' })
  car: Car;
}
