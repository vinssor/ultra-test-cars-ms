import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Manufacturer } from './manufacturer.entity';
import { ManufacturersController } from './manufacturers.controller';
import { ManufacturersService } from './manufacturers.service';
import { ManufacturersErrorTransformer } from './manufacturers.error-transformer';

@Module({
  imports: [TypeOrmModule.forFeature([Manufacturer])],
  providers: [ManufacturersErrorTransformer, ManufacturersService],
  controllers: [ManufacturersController],
  exports: [ManufacturersService]
})
export class ManufacturersModule {}
