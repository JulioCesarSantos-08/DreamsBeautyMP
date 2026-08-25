const loginForm =
  document.getElementById("login-form");

const registroForm =
  document.getElementById("registro-form");

const perfilForm =
  document.getElementById("perfil-form");

const resetForm =
  document.getElementById("reset-form");

const loginMensaje =
  document.getElementById("login-mensaje");

const registroMensaje =
  document.getElementById("registro-mensaje");

const perfilError =
  document.getElementById("perfil-error");

const resetMensaje =
  document.getElementById("reset-mensaje");

const perfilOverlay =
  document.getElementById("perfil-overlay");

const resetOverlay =
  document.getElementById("reset-overlay");

const authLoading =
  document.getElementById("auth-loading");

const loadingTitulo =
  document.getElementById("loading-titulo");

const loadingTexto =
  document.getElementById("loading-texto");

const btnLogin =
  document.getElementById("btn-login");

const btnRegistro =
  document.getElementById("btn-registro");

const btnGoogleLogin =
  document.getElementById("btn-google-login");

const btnGoogleRegistro =
  document.getElementById("btn-google-registro");

const btnGuardarPerfil =
  document.getElementById("btn-guardar-perfil");

const btnReset =
  document.getElementById("btn-reset");

let usuarioPerfilPendiente =
  null;

let procesandoUsuario =
  false;

function mostrarLoading(
  titulo = "Revisando tu cuenta",
  texto = "Un momento por favor."
) {
  if (loadingTitulo) {
    loadingTitulo.textContent =
      titulo;
  }

  if (loadingTexto) {
    loadingTexto.textContent =
      texto;
  }

  authLoading?.classList.add(
    "active"
  );
}

function ocultarLoading() {
  authLoading?.classList.remove(
    "active"
  );
}

function mostrarMensaje(
  elemento,
  mensaje,
  tipo = "error"
) {
  if (!elemento) {
    return;
  }

  elemento.textContent =
    mensaje;

  elemento.className =
    `auth-message ${tipo}`;
}

function limpiarMensaje(
  elemento
) {
  if (!elemento) {
    return;
  }

  elemento.textContent =
    "";

  elemento.className =
    "auth-message";
}

function mostrarMensajeReset(
  mensaje,
  tipo = "error"
) {
  if (!resetMensaje) {
    return;
  }

  resetMensaje.textContent =
    mensaje;

  resetMensaje.className =
    `reset-message ${tipo}`;
}

function limpiarMensajeReset() {
  if (!resetMensaje) {
    return;
  }

  resetMensaje.textContent =
    "";

  resetMensaje.className =
    "reset-message";
}

function normalizarCorreo(
  correo
) {
  return String(
    correo || ""
  )
    .trim()
    .toLowerCase();
}

function limpiarTelefono(
  telefono
) {
  return String(
    telefono || ""
  )
    .replace(/\D/g, "");
}

function traducirErrorAuth(
  error
) {
  const codigo =
    error?.code || "";

  if (
    codigo ===
    "auth/invalid-email"
  ) {
    return "El correo electrónico no es válido.";
  }

  if (
    codigo ===
    "auth/user-disabled"
  ) {
    return "Esta cuenta ha sido deshabilitada.";
  }

  if (
    codigo ===
      "auth/user-not-found" ||
    codigo ===
      "auth/wrong-password" ||
    codigo ===
      "auth/invalid-credential" ||
    codigo ===
      "auth/invalid-login-credentials"
  ) {
    return "Correo o contraseña incorrectos.";
  }

  if (
    codigo ===
    "auth/email-already-in-use"
  ) {
    return "Ya existe una cuenta registrada con este correo.";
  }

  if (
    codigo ===
    "auth/weak-password"
  ) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }

  if (
    codigo ===
    "auth/too-many-requests"
  ) {
    return "Se realizaron demasiados intentos. Espera unos minutos e inténtalo nuevamente.";
  }

  if (
    codigo ===
    "auth/network-request-failed"
  ) {
    return "No pudimos conectarnos. Revisa tu conexión a internet.";
  }

  if (
    codigo ===
    "auth/popup-closed-by-user"
  ) {
    return "Se cerró la ventana de Google antes de terminar.";
  }

  if (
    codigo ===
    "auth/popup-blocked"
  ) {
    return "El navegador bloqueó la ventana de Google. Permite ventanas emergentes e inténtalo nuevamente.";
  }

  if (
    codigo ===
    "auth/cancelled-popup-request"
  ) {
    return "";
  }

  if (
    codigo ===
    "auth/account-exists-with-different-credential"
  ) {
    return "Ya existe una cuenta con este correo utilizando otro método de acceso.";
  }

  if (
    codigo ===
    "auth/operation-not-allowed"
  ) {
    return "Este método de acceso todavía no está habilitado en Firebase.";
  }

  if (
    codigo ===
    "auth/unauthorized-domain"
  ) {
    return "Este dominio todavía no está autorizado en Firebase Authentication.";
  }

  return (
    error?.message ||
    "Ocurrió un problema. Inténtalo nuevamente."
  );
}

