let codigosPromocionalesAdmin = [];
let filtroCodigosAdmin = "todos";

const modalCodigo =
  document.getElementById(
    "modal-codigo"
  );

function codigoTextoSeguro(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function obtenerFechaCodigo(valor) {
  if (!valor) {
    return null;
  }

  if (
    typeof valor.toDate ===
    "function"
  ) {
    return valor.toDate();
  }

  const fecha =
    new Date(valor);

  return Number.isNaN(
    fecha.getTime()
  )
    ? null
    : fecha;
}

function formatearFechaCodigo(valor) {
  const fecha =
    obtenerFechaCodigo(valor);

  if (!fecha) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(fecha);
}

function fechaLocalCodigo(
  fecha = new Date()
) {
  const offset =
    fecha.getTimezoneOffset();

  const local =
    new Date(
      fecha.getTime() -
      offset * 60000
    );

  return local
    .toISOString()
    .slice(0, 16);
}

function obtenerCategoriasCodigos() {
  return [
    ...new Set(
      productosAdmin
        .map(producto =>
          String(
            producto.categoria || ""
          ).trim()
        )
        .filter(Boolean)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        "es",
        {
          sensitivity: "base"
        }
      )
  );
}

function cargarProductosCodigos() {
  const producto =
    document.getElementById(
      "codigo-producto"
    );

  const regalo =
    document.getElementById(
      "codigo-producto-gratis"
    );

  const categoria =
    document.getElementById(
      "codigo-categoria"
    );

  const productosOrdenados =
    [...productosAdmin]
      .sort(
        (a, b) =>
          String(a.nombre || "")
            .localeCompare(
              String(b.nombre || ""),
              "es",
              {
                sensitivity: "base"
              }
            )
      );

  const opcionesProductos = `
    <option value="">
      Selecciona un producto
    </option>

    ${productosOrdenados
      .map(item => `
        <option value="${item.id}">
          ${codigoTextoSeguro(
            item.nombre
          )}
        </option>
      `)
      .join("")}
  `;

  if (producto) {
    producto.innerHTML =
      opcionesProductos;
  }

  if (regalo) {
    regalo.innerHTML =
      opcionesProductos;
  }

  const categorias =
    obtenerCategoriasCodigos();

  if (categoria) {
    categoria.innerHTML = `
      <option value="">
        Selecciona una categoría
      </option>

      ${categorias
        .map(item => `
          <option value="${codigoTextoSeguro(item)}">
            ${codigoTextoSeguro(item)}
          </option>
        `)
        .join("")}
    `;
  }
}

function obtenerEstadoCodigo(codigo) {
  const limite =
    Number(
      codigo.limiteUsos
    ) || 0;

  const utilizados =
    Number(
      codigo.usosRealizados
    ) || 0;

  if (
    limite > 0 &&
    utilizados >= limite
  ) {
    return {
      texto: "Agotado",
      clase: "agotado",
      filtro: "agotados"
    };
  }

  if (
    codigo.activo === false
  ) {
    return {
      texto: "Desactivado",
      clase: "desactivado",
      filtro: "desactivados"
    };
  }

  const ahora =
    new Date();

  const inicio =
    obtenerFechaCodigo(
      codigo.fechaInicio
    );

  const fin =
    obtenerFechaCodigo(
      codigo.fechaFin
    );

  if (
    fin &&
    ahora > fin
  ) {
    return {
      texto: "Finalizado",
      clase: "finalizado",
      filtro: "finalizados"
    };
  }

  if (
    inicio &&
    ahora < inicio
  ) {
    return {
      texto: "Programado",
      clase: "programado",
      filtro: "activos"
    };
  }

  return {
    texto: "Activo",
    clase: "activo",
    filtro: "activos"
  };
}

function obtenerProductoCodigo(id) {
  return productosAdmin.find(
    producto =>
      producto.id === id
  );
}

function obtenerBeneficioCodigo(
  codigo
) {
  if (
    codigo.tipoBeneficio ===
    "productoGratis"
  ) {
    const producto =
      obtenerProductoCodigo(
        codigo.productoGratisId
      );

    return {
      icono:
        "fa-solid fa-gift",
      clase:
        "gift",
      titulo:
        "Artículo gratis",
      descripcion:
        producto?.nombre ||
        codigo.productoGratisNombre ||
        "Producto seleccionado"
    };
  }

  const porcentaje =
    Number(
      codigo.porcentaje
    ) || 0;

  let destino =
    "Toda la tienda";

  if (
    codigo.alcance ===
    "categoria"
  ) {
    destino =
      codigo.categoria ||
      "Categoría";
  }

  if (
    codigo.alcance ===
    "producto"
  ) {
    const producto =
      obtenerProductoCodigo(
        codigo.productoId
      );

    destino =
      producto?.nombre ||
      codigo.productoNombre ||
      "Producto";
  }

  return {
    icono:
      "fa-solid fa-percent",
    clase:
      "",
    titulo:
      `${porcentaje}% de descuento`,
    descripcion:
      destino
  };
}

function renderizarResumenCodigos() {
  const total =
    codigosPromocionalesAdmin.length;

  const activos =
    codigosPromocionalesAdmin
      .filter(codigo => {
        const estado =
          obtenerEstadoCodigo(
            codigo
          );

        return (
          estado.clase ===
          "activo"
        );
      })
      .length;

  const agotados =
    codigosPromocionalesAdmin
      .filter(codigo => {
        const estado =
          obtenerEstadoCodigo(
            codigo
          );

        return (
          estado.clase ===
          "agotado"
        );
      })
      .length;

  const canjes =
    codigosPromocionalesAdmin
      .reduce(
        (totalCanjes, codigo) =>
          totalCanjes +
          (
            Number(
              codigo.usosRealizados
            ) || 0
          ),
        0
      );

  document.getElementById(
    "total-codigos"
  ).textContent =
    total;

  document.getElementById(
    "codigos-activos"
  ).textContent =
    activos;

  document.getElementById(
    "total-canjes-codigos"
  ).textContent =
    canjes;

  document.getElementById(
    "codigos-agotados"
  ).textContent =
    agotados;
}

function renderizarCodigosAdmin() {
  const contenedor =
    document.getElementById(
      "lista-codigos-admin"
    );

  if (!contenedor) {
    return;
  }

  const busqueda =
    document
      .getElementById(
        "buscar-codigo-admin"
      )
      ?.value
      .trim()
      .toUpperCase() || "";

  let lista =
    [...codigosPromocionalesAdmin];

  if (busqueda) {
    lista =
      lista.filter(codigo =>
        String(
          codigo.codigo || ""
        )
          .toUpperCase()
          .includes(busqueda)
      );
  }

  if (
    filtroCodigosAdmin !==
    "todos"
  ) {
    lista =
      lista.filter(codigo => {
        const estado =
          obtenerEstadoCodigo(
            codigo
          );

        return (
          estado.filtro ===
          filtroCodigosAdmin
        );
      });
  }

  lista.sort(
    (a, b) => {
      const fechaA =
        obtenerFechaCodigo(
          a.creadoEn
        );

      const fechaB =
        obtenerFechaCodigo(
          b.creadoEn
        );

      return (
        (fechaB?.getTime() || 0) -
        (fechaA?.getTime() || 0)
      );
    }
  );

  if (!lista.length) {
    contenedor.innerHTML = `
      <div class="code-empty-state">

        <div class="code-empty-icon">
          <i class="fa-solid fa-ticket"></i>
        </div>

        <h3>
          No hay códigos promocionales
        </h3>

        <p>
          Crea un código para ofrecer descuentos o artículos gratis a tus clientes.
        </p>

      </div>
    `;

    return;
  }

  contenedor.innerHTML =
    lista.map(codigo => {
      const estado =
        obtenerEstadoCodigo(
          codigo
        );

      const beneficio =
        obtenerBeneficioCodigo(
          codigo
        );

      const usados =
        Number(
          codigo.usosRealizados
        ) || 0;

      const limite =
        Number(
          codigo.limiteUsos
        ) || 0;

      const porcentajeUso =
        limite > 0
          ? Math.min(
              100,
              Math.round(
                (
                  usados /
                  limite
                ) * 100
              )
            )
          : 0;

      const puedeActivarse =
        estado.clase !==
          "agotado" &&
        estado.clase !==
          "finalizado";

      return `
        <article class="code-admin-card">

          <div class="code-card-top">

            <div class="code-card-name">

              <span>
                CÓDIGO
              </span>

              <strong>
                ${codigoTextoSeguro(
                  codigo.codigo
                )}
              </strong>

            </div>

            <span
              class="code-status ${estado.clase}"
            >
              ${estado.texto}
            </span>

          </div>

          <div class="code-card-body">

            <div class="code-benefit">

              <div
                class="code-benefit-icon ${beneficio.clase}"
              >
                <i class="${beneficio.icono}"></i>
              </div>

              <div>

                <span>
                  BENEFICIO
                </span>

                <strong>
                  ${codigoTextoSeguro(
                    beneficio.titulo
                  )}
                </strong>

              </div>

            </div>

            <div class="code-details">

              <div class="code-detail-row">

                <span>
                  Aplica a
                </span>

                <strong>
                  ${codigoTextoSeguro(
                    beneficio.descripcion
                  )}
                </strong>

              </div>

              <div class="code-detail-row">

                <span>
                  Inicio
                </span>

                <strong>
                  ${codigoTextoSeguro(
                    formatearFechaCodigo(
                      codigo.fechaInicio
                    )
                  )}
                </strong>

              </div>

              <div class="code-detail-row">

                <span>
                  Finaliza
                </span>

                <strong>
                  ${codigoTextoSeguro(
                    formatearFechaCodigo(
                      codigo.fechaFin
                    )
                  )}
                </strong>

              </div>

            </div>

            <div class="code-usage">

              <div class="code-usage-header">

                <span>
                  Canjes utilizados
                </span>

                <strong>
                  ${usados} / ${limite}
                </strong>

              </div>

              <div class="code-usage-bar">

                <span
                  style="width:${porcentajeUso}%"
                ></span>

              </div>

            </div>

          </div>

          <div class="code-card-actions">

            ${
              puedeActivarse
                ? `
                  <button
                    class="code-toggle-button ${
                      codigo.activo === false
                        ? "activate"
                        : ""
                    }"
                    onclick="alternarCodigoPromocional(
                      '${codigo.id}',
                      ${codigo.activo !== false}
                    )"
                  >
                    ${
                      codigo.activo === false
                        ? "Activar"
                        : "Desactivar"
                    }
                  </button>
                `
                : `
                  <button
                    class="code-toggle-button"
                    disabled
                  >
                    ${estado.texto}
                  </button>
                `
            }

            <button
              class="code-delete-button"
              onclick="eliminarCodigoPromocional(
                '${codigo.id}'
              )"
              aria-label="Eliminar código"
            >
              <i class="fa-solid fa-trash"></i>
            </button>

          </div>

        </article>
      `;
    }).join("");
}

