import Swal from "sweetalert2";

// Configuración común para todas las alertas para mejorar rendimiento y accesibilidad
const swalBaseConfig = {
  customClass: {
    container: 'swal-optimized-container',
    popup: 'swal-optimized-popup'
  },
  backdrop: 'rgba(0,0,0,0.4)',
  allowOutsideClick: false,
  // Evitar problemas de aria-hidden
  target: document.body,
  returnFocus: false,
  // Configurar correctamente el manejo del foco
  didOpen: (popup) => {
    // Asegurarse de que el popup tenga el foco correcto
    const confirmButton = popup.querySelector('.swal2-confirm');
    const cancelButton = popup.querySelector('.swal2-cancel');
    const input = popup.querySelector('.swal2-input, .swal2-textarea');
    
    // Dar foco al primer elemento interactivo disponible
    if (input) {
      input.focus();
    } else if (confirmButton) {
      confirmButton.focus();
    }
  },
  showClass: {
    popup: '',  // Desactivar animación de entrada
  },
  hideClass: {
    popup: '', // Desactivar animación de salida
  }
};

export const showSuccessAlert = (title, text) => {
  // Guarda el elemento que tiene el foco actual
  const previouslyFocused = document.activeElement;
  
  return Swal.fire({
    ...swalBaseConfig,
    title,
    text,
    icon: "success",
    confirmButtonText: "Aceptar",
    didClose: () => {
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }
  });
};

export const showErrorAlert = (title, text) => {
  const previouslyFocused = document.activeElement;
  
  return Swal.fire({
    ...swalBaseConfig,
    title,
    text,
    icon: "error",
    confirmButtonText: "Aceptar",
    didClose: () => {
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }
  });
};

export const showWarningAlert = (title, text) => {
  const previouslyFocused = document.activeElement;
  
  return Swal.fire({
    ...swalBaseConfig,
    title,
    text,
    icon: "warning",
    confirmButtonText: "Aceptar",
    didClose: () => {
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }
  });
};

export const showInfoAlert = (title, text) => {
  const previouslyFocused = document.activeElement;
  
  return Swal.fire({
    ...swalBaseConfig,
    title,
    text,
    icon: "info",
    confirmButtonText: "Aceptar",
    didClose: () => {
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }
  });
};

export const showConfirmationAlert = (title, text, confirmButtonText = "Sí", cancelButtonText = "No") => {
  const previouslyFocused = document.activeElement;
  
  // Detectar si es una acción de eliminación basándose en el texto del botón o el título
  const isDeleteAction = confirmButtonText.toLowerCase().includes('eliminar') || 
                         confirmButtonText.toLowerCase().includes('desactivar') ||
                         confirmButtonText.toLowerCase().includes('anular') ||
                         title.toLowerCase().includes('eliminar') ||
                         title.toLowerCase().includes('desactivar');
  
  return Swal.fire({
    ...swalBaseConfig,
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    // Aplicar colores según el tipo de acción
    confirmButtonColor: isDeleteAction ? "#dc3545" : "#28a745", // Rojo para eliminar, verde para otras acciones
    cancelButtonColor: "#007bff", // Azul para cancelar
    didClose: () => {
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }
  });
};

export const showProductNotFoundAlert = (barcode) => {
  const previouslyFocused = document.activeElement;
  
  return Swal.fire({
    ...swalBaseConfig,
    title: "Producto no encontrado",
    text: `No existe un producto con el código de barras ${barcode} en la base de datos. ¿Desea agregarlo?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, agregar producto",
    cancelButtonText: "No, cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#dc3545",
    didClose: () => {
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }
  });
};

export const showOutOfStockAlert = (barcode, productName) => {
  const previouslyFocused = document.activeElement;
  
  return Swal.fire({
    ...swalBaseConfig,
    title: "Producto sin stock",
    text: `El producto "${productName}" se ha quedado sin stock. ¿Desea agregar más unidades?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, agregar stock",
    cancelButtonText: "No, cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#dc3545",
    didClose: () => {
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }
  });
};

// 🆕 NUEVO: Helper específico para mostrar alertas de restricción para empleados
export const showEmpleadoAccessDeniedAlert = (funcionalidad, descripcion = null) => {
  const previouslyFocused = document.activeElement;
  
  const mensajeBase = `Los empleados no tienen acceso a ${funcionalidad}. Esta función está disponible solo para administradores y jefes.`;
  const mensajeFinal = descripcion ? `${mensajeBase}\n\n${descripcion}` : mensajeBase;
  
  return Swal.fire({
    ...swalBaseConfig,
    title: "Acceso Restringido",
    text: mensajeFinal,
    icon: "warning",
    confirmButtonText: "Entendido",
    confirmButtonColor: "#e74c3c",
    didClose: () => {
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }
  });
};