const CLAVE_CARRITO =
  "dreamsCosmeticCarrito";

const CLAVE_CODIGO_PROMOCIONAL =
  "dreamsCosmeticCodigoPromocional";

let carritoDreams =
  cargarCarritoLocal();

let codigoPromocionalDreams =
  cargarCodigoPromocionalLocal();

function cargarCarritoLocal() {
  try {
    const guardado =
      localStorage.getItem(
        CLAVE_CARRITO
      );

    if (!guardado) {
      return [];
    }

    const datos =
      JSON.parse(
        guardado
      );

    return Array.isArray(datos)
      ? datos
      : [];

  } catch {
    return [];
  }
}

function guardarCarritoLocal() {
  localStorage.setItem(
    CLAVE_CARRITO,
    JSON.stringify(
      carritoDreams
    )
  );

  actualizarIndicadoresCarrito();
}

function cargarCodigoPromocionalLocal() {
  try {
    const guardado =
      localStorage.getItem(
        CLAVE_CODIGO_PROMOCIONAL
      );

    if (!guardado) {
      return null;
    }

    const datos =
      JSON.parse(
        guardado
      );

    if (
      !datos ||
      typeof datos !==
        "object" ||
      !datos.codigo
    ) {
      return null;
    }

    return datos;

  } catch {
    return null;
  }
}

function guardarCodigoPromocionalLocal(
  codigo
) {
  codigoPromocionalDreams =
    codigo;

  if (!codigo) {
    localStorage.removeItem(
      CLAVE_CODIGO_PROMOCIONAL
    );

    return;
  }

  localStorage.setItem(
    CLAVE_CODIGO_PROMOCIONAL,
    JSON.stringify(
      codigo
    )
  );
}

function obtenerCantidadTotalCarrito() {
  return carritoDreams.reduce(
    (total, item) =>
      total +
      Number(
        item.cantidad || 0
      ),
    0
  );
}

function obtenerTotalCarrito() {
  return carritoDreams.reduce(
    (total, item) => {
      return (
        total +
        Number(
          item.precio || 0
        ) *
        Number(
          item.cantidad || 0
        )
      );
    },
    0
  );
}

function normalizarTextoCarrito(
  valor
) {
  return String(
    valor || ""
  )
    .trim()
    .toLowerCase();
}

function obtenerDescuentoCodigoLocal() {
  if (
    !codigoPromocionalDreams ||
    codigoPromocionalDreams
      .tipoBeneficio !==
      "porcentaje"
  ) {
    return 0;
  }

  const porcentaje =
    Number(
      codigoPromocionalDreams
        .porcentaje
    ) || 0;

  if (
    porcentaje <= 0 ||
    porcentaje > 100
  ) {
    return 0;
  }

  let baseDescuento =
    0;

  const alcance =
    codigoPromocionalDreams
      .alcance ||
    "tienda";

  if (
    alcance ===
    "tienda"
  ) {
    baseDescuento =
      obtenerTotalCarrito();
  }

  if (
    alcance ===
    "categoria"
  ) {
    const categoriaCodigo =
      normalizarTextoCarrito(
        codigoPromocionalDreams
          .categoria
      );

    baseDescuento =
      carritoDreams
        .filter(item =>
          normalizarTextoCarrito(
            item.categoria
          ) ===
          categoriaCodigo
        )
        .reduce(
          (total, item) =>
            total +
            Number(
              item.precio || 0
            ) *
            Number(
              item.cantidad || 0
            ),
          0
        );
  }

  if (
    alcance ===
    "producto"
  ) {
    baseDescuento =
      carritoDreams
        .filter(item =>
          item.id ===
          codigoPromocionalDreams
            .productoId
        )
        .reduce(
          (total, item) =>
            total +
            Number(
              item.precio || 0
            ) *
            Number(
              item.cantidad || 0
            ),
          0
        );
  }

  const descuento =
    baseDescuento *
    porcentaje /
    100;

  return Math.max(
    0,
    Math.min(
      descuento,
      obtenerTotalCarrito()
    )
  );
}

function obtenerTotalFinalCarrito() {
  const subtotal =
    obtenerTotalCarrito();

  const descuento =
    obtenerDescuentoCodigoLocal();

  return Math.max(
    0,
    subtotal -
    descuento
  );
}