function actualizarTipoBeneficioCodigo() {
  const tipo =
    document.querySelector(
      'input[name="tipo-beneficio-codigo"]:checked'
    )?.value ||
    "porcentaje";

  document.getElementById(
    "configuracion-codigo-porcentaje"
  ).hidden =
    tipo !== "porcentaje";

  document.getElementById(
    "configuracion-codigo-regalo"
  ).hidden =
    tipo !== "productoGratis";

  actualizarPreviewCodigo();
}

function actualizarAlcanceCodigo() {
  const alcance =
    document.querySelector(
      'input[name="alcance-codigo"]:checked'
    )?.value ||
    "tienda";

  document.getElementById(
    "grupo-codigo-categoria"
  ).hidden =
    alcance !== "categoria";

  document.getElementById(
    "grupo-codigo-producto"
  ).hidden =
    alcance !== "producto";

  actualizarPreviewCodigo();
}

function obtenerTextoSelectCodigo(id) {
  const select =
    document.getElementById(id);

  if (!select) {
    return "";
  }

  const opcion =
    select.options[
      select.selectedIndex
    ];

  return (
    opcion?.text || ""
  ).trim();
}

function actualizarPreviewCodigo() {
  const preview =
    document.getElementById(
      "preview-codigo"
    );

  if (!preview) {
    return;
  }

  const codigo =
    document
      .getElementById(
        "codigo-nombre"
      )
      ?.value
      .trim()
      .toUpperCase() || "";

  const limite =
    Number(
      document.getElementById(
        "codigo-limite-usos"
      )?.value
    ) || 0;

  const tipo =
    document.querySelector(
      'input[name="tipo-beneficio-codigo"]:checked'
    )?.value ||
    "porcentaje";

  if (!codigo) {
    preview.innerHTML = `
      <div class="code-preview-icon">
        <i class="fa-solid fa-ticket"></i>
      </div>

      <div>
        <strong>
          Configura tu código
        </strong>

        <span>
          Aquí aparecerá un resumen antes de guardarlo.
        </span>
      </div>
    `;

    return;
  }

  let descripcion =
    "";

  if (
    tipo ===
    "productoGratis"
  ) {
    const producto =
      obtenerTextoSelectCodigo(
        "codigo-producto-gratis"
      );

    descripcion =
      producto &&
      !producto.includes(
        "Selecciona"
      )
        ? `Regala ${producto}`
        : "Artículo gratis";
  } else {
    const porcentaje =
      Number(
        document.getElementById(
          "codigo-porcentaje"
        )?.value
      ) || 0;

    const alcance =
      document.querySelector(
        'input[name="alcance-codigo"]:checked'
      )?.value ||
      "tienda";

    let objetivo =
      "toda la tienda";

    if (
      alcance ===
      "categoria"
    ) {
      objetivo =
        document.getElementById(
          "codigo-categoria"
        )?.value ||
        "una categoría";
    }

    if (
      alcance ===
      "producto"
    ) {
      const producto =
        obtenerTextoSelectCodigo(
          "codigo-producto"
        );

      objetivo =
        producto &&
        !producto.includes(
          "Selecciona"
        )
          ? producto
          : "un producto";
    }

    descripcion =
      porcentaje
        ? `${porcentaje}% de descuento en ${objetivo}`
        : "Descuento porcentual";
  }

  preview.innerHTML = `
    <div class="code-preview-icon">
      <i class="fa-solid fa-ticket"></i>
    </div>

    <div>

      <strong>
        ${codigoTextoSeguro(codigo)}
      </strong>

      <span>
        ${codigoTextoSeguro(descripcion)}
        ${
          limite
            ? ` · Máximo ${limite} canje${limite === 1 ? "" : "s"}`
            : ""
        }
      </span>

    </div>
  `;
}

