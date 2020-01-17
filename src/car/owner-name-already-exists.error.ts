export class OwnerNameAlreadyExistsError extends Error {
  constructor(readonly ownerName: string, message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
