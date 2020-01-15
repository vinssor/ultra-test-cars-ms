export class NoManufacturerFoundError extends Error {
  constructor(readonly id?: string, message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
