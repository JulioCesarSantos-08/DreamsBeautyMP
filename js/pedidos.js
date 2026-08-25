const carritoPedido =
  typeof window.obtenerCarritoDreams ===
  "function"
    ? window.obtenerCarritoDreams()
    : [];

const codigoPromocionalPedido =
  typeof window.obtenerCodigoPromocionalDreams ===
  "function"
    ? window.obtenerCodigoPromocionalDreams()
    : null;

const checkoutProductos =
  document.getElementById(
    "checkout-productos"
  );

const checkoutCantidad =
  document.getElementById(
    "checkout-cantidad"
  );

const checkoutSubtotal =
  document.getElementById(
    "checkout-subtotal"
  );

const checkoutResumenTotal =
  document.getElementById(
    "checkout-resumen-total"
  );

const checkoutFilaDescuento =
  document.getElementById(
    "checkout-fila-descuento"
  );

const checkoutDescuento =
  document.getElementById(
    "checkout-descuento"
  );

const checkoutDescuentoCodigo =
  document.getElementById(
    "checkout-descuento-codigo"
  );

const checkoutFilaRegalo =
  document.getElementById(
    "checkout-fila-regalo"
  );

const checkoutRegalo =
  document.getElementById(
    "checkout-regalo"
  );

const checkoutCodigoAplicado =
  document.getElementById(
    "checkout-codigo-aplicado"
  );

const checkoutCodigoNombre =
  document.getElementById(
    "checkout-codigo-nombre"
  );

const checkoutCodigoBeneficio =
  document.getElementById(
    "checkout-codigo-beneficio"
  );

const finishTotal =
  document.getElementById(
    "finish-total"
  );

const btnConfirmarPedido =
  document.getElementById(
    "btn-confirmar-pedido"
  );

const orderLoader =
  document.getElementById(
    "order-loader"
  );

function monedaPedido(valor) {
  return new Intl.NumberFormat(
    "es-MX",
    {
      style: "currency",
      currency: "MXN"
    }
  ).format(
    Number(valor) || 0
  );
}

