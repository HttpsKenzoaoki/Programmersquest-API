import { Conceito, EscalaDeNota } from '../types/firestore.types';

export interface ConceitoResultado {
  conceito: Conceito;
  cor: string;
}

// Converte uma nota (0-100) para o conceito I/R/B/MB usando a escala da turma.
// A escala usa faixas com limites sobrepostos (ex: 30 em "0-30" e "30-50");
// sempre prevalece a faixa de maior min que contém a nota.
export function notaParaConceito(
  nota: number,
  escala: EscalaDeNota[],
): ConceitoResultado | null {
  const candidatas = escala.filter(
    (faixa) => nota >= faixa.min && nota <= faixa.max,
  );
  if (candidatas.length === 0) return null;

  const faixa = candidatas.reduce((melhor, atual) =>
    atual.min > melhor.min ? atual : melhor,
  );

  return { conceito: faixa.conceito, cor: faixa.cor };
}
