

# Costify FrontEnd

## 🎬 Demo en vivo

> Una versión demo pública con datos ficticios, separada del entorno productivo.

**URL:** [https://costify-fron-end-ebw7.vercel.app](https://costify-fron-end-ebw7.vercel.app)

| Campo | Valor |
|---|---|
| Email | `demo@costify.com` |
| Contraseña | `Demo1234` |

Los datos son ficticios y se resetean periódicamente. No hay datos reales de ninguna empresa.


## Estado del proyecto

🚧 Esta aplicación está en desarrollo activo. Puede contener errores y estar sujeta a cambios frecuentes. ¡Cualquier contribución o sugerencia es bienvenida!

> Aplicación profesional para la gestión de productos y materias primas, desarrollada con React, Vite y Chakra UI.

## Descripción
Costify FrontEnd es una aplicación moderna que permite gestionar productos, materias primas y plantillas de costos de manera eficiente. Pensada para pequeñas y medianas empresas que buscan optimizar sus procesos de inventario y costos.

## Instalación

```bash
git clone https://github.com/SebaGarea/Costify-FronEnd.git
cd "Costify FrontEnd/React.Js"
npm install
```

## Uso

```bash
npm run dev
```
Abre [http://localhost:5173](http://localhost:5173) en tu navegador para ver la aplicación.

## Scripts disponibles

- `npm run dev` — Inicia el servidor de desarrollo
- `npm run build` — Genera la build de producción
- `npm run lint` — Ejecuta ESLint para análisis de código

## Tecnologías utilizadas

- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Chakra UI](https://chakra-ui.com/)
- [ESLint](https://eslint.org/)


## Estructura del proyecto

```
src/
  assets/           # Imágenes y recursos estáticos
  components/       # Componentes reutilizables
  hooks/            # Custom hooks
  layouts/          # Layouts generales
  pages/            # Vistas principales
  router/           # Rutas de la app
  services/         # Lógica de acceso a APIs
```

## Integración con el backend

Este frontend está diseñado para funcionar junto con el backend de Costify, disponible en el repositorio:

https://github.com/SebaGarea/Costify-BackEnd

Asegúrate de clonar y ejecutar el backend siguiendo sus instrucciones. Por defecto, el frontend espera que el backend esté corriendo en `http://localhost:3000` (puedes modificar la URL en los archivos de servicios si es necesario).

Ambos proyectos deben estar activos para el funcionamiento completo de la aplicación.



## Pruebas de autenticación

### Entorno local
1. Define en el backend `FRONTEND_URL=http://localhost:5173` junto con `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_CALLBACK_URL`.
2. Inicia backend y frontend (`npm run dev`).
3. Desde `http://localhost:5173/login` verifica:
  - Login con credenciales existentes.
  - Registro nuevo (debe exigir nombre, apellido, email, contraseña segura y confirmación).
  - Botón “Continuar con Google”: tras autorizar, la app debe volver a `http://localhost:5173` y persistir la sesión (token en `localStorage`).

### Entorno de producción
1. En Render configura `FRONTEND_URL=https://elportalherreria.vercel.app` (y, si necesitas otros dominios, agrégalos en `FRONTEND_URLS`).
2. Despliega la app en Vercel y visita `https://elportalherreria.vercel.app/login`.
3. Repite las mismas pruebas (login, registro y Google). Confirma que el token regrese al dominio productivo y que la sesión se guarde.
4. Si algo falla, revisa los logs del backend para saber qué dominio recibió la solicitud y ajusta las variables de entorno.


## Contacto

Desarrollado por [Seba Garea](https://github.com/SebaGarea)

---

Costify FrontEnd © 2025
