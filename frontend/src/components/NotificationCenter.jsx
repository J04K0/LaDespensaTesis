import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faTimes, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import io from 'socket.io-client';
import '../styles/NotificationsStyles.css';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000');

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const removeDuplicateNotifications = (notificationArray) => {
    const seen = new Set();
    return notificationArray.filter(notification => {
      const key = `${notification.type}_${notification.message}_${JSON.stringify(notification.data)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const groupSimilarNotifications = (notificationArray) => {
    const groups = new Map();
    
    notificationArray.forEach(notification => {
      const groupKey = `${notification.type}_${notification.timestamp ? new Date(notification.timestamp).toDateString() : 'today'}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(notification);
    });

    const groupedNotifications = [];
    
    groups.forEach((groupNotifications, groupKey) => {
      if (groupNotifications.length === 1) {
        groupedNotifications.push(groupNotifications[0]);
      } else {
        const firstNotification = groupNotifications[0];
        const productNames = groupNotifications
          .map(n => {
            if (Array.isArray(n.data)) {
              return n.data.map(d => d.Nombre || d.nombre || 'Producto').join(', ');
            }
            return n.data?.Nombre || n.data?.nombre || 'Producto';
          })
          .filter((name, index, arr) => arr.indexOf(name) === index)
          .slice(0, 3);

        const totalProducts = groupNotifications.reduce((sum, n) => {
          if (Array.isArray(n.data)) return sum + n.data.length;
          return sum + 1;
        }, 0);

        const groupedNotification = {
          ...firstNotification,
          id: `grouped_${groupKey}_${Date.now()}`,
          message: createGroupedMessage(firstNotification.type, productNames, totalProducts),
          isGrouped: true,
          groupCount: groupNotifications.length,
          originalNotifications: groupNotifications
        };

        groupedNotifications.push(groupedNotification);
      }
    });

    return groupedNotifications.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  };

  const createGroupedMessage = (type, productNames, totalCount) => {
    const displayNames = productNames.slice(0, 2).join(', ');
    const remaining = totalCount - 2;
    
    switch (type) {
      case 'stock_bajo':
        if (totalCount === 1) {
          return `Stock bajo: ${displayNames}`;
        } else if (totalCount <= 2) {
          return `Stock bajo en ${displayNames}`;
        } else {
          return `Stock bajo en ${displayNames} y ${remaining} productos más`;
        }
      case 'producto_vencido':
        if (totalCount === 1) {
          return `Producto vencido: ${displayNames}`;
        } else if (totalCount <= 2) {
          return `Productos vencidos: ${displayNames}`;
        } else {
          return `${displayNames} y ${remaining} productos más están vencidos`;
        }
      case 'producto_por_vencer':
        if (totalCount === 1) {
          return `Producto por vencer: ${displayNames}`;
        } else if (totalCount <= 2) {
          return `Productos por vencer: ${displayNames}`;
        } else {
          return `${displayNames} y ${remaining} productos más próximos a vencer`;
        }
      default:
        return `${totalCount} alertas de ${type}`;
    }
  };

  useEffect(() => {
    socket.on('nueva_alerta', (alerta) => {
      console.log('Nueva alerta recibida:', alerta);
      
      setNotifications(prev => {
        const COOLDOWN_ALERTAS_STOCK = 24 * 60 * 60 * 1000;
        
        const cooldownTime = Date.now() - COOLDOWN_ALERTAS_STOCK;
        const recentSimilar = prev.find(n => 
          n.type === alerta.type && 
          new Date(n.timestamp).getTime() > cooldownTime &&
          (
            (n.data?.Nombre === alerta.data?.Nombre) ||
            (n.data?.codigoBarras === alerta.data?.codigoBarras) ||
            (Array.isArray(n.data) && Array.isArray(alerta.data) && 
             n.data.some(item => alerta.data.some(alertItem => 
               item.Nombre === alertItem.Nombre || item.codigoBarras === alertItem.codigoBarras
             )))
          )
        );

        if (recentSimilar) {
          console.log('⏭️ Notificación similar reciente ignorada (enviada en las últimas 24h):', alerta.type);
          return prev;
        }

        const updatedNotifications = [alerta, ...prev];
        const cleanNotifications = removeDuplicateNotifications(updatedNotifications);
        const groupedNotifications = groupSimilarNotifications(cleanNotifications);
        
        return groupedNotifications.slice(0, 50);
      });
      
      setUnreadCount(prev => prev + 1);
    });
    
    const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    
    const cleanNotifications = removeDuplicateNotifications(savedNotifications);
    const groupedNotifications = groupSimilarNotifications(cleanNotifications);
    
    if (cleanNotifications.length !== savedNotifications.length) {
      console.log(`🧹 Limpiadas ${savedNotifications.length - cleanNotifications.length} notificaciones duplicadas`);
      localStorage.setItem('notifications', JSON.stringify(groupedNotifications));
    }
    
    const unreadNotifications = groupedNotifications.filter(n => !n.read);
    
    setNotifications(groupedNotifications);
    setUnreadCount(unreadNotifications.length);
    
    return () => {
      socket.off('nueva_alerta');
    };
  }, []);
  
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const cleanOldNotifications = () => {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      setNotifications(prev => 
        prev.filter(n => new Date(n.timestamp).getTime() > sevenDaysAgo)
      );
    };

    cleanOldNotifications();
    const interval = setInterval(cleanOldNotifications, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
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
    localStorage.removeItem('notifications');
  };

  const removeNotification = (id) => {
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== id);
      const unreadFiltered = filtered.filter(n => !n.read);
      setUnreadCount(unreadFiltered.length);
      return filtered;
    });
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
    if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString('es-ES');
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
        return '💳';
      default:
        return '🔔';
    }
  };

  const getNotificationClass = (notification) => {
    let baseClass = 'notification-item';
    if (!notification.read) baseClass += ' unread';
    if (notification.isGrouped) baseClass += ' grouped';
    return baseClass;
  };

  return (
    <div className="notification-center" ref={notificationRef}>
      <div className="notification-icon" onClick={toggleNotifications}>
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      
      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read-btn" 
                  onClick={markAllAsRead}
                  title="Marcar todas como leídas"
                >
                  <FontAwesomeIcon icon={faCheck} />
                </button>
              )}
              <button 
                className="clear-all-btn" 
                onClick={clearNotifications}
                title="Limpiar todas"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                No hay notificaciones
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={getNotificationClass(notification)}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-content">
                    <div className="notification-header-item">
                      <span className="notification-icon-text">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <span className="notification-time">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      <button 
                        className="remove-notification-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        title="Eliminar notificación"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                    <div className="notification-message">
                      {notification.message}
                      {notification.isGrouped && (
                        <span className="group-indicator">
                          (Grupo de {notification.groupCount} alertas)
                        </span>
                      )}
                    </div>
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