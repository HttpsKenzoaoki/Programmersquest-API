import { Timestamp } from 'firebase-admin/firestore';
import {
  Linguagem,
  StaticRule,
  TarefaNivel,
  TestCase,
  TipoTarefa,
} from '../../common/types/firestore.types';

export class Tarefa {
  tarefaId: string;
  titulo: string;
  descricao: string;
  linguagem: Linguagem;
  nivel: TarefaNivel;
  tipo: TipoTarefa;
  turmaIds: string[];
  professorId: string;
  xpRecompensa: number;
  staticRules: StaticRule[];
  testCases: TestCase[];
  scaffoldCode: string | null;
  criadaEm: Timestamp;
  prazo: Timestamp | null;
}
