import React, { useState, useEffect, useRef } from 'react';
import '../styles/NotificationsStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { getSocket } from '../services/socket.service';
import { playNotificationSound } from '../services/notification.service';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  // Función para limpiar notificaciones duplicadas
  const removeDuplicateNotifications = (notifications) => {
    const seen = new Set();
    return notifications.filter(notification => {
      if (seen.has(notification.id)) {
        console.warn(`Removing duplicate notification with ID: ${notification.id}`);
        return false;
      }
      seen.add(notification.id);
      return true;
    });
  };

  useEffect(() => {
    // Conectar al socket cuando el componente se monta
    const socket = getSocket();
    
    // Manejar nuevas alertas recibidas por WebSocket
    socket.on('nueva_alerta', (alerta) => {
      console.log('Nueva alerta recibida:', alerta);
      setNotifications(prev => {
        // Verificar si ya existe una notificación con el mismo ID
        const exists = prev.some(n => n.id === alerta.id);
        if (exists) {
          console.warn(`Duplicate notification received with ID: ${alerta.id}`);
          return prev;
        }
        return [alerta, ...prev];
      });
      setUnreadCount(prev => prev + 1);
      
      // Reproducir sonido de notificación
      playNotificationSound();
    });
    
    // Cargar notificaciones guardadas en localStorage
    const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    
    // Limpiar duplicados del localStorage
    const cleanNotifications = removeDuplicateNotifications(savedNotifications);
    
    // Si se encontraron duplicados, actualizar localStorage
    if (cleanNotifications.length !== savedNotifications.length) {
      console.log(`Cleaned ${savedNotifications.length - cleanNotifications.length} duplicate notifications from localStorage`);
      localStorage.setItem('notifications', JSON.stringify(cleanNotifications));
    }
    
    const unreadNotifications = cleanNotifications.filter(n => !n.read);
    
    setNotifications(cleanNotifications);
    setUnreadCount(unreadNotifications.length);
    
    // Limpiar al desmontar
    return () => {
      socket.off('nueva_alerta');
    };
  }, []);
  
  // Guardar notificaciones en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);
  
  // Manejar clic fuera del menú de notificaciones para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };
  
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'stock_bajo':
        return '📉';
      case 'producto_vencido':
        return '⚠️';
      case 'producto_por_vencer':
        return '⏱️';
      case 'deudor_pago_proximo':
        return '💸';
      case 'cuenta_por_pagar':
        return '💰';
      default:
        return '🔔';
    }
  };

  return (
    <div className="notification-center" ref={notificationRef}>
      <div className="notification-icon" onClick={toggleNotifications}>
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </div>
      
      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            <div className="notification-actions">
              <button onClick={markAllAsRead} className="mark-all-read-btn">
                Marcar todas como leídas
              </button>
              <button onClick={clearNotifications} className="clear-all-btn">
                Limpiar
              </button>
            </div>
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                No hay notificaciones
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon-container">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">{formatTimestamp(notification.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;