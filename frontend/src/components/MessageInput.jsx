import { useState, useRef, useEffect } from 'react';
import './MessageInput.css';

// Função para comprimir imagem
const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.8, maxSizeMB = 2) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Criar canvas para redimensionar e comprimir
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para base64 com compressão
        const mimeType = file.type || 'image/jpeg';
        const outputFormat = mimeType.includes('png') ? 'image/png' : 'image/jpeg';
        
        let compressedBase64 = canvas.toDataURL(outputFormat, quality);
        let sizeInMB = (compressedBase64.length * 3) / 4 / 1024 / 1024;
        
        // Se ainda estiver muito grande, reduzir qualidade
        if (sizeInMB > maxSizeMB) {
          let currentQuality = quality;
          let attempts = 0;
          while (sizeInMB > maxSizeMB && currentQuality > 0.3 && attempts < 5) {
            currentQuality -= 0.1;
            compressedBase64 = canvas.toDataURL(outputFormat, currentQuality);
            sizeInMB = (compressedBase64.length * 3) / 4 / 1024 / 1024;
            attempts++;
          }
        }
        
        console.log(`Imagem comprimida: ${file.name}, tamanho original: ${(file.size / 1024 / 1024).toFixed(2)} MB, comprimido: ${sizeInMB.toFixed(2)} MB`);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Função para converter arquivo de imagem para base64 (com compressão)
