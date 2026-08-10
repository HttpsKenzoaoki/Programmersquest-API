import { Timestamp } from 'firebase-admin/firestore';
import { StatusProgresso } from '../../common/types/firestore.types';

export class Progresso {
  progressoId: string;
  alunoId: string;
  tarefaId: string;
  status: StatusProgresso;
  tentativas: number;
  melhorNota: number;
  xpGanho: number;
  ultimaTentativa: Timestamp | null;
  errosComuns: string[];
}
