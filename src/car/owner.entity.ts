import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty
} from '@nestjs/swagger';
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
  ManyToOne,
  PrimaryColumn,
  Unique,
  JoinColumn,
  RelationId,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Car } from './car.entity';
import { Exclude } from 'class-transformer';

const { CREATE, UPDATE } = CrudValidationGroups;

@Unique('uc_car_ownername', ['carId', 'name'])
@Entity()
export class Owner {
  @ApiPropertyOptional()
  @IsOptional({ always: true })
  @IsString({ always: true })
  @MaxLength(36)
  @PrimaryColumn({ update: false })
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

  @ApiHideProperty()
  @RelationId((owner: Owner) => owner.car)
  @PrimaryColumn({ nullable: false, width: 36, update: false })
  carId?: string;

  @ApiHideProperty()
  @Exclude()
  @ManyToOne(
    type => Car,
    car => car.owners,
    {
      nullable: false,
      primary: true,
      cascade: false,
      onDelete: 'CASCADE'
    }
  )
  car?: Car;
}
