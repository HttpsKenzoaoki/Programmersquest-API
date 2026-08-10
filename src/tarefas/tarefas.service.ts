import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionReference, Timestamp } from 'firebase-admin/firestore';
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
      staticRules: createTarefaDto.staticRules ?? [],
      testCases: createTarefaDto.testCases ?? [],
      scaffoldCode: createTarefaDto.scaffoldCode ?? null,
      criadaEm: Timestamp.now(),
      prazo: createTarefaDto.prazo
        ? Timestamp.fromDate(new Date(createTarefaDto.prazo))
        : null,
    };

    await docRef.set(data);

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
}
