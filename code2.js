/********************
  script.js actualizado
  - compatible con firebase compat
  - ampliación de imagen
  - ver más / ver menos (25 caracteres, botones pequeños) SIN inyectar texto en onclick
  - soporte para mostrar descuentos activos
********************/

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables
let carrito = [];
let productos = [];
let descuentos = [];
let productoCompraAhora = null;

const DESC_PREVIEW = 25; // caracteres visibles por defecto

/* ---------------- CARGA Y MOSTRAR PRODUCTOS ---------------- */
async function cargarProductos() {
  const contenedor = document.getElementById("productos-container");
  const filtroSelect = document.getElementById("filtro-categoria");
  let categoriasSet = new Set();

  try {
    // Obtener descuentos activos
    const ahora = Date.now();
    const snapDescuentos = await db.collection("descuentos").get();
    descuentos = snapDescuentos.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => {
        return d.fechaFin && d.fechaFin.toMillis() > ahora;
      });

    // Obtener productos
    const snapProductos = await db.collection("productos").get();
    productos = [];
    contenedor.innerHTML = "";

    snapProductos.forEach(doc => {
      const producto = doc.data();
      producto.id = doc.id;
      productos.push(producto);
      if (producto.categoria) categoriasSet.add(producto.categoria);
    });

    filtroSelect.innerHTML = `<option value="">Todas las categorías</option>`;
    categoriasSet.forEach(cat => {
      filtroSelect.innerHTML += `<option value="${escapeHtml(String(cat))}">${escapeHtml(String(cat))}</option>`;
    });

    mostrarProductos(productos);
  } catch (err) {
    console.error("Error al cargar productos:", err);
    contenedor.innerHTML = "<p>Error cargando productos.</p>";
  }
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
    const descripcion = String(producto.descripcion || '');
    const descripcionCorta = descripcion.length > DESC_PREVIEW
      ? descripcion.slice(0, DESC_PREVIEW) + '...'
      : descripcion;

    const descCodificada = encodeURIComponent(descripcion);

    const verMasBtn = descripcion.length > DESC_PREVIEW
      ? `<button class="ver-mas" 
                  data-id="${producto.id}" 
                  data-desc="${descCodificada}" 
                  onclick="toggleDescripcion(this)" 
                  style="font-size:11px; padding:2px 5px; margin-top:2px;">
           Ver más
         </button>`
      : '';

    // Calcular si hay descuento activo
    let precioOriginal = Number(producto.precio);
    let precioFinal = precioOriginal;
    let descuentoAplicado = null;

    // Buscar si hay un descuento para este producto o su categoría
    descuentos.forEach(desc => {
      if (
        (desc.productos && desc.productos.includes(producto.id)) ||
        (desc.categorias && desc.categorias.includes(producto.categoria))
      ) {
        precioFinal = precioOriginal - (precioOriginal * (desc.porcentaje / 100));
        descuentoAplicado = desc;
      }
    });

    contenedor.innerHTML += `
      <div class="producto">
        <img src="${rutaImagen}" alt="${escapeHtml(String(producto.nombre))}" onclick="ampliarImagen('${rutaImagen}')">
        <h3>${escapeHtml(String(producto.nombre))}</h3>
        <p class="categoria">Categoría: ${escapeHtml(String(producto.categoria || 'Sin categoría'))}</p>

        <p id="desc-${producto.id}" class="descripcion">
          ${escapeHtml(descripcionCorta)}
        </p>
        ${verMasBtn}

        <p><strong>Stock:</strong> ${agotado ? '<span style="color:red;">AGOTADO</span>' : Number(producto.stock)}</p>
        
        ${
          descuentoAplicado
            ? `<p><strong>Precio:</strong> <span style="text-decoration:line-through;color:red;">$${precioOriginal.toFixed(2)}</span> 
                <span style="color:green;font-weight:bold;">$${precioFinal.toFixed(2)} MXN</span>
                <br><small>${descuentoAplicado.porcentaje}% de descuento</small></p>`
            : `<p><strong>Precio:</strong> $${precioOriginal.toFixed(2)} MXN</p>`
        }

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button onclick="agregarAlCarrito('${escapeHtml(String(producto.nombre))}', ${precioFinal.toFixed(2)})" ${agotado ? 'disabled style="background:#ccc;"' : ''}>Agregar al carrito</button>
          <button onclick="abrirCompraAhora('${producto.id}')" style="background:#7cc1ff;" ${agotado ? 'disabled style="background:#ccc;"' : ''}>Comprar ahora</button>
        </div>
      </div>
    `;
  });
}

/* ---------------- VER MÁS / VER MENOS ---------------- */
function toggleDescripcion(btnEl) {
  const id = btnEl.dataset.id;
  const p = document.getElementById(`desc-${id}`);
  if (!p) return;

  const textoCompleto = decodeURIComponent(btnEl.dataset.desc || "");
  const estaAbierto = btnEl.textContent.trim().toLowerCase() === "ver menos";

  if (estaAbierto) {
    p.textContent = textoCompleto.slice(0, DESC_PREVIEW) + (textoCompleto.length > DESC_PREVIEW ? "..." : "");
    btnEl.textContent = "Ver más";
  } else {
    p.textContent = textoCompleto;
    btnEl.textContent = "Ver menos";
  }
}

/* ---------------- FILTRADO ---------------- */
function filtrarProductos() {
  const texto = document.getElementById("buscador").value.toLowerCase();
  const categoria = document.getElementById("filtro-categoria").value;

  const filtrados = productos.filter(prod => {
    const nombre = (prod.nombre || "").toLowerCase();
    const coincideTexto = nombre.includes(texto);
    const coincideCategoria = categoria === "" || (String(prod.categoria) === String(categoria));
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

/* ---------------- COMPRA DIRECTA ---------------- */
function abrirCompraAhora(productoId) {
  const prod = productos.find(p => p.id === productoId);
  if (!prod) {
    alert("Producto no encontrado.");
    return;
  }
  productoCompraAhora = prod;

  // Calcular precio con descuento si aplica
  let precioFinal = Number(prod.precio);
  descuentos.forEach(desc => {
    if (
      (desc.productos && desc.productos.includes(prod.id)) ||
      (desc.categorias && desc.categorias.includes(prod.categoria))
    ) {
      precioFinal = precioFinal - (precioFinal * (desc.porcentaje / 100));
    }
  });

  document.getElementById("modal-titulo").textContent = "Comprar ahora";
  document.getElementById("producto-seleccionado").innerHTML = `
    <strong>${escapeHtml(String(prod.nombre))}</strong><br>
    Precio: $${precioFinal.toFixed(2)} MXN
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

/* ---------------- UTILIDADES ---------------- */
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replaceAll('&','&amp;')
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