import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GptModule } from './gpt/gpt.module';
import { ContentModule } from './content/content.module';
import { History } from './gpt/entities/history.entity';
import { UploadedContent } from './content/entities/uploaded-content.entity';

const logger = new Logger('DatabaseConfig');

const buildDatabaseConfig = (): TypeOrmModuleOptions => {
  // Log inicial para debug
  logger.log('Iniciando configuração do banco de dados...');
  logger.log(`DATABASE_URL definida: ${!!process.env.DATABASE_URL}`);
  logger.log(`DB_HOST definido: ${!!process.env.DB_HOST}`);
  
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

  if (process.env.DATABASE_URL?.trim()) {
    const dbUrl = process.env.DATABASE_URL.trim();
    
    // Log para debug (mostra primeiros e últimos caracteres, sem expor senha completa)
    const urlPreview = dbUrl.length > 50 
      ? `${dbUrl.substring(0, 30)}...${dbUrl.substring(dbUrl.length - 20)}`
      : dbUrl.substring(0, 20) + '...';
    logger.log(`DATABASE_URL recebida (preview): ${urlPreview}`);
    
    // Tentar parsear a URL manualmente para evitar problemas de parsing do TypeORM
    try {
      // Remover o protocolo
      const withoutProtocol = dbUrl.replace(/^(?:postgresql|postgres):\/\//, '');
      
      // Encontrar o último @ (separa credenciais do host)
      const atIndex = withoutProtocol.lastIndexOf('@');
      if (atIndex === -1) {
        throw new Error('DATABASE_URL não contém @ separando credenciais do host');
      }
      
      const credentials = withoutProtocol.substring(0, atIndex);
      const hostAndPath = withoutProtocol.substring(atIndex + 1);
      
      // Separar user:password
      const colonIndex = credentials.indexOf(':');
      if (colonIndex === -1) {
        throw new Error('DATABASE_URL não contém : separando usuário e senha');
      }
      
      const username = decodeURIComponent(credentials.substring(0, colonIndex));
      const password = decodeURIComponent(credentials.substring(colonIndex + 1));
      
      // Separar host:port/database
      const pathMatch = hostAndPath.match(/^([^:\/]+)(?::(\d+))?\/(.+)$/);
      if (!pathMatch) {
        throw new Error('DATABASE_URL não contém formato host:port/database válido');
      }
      
      const [, host, port, database] = pathMatch;
      const parsedPort = port ? parseInt(port, 10) : 5432;
      const parsedDatabase = decodeURIComponent(database);
      
      // Validar que o host não é "base" ou inválido
      if (!host || host === 'base' || host.length < 3) {
        throw new Error(
          `Host extraído da DATABASE_URL é inválido: "${host}". Verifique se a URL está completa. Supabase: Settings > Database > Connection string (URI).`,
        );
      }
      
      // Log parcial para debug (sem senha completa)
      logger.log(
        `Conectando ao banco: ${host}:${parsedPort}/${parsedDatabase} (usuário: ${username})`,
      );
      
      return {
        ...baseConfig,
        host,
        port: parsedPort,
        username,
        password,
        database: parsedDatabase,
      };
    } catch (error) {
      // Se não conseguir parsear, verificar se a URL parece válida antes de usar como fallback
      const errorMsg = error instanceof Error ? error.message : 'erro desconhecido';
      logger.error(
        `Erro ao parsear DATABASE_URL: ${errorMsg}`,
      );
      
      // Verificar se a URL parece válida (contém @ e /)
      if (!dbUrl.includes('@') || !dbUrl.includes('/')) {
        throw new Error(
          `DATABASE_URL inválida: não foi possível parsear e formato parece incorreto. ` +
            `Erro: ${errorMsg}. ` +
            `Verifique se está usando a connection string completa do Supabase (Settings > Database > Connection string > URI).`,
        );
      }
      
      // Se parece válida mas não conseguimos parsear, NÃO usar como fallback
      // Lançar erro para forçar correção da URL
      throw new Error(
        `DATABASE_URL não pôde ser parseada corretamente. ` +
          `Erro: ${errorMsg}. ` +
          `URL recebida (preview): ${urlPreview}. ` +
          `Verifique se está usando a connection string completa do Supabase. ` +
          `No Supabase: Settings > Database > Connection string > URI (não Session). ` +
          `Formato esperado: postgresql://user:password@host:port/database`,
      );
    }
  }
  
  // Se não há DATABASE_URL, verificar se há variáveis individuais
  logger.warn('DATABASE_URL não encontrada, usando variáveis DB_* individuais');

  const host = process.env.DB_HOST;
  if (!host || host === 'base') {
    throw new Error(
      `DB_HOST inválido: "${host}". Use o host do banco (ex: db.XXXXX.supabase.co). Não use "base" sozinho. Se usar Supabase, prefira DATABASE_URL com a connection string completa.`,
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
