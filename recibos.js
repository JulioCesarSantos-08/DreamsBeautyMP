const db = firebase.firestore();
const listaRecibos = document.getElementById("lista-recibos");

function cargarRecibos() {
  db.collection("recibos").onSnapshot(snapshot => {
    listaRecibos.innerHTML = "";
    snapshot.forEach(doc => {
      const recibo = doc.data();
      const id = doc.id;

      listaRecibos.innerHTML += `
        <div class="recibo">
          <h3>${recibo.cliente}</h3>
          <p>Total: $${recibo.total} MXN</p>
          <p>Productos: ${recibo.productos.map(p => `${p.nombre} (x${p.cantidad})`).join(", ")}</p>
          
          <button class="${recibo.pagado ? 'btn-verde' : 'btn-rojo'}" 
            onclick="toggleEstado('${id}', 'pagado', ${recibo.pagado})">
            ${recibo.pagado ? 'Pagado' : 'No Pagado'}
          </button>

          <button class="${recibo.entregado ? 'btn-verde' : 'btn-rojo'}" 
            onclick="toggleEstado('${id}', 'entregado', ${recibo.entregado})">
            ${recibo.entregado ? 'Entregado' : 'No Entregado'}
          </button>

          <button class="btn-cancelar" onclick="cancelarCompra('${id}', ${JSON.stringify(recibo.productos).replace(/"/g, '&quot;')})">
            Cancelar Compra
          </button>

          <button class="btn-eliminar" onclick="eliminarRecibo('${id}')">
            Eliminar
          </button>
        </div>
      `;
    });
  });
}

// Cambiar estado (pagado / entregado)
function toggleEstado(id, campo, valorActual) {
  db.collection("recibos").doc(id).update({ [campo]: !valorActual });
}

// Cancelar compra (devuelve stock)
function cancelarCompra(id, productos) {
  productos.forEach(prod => {
    const refProducto = db.collection("productos").doc(prod.id);
    refProducto.update({
      stock: firebase.firestore.FieldValue.increment(prod.cantidad)
    });
  });
  db.collection("recibos").doc(id).update({ cancelado: true });
}

// Eliminar recibo
function eliminarRecibo(id) {
  db.collection("recibos").doc(id).delete();
}

cargarRecibos();