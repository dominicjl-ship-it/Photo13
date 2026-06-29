export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class FileTooLargeError extends AppError {
  constructor(maxSize: number) {
    super(`File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`, 413, 'FILE_TOO_LARGE');
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(mimeType: string) {
    super(`File type ${mimeType} is not supported`, 415, 'INVALID_FILE_TYPE');
  }
}

export class ReplicateError extends AppError {
  constructor(message: string) {
    super(`AI processing failed: ${message}`, 500, 'AI_PROCESSING_ERROR');
  }
}