function actualizarIndicadoresCarrito() {
  const cantidad =
    obtenerCantidadTotalCarrito();

  const total =
    obtenerTotalFinalCarrito();

  const contadorHeader =
    document.getElementById(
      "contador-carrito"
    );

  const contadorFlotante =
    document.getElementById(
      "floating-counter"
    );

  const contadorNav =
    document.getElementById(
      "nav-contador-carrito"
    );

  const totalFlotante =
    document.getElementById(
      "floating-total"
    );

  const carritoFlotante =
    document.getElementById(
      "floating-cart"
    );

  if (contadorHeader) {
    contadorHeader.textContent =
      cantidad;
  }

  if (contadorFlotante) {
    contadorFlotante.textContent =
      cantidad;
  }

  if (contadorNav) {
    contadorNav.textContent =
      cantidad;
  }

  if (totalFlotante) {
    totalFlotante.textContent =
      new Intl.NumberFormat(
        "es-MX",
        {
          style: "currency",
          currency: "MXN"
        }
      ).format(
        total
      );
  }

  if (carritoFlotante) {
    carritoFlotante
      .classList
      .toggle(
        "visible",
        cantidad > 0
      );
  }
}

function obtenerPrecioProductoParaCarrito(
  producto
) {
  if (
    typeof obtenerDatosPrecio ===
    "function"
  ) {
    const datos =
      obtenerDatosPrecio(
        producto
      );

    return Number(
      datos.precioFinal
    ) || 0;
  }

  return Number(
    producto.precio
  ) || 0;
}

function agregarAlCarrito(
  producto
) {
  if (!producto) {
    return;
  }

  const stock =
    Number(
      producto.stock
    ) || 0;

  if (stock <= 0) {
    mostrarNotificacionCarrito(
      "Este producto está agotado."
    );

    return;
  }

  const existente =
    carritoDreams.find(
      item =>
        item.id ===
        producto.id
    );

  if (existente) {
    if (
      existente.cantidad >=
      stock
    ) {
      mostrarNotificacionCarrito(
        "Ya agregaste todas las unidades disponibles."
      );

      return;
    }

    existente.cantidad +=
      1;

    existente.stock =
      stock;

    existente.precio =
      obtenerPrecioProductoParaCarrito(
        producto
      );

  } else {
    carritoDreams.push({
      id:
        producto.id,
      nombre:
        producto.nombre ||
        "Producto",
      imagen:
        typeof obtenerRutaImagen ===
        "function"
          ? obtenerRutaImagen(
              producto
            )
          : producto.imagen ||
            "",
      categoria:
        producto.categoria ||
        "",
      precio:
        obtenerPrecioProductoParaCarrito(
          producto
        ),
      cantidad:
        1,
      stock
    });
  }

  guardarCarritoLocal();

  mostrarNotificacionCarrito(
    `${producto.nombre || "Producto"} agregado al carrito`
  );
}

function aumentarCantidadCarrito(
  id
) {
  const item =
    carritoDreams.find(
      producto =>
        producto.id ===
        id
    );

  if (!item) {
    return;
  }

  if (
    item.cantidad >=
    Number(
      item.stock || 0
    )
  ) {
    mostrarNotificacionCarrito(
      "No hay más unidades disponibles."
    );

    return;
  }

  item.cantidad +=
    1;

  guardarCarritoLocal();

  if (
    typeof renderizarPaginaCarrito ===
    "function"
  ) {
    renderizarPaginaCarrito();
  }
}

function disminuirCantidadCarrito(
  id
) {
  const item =
    carritoDreams.find(
      producto =>
        producto.id ===
        id
    );

  if (!item) {
    return;
  }

  if (
    item.cantidad <=
    1
  ) {
    eliminarDelCarrito(
      id
    );

    return;
  }

  item.cantidad -=
    1;

  guardarCarritoLocal();

  if (
    typeof renderizarPaginaCarrito ===
    "function"
  ) {
    renderizarPaginaCarrito();
  }
}

function eliminarDelCarrito(
  id
) {
  carritoDreams =
    carritoDreams.filter(
      producto =>
        producto.id !==
        id
    );

  guardarCarritoLocal();

  if (
    typeof renderizarPaginaCarrito ===
    "function"
  ) {
    renderizarPaginaCarrito();
  }
}

