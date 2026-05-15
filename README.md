📋 Sistema de Actas Digitales - Municipalidad de Chascomús
Sistema web para gestión y generación de actas municipales, diseñado para funcionarios de inspección. Permite crear distintos tipos de actas (información, infracción, inspección, tránsito), capturar firmas digitales, dibujar croquis y generar PDFs listos para descargar o compartir por WhatsApp.

🚀 Características principales
Múltiples áreas: Habilitaciones, Obras Privadas, Seguridad Urbana, Ambiente y Bromatología

Tipos de actas:

Acta de Información (AC, SC, ACA)

Acta de Infracción (AI, OI, SI, AIA)

Acta de Inspección (INS, BR)

Acta de Tránsito (ST)

Firma digital con el dedo o mouse (persistente por usuario)

Dibujo de croquis en mapa (lápiz/borrador/limpiar)

Dictado por voz en campos de texto (útil para celular)

Mayúsculas automáticas en campos oficiales

Numeración automática secuencial por tipo de acta

Generación de PDF con diseño oficial

Envío por WhatsApp (descarga manual + apertura de chat)

Panel de administración de usuarios (solo supervisores)

👥 Usuarios por defecto
Usuario	Contraseña	Área
mariap	1001	Ambiente
mzaccheo	1002	Obras Privadas
marias	1003	Bromatología
fperez	1004	Supervisor (todas)
La contraseña es el número de legajo. Se puede cambiar en el panel de administración.

📁 Estructura de archivos
text
/
├── index.html          # Página principal
├── script.js           # Lógica de la aplicación
├── style.css           # Estilos CSS
├── manifest.json       # Configuración PWA
├── sw.js               # Service Worker (offline)
├── escudo.png          # Escudo municipal
└── icons/              # Iconos para PWA
    ├── icon-192.png
    └── icon-512.png
🔧 Instalación
Requisitos
Servidor web (Apache, Nginx, etc.) o servidor local

Navegador moderno con soporte ES6 (Chrome, Firefox, Edge, Safari)

Pasos
Clonar o descargar todos los archivos en una carpeta

Colocar el escudo en escudo.png (formato PNG, tamaño recomendado 500x500px)

Crear carpeta icons/ y agregar:

icon-192.png (192x192px)

icon-512.png (512x512px)

Servir la aplicación con cualquier servidor web

Acceder desde el navegador

Para uso en red local, asegurar que todos los dispositivos accedan a la misma IP.

📱 Uso en dispositivos móviles
La aplicación es Progressive Web App (PWA) y se puede instalar en el dispositivo:

Android: Abrir en Chrome → Menú → "Instalar aplicación"

iOS: Abrir en Safari → Compartir → "Agregar a pantalla de inicio"

Una vez instalada, funciona sin conexión a internet para actas ya existentes.

🔒 Gestión de usuarios
Supervisores (área "all")
Acceden al botón "Usuarios" en la barra superior

Pueden: crear, editar, eliminar, importar/exportar usuarios

La contraseña es el legajo

Inspectores regulares
Solo ven su área asignada

No acceden al panel de administración

Exportar/Importar usuarios
Exportar: genera archivo JSON con todos los usuarios

Importar: reemplaza la lista actual por la del archivo

📄 Generación de actas
Flujo de trabajo
Seleccionar área (Habilitaciones, Obras, etc.)

Seleccionar tipo de acta (Información/Infracción/Inspección)

Completar campos (se autocompleta fecha, hora e inspector)

Dibujar firmas en los canvas correspondientes

Dibujar croquis en el mapa (si aplica)

Presionar "+ Nueva acta" (reserva el número automáticamente)

Descargar PDF o enviar por WhatsApp

Características de edición
Mayúsculas automáticas en campos oficiales

Dictado por voz (micrófono en textareas, solo Chrome/Edge/Safari iOS)

Auto-resize de textareas

Validación de campos obligatorios (parcial)

📦 Dependencias externas
Librería	Uso
html2canvas	Captura del acta para PDF
jsPDF	Generación del archivo PDF
Se cargan desde CDN, no requieren descarga adicional.

⚙️ Configuración avanzada
Cambiar numeración inicial
Por defecto comienza en 1 para cada tipo de acta. Para cambiarlo:

javascript
// En script.js, modificar el valor en localStorage
localStorage.setItem('seq_AC', '100');  // para AC-100
localStorage.setItem('seq_AI', '50');   // para AI-50
Modificar barrios
Editar la constante BARRIOS en script.js:

javascript
const BARRIOS = ['Barrio 1', 'Barrio 2', 'Otro'];
Agregar rubros
Editar la constante en cada <select> del HTML o en script.js.

🐛 Solución de problemas comunes
Problema	Solución
No guarda la firma	Verificar que localStorage esté habilitado
El PDF muestra campos vacíos	Asegurar que se haya presionado "+ Nueva acta" primero
No reconoce dictado por voz	Revisar permisos del micrófono en el navegador
Service Worker no registra	Servir la aplicación con HTTPS (localhost funciona)
Los mapas no dibujan	Verificar que el canvas esté visible antes de dibujar
🔐 Seguridad
Credenciales locales: se guardan en localStorage, no hay backend

Firmas: se almacenan como DataURL en localStorage

Sin conexión externa: toda la información permanece en el dispositivo

Sugerencia: para entornos compartidos, usar el panel de administración con contraseñas seguras

🧪 Tecnologías utilizadas
HTML5 / CSS3

JavaScript ES6+

Canvas API (firmas y mapas)

Web Speech API (dictado por voz)

LocalStorage (persistencia)

html2canvas + jsPDF

Service Workers (PWA)

📝 Notas de versión
Versión actual (v5.0)
Eliminada dependencia de Firebase (numeración local)

Sincronización mejorada de checkboxes/radios en PDF

Barrios disponibles en todas las áreas

Mapa persistente al cambiar de pestaña

Botón "Cambiar firma" desde login

👨‍💻 Desarrollo
Para modificar la aplicación:

Editar index.html para agregar/eliminar campos de acta

Modificar style.css para cambios visuales

Actualizar script.js para nueva lógica

Probar en diferentes navegadores y dispositivos

Estructura de un tipo de acta
javascript
TIPOS.ac = {
  label: 'Informacion',     // Nombre visible
  badge: 'AC',              // Prefijo del número
  form: 'form-ac',          // ID del formulario
  titulo: 'Acta de Informacion',
  pref: 'AC-',
  dir: 'Direccion de Habilitaciones',
  isig: 's-ac-2',           // ID del canvas de firma del inspector
  color: 'info'             // info/infr/insp/trans
};
📞 Contacto
Para soporte técnico o reporte de errores, contactar al área de sistemas.

Municipalidad de Chascomús - Sistema de Actas Digitales
