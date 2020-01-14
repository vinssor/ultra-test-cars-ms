import { ArgumentsHost, BadRequestException, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Connection, QueryFailedError } from 'typeorm';

interface ManufacturerNotFoundErrorResolver {
    isManufacturerNotFoundError(exception: any): string;
}

class CarsErrorResolver {
    constructor(private readonly manufacturerNotFoundErrorResolver: ManufacturerNotFoundErrorResolver) { }
    resolveCarsError(exception: any): any {
        const manufacturerId = this.manufacturerNotFoundErrorResolver.isManufacturerNotFoundError(exception);
        if (manufacturerId) {
            return new BadRequestException(`No manufacturer found with given id [${manufacturerId}]`);
        }
        return undefined;
    }
}

class SqlManufacturerNotFoundErrorErrorResolver implements ManufacturerNotFoundErrorResolver {
    isManufacturerNotFoundError(exception: any): string {
        if (exception instanceof QueryFailedError) {
            const sqlError: any = <any>exception;
            const sqlState: string = sqlError.sqlState;
            const sqlMessage: string = (<string>sqlError.sqlMessage)?.toLowerCase();
            if (
                (sqlState === '23000' || sqlState === '23001') &&
                sqlMessage?.indexOf('foreign key') > -1 &&
                sqlMessage?.indexOf('manufacturer') > -1
            ) {
                const parameters: any[] = sqlError.parameters;
                let errorMessage = 'No manufacturer found with given id';
                if (parameters.length > 1) {
                    return parameters[1];
                }
                return 'unkown';
            }
        }
        return undefined;
    }
}

@Catch()
export class CarsExceptionFilter extends BaseExceptionFilter {
    private readonly errorResolver: CarsErrorResolver;

    constructor(private readonly connection: Connection) {
        super();
        switch (connection.driver.options.type) {
            case "mongodb": // TODO
            default: this.errorResolver = new CarsErrorResolver(
                new SqlManufacturerNotFoundErrorErrorResolver()
            );
        }
    }
    catch(exception: any, host: ArgumentsHost) {
        const resolvedCarsError = this.errorResolver.resolveCarsError(exception);
        if (resolvedCarsError) {
            super.catch(resolvedCarsError, host);
        } else {
            super.catch(exception, host);
        }
    }
}
