import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CollectionReference,
  QuerySnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { calcularNivel } from '../common/utils/calcular-nivel.util';
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

    const docRef = this.collection.doc(progressoId);
    const anteriorSnap = await docRef.get();
    const anterior = anteriorSnap.exists ? (anteriorSnap.data() ?? {}) : null;
    const xpAnterior = (anterior?.xpGanho as number) ?? 0;
    const notaAnterior = (anterior?.melhorNota as number) ?? 0;
    const tentativasAnteriores = (anterior?.tentativas as number) ?? 0;

    const xpGanho = Math.max(xpAnterior, createProgressoDto.xpGanho ?? 0);
    const melhorNota = Math.max(
      notaAnterior,
      createProgressoDto.melhorNota ?? 0,
    );
    const tentativas =
      createProgressoDto.tentativas ??
      (anterior ? tentativasAnteriores + 1 : 0);

    const data = {
      progressoId,
      alunoId: createProgressoDto.alunoId,
      tarefaId: createProgressoDto.tarefaId,
      status:
        anterior?.status === 'concluida'
          ? 'concluida'
          : createProgressoDto.status,
      tentativas,
      melhorNota,
      xpGanho,
      ultimaTentativa: createProgressoDto.ultimaTentativa
        ? Timestamp.fromDate(new Date(createProgressoDto.ultimaTentativa))
        : ((anterior?.ultimaTentativa as Timestamp | null | undefined) ?? null),
      errosComuns: createProgressoDto.errosComuns ?? [],
    };

    await docRef.set(data);

    if (xpGanho > xpAnterior) {
      await this.incrementarXpUsuario(
        createProgressoDto.alunoId,
        xpGanho - xpAnterior,
      );
    }

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

  async findOneForOptional(
    alunoId: string,
    tarefaId: string,
  ): Promise<Progresso | null> {
    const doc = await this.collection
      .doc(this.buildProgressoId(alunoId, tarefaId))
      .get();
    if (!doc.exists) return null;
    return serializeFirestoreData<Progresso>({
      progressoId: doc.id,
      ...doc.data(),
    });
  }

  async update(
    progressoId: string,
    updateProgressoDto: UpdateProgressoDto,
  ): Promise<Progresso> {
    const doc = await this.collection.doc(progressoId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Progresso ${progressoId} não encontrado`);
    }

    const anterior = doc.data() ?? {};
    const xpAnterior = (anterior.xpGanho as number) ?? 0;
    const alunoId = (anterior.alunoId as string) ?? progressoId.split('_')[0];

    const patch: Record<string, unknown> = { ...updateProgressoDto };

    if (patch.ultimaTentativa) {
      patch.ultimaTentativa = Timestamp.fromDate(
        new Date(patch.ultimaTentativa as string),
      );
    }

    let xpNovo = xpAnterior;
    if (patch.xpGanho !== undefined) {
      xpNovo = Math.max(xpAnterior, patch.xpGanho as number);
      patch.xpGanho = xpNovo;
    }

    await doc.ref.update(patch);

    if (xpNovo > xpAnterior && alunoId) {
      await this.incrementarXpUsuario(alunoId, xpNovo - xpAnterior);
    }

    return this.findOne(progressoId);
  }

  async remove(progressoId: string): Promise<void> {
    const doc = await this.collection.doc(progressoId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Progresso ${progressoId} não encontrado`);
    }
    await doc.ref.delete();
  }

  private async incrementarXpUsuario(
    alunoId: string,
    deltaXp: number,
  ): Promise<void> {
    if (deltaXp <= 0) return;
    const userRef = this.firebase.db.collection('users').doc(alunoId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return;
    const userData = userDoc.data() ?? {};
    const novoXpTotal = ((userData.xpTotal as number) ?? 0) + deltaXp;
    await userRef.update({
      xpTotal: novoXpTotal,
      nivel: calcularNivel(novoXpTotal),
    });
  }
}
