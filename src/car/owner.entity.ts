import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional
} from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { Exclude } from 'class-transformer';
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
  PrimaryColumn,
  RelationId
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

  @ApiHideProperty()
  @Exclude()
  @RelationId((owner: Owner) => owner.car)
  @PrimaryColumn({ nullable: false, width: 36 })
  carId?: string;

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
