const firebaseConfig = {
  apiKey: "AIzaSyA9t21iW6BnWe-c67CtMsk8V5j7j4MBb70",
  authDomain: "dreamsbeautiy.firebaseapp.com",
  projectId: "dreamsbeautiy",
  storageBucket: "dreamsbeautiy.firebasestorage.app",
  messagingSenderId: "1034221935895",
  appId: "1:1034221935895:web:e1c7f71d18711a62452b52"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const listaRecibos = document.getElementById("lista-recibos");

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;");
}

function cargarRecibos() {
  db.collection("recibos").orderBy("fecha", "desc").onSnapshot(snapshot => {
    listaRecibos.innerHTML = "";
    if (snapshot.empty) {
      listaRecibos.innerHTML = "<p>No hay recibos guardados.</p>";
      return;
    }
    snapshot.forEach(doc => {
      const r = doc.data();
      const id = doc.id;
      const fecha = r.fecha && r.fecha.toDate ? r.fecha.toDate().toLocaleString() : " — ";
      const productos = r.productos || r.items || [];

      let filasProductos = productos.map(p => `
        <tr>
          <td>${escapeHtml(p.nombre)}</td>
          <td>${p.cantidad || 1}</td>
          <td>$${Number(p.precio || 0).toFixed(2)}</td>
        </tr>
      `).join("");

      listaRecibos.innerHTML += `
        <table>
          <thead>
            <tr>
              <th colspan="3">
                <strong>ID:</strong> ${id} <br>
                <strong>Cliente:</strong> ${escapeHtml(r.cliente || "")} <br>
                <small>${fecha}</small>
              </th>
            </tr>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            ${filasProductos}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3"><strong>Total:</strong> $${Number(r.total || 0).toFixed(2)} MXN</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align:center; padding-top:8px;">
                <button class="${r.pagado ? 'btn-verde' : 'btn-rojo'}" 
                  onclick="toggleEstado('${id}', 'pagado', ${r.pagado || false})">
                  ${r.pagado ? 'Pagado' : 'No Pagado'}
                </button>
                <button class="${r.entregado ? 'btn-verde' : 'btn-rojo'}" 
                  onclick="toggleEstado('${id}', 'entregado', ${r.entregado || false})">
                  ${r.entregado ? 'Entregado' : 'No Entregado'}
                </button>
                <button class="${r.destacado ? 'btn-verde' : 'btn-rojo'}" 
                  onclick="toggleEstado('${id}', 'destacado', ${r.destacado || false})">
                  ${r.destacado ? 'Destacado' : 'No Destacado'}
                </button>
                <button class="btn-cancelar" onclick='cancelarCompra("${id}", ${JSON.stringify(productos ? productos : [])})'>
                  Cancelar Compra
                </button>
                <button class="btn-eliminar" onclick="eliminarRecibo('${id}')">
                  Eliminar
                </button>
                <button onclick="verRecibo('${id}')">Ver / Imprimir</button>
              </td>
            </tr>
          </tfoot>
        </table>
      `;
    });
  });
}

function toggleEstado(id, campo, valorActual) {
  db.collection("recibos").doc(id).update({ [campo]: !valorActual });
}

function cancelarCompra(id, productos) {
  if (!confirm("¿Seguro que quieres cancelar esta compra? Esto devolverá el stock y eliminará el recibo.")) return;

  if (!Array.isArray(productos)) productos = [];

  const batch = db.batch();
  productos.forEach(prod => {
    if (!prod.id) return;
    const refProducto = db.collection("productos").doc(prod.id);
    batch.update(refProducto, {
      stock: firebase.firestore.FieldValue.increment(prod.cantidad || 1)
    });
  });

  const reciboRef = db.collection("recibos").doc(id);
  batch.delete(reciboRef);

  batch.commit()
    .then(() => alert("Compra cancelada y stock devuelto correctamente"))
    .catch(e => console.error("Error al cancelar compra:", e));
}

function eliminarRecibo(id) {
  if (!confirm("¿Eliminar este recibo? Esta acción no se puede deshacer.")) return;
  db.collection("recibos").doc(id).delete();
}

function verRecibo(id) {
  db.collection("recibos").doc(id).get().then(doc => {
    if (!doc.exists) return alert("Recibo no encontrado.");
    const r = doc.data();
    const productos = r.productos || r.items || [];
    let itemsHtml = '';
    productos.forEach(it => {
      itemsHtml += `<div style="display:flex; justify-content:space-between; margin:6px 0;">
        ${escapeHtml(it.nombre)} x${it.cantidad || 1} 
        <div>$${Number(it.precio || 0).toFixed(2)}</div>
      </div>`;
    });
    const fecha = r.fecha && r.fecha.toDate ? r.fecha.toDate().toLocaleString() : '';
    const w = window.open('', '_blank', 'width=700,height=800');
    w.document.write(`
      <html>
        <head><title>Recibo ${id}</title></head>
        <body style="font-family:Arial, sans-serif; padding:16px;">
          <h2>Dreams Beauty</h2>
          <div><strong>ID:</strong> ${id}</div>
          <div><strong>Cliente:</strong> ${escapeHtml(r.cliente || "")}</div>
          <div><strong>Fecha:</strong> ${fecha}</div>
          <hr>
          <div>${itemsHtml}</div>
          <hr>
          <div style="display:flex; justify-content:space-between;">
            <strong>Total</strong>
            <strong>$${Number(r.total||0).toFixed(2)} MXN</strong>
          </div>
          <div style="margin-top:12px;">
            <button onclick="window.print()">Imprimir</button>
          </div>
        </body>
      </html>
    `);
    w.document.close();
  });
}

cargarRecibos();