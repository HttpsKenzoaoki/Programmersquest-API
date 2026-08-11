import { Request } from 'express';
import { Role } from '../common/types/firestore.types';

export interface AutenticatedUser {
  uid: string;
  email?: string;
  role?: Role;
}

export interface AutenticadRequest extends Request {
  user?: AutenticatedUser;
}
