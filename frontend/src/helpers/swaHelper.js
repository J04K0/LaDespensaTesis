import Swal from "sweetalert2";

export const showSuccessAlert = (title, text) => {
  // Guarda el elemento que tiene el foco actual
  const previouslyFocused = document.activeElement;
  
  return Swal.fire({
    title,
    text,
    icon: "success",
    confirmButtonText: "Aceptar",
    didOpen: () => {
      document.querySelector('.swal2-confirm').focus();
    },
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
    title,
    text,
    icon: "error",
    confirmButtonText: "Aceptar",
    didOpen: () => {
      document.querySelector('.swal2-confirm').focus();
    },
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
    title,
    text,
    icon: "warning",
    confirmButtonText: "Aceptar",
    didOpen: () => {
      document.querySelector('.swal2-confirm').focus();
    },
    didClose: () => {
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }
  });
};

export const showConfirmationAlert = (title, text, confirmButtonText = "Sí", cancelButtonText = "No") => {
  const previouslyFocused = document.activeElement;
  
  return Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    didOpen: () => {
      document.querySelector('.swal2-confirm').focus();
    },
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
    title: "Producto no encontrado",
    text: `No existe un producto con el código de barras ${barcode} en la base de datos. ¿Desea agregarlo?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, agregar producto",
    cancelButtonText: "No, cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#dc3545",
    didOpen: () => {
      document.querySelector('.swal2-confirm').focus();
    },
    didClose: () => {
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }
  });
};