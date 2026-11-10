import { Request } from 'express';

// Requête Express enrichie par AuthMiddleware avec l'id du user authentifié.
export interface AuthRequest extends Request {
  userId: number;
}
