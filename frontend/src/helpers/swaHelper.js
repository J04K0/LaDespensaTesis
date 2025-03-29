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
      // Enfoca el botón de confirmación cuando se abre el modal
      document.querySelector('.swal2-confirm').focus();
    },
    didClose: () => {
      // Restaura el foco al elemento original cuando se cierra
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