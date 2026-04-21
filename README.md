# Costify — FrontEnd

> Aplicación profesional multiplataforma (web y escritorio) para la gestión de productos, materias primas y plantillas de costos. Desarrollada con **React 19**, **Vite**, **Chakra UI** y **Electron**.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-latest-646CFF?logo=vite&logoColor=white)
![Chakra UI](https://img.shields.io/badge/Chakra_UI-latest-319795?logo=chakraui&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-latest-47848F?logo=electron&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Estado](https://img.shields.io/badge/Estado-En%20desarrollo%20activo-yellow)

---

## 🌐 Demo en producción

**[👉 costify-fron-end.vercel.app](https://costify-fron-end.vercel.app)**

---

## 📖 Descripción

**Costify** es una solución integral pensada para talleres, fábricas y emprendimientos que necesitan calcular precios de venta de manera flexible y precisa, considerando distintos insumos, servicios y plataformas.

Este repositorio contiene el **frontend** de la aplicación, que consume la [API Costify-BackEnd](https://github.com/SebaGarea/Costify-BackEnd) y puede ejecutarse tanto como aplicación web en el navegador como **aplicación de escritorio nativa** gracias a la integración con Electron.

---

## ✨ Funcionalidades principales

- 🔐 **Autenticación segura** con login local y OAuth 2.0 de Google; persistencia de sesión mediante JWT en `localStorage`.
- 📦 **Gestión de materias primas** con categorías, unidades de medida, stock y valor por unidad.
- 🧾 **Creación de plantillas de costos** (recetas) combinando materiales, servicios extra y márgenes de ganancia.
- 🛒 **Catálogo de productos** con cálculo dinámico de precio final según plataforma de venta.
- 💰 **Registro y control de ventas** con estados, totales y clientes.
- 🖥️ **Aplicación de escritorio con Electron** — empaquetable como ejecutable nativo multiplataforma.
- 📱 **Diseño responsive** adaptado a distintos dispositivos gracias a Chakra UI.
- 🔄 **Entornos separados** — variables de configuración distintas para desarrollo y producción.

---

## 🛠️ Stack tecnológico

| Categoría | Tecnologías |
|---|---|
| **Framework / Build** | [React 19](https://react.dev/), [Vite](https://vitejs.dev/) |
| **UI** | [Chakra UI](https://chakra-ui.com/), HTML5, CSS3 |
| **Desktop** | [Electron](https://www.electronjs.org/) |
| **Routing** | React Router |
| **HTTP Client** | Axios / Fetch API |
| **Autenticación** | JWT + OAuth 2.0 (Google) |
| **Calidad de código** | [ESLint](https://eslint.org/) |
| **Despliegue** | [Vercel](https://vercel.com/) (web) |
| **Control de versiones** | Git & GitHub |

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

# 3. Configurar variables de entorno
# Crear o ajustar los archivos .env.development y .env.production
# con la URL de tu backend (por defecto: http://localhost:8080)
```

---

## 🚀 Uso

### 🌐 Modo web (desarrollo)

```bash
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173) en tu navegador.

### 🖥️ Modo desktop (Electron)

```bash
npm run electron
```

Se abrirá la aplicación de escritorio nativa.

### 🏗️ Build de producción

```bash
npm run build
```

Genera los archivos optimizados en la carpeta `dist/`.

---

## 📜 Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con hot-reload |
| `npm run build` | Genera la build de producción optimizada |
| `npm run preview` | Previsualiza localmente la build de producción |
| `npm run lint` | Ejecuta ESLint para análisis estático de código |
| `npm run electron` | Inicia la aplicación como app de escritorio con Electron |

---

## 📁 Estructura del proyecto

```
Costify-FronEnd/
├── public/              # Archivos estáticos
├── src/
│   ├── assets/          # Imágenes, íconos y recursos
│   ├── components/      # Componentes reutilizables
│   ├── hooks/           # Custom hooks (useAuth, useFetch, etc.)
│   ├── layouts/         # Layouts generales (Sidebar, Navbar, etc.)
│   ├── pages/           # Vistas principales (Login, Dashboard, Productos…)
│   ├── router/          # Configuración de rutas y protección
│   └── services/        # Capa de acceso a la API (productos, ventas, auth)
├── electron.mjs         # Configuración de Electron
├── vite.config.js       # Configuración de Vite
├── vercel.json          # Configuración de despliegue en Vercel
└── package.json
```

---

## 🔗 Integración con el backend

Este frontend está diseñado para funcionar con [Costify-BackEnd](https://github.com/SebaGarea/Costify-BackEnd).

### Entorno local

1. Cloná y levantá el backend siguiendo sus instrucciones (`npm start` o `docker compose up`).
2. Asegurate de que el backend esté corriendo en `http://localhost:8080`.
3. En el backend, configurá las variables de entorno necesarias:

   ```
   FRONTEND_URL=http://localhost:5173
   GOOGLE_CLIENT_ID=tu_client_id
   GOOGLE_CLIENT_SECRET=tu_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:8080/api/sessions/githubcallback
   ```

4. Iniciá este frontend con `npm run dev`.

### Entorno de producción

- **Backend** desplegado en Render: `https://costify-backend-1.onrender.com`
- **Frontend** desplegado en Vercel: `https://costify-fron-end.vercel.app`

---

## 🔐 Flujo de autenticación

1. El usuario ingresa desde `/login` (registro nuevo, login tradicional o botón **"Continuar con Google"**).
2. El backend valida credenciales y emite un **JWT**.
3. El token se persiste en `localStorage` y se agrega automáticamente al header `Authorization: Bearer` en cada request.
4. El router protege las rutas privadas verificando la existencia y validez del token.

### Checklist de pruebas

- [x] Login con credenciales existentes
- [x] Registro nuevo (con validación de nombre, apellido, email y contraseña segura)
- [x] Login con Google (vuelta a la app + token persistido)
- [x] Protección de rutas privadas
- [x] Logout y limpieza de sesión

---

## 🗺️ Roadmap

- [ ] Tests automatizados con Vitest y Testing Library
- [ ] Storybook para documentar componentes
- [ ] Modo oscuro persistente
- [ ] Exportación de reportes a PDF/Excel
- [ ] Progressive Web App (PWA) con modo offline
- [ ] Internacionalización (i18n)

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si encontrás un bug o tenés una idea, abrí un issue o un pull request.

1. Hacé fork del proyecto
2. Creá una rama para tu feature (`git checkout -b feature/MiFeature`)
3. Hacé commit de tus cambios (`git commit -m 'Agrego MiFeature'`)
4. Push a la rama (`git push origin feature/MiFeature`)
5. Abrí un Pull Request

---

## 👨‍💻 Autor

Desarrollado con dedicación por **[Sebastián Garea](https://github.com/SebaGarea)**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sebastián_Garea-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sebastian-garea-5713ba307/)
[![GitHub](https://img.shields.io/badge/GitHub-SebaGarea-181717?logo=github&logoColor=white)](https://github.com/SebaGarea)

---

**Costify FrontEnd © 2025**
