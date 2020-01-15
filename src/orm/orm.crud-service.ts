import { CreateManyDto, CrudRequest, Override } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ErrorTransformer } from '../error/error.transformer';

export class OrmCrudService<T> extends TypeOrmCrudService<T> {
  constructor(
    repo: Repository<T>,
    readonly errorTransformer: ErrorTransformer
  ) {
    super(repo);
  }

  private mapError(error: any): Promise<any> {
    return Promise.reject(this.errorTransformer.map(error));
  }

  @Override()
  createOne(req: CrudRequest, dto: DeepPartial<T>): Promise<T> {
    return super.createOne(req, dto).catch(error => this.mapError(error));
  }

  @Override()
  createMany(
    req: CrudRequest,
    dto: CreateManyDto<DeepPartial<T>>
  ): Promise<T[]> {
    return super.createMany(req, dto).catch(error => this.mapError(error));
  }

  @Override()
  updateOne(req: CrudRequest, dto: DeepPartial<T>): Promise<T> {
    return super.updateOne(req, dto).catch(error => this.mapError(error));
  }

  @Override()
  replaceOne(req: CrudRequest, dto: DeepPartial<T>): Promise<T> {
    return super.replaceOne(req, dto).catch(error => this.mapError(error));
  }
}
