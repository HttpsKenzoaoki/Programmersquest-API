import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionReference, Timestamp } from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { ESCALA_PADRAO_ETEC } from '../common/constants/escala-padrao-etec';
import { serializeFirestoreData } from '../common/utils/serialize-firestore-data.util';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';
import { Turma } from './entities/turma.entity';

@Injectable()
export class TurmasService {
  private readonly collection: CollectionReference;

  constructor(private readonly firebase: FirebaseService) {
    this.collection = firebase.db.collection('turmas');
  }

  async create(createTurmaDto: CreateTurmaDto): Promise<Turma> {
    const docRef = this.collection.doc();
    const turmaId = docRef.id;

    // Nome gerado automaticamente: ex "1 DS AMS - Turma A"
    const nome = `${createTurmaDto.ano} ${createTurmaDto.curso} - Turma ${createTurmaDto.letra}`;

    const data = {
      turmaId,
      nome,
      ano: createTurmaDto.ano,
      curso: createTurmaDto.curso,
      letra: createTurmaDto.letra,
      professorId: createTurmaDto.professorId,
      criadaEm: Timestamp.now(),
    };

    await docRef.set(data);

    // Cria as configurações da turma com a escala padrão ETEC
    await this.firebase.db.collection('configuracoes').doc(turmaId).set({
      turmaId,
      escalaDeNota: ESCALA_PADRAO_ETEC,
    });

    return serializeFirestoreData<Turma>(data);
  }

  async findAll(): Promise<Turma[]> {
    const snapshot = await this.collection.orderBy('criadoEm', 'desc').get();
    return snapshot.docs.map((doc) =>
      serializeFirestoreData<Turma>({ turmaId: doc.id, ...doc.data() }),
    );
  }

  async findOne(turmaId: string): Promise<Turma> {
    const doc = await this.collection.doc(turmaId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Turma ${turmaId} não encontrada`);
    }
    return serializeFirestoreData<Turma>({ turmaId: doc.id, ...doc.data() });
  }

  async update(
    turmaId: string,
    updateTurmaDto: UpdateTurmaDto,
  ): Promise<Turma> {
    const doc = await this.collection.doc(turmaId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Turma ${turmaId} não encontrada`);
    }

    const patch: Record<string, unknown> = { ...updateTurmaDto };

    // Recalcula o nome se ano/curso/letra foram alterados
    if (patch.ano || patch.curso || patch.letra) {
      const current = doc.data() ?? {};
      patch.nome = `${patch.ano ?? current.ano} ${patch.curso ?? current.curso} - Turma ${patch.letra ?? current.letra}`;
    }

    await doc.ref.update(patch);

    return this.findOne(turmaId);
  }

  async remove(turmaId: string): Promise<void> {
    const doc = await this.collection.doc(turmaId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Turma ${turmaId} não encontrada`);
    }

    await Promise.all([
      doc.ref.delete(),
      // Remove também as configurações da turma
      this.firebase.db.collection('configuracoes').doc(turmaId).delete(),
    ]);
  }
}
