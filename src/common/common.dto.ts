export class RecordDTO<I, P> {
  constructor(readonly id: I, readonly payload: P) {}
}
