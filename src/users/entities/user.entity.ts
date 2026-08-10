import { Timestamp } from 'firebase-admin/firestore';
import { Role, Trilha } from '../../common/types/firestore.types';

export class User {
  uid: string;
  nome: string;
  rm: string;
  email: string;
  role: Role;
  turmaId: string | null;
  trilha: Trilha;
  xpTotal: number;
  nivel: number;
  streak: number;
  ultimoAcessoEm: Timestamp | null;
  criadoEm: Timestamp;
}
