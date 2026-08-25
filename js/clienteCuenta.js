let clienteCuentaUsuario = null;
let clienteCuentaPerfil = null;
let clienteCuentaInicializada = false;

function escapeClienteCuenta(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fechaClienteCuenta(valor) {
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
      Number(valor.seconds)
    )
  ) {
    return new Date(
      Number(
        valor.seconds
      ) * 1000
    );
  }

  const fecha =
    new Date(valor);

  return Number.isNaN(
    fecha.getTime()
  )
    ? null
    : fecha;
}

function formatearFechaClienteCuenta(
  valor
) {
  const fecha =
    fechaClienteCuenta(valor);

  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(fecha);
}

function abrirModalClienteCuenta(
  id
) {
  document
    .getElementById(id)
    ?.classList.add(
      "active"
    );

  document.body.style.overflow =
    "hidden";
}

function cerrarModalClienteCuenta(
  id
) {
  document
    .getElementById(id)
    ?.classList.remove(
      "active"
    );

  const algunoAbierto =
    [
      ...document.querySelectorAll(
        ".client-modal-overlay"
      )
    ].some(
      modal =>
        modal.classList.contains(
          "active"
        )
    );

  if (!algunoAbierto) {
    document.body.style.overflow =
      "";
  }
}

function cerrarMenuClienteCuenta() {
  document
    .getElementById(
      "mobile-menu"
    )
    ?.classList.remove(
      "active"
    );

  document
    .getElementById(
      "overlay"
    )
    ?.classList.remove(
      "active"
    );
}

function pintarAvatarCliente(
  elemento,
  foto
) {
  if (!elemento) {
    return;
  }

  if (foto) {
    elemento.innerHTML = `
      <img
        src="${escapeClienteCuenta(
          foto
        )}"
        alt="Foto de perfil"
      >
    `;

    return;
  }

  elemento.innerHTML = `
    <i class="fa-solid fa-user"></i>
  `;
}

function renderizarPerfilCliente() {
  if (
    !clienteCuentaUsuario ||
    !clienteCuentaPerfil
  ) {
    return;
  }

  const nombre =
    clienteCuentaPerfil.nombre ||
    clienteCuentaUsuario.displayName ||
    "Cliente Dreams";

  const email =
    clienteCuentaUsuario.email ||
    clienteCuentaPerfil.email ||
    "";

  const foto =
    clienteCuentaUsuario.photoURL ||
    clienteCuentaPerfil.foto ||
    "";

  document.getElementById(
    "menu-cliente-nombre"
  ).textContent =
    nombre;

  document.getElementById(
    "menu-cliente-email"
  ).textContent =
    email;

  document.getElementById(
    "cuenta-nombre"
  ).textContent =
    nombre;

  document.getElementById(
    "cuenta-email"
  ).textContent =
    email;

  document.getElementById(
    "cuenta-telefono"
  ).textContent =
    clienteCuentaPerfil.telefono ||
    "No registrado";

  document.getElementById(
    "cuenta-localidad"
  ).textContent =
    clienteCuentaPerfil.localidad ||
    "No registrada";

  pintarAvatarCliente(
    document.getElementById(
      "menu-cliente-avatar"
    ),
    foto
  );

  pintarAvatarCliente(
    document.getElementById(
      "cuenta-avatar"
    ),
    foto
  );
}

function mostrarMensajeCanje(
  mensaje,
  tipo = "error"
) {
  const elemento =
    document.getElementById(
      "mensaje-canjear-codigo-cuenta"
    );

  if (!elemento) {
    return;
  }

  elemento.className =
    `redeem-message show ${tipo}`;

  elemento.innerHTML = `
    <i class="${
      tipo === "success"
        ? "fa-solid fa-circle-check"
        : "fa-solid fa-circle-exclamation"
    }"></i>

    <span>
      ${escapeClienteCuenta(
        mensaje
      )}
    </span>
  `;
}

function limpiarMensajeCanje() {
  const elemento =
    document.getElementById(
      "mensaje-canjear-codigo-cuenta"
    );

  if (!elemento) {
    return;
  }

  elemento.className =
    "redeem-message";

  elemento.innerHTML =
    "";
}

