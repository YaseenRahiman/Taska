import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate a unique request ID if not present
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    
    // Set the request ID in headers for both request and response
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    // Add request ID to the request object for easy access
    (req as any).requestId = requestId;
    
    next();
  }
}
