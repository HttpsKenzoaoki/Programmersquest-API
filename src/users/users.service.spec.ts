// Mock do FirebaseService para não carregar o SDK real nos testes unitários
jest.mock('../firebase/firebase.service', () => ({
  FirebaseService: jest.fn().mockImplementation(() => ({
    db: {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          id: 'mock-id',
          set: jest.fn(),
          get: jest.fn(),
          ref: { delete: jest.fn(), update: jest.fn() },
        })),
        orderBy: jest.fn(() => ({ get: jest.fn() })),
      })),
    },
    auth: {},
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, FirebaseService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
