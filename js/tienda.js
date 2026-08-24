let productosDreams = [];
let descuentosDreams = [];
let categoriaActiva = "todos";
let textoBusqueda = "";
let filtroStock = "todos";
let ordenActual = "relevancia";

const productosContainer = document.getElementById("productos-container");
const categoriasContainer = document.getElementById("categorias-container");
const productosOfertaContainer = document.getElementById("productos-oferta");
const cantidadResultados = document.getElementById("cantidad-resultados");
const sinResultados = document.getElementById("sin-resultados");
const buscador = document.getElementById("buscador");
const limpiarBusqueda = document.getElementById("limpiar-busqueda");

const overlay = document.getElementById("overlay");
const filterPanel = document.getElementById("filter-panel");
const mobileMenu = document.getElementById("mobile-menu");

function escapeHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(Number(valor) || 0);
}

function timestampMilisegundos(valor) {
  if (!valor) return null;

  if (typeof valor.toMillis === "function") {
    return valor.toMillis();
  }

  if (valor.seconds) {
    return valor.seconds * 1000;
  }

  const fecha = new Date(valor);
  const tiempo = fecha.getTime();

  return Number.isNaN(tiempo) ? null : tiempo;
}

function descuentoEstaActivo(descuento) {
  if (descuento.activo === false) {
    return false;
  }

  const ahora = Date.now();
  const inicio = timestampMilisegundos(descuento.fechaInicio);
  const fin = timestampMilisegundos(descuento.fechaFin);

  if (inicio && ahora < inicio) {
    return false;
  }

  if (fin && ahora > fin) {
    return false;
  }

  return true;
}

function obtenerDescuentoProducto(producto) {
  const aplicables = descuentosDreams.filter(descuento => {
    if (!descuentoEstaActivo(descuento)) {
      return false;
    }

    const productos = Array.isArray(descuento.productos)
      ? descuento.productos
      : [];

    const categorias = Array.isArray(descuento.categorias)
      ? descuento.categorias
      : [];

    const categoriaIndividual = descuento.categoria
      ? [descuento.categoria]
      : [];

    const aplicaProducto = productos.includes(producto.id);

    const aplicaCategoria =
      categorias.includes(producto.categoria) ||
      categoriaIndividual.includes(producto.categoria);

    return aplicaProducto || aplicaCategoria;
  });

  if (!aplicables.length) {
    return null;
  }

  return aplicables.reduce((mayor, actual) => {
    const porcentajeMayor = Number(mayor.porcentaje) || 0;
    const porcentajeActual = Number(actual.porcentaje) || 0;

    return porcentajeActual > porcentajeMayor
      ? actual
      : mayor;
  });
}

function obtenerDatosPrecio(producto) {
  const precioOriginal = Math.max(0, Number(producto.precio) || 0);
  const descuento = obtenerDescuentoProducto(producto);

  if (!descuento) {
    return {
      precioOriginal,
      precioFinal: precioOriginal,
      porcentaje: 0,
      tieneDescuento: false
    };
  }

  const porcentaje = Math.min(
    100,
    Math.max(0, Number(descuento.porcentaje) || 0)
  );

  const precioFinal =
    precioOriginal - precioOriginal * (porcentaje / 100);

  return {
    precioOriginal,
    precioFinal: Math.max(0, precioFinal),
    porcentaje,
    tieneDescuento: porcentaje > 0
  };
}

function obtenerRutaImagen(producto) {
  const imagen = String(producto.imagen || "").trim();

  if (!imagen) {
    return "imagenes/sistema/producto-sin-imagen.png";
  }

  if (
    imagen.startsWith("http://") ||
    imagen.startsWith("https://") ||
    imagen.startsWith("data:")
  ) {
    return imagen;
  }

  if (imagen.startsWith("imagenes/")) {
    return imagen;
  }

  return `imagenes/${imagen}`;
}

function ordenarStockPrimero(lista) {
  return [...lista].sort((a, b) => {
    const stockA = Number(a.stock) || 0;
    const stockB = Number(b.stock) || 0;

    if (stockA > 0 && stockB <= 0) return -1;
    if (stockA <= 0 && stockB > 0) return 1;

    return 0;
  });
}

