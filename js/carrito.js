const CLAVE_CARRITO = "dreamsCosmeticCarrito";

let carritoDreams = cargarCarritoLocal();

function cargarCarritoLocal() {
  try {
    const guardado = localStorage.getItem(CLAVE_CARRITO);

    if (!guardado) {
      return [];
    }

    const datos = JSON.parse(guardado);

    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardarCarritoLocal() {
  localStorage.setItem(
    CLAVE_CARRITO,
    JSON.stringify(carritoDreams)
  );

  actualizarIndicadoresCarrito();
}

function obtenerCantidadTotalCarrito() {
  return carritoDreams.reduce(
    (total, item) => total + Number(item.cantidad || 0),
    0
  );
}

function obtenerTotalCarrito() {
  return carritoDreams.reduce(
    (total, item) => {
      return total +
        Number(item.precio || 0) *
        Number(item.cantidad || 0);
    },
    0
  );
}

function actualizarIndicadoresCarrito() {
  const cantidad = obtenerCantidadTotalCarrito();
  const total = obtenerTotalCarrito();

  const contadorHeader =
    document.getElementById("contador-carrito");

  const contadorFlotante =
    document.getElementById("floating-counter");

  const contadorNav =
    document.getElementById("nav-contador-carrito");

  const totalFlotante =
    document.getElementById("floating-total");

  const carritoFlotante =
    document.getElementById("floating-cart");

  if (contadorHeader) {
    contadorHeader.textContent = cantidad;
  }

  if (contadorFlotante) {
    contadorFlotante.textContent = cantidad;
  }

  if (contadorNav) {
    contadorNav.textContent = cantidad;
  }

  if (totalFlotante) {
    totalFlotante.textContent =
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
      }).format(total);
  }

  if (carritoFlotante) {
    carritoFlotante.classList.toggle(
      "visible",
      cantidad > 0
    );
  }
}

function obtenerPrecioProductoParaCarrito(producto) {
  if (
    typeof obtenerDatosPrecio === "function"
  ) {
    const datos = obtenerDatosPrecio(producto);

    return Number(datos.precioFinal) || 0;
  }

  return Number(producto.precio) || 0;
}

function agregarAlCarrito(producto) {
  if (!producto) {
    return;
  }

  const stock = Number(producto.stock) || 0;

  if (stock <= 0) {
    mostrarNotificacionCarrito(
      "Este producto está agotado."
    );

    return;
  }

  const existente = carritoDreams.find(
    item => item.id === producto.id
  );

  if (existente) {
    if (existente.cantidad >= stock) {
      mostrarNotificacionCarrito(
        "Ya agregaste todas las unidades disponibles."
      );

      return;
    }

    existente.cantidad += 1;
    existente.stock = stock;
    existente.precio =
      obtenerPrecioProductoParaCarrito(producto);
  } else {
    carritoDreams.push({
      id: producto.id,
      nombre: producto.nombre || "Producto",
      imagen:
        typeof obtenerRutaImagen === "function"
          ? obtenerRutaImagen(producto)
          : producto.imagen || "",
      categoria:
        producto.categoria || "",
      precio:
        obtenerPrecioProductoParaCarrito(producto),
      cantidad: 1,
      stock
    });
  }

  guardarCarritoLocal();

  mostrarNotificacionCarrito(
    `${producto.nombre || "Producto"} agregado al carrito`
  );
}

function aumentarCantidadCarrito(id) {
  const item = carritoDreams.find(
    producto => producto.id === id
  );

  if (!item) {
    return;
  }

  if (item.cantidad >= Number(item.stock || 0)) {
    mostrarNotificacionCarrito(
      "No hay más unidades disponibles."
    );

    return;
  }

  item.cantidad += 1;

  guardarCarritoLocal();

  if (
    typeof renderizarPaginaCarrito === "function"
  ) {
    renderizarPaginaCarrito();
  }
}

function disminuirCantidadCarrito(id) {
  const item = carritoDreams.find(
    producto => producto.id === id
  );

  if (!item) {
    return;
  }

  if (item.cantidad <= 1) {
    eliminarDelCarrito(id);
    return;
  }

  item.cantidad -= 1;

  guardarCarritoLocal();

  if (
    typeof renderizarPaginaCarrito === "function"
  ) {
    renderizarPaginaCarrito();
  }
}

function eliminarDelCarrito(id) {
  carritoDreams = carritoDreams.filter(
    producto => producto.id !== id
  );

  guardarCarritoLocal();

  if (
    typeof renderizarPaginaCarrito === "function"
  ) {
    renderizarPaginaCarrito();
  }
}

function vaciarCarrito() {
  carritoDreams = [];

  guardarCarritoLocal();

  if (
    typeof renderizarPaginaCarrito === "function"
  ) {
    renderizarPaginaCarrito();
  }
}

function abrirCarrito() {
  window.location.href = "carrito.html";
}

function mostrarNotificacionCarrito(mensaje) {
  let notificacion =
    document.getElementById(
      "notificacion-carrito"
    );

  if (!notificacion) {
    notificacion =
      document.createElement("div");

    notificacion.id =
      "notificacion-carrito";

    notificacion.className =
      "cart-toast";

    document.body.appendChild(
      notificacion
    );
  }

  notificacion.textContent = mensaje;

  requestAnimationFrame(() => {
    notificacion.classList.add("visible");
  });

  clearTimeout(
    mostrarNotificacionCarrito.temporizador
  );

  mostrarNotificacionCarrito.temporizador =
    setTimeout(() => {
      notificacion.classList.remove(
        "visible"
      );
    }, 2200);
}

document
  .getElementById("btn-carrito-header")
  ?.addEventListener(
    "click",
    abrirCarrito
  );

document
  .getElementById("nav-carrito")
  ?.addEventListener(
    "click",
    abrirCarrito
  );

document
  .getElementById("floating-cart")
  ?.addEventListener(
    "click",
    abrirCarrito
  );

window.agregarAlCarrito =
  agregarAlCarrito;

window.aumentarCantidadCarrito =
  aumentarCantidadCarrito;

window.disminuirCantidadCarrito =
  disminuirCantidadCarrito;

window.eliminarDelCarrito =
  eliminarDelCarrito;

window.vaciarCarrito =
  vaciarCarrito;

window.obtenerCarritoDreams =
  () => [...carritoDreams];

window.obtenerTotalCarrito =
  obtenerTotalCarrito;

window.obtenerCantidadTotalCarrito =
  obtenerCantidadTotalCarrito;

actualizarIndicadoresCarrito();