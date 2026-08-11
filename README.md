# Programmer's Quest — API

API backend do **Programmer's Quest**, um jogo educativo gamificado para as ETECs: alunos aprendem lógica de programação resolvendo missões (desafios de código, quizzes e exercícios), ganham XP e avançam de nível, enquanto professores criam turmas, tarefas e acompanham o progresso da turma.

Desenvolvida com **NestJS** e **Firebase** (Authentication + Cloud Firestore), com execução de código real em sandbox local.

## Stack

- **NestJS 11** (Node.js + TypeScript)
- **Firebase Admin SDK 14** — Authentication (verificação de tokens) e Cloud Firestore (dados)
- **class-validator / class-transformer** — validação de DTOs
- Execução de código em subprocessos locais (`node`, `python3`, `gcc`)

## Requisitos

- Node.js 20+
- Um projeto Firebase com Firestore habilitado
- Para execução de código em C/Python/JS, os compiladores/interpretadores no PATH: `gcc`, `python3`, `node`

## Instalação

```bash
npm install
```

## Configuração

Crie um arquivo `.env` na raiz (veja `.env.example`):

```env
# Porta do servidor (opcional, padrão 3000)
PORT=3000

# URL do banco de dados Firestore (opcional)
FIREBASE_DATABASE_URL=https://SEU-PROJETO.firebaseio.com

# JSON da conta de serviço do Firebase (Admin SDK).
# Console Firebase > Configurações do projeto > Contas de serviço > Gerar nova chave privada
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"seu-projeto",...}
```

> **Segurança:** o arquivo `.env` e os JSONs de conta de serviço (`*-adminsdk-*.json`) estão no `.gitignore` e **nunca** devem ser versionados.

## Executando

```bash
# desenvolvimento (watch mode)
npm run start:dev

# produção
npm run build
npm run start:prod
```

A API sobe em `http://localhost:3000` (CORS aberto).

## Criando usuários

O cadastro de usuários é feito pelo professor/administração (não por autosserviço). Há um script utilitário que cria o usuário no Firebase Auth + Firestore e define o papel (`role`) no token:

```bash
node scripts/criar-usuario.mjs \
  --email aluno@etec.sp.gov.br \
  --senha 123456 \
  --nome "Fulano de Tal" \
  --rm 123456 \
  --role aluno \
  --turmaId <id-da-turma>
```

`--role` aceita `aluno` ou `professor`; `--turmaId` é opcional.

## Estrutura de pastas

```
src/
├── auth/            # Autenticação (login/registro/me), guards globais e decorators
├── users/           # CRUD de usuários (dono ou professor)
├── turmas/          # CRUD de turmas (professor)
├── tarefas/         # CRUD de tarefas (professor) + progresso inicial dos alunos
├── progresso/       # Progresso do aluno por tarefa
├── configuracoes/   # Escala de notas por turma + conversão nota→conceito
├── execucao/        # Execução de código (subprocessos) + correção automática
├── common/          # Tipos do Firestore, regras estáticas, utilitários e constantes
└── firebase/        # Inicialização do Admin SDK (Auth + Firestore)
```

## Autenticação e permissões

A API usa o **Firebase Auth**: o cliente envia `Authorization: Bearer <idToken>` em toda requisição. Três guards globais protegem as rotas:

| Guard | O que faz |
|---|---|
| `FirebaseAuthGuard` | Valida o token e injeta `user = { uid, email?, role? }` |
| `RolesGuard` | Exige papéis específicos (`@Roles('professor')`) |
| `OwnerOrProfessorGuard` | Permite o dono do recurso **ou** professor (`@Owner('uid')`) |

Decorators disponíveis: `@Public()`, `@Roles(...)`, `@Owner(...)`, `@CurrentUser()`.

## Endpoints principais

| Método | Rota | Acesso |
|---|---|---|
| `POST` | `/auth/register` | Público |
| `POST` | `/auth/login` | Público |
| `GET` | `/auth/me` | Autenticado |
| `POST/GET/PATCH/DELETE` | `/users[/:uid]` | Professor (POST/GET) · dono ou professor (GET/PATCH/DELETE) |
| `POST/GET/PATCH/DELETE` | `/turmas[/:turmaId]` | Professor (escrita) · autenticado (leitura) |
| `POST/GET/PATCH/DELETE` | `/tarefas[/:tarefaId]` | Professor (escrita) · autenticado (leitura) |
| `POST/GET/PATCH/DELETE` | `/progresso[/:progressoId]` | Dono ou professor |
| `GET/PATCH` | `/configuracoes/:turmaId[/conceito?nota=N]` | Autenticado (leitura) · professor (PATCH) |
| `POST` | `/execucao` | Autenticado (aluno da turma vinculada ou professor) |

### Execução de código

`POST /execucao` recebe `{ tarefaId, codigo }` e:

1. Aplica o scaffold da tarefa (substitui o marcador `// SEU CODIGO AQUI`);
2. Valida **regras estáticas** (`staticRules`: nome de variável, uso obrigatório, proibição, ocorrências mínimas);
3. Executa os `testCases` — `c`/`javascript`/`python` compilam/rodam em subprocesso (timeout 3s, buffer 1MB); `portugol` é avaliado por regras estáticas;
4. Calcula a **nota** (0–100), atualiza o **progresso** do aluno (`tentativas`, `melhorNota`, `status`, `xpGanho`) e soma o XP ao perfil.

Retorna: `aprovada`, `nota`, `xpGanho`, `errosComuns`, `erroExecucao`, `testes` e o `progresso` atualizado.

**Modelo de notas:** `NOTA_MINIMA_CONCLUSAO = 60` (nota ≥ 60 marca a tarefa como concluída). A escala padrão por turma é I/R/B/MB (0–30/30–50/50–80/80–100).

## Testes e lint

```bash
npm test        # testes unitários (Jest)
npm run lint    # eslint + prettier
```