function limpiarFormularioCodigo() {
  const formulario =
    document.getElementById(
      "form-codigo"
    );

  formulario?.reset();

  document.getElementById(
    "codigo-id"
  ).value = "";

  document.getElementById(
    "titulo-modal-codigo"
  ).textContent =
    "Nuevo código";

  document.getElementById(
    "configuracion-codigo-porcentaje"
  ).hidden =
    false;

  document.getElementById(
    "configuracion-codigo-regalo"
  ).hidden =
    true;

  document.getElementById(
    "grupo-codigo-categoria"
  ).hidden =
    true;

  document.getElementById(
    "grupo-codigo-producto"
  ).hidden =
    true;

  cargarProductosCodigos();

  const ahora =
    new Date();

  const unaSemana =
    new Date(
      ahora.getTime() +
      7 * 24 * 60 * 60 * 1000
    );

  document.getElementById(
    "codigo-inicio"
  ).value =
    fechaLocalCodigo(ahora);

  document.getElementById(
    "codigo-fin"
  ).value =
    fechaLocalCodigo(
      unaSemana
    );

  actualizarPreviewCodigo();
}

function abrirModalCodigo() {
  limpiarFormularioCodigo();

  modalCodigo?.classList.add(
    "active"
  );

  modalOverlay?.classList.add(
    "active"
  );

  document.body.style.overflow =
    "hidden";

  setTimeout(
    () => {
      document
        .getElementById(
          "codigo-nombre"
        )
        ?.focus();
    },
    100
  );
}

