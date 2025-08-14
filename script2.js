/********************
  script2.js
  - Compra directa (abrirCompraAhora, confirmarCompraAhora)
  - Cerrar modal compra
  - Finalizar compra (desde carrito)
  - Recibo imprimible + imprimir
  - Depende de: firebase + firestore ya inicializados, y de variables globales
    definidas en script.js (db, productos, descuentos, carrito, escapeHtml, etc.)
********************/

// NOTA: Firebase YA debe estar inicializado en index.html
// Este archivo usa: db, productos, descuentos, carrito, productoCompraAhora,
// actualizarCarrito(), cargarProductos(), escapeHtml()

/* ---------------- COMPRA DIRECTA ---------------- */
function abrirCompraAhora(productoId) {
  const prod = (Array.isArray(productos) ? productos : []).find(p => p.id === productoId);
  if (!prod) {
    alert("Producto no encontrado.");
    return;
  }
  // Guardamos producto seleccionado en global (definida en script.js)
  productoCompraAhora = prod;

  // Calcular precio con descuento si aplica (usa array global 'descuentos')
  let precioFinal = Number(prod.precio);
  (Array.isArray(descuentos) ? descuentos : []).forEach(desc => {
    const aplica =
      (desc.productos && desc.productos.includes(prod.id)) ||
      (desc.categorias && desc.categorias.includes(prod.categoria));
    if (aplica) {
      precioFinal = precioFinal - (precioFinal * (desc.porcentaje / 100));
    }
  });

  // Pintar modal de compra
  const tituloEl = document.getElementById("modal-titulo");
  const prodSelEl = document.getElementById("producto-seleccionado");
  const formCompraEl = document.getElementById("form-compra");
  const vistaReciboEl = document.getElementById("vista-recibo");

  if (tituloEl) tituloEl.textContent = "Comprar ahora";
  if (prodSelEl) {
    prodSelEl.innerHTML = `
      <strong>${escapeHtml(String(prod.nombre))}</strong><br>
      Precio: $${precioFinal.toFixed(2)} MXN
    `;
  }

  const nombreUsuarioEl = document.getElementById("nombre-usuario");
  const metodoPagoEl = document.getElementById("metodo-pago");
  if (nombreUsuarioEl) nombreUsuarioEl.value = "";
  if (metodoPagoEl) metodoPagoEl.value = "Efectivo";

  if (formCompraEl) formCompraEl.style.display = "block";
  if (vistaReciboEl) vistaReciboEl.style.display = "none";

  const modal = document.getElementById("modal-compra");
  if (modal) modal.style.display = "block";
}

function cerrarModalCompra() {
  const modal = document.getElementById("modal-compra");
  if (modal) modal.style.display = "none";
  // Limpia selección
  if (typeof productoCompraAhora !== "undefined") {
    productoCompraAhora = null;
  }
}

/* Confirmar compra directa */
async function confirmarCompraAhora() {
  const nombreCliente = (document.getElementById("nombre-usuario")?.value || "").trim();
  const metodoPago = document.getElementById("metodo-pago")?.value || "Efectivo";

  if (!nombreCliente) {
    alert("Por favor ingresa tu nombre para generar el recibo.");
    return;
  }
  if (!productoCompraAhora) {
    alert("No hay producto seleccionado.");
    return;
  }
  if (Number(productoCompraAhora.stock) <= 0) {
    alert("Este producto está agotado.");
    return;
  }

  // Calcula precio final con descuento (igual que en abrirCompraAhora)
  let precioFinal = Number(productoCompraAhora.precio);
  (Array.isArray(descuentos) ? descuentos : []).forEach(desc => {
    const aplica =
      (desc.productos && desc.productos.includes(productoCompraAhora.id)) ||
      (desc.categorias && desc.categorias.includes(productoCompraAhora.categoria));
    if (aplica) {
      precioFinal = precioFinal - (precioFinal * (desc.porcentaje / 100));
    }
  });

  const recibo = {
    cliente: nombreCliente,
    metodoPago: metodoPago,
    items: [
      { nombre: productoCompraAhora.nombre, precio: Number(precioFinal), cantidad: 1 }
    ],
    total: Number(precioFinal),
    fecha: firebase.firestore.FieldValue.serverTimestamp(),
    origen: "compra_directa",
    entregado: false
  };

  try {
    // Guarda recibo y actualiza stock
    const docRef = await db.collection("recibos").add(recibo);
    await db.collection("productos").doc(productoCompraAhora.id).update({
      stock: firebase.firestore.FieldValue.increment(-1)
    });
    // Reflejar en memoria
    productoCompraAhora.stock = Number(productoCompraAhora.stock) - 1;

    mostrarReciboImprimible(docRef.id, recibo);
    // Opcional: recargar productos para reflejar stock
    if (typeof cargarProductos === "function") cargarProductos();
  } catch (err) {
    console.error("Error en la compra directa:", err);
    alert("Error al procesar la compra.");
  }
}

