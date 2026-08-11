import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AutenticadRequest } from '../auth.types';
import { OWNER_KEY, OwnerMetadata } from '../decorators/owner.decorator';

@Injectable()
export class OwnerOrProfessorGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.getAllAndOverride<OwnerMetadata>(
      OWNER_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!metadata) return true;

    const request = context.switchToHttp().getRequest<AutenticadRequest>();

    // Professor acessa qualquer recurso
    if (request.user?.role === 'professor') return true;

    let ownerId = this.resolveOwnerId(request, metadata);
    if (metadata.composite && typeof ownerId === 'string') {
      ownerId = ownerId.split('_')[0];
    }

    if (request.user?.uid && ownerId === request.user.uid) return true;

    throw new ForbiddenException('Você só pode acessar seus próprios dados');
  }

  private resolveOwnerId(
    request: AutenticadRequest,
    metadata: OwnerMetadata,
  ): unknown {
    if (metadata.source === 'query') {
      return (request.query as Record<string, unknown>)[metadata.paramName];
    }
    if (metadata.source === 'body') {
      return (request.body as Record<string, unknown>)[metadata.paramName];
    }
    return (request.params as Record<string, unknown>)[metadata.paramName];
  }
}
