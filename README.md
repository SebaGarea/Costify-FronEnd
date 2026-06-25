# Costify — FrontEnd

> Plataforma de gestión integral para talleres y emprendimientos de fabricación a medida: costos, ventas, producción, contenido de redes y un **asistente de IA** que opera sobre los datos reales del negocio. Construida con **React 19**, **Vite** y **Chakra UI**.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Chakra UI](https://img.shields.io/badge/Chakra_UI-2-319795?logo=chakraui&logoColor=white)
![FullCalendar](https://img.shields.io/badge/FullCalendar-6-1A82E2)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Estado](https://img.shields.io/badge/Estado-En%20desarrollo%20activo-yellow)

---

## 🌐 Demo en producción

**[👉 costify-fron-end.vercel.app](https://costify-fron-end.vercel.app)**

---

## 📖 Descripción

**Costify** es una solución integral pensada para talleres, fábricas y emprendimientos que fabrican a medida y necesitan calcular precios, controlar ventas y entregas, organizar la producción y planificar su contenido — todo en un solo lugar.

Este repositorio contiene el **frontend**, una SPA en React que consume la [API Costify-BackEnd](https://github.com/SebaGarea/Costify-BackEnd). Incluye un **dashboard operativo**, un **calendario unificado**, gestión completa del catálogo y un **asistente de IA** integrado que responde consultas y ejecuta acciones sobre el negocio.

---

## ✨ Funcionalidades

### Núcleo del negocio
- 📊 **Dashboard operativo** — facturación, ticket promedio, saldo pendiente, margen estimado, producto estrella, entregas próximas y atrasadas, y rankings de medios y productos.
- 🗓️ **Calendario unificado** ([FullCalendar](https://fullcalendar.io/)) que combina en una sola vista: entregas de ventas, tareas pendientes, eventos manuales y publicaciones programadas.
- 💰 **Ventas** — alta y edición con estados (pendiente, en proceso, finalizada, despachada, cancelada), seña, saldo, fecha de entrega y cliente.
- 📦 **Catálogo de productos** — con **gestión de imágenes** (subir, eliminar individualmente y acumular), stock y precio dinámico vinculado a su plantilla de costo.
- 🧱 **Materias primas** — categorías, tipos, medidas, stock e importación masiva desde Excel.
- 🧾 **Plantillas de costo (presupuestos)** — armado por secciones (Herrería, Carpintería, Pintura, Otros) con:
  - Secciones **colapsables** que se expanden al cargar materiales.
  - **Barra fija (sticky)** con totales en vivo (costo, ganancia, precio final), estado de "cambios sin guardar" y última modificación.
  - **Precios por plataforma** (Mercado Libre, Tienda Nube) calculados automáticamente.
  - **Archivos adjuntos** (PDF/imágenes) y comentarios del presupuesto.
- 🛒 **Lista de compras** colaborativa por secciones, con totales y barra de acciones fija.

### Productividad y contenido
- ✅ **Tareas** — prioridades, vencimientos, tags, filtros y búsqueda, integradas al calendario.
- 📣 **Contenido de redes** — planificación de publicaciones (idea → programada → publicada) por canal, con copy y producto asociado.

### Asistente de IA 🤖
- Chat flotante (y pantalla completa) que **lee datos reales** del negocio y puede **ejecutar acciones**: crear/completar/editar tareas, registrar cobros, marcar entregas, crear ventas y productos, sumar a la lista de compras y generar publicaciones.
- **Resumen proactivo** del día al abrir el chat, indicador de "usando herramienta…", **refresco en vivo** de las vistas tras cada acción e **historial** persistente.

### Transversal
- 🔐 **Autenticación** con login local y **Google OAuth 2.0**; sesión persistida con JWT.
- 📱 **Diseño responsive** y **modo claro/oscuro** con Chakra UI.
- 🔄 **Entornos separados** para desarrollo y producción.

---

## 🛠️ Stack tecnológico

| Categoría | Tecnologías |
|---|---|
| **Framework / Build** | [React 19](https://react.dev/), [Vite](https://vitejs.dev/) |
| **UI** | [Chakra UI](https://chakra-ui.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Calendario** | [FullCalendar](https://fullcalendar.io/) |
| **Drag & Drop** | [dnd-kit](https://dndkit.com/) |
| **Datos / HTTP** | [TanStack Query](https://tanstack.com/query), Axios, Fetch API (streaming del chat) |
| **Markdown** | react-markdown (render de respuestas de IA) |
| **Routing** | React Router 7 |
| **Autenticación** | JWT + OAuth 2.0 (Google) |
| **Calidad de código** | [ESLint](https://eslint.org/) |
| **Despliegue** | [Vercel](https://vercel.com/) |

---

## 📦 Instalación

### Requisitos previos
- Node.js v18 o superior
- npm v9 o superior
- [Costify-BackEnd](https://github.com/SebaGarea/Costify-BackEnd) corriendo localmente o desplegado

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/SebaGarea/Costify-FronEnd.git
cd Costify-FronEnd

# 2. Instalar dependencias
npm install

# 3. Configurar la URL del backend
#    .env.development -> VITE_API_URL=http://localhost:8080
#    .env.production  -> VITE_API_URL=https://tu-backend
```

---

## 🚀 Uso

```bash
npm run dev       # servidor de desarrollo con hot-reload (http://localhost:5173)
npm run build     # build de producción optimizada (carpeta dist/)
npm run preview   # previsualiza la build de producción
npm run lint      # análisis estático con ESLint
```

---

## 📁 Estructura del proyecto

```
Costify-FronEnd/
├── public/                 # Archivos estáticos
├── src/
│   ├── assets/             # Imágenes, íconos y recursos
│   ├── components/         # Vistas y componentes (Home, Ventas, Tareas, Contenido, Chat…)
│   ├── context/            # Contextos globales (ChatContext)
│   ├── hooks/              # Custom hooks (auth, calendario, tareas, productos…)
│   ├── layouts/            # Layout principal y Sidebar
│   ├── pages/              # Páginas enrutadas
│   ├── router/             # Definición y protección de rutas
│   ├── services/           # Capa de acceso a la API
│   └── theme/              # Tema de Chakra UI
├── vite.config.js
├── vercel.json
└── package.json
```

### 🧭 Secciones de la app

| Ruta | Sección |
|---|---|
| `/` | Dashboard operativo + calendario |
| `/ventas` | Gestión de ventas |
| `/productos` | Catálogo de productos |
| `/materias-primas` | Materias primas (+ importación Excel) |
| `/plantillas` | Plantillas de costo / presupuestos |
| `/lista-compras` | Lista de compras |
| `/tareas` | Tareas y recordatorios |
| `/contenido` | Planificación de contenido de redes |
| `/asistente` | Asistente de IA (pantalla completa) |
| `/configuracion` | Configuración y perfil del negocio |

---

## 🔗 Integración con el backend

Este frontend funciona con [Costify-BackEnd](https://github.com/SebaGarea/Costify-BackEnd).

- **Local:** levantá el backend en `http://localhost:8080` y apuntá `VITE_API_URL` ahí.
- **Producción:** el frontend se despliega en **Vercel** y consume la API desplegada (Oracle Cloud, con Render como respaldo).

El chat de IA usa **streaming** vía `fetch`, por lo que la URL del backend debe permitir CORS desde el origen del frontend.

---

## 🔐 Flujo de autenticación

1. El usuario ingresa desde `/login` (registro, login tradicional o **"Continuar con Google"**).
2. El backend valida y emite un **JWT**.
3. El token se persiste en `localStorage` y se adjunta como `Authorization: Bearer` en cada request.
4. El router protege las rutas privadas verificando el token.

---

## 🗺️ Roadmap

- [ ] Tests automatizados con Vitest y Testing Library
- [ ] Exportación de reportes y presupuestos a PDF
- [ ] Progressive Web App (PWA) con modo offline
- [ ] Internacionalización (i18n)

---

## 👨‍💻 Autor

Desarrollado por **[Sebastián Garea](https://github.com/SebaGarea)**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sebastián_Garea-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sebastian-garea-5713ba307/)
[![GitHub](https://img.shields.io/badge/GitHub-SebaGarea-181717?logo=github&logoColor=white)](https://github.com/SebaGarea)

---

**Costify FrontEnd © 2026**