/* ---------------- FINALIZAR COMPRA (CARRITO) ---------------- */
async function finalizarCompra() {
  const nombreCliente = (document.getElementById("nombre-cliente")?.value || "").trim();
  const metodoPago = document.getElementById("metodo-pago-carrito")?.value || "Efectivo";

  if (!nombreCliente) {
    alert("Por favor ingresa tu nombre para el ticket.");
    return;
  }
  if (!Array.isArray(carrito) || carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  // Agrupar por nombre y calcular cantidades
  const agrupado = {};
  carrito.forEach(it => {
    if (!agrupado[it.nombre]) agrupado[it.nombre] = { ...it, cantidad: 0 };
    agrupado[it.nombre].cantidad += 1;
  });

  const items = Object.values(agrupado);
  const total = items.reduce((s, i) => s + Number(i.precio) * Number(i.cantidad), 0);

  const recibo = {
    cliente: nombreCliente,
    metodoPago: metodoPago,
    items,
    total,
    fecha: firebase.firestore.FieldValue.serverTimestamp(),
    origen: "carrito",
    entregado: false
  };

  try {
    const docRef = await db.collection("recibos").add(recibo);

    // Descontar existencias con batch
    const batch = db.batch();
    items.forEach(item => {
      // Buscar producto por nombre
      const prod = (Array.isArray(productos) ? productos : []).find(p => p.nombre === item.nombre);
      if (prod?.id) {
        const ref = db.collection("productos").doc(prod.id);
        batch.update(ref, {
          stock: firebase.firestore.FieldValue.increment(-Number(item.cantidad))
        });
        // Reflejo local
        prod.stock = Number(prod.stock) - Number(item.cantidad);
      }
    });
    await batch.commit();

    // Vaciar carrito y actualizar UI
    carrito.length = 0;
    if (typeof actualizarCarrito === "function") actualizarCarrito();

    // Mostrar recibo en el modal de compra
    mostrarReciboImprimible(docRef.id, recibo);
    const modal = document.getElementById("modal-compra");
    if (modal) modal.style.display = "block";

    // Refrescar productos
    if (typeof cargarProductos === "function") cargarProductos();
  } catch (err) {
    console.error("Error finalizando compra:", err);
    alert("Error al procesar la compra.");
  }
}

/* ---------------- RECIBO ---------------- */
function mostrarReciboImprimible(id, recibo) {
  const cont = document.getElementById("recibo-imprimible");
  if (!cont) return;

  const fecha = new Date();

  let itemsHtml = "";
  (recibo.items || []).forEach(it => {
    itemsHtml += `<div style="display:flex; justify-content:space-between; margin:6px 0;">
      <div>${escapeHtml(it.nombre)} x${Number(it.cantidad)}</div>
      <div>$${Number(it.precio).toFixed(2)}</div>
    </div>`;
  });

  cont.innerHTML = `
    <div style="text-align:center; margin-bottom:8px;">
      <img src="imagenes/logo.png" alt="logo" style="height:40px;">
      <h3>Dreams Beauty</h3>
      <small>Recibo ID: ${escapeHtml(String(id || "N/A"))}</small>
    </div>
    <div><strong>Cliente:</strong> ${escapeHtml(recibo.cliente || "")}</div>
    <div><strong>Fecha:</strong> ${fecha.toLocaleString()}</div>
    <div style="margin-top:8px;"><strong>Items:</strong></div>
    ${itemsHtml}
    <hr>
    <div style="display:flex; justify-content:space-between;">
      <strong>Total</strong><strong>$${Number(recibo.total || 0).toFixed(2)} MXN</strong>
    </div>
    <div style="margin-top:8px;"><small>Método: ${escapeHtml(recibo.metodoPago || "")}</small></div>
    <div style="margin-top:8px;"><small>Por favor captura o imprime este recibo.</small></div>
  `;

  const formCompraEl = document.getElementById("form-compra");
  const vistaReciboEl = document.getElementById("vista-recibo");
  if (formCompraEl) formCompraEl.style.display = "none";
  if (vistaReciboEl) vistaReciboEl.style.display = "block";
}

function imprimirRecibo() {
  const cont = document.getElementById("recibo-imprimible");
  if (!cont) return;

  const ventana = window.open('', 'PRINT', 'height=600,width=800');
  ventana.document.write('<html><head><title>Recibo Dreams Beauty</title></head><body>');
  ventana.document.write(cont.innerHTML);
  ventana.document.write('</body></html>');
  ventana.document.close();
  ventana.focus();
  ventana.print();
  ventana.close();
}