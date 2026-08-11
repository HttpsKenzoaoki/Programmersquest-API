// Cria um usuário direto no Firebase Auth + Firestore via Admin SDK.
// Uso: node scripts/criar-usuario.mjs --email user@etec.sp.gov.br --senha 123456 \
//        --nome "Fulano" --rm 123456 --role professor [--turmaId <id>]
import { cert, deleteApp, initializeApp } from 'firebase-admin/app';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

process.loadEnvFile('.env');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      out[arg.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

function help() {
  console.log(`Uso:
  node scripts/criar-usuario.mjs \\
    --email <email> --senha <senha> --nome <nome> --rm <rm> --role <professor|aluno> \\
    [--turmaId <id-da-turma>]`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const { email, senha, nome, rm, role } = args;

if (!email || !senha || !nome || !rm || !role) help();
if (role !== 'professor' && role !== 'aluno') {
  console.error('--role deve ser "professor" ou "aluno"');
  process.exit(1);
}

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccount) {
  console.error('FIREBASE_SERVICE_ACCOUNT não definida no .env');
  process.exit(1);
}

const app = initializeApp({
  credential: cert(JSON.parse(serviceAccount)),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});
const db = getFirestore(app);
const auth = getAuth(app);

try {
  const usuario = await auth.createUser({ email, password: senha, displayName: nome });
  await auth.setCustomUserClaims(usuario.uid, { role });

  const agora = Timestamp.now();
  await db.collection('users').doc(usuario.uid).set({
    uid: usuario.uid,
    nome,
    rm,
    email,
    role,
    turmaId: args.turmaId ?? null,
    trilha: 'iniciante',
    xpTotal: 0,
    nivel: 1,
    streak: 0,
    ultimoAcessoEm: null,
    criadoEm: agora,
  });

  console.log('Usuário criado com sucesso:');
  console.log(`  uid:   ${usuario.uid}`);
  console.log(`  email: ${usuario.email}`);
  console.log(`  role:  ${role}`);
} catch (err) {
  console.error(`Erro: ${err.message}`);
  process.exitCode = 1;
} finally {
  await deleteApp(app);
}
