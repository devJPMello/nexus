import { useState, useEffect, useRef } from 'react';
import MessageInput from '../MessageInput';
import MarkdownRenderer from '../MarkdownRenderer';
import './Geral.css';
import LogoLoader from './LogoLoader';
import { BRANDING } from '../../constants/brandingUrls';
import { jsPDF } from 'jspdf';

const Geral = ({ onSendMessage, onEditMessage, onCancelGeneration, onBackToDashboard, sidebarOpen, messages = [], processingStates = {} }) => {
  const [localMessages, setLocalMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);


  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  useEffect(() => {
    const lastMessage = localMessages[localMessages.length - 1];
    if (lastMessage && lastMessage.sender === 'user') {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (lastMessage && lastMessage.sender === 'assistant') {
      setIsTyping(false);
    }
  }, [localMessages]);

  // Auto-resize textarea when editing text changes
  useEffect(() => {
    if (textareaRef.current && editingMessageId) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 160; // 10rem = 160px
      textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [editingText, editingMessageId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (message, files = [], images = []) => {
    onSendMessage(message, files, images, 'geral');
  };

  const handleStartEdit = (messageId, currentText) => {
    // Cancelar geração em andamento quando o usuário clicar em alterar
    if (onCancelGeneration) {
      onCancelGeneration();
    }
    setEditingMessageId(messageId);
    setEditingText(currentText);
    setOriginalText(currentText); // Armazenar o texto original
  };

  const handleCancelEdit = () => {
    const messageIdToReuse = editingMessageId;
    const originalTextToReuse = originalText;
    
    setEditingMessageId(null);
    setEditingText('');
    setOriginalText('');
    
    // Reenviar a mensagem original para gerar a resposta do agente
    if (messageIdToReuse && originalTextToReuse && originalTextToReuse.trim()) {
      onEditMessage(messageIdToReuse, originalTextToReuse, 'geral');
    }
  };

  const handleSaveEdit = () => {
    if (editingText.trim() && editingMessageId) {
      onEditMessage(editingMessageId, editingText, 'geral');
      setEditingMessageId(null);
      setEditingText('');
    }
  };

  const handleCopyMessage = async (messageText, messageId) => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (error) {
      console.error('Erro ao copiar mensagem:', error);
    }
  };

  const handleDownloadAsPDF = (messageText, messageId) => {
    try {
      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 25;
      const maxWidth = pageWidth - 2 * margin;
      
      // Find first title in markdown (if exists) and skip intro lines
      const lines = messageText.split('\n');
      let hasTitle = false;
      let startIndex = 0;
      let titleY = 30;
      
      // Skip introductory lines (like "Com certeza! Aqui está...")
      // Look for lines that are just text without markdown formatting and end with ":--" or similar
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) {
          startIndex = i + 1;
          continue;
        }
        
        // Skip lines that are just introductory text (no markdown, ends with colon or similar)
        if (line.match(/^(Com certeza|Claro|Perfeito|Ótimo|Excelente).*[:\-]{1,2}$/i) ||
            (line.length < 100 && !line.match(/^#{1,6}\s+/) && !line.match(/^[-*+]\s+/) && !line.match(/^\d+\.\s+/) && line.endsWith(':'))) {
          startIndex = i + 1;
          continue;
        }
        
        // Check if this line is a title
        if (line.match(/^#{1,6}\s+/)) {
          const titleMatch = line.match(/^#{1,6}\s+(.+)$/);
          if (titleMatch) {
            hasTitle = true;
            const pdfTitle = titleMatch[1];
            startIndex = i + 1; // Skip the title line as we'll render it as PDF title
            
            // Header with title
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            const titleLines = doc.splitTextToSize(pdfTitle, maxWidth);
            titleLines.forEach((line) => {
              doc.text(line, margin, titleY);
              titleY += 8;
            });
            
            // No line separator - removed
            
            titleY = titleY + 5;
          }
          break;
        }
        
        // If we found actual content (not intro), stop skipping
        if (line.match(/^#{1,6}\s+/) || line.match(/^[-*+]\s+/) || line.match(/^\d+\.\s+/) || line.length > 50) {
          break;
        }
      }
      
      // If no title found but we skipped intro, check if first content line is a title
      if (!hasTitle && startIndex < lines.length) {
        const firstContentLine = lines[startIndex]?.trim();
        if (firstContentLine && firstContentLine.match(/^#{1,6}\s+/)) {
          const titleMatch = firstContentLine.match(/^#{1,6}\s+(.+)$/);
          if (titleMatch) {
            hasTitle = true;
            const pdfTitle = titleMatch[1];
            startIndex = startIndex + 1;
            
            // Header with title
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            const titleLines = doc.splitTextToSize(pdfTitle, maxWidth);
            titleLines.forEach((line) => {
              doc.text(line, margin, titleY);
              titleY += 8;
            });
            
            // No line separator - removed
            
            titleY = titleY + 5;
          }
        }
      }
      
      // If no title, start content from top
      let y = hasTitle ? titleY : 30;
      const pageBottom = pageHeight - margin - 15;
      const baseFontSize = 10;
      const baseLineHeight = 5;
      let inCodeBlock = false;
      
      // Parse markdown line by line (starting from startIndex to skip title if used)
      for (let i = startIndex; i < lines.length; i++) {
        let line = lines[i];
        const originalLine = line;
        
        // Skip horizontal rules (---)
        if (line.trim().match(/^[-*_]{3,}$/)) {
          continue;
        }
        
        // Check for code block markers
        if (line.trim().startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          if (inCodeBlock) {
            y += 2; // Space before code block
          }
          continue;
        }
        
        // Check if we need a new page
        if (y > pageBottom) {
          doc.addPage();
          y = margin + 10;
        }
        
        let currentX = margin;
        let fontSize = baseFontSize;
        let isBold = false;
        let indent = 0;
        
        // Process headers
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          fontSize = 20 - (level * 2);
          doc.setFontSize(fontSize);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 30);
          line = headerMatch[2];
          y += 2; // Extra space before header
        }
        // Process list items (with nested support)
        else if (line.match(/^\s*[-*+]\s+/)) {
          const indentLevel = (line.match(/^\s*/)?.[0]?.length || 0) / 2; // Count spaces/2 for indent level
          indent = 15 + (indentLevel * 15);
          currentX = margin + indent;
          line = line.replace(/^\s*[-*+]\s+/, '• ');
          doc.setFontSize(baseFontSize);
          doc.setFont('helvetica', 'normal');
        }
        // Process numbered list (with nested support)
        else if (line.match(/^\s*\d+\.\s+/)) {
          const indentLevel = (line.match(/^\s*/)?.[0]?.length || 0) / 3; // Count spaces/3 for indent level
          indent = 15 + (indentLevel * 15);
          currentX = margin + indent;
          // Keep the number in the line
          doc.setFontSize(baseFontSize);
          doc.setFont('helvetica', 'normal');
        }
        // Code block content
        else if (inCodeBlock) {
          doc.setFont('courier', 'normal');
          doc.setFontSize(baseFontSize - 1);
          doc.setTextColor(50, 50, 50);
          doc.setFillColor(245, 245, 245);
          const codeLines = doc.splitTextToSize(line, maxWidth - 10);
          codeLines.forEach((codeLine) => {
            if (y + baseLineHeight > pageBottom) {
              doc.addPage();
              y = margin + 10;
            }
            const codeWidth = doc.getTextWidth(codeLine);
            doc.rect(margin, y - 4, maxWidth, baseLineHeight + 1, 'F');
            doc.text(codeLine, margin + 5, y);
            y += baseLineHeight + 1;
          });
          continue;
        }
        // Regular text
        else {
          doc.setFontSize(baseFontSize);
          doc.setFont('helvetica', 'normal');
        }
        
        // Process inline formatting (bold, italic, code)
        if (!inCodeBlock && !headerMatch) {
          // Simple rendering: process bold text segments
          const boldRegex = /\*\*(.*?)\*\*/g;
          let cleanLine = line;
          let hasBold = false;
          let match;
          
          // Check if line has bold text
          while ((match = boldRegex.exec(line)) !== null) {
            hasBold = true;
            break;
          }
          
          if (hasBold) {
            // Render with bold formatting
            let lastIndex = 0;
            let xPos = currentX;
            boldRegex.lastIndex = 0; // Reset regex
            
            while ((match = boldRegex.exec(line)) !== null) {
              // Text before bold
              if (match.index > lastIndex) {
                const beforeText = line.substring(lastIndex, match.index);
                if (beforeText.trim()) {
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(baseFontSize);
                  doc.setTextColor(50, 50, 50);
                  const beforeLines = doc.splitTextToSize(beforeText, maxWidth - (xPos - margin));
                  beforeLines.forEach((bl, idx) => {
                    if (y + baseLineHeight > pageBottom) {
                      doc.addPage();
                      y = margin + 10;
                      xPos = margin + indent;
                    }
                    doc.text(bl, xPos, y);
                    if (idx < beforeLines.length - 1) {
                      y += baseLineHeight;
                      xPos = margin + indent;
                    } else {
                      xPos += doc.getTextWidth(bl);
                    }
                  });
                }
              }
              
              // Bold text
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(baseFontSize);
              doc.setTextColor(30, 30, 30);
              const boldLines = doc.splitTextToSize(match[1], maxWidth - (xPos - margin));
              boldLines.forEach((bl, idx) => {
                if (y + baseLineHeight > pageBottom) {
                  doc.addPage();
                  y = margin + 10;
                  xPos = margin + indent;
                }
                doc.text(bl, xPos, y);
                if (idx < boldLines.length - 1) {
                  y += baseLineHeight;
                  xPos = margin + indent;
                } else {
                  xPos += doc.getTextWidth(bl);
                }
              });
              
              lastIndex = match.index + match[0].length;
            }
            
            // Text after last bold
            if (lastIndex < line.length) {
              const afterText = line.substring(lastIndex);
              if (afterText.trim()) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(baseFontSize);
                doc.setTextColor(50, 50, 50);
                const afterLines = doc.splitTextToSize(afterText, maxWidth - (xPos - margin));
                afterLines.forEach((al, idx) => {
                  if (y + baseLineHeight > pageBottom) {
                    doc.addPage();
                    y = margin + 10;
                    xPos = margin + indent;
                  }
                  doc.text(al, xPos, y);
                  if (idx < afterLines.length - 1) {
                    y += baseLineHeight;
                    xPos = margin + indent;
                  }
                });
              }
            }
          } else {
            // No bold, just render normally (remove markdown markers)
            cleanLine = line.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(baseFontSize);
            doc.setTextColor(50, 50, 50);
            const textLines = doc.splitTextToSize(cleanLine, maxWidth - (currentX - margin));
            textLines.forEach((textLine, idx) => {
              if (y + baseLineHeight > pageBottom) {
                doc.addPage();
                y = margin + 10;
              }
              doc.text(textLine, currentX, y);
              y += baseLineHeight;
            });
          }
        } else if (headerMatch) {
          // Render header
          const textLines = doc.splitTextToSize(line, maxWidth);
          textLines.forEach((textLine) => {
            if (y + baseLineHeight > pageBottom) {
              doc.addPage();
              y = margin + 10;
            }
            doc.text(textLine, currentX, y);
            y += baseLineHeight + 1;
          });
        }
        
        // Reset to normal
        doc.setFontSize(baseFontSize);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        
        // Add spacing
        if (headerMatch) {
          y += 2;
        } else if (originalLine.trim() === '') {
          y += 2;
        } else {
          y += baseLineHeight;
        }
      }
      
      // Footer on each page
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      doc.save(`resposta-agente-${messageId}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback: download as text file
      const textBlob = new Blob([messageText], { type: 'text/plain' });
      const url = URL.createObjectURL(textBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resposta-agente-${messageId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const hasMessages = localMessages.length > 0;

  return (
    <div className="geral-dashboard">
      {!hasMessages ? (
        <>
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-left">
              <div className="geral-content">
                <h1 className="geral-title">Olá!</h1>
                <p className="welcome-subtitle">Sou seu assistente inteligente. Como posso te ajudar hoje?</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="chat-conversation">
          <div className="messages-container">
            {localMessages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                {editingMessageId === message.id && message.sender === 'user' ? (
                  <div className="message-edit-container">
                    <div className="message-edit-input-wrapper">
                      <textarea
                        ref={textareaRef}
                        className="message-edit-textarea-large"
                        value={editingText}
                        onChange={(e) => {
                          setEditingText(e.target.value);
                          // Auto-resize on change
                          const textarea = e.target;
                          textarea.style.height = 'auto';
                          const scrollHeight = textarea.scrollHeight;
                          const maxHeight = 160; // 10rem = 160px
                          textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
                          textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit();
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                        placeholder="Edite sua mensagem..."
                      />
                      <div className="message-edit-actions-large">
                        <button
                          className="message-edit-cancel-large"
                          onClick={handleCancelEdit}
                        >
                          Cancelar
                        </button>
                        <button
                          className="message-edit-send-large"
                          onClick={handleSaveEdit}
                          disabled={!editingText.trim()}
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Mostrar preview de imagens se houver - FORA do message-content */}
                    {message.attachedImages && message.attachedImages.length > 0 && (
                      <div className="attached-images-preview-message">
                        {message.attachedImages.map((img, index) => {
                          // Extrair tipo da imagem do base64 ou nome
                          const getImageType = (preview, name) => {
                            if (preview && preview.startsWith('data:image/')) {
                              const match = preview.match(/data:image\/(\w+);/);
                              return match ? match[1].toUpperCase() : 'IMG';
                            }
                            if (name) {
                              const ext = name.split('.').pop()?.toUpperCase();
                              return ext || 'IMG';
                            }
                            return 'IMG';
                          };
                          
                          const imageType = getImageType(img.preview, img.name);
                          const imageName = img.name || `Imagem ${index + 1}`;
                          
                          return (
                            <div key={index} className="image-preview-item-message">
                              <div className="image-preview-thumbnail-container">
                                <img src={img.preview} alt={imageName} className="image-preview-thumbnail-message" />
                              </div>
                              <div className="image-preview-info-message">
                                <div className="image-preview-name-message">{imageName}</div>
                                <div className="image-preview-type-message">{imageType}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Mostrar preview de arquivos se houver - FORA do message-content */}
                    {message.attachedFiles && message.attachedFiles.length > 0 && (
                      <div className="attached-files-preview-message">
                        {message.attachedFiles.map((file, index) => (
                          <div key={index} className="file-preview-item">
                            <div className="file-preview-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div className="file-preview-info">
                              <div className="file-preview-name">{file.name}</div>
                              <div className="file-preview-type">{file.type?.split('/')[1]?.toUpperCase() || 'PDF'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="message-content">
                      {/* Mostrar texto da mensagem se houver */}
                      {message.text && message.text.trim().length > 0 && 
                        message.text !== 'Arquivos anexados' && 
                        !message.text.includes('imagem(ns) anexada(s)') && 
                        !message.text.includes('imagem(ns) e') && (
                        <div className="message-text">
                          {message.sender === 'assistant' ? (
                            <MarkdownRenderer
                              content={message.text}
                            />
                          ) : (
                            message.text
                          )}
                        </div>
                      )}
                      <div className="message-footer">
                        <div className="message-time">
                          {message.timestamp.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    {message.sender === 'assistant' && (
                      <div className="message-actions">
                        <button
                          className="message-action-btn"
                          onClick={() => handleCopyMessage(message.text, message.id)}
                          title={copiedMessageId === message.id ? "Copiado!" : "Copiar"}
                        >
                          {copiedMessageId === message.id ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          )}
                        </button>
                        <button
                          className="message-action-btn"
                          onClick={() => handleDownloadAsPDF(message.text, message.id)}
                          title="Baixar como PDF"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                        </button>
                      </div>
                    )}
                    {message.sender === 'user' && (
                      <div className="message-actions">
                        <button
                          className="message-action-btn"
                          onClick={() => handleCopyMessage(message.text, message.id)}
                          title={copiedMessageId === message.id ? "Copiado!" : "Copiar"}
                        >
                          {copiedMessageId === message.id ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          )}
                        </button>
                        <button
                          className="message-action-btn"
                          onClick={() => handleStartEdit(message.id, message.text)}
                          title="Editar"
                        >
                          <img src={BRANDING.pencil} alt="Editar" style={{ width: '16px', height: '16px', filter: 'invert(1)' }} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {(isTyping || processingStates.sending) && (
              <div className="loading-indicator">
                <LogoLoader />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      
      {/* MessageInput sempre visível - fora da renderização condicional para manter o estado */}
      <div className={hasMessages ? "chat-input-container" : "chat-input-section"}>
        <div className={hasMessages ? "" : "input-container"}>
          <MessageInput
            key="main-message-input" // Key estável para garantir que o componente não seja remontado
            onSendMessage={handleSendMessage}
            placeholder="Digite sua pergunta aqui..."
            disabled={processingStates.sending || processingStates.analyzing}
            isProcessing={processingStates.sending || processingStates.analyzing}
          />
        </div>
      </div>
    </div>
  );
};

export default Geral;