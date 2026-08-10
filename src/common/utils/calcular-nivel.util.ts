// Calcula o nível (1 a 10) a partir do XP total.
// Regra atual: 100 XP por nível. Ajuste conforme a mecânica do jogo.
export function calcularNivel(xpTotal: number): number {
  if (!xpTotal || xpTotal <= 0) return 1;
  return Math.min(10, Math.floor(xpTotal / 100) + 1);
}
