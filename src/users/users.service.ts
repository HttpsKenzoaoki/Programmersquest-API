import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CollectionReference,
  DocumentReference,
  Timestamp,
} from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { calcularNivel } from '../common/utils/calcular-nivel.util';
import { serializeFirestoreData } from '../common/utils/serialize-firestore-data.util';

@Injectable()
export class UsersService {
  private readonly collection: CollectionReference;

  constructor(private readonly firebase: FirebaseService) {
    this.collection = firebase.db.collection('users');
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const docRef: DocumentReference =
      createUserDto.uid && createUserDto.uid.trim()
        ? this.collection.doc(createUserDto.uid)
        : this.collection.doc();

    const xpTotal = createUserDto.xpTotal ?? 0;
    const now = Timestamp.now();

    const data = {
      uid: docRef.id,
      nome: createUserDto.nome,
      rm: createUserDto.rm,
      email: createUserDto.email,
      role: createUserDto.role,
      turmaId: createUserDto.turmaId ?? null,
      trilha: createUserDto.trilha ?? 'iniciante',
      xpTotal,
      nivel: calcularNivel(xpTotal),
      streak: createUserDto.streak ?? 0,
      ultimoAcessoEm: createUserDto.ultimoAcessoEm
        ? Timestamp.fromDate(new Date(createUserDto.ultimoAcessoEm))
        : null,
      criadoEm: now,
    };

    await docRef.set(data);

    if (data.role === 'aluno' && data.turmaId) {
      await this.sincronizarProgressoTurma(data.uid, data.turmaId);
    }

    return serializeFirestoreData<User>(data);
  }

  async findAll(): Promise<User[]> {
    const snapshot = await this.collection.orderBy('criadoEm', 'desc').get();
    return snapshot.docs.map((doc) =>
      serializeFirestoreData<User>({ uid: doc.id, ...doc.data() }),
    );
  }

  async findRanking(turmaId?: string) {
    const snapshot = await this.collection.get();
    const usuarios = snapshot.docs.map((doc) =>
      serializeFirestoreData<User>({ uid: doc.id, ...doc.data() }),
    );

    const filtrados = usuarios.filter((u) => {
      if (u.role !== 'aluno') return false;
      if (turmaId && u.turmaId !== turmaId) return false;
      return true;
    });

    filtrados.sort((a, b) => {
      const diffXp = (b.xpTotal ?? 0) - (a.xpTotal ?? 0);
      if (diffXp !== 0) return diffXp;
      const diffStreak = (b.streak ?? 0) - (a.streak ?? 0);
      if (diffStreak !== 0) return diffStreak;
      return (a.nome || '').localeCompare(b.nome || '');
    });

    return filtrados.map((u, idx) => ({
      posicao: idx + 1,
      uid: u.uid,
      nome: u.nome,
      nivel: u.nivel ?? calcularNivel(u.xpTotal ?? 0),
      xpTotal: u.xpTotal ?? 0,
      streak: u.streak ?? 0,
      trilha: u.trilha ?? 'iniciante',
      turmaId: u.turmaId ?? null,
    }));
  }

  async findOne(uid: string): Promise<User> {
    const doc = await this.collection.doc(uid).get();
    if (!doc.exists) {
      throw new NotFoundException(`Usuário ${uid} não encontrado`);
    }
    return serializeFirestoreData<User>({ uid: doc.id, ...doc.data() });
  }

  async update(uid: string, updateUserDto: UpdateUserDto): Promise<User> {
    const doc = await this.collection.doc(uid).get();
    if (!doc.exists) {
      throw new NotFoundException(`Usuário ${uid} não encontrado`);
    }

    const patch: Record<string, unknown> = { ...updateUserDto };

    if (patch.ultimoAcessoEm) {
      patch.ultimoAcessoEm = Timestamp.fromDate(
        new Date(patch.ultimoAcessoEm as string),
      );
    }

    if (patch.xpTotal !== undefined) {
      patch.nivel = calcularNivel(patch.xpTotal as number);
    }

    await doc.ref.update(patch);

    const atualizado = await this.findOne(uid);
    if (atualizado.role === 'aluno' && atualizado.turmaId) {
      await this.sincronizarProgressoTurma(atualizado.uid, atualizado.turmaId);
    }

    return atualizado;
  }

  async remove(uid: string): Promise<void> {
    const doc = await this.collection.doc(uid).get();
    if (!doc.exists) {
      throw new NotFoundException(`Usuário ${uid} não encontrado`);
    }
    await doc.ref.delete();
  }

  private async sincronizarProgressoTurma(
    alunoId: string,
    turmaId: string,
  ): Promise<void> {
    try {
      const tarefasCol = this.firebase.db.collection('tarefas');
      if (!tarefasCol || typeof tarefasCol.where !== 'function') return;

      const tarefasSnap = await tarefasCol
        .where('turmaIds', 'array-contains', turmaId)
        .get();
      if (tarefasSnap.empty) return;

      const progressoCol = this.firebase.db.collection('progresso');
      for (const tarefaDoc of tarefasSnap.docs) {
        const tarefaId = tarefaDoc.id;
        const progressoId = `${alunoId}_${tarefaId}`;
        const progRef = progressoCol.doc(progressoId);
        const progSnap = await progRef.get();
        if (!progSnap.exists) {
          const tData = tarefaDoc.data() ?? {};
          const prazo = tData.prazo as Timestamp | null | undefined;
          const status =
            prazo &&
            typeof prazo.toMillis === 'function' &&
            prazo.toMillis() < Date.now()
              ? 'bloqueada'
              : 'disponivel';
          await progRef.set({
            progressoId,
            alunoId,
            tarefaId,
            status,
            tentativas: 0,
            melhorNota: 0,
            xpGanho: 0,
            ultimaTentativa: null,
            errosComuns: [],
          });
        }
      }
    } catch {
      // ignora em caso de mock de teste
    }
  }
}
