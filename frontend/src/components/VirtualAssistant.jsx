import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faRobot, faUser, faTimes, faChartLine } from '@fortawesome/free-solid-svg-icons';
import '../styles/VirtualAssistantStyles.css';
import axios from '../services/root.service.js';

const VirtualAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage = { type: 'user', content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send query to backend
      const response = await axios.post('/assistant/query', { query: currentInput }, {
        timeout: 30000 // 30 segundos de timeout
      });
      
      // Add assistant response
      if (response.data && response.data.status === 'success') {
        const assistantMessage = { 
          type: 'assistant', 
          content: response.data.data.text,
          data: response.data.data.resultData || null
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error al consultar al asistente:', error);
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: 'Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta de nuevo.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón para abrir el asistente */}
      <button 
        className={`virtual-assistant-toggle-button ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir asistente virtual"
      >
        <FontAwesomeIcon icon={faRobot} />
      </button>
      
      {/* Ventana del asistente */}
      <div className={`virtual-assistant-container ${isOpen ? 'open' : ''}`}>
        <div className="virtual-assistant-header">
          <h3><FontAwesomeIcon icon={faRobot} /> Asistente La Despensa</h3>
          <button 
            className="virtual-assistant-close-button" 
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar asistente virtual"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="virtual-assistant-messages">
          {messages.length === 0 ? (
            <div className="virtual-assistant-welcome-message">
              <h4>¡Hola! Soy tu asistente virtual.</h4>
              <p>Puedes preguntarme sobre:</p>
              <ul>
                <li>Productos más vendidos</li>
                <li>Estado del inventario</li>
                <li>Deudores con más deuda</li>
                <li>Ventas por categoría</li>
                <li>Proveedores y sus productos</li>
                <li>Y mucho más...</li>
              </ul>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`virtual-assistant-message ${msg.type}`}>
                <div className="virtual-assistant-message-icon">
                  <FontAwesomeIcon icon={msg.type === 'user' ? faUser : faRobot} />
                </div>
                <div className="virtual-assistant-message-content">
                  <p>{msg.content}</p>
                  {msg.data && <ResultVisualizer data={msg.data} />}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="virtual-assistant-message assistant loading">
              <div className="virtual-assistant-message-icon">
                <FontAwesomeIcon icon={faRobot} />
              </div>
              <div className="virtual-assistant-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="virtual-assistant-input" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta aquí..."
            disabled={isLoading}
            rows="1" 
            onInput={(e) => {
              // Auto-ajustar la altura basada en el contenido
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              // Enviar con Enter (sin Shift)
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) handleSubmit(e);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            aria-label="Enviar mensaje"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </form>
      </div>
    </>
  );
};

// Componente para visualizar resultados según el tipo de datos
const ResultVisualizer = ({ data }) => {
  if (!data || !data.type) return null;
  
  switch (data.type) {
    case 'table':
      return (
        <div className="virtual-assistant-result-table-container">
          <table className="virtual-assistant-result-table">
            <thead>
              <tr>
                {data.headers && data.headers.map((header, i) => (
                  <th key={i}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows && data.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'chart':
      return (
        <div className="virtual-assistant-result-chart">
          <img src={data.chartUrl} alt="Gráfico de resultados" />
        </div>
      );
    default:
      return null;
  }
};

export default VirtualAssistant;
