// Crear un archivo de audio base64 para las notificaciones
const createNotificationSound = () => {
  // Si el navegador no soporta la API de Audio, salir
  if (typeof Audio === 'undefined') return null;
  
  // Usar un sonido corto predefinido en base64
  const soundData = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFTgD///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAUOLU9OeAAAAAAD/+xBkAA/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZAYP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZCgP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
  
  try {
    const audio = new Audio(soundData);
    return audio;
  } catch (err) {
    console.error('Error al crear el sonido de notificación:', err);
    return null;
  }
};

// Reproducir el sonido de notificación
export const playNotificationSound = () => {
  try {
    const audio = createNotificationSound();
    if (audio) {
      audio.play().catch(err => {
        console.error('Error al reproducir sonido:', err);
      });
    }
  } catch (error) {
    console.error('Error en playNotificationSound:', error);
  }
};