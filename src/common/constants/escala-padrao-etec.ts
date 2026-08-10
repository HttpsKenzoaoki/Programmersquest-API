import { EscalaDeNota } from '../types/firestore.types';

// Escala padrão ETEC criada automaticamente ao criar uma turma
export const ESCALA_PADRAO_ETEC: EscalaDeNota[] = [
  { min: 0, max: 30, conceito: 'I', cor: '#ef4444' },
  { min: 30, max: 50, conceito: 'R', cor: '#f97316' },
  { min: 50, max: 80, conceito: 'B', cor: '#3b82f6' },
  { min: 80, max: 100, conceito: 'MB', cor: '#22c55e' },
];
