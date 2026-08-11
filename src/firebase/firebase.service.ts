import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  App,
  ServiceAccount,
  initializeApp,
  cert,
  deleteApp,
} from 'firebase-admin/app';
import { Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Auth, getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseService implements OnModuleDestroy {
  private readonly app: App;
  readonly db: Firestore;
  readonly auth: Auth;

  constructor(private readonly configService: ConfigService) {
    const serviceAccountJson = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT',
    );

    if (serviceAccountJson) {
      this.app = initializeApp({
        credential: cert(JSON.parse(serviceAccountJson) as ServiceAccount),
        databaseURL: this.configService.get<string>('FIREBASE_DATABASE_URL'),
      });
    } else {
      // Sem credencial explícita: usa GOOGLE_APPLICATION_CREDENTIALS ou ADC
      this.app = initializeApp({
        databaseURL: this.configService.get<string>('FIREBASE_DATABASE_URL'),
      });
    }

    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
  }

  static now(): Timestamp {
    return Timestamp.now();
  }

  onModuleDestroy(): void {
    void deleteApp(this.app);
  }
}
