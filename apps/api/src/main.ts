import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ensureCollateralUploadDir } from './common/utils/collateral-upload.util';
import { ensureChildSavingsUploadDir } from './common/utils/child-savings-upload.util';
import { ensureCustomerPhotoUploadDir } from './common/utils/customer-photo-upload.util';

async function bootstrap() {
  ensureCollateralUploadDir();
  ensureChildSavingsUploadDir();
  ensureCustomerPhotoUploadDir();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Tanjuriel Microfinance API')
    .setDescription('Enterprise MFI platform — auth, teller, manager, reporting & operations')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const http = app.getHttpAdapter().getInstance();
  http.get('/', (_req: unknown, res: { json: (body: object) => void }) => {
    res.json({
      service: 'Tanjuriel Microfinance API',
      status: 'ok',
      health: '/api/v1/health',
      healthDb: '/api/v1/health/db',
      docs: '/api/docs',
    });
  });

  const port = process.env.PORT || process.env.API_PORT || 4000;
  const host = process.env.API_HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`API listening on ${host}:${port}`);
  console.log(`Health: http://${host}:${port}/api/v1/health`);
  console.log(`Swagger: http://${host}:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