function cambiarVistaAuth(
  vista
) {
  document
    .querySelectorAll(
      ".auth-tab"
    )
    .forEach(
      boton => {
        boton.classList.toggle(
          "active",
          boton.dataset.authTab ===
            vista
        );
      }
    );

  document
    .querySelectorAll(
      ".auth-view"
    )
    .forEach(
      seccion => {
        seccion.classList.remove(
          "active"
        );
      }
    );

  document
    .getElementById(
      vista === "login"
        ? "vista-login"
        : "vista-registro"
    )
    ?.classList.add(
      "active"
    );

  limpiarMensaje(
    loginMensaje
  );

  limpiarMensaje(
    registroMensaje
  );
}

function configurarAvatar(
  usuario,
  datosUsuario = {}
) {
  const avatar =
    document.getElementById(
      "perfil-avatar"
    );

  if (!avatar) {
    return;
  }

  const foto =
    usuario?.photoURL ||
    datosUsuario.foto ||
    "";

  if (foto) {
    avatar.innerHTML = `
      <img
        src="${foto}"
        alt="Perfil"
      >
    `;

    return;
  }

  avatar.innerHTML = `
    <i class="fa-solid fa-user"></i>
  `;
}

function abrirPerfil(
  usuario,
  datosUsuario = {}
) {
  usuarioPerfilPendiente =
    usuario;

  configurarAvatar(
    usuario,
    datosUsuario
  );

  const nombre =
    document.getElementById(
      "perfil-nombre"
    );

  const telefono =
    document.getElementById(
      "perfil-telefono"
    );

  const localidad =
    document.getElementById(
      "perfil-localidad"
    );

  if (nombre) {
    nombre.value =
      datosUsuario.nombre ||
      usuario.displayName ||
      "";
  }

  if (telefono) {
    telefono.value =
      datosUsuario.telefono ||
      "";
  }

  if (localidad) {
    localidad.value =
      datosUsuario.localidad ||
      "";
  }

  if (perfilError) {
    perfilError.textContent =
      "";
  }

  ocultarLoading();

  perfilOverlay?.classList.add(
    "active"
  );

  document.body.style.overflow =
    "hidden";
}

function cerrarPerfil() {
  perfilOverlay?.classList.remove(
    "active"
  );

  document.body.style.overflow =
    "";

  usuarioPerfilPendiente =
    null;
}

async function crearPerfilInicial(
  usuario
) {
  const referencia =
    db
      .collection("usuarios")
      .doc(usuario.uid);

  const documento =
    await referencia.get();

  if (documento.exists) {
    return documento.data();
  }

  const datos = {
    uid:
      usuario.uid,
    email:
      normalizarCorreo(
        usuario.email
      ),
    nombre:
      usuario.displayName ||
      "",
    foto:
      usuario.photoURL ||
      "",
    telefono:
      "",
    localidad:
      "",
    rol:
      "cliente",
    perfilCompleto:
      false,
    proveedor:
      usuario.providerData?.[0]
        ?.providerId ||
      "password",
    creadoEn:
      firebase.firestore
        .FieldValue
        .serverTimestamp(),
    ultimoAcceso:
      firebase.firestore
        .FieldValue
        .serverTimestamp()
  };

  await referencia.set(
    datos
  );

  return datos;
}

async function actualizarUltimoAcceso(
  usuario
) {
  try {
    await db
      .collection("usuarios")
      .doc(usuario.uid)
      .set(
        {
          email:
            normalizarCorreo(
              usuario.email
            ),
          foto:
            usuario.photoURL ||
            "",
          ultimoAcceso:
            firebase.firestore
              .FieldValue
              .serverTimestamp()
        },
        {
          merge: true
        }
      );
  } catch (error) {
    console.error(
      error
    );
  }
}

