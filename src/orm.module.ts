import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Car } from './car/car.entity';
import { Owner } from './car/owner.entity';
import { Manufacturer } from './manufacturer/manufacturer.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 13306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [Manufacturer, Owner, Car],
      synchronize: true
    })
  ]
})
export class OrmModule {}
