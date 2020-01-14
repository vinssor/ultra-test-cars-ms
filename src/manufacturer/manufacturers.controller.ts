import { Controller } from '@nestjs/common';
import { Crud } from '@nestjsx/crud';
import { Manufacturer } from './manufacturer.entity';
import { ManufacturersService } from './manufacturers.service';

@Crud({
  model: {
    type: Manufacturer
  },
  params: {
    id: {
      field: 'id',
      type: 'string',
      primary: true
    }
  }
})
@Controller('manufacturers')
export class ManufacturersController {
  constructor(public service: ManufacturersService) {}
}
