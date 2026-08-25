let usuarioPedidoDreams =
  null;

let perfilPedidoDreams =
  null;


/* =====================================================
   INICIAR DATOS DEL USUARIO
===================================================== */

function iniciarUsuarioPedidoDreams(
  usuario,
  perfil
) {
  usuarioPedidoDreams =
    usuario;

  perfilPedidoDreams =
    perfil;

  cargarDatosPerfilEnCheckout();
}


/* =====================================================
   FECHAS
===================================================== */

function obtenerFechaCodigoClientePedido(
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


/* =====================================================
   VALIDAR CÓDIGO DEL CLIENTE
===================================================== */

async function validarCodigoClienteTransaccion(
  transaction,
  codigo
) {
  if (!codigo) {
    return null;
  }

  const usuario =
    auth.currentUser ||
    usuarioPedidoDreams;

  if (!usuario) {
    throw new Error(
      "No pudimos identificar tu cuenta."
    );
  }

  const codigoTexto =
    String(
      codigo
    )
      .trim()
      .toUpperCase();

  const codigoClienteRef =
    db
      .collection(
        "usuarios"
      )
      .doc(
        usuario.uid
      )
      .collection(
        "codigosCanjeados"
      )
      .doc(
        codigoTexto
      );

  const codigoClienteSnap =
    await transaction.get(
      codigoClienteRef
    );

  if (
    !codigoClienteSnap.exists
  ) {
    throw new Error(
      "Este código no está guardado en tu cuenta."
    );
  }

  const codigoCliente =
    codigoClienteSnap.data();

  if (
    codigoCliente.usado ===
    true
  ) {
    throw new Error(
      "Este código ya fue utilizado anteriormente."
    );
  }

  const fechaFin =
    obtenerFechaCodigoClientePedido(
      codigoCliente.fechaFin
    );

  if (
    fechaFin &&
    new Date() > fechaFin
  ) {
    throw new Error(
      "Este código guardado en tu cuenta ya venció."
    );
  }

  return {
    ref:
      codigoClienteRef,

    datos:
      codigoCliente,

    uid:
      usuario.uid,

    codigo:
      codigoTexto
  };
}


/* =====================================================
   MARCAR CÓDIGO COMO USADO
===================================================== */

function marcarCodigoClienteUsadoTransaccion(
  transaction,
  codigoCliente,
  pedidoId
) {
  if (!codigoCliente) {
    return;
  }

  transaction.update(
    codigoCliente.ref,
    {
      usado:
        true,

      pedidoId:
        pedidoId,

      usadoEn:
        firebase.firestore
          .FieldValue
          .serverTimestamp(),

      devueltoPorCancelacion:
        false,

      devueltoEn:
        null
    }
  );
}


/* =====================================================
   OBTENER DATOS DE LA CUENTA
===================================================== */

function obtenerDatosCuentaParaPedido() {
  const usuario =
    auth.currentUser ||
    usuarioPedidoDreams;

  const perfil =
    perfilPedidoDreams ||
    window.perfilDreams;

  if (!usuario) {
    return null;
  }

  return {
    uid:
      usuario.uid,

    email:
      usuario.email ||
      perfil?.email ||
      "",

    nombre:
      perfil?.nombre ||
      usuario.displayName ||
      "",

    telefono:
      perfil?.telefono ||
      "",

    localidad:
      perfil?.localidad ||
      "",

    foto:
      usuario.photoURL ||
      perfil?.foto ||
      ""
  };
}


/* =====================================================
   CARGAR PERFIL EN FINALIZAR.HTML
===================================================== */

function cargarDatosPerfilEnCheckout() {
  const usuario =
    auth.currentUser ||
    usuarioPedidoDreams ||
    window.usuarioDreams;

  const perfil =
    perfilPedidoDreams ||
    window.perfilDreams;

  if (
    !usuario ||
    !perfil
  ) {
    return;
  }

  const nombre =
    String(
      perfil.nombre ||
      usuario.displayName ||
      ""
    ).trim();

  const telefono =
    String(
      perfil.telefono ||
      ""
    ).trim();

  const localidad =
    String(
      perfil.localidad ||
      ""
    ).trim();

  const correo =
    String(
      usuario.email ||
      perfil.email ||
      ""
    ).trim();

  const nombreInput =
    document.getElementById(
      "nombre-cliente"
    );

  const telefonoInput =
    document.getElementById(
      "telefono-cliente"
    );

  if (nombreInput) {
    nombreInput.value =
      nombre;

    nombreInput.readOnly =
      true;

    nombreInput.setAttribute(
      "aria-readonly",
      "true"
    );
  }

  if (telefonoInput) {
    telefonoInput.value =
      telefono;

    telefonoInput.readOnly =
      true;

    telefonoInput.setAttribute(
      "aria-readonly",
      "true"
    );
  }

  actualizarDatosVisualesCheckout({
    nombre,
    telefono,
    localidad,
    correo
  });
}


/* =====================================================
   DATOS VISUALES
   Esta parte funciona cuando agreguemos los nuevos
   elementos en finalizar.html
===================================================== */

function actualizarDatosVisualesCheckout(
  datos
) {
  const nombre =
    document.getElementById(
      "checkout-perfil-nombre"
    );

  const telefono =
    document.getElementById(
      "checkout-perfil-telefono"
    );

  const localidad =
    document.getElementById(
      "checkout-perfil-localidad"
    );

  const correo =
    document.getElementById(
      "checkout-perfil-correo"
    );

  if (nombre) {
    nombre.textContent =
      datos.nombre ||
      "Cliente Dreams";
  }

  if (telefono) {
    telefono.textContent =
      datos.telefono ||
      "Sin teléfono";
  }

  if (localidad) {
    localidad.textContent =
      datos.localidad ||
      "Sin localidad";
  }

  if (correo) {
    correo.textContent =
      datos.correo ||
      "";
  }
}


/* =====================================================
   VERIFICAR QUE EL PERFIL SIGA COMPLETO
===================================================== */

function validarPerfilCheckout() {
  const perfil =
    perfilPedidoDreams ||
    window.perfilDreams;

  if (!perfil) {
    return false;
  }

  const nombre =
    String(
      perfil.nombre || ""
    ).trim();

  const telefono =
    String(
      perfil.telefono || ""
    )
      .replace(
        /\D/g,
        ""
      );

  const localidad =
    String(
      perfil.localidad || ""
    ).trim();

  if (
    nombre.length <= 10 ||
    telefono.length < 10 ||
    localidad.length < 2
  ) {
    return false;
  }

  return true;
}


/* =====================================================
   EXPORTAR FUNCIONES A PEDIDOS.JS
===================================================== */

window.validarCodigoClienteTransaccion =
  validarCodigoClienteTransaccion;

window.marcarCodigoClienteUsadoTransaccion =
  marcarCodigoClienteUsadoTransaccion;

window.obtenerDatosCuentaParaPedido =
  obtenerDatosCuentaParaPedido;

window.validarPerfilCheckoutDreams =
  validarPerfilCheckout;

window.cargarDatosPerfilEnCheckout =
  cargarDatosPerfilEnCheckout;


/* =====================================================
   CLIENTEAUTH LISTO
===================================================== */

window.addEventListener(
  "dreams:cliente-listo",
  event => {
    iniciarUsuarioPedidoDreams(
      event.detail.usuario,
      event.detail.perfil
    );
  }
);

if (
  window.usuarioDreams &&
  window.perfilDreams
) {
  iniciarUsuarioPedidoDreams(
    window.usuarioDreams,
    window.perfilDreams
  );
}