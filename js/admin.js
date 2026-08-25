let productosAdmin = [];
let pedidosAdmin = [];
let descuentosAdmin = [];
let filtroPedidosAdmin = "todos";
let imagenProductoActual = "";

const sidebar =
  document.getElementById("sidebar");

const adminOverlay =
  document.getElementById("admin-overlay");

const modalProducto =
  document.getElementById("modal-producto");

const modalOverlay =
  document.getElementById("modal-overlay");

function monedaAdmin(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(Number(valor) || 0);
}

function escapeAdmin(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function obtenerImagenAdmin(producto) {
  const imagen =
    String(producto.imagen || "").trim();

  if (!imagen) {
    return "imagenes/sistema/producto-sin-imagen.png";
  }

  if (
    imagen.startsWith("http://") ||
    imagen.startsWith("https://") ||
    imagen.startsWith("data:")
  ) {
    return imagen;
  }

  if (imagen.startsWith("imagenes/")) {
    return imagen;
  }

  return `imagenes/${imagen}`;
}

function cambiarSeccion(seccion) {
  document
    .querySelectorAll(".admin-section")
    .forEach(elemento => {
      elemento.classList.remove("active");
    });

  document
    .querySelectorAll(".nav-option")
    .forEach(elemento => {
      elemento.classList.remove("active");
    });

  document
    .getElementById(`seccion-${seccion}`)
    ?.classList.add("active");

  document
    .querySelector(
      `.nav-option[data-section="${seccion}"]`
    )
    ?.classList.add("active");

  const titulos = {
    inicio: "Panel general",
    productos: "Inventario",
    pedidos: "Pedidos",
    descuentos: "Descuentos"
  };

  document.getElementById(
    "titulo-seccion"
  ).textContent =
    titulos[seccion] || "Administración";

  cerrarSidebar();
}

function abrirSidebar() {
  sidebar.classList.add("active");
  adminOverlay.classList.add("active");
}

function cerrarSidebar() {
  sidebar.classList.remove("active");
  adminOverlay.classList.remove("active");
}

function abrirModalProducto() {
  modalProducto.classList.add("active");
  modalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function cerrarModalProducto() {
  modalProducto.classList.remove("active");
  modalOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

function limpiarFormularioProducto() {
  document
    .getElementById("form-producto")
    .reset();

  document.getElementById(
    "producto-id"
  ).value = "";

  document.getElementById(
    "titulo-modal-producto"
  ).textContent = "Nuevo producto";

  document.getElementById(
    "preview-imagen"
  ).innerHTML = `
    <i class="fa-regular fa-image"></i>
    <span>Sin imagen</span>
  `;

  document.getElementById(
    "upload-status"
  ).textContent = "";

  imagenProductoActual = "";

  if (
    typeof window
      .limpiarImagenSeleccionada ===
    "function"
  ) {
    window
      .limpiarImagenSeleccionada();
  }
}

function renderizarProductosAdmin() {
  const contenedor =
    document.getElementById(
      "lista-productos-admin"
    );

  const busqueda =
    document
      .getElementById(
        "buscar-producto-admin"
      )
      .value
      .toLowerCase()
      .trim();

  const filtro =
    document.getElementById(
      "filtro-stock-admin"
    ).value;

  let lista =
    [...productosAdmin];

  if (busqueda) {
    lista = lista.filter(producto =>
      String(producto.nombre || "")
        .toLowerCase()
        .includes(busqueda)
    );
  }

  if (filtro === "disponibles") {
    lista = lista.filter(
      producto =>
        Number(producto.stock) > 0
    );
  }

  if (filtro === "agotados") {
    lista = lista.filter(
      producto =>
        Number(producto.stock) <= 0
    );
  }

  lista.sort((a, b) => {
    const stockA =
      Number(a.stock) || 0;

    const stockB =
      Number(b.stock) || 0;

    if (stockA > 0 && stockB <= 0) {
      return -1;
    }

    if (stockA <= 0 && stockB > 0) {
      return 1;
    }

    return String(a.nombre || "")
      .localeCompare(
        String(b.nombre || ""),
        "es",
        { sensitivity: "base" }
      );
  });

  if (!lista.length) {
    contenedor.innerHTML = `
      <div class="empty-admin">
        No se encontraron productos.
      </div>
    `;

    return;
  }

  contenedor.innerHTML =
    lista.map(producto => `
      <article class="admin-product-card">

        <div class="admin-product-image">
          <img
            src="${escapeAdmin(
              obtenerImagenAdmin(producto)
            )}"
            alt="${escapeAdmin(
              producto.nombre || "Producto"
            )}"
            onerror="this.src='imagenes/sistema/producto-sin-imagen.png'"
          >
        </div>

        <div class="admin-product-info">

          <span>
            ${escapeAdmin(
              producto.categoria ||
              "Sin categoría"
            )}
          </span>

          <h3>
            ${escapeAdmin(
              producto.nombre ||
              "Producto"
            )}
          </h3>

          <div class="admin-product-meta">

            <strong>
              ${monedaAdmin(
                producto.precio
              )}
            </strong>

            <span>
              Stock:
              ${Number(
                producto.stock
              ) || 0}
            </span>

          </div>

          <div class="admin-product-actions">

            <button
              class="small-action edit"
              onclick="editarProductoAdmin('${producto.id}')"
            >
              Editar
            </button>

            <button
              class="small-action delete"
              onclick="eliminarProductoAdmin('${producto.id}')"
            >
              Eliminar
            </button>

          </div>

        </div>

      </article>
    `).join("");
}

function editarProductoAdmin(id) {
  const producto =
    productosAdmin.find(
      item => item.id === id
    );

  if (!producto) {
    return;
  }

  limpiarFormularioProducto();

  document.getElementById(
    "producto-id"
  ).value =
    producto.id;

  document.getElementById(
    "producto-nombre"
  ).value =
    producto.nombre || "";

  document.getElementById(
    "producto-categoria"
  ).value =
    producto.categoria || "";

  document.getElementById(
    "producto-precio"
  ).value =
    Number(producto.precio) || 0;

  document.getElementById(
    "producto-stock"
  ).value =
    Number(producto.stock) || 0;

  document.getElementById(
    "producto-descripcion"
  ).value =
    producto.descripcion || "";

  imagenProductoActual =
    producto.imagen || "";

  document.getElementById(
    "titulo-modal-producto"
  ).textContent =
    "Editar producto";

  document.getElementById(
    "preview-imagen"
  ).innerHTML = `
    <img
      src="${escapeAdmin(
        obtenerImagenAdmin(producto)
      )}"
      alt="${escapeAdmin(
        producto.nombre || "Producto"
      )}"
      onerror="this.src='imagenes/sistema/producto-sin-imagen.png'"
    >
  `;

  document.getElementById(
    "upload-status"
  ).textContent =
    "Imagen actual";

  abrirModalProducto();
}

async function eliminarProductoAdmin(id) {
  const producto =
    productosAdmin.find(
      item => item.id === id
    );

  if (!producto) {
    return;
  }

  const confirmar =
    confirm(
      `¿Eliminar "${producto.nombre}" definitivamente?`
    );

  if (!confirmar) {
    return;
  }

  try {
    await db
      .collection("productos")
      .doc(id)
      .delete();

  } catch (error) {
    console.error(error);

    alert(
      "No se pudo eliminar el producto."
    );
  }
}

function renderizarDashboard() {
  document.getElementById(
    "total-productos"
  ).textContent =
    productosAdmin.length;

  document.getElementById(
    "productos-agotados"
  ).textContent =
    productosAdmin.filter(
      producto =>
        Number(producto.stock) <= 0
    ).length;

  document.getElementById(
    "pedidos-pendientes"
  ).textContent =
    pedidosAdmin.filter(
      pedido =>
        !pedido.pagado &&
        !pedido.cancelado
    ).length;

  const inicioHoy =
    new Date();

  inicioHoy.setHours(
    0,
    0,
    0,
    0
  );

  const ventasHoy =
    pedidosAdmin
      .filter(pedido => {
        if (!pedido.pagado) {
          return false;
        }

        const fecha =
          pedido.fecha?.toDate
            ? pedido.fecha.toDate()
            : new Date(
                pedido.fechaCreacion
              );

        if (
          Number.isNaN(
            fecha.getTime()
          )
        ) {
          return false;
        }

        return (
          fecha.getTime() >=
          inicioHoy.getTime()
        );
      })
      .reduce(
        (total, pedido) =>
          total +
          Number(pedido.total || 0),
        0
      );

  document.getElementById(
    "ventas-hoy"
  ).textContent =
    monedaAdmin(ventasHoy);

  const recientes =
    [...pedidosAdmin]
      .slice(0, 5);

  document.getElementById(
    "pedidos-recientes"
  ).innerHTML =
    recientes.length
      ? recientes.map(pedido => `
          <div class="recent-order">

            <div>

              <strong>
                ${escapeAdmin(
                  pedido.folio ||
                  pedido.id
                )}
              </strong>

              <span>
                ${escapeAdmin(
                  pedido.cliente ||
                  "Cliente"
                )}
              </span>

            </div>

            <div class="order-state">
              ${
                pedido.cancelado
                  ? "Cancelado"
                  : pedido.pagado
                    ? "Pagado"
                    : pedido.preparado
                      ? "Preparado"
                      : "Pendiente"
              }
            </div>

          </div>
        `).join("")
      : `
          <div class="empty-admin">
            No hay pedidos todavía.
          </div>
        `;

  const stockBajo =
    productosAdmin
      .filter(
        producto =>
          Number(producto.stock) <= 3
      )
      .sort(
        (a, b) =>
          Number(a.stock) -
          Number(b.stock)
      )
      .slice(0, 5);

  document.getElementById(
    "stock-bajo"
  ).innerHTML =
    stockBajo.length
      ? stockBajo.map(producto => `
          <div class="low-stock-item">

            <img
              src="${escapeAdmin(
                obtenerImagenAdmin(producto)
              )}"
              alt="${escapeAdmin(
                producto.nombre
              )}"
              onerror="this.src='imagenes/sistema/producto-sin-imagen.png'"
            >

            <div>

              <strong>
                ${escapeAdmin(
                  producto.nombre
                )}
              </strong>

              <span>
                ${escapeAdmin(
                  producto.categoria ||
                  ""
                )}
              </span>

            </div>

            <strong>
              ${Number(
                producto.stock
              ) || 0}
            </strong>

          </div>
        `).join("")
      : `
          <div class="empty-admin">
            Todo el inventario tiene buen stock.
          </div>
        `;
}

function obtenerEstadoPedido(pedido) {
  if (
    pedido.cancelado ||
    pedido.estado === "cancelado"
  ) {
    return "cancelado";
  }

  if (
    pedido.pagado ||
    pedido.estado === "pagado"
  ) {
    return "pagado";
  }

  if (
    pedido.preparado ||
    pedido.estado === "preparado"
  ) {
    return "preparado";
  }

  return "pendiente";
}

function renderizarPedidosAdmin() {
  const contenedor =
    document.getElementById(
      "lista-pedidos-admin"
    );

  let lista =
    [...pedidosAdmin];

  if (
    filtroPedidosAdmin !==
    "todos"
  ) {
    lista = lista.filter(
      pedido =>
        obtenerEstadoPedido(pedido) ===
        filtroPedidosAdmin
    );
  }

  if (!lista.length) {
    contenedor.innerHTML = `
      <div class="empty-admin">
        No hay pedidos en esta sección.
      </div>
    `;

    return;
  }

  contenedor.innerHTML =
    lista.map(pedido => {
      const productos =
        Array.isArray(
          pedido.productos
        )
          ? pedido.productos
          : [];

      const estado =
        obtenerEstadoPedido(
          pedido
        );

      return `
        <article class="admin-order-card">

          <div class="admin-order-head">

            <div>

              <span>PEDIDO</span>

              <strong>
                ${escapeAdmin(
                  pedido.folio ||
                  pedido.id
                )}
              </strong>

              <span>
                ${escapeAdmin(
                  pedido.cliente ||
                  "Cliente"
                )}
              </span>

              <span>
                ${escapeAdmin(
                  pedido.telefono ||
                  ""
                )}
              </span>

              <span>
                ${escapeAdmin(
                  pedido.metodoPago ||
                  ""
                )}
              </span>

            </div>

            <div class="admin-order-total">

              <span>
                ${estado}
              </span>

              <strong>
                ${monedaAdmin(
                  pedido.total
                )}
              </strong>

            </div>

          </div>

          <div class="admin-order-products">
            ${
              productos
                .map(
                  producto =>
                    `${Number(
                      producto.cantidad
                    ) || 1} × ${escapeAdmin(
                      producto.nombre
                    )}`
                )
                .join("<br>")
            }
          </div>

          ${
            pedido.notas
              ? `
                <div class="admin-order-products">
                  <strong>Notas:</strong><br>
                  ${escapeAdmin(pedido.notas)}
                </div>
              `
              : ""
          }

          <div class="admin-order-actions">

            ${
              estado === "pendiente"
                ? `
                  <button
                    class="order-action prepare"
                    onclick="marcarPreparado('${pedido.id}')"
                  >
                    Preparado
                  </button>
                `
                : ""
            }

            ${
              estado !== "pagado" &&
              estado !== "cancelado"
                ? `
                  <button
                    class="order-action pay"
                    onclick="marcarPagado('${pedido.id}')"
                  >
                    Pagado
                  </button>
                `
                : ""
            }

            ${
              estado !== "pagado" &&
              estado !== "cancelado"
                ? `
                  <button
                    class="order-action cancel"
                    onclick="cancelarPedido('${pedido.id}')"
                  >
                    Cancelar
                  </button>
                `
                : ""
            }

            ${
              estado === "pagado" ||
              estado === "cancelado"
                ? `
                  <button
                    class="order-action delete"
                    onclick="eliminarPedido('${pedido.id}')"
                  >
                    Eliminar
                  </button>
                `
                : ""
            }

          </div>

        </article>
      `;
    }).join("");
}

async function marcarPreparado(id) {
  try {
    await db
      .collection("recibos")
      .doc(id)
      .update({
        preparado: true,
        estado: "preparado",
        fechaPreparado:
          firebase.firestore
            .FieldValue
            .serverTimestamp()
      });

  } catch (error) {
    console.error(error);

    alert(
      "No se pudo actualizar el pedido."
    );
  }
}

async function marcarPagado(id) {
  try {
    await db
      .collection("recibos")
      .doc(id)
      .update({
        pagado: true,
        preparado: true,
        estado: "pagado",
        fechaPagado:
          firebase.firestore
            .FieldValue
            .serverTimestamp()
      });

  } catch (error) {
    console.error(error);

    alert(
      "No se pudo marcar como pagado."
    );
  }
}

async function cancelarPedido(id) {
  const pedido =
    pedidosAdmin.find(
      item => item.id === id
    );

  if (!pedido) {
    return;
  }

  if (
    pedido.pagado ||
    pedido.cancelado
  ) {
    return;
  }

  if (
    !confirm(
      "¿Cancelar este pedido? El stock regresará automáticamente."
    )
  ) {
    return;
  }

  try {
    await db.runTransaction(
      async transaction => {
        const pedidoRef =
          db
            .collection("recibos")
            .doc(id);

        const pedidoSnap =
          await transaction.get(
            pedidoRef
          );

        if (!pedidoSnap.exists) {
          throw new Error(
            "El pedido ya no existe."
          );
        }

        const pedidoActual =
          pedidoSnap.data();

        if (
          pedidoActual.cancelado ||
          pedidoActual.pagado
        ) {
          throw new Error(
            "Este pedido ya no puede cancelarse."
          );
        }

        const productos =
          Array.isArray(
            pedidoActual.productos
          )
            ? pedidoActual.productos
            : [];

        for (
          const item of productos
        ) {
          const productoRef =
            db
              .collection("productos")
              .doc(item.id);

          const productoSnap =
            await transaction.get(
              productoRef
            );

          if (!productoSnap.exists) {
            continue;
          }

          const stockActual =
            Number(
              productoSnap.data().stock
            ) || 0;

          transaction.update(
            productoRef,
            {
              stock:
                stockActual +
                Number(
                  item.cantidad || 0
                )
            }
          );
        }

        transaction.update(
          pedidoRef,
          {
            cancelado: true,
            estado: "cancelado",
            fechaCancelado:
              firebase.firestore
                .FieldValue
                .serverTimestamp()
          }
        );
      }
    );

  } catch (error) {
    console.error(error);

    alert(
      error.message ||
      "No se pudo cancelar el pedido."
    );
  }
}

async function eliminarPedido(id) {
  const pedido =
    pedidosAdmin.find(
      item => item.id === id
    );

  if (!pedido) {
    return;
  }

  const estado =
    obtenerEstadoPedido(
      pedido
    );

  if (
    estado !== "pagado" &&
    estado !== "cancelado"
  ) {
    alert(
      "Solo se pueden eliminar pedidos pagados o cancelados."
    );

    return;
  }

  if (
    !confirm(
      "¿Eliminar este pedido definitivamente?"
    )
  ) {
    return;
  }

  try {
    await db
      .collection("recibos")
      .doc(id)
      .delete();

  } catch (error) {
    console.error(error);

    alert(
      "No se pudo eliminar el pedido."
    );
  }
}

function obtenerFechaDescuento(valor) {
  if (!valor) {
    return null;
  }

  if (
    typeof valor.toDate ===
    "function"
  ) {
    return valor.toDate();
  }

  const fecha =
    new Date(valor);

  return Number.isNaN(
    fecha.getTime()
  )
    ? null
    : fecha;
}

function formatearFechaDescuento(valor) {
  const fecha =
    obtenerFechaDescuento(
      valor
    );

  if (!fecha) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(fecha);
}

function obtenerEstadoDescuento(descuento) {
  if (
    descuento.activo === false
  ) {
    return {
      texto: "Desactivado",
      clase: "disabled"
    };
  }

  const ahora =
    new Date();

  const inicio =
    obtenerFechaDescuento(
      descuento.fechaInicio
    );

  const fin =
    obtenerFechaDescuento(
      descuento.fechaFin
    );

  if (
    inicio &&
    ahora < inicio
  ) {
    return {
      texto: "Próximo",
      clase: "upcoming"
    };
  }

  if (
    fin &&
    ahora > fin
  ) {
    return {
      texto: "Finalizado",
      clase: "expired"
    };
  }

  return {
    texto: "Activo",
    clase: "active"
  };
}

function obtenerObjetivoDescuento(
  descuento
) {
  const productos =
    Array.isArray(
      descuento.productos
    )
      ? descuento.productos
      : [];

  const categorias =
    Array.isArray(
      descuento.categorias
    )
      ? descuento.categorias
      : [];

  if (productos.length) {
    const producto =
      productosAdmin.find(
        item =>
          item.id === productos[0]
      );

    return {
      tipo: "PRODUCTO",
      nombre:
        producto?.nombre ||
        "Producto"
    };
  }

  if (categorias.length) {
    return {
      tipo: "CATEGORÍA",
      nombre:
        categorias[0]
    };
  }

  if (descuento.categoria) {
    return {
      tipo: "CATEGORÍA",
      nombre:
        descuento.categoria
    };
  }

  return {
    tipo: "PROMOCIÓN",
    nombre: "General"
  };
}

function renderizarDescuentosAdmin() {
  const contenedor =
    document.getElementById(
      "lista-descuentos-admin"
    );

  if (!descuentosAdmin.length) {
    contenedor.innerHTML = `
      <div class="empty-admin">
        No hay descuentos registrados.
      </div>
    `;

    return;
  }

  const ordenados =
    [...descuentosAdmin]
      .sort((a, b) => {
        const fechaA =
          obtenerFechaDescuento(
            a.fechaFin
          );

        const fechaB =
          obtenerFechaDescuento(
            b.fechaFin
          );

        return (
          (fechaB?.getTime() || 0) -
          (fechaA?.getTime() || 0)
        );
      });

  contenedor.innerHTML =
    ordenados.map(descuento => {
      const estado =
        obtenerEstadoDescuento(
          descuento
        );

      const objetivo =
        obtenerObjetivoDescuento(
          descuento
        );

      return `
        <article class="discount-card">

          <div class="discount-card-top">

            <strong class="discount-percentage">
              ${Number(
                descuento.porcentaje
              ) || 0}%
            </strong>

            <span
              class="discount-status ${estado.clase}"
            >
              ${estado.texto}
            </span>

          </div>

          <div class="discount-target">

            <span>
              ${objetivo.tipo}
            </span>

            <strong>
              ${escapeAdmin(
                objetivo.nombre
              )}
            </strong>

          </div>

          <div class="discount-dates">

            <div class="discount-date-row">
              <span>Inicia</span>

              <strong>
                ${escapeAdmin(
                  formatearFechaDescuento(
                    descuento.fechaInicio
                  )
                )}
              </strong>
            </div>

            <div class="discount-date-row">
              <span>Finaliza</span>

              <strong>
                ${escapeAdmin(
                  formatearFechaDescuento(
                    descuento.fechaFin
                  )
                )}
              </strong>
            </div>

          </div>

          <div class="discount-actions">

            ${
              estado.clase !==
              "expired"
                ? `
                  <button
                    class="discount-action toggle"
                    onclick="alternarDescuento('${descuento.id}', ${descuento.activo !== false})"
                  >
                    ${
                      descuento.activo !== false
                        ? "Desactivar"
                        : "Activar"
                    }
                  </button>
                `
                : ""
            }

            <button
              class="discount-action delete"
              onclick="eliminarDescuento('${descuento.id}')"
            >
              Eliminar
            </button>

          </div>

        </article>
      `;
    }).join("");
}

async function guardarProductoFormulario(
  event
) {
  event.preventDefault();

  const id =
    document
      .getElementById(
        "producto-id"
      )
      .value
      .trim();

  const nombre =
    document
      .getElementById(
        "producto-nombre"
      )
      .value
      .trim();

  const categoria =
    document
      .getElementById(
        "producto-categoria"
      )
      .value
      .trim();

  const precio =
    Number(
      document
        .getElementById(
          "producto-precio"
        )
        .value
    );

  const stock =
    Number(
      document
        .getElementById(
          "producto-stock"
        )
        .value
    );

  const descripcion =
    document
      .getElementById(
        "producto-descripcion"
      )
      .value
      .trim();

  const botonGuardar =
    document.getElementById(
      "btn-guardar-producto"
    );

  const estadoSubida =
    document.getElementById(
      "upload-status"
    );

  if (
    !nombre ||
    !categoria ||
    !descripcion
  ) {
    alert(
      "Completa todos los campos."
    );

    return;
  }

  if (
    Number.isNaN(precio) ||
    precio < 0
  ) {
    alert(
      "Ingresa un precio válido."
    );

    return;
  }

  if (
    Number.isNaN(stock) ||
    stock < 0 ||
    !Number.isInteger(stock)
  ) {
    alert(
      "Ingresa un stock válido."
    );

    return;
  }

  if (
    typeof window
      .obtenerArchivoImagenSeleccionado !==
    "function"
  ) {
    alert(
      "Cloudinary no está disponible. Recarga la página."
    );

    return;
  }

  const archivoNuevo =
    window
      .obtenerArchivoImagenSeleccionado();

  if (
    !id &&
    !archivoNuevo
  ) {
    alert(
      "Adjunta una imagen para el producto."
    );

    return;
  }

  if (
    id &&
    !archivoNuevo &&
    !imagenProductoActual
  ) {
    alert(
      "Este producto necesita una imagen."
    );

    return;
  }

  botonGuardar.disabled =
    true;

  botonGuardar.textContent =
    archivoNuevo
      ? "Subiendo imagen..."
      : "Guardando...";

  try {
    let imagenFinal =
      imagenProductoActual;

    let publicIdFinal =
      "";

    if (id) {
      const productoAnterior =
        productosAdmin.find(
          item =>
            item.id === id
        );

      publicIdFinal =
        productoAnterior
          ?.cloudinaryPublicId ||
        "";
    }

    if (archivoNuevo) {
      if (
        typeof window
          .subirImagenCloudinary !==
        "function"
      ) {
        throw new Error(
          "No se pudo conectar con Cloudinary."
        );
      }

      estadoSubida.textContent =
        "Subiendo imagen...";

      botonGuardar.textContent =
        "Subiendo imagen...";

      const resultadoImagen =
        await window
          .subirImagenCloudinary(
            archivoNuevo
          );

      imagenFinal =
        resultadoImagen.url;

      publicIdFinal =
        resultadoImagen.publicId;

      estadoSubida.textContent =
        "Imagen subida correctamente.";

      botonGuardar.textContent =
        "Guardando producto...";
    }

    const datosProducto = {
      nombre,
      categoria,
      precio,
      stock,
      descripcion,
      imagen:
        imagenFinal,
      actualizadoEn:
        firebase.firestore
          .FieldValue
          .serverTimestamp()
    };

    if (publicIdFinal) {
      datosProducto
        .cloudinaryPublicId =
        publicIdFinal;
    }

    if (id) {
      await db
        .collection("productos")
        .doc(id)
        .update(
          datosProducto
        );

    } else {
      datosProducto.creadoEn =
        firebase.firestore
          .FieldValue
          .serverTimestamp();

      datosProducto.activo =
        true;

      await db
        .collection("productos")
        .add(
          datosProducto
        );
    }

    cerrarModalProducto();

    limpiarFormularioProducto();

  } catch (error) {
    console.error(error);

    estadoSubida.textContent =
      "No se pudo completar la operación.";

    alert(
      error.message ||
      "No se pudo guardar el producto."
    );

  } finally {
    botonGuardar.disabled =
      false;

    botonGuardar.textContent =
      "Guardar producto";
  }
}

auth.onAuthStateChanged(
  async user => {
    if (!user) {
      window.location.replace(
        "login.html"
      );

      return;
    }

    try {
      const usuarioSnap =
        await db
          .collection("usuarios")
          .doc(user.uid)
          .get();

      if (!usuarioSnap.exists) {
        await auth.signOut();

        window.location.replace(
          "login.html"
        );

        return;
      }

      const datosUsuario =
        usuarioSnap.data();

      const rol =
        String(
          datosUsuario.rol || ""
        )
          .trim()
          .toLowerCase();

      if (rol !== "admin") {
        window.location.replace(
          "index.html"
        );

        return;
      }

      document.getElementById(
        "correo-admin"
      ).textContent =
        user.email ||
        "Administrador";

    } catch (error) {
      console.error(error);

      await auth.signOut();

      window.location.replace(
        "login.html"
      );
    }
  }
);

db.collection("productos")
  .onSnapshot(
    snapshot => {
      productosAdmin =
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      renderizarProductosAdmin();
      renderizarDashboard();

    },
    error => {
      console.error(error);
    }
  );

db.collection("recibos")
  .orderBy("fecha", "desc")
  .onSnapshot(
    snapshot => {
      pedidosAdmin =
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      renderizarPedidosAdmin();
      renderizarDashboard();

    },
    error => {
      console.error(error);
    }
  );

db.collection("descuentos")
  .onSnapshot(
    snapshot => {
      descuentosAdmin =
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

      renderizarDescuentosAdmin();

    },
    error => {
      console.error(error);
    }
  );

document
  .querySelectorAll(
    ".nav-option"
  )
  .forEach(boton => {
    boton.addEventListener(
      "click",
      () => {
        cambiarSeccion(
          boton.dataset.section
        );
      }
    );
  });

document
  .querySelectorAll(
    "[data-go]"
  )
  .forEach(boton => {
    boton.addEventListener(
      "click",
      () => {
        cambiarSeccion(
          boton.dataset.go
        );
      }
    );
  });

document
  .getElementById(
    "btn-menu-admin"
  )
  ?.addEventListener(
    "click",
    abrirSidebar
  );

adminOverlay
  ?.addEventListener(
    "click",
    cerrarSidebar
  );

document
  .getElementById(
    "btn-cerrar-sesion"
  )
  ?.addEventListener(
    "click",
    async () => {
      await auth.signOut();

      window.location.href =
        "login.html";
    }
  );

document
  .getElementById(
    "btn-nuevo-producto"
  )
  ?.addEventListener(
    "click",
    () => {
      limpiarFormularioProducto();
      abrirModalProducto();
    }
  );

document
  .querySelectorAll(
    "[data-close-modal]"
  )
  .forEach(boton => {
    boton.addEventListener(
      "click",
      cerrarModalProducto
    );
  });

modalOverlay
  ?.addEventListener(
    "click",
    () => {
      cerrarModalProducto();
      cerrarModalDescuento();
    }
  );

document
  .getElementById(
    "buscar-producto-admin"
  )
  ?.addEventListener(
    "input",
    renderizarProductosAdmin
  );

document
  .getElementById(
    "filtro-stock-admin"
  )
  ?.addEventListener(
    "change",
    renderizarProductosAdmin
  );

document
  .querySelectorAll(
    ".order-tab"
  )
  .forEach(boton => {
    boton.addEventListener(
      "click",
      () => {
        document
          .querySelectorAll(
            ".order-tab"
          )
          .forEach(item =>
            item.classList.remove(
              "active"
            )
          );

        boton.classList.add(
          "active"
        );

        filtroPedidosAdmin =
          boton.dataset.estado;

        renderizarPedidosAdmin();
      }
    );
  });

document
  .getElementById(
    "form-producto"
  )
  ?.addEventListener(
    "submit",
    guardarProductoFormulario
  );

  const modalDescuento =
  document.getElementById(
    "modal-descuento"
  );

function obtenerCategoriasAdmin() {
  return [
    ...new Set(
      productosAdmin
        .map(
          producto =>
            String(
              producto.categoria ||
              ""
            ).trim()
        )
        .filter(Boolean)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        "es",
        {
          sensitivity: "base"
        }
      )
  );
}

function cargarOpcionesDescuento() {
  const selectProductos =
    document.getElementById(
      "descuento-producto"
    );

  const selectCategorias =
    document.getElementById(
      "descuento-categoria"
    );

  selectProductos.innerHTML = `
    <option value="">
      Selecciona un producto
    </option>

    ${productosAdmin
      .map(
        producto => `
          <option value="${producto.id}">
            ${escapeAdmin(producto.nombre)}
          </option>
        `
      )
      .join("")}
  `;

  const categorias =
    obtenerCategoriasAdmin();

  selectCategorias.innerHTML = `
    <option value="">
      Selecciona una categoría
    </option>

    ${categorias
      .map(
        categoria => `
          <option value="${escapeAdmin(categoria)}">
            ${escapeAdmin(categoria)}
          </option>
        `
      )
      .join("")}
  `;
}

function fechaLocalInput(
  fecha = new Date()
) {
  const offset =
    fecha.getTimezoneOffset();

  const local =
    new Date(
      fecha.getTime() -
      offset * 60000
    );

  return local
    .toISOString()
    .slice(0, 16);
}

function abrirModalDescuento() {
  document
    .getElementById(
      "form-descuento"
    )
    .reset();

  cargarOpcionesDescuento();

  document.getElementById(
    "grupo-descuento-producto"
  ).hidden = false;

  document.getElementById(
    "grupo-descuento-categoria"
  ).hidden = true;

  const ahora =
    new Date();

  const manana =
    new Date(
      ahora.getTime() +
      24 * 60 * 60 * 1000
    );

  document.getElementById(
    "descuento-inicio"
  ).value =
    fechaLocalInput(ahora);

  document.getElementById(
    "descuento-fin"
  ).value =
    fechaLocalInput(manana);

  actualizarPreviewDescuento();

  modalDescuento.classList.add(
    "active"
  );

  modalOverlay.classList.add(
    "active"
  );

  document.body.style.overflow =
    "hidden";
}

function cerrarModalDescuento() {
  modalDescuento.classList.remove(
    "active"
  );

  modalOverlay.classList.remove(
    "active"
  );

  document.body.style.overflow =
    "";
}

function actualizarTipoDescuento() {
  const tipo =
    document.querySelector(
      'input[name="tipo-descuento"]:checked'
    )?.value || "producto";

  document.getElementById(
    "grupo-descuento-producto"
  ).hidden =
    tipo !== "producto";

  document.getElementById(
    "grupo-descuento-categoria"
  ).hidden =
    tipo !== "categoria";

  actualizarPreviewDescuento();
}

function actualizarPreviewDescuento() {
  const preview =
    document.getElementById(
      "preview-descuento"
    );

  const tipo =
    document.querySelector(
      'input[name="tipo-descuento"]:checked'
    )?.value || "producto";

  const porcentaje =
    Number(
      document.getElementById(
        "descuento-porcentaje"
      ).value
    ) || 0;

  let objetivo =
    "";

  if (tipo === "producto") {
    const select =
      document.getElementById(
        "descuento-producto"
      );

    objetivo =
      select.options[
        select.selectedIndex
      ]?.text || "";
  } else {
    objetivo =
      document.getElementById(
        "descuento-categoria"
      ).value;
  }

  if (
    !porcentaje ||
    !objetivo ||
    objetivo.includes(
      "Selecciona"
    )
  ) {
    preview.innerHTML = `
      <i class="fa-solid fa-wand-magic-sparkles"></i>

      <div>
        <strong>
          Configura tu promoción
        </strong>

        <span>
          Aquí aparecerá un resumen antes de guardarla.
        </span>
      </div>
    `;

    return;
  }

  preview.innerHTML = `
    <i class="fa-solid fa-tag"></i>

    <div>
      <strong>
        ${porcentaje}% de descuento
      </strong>

      <span>
        Se aplicará a ${escapeAdmin(objetivo)} durante el periodo seleccionado.
      </span>
    </div>
  `;
}

async function guardarDescuentoAdmin(
  event
) {
  event.preventDefault();

  const tipo =
    document.querySelector(
      'input[name="tipo-descuento"]:checked'
    )?.value || "producto";

  const productoId =
    document.getElementById(
      "descuento-producto"
    ).value;

  const categoria =
    document.getElementById(
      "descuento-categoria"
    ).value;

  const porcentaje =
    Number(
      document.getElementById(
        "descuento-porcentaje"
      ).value
    );

  const inicioValor =
    document.getElementById(
      "descuento-inicio"
    ).value;

  const finValor =
    document.getElementById(
      "descuento-fin"
    ).value;

  if (
    tipo === "producto" &&
    !productoId
  ) {
    alert(
      "Selecciona un producto."
    );

    return;
  }

  if (
    tipo === "categoria" &&
    !categoria
  ) {
    alert(
      "Selecciona una categoría."
    );

    return;
  }

  if (
    !porcentaje ||
    porcentaje < 1 ||
    porcentaje > 100
  ) {
    alert(
      "El descuento debe estar entre 1% y 100%."
    );

    return;
  }

  if (
    !inicioValor ||
    !finValor
  ) {
    alert(
      "Selecciona las fechas de inicio y finalización."
    );

    return;
  }

  const inicio =
    new Date(inicioValor);

  const fin =
    new Date(finValor);

  if (
    fin.getTime() <=
    inicio.getTime()
  ) {
    alert(
      "La fecha de finalización debe ser posterior a la fecha de inicio."
    );

    return;
  }

  const boton =
    document.getElementById(
      "guardar-descuento"
    );

  boton.disabled = true;
  boton.textContent =
    "Guardando...";

  try {
    const datos = {
      porcentaje,
      fechaInicio:
        firebase.firestore
          .Timestamp
          .fromDate(inicio),
      fechaFin:
        firebase.firestore
          .Timestamp
          .fromDate(fin),
      activo: true,
      productos:
        tipo === "producto"
          ? [productoId]
          : [],
      categorias:
        tipo === "categoria"
          ? [categoria]
          : [],
      creadoEn:
        firebase.firestore
          .FieldValue
          .serverTimestamp()
    };

    await db
      .collection("descuentos")
      .add(datos);

    cerrarModalDescuento();

  } catch (error) {
    console.error(error);

    alert(
      "No se pudo crear el descuento."
    );

  } finally {
    boton.disabled = false;
    boton.textContent =
      "Crear descuento";
  }
}

async function alternarDescuento(
  id,
  actualmenteActivo
) {
  try {
    await db
      .collection("descuentos")
      .doc(id)
      .update({
        activo:
          !actualmenteActivo
      });

  } catch (error) {
    console.error(error);

    alert(
      "No se pudo actualizar el descuento."
    );
  }
}

async function eliminarDescuento(id) {
  if (
    !confirm(
      "¿Eliminar este descuento?"
    )
  ) {
    return;
  }

  try {
    await db
      .collection("descuentos")
      .doc(id)
      .delete();

  } catch (error) {
    console.error(error);

    alert(
      "No se pudo eliminar el descuento."
    );
  }
}

document
  .getElementById(
    "btn-nuevo-descuento"
  )
  ?.addEventListener(
    "click",
    abrirModalDescuento
  );

document
  .getElementById(
    "cerrar-modal-descuento"
  )
  ?.addEventListener(
    "click",
    cerrarModalDescuento
  );

document
  .getElementById(
    "cancelar-descuento"
  )
  ?.addEventListener(
    "click",
    cerrarModalDescuento
  );

document
  .querySelectorAll(
    'input[name="tipo-descuento"]'
  )
  .forEach(input => {
    input.addEventListener(
      "change",
      actualizarTipoDescuento
    );
  });

document
  .getElementById(
    "descuento-producto"
  )
  ?.addEventListener(
    "change",
    actualizarPreviewDescuento
  );

document
  .getElementById(
    "descuento-categoria"
  )
  ?.addEventListener(
    "change",
    actualizarPreviewDescuento
  );

document
  .getElementById(
    "descuento-porcentaje"
  )
  ?.addEventListener(
    "input",
    actualizarPreviewDescuento
  );

document
  .getElementById(
    "form-descuento"
  )
  ?.addEventListener(
    "submit",
    guardarDescuentoAdmin
  );

window.alternarDescuento =
  alternarDescuento;

window.eliminarDescuento =
  eliminarDescuento;

window.editarProductoAdmin =
  editarProductoAdmin;

window.eliminarProductoAdmin =
  eliminarProductoAdmin;

window.marcarPreparado =
  marcarPreparado;

window.marcarPagado =
  marcarPagado;

window.cancelarPedido =
  cancelarPedido;

window.eliminarPedido =
  eliminarPedido;