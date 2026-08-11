import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../common/types/firestore.types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AutenticadRequest } from '../auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest<AutenticadRequest>();
    if (!user?.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Acesso negado para este perfil');
    }
    return true;
  }
}