async function resolverUsuario(
  usuario
) {
  if (
    !usuario ||
    procesandoUsuario
  ) {
    return;
  }

  procesandoUsuario =
    true;

  mostrarLoading(
    "Revisando tu cuenta",
    "Estamos preparando tu acceso."
  );

  try {
    const referencia =
      db
        .collection(
          "usuarios"
        )
        .doc(
          usuario.uid
        );

    let documento =
      await referencia.get();

    let datosUsuario;

    if (!documento.exists) {
      datosUsuario =
        await crearPerfilInicial(
          usuario
        );
    } else {
      datosUsuario =
        documento.data();

      await actualizarUltimoAcceso(
        usuario
      );
    }

    const rol =
      String(
        datosUsuario.rol ||
        "cliente"
      )
        .trim()
        .toLowerCase();

    if (
      rol ===
      "admin"
    ) {
      window.location.replace(
        "admin.html"
      );

      return;
    }

    if (
      rol !==
      "cliente"
    ) {
      await referencia.set(
        {
          rol:
            "cliente"
        },
        {
          merge: true
        }
      );

      datosUsuario.rol =
        "cliente";
    }

    if (
      datosUsuario.perfilCompleto !==
      true
    ) {
      procesandoUsuario =
        false;

      abrirPerfil(
        usuario,
        datosUsuario
      );

      return;
    }

    window.location.replace(
      "index.html"
    );

  } catch (error) {
    console.error(
      error
    );

    procesandoUsuario =
      false;

    ocultarLoading();

    mostrarMensaje(
      loginMensaje,
      "No pudimos cargar la información de tu cuenta. Inténtalo nuevamente."
    );
  }
}

document
  .querySelectorAll(
    ".auth-tab"
  )
  .forEach(
    boton => {
      boton.addEventListener(
        "click",
        () => {
          cambiarVistaAuth(
            boton.dataset.authTab
          );
        }
      );
    }
  );

document
  .querySelectorAll(
    "[data-toggle-password]"
  )
  .forEach(
    boton => {
      boton.addEventListener(
        "click",
        () => {
          const id =
            boton.dataset
              .togglePassword;

          const input =
            document.getElementById(
              id
            );

          if (!input) {
            return;
          }

          const visible =
            input.type ===
            "text";

          input.type =
            visible
              ? "password"
              : "text";

          boton.innerHTML =
            visible
              ? '<i class="fa-regular fa-eye"></i>'
              : '<i class="fa-regular fa-eye-slash"></i>';
        }
      );
    }
  );

loginForm?.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    limpiarMensaje(
      loginMensaje
    );

    const correo =
      normalizarCorreo(
        document
          .getElementById(
            "login-correo"
          )
          .value
      );

    const contrasena =
      document
        .getElementById(
          "login-contrasena"
        )
        .value;

    if (
      !correo ||
      !contrasena
    ) {
      mostrarMensaje(
        loginMensaje,
        "Completa tu correo y contraseña."
      );

      return;
    }

    btnLogin.disabled =
      true;

    btnLogin.textContent =
      "Ingresando...";

    mostrarLoading(
      "Iniciando sesión",
      "Estamos verificando tus datos."
    );

    try {
      await auth
        .signInWithEmailAndPassword(
          correo,
          contrasena
        );

    } catch (error) {
      console.error(
        error
      );

      ocultarLoading();

      const mensaje =
        traducirErrorAuth(
          error
        );

      if (mensaje) {
        mostrarMensaje(
          loginMensaje,
          mensaje
        );
      }

      btnLogin.disabled =
        false;

      btnLogin.textContent =
        "Iniciar sesión";
    }
  }
);

