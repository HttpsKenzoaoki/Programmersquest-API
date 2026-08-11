import { Linguagem, StaticRule } from '../types/firestore.types';

// Regex por linguagem para encontrar nomes de variáveis declaradas
const DECLARACAO_POR_LINGUAGEM: Record<Linguagem, RegExp> = {
  javascript: /\b(?:let|const|var)\s+([A-Za-z_$][\w$]*)/g,
  python: /\b([A-Za-z_]\w*)\s*=/g,
  c: /\b(?:int|float|double|char|long|short|unsigned|signed)\s+([A-Za-z_]\w*)/g,
  portugol:
    /\b(?:variavel|inteiro|real|cadeia|logico|caractere|literal)\s+([A-Za-z_]\w*)/g,
};

const PALAVRAS_RESERVADAS_PYTHON = new Set([
  'if',
  'else',
  'elif',
  'for',
  'while',
  'def',
  'return',
  'import',
  'from',
  'class',
  'with',
  'as',
  'in',
  'is',
  'not',
  'and',
  'or',
  'None',
  'True',
  'False',
  'print',
  'input',
  'range',
  'len',
  'str',
  'int',
  'float',
  'list',
  'dict',
  'set',
  'tuple',
  'lambda',
  'global',
  'pass',
  'break',
  'continue',
  'del',
  'try',
  'except',
  'finally',
  'raise',
]);

function declararVariaveis(codigo: string, linguagem: Linguagem): string[] {
  const regex = DECLARACAO_POR_LINGUAGEM[linguagem];
  regex.lastIndex = 0;

  const nomes = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(codigo)) !== null) {
    const nome = match[1];
    if (!nome) continue;
    if (linguagem === 'python' && PALAVRAS_RESERVADAS_PYTHON.has(nome)) {
      continue;
    }
    nomes.add(nome);
  }
  return [...nomes];
}

function contarOcorrencias(texto: string, valor: string): number {
  if (!valor) return 0;
  let count = 0;
  let idx = texto.indexOf(valor);
  while (idx !== -1) {
    count += 1;
    idx = texto.indexOf(valor, idx + valor.length);
  }
  return count;
}

// Valida o código contra as staticRules da tarefa.
// Retorna as mensagens das regras que falharam.
export function aplicarStaticRules(
  codigo: string,
  linguagem: Linguagem,
  rules: StaticRule[],
): string[] {
  const erros: string[] = [];

  for (const rule of rules ?? []) {
    switch (rule.type) {
      case 'must_use':
        if (!codigo.includes(rule.value)) {
          erros.push(rule.message);
        }
        break;

      case 'forbidden':
        if (codigo.includes(rule.value)) {
          erros.push(rule.message);
        }
        break;

      case 'min_occurrences':
        if (contarOcorrencias(codigo, rule.value) < (rule.count ?? 1)) {
          erros.push(rule.message);
        }
        break;

      case 'variable_name': {
        const padrao = new RegExp(rule.value);
        const variaveis = declararVariaveis(codigo, linguagem);
        const invalidas = variaveis.filter((nome) => !padrao.test(nome));
        if (invalidas.length > 0) {
          erros.push(rule.message);
        }
        break;
      }
    }
  }

  return erros;
}
