let usuarioCodigosCarrito =
  null;

let perfilCodigosCarrito =
  null;

let codigosCarritoInicializados =
  false;


function escapeCodigoCarrito(
  valor
) {
  return String(
    valor ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function fechaCodigoCarrito(
  valor
) {
  if (!valor) {
    return null;
  }

  if (
    typeof valor.toDate ===
    "function"
  ) {
    return valor.toDate();
  }

  if (
    typeof valor ===
      "object" &&
    Number.isFinite(
      Number(
        valor.seconds
      )
    )
  ) {
    return new Date(
      Number(
        valor.seconds
      ) * 1000
    );
  }

  const fecha =
    new Date(
      valor
    );

  return Number.isNaN(
    fecha.getTime()
  )
    ? null
    : fecha;
}


function formatearFechaCodigoCarrito(
  valor
) {
  const fecha =
    fechaCodigoCarrito(
      valor
    );

  if (!fecha) {
    return "Sin vencimiento";
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short"
    }
  ).format(
    fecha
  );
}


function descripcionCodigoCarrito(
  codigo
) {
  if (
    codigo.tipoBeneficio ===
    "productoGratis"
  ) {
    return `${
      codigo.productoGratisNombre ||
      "Artículo seleccionado"
    } gratis`;
  }

  const porcentaje =
    Number(
      codigo.porcentaje
    ) || 0;

  if (
    codigo.alcance ===
    "categoria"
  ) {
    return `${porcentaje}% de descuento en ${
      codigo.categoria ||
      "la categoría seleccionada"
    }`;
  }

  if (
    codigo.alcance ===
    "producto"
  ) {
    return `${porcentaje}% de descuento en ${
      codigo.productoNombre ||
      "el producto seleccionado"
    }`;
  }

  return `${porcentaje}% de descuento en toda tu compra`;
}


function estadoCodigoCarrito(
  guardado,
  global
) {
  if (
    guardado.usado ===
    true
  ) {
    return {
      disponible:
        false,

      texto:
        "Usado",

      clase:
        "used"
    };
  }

  if (!global) {
    return {
      disponible:
        false,

      texto:
        "No disponible",

      clase:
        "disabled"
    };
  }

  if (
    global.activo ===
    false
  ) {
    return {
      disponible:
        false,

      texto:
        "Desactivado",

      clase:
        "disabled"
    };
  }

  const ahora =
    new Date();

  const inicio =
    fechaCodigoCarrito(
      global.fechaInicio ||
      guardado.fechaInicio
    );

  const fin =
    fechaCodigoCarrito(
      global.fechaFin ||
      guardado.fechaFin
    );

  if (
    inicio &&
    ahora < inicio
  ) {
    return {
      disponible:
        false,

      texto:
        "Próximamente",

      clase:
        "disabled"
    };
  }

  if (
    fin &&
    ahora > fin
  ) {
    return {
      disponible:
        false,

      texto:
        "Vencido",

      clase:
        "expired"
    };
  }

  const limite =
    Number(
      global.limiteUsos
    ) || 0;

  const usados =
    Number(
      global.usosRealizados
    ) || 0;

  if (
    limite <= 0 ||
    usados >= limite
  ) {
    return {
      disponible:
        false,

      texto:
        "Agotado",

      clase:
        "expired"
    };
  }

  return {
    disponible:
      true,

    texto:
      "Disponible",

    clase:
      "available"
  };
}


function mostrarSinCodigosCarrito() {
  const contenedor =
    document.getElementById(
      "codigos-guardados-carrito"
    );

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = `
    <div class="saved-cart-code-empty">

      <i class="fa-solid fa-ticket"></i>

      <div>

        <strong>
          No tienes códigos disponibles
        </strong>

        <span>
          Puedes guardar promociones desde el menú principal.
        </span>

      </div>

    </div>
  `;
}


async function aplicarCodigoGuardadoCarrito(
  codigo
) {
  const input =
    document.getElementById(
      "codigo-promocional-input"
    );

  const boton =
    document.getElementById(
      "btn-aplicar-codigo"
    );

  if (
    !input ||
    !boton
  ) {
    return;
  }

  input.value =
    String(
      codigo || ""
    )
      .trim()
      .toUpperCase();

  boton.click();
}


async function cargarCodigosGuardadosCarrito() {
  const contenedor =
    document.getElementById(
      "codigos-guardados-carrito"
    );

  if (
    !contenedor ||
    !usuarioCodigosCarrito
  ) {
    return;
  }

  contenedor.innerHTML = `
    <div class="saved-cart-code-loading">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <span>
        Cargando tus códigos...
      </span>

    </div>
  `;

  try {
    const snapshot =
      await db
        .collection(
          "usuarios"
        )
        .doc(
          usuarioCodigosCarrito.uid
        )
        .collection(
          "codigosCanjeados"
        )
        .get();

    if (
      snapshot.empty
    ) {
      mostrarSinCodigosCarrito();

      return;
    }

    const guardados =
      snapshot.docs.map(
        documento => ({
          id:
            documento.id,

          ...documento.data()
        })
      );

    const globalesSnap =
      await Promise.all(
        guardados.map(
          codigo =>
            db
              .collection(
                "codigosPromocionales"
              )
              .doc(
                codigo.codigo
              )
              .get()
        )
      );

    const globales =
      new Map(
        globalesSnap.map(
          documento => [
            documento.id,

            documento.exists
              ? {
                  id:
                    documento.id,

                  ...documento.data()
                }
              : null
          ]
        )
      );

    const codigos =
      guardados.map(
        guardado => {
          const global =
            globales.get(
              guardado.codigo
            );

          const estado =
            estadoCodigoCarrito(
              guardado,
              global
            );

          return {
            guardado,
            global,
            estado
          };
        }
      );

    codigos.sort(
      (a, b) => {
        if (
          a.estado.disponible &&
          !b.estado.disponible
        ) {
          return -1;
        }

        if (
          !a.estado.disponible &&
          b.estado.disponible
        ) {
          return 1;
        }

        const fechaA =
          fechaCodigoCarrito(
            a.global?.fechaFin ||
            a.guardado.fechaFin
          );

        const fechaB =
          fechaCodigoCarrito(
            b.global?.fechaFin ||
            b.guardado.fechaFin
          );

        return (
          (
            fechaA?.getTime() ||
            Infinity
          ) -
          (
            fechaB?.getTime() ||
            Infinity
          )
        );
      }
    );

    contenedor.innerHTML =
      codigos
        .map(
          item => {
            const codigo =
              item.global ||
              item.guardado;

            const nombreCodigo =
              item.guardado.codigo;

            return `
              <article
                class="saved-cart-code ${
                  item.estado.disponible
                    ? ""
                    : "not-available"
                }"
              >

                <div class="saved-cart-code-icon">

                  <i class="fa-solid fa-ticket"></i>

                </div>

                <div class="saved-cart-code-info">

                  <div class="saved-cart-code-name">

                    <strong>
                      ${escapeCodigoCarrito(
                        nombreCodigo
                      )}
                    </strong>

                    <span
                      class="saved-cart-code-status ${item.estado.clase}"
                    >
                      ${escapeCodigoCarrito(
                        item.estado.texto
                      )}
                    </span>

                  </div>

                  <p>
                    ${escapeCodigoCarrito(
                      descripcionCodigoCarrito(
                        codigo
                      )
                    )}
                  </p>

                  <small>
                    Vence:
                    ${escapeCodigoCarrito(
                      formatearFechaCodigoCarrito(
                        codigo.fechaFin ||
                        item.guardado.fechaFin
                      )
                    )}
                  </small>

                </div>

                ${
                  item.estado.disponible
                    ? `
                      <button
                        type="button"
                        class="saved-cart-code-apply"
                        data-aplicar-codigo="${escapeCodigoCarrito(
                          nombreCodigo
                        )}"
                      >
                        Aplicar
                      </button>
                    `
                    : ""
                }

              </article>
            `;
          }
        )
        .join("");

    contenedor
      .querySelectorAll(
        "[data-aplicar-codigo]"
      )
      .forEach(
        boton => {
          boton.addEventListener(
            "click",
            () => {
              aplicarCodigoGuardadoCarrito(
                boton.dataset
                  .aplicarCodigo
              );
            }
          );
        }
      );

  } catch (error) {
    console.error(
      error
    );

    contenedor.innerHTML = `
      <div class="saved-cart-code-empty">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <div>

          <strong>
            No pudimos cargar tus códigos
          </strong>

          <span>
            Inténtalo nuevamente.
          </span>

        </div>

      </div>
    `;
  }
}


function iniciarCodigosCarrito(
  usuario,
  perfil
) {
  usuarioCodigosCarrito =
    usuario;

  perfilCodigosCarrito =
    perfil;

  if (
    codigosCarritoInicializados
  ) {
    cargarCodigosGuardadosCarrito();

    return;
  }

  codigosCarritoInicializados =
    true;

  cargarCodigosGuardadosCarrito();

  document
    .getElementById(
      "btn-quitar-codigo"
    )
    ?.addEventListener(
      "click",
      () => {
        setTimeout(
          cargarCodigosGuardadosCarrito,
          100
        );
      }
    );
}


window.addEventListener(
  "dreams:cliente-listo",
  event => {
    iniciarCodigosCarrito(
      event.detail.usuario,
      event.detail.perfil
    );
  }
);


if (
  window.usuarioDreams &&
  window.perfilDreams
) {
  iniciarCodigosCarrito(
    window.usuarioDreams,
    window.perfilDreams
  );
}