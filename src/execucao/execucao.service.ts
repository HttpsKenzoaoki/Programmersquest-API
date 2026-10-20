import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TarefasService } from '../tarefas/tarefas.service';
import { ProgressoService } from '../progresso/progresso.service';
import { UsersService } from '../users/users.service';
import { Tarefa } from '../tarefas/entities/tarefa.entity';
import { User } from '../users/entities/user.entity';
import { AutenticatedUser } from '../auth/auth.types';
import { StatusProgresso } from '../common/types/firestore.types';
import { NOTA_MINIMA_CONCLUSAO } from '../common/constants/nota-minima-conclusao';
import { aplicarStaticRules } from '../common/utils/static-rules.util';
import { criarExecutavel, ErroCompilacao, Executavel } from './runner';
import { ExecutarTarefaDto } from './dto/executar-tarefa.dto';

// Placeholder do scaffold onde o aluno insere o código
const PLACEHOLDER_SCAFFOLD = '// SEU CODIGO AQUI';

export interface TesteExecutado {
  input: string;
  esperado: string;
  obtido: string | null;
  passou: boolean;
}

function normalizar(saida: string): string {
  return saida
    .trim()
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .join('\n');
}

@Injectable()
export class ExecucaoService {
  constructor(
    private readonly tarefasService: TarefasService,
    private readonly progressoService: ProgressoService,
    private readonly usersService: UsersService,
  ) {}

  async executar(dto: ExecutarTarefaDto, user: AutenticatedUser) {
    const tarefa = await this.tarefasService.findOne(dto.tarefaId);
    const usuario = await this.usersService.findOne(user.uid);
    this.verificarPermissao(tarefa, usuario, user);
    this.verificarPrazo(tarefa, user);

    // No tipo "scaffold", o código do aluno é combinado com o scaffold
    const codigoFinal = this.combinarScaffold(dto.codigo, tarefa);

    const errosEstaticos = aplicarStaticRules(
      dto.codigo,
      tarefa.linguagem,
      tarefa.staticRules,
    );

    let nota = 0;
    let testes: TesteExecutado[] = [];
    let erroExecucao: string | null = null;

    if (errosEstaticos.length === 0 && tarefa.testCases.length > 0) {
      // Portugol ainda não possui executor local → validação apenas por staticRules
      if (tarefa.linguagem === 'portugol') {
        nota = 100;
      } else {
        const resultado = await this.executarTestes(codigoFinal, tarefa);
        testes = resultado.testes;
        nota = resultado.nota;
        erroExecucao = resultado.erro;
      }
    } else if (errosEstaticos.length === 0) {
      nota = 100;
    }

    const progresso = await this.registrarProgresso({
      alunoId: user.uid,
      tarefa,
      nota,
      errosEstaticos,
    });

    return {
      tarefaId: tarefa.tarefaId,
      linguagem: tarefa.linguagem,
      aprovada: progresso.status === 'concluida',
      nota,
      xpGanho: progresso.xpGanho,
      errosComuns: errosEstaticos,
      erroExecucao,
      testes,
      progresso: {
        status: progresso.status,
        tentativas: progresso.tentativas,
        melhorNota: progresso.melhorNota,
        xpGanho: progresso.xpGanho,
      },
    };
  }

  private verificarPermissao(
    tarefa: Tarefa,
    usuario: User,
    user: AutenticatedUser,
  ): void {
    if (user.role === 'professor') return;
    if (user.role !== 'aluno') {
      throw new ForbiddenException(
        'Perfil sem permissão para executar tarefas',
      );
    }
    if (!usuario.turmaId || !tarefa.turmaIds.includes(usuario.turmaId)) {
      throw new ForbiddenException(
        'Sua turma não está vinculada a esta tarefa',
      );
    }
  }

  private verificarPrazo(tarefa: Tarefa, user: AutenticatedUser): void {
    if (user.role === 'professor' || !tarefa.prazo) return;
    const prazo = new Date(String(tarefa.prazo)).getTime();
    if (Number.isNaN(prazo) || Date.now() > prazo) {
      throw new BadRequestException('O prazo de entrega desta tarefa expirou');
    }
  }