function cerrarModalCodigo() {
  modalCodigo?.classList.remove(
    "active"
  );

  if (
    !document
      .getElementById(
        "modal-producto"
      )
      ?.classList.contains(
        "active"
      ) &&
    !document
      .getElementById(
        "modal-descuento"
      )
      ?.classList.contains(
        "active"
      )
  ) {
    modalOverlay?.classList.remove(
      "active"
    );
  }

  document.body.style.overflow =
    "";
}

async function guardarCodigoPromocional(
  event
) {
  event.preventDefault();

  const codigo =
    document
      .getElementById(
        "codigo-nombre"
      )
      .value
      .trim()
      .toUpperCase();

  const tipoBeneficio =
    document.querySelector(
      'input[name="tipo-beneficio-codigo"]:checked'
    )?.value ||
    "porcentaje";

  const limiteUsos =
    Number(
      document.getElementById(
        "codigo-limite-usos"
      ).value
    );

  const inicioValor =
    document.getElementById(
      "codigo-inicio"
    ).value;

  const finValor =
    document.getElementById(
      "codigo-fin"
    ).value;

  if (
    !/^[A-Z0-9_-]{3,30}$/.test(
      codigo
    )
  ) {
    alert(
      "El código debe tener entre 3 y 30 caracteres y solo puede contener letras, números, guiones o guion bajo."
    );

    return;
  }

  if (
    !Number.isInteger(
      limiteUsos
    ) ||
    limiteUsos < 1
  ) {
    alert(
      "Ingresa un límite de canjes válido."
    );

    return;
  }

  if (
    !inicioValor ||
    !finValor
  ) {
    alert(
      "Selecciona las fechas de inicio y finalización."
    );

    return;
  }

  const inicio =
    new Date(inicioValor);

  const fin =
    new Date(finValor);

  if (
    fin.getTime() <=
    inicio.getTime()
  ) {
    alert(
      "La fecha de finalización debe ser posterior a la fecha de inicio."
    );

    return;
  }

  const datos = {
    codigo,
    tipoBeneficio,
    limiteUsos,
    usosRealizados: 0,
    activo: true,
    fechaInicio:
      firebase.firestore
        .Timestamp
        .fromDate(inicio),
    fechaFin:
      firebase.firestore
        .Timestamp
        .fromDate(fin),
    creadoEn:
      firebase.firestore
        .FieldValue
        .serverTimestamp()
  };

  if (
    tipoBeneficio ===
    "porcentaje"
  ) {
    const porcentaje =
      Number(
        document.getElementById(
          "codigo-porcentaje"
        ).value
      );

    const alcance =
      document.querySelector(
        'input[name="alcance-codigo"]:checked'
      )?.value ||
      "tienda";

    if (
      !porcentaje ||
      porcentaje < 1 ||
      porcentaje > 100
    ) {
      alert(
        "El descuento debe estar entre 1% y 100%."
      );

      return;
    }

    datos.porcentaje =
      porcentaje;

    datos.alcance =
      alcance;

    if (
      alcance ===
      "categoria"
    ) {
      const categoria =
        document.getElementById(
          "codigo-categoria"
        ).value;

      if (!categoria) {
        alert(
          "Selecciona una categoría."
        );

        return;
      }

      datos.categoria =
        categoria;
    }

    if (
      alcance ===
      "producto"
    ) {
      const productoId =
        document.getElementById(
          "codigo-producto"
        ).value;

      if (!productoId) {
        alert(
          "Selecciona un producto."
        );

        return;
      }

      const producto =
        obtenerProductoCodigo(
          productoId
        );

      datos.productoId =
        productoId;

      datos.productoNombre =
        producto?.nombre ||
        "";
    }
  }

  if (
    tipoBeneficio ===
    "productoGratis"
  ) {
    const productoGratisId =
      document.getElementById(
        "codigo-producto-gratis"
      ).value;

    if (!productoGratisId) {
      alert(
        "Selecciona el producto que se regalará."
      );

      return;
    }

    const producto =
      obtenerProductoCodigo(
        productoGratisId
      );

    if (!producto) {
      alert(
        "El producto seleccionado ya no existe."
      );

      return;
    }

    datos.productoGratisId =
      productoGratisId;

    datos.productoGratisNombre =
      producto.nombre || "";
  }

  const boton =
    document.getElementById(
      "guardar-codigo"
    );

  boton.disabled =
    true;

  boton.textContent =
    "Creando...";

  try {
    const referencia =
      db
        .collection(
          "codigosPromocionales"
        )
        .doc(codigo);

    const existente =
      await referencia.get();

    if (existente.exists) {
      throw new Error(
        "Ya existe un código con ese nombre."
      );
    }

    await referencia.set(
      datos
    );

    cerrarModalCodigo();

  } catch (error) {
    console.error(error);

    alert(
      error.message ||
      "No se pudo crear el código."
    );

  } finally {
    boton.disabled =
      false;

    boton.textContent =
      "Crear código";
  }
}

