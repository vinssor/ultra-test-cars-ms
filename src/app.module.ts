import { Module } from '@nestjs/common';
import { CarsModule } from './car/cars.module';
import { ManufacturersModule } from './manufacturer/manufacturers.module';
import { OrmModule } from './orm/orm.module';

@Module({
  imports: [OrmModule, ManufacturersModule, CarsModule]
})
export class AppModule {}
