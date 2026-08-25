let validacionClienteTerminada =
  false;

async function obtenerPerfilCliente(
  usuario
) {
  const referencia =
    db
      .collection("usuarios")
      .doc(usuario.uid);

  const documento =
    await referencia.get();

  if (!documento.exists) {
    return null;
  }

  return {
    id: documento.id,
    ...documento.data()
  };
}

async function actualizarAccesoCliente(
  usuario
) {
  try {
    await db
      .collection("usuarios")
      .doc(usuario.uid)
      .set(
        {
          email:
            String(
              usuario.email || ""
            )
              .trim()
              .toLowerCase(),

          foto:
            usuario.photoURL || "",

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
    console.error(error);
  }
}

auth.onAuthStateChanged(
  async usuario => {
    if (
      validacionClienteTerminada
    ) {
      return;
    }

    if (!usuario) {
      window.location.replace(
        "login.html"
      );

      return;
    }

    try {
      const perfil =
        await obtenerPerfilCliente(
          usuario
        );

      if (!perfil) {
        window.location.replace(
          "login.html"
        );

        return;
      }

      const rol =
        String(
          perfil.rol || "cliente"
        )
          .trim()
          .toLowerCase();

      if (rol === "admin") {
        window.location.replace(
          "admin.html"
        );

        return;
      }

      if (rol !== "cliente") {
        await auth.signOut();

        window.location.replace(
          "login.html"
        );

        return;
      }

      if (
        perfil.perfilCompleto !==
        true
      ) {
        window.location.replace(
          "login.html"
        );

        return;
      }

      validacionClienteTerminada =
        true;

      await actualizarAccesoCliente(
        usuario
      );

      window.usuarioDreams =
        usuario;

      window.perfilDreams = {
        ...perfil,
        uid: usuario.uid,
        email:
          usuario.email ||
          perfil.email ||
          "",
        foto:
          usuario.photoURL ||
          perfil.foto ||
          ""
      };

      window.dispatchEvent(
        new CustomEvent(
          "dreams:cliente-listo",
          {
            detail: {
              usuario:
                window.usuarioDreams,

              perfil:
                window.perfilDreams
            }
          }
        )
      );

    } catch (error) {
      console.error(error);

      try {
        await auth.signOut();
      } catch {}

      window.location.replace(
        "login.html"
      );
    }
  }
);