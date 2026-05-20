export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: string,
  ) {
    super(message);

    this.name = 'ApiError';

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
