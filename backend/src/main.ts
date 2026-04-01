import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  // Desabilitar body parser padrão para configurar manualmente com limite maior
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Desabilitar para configurar manualmente
  });
  
  // Aumentar limite de tamanho do body para suportar imagens em base64
  // NestJS usa express por padrão, então podemos acessar o express app
  const expressApp = app.getHttpAdapter().getInstance();
  const express = require('express');
  
  // IMPORTANTE: Configurar body parser com limite maior PRIMEIRO, antes de qualquer outro middleware
  // Configurar body parser para JSON e URL encoded com limite de 20MB
  expressApp.use(express.json({ limit: '20mb' }));
  expressApp.use(express.urlencoded({ limit: '20mb', extended: true }));
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar CORS com suporte a variáveis de ambiente
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:3001',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
      ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'user-id',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const config = new DocumentBuilder()
    .setTitle('Nexus GPT API')
    .setDescription(
      'API responsável por processar requisições de GPT e gerenciar conversas.',
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // http://localhost:3000/api
  
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(Number.isFinite(port) ? port : 3000);
}
bootstrap();
