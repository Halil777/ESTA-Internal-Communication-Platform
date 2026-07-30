import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AsteriskService } from './sip/asterisk.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: DataSource, useValue: { query: jest.fn() } },
        {
          provide: AsteriskService,
          useValue: { isConnected: jest.fn().mockReturnValue(false) },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API health payload', () => {
      expect(appController.ping()).toEqual({
        status: 'ok',
        app: 'Esta Connect API',
        version: '1.0.0',
      });
    });
  });
});
