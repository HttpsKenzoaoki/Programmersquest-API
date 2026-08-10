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

    return serializeFirestoreData<User>(data);
  }

  async findAll(): Promise<User[]> {
    const snapshot = await this.collection.orderBy('criadoEm', 'desc').get();
    return snapshot.docs.map((doc) =>
      serializeFirestoreData<User>({ uid: doc.id, ...doc.data() }),
    );
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

    return this.findOne(uid);
  }

  async remove(uid: string): Promise<void> {
    const doc = await this.collection.doc(uid).get();
    if (!doc.exists) {
      throw new NotFoundException(`Usuário ${uid} não encontrado`);
    }
    await doc.ref.delete();
  }
}