const fileToBase64 = async (file) => {
  // Se a imagem for maior que 1MB, comprimir
  if (file.size > 1024 * 1024) {
    return await compressImage(file);
  }
  
  // Se for pequena, converter normalmente
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Função para verificar se é uma imagem
const isImageFile = (file) => {
  return file.type.startsWith('image/');
};

const AttachmentModal = ({ isOpen, onClose, onFileSelect, onImageSelect }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (files) => {
    if (files && files.length > 0) {
      // Separar imagens de outros arquivos
      const imageFiles = Array.from(files).filter(isImageFile);
      const otherFiles = Array.from(files).filter(file => !isImageFile(file));

      // Processar imagens se houver callback
      if (imageFiles.length > 0 && onImageSelect) {
        onImageSelect(imageFiles);
      }

      // Processar outros arquivos (PDFs, etc)
      if (otherFiles.length > 0 && onFileSelect) {
        onFileSelect(otherFiles);
      }

      onClose();
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      // Aceitar imagens e documentos
      const validTypes = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];
      const validFiles = files.filter(file => {
        // Aceitar imagens
        if (isImageFile(file)) {
          return true;
        }
        // Aceitar documentos válidos
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        return validTypes.includes(fileExtension);
      });
      
      if (validFiles.length > 0) {
        if (validFiles.length < files.length) {
          alert(`${files.length - validFiles.length} arquivo(s) foram ignorados por tipo não suportado.`);
        }
        handleFileSelect(validFiles);
      } else {
        alert('Nenhum arquivo válido encontrado. Tipos suportados: PDF, DOC, DOCX, TXT, RTF, ODT, Imagens (JPG, PNG, GIF, etc)');
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div 
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-zone-icon"></div>
          <p className="drop-zone-text">
            {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
          </p>
          <span className="drop-zone-hint">PDF, DOC, DOCX, TXT, RTF, ODT, Imagens (JPG, PNG, GIF, etc) - múltiplos arquivos permitidos</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.txt,.rtf,.odt,image/*"
          multiple
        />
      </div>
    </div>
  );
};

const MessageInput = ({ onSendMessage, placeholder = "Como posso te ajudar hoje?", disabled = false, isProcessing = false }) => {
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [attachedImages, setAttachedImages] = useState([]); // Array de { base64, name, preview }
  const [isDragging, setIsDragging] = useState(false);
  const [pendingImages, setPendingImages] = useState([]); // Imagens que foram enviadas mas ainda aguardando resposta
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const prevProcessingRef = useRef(false);
  const pendingImagesRef = useRef([]); // Ref para manter as imagens mesmo durante re-renderizações
  
  // Sincronizar ref com state para garantir persistência
  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);
  

  // Função para processar imagens e converter para base64
  const processImages = async (files) => {
    const imageFiles = Array.from(files).filter(isImageFile);
    if (imageFiles.length === 0) return;

    const processedImages = await Promise.all(
      imageFiles.map(async (file) => {
        try {
          const base64 = await fileToBase64(file);
          
          // Validar formato base64
          if (!base64 || typeof base64 !== 'string') {
            console.error('Erro: base64 inválido para arquivo:', file.name);
            return null;
          }

          // Verificar se está no formato correto (data:image/...;base64,...)
          if (!base64.startsWith('data:image/')) {
            console.error('Erro: formato base64 inválido (deve começar com data:image/):', base64.substring(0, 50));
            return null;
          }

          // Calcular tamanho do base64 (aproximado)
          const base64SizeMB = (base64.length * 3) / 4 / 1024 / 1024;
          console.log(`Imagem processada: ${file.name}, tamanho original: ${(file.size / 1024 / 1024).toFixed(2)} MB, base64: ${base64SizeMB.toFixed(2)} MB`);
          
          // Avisar se ainda estiver muito grande
          if (base64SizeMB > 5) {
            console.warn(`⚠️ Aviso: Imagem ainda muito grande (${base64SizeMB.toFixed(2)} MB). Pode causar erro no servidor.`);
          }
          
          return {
            base64,
            name: file.name,
            preview: base64,
            size: file.size,
          };
        } catch (error) {
          console.error('Erro ao processar imagem:', file.name, error);
          return null;
        }
      })
    );

    // Filtrar imagens nulas (que falharam no processamento)
    const validImages = processedImages.filter(img => img !== null);
    
    if (validImages.length !== processedImages.length) {
      console.warn(`${processedImages.length - validImages.length} imagem(ns) falharam no processamento`);
    }

    if (validImages.length > 0) {
      setAttachedImages(prev => [...prev, ...validImages]);
    }
  };

  // Handler para colar imagens (Ctrl+V)
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      await processImages(imageFiles);
    }
  };

  // Handler para drag & drop de imagens
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      // Separar imagens de outros arquivos
      const imageFiles = files.filter(isImageFile);
      const otherFiles = files.filter(file => !isImageFile(file));

      // Processar imagens
      if (imageFiles.length > 0) {
        await processImages(imageFiles);
      }

      // Processar outros arquivos (PDFs, etc) - usar o modal ou adicionar diretamente
      if (otherFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...otherFiles]);
      }
    }
  };


  // Atualizar ref de processamento
  useEffect(() => {
    prevProcessingRef.current = isProcessing;
  }, [isProcessing]);
  

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasContent = message.trim() || attachedFiles.length > 0 || attachedImages.length > 0;
    if (hasContent) {
      // Preparar imagens em base64 para envio
      let imagesBase64 = [];
      if (attachedImages.length > 0) {
        imagesBase64 = attachedImages.map(img => img.base64);
      }
      
      // Enviar mensagem - o preview aparecerá acima da mensagem na conversa
      onSendMessage(message, attachedFiles, imagesBase64);
      
      // Limpar tudo após enviar
      setMessage('');
      setAttachedFiles([]);
      setAttachedImages([]);
      setPendingImages([]);
      pendingImagesRef.current = [];
    }
  };
  
  // NÃO limpar pendingImages automaticamente - ele deve permanecer visível
  // O preview só será limpo quando o usuário explicitamente adicionar novas imagens
  // (isso é feito em handleImageSelect)

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleAttachmentClick = () => {
    setIsModalOpen(true);
  };

  const handleFileSelect = (files) => {
    if (Array.isArray(files)) {
      setAttachedFiles(prev => [...prev, ...files]);
    } else {
      setAttachedFiles(prev => [...prev, files]);
    }
  };

  const handleImageSelect = async (files) => {
    if (files && files.length > 0) {
      await processImages(files);
    }
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveImage = (index) => {
    // Se estiver removendo de attachedImages, não afetar pendingImages
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleRemovePendingImage = (index) => {
    // Remover imagem do preview pendente
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <AttachmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFileSelect={handleFileSelect}
        onImageSelect={handleImageSelect}
      />
      
      <div 
        ref={containerRef}
        className={`message-input-container ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <form onSubmit={handleSubmit} className="message-form">
          {/* Preview de imagens */}
          {attachedImages.length > 0 && (
            <div className="attached-images-preview">
              {attachedImages.map((image, index) => (
                <div key={index} className="attached-image-preview">
                  <img 
                    src={image.preview} 
                    alt={image.name}
                    className="image-preview-thumbnail"
                  />
                  <div className="image-preview-info">
                    <span className="image-preview-name">{image.name}</span>
                    <span className="image-preview-size">
                      {(image.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveImage(index)}
                    className="remove-image-btn"
                    title="Remover imagem"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Preview de arquivos */}
          {attachedFiles.length > 0 && (
            <div className="attached-files-preview">
              {attachedFiles.map((file, index) => (
                <div key={index} className="attached-file-preview">
                  <span>📎 {file.name}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveFile(index)}
                    className="remove-file-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="input-wrapper">
            <button
              type="button"
              className="attachment-btn"
              onClick={handleAttachmentClick}
              disabled={disabled}
              title="Anexar arquivo ou imagem (PDF, DOC, imagens, etc)"
            >
              <span className="plus-icon">+</span>
            </button>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder={disabled ? "Processando..." : placeholder}
              className="message-textarea"
              rows="1"
              disabled={disabled}
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default MessageInput;