const CLOUDINARY_CLOUD_NAME = "yuwenwzd";
const CLOUDINARY_UPLOAD_PRESET = "dreams_productos";

let archivoImagenSeleccionado = null;

const inputImagenProducto =
  document.getElementById("imagen-producto");

const previewImagen =
  document.getElementById("preview-imagen");

const uploadStatus =
  document.getElementById("upload-status");

inputImagenProducto?.addEventListener(
  "change",
  event => {
    const archivo =
      event.target.files?.[0];

    if (!archivo) {
      archivoImagenSeleccionado = null;
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      alert("Selecciona una imagen válida.");

      inputImagenProducto.value = "";
      archivoImagenSeleccionado = null;

      return;
    }

    const maximo =
      8 * 1024 * 1024;

    if (archivo.size > maximo) {
      alert(
        "La imagen supera el máximo permitido de 8 MB."
      );

      inputImagenProducto.value = "";
      archivoImagenSeleccionado = null;

      return;
    }

    archivoImagenSeleccionado =
      archivo;

    const urlTemporal =
      URL.createObjectURL(
        archivo
      );

    if (previewImagen) {
      previewImagen.innerHTML = `
        <img
          src="${urlTemporal}"
          alt="Vista previa"
        >
      `;
    }

    if (uploadStatus) {
      uploadStatus.textContent =
        archivo.name;
    }
  }
);

async function subirImagenCloudinary(
  archivo
) {
  if (!archivo) {
    throw new Error(
      "No se seleccionó ninguna imagen."
    );
  }

  const datos =
    new FormData();

  datos.append(
    "file",
    archivo
  );

  datos.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );

  const respuesta =
    await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: datos
      }
    );

  const resultado =
    await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      resultado?.error?.message ||
      "No se pudo subir la imagen."
    );
  }

  if (!resultado.secure_url) {
    throw new Error(
      "Cloudinary no devolvió una URL válida."
    );
  }

  return {
    url: resultado.secure_url,
    publicId:
      resultado.public_id || "",
    width:
      resultado.width || null,
    height:
      resultado.height || null,
    format:
      resultado.format || ""
  };
}

function limpiarImagenSeleccionada() {
  archivoImagenSeleccionado =
    null;

  if (inputImagenProducto) {
    inputImagenProducto.value =
      "";
  }
}

window.subirImagenCloudinary =
  subirImagenCloudinary;

window.obtenerArchivoImagenSeleccionado =
  () =>
    archivoImagenSeleccionado;

window.limpiarImagenSeleccionada =
  limpiarImagenSeleccionada;