(() => {
  const selector =
    document.querySelector(
      ".discount-type-selector"
    );

  const formulario =
    document.getElementById(
      "form-descuento"
    );

  const preview =
    document.getElementById(
      "preview-descuento"
    );

  const grupoProducto =
    document.getElementById(
      "grupo-descuento-producto"
    );

  const grupoCategoria =
    document.getElementById(
      "grupo-descuento-categoria"
    );

  const selectProducto =
    document.getElementById(
      "descuento-producto"
    );

  const selectCategoria =
    document.getElementById(
      "descuento-categoria"
    );

  const inputPorcentaje =
    document.getElementById(
      "descuento-porcentaje"
    );

  const inputInicio =
    document.getElementById(
      "descuento-inicio"
    );

  const inputFin =
    document.getElementById(
      "descuento-fin"
    );

  const botonGuardar =
    document.getElementById(
      "guardar-descuento"
    );

  const botonNuevo =
    document.getElementById(
      "btn-nuevo-descuento"
    );

  if (
    !selector ||
    !formulario ||
    !preview ||
    !grupoProducto ||
    !grupoCategoria
  ) {
    return;
  }

  function textoSeguro(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function crearOpcionTienda() {
    const yaExiste =
      document.querySelector(
        'input[name="tipo-descuento"][value="tienda"]'
      );

    if (yaExiste) {
      return;
    }

    const opcionTienda =
      document.createElement("label");

    opcionTienda.className =
      "discount-type-option";

    opcionTienda.innerHTML = `
      <input
        type="radio"
        name="tipo-descuento"
        value="tienda"
      >

      <div>

        <i class="fa-solid fa-store"></i>

        <span>

          <strong>
            Toda la tienda
          </strong>

          <small>
            Aplicar a todos los productos
          </small>

        </span>

      </div>
    `;

    selector.appendChild(
      opcionTienda
    );
  }

  function actualizarTextoInformativo() {
    const cajaInfo =
      document.querySelector(
        "#seccion-descuentos .discount-info-box p"
      );

    if (!cajaInfo) {
      return;
    }

    cajaInfo.textContent =
      "Puedes aplicar promociones temporales a un producto específico, a todos los productos de una categoría o a toda la tienda.";
  }

  function agregarEstilosTienda() {
    if (
      document.getElementById(
        "admin3-estilos-descuentos"
      )
    ) {
      return;
    }

    const estilo =
      document.createElement("style");

    estilo.id =
      "admin3-estilos-descuentos";

    estilo.textContent = `
      @media (min-width: 600px) {

        .discount-type-selector {
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
        }

      }

      @media (max-width: 599px) {

        .discount-type-selector {
          grid-template-columns: 1fr;
        }

      }
    `;

    document.head.appendChild(
      estilo
    );
  }

  function obtenerTipo() {
    return (
      document.querySelector(
        'input[name="tipo-descuento"]:checked'
      )?.value ||
      "producto"
    );
  }

  function obtenerNombreProducto() {
    if (!selectProducto) {
      return "";
    }

    const opcion =
      selectProducto.options[
        selectProducto.selectedIndex
      ];

    return String(
      opcion?.text || ""
    ).trim();
  }

  function actualizarCampos() {
    const tipo =
      obtenerTipo();

    grupoProducto.hidden =
      tipo !== "producto";

    grupoCategoria.hidden =
      tipo !== "categoria";

    actualizarPreview();
  }

  function actualizarPreview() {
    const tipo =
      obtenerTipo();

    const porcentaje =
      Number(
        inputPorcentaje?.value
      ) || 0;

    let objetivo = "";

    if (
      tipo === "tienda"
    ) {
      objetivo =
        "toda la tienda";
    }

    if (
      tipo === "producto"
    ) {
      objetivo =
        obtenerNombreProducto();
    }

    if (
      tipo === "categoria"
    ) {
      objetivo =
        String(
          selectCategoria?.value ||
          ""
        ).trim();
    }

    const objetivoInvalido =
      !objetivo ||
      objetivo
        .toLowerCase()
        .includes(
          "selecciona"
        );

    if (
      !porcentaje ||
      objetivoInvalido
    ) {
      preview.innerHTML = `
        <i class="fa-solid fa-wand-magic-sparkles"></i>

        <div>

          <strong>
            Configura tu promoción
          </strong>

          <span>
            Aquí aparecerá un resumen antes de guardarla.
          </span>

        </div>
      `;

      return;
    }

    preview.innerHTML = `
      <i class="fa-solid fa-tag"></i>

      <div>

        <strong>
          ${porcentaje}% de descuento
        </strong>

        <span>
          Se aplicará a ${textoSeguro(
            objetivo
          )} durante el periodo seleccionado.
        </span>

      </div>
    `;
  }

  async function guardarDescuentoTienda(
    event
  ) {
    const tipo =
      obtenerTipo();

    if (
      tipo !== "tienda"
    ) {
      return;
    }

    event.preventDefault();

    event.stopImmediatePropagation();

    const porcentaje =
      Number(
        inputPorcentaje?.value
      );

    const inicioValor =
      inputInicio?.value ||
      "";

    const finValor =
      inputFin?.value ||
      "";

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
      new Date(
        inicioValor
      );

    const fin =
      new Date(
        finValor
      );

    if (
      Number.isNaN(
        inicio.getTime()
      ) ||
      Number.isNaN(
        fin.getTime()
      )
    ) {
      alert(
        "Las fechas seleccionadas no son válidas."
      );

      return;
    }

    if (
      fin.getTime() <=
      inicio.getTime()
    ) {
      alert(
        "La fecha de finalización debe ser posterior a la fecha de inicio."
      );

      return;
    }

    if (
      botonGuardar
    ) {
      botonGuardar.disabled =
        true;

      botonGuardar.textContent =
        "Guardando...";
    }

    try {
      await db
        .collection(
          "descuentos"
        )
        .add({
          tipo:
            "tienda",

          alcance:
            "tienda",

          porcentaje,

          fechaInicio:
            firebase
              .firestore
              .Timestamp
              .fromDate(
                inicio
              ),

          fechaFin:
            firebase
              .firestore
              .Timestamp
              .fromDate(
                fin
              ),

          activo:
            true,

          productos:
            [],

          categorias:
            [],

          creadoEn:
            firebase
              .firestore
              .FieldValue
              .serverTimestamp()
        });

      if (
        typeof cerrarModalDescuento ===
        "function"
      ) {
        cerrarModalDescuento();
      }

      formulario.reset();

      actualizarCampos();

    } catch (
      error
    ) {
      console.error(
        error
      );

      alert(
        "No se pudo crear el descuento para toda la tienda."
      );

    } finally {
      if (
        botonGuardar
      ) {
        botonGuardar.disabled =
          false;

        botonGuardar.textContent =
          "Crear descuento";
      }
    }
  }

  function conectarEventosTipo() {
    document
      .querySelectorAll(
        'input[name="tipo-descuento"]'
      )
      .forEach(
        input => {
          input.addEventListener(
            "change",
            actualizarCampos
          );
        }
      );
  }

  crearOpcionTienda();

  actualizarTextoInformativo();

  agregarEstilosTienda();

  conectarEventosTipo();

  selectProducto
    ?.addEventListener(
      "change",
      actualizarPreview
    );

  selectCategoria
    ?.addEventListener(
      "change",
      actualizarPreview
    );

  inputPorcentaje
    ?.addEventListener(
      "input",
      actualizarPreview
    );

  botonNuevo
    ?.addEventListener(
      "click",
      () => {
        setTimeout(
          actualizarCampos,
          0
        );
      }
    );

  formulario.addEventListener(
    "submit",
    guardarDescuentoTienda,
    true
  );

  actualizarCampos();
})();