import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { IsDateString, IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';
import { Column, Entity, Generated, JoinColumn, ManyToOne, PrimaryColumn, RelationId } from 'typeorm';
import { Car } from './car.entity';
import { Expose, Exclude } from 'class-transformer';

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