function aplicarOrden(lista) {
  const productos = [...lista];

  if (ordenActual === "precio-menor") {
    productos.sort((a, b) => {
      return obtenerDatosPrecio(a).precioFinal -
        obtenerDatosPrecio(b).precioFinal;
    });
  }

  if (ordenActual === "precio-mayor") {
    productos.sort((a, b) => {
      return obtenerDatosPrecio(b).precioFinal -
        obtenerDatosPrecio(a).precioFinal;
    });
  }

  if (ordenActual === "nombre") {
    productos.sort((a, b) => {
      return String(a.nombre || "").localeCompare(
        String(b.nombre || ""),
        "es",
        { sensitivity: "base" }
      );
    });
  }

  return ordenarStockPrimero(productos);
}

function obtenerProductosFiltrados() {
  let lista = [...productosDreams];

  if (categoriaActiva !== "todos") {
    lista = lista.filter(producto =>
      normalizarTexto(producto.categoria) ===
      normalizarTexto(categoriaActiva)
    );
  }

  if (textoBusqueda) {
    const busqueda = normalizarTexto(textoBusqueda);

    lista = lista.filter(producto => {
      const nombre = normalizarTexto(producto.nombre);
      const categoria = normalizarTexto(producto.categoria);
      const descripcion = normalizarTexto(producto.descripcion);

      return (
        nombre.includes(busqueda) ||
        categoria.includes(busqueda) ||
        descripcion.includes(busqueda)
      );
    });
  }

  if (filtroStock === "disponibles") {
    lista = lista.filter(producto =>
      Number(producto.stock) > 0
    );
  }

  if (filtroStock === "agotados") {
    lista = lista.filter(producto =>
      Number(producto.stock) <= 0
    );
  }

  return aplicarOrden(lista);
}

function crearTarjetaProducto(producto) {
  const agotado = Number(producto.stock) <= 0;
  const precios = obtenerDatosPrecio(producto);
  const imagen = obtenerRutaImagen(producto);

  const descuentoHTML = precios.tieneDescuento
    ? `
      <span class="product-badge offer">
        -${Math.round(precios.porcentaje)}%
      </span>
    `
    : "";

  const agotadoHTML = agotado
    ? `
      <span class="product-badge sold-out">
        AGOTADO
      </span>
    `
    : descuentoHTML;

  const precioAnteriorHTML = precios.tieneDescuento
    ? `
      <span class="product-old-price">
        ${formatearPrecio(precios.precioOriginal)}
      </span>
    `
    : "";

  return `
    <article
      class="product-card ${agotado ? "is-sold-out" : ""}"
      data-id="${escapeHtml(producto.id)}"
    >
      <div
        class="product-image-container"
        onclick="abrirProducto('${escapeHtml(producto.id)}')"
      >
        <img
          src="${escapeHtml(imagen)}"
          alt="${escapeHtml(producto.nombre || "Producto")}"
          loading="lazy"
          onerror="this.src='imagenes/sistema/producto-sin-imagen.png'"
        >

        ${agotadoHTML}

        <button
          type="button"
          class="add-product-button"
          aria-label="Agregar al carrito"
          onclick="event.stopPropagation(); agregarProductoRapido('${escapeHtml(producto.id)}')"
          ${agotado ? "disabled" : ""}
        >
          <i class="fa-solid ${agotado ? "fa-xmark" : "fa-plus"}"></i>
        </button>
      </div>

      <div
        class="product-info"
        onclick="abrirProducto('${escapeHtml(producto.id)}')"
      >
        <p class="product-category">
          ${escapeHtml(producto.categoria || "Dreams Cosmetic")}
        </p>

        <h3 class="product-name">
          ${escapeHtml(producto.nombre || "Producto")}
        </h3>

        <div class="product-price-row">
          <span class="product-price">
            ${formatearPrecio(precios.precioFinal)}
          </span>

          ${precioAnteriorHTML}
        </div>

        <p class="product-stock ${agotado ? "out" : ""}">
          ${
            agotado
              ? "Agotado temporalmente"
              : `${Number(producto.stock)} disponible${Number(producto.stock) === 1 ? "" : "s"}`
          }
        </p>
      </div>
    </article>
  `;
}

function renderizarProductos() {
  if (!productosContainer) {
    return;
  }

  const lista = obtenerProductosFiltrados();

  productosContainer.innerHTML = "";

  if (cantidadResultados) {
    cantidadResultados.textContent =
      `${lista.length} producto${lista.length === 1 ? "" : "s"}`;
  }

  if (!lista.length) {
    if (sinResultados) {
      sinResultados.hidden = false;
    }

    return;
  }

  if (sinResultados) {
    sinResultados.hidden = true;
  }

  productosContainer.innerHTML =
    lista.map(crearTarjetaProducto).join("");
}

