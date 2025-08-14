/********************
  descuentos.js
  - Compatible con Firebase compat
  - Aplicar descuentos por categoría o productos
  - Maneja fecha de expiración automática
********************/

// Inicializar Firebase (usa tu firebaseConfig ya definido en firebase-config.js)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let listaProductos = [];
let categorias = new Set();

// ====================
// Cargar productos y categorías
// ====================
async function cargarProductosYCategorias() {
  const contenedor = document.getElementById("lista-productos");
  contenedor.innerHTML = "Cargando productos...";

  try {
    const snapshot = await db.collection("productos").get();
    listaProductos = [];

    snapshot.forEach(doc => {
      const prod = doc.data();
      prod.id = doc.id;
      listaProductos.push(prod);
      if (prod.categoria) categorias.add(prod.categoria);
    });

    // Llenar select de categorías
    const categoriaSelect = document.getElementById("categoriaSelect");
    categoriaSelect.innerHTML = `<option value="">-- Seleccionar categoría --</option>`;
    categorias.forEach(cat => {
      categoriaSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });

    mostrarProductos(listaProductos);
  } catch (err) {
    console.error("Error cargando productos:", err);
    contenedor.innerHTML = "Error al cargar productos.";
  }
}

// ====================
// Mostrar productos
// ====================
function mostrarProductos(productos) {
  const contenedor = document.getElementById("lista-productos");
  contenedor.innerHTML = "";

  productos.forEach(prod => {
    contenedor.innerHTML += `
      <div class="producto-item">
        <img src="${prod.imagen}" alt="${prod.nombre}">
        <label>
          <input type="checkbox" value="${prod.id}">
          ${prod.nombre}
        </label>
      </div>
    `;
  });
}

// ====================
// Búsqueda en vivo
// ====================
document.getElementById("buscarProducto").addEventListener("input", e => {
  const texto = e.target.value.toLowerCase();
  const filtrados = listaProductos.filter(p =>
    p.nombre.toLowerCase().includes(texto)
  );
  mostrarProductos(filtrados);
});

// ====================
// Guardar descuentos
// ====================
async function guardarDescuentos() {
  const porcentaje = document.getElementById("porcentaje").value;
  const fechaInicio = document.getElementById("fechaInicio").value;
  const fechaFin = document.getElementById("fechaFin").value;
  const categoria = document.getElementById("categoriaSelect").value;

  if (!porcentaje || !fechaInicio || !fechaFin) {
    alert("Por favor completa todos los campos.");
    return;
  }

  // Obtener productos seleccionados
  const seleccionados = Array.from(
    document.querySelectorAll("#lista-productos input[type=checkbox]:checked")
  ).map(chk => chk.value);

  try {
    const descuento = {
      productos: seleccionados,
      categoria: categoria,
      porcentaje: Number(porcentaje),
      fechaInicio: firebase.firestore.Timestamp.fromDate(new Date(fechaInicio)),
      fechaFin: firebase.firestore.Timestamp.fromDate(new Date(fechaFin)),
      activo: true
    };

    await db.collection("descuentos").add(descuento);
    alert("Descuento guardado correctamente.");
  } catch (err) {
    console.error("Error guardando descuento:", err);
    alert("Error al guardar el descuento.");
  }
}

// ====================
// Limpiar descuentos expirados
// ====================
async function limpiarDescuentosExpirados() {
  const ahora = new Date();
  const snapshot = await db.collection("descuentos")
    .where("activo", "==", true)
    .get();

  const batch = db.batch();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.fechaFin && data.fechaFin.toDate() < ahora) {
      batch.update(doc.ref, { activo: false });
    }
  });

  await batch.commit();
}

// ====================
// Aplicar descuentos a productos
// ====================
async function aplicarDescuentos(productos) {
  await limpiarDescuentosExpirados();

  const snapshot = await db.collection("descuentos")
    .where("activo", "==", true)
    .get();

  if (snapshot.empty) return productos;

  const descuentos = snapshot.docs.map(d => d.data());

  return productos.map(prod => {
    let precioFinal = prod.precio;
    let tieneDescuento = false;
    let porcentaje = 0;

    descuentos.forEach(desc => {
      const matchProducto = desc.productos.includes(prod.id);
      const matchCategoria = desc.categoria && desc.categoria === prod.categoria;

      if (matchProducto || matchCategoria) {
        precioFinal = (precioFinal * (1 - desc.porcentaje / 100)).toFixed(2);
        tieneDescuento = true;
        porcentaje = desc.porcentaje;
      }
    });

    return {
      ...prod,
      precioFinal: Number(precioFinal),
      tieneDescuento,
      porcentaje
    };
  });
}

// ====================
// Eventos
// ====================
document.getElementById("btnGuardar").addEventListener("click", guardarDescuentos);

// ====================
// Inicializar
// ====================
cargarProductosYCategorias();