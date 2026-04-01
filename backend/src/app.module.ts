import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { parse as parseDatabaseUrl } from 'pg-connection-string';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GptModule } from './gpt/gpt.module';
import { ContentModule } from './content/content.module';
import { History } from './gpt/entities/history.entity';
import { UploadedContent } from './content/entities/uploaded-content.entity';

const logger = new Logger('DatabaseConfig');

const isPlaceholderHost = (urlOrHost: string): boolean => {
  const lower = urlOrHost.toLowerCase();
  return lower.includes('db.xxx.') || lower.includes('xxx.supabase');
};

const buildDatabaseConfig = (): TypeOrmModuleOptions => {
  logger.log('Configurando PostgreSQL (TypeORM)...');
  logger.log(`DATABASE_URL definida: ${!!process.env.DATABASE_URL?.trim()}`);
  logger.log(`DB_HOST definido: ${!!process.env.DB_HOST?.trim()}`);

  const sslEnabled = process.env.DB_SSL !== 'false';

  const baseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    entities: [History, UploadedContent],
    synchronize: false,
    logging: ['error'],
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    extra: sslEnabled
      ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : undefined,
  };

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    if (isPlaceholderHost(databaseUrl)) {
      throw new Error(
        'DATABASE_URL parece ser um exemplo (contém xxx ou placeholder). ' +
          'Use a connection string real do PostgreSQL (Render → Database → Connections, ou Supabase/Neon URI).',
      );
    }
    const preview =
      databaseUrl.length > 55
        ? `${databaseUrl.slice(0, 28)}...${databaseUrl.slice(-22)}`
        : `${databaseUrl.slice(0, 24)}...`;
    logger.log(`DATABASE_URL (preview): ${preview}`);

    // Parser do `pg`: separa o nome da base dos query params (?sslmode=… do Neon, etc.).
    // Só `url` no TypeORM pode meter `neondb?sslmode=require` no campo database.
    const parsed = parseDatabaseUrl(databaseUrl, { useLibpqCompat: true });
    if (!parsed.host) {
      throw new Error('DATABASE_URL inválida: host em falta.');
    }
    if (!parsed.database) {
      throw new Error('DATABASE_URL inválida: nome da base (path) em falta.');
    }

    const port = parsed.port ? parseInt(String(parsed.port), 10) : 5432;

    return {
      ...baseConfig,
      host: parsed.host,
      port: Number.isFinite(port) ? port : 5432,
      username: parsed.user ?? undefined,
      password: parsed.password ?? undefined,
      database: parsed.database,
    };
  }

  logger.warn('DATABASE_URL vazia; a usar DB_HOST / DB_USERNAME / DB_PASSWORD / DB_DATABASE');

  const host = process.env.DB_HOST?.trim();
  if (!host || host === 'base' || isPlaceholderHost(host)) {
    throw new Error(
      'Configure PostgreSQL: defina DATABASE_URL (recomendado) ou DB_HOST, DB_USERNAME, DB_PASSWORD e DB_DATABASE. ' +
        'No Render, ligue o Postgres ao Web Service ou copie a External Database URL.',
    );
  }

  return {
    ...baseConfig,
    host,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  };
};

const frontendDistPath = join(__dirname, '..', '..', 'frontend', 'dist');
const serveFrontendImports = existsSync(join(frontendDistPath, 'index.html'))
  ? [
      ServeStaticModule.forRoot({
        rootPath: frontendDistPath,
        exclude: ['/api*', '/api-json*', '/agents*', '/content*'],
      }),
    ]
  : [];

@Module({
  imports: [
    ...serveFrontendImports,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(buildDatabaseConfig()),
    GptModule,
    ContentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
