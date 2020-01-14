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
      username: 'ms',
      password: 'secret',
      database: 'cars',
      entities: [Manufacturer, Owner, Car],
      synchronize: true
    })
  ]
})
export class OrmModule {}
