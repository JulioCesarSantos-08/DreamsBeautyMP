(() => {
  if (
    typeof firebase === "undefined" ||
    typeof db === "undefined"
  ) {
    return;
  }

  function obtenerIdVisitante() {
    const clave = "dreams_visitante_id";

    let id =
      localStorage.getItem(clave);

    if (id) {
      return id;
    }

    id =
      "visitante_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 12);

    localStorage.setItem(
      clave,
      id
    );

    return id;
  }

  function obtenerClaveFecha() {
    const ahora = new Date();

    const anio =
      ahora.getFullYear();

    const mes =
      String(
        ahora.getMonth() + 1
      ).padStart(2, "0");

    const dia =
      String(
        ahora.getDate()
      ).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  }

  function obtenerInicioDia() {
    const ahora = new Date();

    return new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      0,
      0,
      0,
      0
    );
  }

  async function registrarVisitanteGlobal(
    visitanteId
  ) {
    const referenciaVisitante =
      db
        .collection("visitantesWeb")
        .doc(visitanteId);

    const referenciaTrafico =
      db
        .collection("estadisticas")
        .doc("trafico");

    try {
      await db.runTransaction(
        async transaccion => {
          const visitanteDoc =
            await transaccion.get(
              referenciaVisitante
            );

          if (
            visitanteDoc.exists
          ) {
            transaccion.set(
              referenciaVisitante,
              {
                ultimaVisita:
                  firebase.firestore
                    .FieldValue
                    .serverTimestamp()
              },
              {
                merge: true
              }
            );

            return;
          }

          transaccion.set(
            referenciaVisitante,
            {
              creadoEn:
                firebase.firestore
                  .FieldValue
                  .serverTimestamp(),

              ultimaVisita:
                firebase.firestore
                  .FieldValue
                  .serverTimestamp()
            }
          );

          transaccion.set(
            referenciaTrafico,
            {
              visitantesUnicos:
                firebase.firestore
                  .FieldValue
                  .increment(1),

              actualizadoEn:
                firebase.firestore
                  .FieldValue
                  .serverTimestamp()
            },
            {
              merge: true
            }
          );
        }
      );
    } catch (error) {
      console.error(
        "No se pudo registrar visitante único:",
        error
      );
    }
  }

  async function registrarVisitaDiaria(
    visitanteId
  ) {
    const claveFecha =
      obtenerClaveFecha();

    const referenciaDia =
      db
        .collection("visitasDiarias")
        .doc(claveFecha);

    const referenciaVisitanteDia =
      referenciaDia
        .collection("visitantes")
        .doc(visitanteId);

    const inicioDia =
      obtenerInicioDia();

    try {
      await db.runTransaction(
        async transaccion => {
          const visitanteDia =
            await transaccion.get(
              referenciaVisitanteDia
            );

          const datosDia = {
            fecha:
              firebase.firestore
                .Timestamp
                .fromDate(inicioDia),

            visitas:
              firebase.firestore
                .FieldValue
                .increment(1),

            actualizadoEn:
              firebase.firestore
                .FieldValue
                .serverTimestamp()
          };

          if (
            !visitanteDia.exists
          ) {
            datosDia.visitantesUnicos =
              firebase.firestore
                .FieldValue
                .increment(1);

            transaccion.set(
              referenciaVisitanteDia,
              {
                primeraVisita:
                  firebase.firestore
                    .FieldValue
                    .serverTimestamp()
              }
            );
          }

          transaccion.set(
            referenciaDia,
            datosDia,
            {
              merge: true
            }
          );
        }
      );
    } catch (error) {
      console.error(
        "No se pudo registrar la visita diaria:",
        error
      );
    }
  }

  async function registrarVisitaGlobal() {
    const referencia =
      db
        .collection("estadisticas")
        .doc("trafico");

    try {
      await referencia.set(
        {
          visitasTotales:
            firebase.firestore
              .FieldValue
              .increment(1),

          actualizadoEn:
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
        "No se pudo registrar la visita global:",
        error
      );
    }
  }

  async function iniciarRegistroVisita() {
    const visitanteId =
      obtenerIdVisitante();

    await Promise.all([
      registrarVisitanteGlobal(
        visitanteId
      ),

      registrarVisitaDiaria(
        visitanteId
      ),

      registrarVisitaGlobal()
    ]);
  }

  iniciarRegistroVisita();
})();