function validarCodigoGlobalParaGuardar(
  codigo
) {
  if (!codigo) {
    return {
      valido: false,
      mensaje:
        "Este código no existe."
    };
  }

  if (
    codigo.activo ===
    false
  ) {
    return {
      valido: false,
      mensaje:
        "Este código no está disponible."
    };
  }

  const ahora =
    new Date();

  const inicio =
    fechaClienteCuenta(
      codigo.fechaInicio
    );

  const fin =
    fechaClienteCuenta(
      codigo.fechaFin
    );

  if (
    inicio &&
    ahora < inicio
  ) {
    return {
      valido: false,
      mensaje:
        "Este código todavía no está disponible."
    };
  }

  if (
    fin &&
    ahora > fin
  ) {
    return {
      valido: false,
      mensaje:
        "Este código ya venció."
    };
  }

  const limite =
    Number(
      codigo.limiteUsos
    ) || 0;

  const usados =
    Number(
      codigo.usosRealizados
    ) || 0;

  if (
    limite <= 0 ||
    usados >= limite
  ) {
    return {
      valido: false,
      mensaje:
        "Este código ya alcanzó su límite de usos."
    };
  }

  return {
    valido: true
  };
}

function descripcionBeneficioCodigo(
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

  return `${porcentaje}% de descuento en tu compra`;
}

async function canjearCodigoEnCuenta(
  event
) {
  event.preventDefault();

  if (
    !clienteCuentaUsuario ||
    !clienteCuentaPerfil
  ) {
    mostrarMensajeCanje(
      "No pudimos identificar tu cuenta. Vuelve a iniciar sesión."
    );

    return;
  }

  const input =
    document.getElementById(
      "input-canjear-codigo-cuenta"
    );

  const boton =
    document.getElementById(
      "btn-canjear-codigo-cuenta"
    );

  const codigoTexto =
    String(
      input?.value || ""
    )
      .trim()
      .toUpperCase();

  limpiarMensajeCanje();

  if (
    !/^[A-Z0-9_-]{3,30}$/.test(
      codigoTexto
    )
  ) {
    mostrarMensajeCanje(
      "Ingresa un código válido."
    );

    return;
  }

  boton.disabled =
    true;

  boton.textContent =
    "Validando...";

  try {
    const codigoRef =
      db
        .collection(
          "codigosPromocionales"
        )
        .doc(
          codigoTexto
        );

    const guardadoRef =
      db
        .collection(
          "usuarios"
        )
        .doc(
          clienteCuentaUsuario.uid
        )
        .collection(
          "codigosCanjeados"
        )
        .doc(
          codigoTexto
        );

    const [
      codigoSnap,
      guardadoSnap
    ] =
      await Promise.all([
        codigoRef.get(),
        guardadoRef.get()
      ]);

    if (
      guardadoSnap.exists
    ) {
      mostrarMensajeCanje(
        "Este código ya está guardado en tu cuenta.",
        "success"
      );

      return;
    }

    if (
      !codigoSnap.exists
    ) {
      throw new Error(
        "Este código no existe."
      );
    }

    const codigo = {
      id:
        codigoSnap.id,
      ...codigoSnap.data()
    };

    const validacion =
      validarCodigoGlobalParaGuardar(
        codigo
      );

    if (
      !validacion.valido
    ) {
      throw new Error(
        validacion.mensaje
      );
    }

    await guardadoRef.set({
      codigo:
        codigoTexto,

      tipoBeneficio:
        codigo.tipoBeneficio ||
        "porcentaje",

      porcentaje:
        Number(
          codigo.porcentaje
        ) || 0,

      alcance:
        codigo.alcance ||
        "",

      categoria:
        codigo.categoria ||
        "",

      productoId:
        codigo.productoId ||
        "",

      productoNombre:
        codigo.productoNombre ||
        "",

      productoGratisId:
        codigo.productoGratisId ||
        "",

      productoGratisNombre:
        codigo.productoGratisNombre ||
        "",

      fechaInicio:
        codigo.fechaInicio ||
        null,

      fechaFin:
        codigo.fechaFin ||
        null,

      usado:
        false,

      pedidoId:
        null,

      guardadoEn:
        firebase.firestore
          .FieldValue
          .serverTimestamp()
    });

    input.value =
      "";

    mostrarMensajeCanje(
      `${codigoTexto} se guardó correctamente en tu cuenta.`,
      "success"
    );

    await cargarCodigosCliente();

  } catch (error) {
    console.error(
      error
    );

    mostrarMensajeCanje(
      error.message ||
      "No pudimos guardar este código."
    );

  } finally {
    boton.disabled =
      false;

    boton.textContent =
      "Guardar código en mi cuenta";
  }
}

