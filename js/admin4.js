(() => {
  let usuariosAdmin = [];
  let busquedaUsuarios = "";
  let filtroRolUsuarios = "todos";

  const listaUsuarios =
    document.getElementById(
      "lista-usuarios-admin"
    );

  const inputBusqueda =
    document.getElementById(
      "buscar-usuario-admin"
    );

  const selectRol =
    document.getElementById(
      "filtro-rol-usuarios"
    );

  const totalUsuarios =
    document.getElementById(
      "total-usuarios"
    );

  const totalClientes =
    document.getElementById(
      "total-clientes"
    );

  const totalAdministradores =
    document.getElementById(
      "total-administradores"
    );

  const usuariosNuevosMes =
    document.getElementById(
      "usuarios-nuevos-mes"
    );

  const visitasHoy =
    document.getElementById(
      "visitas-hoy"
    );

  const visitasSemana =
    document.getElementById(
      "visitas-semana"
    );

  const visitasMes =
    document.getElementById(
      "visitas-mes"
    );

  const visitantesUnicos =
    document.getElementById(
      "visitantes-unicos"
    );

  const estadoVisitas =
    document.getElementById(
      "estado-estadisticas-visitas"
    );

  if (!listaUsuarios) {
    return;
  }

  function escaparHTML(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizarTexto(valor) {
    return String(valor ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );
  }

  function convertirFecha(valor) {
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
      typeof valor === "object" &&
      Number.isFinite(
        Number(valor.seconds)
      )
    ) {
      return new Date(
        Number(valor.seconds) *
          1000
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

  function formatearFecha(valor) {
    const fecha =
      convertirFecha(valor);

    if (!fecha) {
      return "Sin fecha";
    }

    return new Intl.DateTimeFormat(
      "es-MX",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ).format(fecha);
  }

  function formatearFechaAcceso(
    valor
  ) {
    const fecha =
      convertirFecha(valor);

    if (!fecha) {
      return "Sin acceso registrado";
    }

    return new Intl.DateTimeFormat(
      "es-MX",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    ).format(fecha);
  }

  function obtenerRol(usuario) {
    return String(
      usuario?.rol || "cliente"
    )
      .trim()
      .toLowerCase();
  }

  function obtenerNombre(usuario) {
    const nombre =
      String(
        usuario?.nombre || ""
      ).trim();

    if (nombre) {
      return nombre;
    }

    const correo =
      String(
        usuario?.email || ""
      ).trim();

    if (correo) {
      const parteCorreo =
        correo.split("@")[0] ||
        "";

      if (parteCorreo) {
        return parteCorreo;
      }
    }

    return "Usuario Dreams";
  }

  function obtenerIniciales(
    usuario
  ) {
    const nombre =
      obtenerNombre(usuario)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!nombre.length) {
      return "DC";
    }

    if (nombre.length === 1) {
      return nombre[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      nombre[0].charAt(0) +
      nombre[
        nombre.length - 1
      ].charAt(0)
    ).toUpperCase();
  }

  function obtenerProveedor(
    usuario
  ) {
    const proveedor =
      String(
        usuario?.proveedor || ""
      )
        .trim()
        .toLowerCase();

    if (
      proveedor === "google.com"
    ) {
      return "Google";
    }

    if (
      proveedor === "password"
    ) {
      return "Correo y contraseña";
    }

    if (proveedor) {
      return proveedor;
    }

    return "Cuenta";
  }

  function perteneceAlMesActual(
    valor
  ) {
    const fecha =
      convertirFecha(valor);

    if (!fecha) {
      return false;
    }

    const ahora =
      new Date();

    return (
      fecha.getFullYear() ===
        ahora.getFullYear() &&
      fecha.getMonth() ===
        ahora.getMonth()
    );
  }

  function actualizarResumenUsuarios() {
    const total =
      usuariosAdmin.length;

    const clientes =
      usuariosAdmin.filter(
        usuario =>
          obtenerRol(usuario) ===
          "cliente"
      ).length;

    const administradores =
      usuariosAdmin.filter(
        usuario =>
          obtenerRol(usuario) ===
          "admin"
      ).length;

    const nuevos =
      usuariosAdmin.filter(
        usuario =>
          perteneceAlMesActual(
            usuario.creadoEn
          )
      ).length;

    if (totalUsuarios) {
      totalUsuarios.textContent =
        String(total);
    }

    if (totalClientes) {
      totalClientes.textContent =
        String(clientes);
    }

    if (
      totalAdministradores
    ) {
      totalAdministradores.textContent =
        String(
          administradores
        );
    }

    if (usuariosNuevosMes) {
      usuariosNuevosMes.textContent =
        String(nuevos);
    }
  }

  function obtenerUsuariosFiltrados() {
    const texto =
      normalizarTexto(
        busquedaUsuarios
      );

    return usuariosAdmin.filter(
      usuario => {
        const rol =
          obtenerRol(usuario);

        if (
          filtroRolUsuarios !==
            "todos" &&
          rol !== filtroRolUsuarios
        ) {
          return false;
        }

        if (!texto) {
          return true;
        }

        const contenido =
          normalizarTexto(
            [
              usuario.nombre,
              usuario.email,
              usuario.telefono,
              usuario.localidad,
              usuario.rol
            ]
              .filter(Boolean)
              .join(" ")
          );

        return contenido.includes(
          texto
        );
      }
    );
  }

  function ordenarUsuarios(lista) {
    return [...lista].sort(
      (a, b) => {
        const fechaA =
          convertirFecha(
            a.creadoEn
          )?.getTime() || 0;

        const fechaB =
          convertirFecha(
            b.creadoEn
          )?.getTime() || 0;

        return fechaB - fechaA;
      }
    );
  }

  function crearAvatar(usuario) {
    const foto =
      String(
        usuario?.foto || ""
      ).trim();

    if (foto) {
      return `
        <div class="user-admin-avatar">
          <img
            src="${escaparHTML(foto)}"
            alt="${escaparHTML(
              obtenerNombre(usuario)
            )}"
            loading="lazy"
          >
        </div>
      `;
    }

    return `
      <div class="user-admin-avatar">
        ${escaparHTML(
          obtenerIniciales(usuario)
        )}
      </div>
    `;
  }

  function crearBadgeRol(
    usuario
  ) {
    const rol =
      obtenerRol(usuario);

    if (rol === "admin") {
      return `
        <span class="user-role-badge admin">
          <i class="fa-solid fa-user-shield"></i>
          Administrador
        </span>
      `;
    }

    return `
      <span class="user-role-badge cliente">
        <i class="fa-solid fa-bag-shopping"></i>
        Cliente
      </span>
    `;
  }

  function renderizarUsuarios() {
    const usuarios =
      ordenarUsuarios(
        obtenerUsuariosFiltrados()
      );

    if (!usuarios.length) {
      listaUsuarios.innerHTML = `
        <div class="users-empty-state">

          <div>
            <i class="fa-solid fa-user-slash"></i>
          </div>

          <strong>
            No encontramos usuarios
          </strong>

          <span>
            Prueba con otra búsqueda o cambia el filtro seleccionado.
          </span>

        </div>
      `;

      return;
    }

    listaUsuarios.innerHTML = `
      <div class="users-table-header">

        <span>
          Usuario
        </span>

        <span>
          Contacto
        </span>

        <span>
          Rol
        </span>

        <span>
          Registro
        </span>

      </div>

      ${usuarios
        .map(usuario => {
          const nombre =
            obtenerNombre(
              usuario
            );

          const correo =
            String(
              usuario.email || ""
            ).trim();

          const telefono =
            String(
              usuario.telefono ||
                ""
            ).trim();

          const localidad =
            String(
              usuario.localidad ||
                ""
            ).trim();

          const proveedor =
            obtenerProveedor(
              usuario
            );

          const ultimoAcceso =
            formatearFechaAcceso(
              usuario.ultimoAcceso
            );

          return `
            <article
              class="user-admin-row"
              data-usuario-id="${escaparHTML(
                usuario.id
              )}"
            >

              <div class="user-admin-profile">

                ${crearAvatar(
                  usuario
                )}

                <div class="user-admin-profile-info">

                  <strong>
                    ${escaparHTML(
                      nombre
                    )}
                  </strong>

                  <span>
                    ${escaparHTML(
                      proveedor
                    )}
                  </span>

                </div>

              </div>


              <div class="user-admin-contact">

                <strong>
                  ${
                    correo
                      ? escaparHTML(
                          correo
                        )
                      : "Sin correo"
                  }
                </strong>

                <span>
                  ${
                    telefono
                      ? escaparHTML(
                          telefono
                        )
                      : "Sin teléfono"
                  }
                </span>

                ${
                  localidad
                    ? `
                      <span>
                        ${escaparHTML(
                          localidad
                        )}
                      </span>
                    `
                    : ""
                }

              </div>


              <div>
                ${crearBadgeRol(
                  usuario
                )}
              </div>


              <div class="user-register-date">

                <strong>
                  ${escaparHTML(
                    formatearFecha(
                      usuario.creadoEn
                    )
                  )}
                </strong>

                <span
                  title="${escaparHTML(
                    ultimoAcceso
                  )}"
                >
                  Último acceso:
                  ${escaparHTML(
                    ultimoAcceso
                  )}
                </span>

              </div>

            </article>
          `;
        })
        .join("")}
    `;
  }

  function mostrarErrorUsuarios(
    error
  ) {
    console.error(
      "Error cargando usuarios:",
      error
    );

    listaUsuarios.innerHTML = `
      <div class="users-empty-state">

        <div>
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>

        <strong>
          No pudimos cargar los usuarios
        </strong>

        <span>
          Revisa los permisos de Firestore y vuelve a intentarlo.
        </span>

      </div>
    `;
  }

  function cargarUsuarios() {
    return db
      .collection("usuarios")
      .onSnapshot(
        snapshot => {
          usuariosAdmin =
            snapshot.docs.map(
              documento => ({
                id:
                  documento.id,
                ...documento.data()
              })
            );

          actualizarResumenUsuarios();

          renderizarUsuarios();
        },
        error => {
          mostrarErrorUsuarios(
            error
          );
        }
      );
  }

  function inicioSemanaActual() {
    const ahora =
      new Date();

    const fecha =
      new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
      );

    const dia =
      fecha.getDay();

    const diferencia =
      dia === 0
        ? 6
        : dia - 1;

    fecha.setDate(
      fecha.getDate() -
        diferencia
    );

    fecha.setHours(
      0,
      0,
      0,
      0
    );

    return fecha;
  }

  function inicioMesActual() {
    const ahora =
      new Date();

    return new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
  }

  function esMismoDia(
    fechaA,
    fechaB
  ) {
    return (
      fechaA.getFullYear() ===
        fechaB.getFullYear() &&
      fechaA.getMonth() ===
        fechaB.getMonth() &&
      fechaA.getDate() ===
        fechaB.getDate()
    );
  }

  async function cargarEstadisticasVisitas() {
    try {
      const ahora =
        new Date();

      const inicioSemana =
        inicioSemanaActual();

      const inicioMes =
        inicioMesActual();

      const inicioConsulta =
        inicioSemana <
        inicioMes
          ? inicioSemana
          : inicioMes;

      const [
        traficoDoc,
        diasSnapshot
      ] =
        await Promise.all([
          db
            .collection(
              "estadisticas"
            )
            .doc("trafico")
            .get(),

          db
            .collection(
              "visitasDiarias"
            )
            .where(
              "fecha",
              ">=",
              firebase.firestore
                .Timestamp
                .fromDate(
                  inicioConsulta
                )
            )
            .get()
        ]);

      let hoy = 0;
      let semana = 0;
      let mes = 0;

      diasSnapshot.forEach(
        documento => {
          const datos =
            documento.data();

          const fecha =
            convertirFecha(
              datos.fecha
            );

          const cantidad =
            Number(
              datos.visitas
            ) || 0;

          if (!fecha) {
            return;
          }

          if (
            esMismoDia(
              fecha,
              ahora
            )
          ) {
            hoy += cantidad;
          }

          if (
            fecha >= inicioSemana
          ) {
            semana += cantidad;
          }

          if (
            fecha >= inicioMes
          ) {
            mes += cantidad;
          }
        }
      );

      const trafico =
        traficoDoc.exists
          ? traficoDoc.data()
          : {};

      const unicos =
        Number(
          trafico.visitantesUnicos
        ) || 0;

      if (visitasHoy) {
        visitasHoy.textContent =
          hoy.toLocaleString(
            "es-MX"
          );
      }

      if (visitasSemana) {
        visitasSemana.textContent =
          semana.toLocaleString(
            "es-MX"
          );
      }

      if (visitasMes) {
        visitasMes.textContent =
          mes.toLocaleString(
            "es-MX"
          );
      }

      if (visitantesUnicos) {
        visitantesUnicos.textContent =
          unicos.toLocaleString(
            "es-MX"
          );
      }

      if (estadoVisitas) {
        estadoVisitas.classList.add(
          "active"
        );

        estadoVisitas.innerHTML = `
          <i class="fa-solid fa-circle-check"></i>
          Activo
        `;
      }
    } catch (error) {
      console.error(
        "No se pudieron cargar las estadísticas:",
        error
      );

      if (estadoVisitas) {
        estadoVisitas.classList.remove(
          "active"
        );

        estadoVisitas.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation"></i>
          Sin datos
        `;
      }
    }
  }

  inputBusqueda?.addEventListener(
    "input",
    event => {
      busquedaUsuarios =
        event.target.value ||
        "";

      renderizarUsuarios();
    }
  );

  selectRol?.addEventListener(
    "change",
    event => {
      filtroRolUsuarios =
        event.target.value ||
        "todos";

      renderizarUsuarios();
    }
  );

  cargarUsuarios();

  cargarEstadisticasVisitas();

  setInterval(
    cargarEstadisticasVisitas,
    60000
  );
})();