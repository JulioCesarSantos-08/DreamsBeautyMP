const carritoPedido =
  typeof window.obtenerCarritoDreams === "function"
    ? window.obtenerCarritoDreams()
    : [];

const checkoutProductos =
  document.getElementById("checkout-productos");

const checkoutCantidad =
  document.getElementById("checkout-cantidad");

const checkoutResumenTotal =
  document.getElementById("checkout-resumen-total");

const finishTotal =
  document.getElementById("finish-total");

const btnConfirmarPedido =
  document.getElementById("btn-confirmar-pedido");

const orderLoader =
  document.getElementById("order-loader");

function monedaPedido(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(Number(valor) || 0);
}

function escapePedido(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function totalPedidoLocal() {
  return carritoPedido.reduce(
    (total, item) =>
      total +
      Number(item.precio || 0) *
      Number(item.cantidad || 0),
    0
  );
}

function cantidadPedidoLocal() {
  return carritoPedido.reduce(
    (total, item) =>
      total +
      Number(item.cantidad || 0),
    0
  );
}

function renderizarResumenPedido() {
  if (!carritoPedido.length) {
    window.location.href = "carrito.html";
    return;
  }

  checkoutProductos.innerHTML =
    carritoPedido.map(item => `
      <article class="checkout-product">

        <img
          src="${escapePedido(item.imagen)}"
          alt="${escapePedido(item.nombre)}"
        >

        <div class="checkout-product-info">
          <strong>
            ${escapePedido(item.nombre)}
          </strong>

          <span>
            ${Number(item.cantidad)} × ${monedaPedido(item.precio)}
          </span>
        </div>

        <div class="checkout-product-price">
          ${monedaPedido(
            Number(item.precio) *
            Number(item.cantidad)
          )}
        </div>

      </article>
    `).join("");

  const cantidad =
    cantidadPedidoLocal();

  const total =
    totalPedidoLocal();

  checkoutCantidad.textContent =
    cantidad;

  checkoutResumenTotal.textContent =
    monedaPedido(total);

  finishTotal.textContent =
    monedaPedido(total);
}

function obtenerMetodoPago() {
  return (
    document.querySelector(
      'input[name="metodo-pago"]:checked'
    )?.value || "Efectivo"
  );
}

function limpiarTelefono(valor) {
  return String(valor || "")
    .replace(/[^\d+]/g, "")
    .trim();
}

function validarDatosCliente() {
  const nombre =
    document
      .getElementById("nombre-cliente")
      .value
      .trim();

  const telefono =
    limpiarTelefono(
      document.getElementById(
        "telefono-cliente"
      ).value
    );

  if (nombre.length < 3) {
    alert(
      "Por favor ingresa tu nombre completo."
    );

    document
      .getElementById("nombre-cliente")
      .focus();

    return null;
  }

  if (telefono.length < 10) {
    alert(
      "Por favor ingresa un número de teléfono válido."
    );

    document
      .getElementById("telefono-cliente")
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
    ).padStart(2, "0");

  const dia =
    String(
      ahora.getDate()
    ).padStart(2, "0");

  const aleatorio =
    Math.floor(
      1000 + Math.random() * 9000
    );

  return `DC-${año}${mes}${dia}-${aleatorio}`;
}

async function verificarStockPedido() {
  const productosActualizados = [];

  for (const item of carritoPedido) {
    const doc =
      await db
        .collection("productos")
        .doc(item.id)
        .get();

    if (!doc.exists) {
      throw new Error(
        `El producto "${item.nombre}" ya no existe.`
      );
    }

    const producto = {
      id: doc.id,
      ...doc.data()
    };

    const stockActual =
      Number(producto.stock) || 0;

    if (
      stockActual <
      Number(item.cantidad)
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

  if (!carritoPedido.length) {
    alert(
      "Tu carrito está vacío."
    );

    window.location.href =
      "index.html";

    return;
  }

  btnConfirmarPedido.disabled =
    true;

  orderLoader.classList.add(
    "active"
  );

  try {
    const productosVerificados =
      await verificarStockPedido();

    const folio =
      generarFolioPedido();

    const notas =
      document
        .getElementById("notas-cliente")
        .value
        .trim();

    const metodoPago =
      obtenerMetodoPago();

    const total =
      totalPedidoLocal();

    const cantidadTotal =
      cantidadPedidoLocal();

    const pedidoRef =
      db.collection("recibos").doc();

    await db.runTransaction(
      async transaction => {
        const productosFinales = [];

        for (
          const item of productosVerificados
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
            throw new Error(
              `El producto "${item.nombre}" ya no está disponible.`
            );
          }

          const productoActual =
            productoSnap.data();

          const stockActual =
            Number(
              productoActual.stock
            ) || 0;

          const cantidad =
            Number(item.cantidad);

          if (
            stockActual <
            cantidad
          ) {
            throw new Error(
              `No hay suficientes unidades de "${item.nombre}".`
            );
          }

          transaction.update(
            productoRef,
            {
              stock:
                stockActual -
                cantidad
            }
          );

          productosFinales.push({
            id: item.id,
            nombre: item.nombre,
            categoria:
              item.categoria || "",
            imagen:
              item.imagen || "",
            cantidad,
            precio:
              Number(item.precio),
            subtotal:
              Number(item.precio) *
              cantidad
          });
        }

        transaction.set(
          pedidoRef,
          {
            folio,
            cliente:
              cliente.nombre,
            telefono:
              cliente.telefono,
            notas,
            metodoPago,
            productos:
              productosFinales,
            total,
            cantidadProductos:
              cantidadTotal,
            estado:
              "pendiente",
            preparado:
              false,
            pagado:
              false,
            cancelado:
              false,
            fecha:
              firebase.firestore.FieldValue.serverTimestamp(),
            fechaCreacion:
              new Date().toISOString()
          }
        );
      }
    );

    localStorage.setItem(
      "dreamsUltimoPedido",
      JSON.stringify({
        id: pedidoRef.id,
        folio
      })
    );

    window.vaciarCarrito();

    window.location.href =
      `recibo.html?id=${encodeURIComponent(
        pedidoRef.id
      )}`;

  } catch (error) {
    console.error(error);

    alert(
      error.message ||
      "No pudimos crear el pedido. Intenta nuevamente."
    );

    btnConfirmarPedido.disabled =
      false;

    orderLoader.classList.remove(
      "active"
    );
  }
}

document
  .getElementById("btn-volver")
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