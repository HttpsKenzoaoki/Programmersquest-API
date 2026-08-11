import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentReference } from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { serializeFirestoreData } from '../common/utils/serialize-firestore-data.util';
import { notaParaConceito } from '../common/utils/nota-para-conceito.util';
import { UpdateConfiguracoesDto } from './dto/update-configuracoes.dto';
import { Configuracoes } from './entities/configuracoes.entity';

@Injectable()
export class ConfiguracoesService {
  constructor(private readonly firebase: FirebaseService) {}

  private docRef(turmaId: string): DocumentReference {
    return this.firebase.db.collection('configuracoes').doc(turmaId);
  }

  async findByTurma(turmaId: string): Promise<Configuracoes> {
    const doc = await this.docRef(turmaId).get();
    if (!doc.exists) {
      throw new NotFoundException(
        `Configurações da turma ${turmaId} não encontradas`,
      );
    }
    return serializeFirestoreData<Configuracoes>({
      turmaId: doc.id,
      ...doc.data(),
    });
  }

  async update(
    turmaId: string,
    updateConfiguracoesDto: UpdateConfiguracoesDto,
  ): Promise<Configuracoes> {
    const doc = await this.docRef(turmaId).get();
    if (!doc.exists) {
      throw new NotFoundException(
        `Configurações da turma ${turmaId} não encontradas`,
      );
    }

    await doc.ref.update({ escalaDeNota: updateConfiguracoesDto.escalaDeNota });

    return this.findByTurma(turmaId);
  }

  // Converte uma nota (0-100) para o conceito I/R/B/MB da escala da turma
  async conceito(
    turmaId: string,
    nota: number,
  ): Promise<{ nota: number; conceito?: string; cor?: string }> {
    const config = await this.findByTurma(turmaId);
    const resultado = notaParaConceito(nota, config.escalaDeNota);
    if (!resultado) {
      return { nota };
    }
    return { nota, ...resultado };
  }
}
