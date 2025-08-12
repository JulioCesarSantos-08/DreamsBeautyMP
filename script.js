/********************
  script.js completo
  - compatible con firebase compat
********************/

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables
let carrito = [];
let productos = [];
let productoCompraAhora = null; // para compra directa

/* ---------------- CARGA Y MOSTRAR PRODUCTOS ---------------- */
function cargarProductos() {
  const contenedor = document.getElementById("productos-container");
  const filtroSelect = document.getElementById("filtro-categoria");
  let categoriasSet = new Set();

  db.collection("productos").get().then(snapshot => {
    productos = [];
    contenedor.innerHTML = "";

    snapshot.forEach(doc => {
      const producto = doc.data();
      producto.id = doc.id;
      productos.push(producto);

      if (producto.categoria) categoriasSet.add(producto.categoria);
    });

    // llenar select categorias
    filtroSelect.innerHTML = `<option value="">Todas las categorías</option>`;
    categoriasSet.forEach(cat => {
      filtroSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });

    // mostrar productos
    mostrarProductos(productos);
  }).catch(err=>{
    console.error("Error al cargar productos:", err);
    document.getElementById("productos-container").innerHTML = "<p>Error cargando productos.</p>";
  });
}

function mostrarProductos(lista) {
  const contenedor = document.getElementById("productos-container");
  contenedor.innerHTML = "";

  if (!lista || lista.length === 0) {
    contenedor.innerHTML = `<p>No se encontraron productos.</p>`;
    return;
  }

  lista.forEach(producto => {
    const rutaImagen = `imagenes/${producto.imagen}`;
    const agotado = producto.stock <= 0;
    contenedor.innerHTML += `
      <div class="producto">
        <img src="${rutaImagen}" alt="${producto.nombre}" onclick="ampliarImagen('${rutaImagen}')">
        <h3>${producto.nombre}</h3>
        <p>${producto.descripcion || ''}</p>
        <p><strong>Stock:</strong> ${agotado ? '<span style="color:red;">AGOTADO</span>' : producto.stock}</p>
        <p><strong>Precio:</strong> $${producto.precio} MXN</p>
        <p class="categoria">Categoría: ${producto.categoria || 'Sin categoría'}</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button onclick="agregarAlCarrito('${escapeHtml(producto.nombre)}', ${Number(producto.precio)})" ${agotado ? 'disabled style="background:#ccc;"' : ''}>Agregar al carrito</button>
          <button onclick="abrirCompraAhora('${producto.id}')" style="background:#7cc1ff;" ${agotado ? 'disabled style="background:#ccc;"' : ''}>Comprar ahora</button>
        </div>
      </div>
    `;
  });
}

/* ---------------- FILTRADO ---------------- */
function filtrarProductos() {
  const texto = document.getElementById("buscador").value.toLowerCase();
  const categoria = document.getElementById("filtro-categoria").value;

  const filtrados = productos.filter(prod => {
    const nombre = (prod.nombre || "").toLowerCase();
    const coincideTexto = nombre.includes(texto);
    const coincideCategoria = categoria === "" || (prod.categoria === categoria);
    return coincideTexto && coincideCategoria;
  });

  mostrarProductos(filtrados);
}

/* ---------------- CARRITO ---------------- */
function agregarAlCarrito(nombre, precio) {
  carrito.push({ nombre, precio: Number(precio) });
  actualizarCarrito();
}