  private combinarScaffold(codigo: string, tarefa: Tarefa): string {
    if (tarefa.tipo !== 'scaffold' || !tarefa.scaffoldCode) return codigo;
    if (tarefa.scaffoldCode.includes(PLACEHOLDER_SCAFFOLD)) {
      const [prefixo, sufixo] = tarefa.scaffoldCode.split(PLACEHOLDER_SCAFFOLD);
      const trimPrefixo = (prefixo ?? '').trim();
      const trimSufixo = (sufixo ?? '').trim();
      if (
        (trimPrefixo && codigo.includes(trimPrefixo)) ||
        (trimSufixo && codigo.includes(trimSufixo))
      ) {
        return codigo;
      }
      return tarefa.scaffoldCode.replace(PLACEHOLDER_SCAFFOLD, codigo);
    }
    if (codigo.includes(tarefa.scaffoldCode.trim())) {
      return codigo;
    }
    return `${tarefa.scaffoldCode}\n${codigo}`;
  }

  private async executarTestes(
    codigo: string,
    tarefa: Tarefa,
  ): Promise<{ testes: TesteExecutado[]; nota: number; erro: string | null }> {
    let executavel: Executavel;
    try {
      executavel = await criarExecutavel(codigo, tarefa.linguagem);
    } catch (err) {
      const erro =
        err instanceof ErroCompilacao
          ? err.message
          : 'Falha ao preparar a execução';
      return {
        testes: tarefa.testCases.map((tc) => ({
          input: tc.input,
          esperado: tc.expectedOutput,
          obtido: null,
          passou: false,
        })),
        nota: 0,
        erro,
      };
    }

    try {
      const testes: TesteExecutado[] = [];
      for (const tc of tarefa.testCases) {
        const resultado = await executavel.executar(tc.input);
        const obtido = normalizar(resultado.stdout);
        const esperado = normalizar(tc.expectedOutput);
        testes.push({
          input: tc.input,
          esperado: tc.expectedOutput,
          obtido: resultado.stdout.trim(),
          passou: obtido === esperado,
        });
      }

      const passaram = testes.filter((t) => t.passou).length;
      const nota =
        testes.length > 0 ? Math.round((passaram / testes.length) * 100) : 0;

      return { testes, nota, erro: null };
    } finally {
      await executavel.limpar();
    }
  }

  private async registrarProgresso(params: {
    alunoId: string;
    tarefa: Tarefa;
    nota: number;
    errosEstaticos: string[];
  }): Promise<{
    status: StatusProgresso;
    tentativas: number;
    melhorNota: number;
    xpGanho: number;
  }> {
    const { alunoId, tarefa, nota, errosEstaticos } = params;

    const anterior = await this.progressoService.findOneForOptional(
      alunoId,
      tarefa.tarefaId,
    );

    const tentativas = (anterior?.tentativas ?? 0) + 1;
    const melhorNota = Math.max(anterior?.melhorNota ?? 0, nota);
    const status: StatusProgresso =
      nota >= NOTA_MINIMA_CONCLUSAO ? 'concluida' : 'em-andamento';
    const xpAnterior = anterior?.xpGanho ?? 0;
    const xpDesejado = Math.round(tarefa.xpRecompensa * (nota / 100));
    const xpGanho = Math.max(xpAnterior, xpDesejado);

    const dados = {
      status,
      tentativas,
      melhorNota,
      xpGanho,
      ultimaTentativa: new Date().toISOString(),
      errosComuns: errosEstaticos,
    };

    if (anterior) {
      await this.progressoService.update(anterior.progressoId, dados);
    } else {
      await this.progressoService.create({
        alunoId,
        tarefaId: tarefa.tarefaId,
        ...dados,
      });
    }

    return { status, tentativas, melhorNota, xpGanho };
  }
}
