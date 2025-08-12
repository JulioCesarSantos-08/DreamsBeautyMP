const db = firebase.firestore();
const tabla = document.getElementById("tabla-productos");
const btnVolver = document.getElementById("btn-volver");
const btnRecibos = document.getElementById("btn-recibos");

// Modal
const modal = document.getElementById("modal-editar");
const cerrarModal = document.querySelector(".cerrar");
const formEditar = document.getElementById("form-editar");

// Abrir modal y cargar datos
function editarProducto(id, producto) {
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-nombre").value = producto.nombre;
  document.getElementById("edit-descripcion").value = producto.descripcion;
  document.getElementById("edit-stock").value = producto.stock;
  document.getElementById("edit-precio").value = producto.precio;
  document.getElementById("edit-imagen").value = producto.imagen;

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

  try {
    await db.collection("productos").doc(id).update({
      nombre, descripcion, stock, precio, imagen
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
  tabla.innerHTML = "";
  snapshot.forEach(doc => {
    const producto = doc.data();
    const id = doc.id;

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td><img src="${producto.imagen}" alt="${producto.nombre}" width="60"></td>
      <td>${producto.nombre}</td>
      <td>${producto.descripcion}</td>
      <td>${producto.stock}</td>
      <td>$${producto.precio.toFixed(2)}</td>
      <td>
        <button class="editar" onclick='editarProducto("${id}", ${JSON.stringify(producto)})'>✏ Editar</button>
        <button class="eliminar" onclick="eliminarProducto('${id}')">🗑 Eliminar</button>
      </td>
    `;
    tabla.appendChild(fila);
  });
});

// Eliminar producto
function eliminarProducto(id) {
  if (confirm("¿Seguro que quieres eliminar este producto?")) {
    db.collection("productos").doc(id).delete()
      .then(() => alert("Producto eliminado"))
      .catch(err => console.error("❌ Error al eliminar:", err));
  }
}