function obtenerCategorias() {
  const categorias = productosDreams
    .map(producto => String(producto.categoria || "").trim())
    .filter(Boolean);

  return [...new Set(categorias)].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
}

function renderizarCategorias() {
  if (!categoriasContainer) {
    return;
  }

  const categorias = obtenerCategorias();

  categoriasContainer.innerHTML = `
    <button
      class="category-pill ${categoriaActiva === "todos" ? "active" : ""}"
      data-categoria="todos"
    >
      Todos
    </button>

    ${categorias.map(categoria => `
      <button
        class="category-pill ${
          categoriaActiva === categoria
            ? "active"
            : ""
        }"
        data-categoria="${escapeHtml(categoria)}"
      >
        ${escapeHtml(categoria)}
      </button>
    `).join("")}
  `;

  categoriasContainer
    .querySelectorAll(".category-pill")
    .forEach(boton => {
      boton.addEventListener("click", () => {
        categoriaActiva = boton.dataset.categoria || "todos";

        renderizarCategorias();
        renderizarProductos();

        document
          .getElementById("productos")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      });
    });
}

function renderizarOfertas() {
  const seccion = document.getElementById("seccion-ofertas");

  if (!productosOfertaContainer) {
    return;
  }

  const ofertas = productosDreams
    .filter(producto =>
      obtenerDatosPrecio(producto).tieneDescuento
    )
    .sort((a, b) => {
      const stockA = Number(a.stock) || 0;
      const stockB = Number(b.stock) || 0;

      if (stockA > 0 && stockB <= 0) return -1;
      if (stockA <= 0 && stockB > 0) return 1;

      return 0;
    })
    .slice(0, 10);

  if (!ofertas.length) {
    if (seccion) {
      seccion.style.display = "none";
    }

    return;
  }

  if (seccion) {
    seccion.style.display = "";
  }

  productosOfertaContainer.innerHTML =
    ofertas.map(producto => `
      <div
        class="offer-card"
        onclick="abrirProducto('${escapeHtml(producto.id)}')"
      >
        <div class="offer-card-image">
          <img
            src="${escapeHtml(obtenerRutaImagen(producto))}"
            alt="${escapeHtml(producto.nombre || "Producto")}"
            loading="lazy"
            onerror="this.src='imagenes/sistema/producto-sin-imagen.png'"
          >

          <span>
            -${Math.round(obtenerDatosPrecio(producto).porcentaje)}%
          </span>
        </div>

        <div class="offer-card-info">
          <p>
            ${escapeHtml(producto.nombre || "")}
          </p>

          <strong>
            ${formatearPrecio(
              obtenerDatosPrecio(producto).precioFinal
            )}
          </strong>
        </div>
      </div>
    `).join("");
}

function renderizarTodo() {
  renderizarCategorias();
  renderizarProductos();
  renderizarOfertas();
}

