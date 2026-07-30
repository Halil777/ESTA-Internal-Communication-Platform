import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsAdapter } from '@nestjs/platform-ws';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Plain WebSocket adapter (instead of Socket.IO) — compatible with OkHttp
  app.useWebSocketAdapter(new WsAdapter(app));

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS — allow office LAN (10.10.20.x) + localhost dev servers
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      /^http:\/\/10\.10\.20\.\d+/,
      /^http:\/\/192\.168\./,
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API versioning prefix
  app.setGlobalPrefix('api/v1');

  // Swagger docs (dev only)
  if (nodeEnv !== 'production') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Esta Connect API')
      .setDescription('Office VoIP Platform — Internal REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port, '0.0.0.0');
  console.log(`Esta Connect Backend running on http://0.0.0.0:${port}`);
  console.log(`Local access: http://10.10.20.231:${port}/api/v1`);
  if (nodeEnv !== 'production') {
    console.log(`Swagger docs: http://10.10.20.231:${port}/api/docs`);
  }
}

void bootstrap();