registroForm?.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    limpiarMensaje(
      registroMensaje
    );

    const correo =
      normalizarCorreo(
        document
          .getElementById(
            "registro-correo"
          )
          .value
      );

    const contrasena =
      document
        .getElementById(
          "registro-contrasena"
        )
        .value;

    const confirmar =
      document
        .getElementById(
          "registro-confirmar"
        )
        .value;

    if (!correo) {
      mostrarMensaje(
        registroMensaje,
        "Ingresa un correo electrónico."
      );

      return;
    }

    if (
      contrasena.length < 6
    ) {
      mostrarMensaje(
        registroMensaje,
        "La contraseña debe tener al menos 6 caracteres."
      );

      return;
    }

    if (
      contrasena !==
      confirmar
    ) {
      mostrarMensaje(
        registroMensaje,
        "Las contraseñas no coinciden."
      );

      return;
    }

    btnRegistro.disabled =
      true;

    btnRegistro.textContent =
      "Creando cuenta...";

    mostrarLoading(
      "Creando tu cuenta",
      "Esto tomará solo un momento."
    );

    try {
      const credencial =
        await auth
          .createUserWithEmailAndPassword(
            correo,
            contrasena
          );

      const usuario =
        credencial.user;

      await db
        .collection(
          "usuarios"
        )
        .doc(
          usuario.uid
        )
        .set(
          {
            uid:
              usuario.uid,
            email:
              correo,
            nombre:
              "",
            foto:
              "",
            telefono:
              "",
            localidad:
              "",
            rol:
              "cliente",
            perfilCompleto:
              false,
            proveedor:
              "password",
            creadoEn:
              firebase.firestore
                .FieldValue
                .serverTimestamp(),
            ultimoAcceso:
              firebase.firestore
                .FieldValue
                .serverTimestamp()
          },
          {
            merge: true
          }
        );

      procesandoUsuario =
        false;

      await resolverUsuario(
        usuario
      );

    } catch (error) {
      console.error(
        error
      );

      procesandoUsuario =
        false;

      ocultarLoading();

      mostrarMensaje(
        registroMensaje,
        traducirErrorAuth(
          error
        )
      );

      btnRegistro.disabled =
        false;

      btnRegistro.textContent =
        "Crear mi cuenta";
    }
  }
);

async function entrarConGoogle(
  boton,
  mensajeElemento
) {
  limpiarMensaje(
    loginMensaje
  );

  limpiarMensaje(
    registroMensaje
  );

  boton.disabled =
    true;

  mostrarLoading(
    "Conectando con Google",
    "Selecciona la cuenta que deseas utilizar."
  );

  try {
    const proveedor =
      new firebase.auth
        .GoogleAuthProvider();

    proveedor.setCustomParameters({
      prompt:
        "select_account"
    });

    const resultado =
      await auth
        .signInWithPopup(
          proveedor
        );

    const usuario =
      resultado.user;

    const referencia =
      db
        .collection(
          "usuarios"
        )
        .doc(
          usuario.uid
        );

    const documento =
      await referencia.get();

    if (!documento.exists) {
      await referencia.set({
        uid:
          usuario.uid,
        email:
          normalizarCorreo(
            usuario.email
          ),
        nombre:
          usuario.displayName ||
          "",
        foto:
          usuario.photoURL ||
          "",
        telefono:
          "",
        localidad:
          "",
        rol:
          "cliente",
        perfilCompleto:
          false,
        proveedor:
          "google.com",
        creadoEn:
          firebase.firestore
            .FieldValue
            .serverTimestamp(),
        ultimoAcceso:
          firebase.firestore
            .FieldValue
            .serverTimestamp()
      });
    } else {
      await referencia.set(
        {
          email:
            normalizarCorreo(
              usuario.email
            ),
          foto:
            usuario.photoURL ||
            documento.data()
              .foto ||
            "",
          ultimoAcceso:
            firebase.firestore
              .FieldValue
              .serverTimestamp()
        },
        {
          merge: true
        }
      );
    }

    procesandoUsuario =
      false;

    await resolverUsuario(
      usuario
    );

  } catch (error) {
    console.error(
      error
    );

    procesandoUsuario =
      false;

    ocultarLoading();

    const mensaje =
      traducirErrorAuth(
        error
      );

    if (mensaje) {
      mostrarMensaje(
        mensajeElemento,
        mensaje
      );
    }

    boton.disabled =
      false;
  }
}

btnGoogleLogin?.addEventListener(
  "click",
  () => {
    entrarConGoogle(
      btnGoogleLogin,
      loginMensaje
    );
  }
);

btnGoogleRegistro?.addEventListener(
  "click",
  () => {
    entrarConGoogle(
      btnGoogleRegistro,
      registroMensaje
    );
  }
);

