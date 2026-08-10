export type Role = 'aluno' | 'professor';
export type Trilha = 'iniciante' | 'intermediario' | 'avancado';
export type Linguagem = 'portugol' | 'c' | 'javascript' | 'python';
export type TarefaNivel = 'iniciante' | 'intermediario' | 'avancado';
export type TipoTarefa =
  | 'quiz'
  | 'fill-in'
  | 'correcao'
  | 'codigo-livre'
  | 'scaffold';
export type StatusProgresso =
  | 'bloqueada'
  | 'disponivel'
  | 'em-andamento'
  | 'concluida';
export type Conceito = 'I' | 'R' | 'B' | 'MB';

export interface StaticRule {
  type: 'variable_name' | 'must_use' | 'forbidden' | 'min_occurrences';
  value: string;
  message: string;
  count?: number;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  descricao?: string;
}

export interface EscalaDeNota {
  min: number;
  max: number;
  conceito: Conceito;
  cor: string;
}
