import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TurmasModule } from './turmas/turmas.module';
import { TarefasModule } from './tarefas/tarefas.module';
import { ProgressoModule } from './progresso/progresso.module';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module';
import { ExecucaoModule } from './execucao/execucao.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseModule,
    AuthModule,
    UsersModule,
    TurmasModule,
    TarefasModule,
    ProgressoModule,
    ConfiguracoesModule,
    ExecucaoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
