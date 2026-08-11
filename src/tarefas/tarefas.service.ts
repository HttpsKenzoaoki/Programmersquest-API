import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CollectionReference,
  DocumentData,
  QuerySnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { serializeFirestoreData } from '../common/utils/serialize-firestore-data.util';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { Tarefa } from './entities/tarefa.entity';

@Injectable()
export class TarefasService {
  private readonly collection: CollectionReference;

  constructor(private readonly firebase: FirebaseService) {
    this.collection = firebase.db.collection('tarefas');
  }

  async create(createTarefaDto: CreateTarefaDto): Promise<Tarefa> {
    const docRef = this.collection.doc();
    const tarefaId = docRef.id;

    const data = {
      tarefaId,
      titulo: createTarefaDto.titulo,
      descricao: createTarefaDto.descricao,
      linguagem: createTarefaDto.linguagem,
      nivel: createTarefaDto.nivel,
      tipo: createTarefaDto.tipo,
      turmaIds: createTarefaDto.turmaIds,
      professorId: createTarefaDto.professorId,
      xpRecompensa: createTarefaDto.xpRecompensa,
      staticRules: (createTarefaDto.staticRules ?? []).map((r) => ({ ...r })),
      testCases: (createTarefaDto.testCases ?? []).map((t) => ({ ...t })),
      scaffoldCode: createTarefaDto.scaffoldCode ?? null,
      criadaEm: Timestamp.now(),
      prazo: createTarefaDto.prazo
        ? Timestamp.fromDate(new Date(createTarefaDto.prazo))
        : null,
    };

    await docRef.set(data);

    // Cria o progresso inicial dos alunos das turmas vinculadas
    await this.criarProgressoInicial(tarefaId, data.turmaIds, data.prazo);

    return serializeFirestoreData<Tarefa>(data);
  }

  async findAll(): Promise<Tarefa[]> {
    const snapshot = await this.collection.orderBy('criadaEm', 'desc').get();
    return snapshot.docs.map((doc) =>
      serializeFirestoreData<Tarefa>({ tarefaId: doc.id, ...doc.data() }),
    );
  }

  // Busca tarefas vinculadas a uma turma (filter turmaIds)
  async findByTurma(turmaId: string): Promise<Tarefa[]> {
    const snapshot = await this.collection
      .where('turmaIds', 'array-contains', turmaId)
      .get();
    return snapshot.docs.map((doc) =>
      serializeFirestoreData<Tarefa>({ tarefaId: doc.id, ...doc.data() }),
    );
  }

  async findOne(tarefaId: string): Promise<Tarefa> {
    const doc = await this.collection.doc(tarefaId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Tarefa ${tarefaId} não encontrada`);
    }
    return serializeFirestoreData<Tarefa>({ tarefaId: doc.id, ...doc.data() });
  }

  async update(
    tarefaId: string,
    updateTarefaDto: UpdateTarefaDto,
  ): Promise<Tarefa> {
    const doc = await this.collection.doc(tarefaId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Tarefa ${tarefaId} não encontrada`);
    }

    const patch: Record<string, unknown> = { ...updateTarefaDto };

    if (patch.staticRules) {
      patch.staticRules = (patch.staticRules as Record<string, unknown>[]).map(
        (r) => ({ ...r }),
      );
    }
    if (patch.testCases) {
      patch.testCases = (patch.testCases as Record<string, unknown>[]).map(
        (t) => ({ ...t }),
      );
    }
    if (patch.prazo) {
      patch.prazo = Timestamp.fromDate(new Date(patch.prazo as string));
    }

    await doc.ref.update(patch);

    return this.findOne(tarefaId);
  }

  async remove(tarefaId: string): Promise<void> {
    const doc = await this.collection.doc(tarefaId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Tarefa ${tarefaId} não encontrada`);
    }
    await doc.ref.delete();
  }

  // Cria o progresso inicial (disponivel ou bloqueada) de todos os alunos
  // das turmas vinculadas à tarefa
  private async criarProgressoInicial(
    tarefaId: string,
    turmaIds: string[],
    prazo: Timestamp | null,
  ): Promise<void> {
    if (turmaIds.length === 0) return;

    const alunos: QuerySnapshot<DocumentData> = await this.firebase.db
      .collection('users')
      .where('role', '==', 'aluno')
      .where('turmaId', 'in', turmaIds)
      .get();

    if (alunos.empty) return;

    const status =
      prazo && prazo.toMillis() < Date.now() ? 'bloqueada' : 'disponivel';

    const batch = this.firebase.db.batch();
    const progresso = this.firebase.db.collection('progresso');

    for (const aluno of alunos.docs) {
      const progressoId = `${aluno.id}_${tarefaId}`;
      batch.set(progresso.doc(progressoId), {
        progressoId,
        alunoId: aluno.id,
        tarefaId,
        status,
        tentativas: 0,
        melhorNota: 0,
        xpGanho: 0,
        ultimaTentativa: null,
        errosComuns: [],
      });
    }

    await batch.commit();
  }
}
