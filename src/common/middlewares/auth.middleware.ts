import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

import { AuthRequest } from '../interfaces/auth-request.interface';

export const AUTH_HEADER = 'auth-user';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers[AUTH_HEADER];
    // Un header peut être absent (undefined) ou répété (string[]).
    if (typeof token !== 'string') {
      return this.deny(res, `Header ${AUTH_HEADER} manquant`);
    }

    const userId = this.extractUserId(token);
    if (userId === null) {
      return this.deny(res, 'Token invalide ou sans userId');
    }

    (req as AuthRequest).userId = userId;
    next();
  }

  // verify() vérifie la signature (et l'expiration) puis renvoie le payload.
  // Elle lève une exception si le token est falsifié, mal formé ou expiré.
  private extractUserId(token: string): number | null {
    try {
      const payload = verify(
        token,
        this.configService.getOrThrow<string>('JWT_SECRET'),
      );
      if (typeof payload === 'string' || typeof payload.userId !== 'number') {
        return null;
      }
      return payload.userId;
    } catch {
      return null;
    }
  }

  // On répond directement au client sans appeler next() :
  // la requête n'atteint jamais le controller.
  private deny(res: Response, reason: string) {
    res.status(HttpStatus.UNAUTHORIZED).json({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: `Vous ne pouvez pas accéder à cette ressource : ${reason}`,
      error: 'Unauthorized',
    });
  }
}
