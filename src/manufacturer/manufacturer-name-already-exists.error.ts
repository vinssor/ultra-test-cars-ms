export class ManufacturerNameAlreadyExistsError extends Error {
  constructor(readonly manufacturerName: string, message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