function actualizarCarrito() {
  const lista = document.getElementById("lista-carrito");
  const total = document.getElementById("total-carrito");
  const contador = document.getElementById("contador-carrito");

  lista.innerHTML = "";
  let suma = 0;
  carrito.forEach((item, index) => {
    lista.innerHTML += `<li>${escapeHtml(item.nombre)} - $${item.precio} 
      <button onclick="eliminarDelCarrito(${index})">❌</button></li>`;
    suma += Number(item.precio);
  });

  total.textContent = suma.toFixed(2);
  contador.textContent = carrito.length;
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

function vaciarCarrito() {
  carrito = [];
  actualizarCarrito();
}

/* Mostrar/Ocultar carrito */
document.getElementById("carrito-icono").addEventListener("click", () => {
  const carritoDiv = document.getElementById("carrito");
  carritoDiv.style.display = carritoDiv.style.display === "block" ? "none" : "block";
});

/* ---------------- MODAL IMAGEN ---------------- */
function ampliarImagen(src) {
  document.getElementById("modal-imagen").style.display = "block";
  document.getElementById("imagen-ampliada").src = src;
}
function cerrarModal() {
  document.getElementById("modal-imagen").style.display = "none";
}

/* ---------------- COMPRA DIRECTA (COMPRAR AHORA) ---------------- */
function abrirCompraAhora(productoId) {
  const prod = productos.find(p => p.id === productoId);
  if (!prod) {
    alert("Producto no encontrado.");
    return;
  }
  productoCompraAhora = prod;

  document.getElementById("modal-titulo").textContent = "Comprar ahora";
  document.getElementById("producto-seleccionado").innerHTML = `
    <strong>${escapeHtml(prod.nombre)}</strong><br>
    Precio: $${Number(prod.precio).toFixed(2)} MXN
  `;
  document.getElementById("nombre-usuario").value = "";
  document.getElementById("metodo-pago").value = "Efectivo";
  document.getElementById("form-compra").style.display = "block";
  document.getElementById("vista-recibo").style.display = "none";

  document.getElementById("modal-compra").style.display = "block";
}

function cerrarModalCompra() {
  document.getElementById("modal-compra").style.display = "none";
  productoCompraAhora = null;
}

/* Confirmar compra directa */
async function confirmarCompraAhora() {
  const nombreCliente = document.getElementById("nombre-usuario").value.trim();
  const metodoPago = document.getElementById("metodo-pago").value;

  if (!nombreCliente) {
    alert("Por favor ingresa tu nombre para generar el recibo.");
    return;
  }
  if (!productoCompraAhora) {
    alert("No hay producto seleccionado.");
    return;
  }
  if (productoCompraAhora.stock <= 0) {
    alert("Este producto está agotado.");
    return;
  }

  const recibo = {
    cliente: nombreCliente,
    metodoPago: metodoPago,
    items: [
      { nombre: productoCompraAhora.nombre, precio: Number(productoCompraAhora.precio), cantidad: 1 }
    ],
    total: Number(productoCompraAhora.precio),
    fecha: firebase.firestore.FieldValue.serverTimestamp(),
    origen: "compra_directa",
    entregado: false
  };

  try {
    await db.collection("recibos").add(recibo);
    await db.collection("productos").doc(productoCompraAhora.id).update({
      stock: firebase.firestore.FieldValue.increment(-1)
    });
    productoCompraAhora.stock -= 1;

    mostrarReciboImprimible("N/A", recibo);
    cargarProductos(); // recargar lista sin refresh
  } catch (err) {
    console.error("Error en la compra directa:", err);
    alert("Error al procesar la compra.");
  }
}

/* ---------------- FINALIZAR COMPRA (CARRITO) ---------------- */
async function finalizarCompra() {
  const nombreCliente = document.getElementById("nombre-cliente").value.trim();
  const metodoPago = document.getElementById("metodo-pago-carrito").value;

  if (!nombreCliente) {
    alert("Por favor ingresa tu nombre para el ticket.");
    return;
  }
  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const agrupado = {};
  carrito.forEach(it => {
    if (!agrupado[it.nombre]) agrupado[it.nombre] = { ...it, cantidad: 0 };
    agrupado[it.nombre].cantidad += 1;
  });

  const items = Object.values(agrupado);
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

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
    await db.collection("recibos").add(recibo);

    const batch = db.batch();
    items.forEach(item => {
      const prod = productos.find(p => p.nombre === item.nombre);
      if (prod) {
        batch.update(db.collection("productos").doc(prod.id), {
          stock: firebase.firestore.FieldValue.increment(-item.cantidad)
        });
        prod.stock -= item.cantidad;
      }
    });
    await batch.commit();

    carrito = [];
    actualizarCarrito();
    mostrarReciboImprimible("N/A", recibo);
    document.getElementById("modal-compra").style.display = "block";
    cargarProductos();
  } catch (err) {
    console.error("Error finalizando compra:", err);
    alert("Error al procesar la compra.");
  }
}

/* ---------------- RECIBO ---------------- */
function mostrarReciboImprimible(id, recibo) {
  const cont = document.getElementById("recibo-imprimible");
  const fecha = new Date();
  let itemsHtml = "";
  recibo.items.forEach(it => {
    itemsHtml += `<div style="display:flex; justify-content:space-between; margin:6px 0;">
      <div>${escapeHtml(it.nombre)} x${it.cantidad}</div>
      <div>$${Number(it.precio).toFixed(2)}</div>
    </div>`;
  });

  cont.innerHTML = `
    <div style="text-align:center; margin-bottom:8px;">
      <img src="imagenes/logo.png" alt="logo" style="height:40px;">
      <h3>Dreams Beauty</h3>
      <small>Recibo ID: ${id}</small>
    </div>
    <div><strong>Cliente:</strong> ${escapeHtml(recibo.cliente)}</div>
    <div><strong>Fecha:</strong> ${fecha.toLocaleString()}</div>
    <div style="margin-top:8px;"><strong>Items:</strong></div>
    ${itemsHtml}
    <hr>
    <div style="display:flex; justify-content:space-between;">
      <strong>Total</strong><strong>$${Number(recibo.total).toFixed(2)} MXN</strong>
    </div>
    <div style="margin-top:8px;"><small>Método: ${escapeHtml(recibo.metodoPago)}</small></div>
    <div style="margin-top:8px;"><small>Por favor captura la pantalla de este recibo.</small></div>
  `;

  document.getElementById("form-compra").style.display = "none";
  document.getElementById("vista-recibo").style.display = "block";
}

function imprimirRecibo() {
  const contenido = document.getElementById("recibo-imprimible").innerHTML;
  const ventana = window.open('', 'PRINT', 'height=600,width=800');
  ventana.document.write('<html><head><title>Recibo Dreams Beauty</title></head><body>');
  ventana.document.write(contenido);
  ventana.document.write('</body></html>');
  ventana.document.close();
  ventana.focus();
  ventana.print();
  ventana.close();
}

/* ---------------- UTILIDADES ---------------- */
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str.replaceAll('&','&amp;')
            .replaceAll('<','&lt;')
            .replaceAll('>','&gt;')
            .replaceAll('"','&quot;')
            .replaceAll("'",'&#39;');
}

/* ---------------- INICIO ---------------- */
cargarProductos();
actualizarCarrito();

window.addEventListener('click', function(e){
  if (e.target === document.getElementById('modal-imagen')) cerrarModal();
  if (e.target === document.getElementById('modal-compra')) cerrarModalCompra();
});