import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AutenticadRequest, AutenticatedUser } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AutenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest<AutenticadRequest>();
    return request.user;
  },
);
