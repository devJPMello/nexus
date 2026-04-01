import {
  BadRequestException,
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadedContent } from './entities/uploaded-content.entity';

export interface UploadedFilePayload {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectRepository(UploadedContent)
    private readonly uploadedContentRepository: Repository<UploadedContent>,
  ) {}

  async storeUserFiles(
    userId: string,
    files: UploadedFilePayload[],
  ): Promise<UploadedContent[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo foi enviado.');
    }

    const storedFiles: UploadedContent[] = [];

    for (const file of files) {
      let textContent = '';
      let imagesBase64: string[] = [];
      
      // Para PDFs, extrair texto e imagens em paralelo
      if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
        this.logger.log(`Processando PDF "${file.originalname}"...`);
        
        // Extrair texto
        try {
          textContent = await this.extractText(file);
          this.logger.log(`Texto extraído: ${textContent.length} caracteres`);
        } catch (textError) {
          this.logger.warn(
            `Erro ao extrair texto do PDF "${file.originalname}", continuando apenas com imagens:`,
            textError as Error,
          );
          textContent = '';
        }
        
        // Extrair imagens (sempre tentar, mesmo se texto falhou)
        this.logger.log(`Iniciando extração de imagens do PDF "${file.originalname}"...`);
        try {
          imagesBase64 = await this.extractImagesFromPdf(file.buffer);
          this.logger.log(
            `✓ Extraídas ${imagesBase64.length} imagens do PDF "${file.originalname}"`,
          );
          if (imagesBase64.length === 0) {
            this.logger.warn(`⚠ Nenhuma imagem foi extraída do PDF "${file.originalname}"`);
          }
        } catch (imageError) {
          this.logger.error(
            `✗ Erro ao extrair imagens do PDF "${file.originalname}":`,
            imageError as Error,
          );
          // Não lançar erro, continuar sem imagens
        }
      } else {
        // Para outros tipos de arquivo, apenas extrair texto
        textContent = await this.extractText(file);
      }

      // Armazenar imagens como JSON no textContent se houver imagens
      // Isso permite que o frontend extraia tanto texto quanto imagens
      let finalTextContent = textContent;
      if (imagesBase64.length > 0) {
        const imagesData = {
          text: textContent || '',
          images: imagesBase64,
          hasImages: true,
        };
        finalTextContent = JSON.stringify(imagesData);
        this.logger.log(
          `Armazenando ${imagesBase64.length} imagens + texto (${textContent.length} chars) para o arquivo "${file.originalname}"`,
        );
      } else if (!textContent || textContent.trim().length === 0) {
        this.logger.warn(
          `⚠ Arquivo "${file.originalname}" não possui texto nem imagens extraídas`,
        );
      }

      const record = this.uploadedContentRepository.create({
        userId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        textContent: finalTextContent,
      });

      storedFiles.push(await this.persistRecord(record));

      this.logger.log(
        'Processed file "' +
          file.originalname +
          '" for user ' +
          userId +
          ' (' +
          textContent.length.toString() +
          ' chars, ' +
          imagesBase64.length.toString() +
          ' images).',
      );
    }

    return storedFiles;
  }

  async listUserFiles(userId: string): Promise<UploadedContent[]> {
    return this.uploadedContentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  private async persistRecord(record: UploadedContent): Promise<UploadedContent> {
    return this.uploadedContentRepository.save(record);
  }

  private async extractText(file: UploadedFilePayload): Promise<string> {
    const extension = this.getFileExtension(file.originalname);
    const normalizedMimeType = file.mimetype?.toLowerCase();

    if (
      normalizedMimeType === 'text/plain' ||
      (!normalizedMimeType && extension === 'txt') ||
      extension === 'txt'
    ) {
      return file.buffer.toString('utf-8');
    }

    if (
      normalizedMimeType === 'application/pdf' ||
      extension === 'pdf'
    ) {
      return this.extractFromPdf(file.buffer);
    }

    if (
      normalizedMimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extension === 'docx'
    ) {
      return this.extractFromDocx(file.buffer);
    }

    throw new UnsupportedMediaTypeException(
      'Tipo de arquivo não suportado: ' + file.originalname,
    );
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() ?? '';
  }

  private async extractFromPdf(buffer: Buffer): Promise<string> {
    try {
      // Primeiro, tenta extrair texto diretamente do PDF
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = pdfParseModule.default ?? pdfParseModule;
      const pdfData = await pdfParse(buffer);
      const extractedText = pdfData.text.trim();
      const numPages = pdfData.numpages || 1;

      // Calcular densidade de texto (caracteres por página)
      const textDensity = extractedText.length / numPages;

      // Critérios para tentar OCR:
      // 1. Texto muito curto (< 50 caracteres total)
      // 2. Densidade de texto muito baixa (< 100 caracteres por página) - indica PDF visual/slide
      // 3. PDF com múltiplas páginas mas pouco texto - provavelmente slides/imagens
      const shouldTryOCR = 
        extractedText.length < 50 || 
        (textDensity < 100 && numPages > 1) ||
        (extractedText.length < 200 && numPages >= 3);

      if (shouldTryOCR) {
        this.logger.log(
          `Texto extraído: ${extractedText.length} caracteres em ${numPages} página(s) (densidade: ${Math.round(textDensity)} chars/página). Tentando OCR...`,
        );
        try {
          const ocrText = await this.extractFromPdfWithOCR(buffer);
          // Se OCR retornar mais texto, usa ele
          if (ocrText.length > extractedText.length) {
            this.logger.log(
              `OCR extraiu ${ocrText.length} caracteres (vs ${extractedText.length} do método direto). Usando OCR.`,
            );
            return ocrText;
          } else {
            this.logger.log(
              `OCR extraiu ${ocrText.length} caracteres (vs ${extractedText.length} do método direto). Usando método direto.`,
            );
          }
        } catch (ocrError) {
          this.logger.warn(
            'OCR falhou, usando texto extraído diretamente',
            ocrError as Error,
          );
        }
      } else {
        this.logger.log(
          `Texto extraído diretamente: ${extractedText.length} caracteres em ${numPages} página(s) (densidade: ${Math.round(textDensity)} chars/página). OCR não necessário.`,
        );
      }

      return extractedText;
    } catch (error) {
      this.logger.error('Falha ao extrair texto de PDF', error as Error);
      throw new BadRequestException(
        'Não foi possível extrair texto do arquivo PDF enviado.',
      );
    }
  }

  private async extractFromPdfWithOCR(buffer: Buffer): Promise<string> {
    try {
      this.logger.log('Iniciando OCR do PDF...');
      
      // Importações dinâmicas com tratamento de erro
      let pdfjsLib: any, createCanvas: any, Tesseract: any;
      
      try {
        pdfjsLib = await import('pdfjs-dist');
        // Configurar worker depois, usando createRequire
      } catch (error) {
        this.logger.error('Erro ao importar pdfjs-dist', error as Error);
        throw new BadRequestException('Biblioteca de PDF não disponível para OCR');
      }

      try {
        const canvasModule = await import('canvas');
        createCanvas = canvasModule.createCanvas || canvasModule.default?.createCanvas;
        if (!createCanvas) {
          throw new Error('createCanvas não encontrado');
        }
      } catch (error) {
        this.logger.error('Erro ao importar canvas', error as Error);
        throw new BadRequestException('Biblioteca Canvas não disponível para OCR');
      }

      try {
        const TesseractModule = await import('tesseract.js');
        Tesseract = TesseractModule.default || TesseractModule;
        if (!Tesseract || !Tesseract.recognize) {
          throw new Error('Tesseract.recognize não encontrado');
        }
      } catch (error) {
        this.logger.error('Erro ao importar tesseract.js', error as Error);
        throw new BadRequestException('Biblioteca Tesseract não disponível para OCR');
      }

      // Configurar worker do pdfjs para Node.js
      try {
        const { createRequire } = await import('module');
        const path = await import('path');
        const fs = await import('fs');
        
        // Usar createRequire para resolver paths (compatível com ESM e CommonJS)
        let workerPath: string | null = null;
        
        try {
          // Tentar resolver usando require (funciona em runtime Node.js)
          const requireFn = createRequire(process.cwd() + '/');
          const pdfjsDistPath = path.dirname(requireFn.resolve('pdfjs-dist/package.json'));
          
          const possibleWorkerPaths = [
            path.join(pdfjsDistPath, 'build', 'pdf.worker.mjs'),
            path.join(pdfjsDistPath, 'build', 'pdf.worker.min.mjs'),
            path.join(pdfjsDistPath, 'legacy', 'build', 'pdf.worker.mjs'),
            path.join(pdfjsDistPath, 'build', 'pdf.worker.js'),
            path.join(pdfjsDistPath, 'build', 'pdf.worker.min.js'),
          ];
          
          for (const possiblePath of possibleWorkerPaths) {
            if (fs.existsSync(possiblePath)) {
              workerPath = possiblePath;
              break;
            }
          }
        } catch (resolveError) {
          // Se createRequire falhar, tentar caminho relativo ao node_modules
          try {
            const path = await import('path');
            const fs = await import('fs');
            const possiblePaths = [
              path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs'),
              path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
            ];
            for (const possiblePath of possiblePaths) {
              if (fs.existsSync(possiblePath)) {
                workerPath = possiblePath;
                break;
              }
            }
          } catch {
            // Ignora erro
          }
        }

        if (workerPath && pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
          this.logger.log(`Worker do PDF configurado: ${workerPath}`);
        } else if (pdfjsLib.GlobalWorkerOptions) {
          // Fallback: desabilitar worker (modo síncrono)
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
          this.logger.warn('Worker do PDF não encontrado, usando modo síncrono');
        }
      } catch (configError) {
        this.logger.warn('Erro ao configurar worker do PDF, usando modo síncrono', configError as Error);
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }
      }

      // Carregar o PDF
      let pdf: any;
      try {
        // Usar getDocument com configuração adequada para Node.js
        const getDocument = pdfjsLib.getDocument || (pdfjsLib as any).default?.getDocument;
        if (!getDocument) {
          throw new Error('getDocument não encontrado em pdfjs-dist');
        }

        const loadingTask = getDocument({
          data: buffer,
          useSystemFonts: true,
          verbosity: 0, // Reduzir logs
        });
        pdf = await loadingTask.promise;
      } catch (error) {
        this.logger.error('Erro ao carregar PDF', error as Error);
        throw new BadRequestException(
          `Não foi possível carregar o arquivo PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        );
      }

      const numPages = pdf.numPages;
      this.logger.log(`PDF carregado com ${numPages} página(s)`);

      if (numPages === 0) {
        throw new BadRequestException('PDF não contém páginas');
      }

      const allText: string[] = [];

      // Processar cada página (limitar a 10 páginas para evitar timeout)
      const maxPages = Math.min(numPages, 10);
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });

          // Criar canvas para renderizar a página
          const canvas = createCanvas(viewport.width, viewport.height);
          const context = canvas.getContext('2d');

          // Renderizar página no canvas usando a API correta do pdfjs-dist
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;

          // Converter canvas para buffer de imagem
          const imageBuffer = canvas.toBuffer('image/png');

          if (!imageBuffer || imageBuffer.length === 0) {
            this.logger.warn(`Página ${pageNum} não gerou imagem válida`);
            continue;
          }

          // Usar Tesseract para OCR
          this.logger.log(`Processando OCR da página ${pageNum}/${maxPages}...`);
          const ocrResult = await Tesseract.recognize(imageBuffer, 'por+eng', {
            logger: (m: any) => {
              if (m.status === 'recognizing text') {
                this.logger.debug(
                  `OCR Progress página ${pageNum}: ${Math.round(m.progress * 100)}%`,
                );
              }
            },
          });

          const extractedText = ocrResult?.data?.text?.trim() || '';
          if (extractedText) {
            allText.push(extractedText);
            this.logger.log(`OCR concluído para página ${pageNum}/${maxPages} (${extractedText.length} caracteres)`);
          } else {
            this.logger.warn(`OCR não extraiu texto da página ${pageNum}`);
          }
        } catch (pageError) {
          this.logger.warn(`Erro ao processar página ${pageNum}`, pageError as Error);
          // Continua com as próximas páginas
        }
      }

      if (numPages > 10) {
        this.logger.warn(`PDF tem ${numPages} páginas, apenas as primeiras 10 foram processadas`);
      }

      const result = allText.join('\n\n').trim();
      if (!result) {
        throw new BadRequestException('OCR não conseguiu extrair texto do PDF');
      }

      this.logger.log(`OCR concluído com sucesso. Total de ${result.length} caracteres extraídos.`);
      return result;
    } catch (error) {
      this.logger.error('Falha no OCR do PDF', error as Error);
      // Se for BadRequestException, re-lança
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Caso contrário, lança erro genérico
      throw new BadRequestException(
        `Erro ao processar OCR: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  private async extractFromDocx(buffer: Buffer): Promise<string> {
    try {
      const mammothModule = await import('mammoth');
      const mammoth = mammothModule.default ?? mammothModule;
      const result = await mammoth.extractRawText({ buffer });
      return (result.value ?? '').trim();
    } catch (error) {
      this.logger.error('Falha ao extrair texto de DOCX', error as Error);
      throw new BadRequestException(
        'Não foi possível extrair texto do arquivo DOCX enviado.',
      );
    }
  }

  /**
   * Extrai imagens de cada página do PDF como base64
   */
  private async extractImagesFromPdf(buffer: Buffer): Promise<string[]> {
    try {
      this.logger.log('Iniciando extração de imagens do PDF...');
      
      let pdfjsLib: any, createCanvas: any;
      
      try {
        pdfjsLib = await import('pdfjs-dist');
      } catch (error) {
        this.logger.error('Erro ao importar pdfjs-dist', error as Error);
        throw new BadRequestException('Biblioteca de PDF não disponível para extração de imagens');
      }

      try {
        const canvasModule = await import('canvas');
        createCanvas = canvasModule.createCanvas || canvasModule.default?.createCanvas;
        if (!createCanvas) {
          throw new Error('createCanvas não encontrado');
        }
      } catch (error) {
        this.logger.error('Erro ao importar canvas', error as Error);
        throw new BadRequestException('Biblioteca Canvas não disponível para extração de imagens');
      }

      // Configurar worker do pdfjs
      try {
        const { createRequire } = await import('module');
        const path = await import('path');
        const fs = await import('fs');
        
        let workerPath: string | null = null;
        
        try {
          const requireFn = createRequire(process.cwd() + '/');
          const pdfjsDistPath = path.dirname(requireFn.resolve('pdfjs-dist/package.json'));
          
          const possibleWorkerPaths = [
            path.join(pdfjsDistPath, 'build', 'pdf.worker.mjs'),
            path.join(pdfjsDistPath, 'build', 'pdf.worker.min.mjs'),
            path.join(pdfjsDistPath, 'legacy', 'build', 'pdf.worker.mjs'),
            path.join(pdfjsDistPath, 'build', 'pdf.worker.js'),
            path.join(pdfjsDistPath, 'build', 'pdf.worker.min.js'),
          ];
          
          for (const possiblePath of possibleWorkerPaths) {
            if (fs.existsSync(possiblePath)) {
              workerPath = possiblePath;
              break;
            }
          }
        } catch {
          // Tentar caminho relativo
          try {
            const path = await import('path');
            const fs = await import('fs');
            const possiblePaths = [
              path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs'),
              path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
            ];
            for (const possiblePath of possiblePaths) {
              if (fs.existsSync(possiblePath)) {
                workerPath = possiblePath;
                break;
              }
            }
          } catch {
            // Ignora erro
          }
        }

        if (workerPath && pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
        } else if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }
      } catch {
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }
      }

      // Carregar o PDF
      const getDocument = pdfjsLib.getDocument || (pdfjsLib as any).default?.getDocument;
      if (!getDocument) {
        throw new Error('getDocument não encontrado em pdfjs-dist');
      }

      const loadingTask = getDocument({
        data: buffer,
        useSystemFonts: true,
        verbosity: 0,
      });
      const pdf = await loadingTask.promise;

      const numPages = pdf.numPages;
      this.logger.log(`PDF carregado com ${numPages} página(s) para extração de imagens`);

      const images: string[] = [];
      const maxPages = Math.min(numPages, 10); // Limitar a 10 páginas

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });

          // Criar canvas para renderizar a página
          const canvas = createCanvas(viewport.width, viewport.height);
          const context = canvas.getContext('2d');

          // Renderizar página no canvas
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;

          // Converter canvas para base64
          const imageBuffer = canvas.toBuffer('image/png');
          const base64Image = imageBuffer.toString('base64');
          images.push(`data:image/png;base64,${base64Image}`);

          this.logger.log(`Imagem extraída da página ${pageNum}/${maxPages}`);
        } catch (pageError) {
          this.logger.warn(`Erro ao extrair imagem da página ${pageNum}`, pageError as Error);
        }
      }

      if (numPages > 10) {
        this.logger.warn(`PDF tem ${numPages} páginas, apenas as primeiras 10 foram processadas`);
      }

      return images;
    } catch (error) {
      this.logger.error('Falha ao extrair imagens do PDF', error as Error);
      throw new BadRequestException(
        `Erro ao extrair imagens do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }
}
