import { spawn } from 'child_process';
import { randomBytes } from 'crypto';
import { unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Linguagem } from '../common/types/firestore.types';

const TIMEOUT_MS = 3_000;
const MAX_BUFFER = 1024 * 1024;

export interface ResultadoExecucao {
  stdout: string;
  stderr: string;
  timeout: boolean;
}

export interface Executavel {
  executar(input: string): Promise<ResultadoExecucao>;
  limpar(): Promise<void>;
}

export class ErroCompilacao extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErroCompilacao';
  }
}

function executarProcesso(
  comando: string,
  args: string[],
  input: string,
): Promise<ResultadoExecucao> {
  return new Promise((resolve) => {
    const child = spawn(comando, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer) => {
      if (Buffer.byteLength(stdout) < MAX_BUFFER) {
        stdout += chunk.toString('utf8');
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: err.message, timeout: timedOut });
    });

    child.on('close', () => {
      clearTimeout(timer);
      if (timedOut) {
        resolve({ stdout, stderr: 'Tempo limite excedido', timeout: true });
        return;
      }
      if (stderr.trim()) {
        resolve({ stdout, stderr: stderr.trim(), timeout: false });
        return;
      }
      resolve({ stdout, stderr, timeout: false });
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}

function compilarC(src: string, bin: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('gcc', [src, '-o', bin, '-lm'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), TIMEOUT_MS);

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new ErroCompilacao(err.message));
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new ErroCompilacao(stderr.trim() || 'Erro de compilação'));
        return;
      }
      resolve();
    });
  });
}

function criarInline(
  linguagem: 'javascript' | 'python',
  codigo: string,
): Executavel {
  const comando = linguagem === 'javascript' ? 'node' : 'python3';
  const args = linguagem === 'javascript' ? ['-e', codigo] : ['-c', codigo];

  return {
    executar: (input) => executarProcesso(comando, args, input),
    limpar: () => Promise.resolve(),
  };
}

async function criarC(codigo: string): Promise<Executavel> {
  const id = randomBytes(8).toString('hex');
  const src = join(tmpdir(), `programmersquest_${id}.c`);
  const bin = join(tmpdir(), `programmersquest_${id}`);

  await writeFile(src, codigo, 'utf8');

  try {
    await compilarC(src, bin);
  } catch (err) {
    await unlink(src).catch(() => undefined);
    throw err;
  }

  return {
    executar: (input) => executarProcesso(bin, [], input),
    limpar: async () => {
      await Promise.allSettled([unlink(src), unlink(bin)]);
    },
  };
}

export function criarExecutavel(
  codigo: string,
  linguagem: Linguagem,
): Promise<Executavel> {
  if (linguagem === 'javascript' || linguagem === 'python') {
    return Promise.resolve(criarInline(linguagem, codigo));
  }
  if (linguagem === 'c') {
    return criarC(codigo);
  }
  throw new ErroCompilacao(
    `Linguagem "${linguagem}" não possui executor configurado`,
  );
}
