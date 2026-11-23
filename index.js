const express = require('express');
const fs = require('fs');
const zlib = require('zlib');
 
const app = express();
 
// Los articulos
const articulos = [
  { id: 1, titulo: 'Caninos', autor: 'Equipo Feralis', categoria: 'Mamíferos', descripcion:''  },
  { id: 2, titulo: 'Felinos', autor: 'Equipo Feralis', categoria: 'Mamíferos', descripcion:''  },
  { id: 3, titulo: 'Reptiles', autor: 'Equipo Feralis', categoria: 'Reptiles', descripcion: '' },
  { id: 4, titulo: 'Aves', autor: 'Equipo Feralis', categoria: 'Aves', descripcion: '' }
];
 
// Revisar docx
function leerXml(ruta) {
  const zip = fs.readFileSync(ruta);
  const fin = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (fin === -1) throw new Error('no es un docx');
  let pos = zip.readUInt32LE(fin + 16);
  for (let i = 0; i < zip.readUInt16LE(fin + 10); i++) {
    const largo = zip.readUInt16LE(pos + 28);
    const nombre = zip.toString('utf8', pos + 46, pos + 46 + largo);
    if (nombre === 'word/document.xml') {
      const inicio = zip.readUInt32LE(pos + 42);
      const desde = inicio + 30 + zip.readUInt16LE(inicio + 26) + zip.readUInt16LE(inicio + 28);
      let datos = zip.subarray(desde, desde + zip.readUInt32LE(pos + 20));
      if (zip.readUInt16LE(pos + 10) === 8) datos = zlib.inflateRawSync(datos);
      return datos.toString('utf8');
    }
    pos = pos + 46 + largo + zip.readUInt16LE(pos + 30) + zip.readUInt16LE(pos + 32);
  }
  throw new Error('no tiene texto');
}
 
// Lee el docx 
function leerDocx(ruta) {
  const xml = leerXml(ruta).replace(/<w:p(?: [^>]*)?\/>/g, '');
  const parrafos = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
  const bloques = [];
  const claves = [];
  for (let i = 0; i < parrafos.length; i++) {
    let texto = '';
    const negritas = []; // los trozos de este parrafo que estan en negrita
    let negrita = '';
    const runs = parrafos[i].match(/<w:r[ >][\s\S]*?<\/w:r>/g) || [];
    for (let j = 0; j < runs.length; j++) {
      const trozos = runs[j].replace(/<w:(tab|br)[^>]*\/>/g, '<w:t> </w:t>').match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g) || [];
      let t = trozos.join('').replace(/<[^>]+>/g, '');
      t = t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
      texto += t;
      if (/<w:b(?: w:val="(?:1|true|on)")?\/>/.test(runs[j])) {
        negrita += t;
      } else {
        negritas.push(negrita);
        negrita = '';
      }
    }
    negritas.push(negrita);
 
    texto = texto.replace(/\s+/g, ' ').trim();
    if (texto === '') continue;
 
    const todoNegrita = negritas.join('').replace(/\s/g, '') === texto.replace(/\s/g, '');
    let etiqueta = 'p';
    const estilo = /<w:pStyle w:val="(?:heading|ttulo|titulo|title)([123]?)"/i.exec(parrafos[i]);
    if (estilo) {
      etiqueta = 'h' + (estilo[1] || '1'); 
    } else if (bloques.length === 0 && todoNegrita) {
      etiqueta = 'h1';
    } else if (todoNegrita && !parrafos[i].includes('<w:jc w:val="right"/>')) {
      etiqueta = /^\d+\.\d+/.test(texto) ? 'h3' : 'h2';
    }
 
    if (etiqueta === 'p' && !todoNegrita) {
      for (let k = 0; k < negritas.length; k++) guardarClave(claves, negritas[k], etiqueta);
    }
    bloques.push({ t: etiqueta, x: texto });
  }
  return { bloques: bloques, claves: claves };
}
 
// guardar
function guardarClave(claves, palabra, etiqueta) {
  palabra = palabra.replace(/\s+/g, ' ').trim();
  if (etiqueta !== 'p' || palabra.length < 2 || palabra.length > 60) return;
  for (let i = 0; i < claves.length; i++) {
    if (claves[i].toLowerCase() === palabra.toLowerCase()) return;
  }
  claves.push(palabra);
}
 
// Busca .docx
function cargar(carpeta, articulo) {
  const ruta = __dirname + '/' + carpeta + '/' + articulo.titulo.toLowerCase() + '.docx';
  try {
    return leerDocx(ruta);
  } catch (error) {
    console.log('No se pudo leer ' + ruta + ': ' + error.message);
    return null;
  }
}
 
//  puerto
app.use(function (req, res, next) {
  res.set('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  next();
});
 
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: false }));
 
app.get('/articulos', function (req, res) {
  res.json(articulos);
});
 
app.get('/articulos/:id', function (req, res) {
  for (let i = 0; i < articulos.length; i++) {
    if (articulos[i].id === Number(req.params.id)) {
      const a = articulos[i];
      res.json({
        id: a.id,
        titulo: a.titulo,
        autor: a.autor,
        categoria: a.categoria,
        descripcion: a.descripcion,
        documento: cargar('documentos', a),
        documentoExtra: cargar('documento-extra', a)
      });
      return;
    }
  }
  res.status(404).json({ error: 'Artículo no encontrado' });
});
 
// Solo escuchar en un puerto cuando corremos en local
if (process.env.NODE_ENV !== 'production') {
  const puerto = process.env.PORT || 3000;
  app.listen(puerto, function () {
    console.log('Servidor en http://localhost:' + puerto);
  });
}

// Vercel usa esta exportación
module.exports = app;