perfilForm?.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    if (
      !usuarioPerfilPendiente
    ) {
      return;
    }

    perfilError.textContent =
      "";

    const nombre =
      document
        .getElementById(
          "perfil-nombre"
        )
        .value
        .trim()
        .replace(
          /\s+/g,
          " "
        );

    const telefono =
      limpiarTelefono(
        document
          .getElementById(
            "perfil-telefono"
          )
          .value
      );

    const localidad =
      document
        .getElementById(
          "perfil-localidad"
        )
        .value
        .trim()
        .replace(
          /\s+/g,
          " "
        );

    if (
      nombre.length <= 10
    ) {
      perfilError.textContent =
        "El nombre completo debe tener más de 10 caracteres.";

      document
        .getElementById(
          "perfil-nombre"
        )
        .focus();

      return;
    }

    if (
      telefono.length < 10
    ) {
      perfilError.textContent =
        "El número de celular debe contener mínimo 10 dígitos.";

      document
        .getElementById(
          "perfil-telefono"
        )
        .focus();

      return;
    }

    if (
      localidad.length < 2
    ) {
      perfilError.textContent =
        "Escribe de dónde eres.";

      document
        .getElementById(
          "perfil-localidad"
        )
        .focus();

      return;
    }

    btnGuardarPerfil.disabled =
      true;

    btnGuardarPerfil.textContent =
      "Guardando...";

    mostrarLoading(
      "Guardando tu perfil",
      "Estamos preparando tu cuenta."
    );

    try {
      const usuario =
        usuarioPerfilPendiente;

      await db
        .collection(
          "usuarios"
        )
        .doc(
          usuario.uid
        )
        .set(
          {
            uid:
              usuario.uid,
            email:
              normalizarCorreo(
                usuario.email
              ),
            nombre,
            telefono,
            localidad,
            foto:
              usuario.photoURL ||
              "",
            rol:
              "cliente",
            perfilCompleto:
              true,
            perfilActualizadoEn:
              firebase.firestore
                .FieldValue
                .serverTimestamp(),
            ultimoAcceso:
              firebase.firestore
                .FieldValue
                .serverTimestamp()
          },
          {
            merge: true
          }
        );

      if (
        usuario.displayName !==
        nombre
      ) {
        await usuario.updateProfile({
          displayName:
            nombre
        });
      }

      cerrarPerfil();

      window.location.replace(
        "index.html"
      );

    } catch (error) {
      console.error(
        error
      );

      ocultarLoading();

      perfilError.textContent =
        "No pudimos guardar tu información. Inténtalo nuevamente.";

      btnGuardarPerfil.disabled =
        false;

      btnGuardarPerfil.textContent =
        "Guardar y entrar a la tienda";
    }
  }
);

document
  .getElementById(
    "perfil-telefono"
  )
  ?.addEventListener(
    "input",
    event => {
      event.target.value =
        event.target.value
          .replace(/\D/g, "")
          .slice(0, 15);
    }
  );

document
  .getElementById(
    "btn-olvide-contrasena"
  )
  ?.addEventListener(
    "click",
    () => {
      limpiarMensajeReset();

      const correoLogin =
        document
          .getElementById(
            "login-correo"
          )
          ?.value
          .trim() ||
        "";

      document.getElementById(
        "reset-correo"
      ).value =
        correoLogin;

      resetOverlay?.classList.add(
        "active"
      );

      document.body.style.overflow =
        "hidden";

      setTimeout(
        () => {
          document
            .getElementById(
              "reset-correo"
            )
            ?.focus();
        },
        100
      );
    }
  );

function cerrarReset() {
  resetOverlay?.classList.remove(
    "active"
  );

  document.body.style.overflow =
    "";

  limpiarMensajeReset();
}

document
  .getElementById(
    "cerrar-reset"
  )
  ?.addEventListener(
    "click",
    cerrarReset
  );

resetOverlay?.addEventListener(
  "click",
  event => {
    if (
      event.target ===
      resetOverlay
    ) {
      cerrarReset();
    }
  }
);

resetForm?.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    limpiarMensajeReset();

    const correo =
      normalizarCorreo(
        document
          .getElementById(
            "reset-correo"
          )
          .value
      );

    if (!correo) {
      mostrarMensajeReset(
        "Ingresa tu correo electrónico."
      );

      return;
    }

    btnReset.disabled =
      true;

    btnReset.textContent =
      "Enviando...";

    try {
      await auth
        .sendPasswordResetEmail(
          correo
        );

      mostrarMensajeReset(
        "Te enviamos un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.",
        "success"
      );

      btnReset.textContent =
        "Enlace enviado";

    } catch (error) {
      console.error(
        error
      );

      mostrarMensajeReset(
        traducirErrorAuth(
          error
        )
      );

      btnReset.disabled =
        false;

      btnReset.textContent =
        "Enviar enlace";
    }
  }
);

auth.onAuthStateChanged(
  async usuario => {
    if (!usuario) {
      procesandoUsuario =
        false;

      usuarioPerfilPendiente =
        null;

      ocultarLoading();

      return;
    }

    await resolverUsuario(
      usuario
    );
  }
);