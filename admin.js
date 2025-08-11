const db = firebase.firestore();

document.getElementById("form-producto").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const stock = parseInt(document.getElementById("stock").value);
  const precio = parseFloat(document.getElementById("precio").value);
  const imagen = document.getElementById("imagen").value.trim();

  if (!nombre || !descripcion || isNaN(stock) || isNaN(precio) || !imagen) {
    alert("Por favor completa todos los campos correctamente.");
    return;
  }

  try {
    await db.collection("productos").add({
      nombre,
      descripcion,
      stock,
      precio,
      imagen
    });

    alert("✅ Producto guardado correctamente.");
    e.target.reset();
  } catch (error) {
    console.error("❌ Error al guardar en Firestore:", error);
    alert("Hubo un error al guardar el producto. Revisa la consola.");
  }
});