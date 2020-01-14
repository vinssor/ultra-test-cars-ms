import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { Exclude, Type } from 'class-transformer';
import { IsDateString, IsDefined, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { BaseEntity, Column, Entity, Generated, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, RelationId } from 'typeorm';
import { Manufacturer } from '../manufacturer/manufacturer.entity';
import { Owner } from './owner.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity()
export class Car extends BaseEntity {
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
  @MaxLength(36)
  @RelationId((car: Car) => car.manufacturer)
  @Column({ nullable: false, width: 36 })
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