function cargarProductos() {
  return db
    .collection("productos")
    .onSnapshot(
      snapshot => {
        productosDreams = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        renderizarTodo();
      },
      error => {
        console.error(error);

        productosContainer.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <div class="empty-icon">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h3>No pudimos cargar los productos</h3>

            <p>
              Intenta actualizar la página.
            </p>
          </div>
        `;

        if (cantidadResultados) {
          cantidadResultados.textContent =
            "No se pudieron cargar los productos";
        }
      }
    );
}

function cargarDescuentos() {
  return db
    .collection("descuentos")
    .onSnapshot(snapshot => {
      descuentosDreams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      renderizarProductos();
      renderizarOfertas();
    });
}

function abrirProducto(id) {
  sessionStorage.setItem(
    "dreamsProductoSeleccionado",
    id
  );

  window.location.href =
    `producto.html?id=${encodeURIComponent(id)}`;
}

function agregarProductoRapido(id) {
  const producto = productosDreams.find(item =>
    item.id === id
  );

  if (!producto || Number(producto.stock) <= 0) {
    return;
  }

  if (
    typeof window.agregarAlCarrito ===
    "function"
  ) {
    window.agregarAlCarrito(producto);
  }
}

function abrirOverlay() {
  overlay?.classList.add("active");
  document.body.style.overflow = "hidden";
}

function cerrarOverlay() {
  overlay?.classList.remove("active");
  filterPanel?.classList.remove("active");
  mobileMenu?.classList.remove("active");
  document.body.style.overflow = "";
}

function abrirFiltros() {
  mobileMenu?.classList.remove("active");
  filterPanel?.classList.add("active");
  abrirOverlay();
}

function abrirMenu() {
  filterPanel?.classList.remove("active");
  mobileMenu?.classList.add("active");
  abrirOverlay();
}

buscador?.addEventListener("input", event => {
  textoBusqueda = event.target.value;

  if (limpiarBusqueda) {
    limpiarBusqueda.style.display =
      textoBusqueda.trim()
        ? "flex"
        : "none";
  }

  renderizarProductos();
});

limpiarBusqueda?.addEventListener("click", () => {
  buscador.value = "";
  textoBusqueda = "";
  limpiarBusqueda.style.display = "none";

  renderizarProductos();
  buscador.focus();
});

document
  .getElementById("btn-filtros")
  ?.addEventListener(
    "click",
    abrirFiltros
  );

document
  .getElementById("cerrar-filtros")
  ?.addEventListener(
    "click",
    cerrarOverlay
  );

document
  .getElementById("btn-menu")
  ?.addEventListener(
    "click",
    abrirMenu
  );

document
  .getElementById("cerrar-menu")
  ?.addEventListener(
    "click",
    cerrarOverlay
  );

overlay?.addEventListener(
  "click",
  cerrarOverlay
);

document
  .querySelectorAll(
    'input[name="stock"]'
  )
  .forEach(radio => {
    radio.addEventListener(
      "change",
      event => {
        filtroStock =
          event.target.value;
      }
    );
  });

document
  .getElementById("orden-productos")
  ?.addEventListener(
    "change",
    event => {
      ordenActual =
        event.target.value;
    }
  );

document
  .getElementById("aplicar-filtros")
  ?.addEventListener(
    "click",
    () => {
      renderizarProductos();
      cerrarOverlay();
    }
  );

document
  .getElementById("limpiar-filtros")
  ?.addEventListener(
    "click",
    () => {
      filtroStock = "todos";
      ordenActual = "relevancia";

      const radioTodos =
        document.querySelector(
          'input[name="stock"][value="todos"]'
        );

      const selectOrden =
        document.getElementById(
          "orden-productos"
        );

      if (radioTodos) {
        radioTodos.checked = true;
      }

      if (selectOrden) {
        selectOrden.value =
          "relevancia";
      }

      renderizarProductos();
    }
  );

document
  .getElementById("nav-buscar")
  ?.addEventListener(
    "click",
    () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      setTimeout(() => {
        buscador?.focus();
      }, 350);
    }
  );

document
  .getElementById("nav-categorias")
  ?.addEventListener(
    "click",
    () => {
      document
        .querySelector(
          ".categories-section"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    }
  );

document
  .getElementById("menu-categorias")
  ?.addEventListener(
    "click",
    () => {
      cerrarOverlay();

      setTimeout(() => {
        document
          .querySelector(
            ".categories-section"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }, 250);
    }
  );

document
  .getElementById("menu-ofertas")
  ?.addEventListener(
    "click",
    () => {
      cerrarOverlay();

      setTimeout(() => {
        document
          .getElementById(
            "seccion-ofertas"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }, 250);
    }
  );

document
  .getElementById("ver-todas-ofertas")
  ?.addEventListener(
    "click",
    () => {
      categoriaActiva =
        "todos";

      textoBusqueda =
        "";

      if (buscador) {
        buscador.value = "";
      }

      const productosConOferta =
        productosDreams.filter(
          producto =>
            obtenerDatosPrecio(producto)
              .tieneDescuento
        );

      productosContainer.innerHTML =
        productosConOferta
          .sort((a, b) =>
            Number(b.stock > 0) -
            Number(a.stock > 0)
          )
          .map(crearTarjetaProducto)
          .join("");

      if (cantidadResultados) {
        cantidadResultados.textContent =
          `${productosConOferta.length} producto${
            productosConOferta.length === 1
              ? ""
              : "s"
          } en oferta`;
      }

      document
        .getElementById("productos")
        ?.scrollIntoView({
          behavior: "smooth"
        });
    }
  );

window.abrirProducto =
  abrirProducto;

window.agregarProductoRapido =
  agregarProductoRapido;

cargarDescuentos();
cargarProductos();

