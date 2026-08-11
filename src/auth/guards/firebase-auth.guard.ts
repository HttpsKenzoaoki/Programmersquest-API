import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseService } from '../../firebase/firebase.service';
import { Role } from '../../common/types/firestore.types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AutenticadRequest } from '../auth.types';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AutenticadRequest>();
    const token = this.extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Token de autenticação não informado');
    }

    try {
      const decoded = await this.firebase.auth.verifyIdToken(token);
      request.user = {
        uid: decoded.uid,
        email: decoded.email,
        role: (decoded as { role?: Role }).role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization) return null;
    const [scheme, token] = authorization.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }
}
