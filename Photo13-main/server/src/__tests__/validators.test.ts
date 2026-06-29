import { Request, Response, NextFunction } from 'express';
import { validateUpscaleRequest } from '../validators/imageValidators';

function mockReq(body: Record<string, unknown>): Partial<Request> { return { body } as Partial<Request>; }
function mockRes(): Partial<Response> { return {} as Partial<Response>; }
function mockNext(): NextFunction { return jest.fn() as unknown as NextFunction; }

describe('Image Validators', () => {
  describe('validateUpscaleRequest', () => {
    it('should pass valid request', () => {
      const req = mockReq({ imageId: 'abc123', scale: 4 });
      const next = mockNext();
      validateUpscaleRequest(req as Request, mockRes() as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject missing imageId', () => {
      const req = mockReq({ scale: 4 });
      const next = mockNext();
      expect(() => validateUpscaleRequest(req as Request, mockRes() as Response, next)).toThrow();
    });

    it('should reject invalid scale', () => {
      const req = mockReq({ imageId: 'abc123', scale: 3 });
      const next = mockNext();
      expect(() => validateUpscaleRequest(req as Request, mockRes() as Response, next)).toThrow();
    });

    it('should coerce scale to number', () => {
      const req = mockReq({ imageId: 'abc123', scale: '4' });
      const next = mockNext();
      validateUpscaleRequest(req as Request, mockRes() as Response, next);
      expect(req.body.scale).toBe(4);
    });
  });
});