async function alternarCodigoPromocional(
  id,
  actualmenteActivo
) {
  const codigo =
    codigosPromocionalesAdmin
      .find(
        item =>
          item.id === id
      );

  if (!codigo) {
    return;
  }

  const estado =
    obtenerEstadoCodigo(
      codigo
    );

  if (
    estado.clase ===
      "agotado" ||
    estado.clase ===
      "finalizado"
  ) {
    return;
  }

  try {
    await db
      .collection(
        "codigosPromocionales"
      )
      .doc(id)
      .update({
        activo:
          !actualmenteActivo,
        actualizadoEn:
          firebase.firestore
            .FieldValue
            .serverTimestamp()
      });

  } catch (error) {
    console.error(error);

    alert(
      "No se pudo actualizar el código."
    );
  }
}

async function eliminarCodigoPromocional(
  id
) {
  const codigo =
    codigosPromocionalesAdmin
      .find(
        item =>
          item.id === id
      );

  if (!codigo) {
    return;
  }

  if (
    !confirm(
      `¿Eliminar el código "${codigo.codigo}" definitivamente?`
    )
  ) {
    return;
  }

  try {
    await db
      .collection(
        "codigosPromocionales"
      )
      .doc(id)
      .delete();

  } catch (error) {
    console.error(error);

    alert(
      "No se pudo eliminar el código."
    );
  }
}

