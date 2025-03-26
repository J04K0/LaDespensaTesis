import Swal from "sweetalert2";

export const showSuccessAlert = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: "success",
    confirmButtonText: "Aceptar",
  });
};

export const showErrorAlert = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: "error",
    confirmButtonText: "Aceptar",
  });
};

export const showWarningAlert = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    confirmButtonText: "Aceptar",
  });
};

export const showConfirmationAlert = (title, text, confirmButtonText = "Sí", cancelButtonText = "No") => {
  return Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
  });
};