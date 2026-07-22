export class RepositoryError extends Error {
  constructor(
    public readonly operation: string,
    options?: { cause?: unknown },
  ) {
    super(`Não foi possível ${operation}.`, options);
    this.name = "RepositoryError";
  }
}

export function throwRepositoryError(operation: string, cause: unknown): never {
  throw new RepositoryError(operation, { cause });
}