function obtenerEstadoCodigoGuardado(
  codigoGuardado,
  codigoGlobal
) {
  if (
    codigoGuardado.usado ===
    true
  ) {
    return {
      texto:
        "Usado",
      clase:
        "usado"
    };
  }

  const ahora =
    new Date();

  const fin =
    fechaClienteCuenta(
      codigoGuardado.fechaFin ||
      codigoGlobal?.fechaFin
    );

  if (
    fin &&
    ahora > fin
  ) {
    return {
      texto:
        "Vencido",
      clase:
        "vencido"
    };
  }

  if (
    codigoGlobal
  ) {
    const limite =
      Number(
        codigoGlobal.limiteUsos
      ) || 0;

    const usados =
      Number(
        codigoGlobal.usosRealizados
      ) || 0;

    if (
      codigoGlobal.activo ===
        false ||
      limite <= 0 ||
      usados >= limite
    ) {
      return {
        texto:
          "Agotado",
        clase:
          "agotado"
      };
    }
  }

  return {
    texto:
      "Disponible",
    clase:
      "disponible"
  };
}

async function cargarCodigosCliente() {
  const contenedor =
    document.getElementById(
      "lista-codigos-cliente"
    );

  if (
    !contenedor ||
    !clienteCuentaUsuario
  ) {
    return;
  }

  contenedor.innerHTML = `
    <div class="saved-codes-empty">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <strong>
        Cargando tus códigos...
      </strong>

      <p>
        Un momento por favor.
      </p>

    </div>
  `;

  try {
    const snapshot =
      await db
        .collection(
          "usuarios"
        )
        .doc(
          clienteCuentaUsuario.uid
        )
        .collection(
          "codigosCanjeados"
        )
        .get();

    if (
      snapshot.empty
    ) {
      contenedor.innerHTML = `
        <div class="saved-codes-empty">

          <i class="fa-solid fa-ticket"></i>

          <strong>
            Aún no tienes códigos
          </strong>

          <p>
            Cuando canjees una promoción aparecerá aquí
            y permanecerá asociada a tu cuenta.
          </p>

        </div>
      `;

      return;
    }

    const codigos =
      snapshot.docs.map(
        doc => ({
          id:
            doc.id,
          ...doc.data()
        })
      );

    const globales =
      await Promise.all(
        codigos.map(
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

    const mapaGlobal =
      new Map(
        globales.map(
          doc => [
            doc.id,
            doc.exists
              ? {
                  id:
                    doc.id,
                  ...doc.data()
                }
              : null
          ]
        )
      );

    codigos.sort(
      (a, b) => {
        const fechaA =
          fechaClienteCuenta(
            a.guardadoEn
          );

        const fechaB =
          fechaClienteCuenta(
            b.guardadoEn
          );

        return (
          (
            fechaB?.getTime() ||
            0
          ) -
          (
            fechaA?.getTime() ||
            0
          )
        );
      }
    );

    contenedor.innerHTML =
      codigos
        .map(
          codigo => {
            const global =
              mapaGlobal.get(
                codigo.codigo
              );

            const estado =
              obtenerEstadoCodigoGuardado(
                codigo,
                global
              );

            return `
              <article class="saved-code-card">

                <div class="saved-code-top">

                  <div>

                    <span>
                      CÓDIGO
                    </span>

                    <strong>
                      ${escapeClienteCuenta(
                        codigo.codigo
                      )}
                    </strong>

                  </div>

                  <span
                    class="saved-code-status ${estado.clase}"
                  >
                    ${estado.texto}
                  </span>

                </div>

                <div class="saved-code-body">

                  <div class="saved-code-benefit">

                    ${escapeClienteCuenta(
                      descripcionBeneficioCodigo(
                        global ||
                        codigo
                      )
                    )}

                  </div>

                  <div class="saved-code-expiry">

                    Vence:

                    ${escapeClienteCuenta(
                      formatearFechaClienteCuenta(
                        codigo.fechaFin ||
                        global?.fechaFin
                      )
                    )}

                  </div>

                </div>

              </article>
            `;
          }
        )
        .join("");

  } catch (error) {
    console.error(
      error
    );

    contenedor.innerHTML = `
      <div class="saved-codes-empty">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          No pudimos cargar tus códigos
        </strong>

        <p>
          Inténtalo nuevamente en unos momentos.
        </p>

      </div>
    `;
  }
}

async function cerrarSesionCliente() {
  if (
    !confirm(
      "¿Quieres cerrar tu sesión?"
    )
  ) {
    return;
  }

  try {
    await auth.signOut();

    window.location.replace(
      "login.html"
    );

  } catch (error) {
    console.error(
      error
    );

    alert(
      "No pudimos cerrar la sesión. Inténtalo nuevamente."
    );
  }
}

function inicializarClienteCuenta(
  usuario,
  perfil
) {
  if (
    clienteCuentaInicializada
  ) {
    clienteCuentaUsuario =
      usuario;

    clienteCuentaPerfil =
      perfil;

    renderizarPerfilCliente();

    return;
  }

  clienteCuentaInicializada =
    true;

  clienteCuentaUsuario =
    usuario;

  clienteCuentaPerfil =
    perfil;

  renderizarPerfilCliente();

  document
    .getElementById(
      "menu-mi-cuenta"
    )
    ?.addEventListener(
      "click",
      () => {
        cerrarMenuClienteCuenta();

        abrirModalClienteCuenta(
          "modal-mi-cuenta"
        );
      }
    );

  document
    .getElementById(
      "menu-canjear-codigo"
    )
    ?.addEventListener(
      "click",
      () => {
        cerrarMenuClienteCuenta();

        limpiarMensajeCanje();

        abrirModalClienteCuenta(
          "modal-canjear-codigo"
        );

        setTimeout(
          () => {
            document
              .getElementById(
                "input-canjear-codigo-cuenta"
              )
              ?.focus();
          },
          100
        );
      }
    );

  document
    .getElementById(
      "menu-mis-codigos"
    )
    ?.addEventListener(
      "click",
      async () => {
        cerrarMenuClienteCuenta();

        abrirModalClienteCuenta(
          "modal-mis-codigos"
        );

        await cargarCodigosCliente();
      }
    );

  document
    .getElementById(
      "menu-cerrar-sesion"
    )
    ?.addEventListener(
      "click",
      cerrarSesionCliente
    );

  document
    .getElementById(
      "form-canjear-codigo-cuenta"
    )
    ?.addEventListener(
      "submit",
      canjearCodigoEnCuenta
    );

  document
    .getElementById(
      "input-canjear-codigo-cuenta"
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

        limpiarMensajeCanje();
      }
    );

  document
    .querySelectorAll(
      "[data-close-client-modal]"
    )
    .forEach(
      boton => {
        boton.addEventListener(
          "click",
          () => {
            cerrarModalClienteCuenta(
              boton.dataset
                .closeClientModal
            );
          }
        );
      }
    );

  document
    .querySelectorAll(
      ".client-modal-overlay"
    )
    .forEach(
      overlay => {
        overlay.addEventListener(
          "click",
          event => {
            if (
              event.target ===
              overlay
            ) {
              cerrarModalClienteCuenta(
                overlay.id
              );
            }
          }
        );
      }
    );
}

window.addEventListener(
  "dreams:cliente-listo",
  event => {
    inicializarClienteCuenta(
      event.detail.usuario,
      event.detail.perfil
    );
  }
);

if (
  window.usuarioDreams &&
  window.perfilDreams
) {
  inicializarClienteCuenta(
    window.usuarioDreams,
    window.perfilDreams
  );
}