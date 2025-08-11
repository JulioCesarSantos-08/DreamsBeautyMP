// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables
let carrito = [];

// Mostrar productos desde Firebase
function cargarProductos() {
  const contenedor = document.getElementById("productos-container");
  db.collection("productos").get().then(snapshot => {
    contenedor.innerHTML = "";
    snapshot.forEach(doc => {
      const producto = doc.data();
      contenedor.innerHTML += `
        <div class="producto">
          <img src="${producto.imagen}" alt="${producto.nombre}" onclick="ampliarImagen('${producto.imagen}')">
          <h3>${producto.nombre}</h3>
          <p>${producto.descripcion}</p>
          <p><strong>Stock:</strong> ${producto.stock}</p>
          <p><strong>Precio:</strong> $${producto.precio} MXN</p>
          <button onclick="agregarAlCarrito('${producto.nombre}', ${producto.precio})">Agregar al carrito</button>
        </div>
      `;
    });
  });
}

// Agregar al carrito
function agregarAlCarrito(nombre, precio) {
  carrito.push({ nombre, precio });
  actualizarCarrito();
}

// Actualizar carrito
function actualizarCarrito() {
  const lista = document.getElementById("lista-carrito");
  const total = document.getElementById("total-carrito");
  const contador = document.getElementById("contador-carrito");

  lista.innerHTML = "";
  let suma = 0;
  carrito.forEach((item, index) => {
    lista.innerHTML += `<li>${item.nombre} - $${item.precio} 
      <button onclick="eliminarDelCarrito(${index})">❌</button></li>`;
    suma += item.precio;
  });

  total.textContent = suma;
  contador.textContent = carrito.length;
}

// Eliminar del carrito
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

// Vaciar carrito
function vaciarCarrito() {
  carrito = [];
  actualizarCarrito();
}

// Mostrar/Ocultar carrito
document.getElementById("carrito-icono").addEventListener("click", () => {
  const carritoDiv = document.getElementById("carrito");
  carritoDiv.style.display = carritoDiv.style.display === "block" ? "none" : "block";
});

// Modal de imagen
function ampliarImagen(src) {
  document.getElementById("modal-imagen").style.display = "block";
  document.getElementById("imagen-ampliada").src = src;
}
function cerrarModal() {
  document.getElementById("modal-imagen").style.display = "none";
}

// Cargar al inicio
cargarProductos();