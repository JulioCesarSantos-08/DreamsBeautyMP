const db = firebase.firestore();
const tabla = document.getElementById("tabla-productos");
const btnVolver = document.getElementById("btn-volver");
const btnRecibos = document.getElementById("btn-recibos");
const inputBuscar = document.getElementById("buscar"); // buscador

// Modal
const modal = document.getElementById("modal-editar");
const cerrarModal = document.querySelector(".cerrar");
const formEditar = document.getElementById("form-editar");

let listaProductos = []; // almacenamos productos para buscador

// Abrir modal y cargar datos
function editarProducto(id, producto) {
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-nombre").value = producto.nombre;
  document.getElementById("edit-descripcion").value = producto.descripcion;
  document.getElementById("edit-stock").value = producto.stock;
  document.getElementById("edit-precio").value = producto.precio;
  document.getElementById("edit-imagen").value = producto.imagen;
  document.getElementById("edit-categoria").value = producto.categoria || "";

  modal.style.display = "block";
}

// Guardar cambios
formEditar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("edit-id").value;
  const nombre = document.getElementById("edit-nombre").value.trim();
  const descripcion = document.getElementById("edit-descripcion").value.trim();
  const stock = parseInt(document.getElementById("edit-stock").value);
  const precio = parseFloat(document.getElementById("edit-precio").value);
  const imagen = document.getElementById("edit-imagen").value.trim();
  const categoria = document.getElementById("edit-categoria").value.trim();

  try {
    await db.collection("productos").doc(id).update({
      nombre, descripcion, stock, precio, imagen, categoria
    });
    alert("✅ Producto actualizado");
    modal.style.display = "none";
  } catch (err) {
    console.error("❌ Error al actualizar:", err);
    alert("Hubo un error al actualizar el producto");
  }
});

// Cerrar modal
cerrarModal.onclick = () => modal.style.display = "none";
window.onclick = (event) => {
  if (event.target == modal) modal.style.display = "none";
};

// Botón Volver al Admin
btnVolver.addEventListener("click", () => {
  window.location.href = "admin.html";
});

// Botón Recibos
btnRecibos.addEventListener("click", () => {
  window.location.href = "recibos.html";
});

// Mostrar productos en tiempo real
db.collection("productos").onSnapshot(snapshot => {
  listaProductos = [];
  snapshot.forEach(doc => {
    listaProductos.push({ id: doc.id, ...doc.data() });
  });
  mostrarProductos(listaProductos);
});

// Función para renderizar productos
function mostrarProductos(productos) {
  tabla.innerHTML = "";
  productos.forEach(producto => {
    const fila = document.createElement("tr");

    // Recortamos la descripción
    const descripcionCorta = producto.descripcion.length > 15
      ? producto.descripcion.substring(0, 15) + "..."
      : producto.descripcion;

    fila.innerHTML = `
      <td><img src="${producto.imagen}" alt="${producto.nombre}" width="60"></td>
      <td>${producto.nombre}</td>
      <td>
        <span class="desc-texto">${descripcionCorta}</span>
        ${producto.descripcion.length > 15
          ? `<button class="ver-mas-btn" data-full="${producto.descripcion}">Ver más</button>`
          : ""}
      </td>
      <td>${producto.stock}</td>
      <td>$${producto.precio.toFixed(2)}</td>
      <td>${producto.categoria || ""}</td>
      <td>
        <button class="editar" onclick='editarProducto("${producto.id}", ${JSON.stringify(producto)})'>✏ Editar</button>
        <button class="eliminar" onclick="eliminarProducto('${producto.id}')">🗑 Eliminar</button>
      </td>
    `;
    tabla.appendChild(fila);
  });

  // Listener para ver más / ver menos
  document.querySelectorAll(".ver-mas-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      const span = this.previousElementSibling;
      if (this.textContent === "Ver más") {
        span.textContent = this.getAttribute("data-full");
        this.textContent = "Ver menos";
      } else {
        span.textContent = this.getAttribute("data-full").substring(0, 15) + "...";
        this.textContent = "Ver más";
      }
    });
  });
}

// Eliminar producto
function eliminarProducto(id) {
  if (confirm("¿Seguro que quieres eliminar este producto?")) {
    db.collection("productos").doc(id).delete()
      .then(() => alert("Producto eliminado"))
      .catch(err => console.error("❌ Error al eliminar:", err));
  }
}

// Buscador en tiempo real
inputBuscar.addEventListener("input", () => {
  const texto = inputBuscar.value.toLowerCase();
  const filtrados = listaProductos.filter(p =>
    p.nombre.toLowerCase().includes(texto)
  );
  mostrarProductos(filtrados);
});