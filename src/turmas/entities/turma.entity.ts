import { Timestamp } from 'firebase-admin/firestore';

export class Turma {
  turmaId: string;
  nome: string;
  ano: 1 | 2 | 3;
  curso: string;
  letra: 'A' | 'B';
  professorId: string;
  criadaEm: Timestamp;
}
