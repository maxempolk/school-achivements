import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod';
import cookieParser from 'cookie-parser';
import { INestApplication } from '@nestjs/common';

function CorsSetup(app: INestApplication) {
  const frontendUrl =
    process.env.FRONTEND_URL ??
    (process.env.NODE_ENV === 'production'
      ? undefined
      : 'http://localhost:3001');

  if (!frontendUrl) {
    throw new Error('FRONTEND_URL is required in production');
  }

  const allowedOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    throw new Error('FRONTEND_URL is required in production');
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  app.useGlobalPipes(new ZodValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('School Achievements API')
    .setDescription('API for school management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));

  // TODO: make CORS more strict in prod
  CorsSetup(app);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
