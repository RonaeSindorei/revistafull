const temas = {
  rojo: { id: 1, nombre: "Caninos" },
  amarillo: { id: 2, nombre: "Felinos" },
  morado: { id: 3, nombre: "Reptiles" },
  azul: { id: 4, nombre: "Aves" },
};
const ETIQUETAS = ["h1", "h2", "h3", "p"];

function obtener(id) {
  return document.getElementById(id);
}

let tema = new URLSearchParams(location.search).get("tema");
if (
  tema !== "rojo" &&
  tema !== "amarillo" &&
  tema !== "morado" &&
  tema !== "azul"
) {
  tema = "rojo";
}

function crearEjemplo(titulo, carpeta) {
  const texto =
    "Texto de ejemplo. Coloca el archivo " +
    temas[tema].nombre.toLowerCase() +
    ".docx en la carpeta " +
    carpeta +
    " del servidor y aparecerá aquí.";
  return [
    { t: "h1", x: titulo },
    { t: "h2", x: "Sin documento" },
    { t: "p", x: texto },
  ];
}

const articulo = {
  sufijo: "",
  tituloBase: temas[tema].nombre,
  claves: [],
  ejemplo: crearEjemplo(temas[tema].nombre, "documentos"),
};
const extra = {
  sufijo: "X",
  tituloBase: "Documento ingles",
  claves: [],
  ejemplo: crearEjemplo("Documento extra", "documento-extra"),
};

function el(documento, id) {
  return obtener(id + documento.sufijo);
}

// Indice
function crearEnlace(href, texto) {
  const enlace = document.createElement("a");
  enlace.href = href;
  enlace.textContent = texto;
  return enlace;
}

// Resaltar palabras
function escribirTexto(documento, elemento, texto, vistas) {
  let resto = texto;
  while (resto !== "") {
    let mejorPosicion = -1;
    let mejorNumero = -1;
    for (let n = 0; n < documento.claves.length; n++) {
      const posicion = resto
        .toLowerCase()
        .indexOf(documento.claves[n].toLowerCase());
      if (posicion === -1) {
        continue;
      }
      if (
        mejorPosicion === -1 ||
        posicion < mejorPosicion ||
        (posicion === mejorPosicion &&
          documento.claves[n].length > documento.claves[mejorNumero].length)
      ) {
        mejorPosicion = posicion;
        mejorNumero = n;
      }
    }
    if (mejorPosicion === -1) {
      elemento.append(resto);
      break;
    }
    const largo = documento.claves[mejorNumero].length;
    if (mejorPosicion > 0) {
      elemento.append(resto.slice(0, mejorPosicion));
    }
    const negrita = document.createElement("strong");
    negrita.className = "clave";
    negrita.textContent = resto.slice(mejorPosicion, mejorPosicion + largo);
    if (!vistas.includes(mejorNumero)) {
      vistas.push(mejorNumero);
      negrita.id = "k" + mejorNumero + documento.sufijo;
    }
    elemento.append(negrita);
    resto = resto.slice(mejorPosicion + largo);
  }
}

function mostrarDocumento(documento, bloques, claves) {
  documento.claves = claves;
  let titulo = documento.tituloBase;
  const cuerpo = el(documento, "cuerpo");
  const secciones = el(documento, "secciones");
  const palabras = el(documento, "palabras");
  cuerpo.textContent = "";
  secciones.textContent = "";
  palabras.textContent = "";

  const vistas = [];
  let cantidadSecciones = 0;
  for (let i = 0; i < bloques.length; i++) {
    const etiqueta = bloques[i].t;
    const texto = bloques[i].x;
    if (!ETIQUETAS.includes(etiqueta)) {
      continue;
    }
    if (etiqueta === "h1") {
      titulo = texto;
      continue;
    }
    const pieza = document.createElement(etiqueta);
    escribirTexto(documento, pieza, texto, vistas);
    if (etiqueta !== "p") {
      pieza.id = "s" + i + documento.sufijo;
      secciones.append(crearEnlace("#s" + i + documento.sufijo, texto));
      cantidadSecciones++;
    }
    cuerpo.append(pieza);
  }

  let cantidadPalabras = 0;
  for (let n = 0; n < claves.length; n++) {
    if (vistas.includes(n)) {
      palabras.append(crearEnlace("#k" + n + documento.sufijo, claves[n]));
      cantidadPalabras++;
    }
  }

  el(documento, "tpal").hidden = cantidadPalabras === 0;
  el(documento, "tsec").hidden = cantidadSecciones === 0;
  if (documento.sufijo === "X") {
    const sinIndice = cantidadPalabras === 0 && cantidadSecciones === 0;
    cuerpo.nextElementSibling.hidden = sinIndice;
    cuerpo.className = sinIndice ? "cuerpo col-12" : "cuerpo col-md-9";
  }
  el(documento, "titulo").textContent = titulo;
  if (documento.sufijo === "") {
    document.title = titulo + " | Feralis";
  }
}

// cargar docx
function cargarDocumento(documento, contenido) {
  if (contenido) {
    mostrarDocumento(documento, contenido.bloques, contenido.claves);
  }
}

async function iniciar() {
  try {
    const respuesta = await fetch(API_URL + "/articulos/" + temas[tema].id);
    const datos = await respuesta.json();
    cargarDocumento(articulo, datos.documento);
    cargarDocumento(extra, datos.documentoExtra);
  } catch (error) {
    mostrarDocumento(
      articulo,
      [
        { t: "h1", x: temas[tema].nombre },
        {
          t: "p",
          x: 'No se pudo conectar con el servidor. Enciéndelo con "node index.js" en la carpeta back.',
        },
      ],
      [],
    );
  }
}

document.body.classList.add(tema); //colortema
mostrarDocumento(articulo, articulo.ejemplo, []);
mostrarDocumento(extra, extra.ejemplo, []);
const imagenes = document.querySelectorAll("img[data-tema]");
for (let i = 0; i < imagenes.length; i++) {
  imagenes[i].hidden = imagenes[i].dataset.tema !== tema;
}
iniciar();
