import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export function sendSuccess<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return { success: true, data, meta };
}

export function sendError(error: string): ApiResponse {
  return { success: false, error };
}

// Support for Express Response style (legacy/different controllers)
export function successResponse(res: Response, data: any, message?: string, statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
}

export function errorResponse(res: Response, error: string, statusCode: number = 500) {
  return res.status(statusCode).json({
    success: false,
    error
  });
}