function vaciarCarrito() {
  carritoDreams =
    [];

  guardarCarritoLocal();

  quitarCodigoPromocional(
    false
  );

  if (
    typeof renderizarPaginaCarrito ===
    "function"
  ) {
    renderizarPaginaCarrito();
  }
}

function abrirCarrito() {
  window.location.href =
    "carrito.html";
}

function mostrarNotificacionCarrito(
  mensaje
) {
  let notificacion =
    document.getElementById(
      "notificacion-carrito"
    );

  if (!notificacion) {
    notificacion =
      document.createElement(
        "div"
      );

    notificacion.id =
      "notificacion-carrito";

    notificacion.className =
      "cart-toast";

    document.body.appendChild(
      notificacion
    );
  }

  notificacion.textContent =
    mensaje;

  requestAnimationFrame(
    () => {
      notificacion
        .classList
        .add(
          "visible"
        );
    }
  );

  clearTimeout(
    mostrarNotificacionCarrito
      .temporizador
  );

  mostrarNotificacionCarrito
    .temporizador =
    setTimeout(
      () => {
        notificacion
          .classList
          .remove(
            "visible"
          );
      },
      2200
    );
}

function obtenerFechaPromocion(
  valor
) {
  if (!valor) {
    return null;
  }

  if (
    typeof valor.toDate ===
    "function"
  ) {
    return valor.toDate();
  }

  if (
    typeof valor ===
      "object" &&
    Number.isFinite(
      Number(valor.seconds)
    )
  ) {
    return new Date(
      Number(
        valor.seconds
      ) * 1000
    );
  }

  const fecha =
    new Date(valor);

  return Number.isNaN(
    fecha.getTime()
  )
    ? null
    : fecha;
}

function mostrarMensajeCodigo(
  mensaje,
  tipo = "error"
) {
  const elemento =
    document.getElementById(
      "mensaje-codigo-promocional"
    );

  if (!elemento) {
    return;
  }

  elemento.hidden =
    false;

  elemento.className =
    `promo-code-message ${tipo}`;

  elemento.innerHTML = `
    <i class="${
      tipo === "success"
        ? "fa-solid fa-circle-check"
        : "fa-solid fa-circle-exclamation"
    }"></i>

    <span>
      ${escapeTextoCodigoPublico(
        mensaje
      )}
    </span>
  `;
}

function ocultarMensajeCodigo() {
  const elemento =
    document.getElementById(
      "mensaje-codigo-promocional"
    );

  if (!elemento) {
    return;
  }

  elemento.hidden =
    true;

  elemento.innerHTML =
    "";
}

