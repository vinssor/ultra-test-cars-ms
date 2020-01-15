import { Test } from '@nestjs/testing';
import { Connection, QueryFailedError } from 'typeorm';
import { OrmErrorTransformer } from './orm.error-transformer';
import {
  DuplicateEntityError,
  EntityRelationError
} from './orm.error-transformer';

describe('OrmErrorTransformer', () => {
  const MockSqlConnection = jest.fn(() => ({
    options: {
      type: 'mysql'
    }
  }));
  let sqlErrorTransformer: OrmErrorTransformer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        { provide: Connection, useClass: MockSqlConnection },
        {
          provide: OrmErrorTransformer,
          useFactory: (connection: Connection) =>
            new OrmErrorTransformer(connection),
          inject: [Connection]
        }
      ]
    }).compile();
    sqlErrorTransformer = module.get<OrmErrorTransformer>(OrmErrorTransformer);
  });

  describe('Overall Platforms', () => {
    it('Unsupported error', () => {
      const error = {};
      const mappedError = sqlErrorTransformer.transform(error);
      expect(mappedError).toEqual(error);
    });
    it('Unsupported Query Failed', () => {
      const queryFailedError = new QueryFailedError('query', undefined, {
        message: 'An unsupported message',
        sqlState: 'XXXXX'
      });
      const mappedError = sqlErrorTransformer.transform(queryFailedError);
      expect(mappedError).toEqual(queryFailedError);
    });
  });

  describe('SQL Duplicate Entity', () => {
    it('sqlState=23000', () => {
      const parameters = ['a', 'b'];
      const queryFailedError = new QueryFailedError('query', parameters, {
        message: 'A message with DupLicaTe pattern',
        sqlState: '23000'
      });
      const mappedError = sqlErrorTransformer.transform(queryFailedError);
      expect(mappedError).toBeDefined();
      expect(mappedError).toBeInstanceOf(DuplicateEntityError);
      const duplicateEntityError = <DuplicateEntityError>mappedError;
      expect(duplicateEntityError.parameters).toEqual(parameters);
    });
    it('sqlState=23001', () => {
      const parameters = ['a', 'b'];
      const queryFailedError = new QueryFailedError('query', parameters, {
        message: 'A message with DupLicaTe pattern',
        sqlState: '23001'
      });
      const mappedError = sqlErrorTransformer.transform(queryFailedError);
      expect(mappedError).toBeDefined();
      expect(mappedError).toBeInstanceOf(DuplicateEntityError);
      const duplicateEntityError = <DuplicateEntityError>mappedError;
      expect(duplicateEntityError.parameters).toEqual(parameters);
    });
    it('without parameters', () => {
      const queryFailedError = new QueryFailedError('query', undefined, {
        message: 'A message with DupLicaTe pattern',
        sqlState: '23000'
      });
      const mappedError = sqlErrorTransformer.transform(queryFailedError);
      expect(mappedError).toBeDefined();
      expect(mappedError).toBeInstanceOf(DuplicateEntityError);
      const duplicateEntityError = <DuplicateEntityError>mappedError;
      expect(duplicateEntityError.parameters).toEqual([]);
    });
  });

  describe('SQL Entity Relation', () => {
    it('sqlState=23000', () => {
      const parameters = ['a', 'b'];
      const queryFailedError = new QueryFailedError('query', parameters, {
        message: 'A message with ForeIgn KeY pattern',
        sqlState: '23000'
      });
      const mappedError = sqlErrorTransformer.transform(queryFailedError);
      expect(mappedError).toBeDefined();
      expect(mappedError).toBeInstanceOf(EntityRelationError);
      const entityRelationError = <EntityRelationError>mappedError;
      expect(entityRelationError.parameters).toEqual(parameters);
    });
    it('sqlState=23001', () => {
      const parameters = ['a', 'b'];
      const queryFailedError = new QueryFailedError('query', parameters, {
        message: 'A message with ForeIgn KeY pattern',
        sqlState: '23001'
      });
      const mappedError = sqlErrorTransformer.transform(queryFailedError);
      expect(mappedError).toBeDefined();
      expect(mappedError).toBeInstanceOf(EntityRelationError);
      const entityRelationError = <EntityRelationError>mappedError;
      expect(entityRelationError.parameters).toEqual(parameters);
    });
    it('without parameters', () => {
      const queryFailedError = new QueryFailedError('query', undefined, {
        message: 'A message with ForeIgn KeY pattern',
        sqlState: '23000'
      });
      const mappedError = sqlErrorTransformer.transform(queryFailedError);
      expect(mappedError).toBeDefined();
      expect(mappedError).toBeInstanceOf(EntityRelationError);
      const entityRelationError = <EntityRelationError>mappedError;
      expect(entityRelationError.parameters).toEqual([]);
    });
  });
});
