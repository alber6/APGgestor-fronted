# 👷 APGgestor - Frontend Application

Interfaz de usuario responsiva diseñada en React para la gestión y monitorización en tiempo real de cuadrantes de trabajo técnicos y obras eléctricas o solares.

## 🔗 Enlaces del Proyecto
* **App Web Oficial (Producción):** https://apg-gestor.vercel.app
* **API del Backend Vinculada:** https://apggestor-backend.onrender.com/api

## 🌟 Características Principales y UX/UI
La aplicación ha sido desarrollada enfocándose en resolver problemas reales de coordinación logística en movilidad, dividiendo la experiencia de usuario en dos grandes perfiles (Rol-Based UX):

* **Vista de Oficina (Admin):** Panel de control de escritorio optimizado para la gestión administrativa. Permite dar de alta fichas de clientes, registrar nuevas instalaciones y asignar operarios específicos a cada obra a través de formularios controlados.
* **Vista de Campo (Operario):** Interfaz móvil nativa adaptada para los técnicos que trabajan en la calle. Ofrece un acceso inmediato a su cuadrante diario de tareas asignadas, eliminando información irrelevante de costes. Incluye enlaces de marcación rápida (`tel:`) para llamar al cliente con un solo toque.
* **Login Inteligente (Tolerante a Fallos):** Diseñado con un algoritmo de coincidencia semántica por inclusión de texto con normalización de caracteres. El operario puede acceder sin importar si introduce su nombre con mayúsculas, minúsculas o si omite por completo los acentos y tildes (ej: "carlos gomez" da acceso válido a "Carlos Gómez"), previniendo bloqueos logísticos por errores de teclado en movilidad.
* **Sincronización Bidireccional en Tiempo Real:** Los técnicos pueden cambiar el estado de la obra ("Pendiente", "En proceso", "Finalizado") y redactar notas o reportes de campo en directo. Los cambios impactan inmediatamente en la base de datos de MongoDB Atlas y se reflejan en el panel del Administrador al instante.
* **Flujo de Sesión Seguro (Persistencia):** Implementación de botones de *Logout* (Cerrar Sesión) tanto para la oficina como para los operarios, limpiando el `localStorage` del dispositivo de forma segura si se accede desde terminales compartidos.

## 🛠️ Tecnologías y Librerías Extra
* **Framework Core:** React con Vite para asegurar una compilación, recarga en caliente (HMR) y tiempos de respuesta ultrarrápidos.
* **Enrutamiento Dinámico:** `react-router-dom` para el manejo de la navegación por historial y la protección estricta de rutas según el estado de la sesión y los roles cargados.
* **Cliente HTTP:** `axios` estructurado de forma modular mediante instancias de configuración global (`api.js`) para centralizar las peticiones asíncronas con el backend de producción.
* **Arquitectura CSS:** Maquetación limpia mediante un archivo maestro `style.css` utilizando variables globales (*Design Tokens*) para gestionar paletas de colores corporativos, tipografías y espaciados de forma escalable y reutilizable, eliminando por completo los estilos *inline*.

## 🚀 Instalación y Despliegue Local

Si deseas clonar este repositorio y ejecutar la aplicación en tu entorno local, sigue estos pasos:

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/TU_USUARIO_DE_GITHUB/APGgestor-frontend.git](https://github.com/TU_USUARIO_DE_GITHUB/APGgestor-frontend.git)
   cd APGgestor-frontend

2. **Instalar las dependencias del proyecto:**
   ```bash
   npm install

3. **Iniciar el servidor local de desarrollo:**
   ```bash
   npm run dev