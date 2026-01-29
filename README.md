# ☕ LatteList - Frontend Application

![Angular](https://img.shields.io/badge/Angular-17+-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.x-purple)
![MapLibre](https://img.shields.io/badge/Maps-MapLibre_GL-brightgreen)

Interfaz de usuario para **LatteList**, una Single Page Application (SPA) reactiva y moderna diseñada para la comunidad cafetera de Mar del Plata.



## Características Visuales
* **Mapa Interactivo:** Integración con MapLibre GL para geolocalización de cafés.
* **Estado Reactivo:** Uso de **Angular Signals** para una gestión de estado eficiente.
* **Diseño Responsivo:** Maquetación con Bootstrap 5 adaptable a móviles y tablets.
* **Animaciones:** Experiencia dinámica mediante SVGs animados.


## Stack Tecnológico

- **Framework:** Angular 17+ (Standalone Components)
- **Lenguaje:** TypeScript
- **Estilos:** Bootstrap 5 + CSS3
- **Iconos:** Bootstrap Icons
- **Mapas:** MapLibre GL
- **Estado y asincronía:** RxJS + Angular Signals
- **Comunicación:** HttpClient (API REST)


## Seguridad

- Guards funcionales:
  - `authGuard`
  - `adminGuard`
  - `clientGuard`
- Interceptores:
  - AuthInterceptor (JWT)
  - ErrorInterceptor (403 / sesión expirada)


## 📸 Capturas de Pantalla

### 🏠 Home
![Home](assets/home.png)

### 🗺️ Mapa de Cafés
![Mapa](assets/mapa.png)

### 👤 Perfil de Usuario
![Perfil](assets/perfil.png)


## Rutas Principales

- `/auth/login`
- `/auth/registrarse`
- `/cafes`
- `/cafes/map`
- `/cafes/:id`
- `/lista`
- `/usuarios/perfil`
- `/usuarios/listado` (ADMIN)




##  Funcionalidades

###  Usuarios
- Registro e inicio de sesión
- Recuperación de contraseña
- Edición de perfil
- Visualización de reseñas propias

###  Cafés
- Listado con filtros
- Mapa interactivo
- Ruleta aleatoria de cafés
- Vista detallada con reseñas

###  Reseñas
- Crear, editar y eliminar reseñas
- Likes y dislikes
- Visualización por café y por usuario

###  Listas
- Crear listas personalizadas
- Marcar cafés como visitados
- Listas públicas y privadas
- Clonar listas de otros usuarios

### Administración
- Gestión de usuarios
- Moderación de reseñas
- Alta de nuevos administradores



##  Instalación y Ejecución

### Requisitos
- Node.js (LTS)
- Angular CLI

### Pasos
```bash
npm install
ng serve

Aplicación disponible en http://localhost:4200

## Licencia
Proyecto académico – Tecnicatura Universitaria en Programación (UTN).