db
  .collection(
    "codigosPromocionales"
  )
  .onSnapshot(
    snapshot => {
      codigosPromocionalesAdmin =
        snapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );

      renderizarResumenCodigos();
      renderizarCodigosAdmin();
    },
    error => {
      console.error(error);

      const contenedor =
        document.getElementById(
          "lista-codigos-admin"
        );

      if (contenedor) {
        contenedor.innerHTML = `
          <div class="code-empty-state">

            <div class="code-empty-icon">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h3>
              No se pudieron cargar los códigos
            </h3>

            <p>
              Revisa la conexión con Firebase y vuelve a intentarlo.
            </p>

          </div>
        `;
      }
    }
  );

document
  .querySelector(
    '.nav-option[data-section="codigos"]'
  )
  ?.addEventListener(
    "click",
    () => {
      const titulo =
        document.getElementById(
          "titulo-seccion"
        );

      if (titulo) {
        titulo.textContent =
          "Códigos promocionales";
      }

      renderizarResumenCodigos();
      renderizarCodigosAdmin();
    }
  );

document
  .getElementById(
    "btn-nuevo-codigo"
  )
  ?.addEventListener(
    "click",
    abrirModalCodigo
  );

document
  .getElementById(
    "cerrar-modal-codigo"
  )
  ?.addEventListener(
    "click",
    cerrarModalCodigo
  );

document
  .getElementById(
    "cancelar-codigo"
  )
  ?.addEventListener(
    "click",
    cerrarModalCodigo
  );

modalOverlay
  ?.addEventListener(
    "click",
    () => {
      if (
        modalCodigo
          ?.classList
          .contains("active")
      ) {
        cerrarModalCodigo();
      }
    }
  );

document
  .getElementById(
    "codigo-nombre"
  )
  ?.addEventListener(
    "input",
    event => {
      event.target.value =
        event.target.value
          .toUpperCase()
          .replace(
            /[^A-Z0-9_-]/g,
            ""
          );

      actualizarPreviewCodigo();
    }
  );

