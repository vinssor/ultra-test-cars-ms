import { Module } from '@nestjs/common';
import { CarModule } from './car/car.module';
import { ManufacturerModule } from './manufacturer/manufacturer.module';
import { OrmModule } from './orm.module';

@Module({
  imports: [OrmModule, ManufacturerModule, CarModule]
})
export class AppModule {}
