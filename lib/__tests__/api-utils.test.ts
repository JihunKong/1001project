import { NextResponse } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
  apiCall,
} from '../api-utils';
import { ZodError } from 'zod';

describe('API Utils', () => {
  describe('createSuccessResponse', () => {
    it('should create a standardized success response', () => {
      const data = { id: 1, name: 'test' };
      const response = createSuccessResponse(data, 'Success message');

      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should create success response without message', () => {
      const data = { id: 1 };
      const response = createSuccessResponse(data);

      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should create success response with custom status', () => {
      const data = { id: 1 };
      const response = createSuccessResponse(data, 'Created', 201);

      expect(response).toBeInstanceOf(NextResponse);
    });
  });

  describe('createErrorResponse', () => {
    it('should create a standardized error response', () => {
      const response = createErrorResponse('Test error', 400);

      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should create error response with details', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const response = createErrorResponse('Validation error', 400, details);

      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should create error response with error code', () => {
      const response = createErrorResponse('Auth error', 401, undefined, 'AUTH_REQUIRED');

      expect(response).toBeInstanceOf(NextResponse);
    });
  });

  describe('handleValidationError', () => {
    it('should handle ZodError correctly', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
      ]);

      const response = handleValidationError(zodError);

      expect(response).toBeInstanceOf(NextResponse);
    });
  });

  describe('apiCall', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle successful API calls', async () => {
      const mockData = { id: 1, name: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: mockData }),
      });

      const result = await apiCall<typeof mockData>('/api/test');

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request' }),
      });

      const result = await apiCall('/api/test');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Bad request');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await apiCall('/api/test');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Network error');
    });

    it('should pass custom headers', async () => {
      const mockData = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      await apiCall('/api/test', {
        headers: { 'Custom-Header': 'test-value' },
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Custom-Header': 'test-value',
        },
      });
    });
  });
});