document
  .querySelectorAll(
    'input[name="tipo-beneficio-codigo"]'
  )
  .forEach(input => {
    input.addEventListener(
      "change",
      actualizarTipoBeneficioCodigo
    );
  });

document
  .querySelectorAll(
    'input[name="alcance-codigo"]'
  )
  .forEach(input => {
    input.addEventListener(
      "change",
      actualizarAlcanceCodigo
    );
  });

[
  "codigo-porcentaje",
  "codigo-limite-usos"
].forEach(id => {
  document
    .getElementById(id)
    ?.addEventListener(
      "input",
      actualizarPreviewCodigo
    );
});

[
  "codigo-categoria",
  "codigo-producto",
  "codigo-producto-gratis"
].forEach(id => {
  document
    .getElementById(id)
    ?.addEventListener(
      "change",
      actualizarPreviewCodigo
    );
});

document
  .getElementById(
    "buscar-codigo-admin"
  )
  ?.addEventListener(
    "input",
    renderizarCodigosAdmin
  );

document
  .getElementById(
    "filtro-codigos-admin"
  )
  ?.addEventListener(
    "change",
    event => {
      filtroCodigosAdmin =
        event.target.value;

      renderizarCodigosAdmin();
    }
  );

document
  .getElementById(
    "form-codigo"
  )
  ?.addEventListener(
    "submit",
    guardarCodigoPromocional
  );

window.alternarCodigoPromocional =
  alternarCodigoPromocional;

window.eliminarCodigoPromocional =
  eliminarCodigoPromocional;

  const cancelarPedidoOriginalDreams =
  window.cancelarPedido;

async function devolverPromocionPedidoCancelado(
  pedidoId
) {
  try {
    await db.runTransaction(
      async transaction => {
        const pedidoRef =
          db
            .collection("recibos")
            .doc(pedidoId);

        const pedidoSnap =
          await transaction.get(
            pedidoRef
          );

        if (!pedidoSnap.exists) {
          return;
        }

        const pedido =
          pedidoSnap.data();

        if (
          !pedido.cancelado &&
          pedido.estado !== "cancelado"
        ) {
          return;
        }

        if (
          pedido.codigoPromocionalCanjeDevuelto ===
          true
        ) {
          return;
        }

        const promocion =
          pedido.codigoPromocional;

        const codigo =
          String(
            promocion?.codigo || ""
          )
            .trim()
            .toUpperCase();

        if (!codigo) {
          transaction.update(
            pedidoRef,
            {
              codigoPromocionalCanjeDevuelto:
                true,

              fechaDevolucionCanje:
                firebase.firestore
                  .FieldValue
                  .serverTimestamp()
            }
          );

          return;
        }

        const codigoGlobalRef =
          db
            .collection(
              "codigosPromocionales"
            )
            .doc(codigo);

        const codigoGlobalSnap =
          await transaction.get(
            codigoGlobalRef
          );

        let codigoClienteRef =
          null;

        let codigoClienteSnap =
          null;

        const clienteUid =
          String(
            pedido.clienteUid || ""
          )
            .trim();

        if (clienteUid) {
          codigoClienteRef =
            db
              .collection(
                "usuarios"
              )
              .doc(
                clienteUid
              )
              .collection(
                "codigosCanjeados"
              )
              .doc(
                codigo
              );

          codigoClienteSnap =
            await transaction.get(
              codigoClienteRef
            );
        }

        if (
          codigoGlobalSnap.exists
        ) {
          const datosCodigo =
            codigoGlobalSnap.data();

          const usosActuales =
            Number(
              datosCodigo.usosRealizados
            ) || 0;

          transaction.update(
            codigoGlobalRef,
            {
              usosRealizados:
                Math.max(
                  0,
                  usosActuales - 1
                ),

              actualizadoEn:
                firebase.firestore
                  .FieldValue
                  .serverTimestamp()
            }
          );
        }

        if (
          codigoClienteRef &&
          codigoClienteSnap &&
          codigoClienteSnap.exists
        ) {
          const codigoCliente =
            codigoClienteSnap.data();

          const perteneceAlPedido =
            !codigoCliente.pedidoId ||
            codigoCliente.pedidoId ===
              pedidoId;

          if (perteneceAlPedido) {
            transaction.update(
              codigoClienteRef,
              {
                usado:
                  false,

                pedidoId:
                  null,

                usadoEn:
                  null,

                devueltoPorCancelacion:
                  true,

                devueltoEn:
                  firebase.firestore
                    .FieldValue
                    .serverTimestamp()
              }
            );
          }
        }

        transaction.update(
          pedidoRef,
          {
            codigoPromocionalCanjeDevuelto:
              true,

            codigoClienteDevuelto:
              Boolean(
                codigoClienteRef &&
                codigoClienteSnap &&
                codigoClienteSnap.exists
              ),

            fechaDevolucionCanje:
              firebase.firestore
                .FieldValue
                .serverTimestamp()
          }
        );
      }
    );

  } catch (error) {
    console.error(
      "No se pudo devolver la promoción:",
      error
    );
  }
}