function escapeTextoCodigoPublico(
  valor
) {
  return String(
    valor ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function validarCodigoConCarrito(
  codigo
) {
  if (!codigo) {
    return {
      valido: false,
      mensaje:
        "Este código no existe."
    };
  }

  if (
    codigo.activo ===
    false
  ) {
    return {
      valido: false,
      mensaje:
        "Este código no está disponible."
    };
  }

  const limite =
    Number(
      codigo.limiteUsos
    ) || 0;

  const usados =
    Number(
      codigo.usosRealizados
    ) || 0;

  if (
    limite <= 0 ||
    usados >= limite
  ) {
    return {
      valido: false,
      mensaje:
        "Este código ya alcanzó su límite de canjes."
    };
  }

  const ahora =
    new Date();

  const inicio =
    obtenerFechaPromocion(
      codigo.fechaInicio
    );

  const fin =
    obtenerFechaPromocion(
      codigo.fechaFin
    );

  if (
    inicio &&
    ahora < inicio
  ) {
    return {
      valido: false,
      mensaje:
        "Este código todavía no está disponible."
    };
  }

  if (
    fin &&
    ahora > fin
  ) {
    return {
      valido: false,
      mensaje:
        "Este código ya expiró."
    };
  }

  if (
    codigo.tipoBeneficio ===
    "porcentaje"
  ) {
    const porcentaje =
      Number(
        codigo.porcentaje
      ) || 0;

    if (
      porcentaje < 1 ||
      porcentaje > 100
    ) {
      return {
        valido: false,
        mensaje:
          "Este código no tiene una promoción válida."
      };
    }

    if (
      codigo.alcance ===
      "categoria"
    ) {
      const categoriaCodigo =
        normalizarTextoCarrito(
          codigo.categoria
        );

      const existeCategoria =
        carritoDreams.some(
          item =>
            normalizarTextoCarrito(
              item.categoria
            ) ===
            categoriaCodigo
        );

      if (!existeCategoria) {
        return {
          valido: false,
          mensaje:
            `Este código solo aplica a la categoría ${codigo.categoria || "seleccionada"}.`
        };
      }
    }

    if (
      codigo.alcance ===
      "producto"
    ) {
      const existeProducto =
        carritoDreams.some(
          item =>
            item.id ===
            codigo.productoId
        );

      if (!existeProducto) {
        return {
          valido: false,
          mensaje:
            `Este código solo aplica a ${codigo.productoNombre || "un producto específico"}.`
        };
      }
    }
  }

  return {
    valido: true
  };
}

async function validarProductoGratis(
  codigo
) {
  if (
    codigo.tipoBeneficio !==
    "productoGratis"
  ) {
    return null;
  }

  if (
    !codigo.productoGratisId
  ) {
    throw new Error(
      "El artículo promocional ya no está disponible."
    );
  }

  if (
    typeof db ===
    "undefined"
  ) {
    throw new Error(
      "No se pudo conectar con la tienda."
    );
  }

  const documento =
    await db
      .collection(
        "productos"
      )
      .doc(
        codigo.productoGratisId
      )
      .get();

  if (!documento.exists) {
    throw new Error(
      "El artículo promocional ya no está disponible."
    );
  }

  const producto = {
    id:
      documento.id,
    ...documento.data()
  };

  if (
    Number(
      producto.stock
    ) <= 0
  ) {
    throw new Error(
      "El artículo gratis de esta promoción está agotado."
    );
  }

  return producto;
}

function construirCodigoLocal(
  codigo,
  productoGratis = null
) {
  const datos = {
    id:
      codigo.id ||
      codigo.codigo,
    codigo:
      String(
        codigo.codigo || ""
      )
        .trim()
        .toUpperCase(),
    tipoBeneficio:
      codigo.tipoBeneficio ||
      "porcentaje",
    limiteUsos:
      Number(
        codigo.limiteUsos
      ) || 0,
    usosRealizados:
      Number(
        codigo.usosRealizados
      ) || 0,
    activo:
      codigo.activo !==
      false,
    alcance:
      codigo.alcance ||
      "",
    porcentaje:
      Number(
        codigo.porcentaje
      ) || 0,
    categoria:
      codigo.categoria ||
      "",
    productoId:
      codigo.productoId ||
      "",
    productoNombre:
      codigo.productoNombre ||
      "",
    productoGratisId:
      codigo.productoGratisId ||
      "",
    productoGratisNombre:
      codigo.productoGratisNombre ||
      "",
    fechaInicio:
      obtenerFechaPromocion(
        codigo.fechaInicio
      )
        ?.toISOString() ||
      "",
    fechaFin:
      obtenerFechaPromocion(
        codigo.fechaFin
      )
        ?.toISOString() ||
      ""
  };

  if (productoGratis) {
    datos.productoGratisNombre =
      productoGratis.nombre ||
      datos.productoGratisNombre;

    datos.productoGratisImagen =
      productoGratis.imagen ||
      "";

    datos.productoGratisCategoria =
      productoGratis.categoria ||
      "";

    datos.productoGratisStock =
      Number(
        productoGratis.stock
      ) || 0;

    datos.productoGratisPrecioOriginal =
      Number(
        productoGratis.precio
      ) || 0;
  }

  return datos;
}

async function aplicarCodigoPromocional() {
  const input =
    document.getElementById(
      "codigo-promocional-input"
    );

  const boton =
    document.getElementById(
      "btn-aplicar-codigo"
    );

  if (
    !input ||
    !boton
  ) {
    return;
  }

  const codigoTexto =
    input.value
      .trim()
      .toUpperCase();

  ocultarMensajeCodigo();

  if (!codigoTexto) {
    mostrarMensajeCodigo(
      "Ingresa un código promocional."
    );

    input.focus();

    return;
  }

  if (
    !/^[A-Z0-9_-]{3,30}$/.test(
      codigoTexto
    )
  ) {
    mostrarMensajeCodigo(
      "El código ingresado no es válido."
    );

    return;
  }

  if (
    !carritoDreams.length
  ) {
    mostrarMensajeCodigo(
      "Agrega productos a tu carrito antes de utilizar un código."
    );

    return;
  }

  if (
    typeof db ===
    "undefined"
  ) {
    mostrarMensajeCodigo(
      "No pudimos validar el código. Intenta nuevamente."
    );

    return;
  }

  boton.disabled =
    true;

  boton.textContent =
    "Validando...";

  try {
    const documento =
      await db
        .collection(
          "codigosPromocionales"
        )
        .doc(
          codigoTexto
        )
        .get();

    if (!documento.exists) {
      throw new Error(
        "Este código no existe."
      );
    }

    const codigo = {
      id:
        documento.id,
      ...documento.data()
    };

    const validacion =
      validarCodigoConCarrito(
        codigo
      );

    if (!validacion.valido) {
      throw new Error(
        validacion.mensaje
      );
    }

    const productoGratis =
      await validarProductoGratis(
        codigo
      );

    const codigoLocal =
      construirCodigoLocal(
        codigo,
        productoGratis
      );

    guardarCodigoPromocionalLocal(
      codigoLocal
    );

    input.value =
      "";

    ocultarMensajeCodigo();

    actualizarResumenCodigoPromocional();

    mostrarNotificacionCarrito(
      "Código aplicado correctamente."
    );

  } catch (error) {
    console.error(
      error
    );

    mostrarMensajeCodigo(
      error.message ||
      "No pudimos aplicar este código."
    );

  } finally {
    boton.disabled =
      false;

    boton.textContent =
      "Aplicar";
  }
}

function obtenerDescripcionCodigoAplicado() {
  if (
    !codigoPromocionalDreams
  ) {
    return "";
  }

  if (
    codigoPromocionalDreams
      .tipoBeneficio ===
    "productoGratis"
  ) {
    return (
      codigoPromocionalDreams
        .productoGratisNombre
        ? `${codigoPromocionalDreams.productoGratisNombre} gratis`
        : "Artículo gratis"
    );
  }

  const porcentaje =
    Number(
      codigoPromocionalDreams
        .porcentaje
    ) || 0;

  if (
    codigoPromocionalDreams
      .alcance ===
    "categoria"
  ) {
    return (
      `${porcentaje}% de descuento en ${codigoPromocionalDreams.categoria}`
    );
  }

  if (
    codigoPromocionalDreams
      .alcance ===
    "producto"
  ) {
    return (
      `${porcentaje}% de descuento en ${codigoPromocionalDreams.productoNombre || "el producto seleccionado"}`
    );
  }

  return (
    `${porcentaje}% de descuento en tu compra`
  );
}

function codigoSigueAplicandoAlCarrito() {
  if (
    !codigoPromocionalDreams
  ) {
    return true;
  }

  if (
    codigoPromocionalDreams
      .tipoBeneficio ===
    "productoGratis"
  ) {
    return true;
  }

  if (
    codigoPromocionalDreams
      .alcance ===
    "categoria"
  ) {
    const categoria =
      normalizarTextoCarrito(
        codigoPromocionalDreams
          .categoria
      );

    return carritoDreams.some(
      item =>
        normalizarTextoCarrito(
          item.categoria
        ) ===
        categoria
    );
  }

  if (
    codigoPromocionalDreams
      .alcance ===
    "producto"
  ) {
    return carritoDreams.some(
      item =>
        item.id ===
        codigoPromocionalDreams
          .productoId
    );
  }

  return true;
}

function actualizarResumenCodigoPromocional() {
  const subtotal =
    obtenerTotalCarrito();

  const resumenSubtotal =
    document.getElementById(
      "resumen-subtotal"
    );

  const resumenTotal =
    document.getElementById(
      "resumen-total"
    );

  const checkoutTotal =
    document.getElementById(
      "checkout-total"
    );

  const filaDescuento =
    document.getElementById(
      "fila-descuento"
    );

  const resumenDescuento =
    document.getElementById(
      "resumen-descuento"
    );

  const resumenCodigoNombre =
    document.getElementById(
      "resumen-codigo-nombre"
    );

  const filaRegalo =
    document.getElementById(
      "fila-regalo"
    );

  const resumenRegalo =
    document.getElementById(
      "resumen-regalo"
    );

  const formulario =
    document.getElementById(
      "formulario-codigo-promocional"
    );

  const aplicado =
    document.getElementById(
      "codigo-promocional-aplicado"
    );

  const codigoNombre =
    document.getElementById(
      "codigo-aplicado-nombre"
    );

  const codigoBeneficio =
    document.getElementById(
      "codigo-aplicado-beneficio"
    );

  if (resumenSubtotal) {
    resumenSubtotal.textContent =
      new Intl.NumberFormat(
        "es-MX",
        {
          style: "currency",
          currency: "MXN"
        }
      ).format(
        subtotal
      );
  }

  if (
    codigoPromocionalDreams &&
    !codigoSigueAplicandoAlCarrito()
  ) {
    guardarCodigoPromocionalLocal(
      null
    );

    mostrarNotificacionCarrito(
      "El código fue retirado porque ya no aplica a los productos del carrito."
    );
  }

  if (
    !codigoPromocionalDreams
  ) {
    if (filaDescuento) {
      filaDescuento.hidden =
        true;
    }

    if (filaRegalo) {
      filaRegalo.hidden =
        true;
    }

    if (formulario) {
      formulario.hidden =
        false;
    }

    if (aplicado) {
      aplicado.hidden =
        true;
    }

    if (resumenTotal) {
      resumenTotal.textContent =
        new Intl.NumberFormat(
          "es-MX",
          {
            style: "currency",
            currency: "MXN"
          }
        ).format(
          subtotal
        );
    }

    if (checkoutTotal) {
      checkoutTotal.textContent =
        new Intl.NumberFormat(
          "es-MX",
          {
            style: "currency",
            currency: "MXN"
          }
        ).format(
          subtotal
        );
    }

    actualizarIndicadoresCarrito();

    return;
  }

  if (formulario) {
    formulario.hidden =
      true;
  }

  if (aplicado) {
    aplicado.hidden =
      false;
  }

  if (codigoNombre) {
    codigoNombre.textContent =
      codigoPromocionalDreams
        .codigo;
  }

  if (codigoBeneficio) {
    codigoBeneficio.textContent =
      obtenerDescripcionCodigoAplicado();
  }

  if (
    codigoPromocionalDreams
      .tipoBeneficio ===
    "porcentaje"
  ) {
    const descuento =
      obtenerDescuentoCodigoLocal();

    const total =
      Math.max(
        0,
        subtotal -
        descuento
      );

    if (filaDescuento) {
      filaDescuento.hidden =
        false;
    }

    if (filaRegalo) {
      filaRegalo.hidden =
        true;
    }

    if (
      resumenCodigoNombre
    ) {
      resumenCodigoNombre.textContent =
        codigoPromocionalDreams
          .codigo;
    }

    if (resumenDescuento) {
      resumenDescuento.textContent =
        `-${new Intl.NumberFormat(
          "es-MX",
          {
            style: "currency",
            currency: "MXN"
          }
        ).format(
          descuento
        )}`;
    }

    if (resumenTotal) {
      resumenTotal.textContent =
        new Intl.NumberFormat(
          "es-MX",
          {
            style: "currency",
            currency: "MXN"
          }
        ).format(
          total
        );
    }

    if (checkoutTotal) {
      checkoutTotal.textContent =
        new Intl.NumberFormat(
          "es-MX",
          {
            style: "currency",
            currency: "MXN"
          }
        ).format(
          total
        );
    }
  }

  if (
    codigoPromocionalDreams
      .tipoBeneficio ===
    "productoGratis"
  ) {
    if (filaDescuento) {
      filaDescuento.hidden =
        true;
    }

    if (filaRegalo) {
      filaRegalo.hidden =
        false;
    }

    if (resumenRegalo) {
      resumenRegalo.textContent =
        codigoPromocionalDreams
          .productoGratisNombre ||
        "Artículo gratis";
    }

    if (resumenTotal) {
      resumenTotal.textContent =
        new Intl.NumberFormat(
          "es-MX",
          {
            style: "currency",
            currency: "MXN"
          }
        ).format(
          subtotal
        );
    }

    if (checkoutTotal) {
      checkoutTotal.textContent =
        new Intl.NumberFormat(
          "es-MX",
          {
            style: "currency",
            currency: "MXN"
          }
        ).format(
          subtotal
        );
    }
  }

  actualizarIndicadoresCarrito();
}

function quitarCodigoPromocional(
  mostrarAviso = true
) {
  guardarCodigoPromocionalLocal(
    null
  );

  ocultarMensajeCodigo();

  const input =
    document.getElementById(
      "codigo-promocional-input"
    );

  if (input) {
    input.value =
      "";
  }

  actualizarResumenCodigoPromocional();

  if (mostrarAviso) {
    mostrarNotificacionCarrito(
      "Código promocional eliminado."
    );
  }
}

async function revalidarCodigoPromocionalGuardado() {
  if (
    !codigoPromocionalDreams ||
    typeof db ===
      "undefined"
  ) {
    actualizarResumenCodigoPromocional();

    return;
  }

  try {
    const documento =
      await db
        .collection(
          "codigosPromocionales"
        )
        .doc(
          codigoPromocionalDreams
            .codigo
        )
        .get();

    if (!documento.exists) {
      quitarCodigoPromocional(
        false
      );

      return;
    }

    const codigo = {
      id:
        documento.id,
      ...documento.data()
    };

    const validacion =
      validarCodigoConCarrito(
        codigo
      );

    if (!validacion.valido) {
      guardarCodigoPromocionalLocal(
        null
      );

      actualizarResumenCodigoPromocional();

      mostrarMensajeCodigo(
        validacion.mensaje
      );

      return;
    }

    const productoGratis =
      await validarProductoGratis(
        codigo
      );

    guardarCodigoPromocionalLocal(
      construirCodigoLocal(
        codigo,
        productoGratis
      )
    );

    actualizarResumenCodigoPromocional();

  } catch (error) {
    console.error(
      error
    );

    guardarCodigoPromocionalLocal(
      null
    );

    actualizarResumenCodigoPromocional();
  }
}

document
  .getElementById(
    "btn-carrito-header"
  )
  ?.addEventListener(
    "click",
    abrirCarrito
  );

document
  .getElementById(
    "nav-carrito"
  )
  ?.addEventListener(
    "click",
    abrirCarrito
  );

document
  .getElementById(
    "floating-cart"
  )
  ?.addEventListener(
    "click",
    abrirCarrito
  );

document
  .getElementById(
    "btn-aplicar-codigo"
  )
  ?.addEventListener(
    "click",
    aplicarCodigoPromocional
  );

document
  .getElementById(
    "codigo-promocional-input"
  )
  ?.addEventListener(
    "input",
    event => {
      event.target.value =
        event.target.value
          .toUpperCase()
          .replace(
            /[^A-Z0-9_-]/g,
            ""
          );

      ocultarMensajeCodigo();
    }
  );

document
  .getElementById(
    "codigo-promocional-input"
  )
  ?.addEventListener(
    "keydown",
    event => {
      if (
        event.key ===
        "Enter"
      ) {
        event.preventDefault();

        aplicarCodigoPromocional();
      }
    }
  );

document
  .getElementById(
    "btn-quitar-codigo"
  )
  ?.addEventListener(
    "click",
    () => {
      quitarCodigoPromocional(
        true
      );
    }
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
  () => [
    ...carritoDreams
  ];

window.obtenerTotalCarrito =
  obtenerTotalCarrito;

window.obtenerTotalFinalCarrito =
  obtenerTotalFinalCarrito;

window.obtenerDescuentoCarrito =
  obtenerDescuentoCodigoLocal;

window.obtenerCantidadTotalCarrito =
  obtenerCantidadTotalCarrito;

window.obtenerCodigoPromocionalDreams =
  () => {
    if (
      !codigoPromocionalDreams
    ) {
      return null;
    }

    return {
      ...codigoPromocionalDreams
    };
  };

window.quitarCodigoPromocional =
  quitarCodigoPromocional;

window.actualizarResumenCodigoPromocional =
  actualizarResumenCodigoPromocional;

actualizarIndicadoresCarrito();

if (
  document.getElementById(
    "seccion-codigo-promocional"
  )
) {
  revalidarCodigoPromocionalGuardado();
}