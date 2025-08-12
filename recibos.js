const db = firebase.firestore();
const listaRecibos = document.getElementById("lista-recibos");

// Escuchar cambios en tiempo real
db.collection("recibos").orderBy("fecha", "desc").onSnapshot(snapshot => {
  listaRecibos.innerHTML = "";

  snapshot.forEach(doc => {
    const recibo = doc.data();
    const id = doc.id;

    const tarjeta = document.createElement("div");
    tarjeta.classList.add("recibo-card");

    tarjeta.innerHTML = `
      <h3>Recibo #${id.slice(-6).toUpperCase()}</h3>
      <p><strong>Cliente:</strong> ${recibo.cliente}</p>
      <p><strong>Total:</strong> $${recibo.total.toFixed(2)}</p>
      <p><strong>Fecha:</strong> ${new Date(recibo.fecha).toLocaleString()}</p>
      <div class="acciones">
        <button class="estado-btn ${recibo.pagado ? 'verde' : 'rojo'}" onclick="togglePagado('${id}', ${recibo.pagado})">
          ${recibo.pagado ? '✅ Pagado' : '❌ No Pagado'}
        </button>
        <button class="estado-btn ${recibo.entregado ? 'verde' : 'rojo'}" onclick="toggleEntregado('${id}', ${recibo.entregado})">
          ${recibo.entregado ? '📦 Entregado' : '📦 No Entregado'}
        </button>
        <button class="eliminar-btn" onclick="eliminarRecibo('${id}')">🗑 Eliminar</button>
      </div>
    `;

    listaRecibos.appendChild(tarjeta);
  });
});

// Cambiar estado pagado
function togglePagado(id, estadoActual) {
  db.collection("recibos").doc(id).update({
    pagado: !estadoActual
  }).catch(err => console.error("Error al actualizar pagado:", err));
}

// Cambiar estado entregado
function toggleEntregado(id, estadoActual) {
  db.collection("recibos").doc(id).update({
    entregado: !estadoActual
  }).catch(err => console.error("Error al actualizar entregado:", err));
}

// Eliminar recibo
function eliminarRecibo(id) {
  if (confirm("¿Seguro que quieres eliminar este recibo?")) {
    db.collection("recibos").doc(id).delete()
      .catch(err => console.error("Error al eliminar recibo:", err));
  }
}