if (
  typeof cancelarPedidoOriginalDreams ===
  "function"
) {
  window.cancelarPedido =
    async function (
      pedidoId
    ) {
      await cancelarPedidoOriginalDreams(
        pedidoId
      );

      const pedidoSnap =
        await db
          .collection(
            "recibos"
          )
          .doc(
            pedidoId
          )
          .get();

      if (!pedidoSnap.exists) {
        return;
      }

      const pedido =
        pedidoSnap.data();

      if (
        pedido.cancelado ||
        pedido.estado ===
          "cancelado"
      ) {
        await devolverPromocionPedidoCancelado(
          pedidoId
        );
      }
    };
}

async function devolverCanjeCodigoCancelado(
  pedidoId
) {
  try {
    await db.runTransaction(
      async transaction => {
        const pedidoRef =
          db
            .collection("recibos")
            .doc(pedidoId);

        const pedidoSnap =
          await transaction.get(
            pedidoRef
          );

        if (!pedidoSnap.exists) {
          return;
        }

        const pedido =
          pedidoSnap.data();

        if (
          !pedido.cancelado &&
          pedido.estado !== "cancelado"
        ) {
          return;
        }

        if (
          pedido.codigoPromocionalCanjeDevuelto ===
          true
        ) {
          return;
        }

        const promocion =
          pedido.codigoPromocional;

        const codigo =
          String(
            promocion?.codigo || ""
          )
            .trim()
            .toUpperCase();

        if (!codigo) {
          return;
        }

        const codigoRef =
          db
            .collection(
              "codigosPromocionales"
            )
            .doc(codigo);

        const codigoSnap =
          await transaction.get(
            codigoRef
          );

        if (!codigoSnap.exists) {
          return;
        }

        const datosCodigo =
          codigoSnap.data();

        const usosActuales =
          Number(
            datosCodigo.usosRealizados
          ) || 0;

        transaction.update(
          codigoRef,
          {
            usosRealizados:
              Math.max(
                0,
                usosActuales - 1
              ),
            actualizadoEn:
              firebase.firestore
                .FieldValue
                .serverTimestamp()
          }
        );

        transaction.update(
          pedidoRef,
          {
            codigoPromocionalCanjeDevuelto:
              true,
            fechaDevolucionCanje:
              firebase.firestore
                .FieldValue
                .serverTimestamp()
          }
        );
      }
    );

  } catch (error) {
    console.error(
      "No se pudo devolver el canje del código:",
      error
    );
  }
}

if (
  typeof cancelarPedidoOriginalDreams ===
  "function"
) {
  window.cancelarPedido =
    async function (
      pedidoId
    ) {
      await cancelarPedidoOriginalDreams(
        pedidoId
      );

      const pedidoSnap =
        await db
          .collection("recibos")
          .doc(pedidoId)
          .get();

      if (!pedidoSnap.exists) {
        return;
      }

      const pedido =
        pedidoSnap.data();

      if (
        pedido.cancelado ||
        pedido.estado === "cancelado"
      ) {
        await devolverCanjeCodigoCancelado(
          pedidoId
        );
      }
    };
}

