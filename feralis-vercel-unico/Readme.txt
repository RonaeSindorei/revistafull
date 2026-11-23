# Feralis (back end)

Servidor de la revista digital como proyecto para anima llamada "Feralis". Hecho con Node.js y Express.

## Integrantes
- [Mauro Villarroya]
- [Mathias Richieri]
- [Carolina Pereyra]
- [Romina Bermudez]

## Descripción
API que entrega los artículos de la revista en formato JSON y lee los documentos de Word de cada artículo.

- GET /articulos devuelve la lista de artículos.
- GET /articulos/:id devuelve un artículo. Si el id no existe, responde 404 con un mensaje de error en JSON.

## Cómo correrlo
1. Instalar Node.js.
2. En consola de comandos dentro del archivo index.js ejecutar:
-"npm i" / "npm i nodemon" / "npm run dev" en ese respectivo orden si es la primera ejecucion.
   

 3. Abrir http://localhost:3000.

El servidor entrega la web desde la carpeta ../front.
El repositorio del front debe estar clonado al lado de este, en la mi
