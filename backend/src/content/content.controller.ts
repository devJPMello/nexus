import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ContentService, UploadedFilePayload } from './content.service';

const uploadInterceptor = FilesInterceptor('files', 10, {
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(uploadInterceptor)
  @ApiOperation({
    summary: 'Upload de arquivos de conteúdo',
    description:
      'Aceita arquivos .txt, .pdf e .docx, extrai o texto e salva associado ao usuário.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiHeader({
    name: 'user-id',
    description: 'Identificador do usuário proprietário do conteúdo.',
    required: true,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Arquivos processados e armazenados com sucesso.',
  })
  async uploadContent(
    @UploadedFiles() files: UploadedFilePayload[] | undefined,
    @Headers('user-id') userId?: string,
  ) {
    if (!userId) {
      throw new BadRequestException(
        'O cabeçalho "user-id" é obrigatório para vincular os arquivos.',
      );
    }

    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Nenhum arquivo foi enviado. Por favor, selecione pelo menos um arquivo.',
      );
    }

    const records = await this.contentService.storeUserFiles(userId, files);

    return {
      message: 'Arquivos processados com sucesso.',
      userId,
      items: records.map((record) => {
        // Verificar se o textContent contém imagens (formato JSON)
        let textContent = record.textContent;
        let images: string[] = [];
        let hasImages = false;

        try {
          const parsed = JSON.parse(record.textContent);
          if (parsed.hasImages && Array.isArray(parsed.images)) {
            textContent = parsed.text || '';
            images = parsed.images;
            hasImages = true;
          }
        } catch {
          // Não é JSON, usar texto normalmente
        }

        return {
          id: record.id,
          filename: record.filename,
          mimeType: record.mimeType,
          size: record.size,
          createdAt: record.createdAt,
          textLength: textContent.length,
          textContent: textContent,
          images: hasImages ? images : undefined,
          hasImages: hasImages,
        };
      }),
    };
  }
}
