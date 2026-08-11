import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  private async verifyToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await this.firebase.auth.verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  // Login: verifica o token, atualiza último acesso + streak e retorna o perfil
  async login(loginDto: LoginDto): Promise<User> {
    const decoded = await this.verifyToken(loginDto.idToken);

    const doc = await this.firebase.db
      .collection('users')
      .doc(decoded.uid)
      .get();
    if (!doc.exists) {
      throw new NotFoundException(
        'Perfil não encontrado. Faça o registro antes de entrar.',
      );
    }

    const data = doc.data() ?? {};
    const now = Timestamp.now();
    const streak = this.calcularStreak(
      data.ultimoAcessoEm as Timestamp | undefined,
      (data.streak as number) ?? 0,
      now,
    );

    await doc.ref.update({ ultimoAcessoEm: now, streak });

    return this.usersService.findOne(decoded.uid);
  }

  // Registro: completa o perfil do usuário criado no Firebase Auth
  async register(registerDto: RegisterDto): Promise<User> {
    const decoded = await this.verifyToken(registerDto.idToken);

    const existing = await this.firebase.db
      .collection('users')
      .doc(decoded.uid)
      .get();
    if (existing.exists) {
      throw new ConflictException('Usuário já possui perfil cadastrado');
    }

    const user = await this.usersService.create({
      uid: decoded.uid,
      nome: registerDto.nome,
      rm: registerDto.rm,
      email: decoded.email ?? '',
      role: registerDto.role,
      turmaId: registerDto.turmaId,
      ultimoAcessoEm: new Date().toISOString(),
    });

    // Grava o role no token para o RolesGuard ler sem consultar o Firestore
    await this.firebase.auth.setCustomUserClaims(decoded.uid, {
      role: registerDto.role,
    });

    return user;
  }

  async me(uid: string): Promise<User> {
    return this.usersService.findOne(uid);
  }

  private calcularStreak(
    ultimo: Timestamp | undefined,
    streakAtual: number,
    agora: Timestamp,
  ): number {
    if (!ultimo) return 1;

    const inicioDoDia = (date: Date): number =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    const dias = Math.round(
      (inicioDoDia(agora.toDate()) - inicioDoDia(ultimo.toDate())) / 86_400_000,
    );

    if (dias === 1) return streakAtual + 1;
    if (dias > 1) return 1;
    return streakAtual;
  }
}