function escapePedido(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizarTextoPedido(
  valor
) {
  return String(valor || "")
    .trim()
    .toLowerCase();
}

function totalPedidoLocal() {
  return carritoPedido.reduce(
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

function cantidadPedidoLocal() {
  return carritoPedido.reduce(
    (total, item) =>
      total +
      Number(
        item.cantidad || 0
      ),
    0
  );
}

function obtenerDescuentoPedidoLocal() {
  if (
    !codigoPromocionalPedido ||
    codigoPromocionalPedido
      .tipoBeneficio !==
      "porcentaje"
  ) {
    return 0;
  }

  const porcentaje =
    Number(
      codigoPromocionalPedido
        .porcentaje
    ) || 0;

  if (
    porcentaje < 1 ||
    porcentaje > 100
  ) {
    return 0;
  }

  const alcance =
    codigoPromocionalPedido
      .alcance ||
    "tienda";

  let base =
    0;

  if (
    alcance ===
    "tienda"
  ) {
    base =
      totalPedidoLocal();
  }

  if (
    alcance ===
    "categoria"
  ) {
    const categoria =
      normalizarTextoPedido(
        codigoPromocionalPedido
          .categoria
      );

    base =
      carritoPedido
        .filter(
          item =>
            normalizarTextoPedido(
              item.categoria
            ) ===
            categoria
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
    base =
      carritoPedido
        .filter(
          item =>
            item.id ===
            codigoPromocionalPedido
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

  return Math.min(
    totalPedidoLocal(),
    Math.max(
      0,
      base *
      porcentaje /
      100
    )
  );
}

function totalFinalPedidoLocal() {
  return Math.max(
    0,
    totalPedidoLocal() -
    obtenerDescuentoPedidoLocal()
  );
}

function descripcionCodigoPedido() {
  if (
    !codigoPromocionalPedido
  ) {
    return "";
  }

  if (
    codigoPromocionalPedido
      .tipoBeneficio ===
    "productoGratis"
  ) {
    return `${
      codigoPromocionalPedido
        .productoGratisNombre ||
      "Artículo"
    } gratis`;
  }

  const porcentaje =
    Number(
      codigoPromocionalPedido
        .porcentaje
    ) || 0;

  if (
    codigoPromocionalPedido
      .alcance ===
    "categoria"
  ) {
    return `${porcentaje}% de descuento en ${
      codigoPromocionalPedido
        .categoria
    }`;
  }

  if (
    codigoPromocionalPedido
      .alcance ===
    "producto"
  ) {
    return `${porcentaje}% de descuento en ${
      codigoPromocionalPedido
        .productoNombre ||
      "el producto seleccionado"
    }`;
  }

  return `${porcentaje}% de descuento en tu compra`;
}

function renderizarResumenPedido() {
  if (!carritoPedido.length) {
    window.location.href =
      "carrito.html";

    return;
  }

  let productosVisuales =
    carritoPedido.map(
      item => `
        <article class="checkout-product">

          <img
            src="${escapePedido(
              item.imagen
            )}"
            alt="${escapePedido(
              item.nombre
            )}"
          >

          <div class="checkout-product-info">

            <strong>
              ${escapePedido(
                item.nombre
              )}
            </strong>

            <span>
              ${Number(
                item.cantidad
              )} × ${monedaPedido(
                item.precio
              )}
            </span>

          </div>

          <div class="checkout-product-price">
            ${monedaPedido(
              Number(
                item.precio
              ) *
              Number(
                item.cantidad
              )
            )}
          </div>

        </article>
      `
    ).join("");

  if (
    codigoPromocionalPedido &&
    codigoPromocionalPedido
      .tipoBeneficio ===
      "productoGratis"
  ) {
    productosVisuales += `
      <article class="checkout-product">

        <img
          src="${escapePedido(
            codigoPromocionalPedido
              .productoGratisImagen ||
            "imagenes/sistema/producto-sin-imagen.png"
          )}"
          alt="${escapePedido(
            codigoPromocionalPedido
              .productoGratisNombre ||
            "Artículo gratis"
          )}"
          onerror="this.src='imagenes/sistema/producto-sin-imagen.png'"
        >

        <div class="checkout-product-info">

          <strong>
            ${escapePedido(
              codigoPromocionalPedido
                .productoGratisNombre ||
              "Artículo gratis"
            )}
          </strong>

          <span>
            1 × Promoción
          </span>

        </div>

        <div class="checkout-product-price">
          $0.00
        </div>

      </article>
    `;
  }

  checkoutProductos.innerHTML =
    productosVisuales;

  let cantidad =
    cantidadPedidoLocal();

  if (
    codigoPromocionalPedido &&
    codigoPromocionalPedido
      .tipoBeneficio ===
      "productoGratis"
  ) {
    cantidad += 1;
  }

  const subtotal =
    totalPedidoLocal();

  const descuento =
    obtenerDescuentoPedidoLocal();

  const total =
    totalFinalPedidoLocal();

  checkoutCantidad.textContent =
    cantidad;

  if (checkoutSubtotal) {
    checkoutSubtotal.textContent =
      monedaPedido(
        subtotal
      );
  }

  checkoutResumenTotal.textContent =
    monedaPedido(
      total
    );

  finishTotal.textContent =
    monedaPedido(
      total
    );

  if (
    !codigoPromocionalPedido
  ) {
    if (
      checkoutCodigoAplicado
    ) {
      checkoutCodigoAplicado.hidden =
        true;
    }

    if (
      checkoutFilaDescuento
    ) {
      checkoutFilaDescuento.hidden =
        true;
    }

    if (
      checkoutFilaRegalo
    ) {
      checkoutFilaRegalo.hidden =
        true;
    }

    return;
  }

  if (
    checkoutCodigoAplicado
  ) {
    checkoutCodigoAplicado.hidden =
      false;
  }

  if (
    checkoutCodigoNombre
  ) {
    checkoutCodigoNombre.textContent =
      codigoPromocionalPedido
        .codigo;
  }

  if (
    checkoutCodigoBeneficio
  ) {
    checkoutCodigoBeneficio.textContent =
      descripcionCodigoPedido();
  }

  if (
    codigoPromocionalPedido
      .tipoBeneficio ===
    "porcentaje"
  ) {
    if (
      checkoutFilaDescuento
    ) {
      checkoutFilaDescuento.hidden =
        false;
    }

    if (
      checkoutFilaRegalo
    ) {
      checkoutFilaRegalo.hidden =
        true;
    }

    if (
      checkoutDescuento
    ) {
      checkoutDescuento.textContent =
        `-${monedaPedido(
          descuento
        )}`;
    }

    if (
      checkoutDescuentoCodigo
    ) {
      checkoutDescuentoCodigo.textContent =
        codigoPromocionalPedido
          .codigo;
    }
  }

  if (
    codigoPromocionalPedido
      .tipoBeneficio ===
    "productoGratis"
  ) {
    if (
      checkoutFilaDescuento
    ) {
      checkoutFilaDescuento.hidden =
        true;
    }

    if (
      checkoutFilaRegalo
    ) {
      checkoutFilaRegalo.hidden =
        false;
    }

    if (
      checkoutRegalo
    ) {
      checkoutRegalo.textContent =
        codigoPromocionalPedido
          .productoGratisNombre ||
        "Artículo gratis";
    }
  }
}

function obtenerMetodoPago() {
  return (
    document.querySelector(
      'input[name="metodo-pago"]:checked'
    )?.value ||
    "Efectivo"
  );
}

function limpiarTelefono(valor) {
  return String(
    valor || ""
  )
    .replace(
      /[^\d+]/g,
      ""
    )
    .trim();
}

function validarDatosCliente() {
  const nombre =
    document
      .getElementById(
        "nombre-cliente"
      )
      .value
      .trim();

  const telefono =
    limpiarTelefono(
      document
        .getElementById(
          "telefono-cliente"
        )
        .value
    );

  if (
    nombre.length < 3
  ) {
    alert(
      "Por favor ingresa tu nombre completo."
    );

    document
      .getElementById(
        "nombre-cliente"
      )
      .focus();

    return null;
  }

  if (
    telefono.length < 10
  ) {
    alert(
      "Por favor ingresa un número de teléfono válido."
    );

    document
      .getElementById(
        "telefono-cliente"
      )
      .focus();

    return null;
  }

  return {
    nombre,
    telefono
  };
}

function generarFolioPedido() {
  const ahora =
    new Date();

  const año =
    String(
      ahora.getFullYear()
    ).slice(-2);

  const mes =
    String(
      ahora.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      ahora.getDate()
    ).padStart(
      2,
      "0"
    );

  const aleatorio =
    Math.floor(
      1000 +
      Math.random() *
      9000
    );

  return `DC-${año}${mes}${dia}-${aleatorio}`;
}

function obtenerFechaCodigoPedido(
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
      Number(
        valor.seconds
      )
    )
  ) {
    return new Date(
      Number(
        valor.seconds
      ) *
      1000
    );
  }

  const fecha =
    new Date(
      valor
    );

  return Number.isNaN(
    fecha.getTime()
  )
    ? null
    : fecha;
}

function validarCodigoReal(
  codigo
) {
  if (!codigo) {
    throw new Error(
      "El código promocional ya no existe."
    );
  }

  if (
    codigo.activo ===
    false
  ) {
    throw new Error(
      "El código promocional ya no está activo."
    );
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
    throw new Error(
      "Este código ya alcanzó su límite de canjes."
    );
  }

  const ahora =
    new Date();

  const inicio =
    obtenerFechaCodigoPedido(
      codigo.fechaInicio
    );

  const fin =
    obtenerFechaCodigoPedido(
      codigo.fechaFin
    );

  if (
    inicio &&
    ahora < inicio
  ) {
    throw new Error(
      "Este código todavía no está disponible."
    );
  }

  if (
    fin &&
    ahora > fin
  ) {
    throw new Error(
      "Este código promocional ya expiró."
    );
  }

  return {
    limite,
    usados
  };
}

function calcularDescuentoReal(
  codigo,
  productos
) {
  if (
    codigo.tipoBeneficio !==
    "porcentaje"
  ) {
    return 0;
  }

  const porcentaje =
    Number(
      codigo.porcentaje
    );

  if (
    !porcentaje ||
    porcentaje < 1 ||
    porcentaje > 100
  ) {
    throw new Error(
      "El descuento de este código no es válido."
    );
  }

  const alcance =
    codigo.alcance ||
    "tienda";

  let base =
    0;

  if (
    alcance ===
    "tienda"
  ) {
    base =
      productos.reduce(
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
    "categoria"
  ) {
    const categoria =
      normalizarTextoPedido(
        codigo.categoria
      );

    const productosCategoria =
      productos.filter(
        item =>
          normalizarTextoPedido(
            item.categoria
          ) ===
          categoria
      );

    if (
      !productosCategoria.length
    ) {
      throw new Error(
        `Este código solo aplica a la categoría ${codigo.categoria || "seleccionada"}.`
      );
    }

    base =
      productosCategoria.reduce(
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
    const productosObjetivo =
      productos.filter(
        item =>
          item.id ===
          codigo.productoId
      );

    if (
      !productosObjetivo.length
    ) {
      throw new Error(
        `Este código solo aplica a ${codigo.productoNombre || "un producto específico"}.`
      );
    }

    base =
      productosObjetivo.reduce(
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

  return Math.max(
    0,
    base *
    porcentaje /
    100
  );
}

async function verificarStockPedido() {
  const productosActualizados =
    [];

  for (
    const item of
    carritoPedido
  ) {
    const doc =
      await db
        .collection(
          "productos"
        )
        .doc(
          item.id
        )
        .get();

    if (!doc.exists) {
      throw new Error(
        `El producto "${item.nombre}" ya no existe.`
      );
    }

    const producto = {
      id:
        doc.id,
      ...doc.data()
    };

    const stockActual =
      Number(
        producto.stock
      ) || 0;

    if (
      stockActual <
      Number(
        item.cantidad
      )
    ) {
      throw new Error(
        `Ya no hay suficiente stock de "${item.nombre}".`
      );
    }

    productosActualizados.push({
      ...item,
      stockActual
    });
  }

  return productosActualizados;
}

async function crearPedido() {
  const cliente =
    validarDatosCliente();

  if (!cliente) {
    return;
  }

  if (
    !carritoPedido.length
  ) {
    alert(
      "Tu carrito está vacío."
    );

    window.location.href =
      "index.html";

    return;
  }

  btnConfirmarPedido.disabled =
    true;

  orderLoader
    .classList
    .add(
      "active"
    );

  try {
    await verificarStockPedido();

    const folio =
      generarFolioPedido();

    const notas =
      document
        .getElementById(
          "notas-cliente"
        )
        .value
        .trim();

    const metodoPago =
      obtenerMetodoPago();

    const pedidoRef =
      db
        .collection(
          "recibos"
        )
        .doc();

    await db.runTransaction(
      async transaction => {
        let codigoReal =
          null;

        let codigoRef =
          null;

        let datosUsoCodigo =
          null;

        let codigoClientePedido =
          null;  

        if (
          codigoPromocionalPedido &&
          codigoPromocionalPedido
            .codigo
        ) {
          codigoRef =
            db
              .collection(
                "codigosPromocionales"
              )
              .doc(
                codigoPromocionalPedido
                  .codigo
              );

          const codigoSnap =
            await transaction.get(
              codigoRef
            );

          if (
            !codigoSnap.exists
          ) {
            throw new Error(
              "El código promocional ya no existe."
            );
          }

          codigoReal = {
            id:
              codigoSnap.id,
            ...codigoSnap.data()
          };

          datosUsoCodigo =
            validarCodigoReal(
              codigoReal
            );

            if (
  typeof window
    .validarCodigoClienteTransaccion ===
  "function"
) {
  codigoClientePedido =
    await window
      .validarCodigoClienteTransaccion(
        transaction,
        codigoReal.codigo
      );
}

        }

        const cantidadesNecesarias =
          new Map();

        carritoPedido.forEach(
          item => {
            cantidadesNecesarias.set(
              item.id,
              (
                cantidadesNecesarias.get(
                  item.id
                ) || 0
              ) +
              Number(
                item.cantidad
              )
            );
          }
        );

        if (
          codigoReal &&
          codigoReal
            .tipoBeneficio ===
            "productoGratis"
        ) {
          if (
            !codigoReal
              .productoGratisId
          ) {
            throw new Error(
              "El artículo gratis de este código ya no está disponible."
            );
          }

          cantidadesNecesarias.set(
            codigoReal
              .productoGratisId,
            (
              cantidadesNecesarias.get(
                codigoReal
                  .productoGratisId
              ) || 0
            ) +
            1
          );
        }

        const productosSnapshots =
          new Map();

        for (
          const productoId of
          cantidadesNecesarias.keys()
        ) {
          const productoRef =
            db
              .collection(
                "productos"
              )
              .doc(
                productoId
              );

          const productoSnap =
            await transaction.get(
              productoRef
            );

          if (
            !productoSnap.exists
          ) {
            throw new Error(
              "Uno de los productos ya no está disponible."
            );
          }

          productosSnapshots.set(
            productoId,
            {
              ref:
                productoRef,
              snap:
                productoSnap,
              data:
                productoSnap.data()
            }
          );
        }

        for (
          const [
            productoId,
            cantidadNecesaria
          ] of
          cantidadesNecesarias
        ) {
          const producto =
            productosSnapshots.get(
              productoId
            );

          const stockActual =
            Number(
              producto.data.stock
            ) || 0;

          if (
            stockActual <
            cantidadNecesaria
          ) {
            const nombre =
              producto.data.nombre ||
              "Producto";

            throw new Error(
              `No hay suficientes unidades de "${nombre}".`
            );
          }
        }

        const productosFinales =
          carritoPedido.map(
            item => ({
              id:
                item.id,
              nombre:
                item.nombre,
              categoria:
                item.categoria ||
                "",
              imagen:
                item.imagen ||
                "",
              cantidad:
                Number(
                  item.cantidad
                ),
              precio:
                Number(
                  item.precio
                ),
              subtotal:
                Number(
                  item.precio
                ) *
                Number(
                  item.cantidad
                ),
              esRegalo:
                false
            })
          );

        let productoGratisFinal =
          null;

        if (
          codigoReal &&
          codigoReal
            .tipoBeneficio ===
            "productoGratis"
        ) {
          const datosProductoGratis =
            productosSnapshots.get(
              codigoReal
                .productoGratisId
            ).data;

          productoGratisFinal = {
            id:
              codigoReal
                .productoGratisId,
            nombre:
              datosProductoGratis
                .nombre ||
              codigoReal
                .productoGratisNombre ||
              "Artículo gratis",
            categoria:
              datosProductoGratis
                .categoria ||
              "",
            imagen:
              datosProductoGratis
                .imagen ||
              "",
            cantidad:
              1,
            precio:
              0,
            subtotal:
              0,
            esRegalo:
              true,
            precioOriginal:
              Number(
                datosProductoGratis
                  .precio
              ) || 0,
            codigoPromocional:
              codigoReal
                .codigo
          };

          productosFinales.push(
            productoGratisFinal
          );
        }

        const subtotal =
          carritoPedido.reduce(
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

        let descuento =
          0;

        if (
          codigoReal
        ) {
          descuento =
            calcularDescuentoReal(
              codigoReal,
              productosFinales.filter(
                item =>
                  !item.esRegalo
              )
            );
        }

        descuento =
          Math.max(
            0,
            Math.min(
              subtotal,
              descuento
            )
          );

        const total =
          Math.max(
            0,
            subtotal -
            descuento
          );

        for (
          const [
            productoId,
            cantidadNecesaria
          ] of
          cantidadesNecesarias
        ) {
          const producto =
            productosSnapshots.get(
              productoId
            );

          const stockActual =
            Number(
              producto.data.stock
            ) || 0;

          transaction.update(
            producto.ref,
            {
              stock:
                stockActual -
                cantidadNecesaria
            }
          );
        }

        if (
          codigoReal &&
          codigoRef
        ) {
          transaction.update(
            codigoRef,
            {
              usosRealizados:
                datosUsoCodigo.usados +
                1,
              ultimoCanjeEn:
                firebase.firestore
                  .FieldValue
                  .serverTimestamp()
            }
          );
        }

        if (
  codigoClientePedido &&
  typeof window
    .marcarCodigoClienteUsadoTransaccion ===
  "function"
) {
  window
    .marcarCodigoClienteUsadoTransaccion(
      transaction,
      codigoClientePedido,
      pedidoRef.id
    );
}

        const datosCodigoPedido =
          codigoReal
            ? {
                codigo:
                  codigoReal.codigo,
                tipoBeneficio:
                  codigoReal
                    .tipoBeneficio,
                porcentaje:
                  Number(
                    codigoReal
                      .porcentaje
                  ) || 0,
                alcance:
                  codigoReal
                    .alcance ||
                  "",
                categoria:
                  codigoReal
                    .categoria ||
                  "",
                productoId:
                  codigoReal
                    .productoId ||
                  "",
                productoNombre:
                  codigoReal
                    .productoNombre ||
                  "",
                productoGratisId:
                  codigoReal
                    .productoGratisId ||
                  "",
                productoGratisNombre:
                  productoGratisFinal
                    ?.nombre ||
                  codigoReal
                    .productoGratisNombre ||
                  "",
                descuento:
                  descuento
              }
            : null;

        const cantidadTotal =
          productosFinales.reduce(
            (totalCantidad, item) =>
              totalCantidad +
              Number(
                item.cantidad || 0
              ),
            0
          );

          const cuentaCliente =
  typeof window
    .obtenerDatosCuentaParaPedido ===
  "function"
    ? window
        .obtenerDatosCuentaParaPedido()
    : null;

        transaction.set(
          pedidoRef,
          {
folio,

clienteUid:
  cuentaCliente?.uid ||
  "",

clienteEmail:
  cuentaCliente?.email ||
  "",

clienteLocalidad:
  cuentaCliente?.localidad ||
  "",

cliente:
  cliente.nombre,

telefono:
  cliente.telefono,

notas,
            metodoPago,
            productos:
              productosFinales,
            subtotal,
            descuento,
            total,
            cantidadProductos:
              cantidadTotal,
            codigoPromocional:
              datosCodigoPedido,
            tieneCodigoPromocional:
              Boolean(
                datosCodigoPedido
              ),
            estado:
              "pendiente",
            preparado:
              false,
            pagado:
              false,
            cancelado:
              false,
            fecha:
              firebase.firestore
                .FieldValue
                .serverTimestamp(),
            fechaCreacion:
              new Date()
                .toISOString()
          }
        );
      }
    );

    localStorage.setItem(
      "dreamsUltimoPedido",
      JSON.stringify({
        id:
          pedidoRef.id,
        folio
      })
    );

    window.vaciarCarrito();

    window.location.href =
      `recibo.html?id=${encodeURIComponent(
        pedidoRef.id
      )}`;

  } catch (error) {
    console.error(
      error
    );

    alert(
      error.message ||
      "No pudimos crear el pedido. Intenta nuevamente."
    );

    btnConfirmarPedido.disabled =
      false;

    orderLoader
      .classList
      .remove(
        "active"
      );
  }
}

document
  .getElementById(
    "btn-volver"
  )
  ?.addEventListener(
    "click",
    () => {
      window.location.href =
        "carrito.html";
    }
  );

btnConfirmarPedido
  ?.addEventListener(
    "click",
    crearPedido
  );

renderizarResumenPedido();