import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CollectionReference,
  QuerySnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { serializeFirestoreData } from '../common/utils/serialize-firestore-data.util';
import { CreateProgressoDto } from './dto/create-progresso.dto';
import { UpdateProgressoDto } from './dto/update-progresso.dto';
import { Progresso } from './entities/progresso.entity';

@Injectable()
export class ProgressoService {
  private readonly collection: CollectionReference;

  constructor(private readonly firebase: FirebaseService) {
    this.collection = firebase.db.collection('progresso');
  }

  // Chave composta: uid_tarefaId
  private buildProgressoId(alunoId: string, tarefaId: string): string {
    return `${alunoId}_${tarefaId}`;
  }

  async create(createProgressoDto: CreateProgressoDto): Promise<Progresso> {
    const progressoId = this.buildProgressoId(
      createProgressoDto.alunoId,
      createProgressoDto.tarefaId,
    );

    const data = {
      progressoId,
      alunoId: createProgressoDto.alunoId,
      tarefaId: createProgressoDto.tarefaId,
      status: createProgressoDto.status,
      tentativas: createProgressoDto.tentativas ?? 0,
      melhorNota: createProgressoDto.melhorNota ?? 0,
      xpGanho: createProgressoDto.xpGanho ?? 0,
      ultimaTentativa: createProgressoDto.ultimaTentativa
        ? Timestamp.fromDate(new Date(createProgressoDto.ultimaTentativa))
        : null,
      errosComuns: createProgressoDto.errosComuns ?? [],
    };

    await this.collection.doc(progressoId).set(data);

    return serializeFirestoreData<Progresso>(data);
  }

  private mapSnapshot(snapshot: QuerySnapshot): Progresso[] {
    return snapshot.docs.map((doc) =>
      serializeFirestoreData<Progresso>({ progressoId: doc.id, ...doc.data() }),
    );
  }

  async findAll(): Promise<Progresso[]> {
    const snapshot = await this.collection.get();
    return this.mapSnapshot(snapshot);
  }

  // Progresso de um aluno (lista de tarefas)
  async findByAluno(alunoId: string): Promise<Progresso[]> {
    const snapshot = await this.collection
      .where('alunoId', '==', alunoId)
      .get();
    return this.mapSnapshot(snapshot);
  }

  // Progresso de uma tarefa (lista de alunos)
  async findByTarefa(tarefaId: string): Promise<Progresso[]> {
    const snapshot = await this.collection
      .where('tarefaId', '==', tarefaId)
      .get();
    return this.mapSnapshot(snapshot);
  }

  async findOne(progressoId: string): Promise<Progresso> {
    const doc = await this.collection.doc(progressoId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Progresso ${progressoId} não encontrado`);
    }
    return serializeFirestoreData<Progresso>({
      progressoId: doc.id,
      ...doc.data(),
    });
  }

  async findOneFor(alunoId: string, tarefaId: string): Promise<Progresso> {
    return this.findOne(this.buildProgressoId(alunoId, tarefaId));
  }

  async update(
    progressoId: string,
    updateProgressoDto: UpdateProgressoDto,
  ): Promise<Progresso> {
    const doc = await this.collection.doc(progressoId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Progresso ${progressoId} não encontrado`);
    }

    const patch: Record<string, unknown> = { ...updateProgressoDto };

    if (patch.ultimaTentativa) {
      patch.ultimaTentativa = Timestamp.fromDate(
        new Date(patch.ultimaTentativa as string),
      );
    }

    await doc.ref.update(patch);

    return this.findOne(progressoId);
  }

  async remove(progressoId: string): Promise<void> {
    const doc = await this.collection.doc(progressoId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Progresso ${progressoId} não encontrado`);
    }
    await doc.ref.delete();
  }
}
