import { SetMetadata } from '@nestjs/common';

export const OWNER_KEY = 'owner';

export interface OwnerMetadata {
  paramName: string;
  source: 'param' | 'query' | 'body';
  composite: boolean;
}

// Protege uma rota para que somente o dono do recurso (ou professor) a acesse.
// composite: quando o id é composto "uid_tarefaId", extrai o uid do prefixo.
export const Owner = (
  paramName: string,
  source: OwnerMetadata['source'] = 'param',
  composite = false,
) => SetMetadata(OWNER_KEY, { paramName, source, composite });
