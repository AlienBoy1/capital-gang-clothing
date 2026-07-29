# Capital Gang Clothing

Plataforma web multimodal: ropa urbana + tattoo shop + galería de tatuajes,
con panel administrativo por roles (Admin / Usuario).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** — design tokens en `tailwind.config.ts`
- **Framer Motion** — animaciones (scroll-reveal, transiciones, micro-interacciones)
- **Prisma + PostgreSQL** — capa de datos
- **Zustand** — estado de carrito/UI en cliente
- **TanStack Query** — cache y sincronización de datos del servidor
- **React Hook Form + Zod** — formularios y validación
- **next-pwa** — instalable como app (manifest + service worker)
- **jose + bcryptjs** — sesiones JWT y hashing de contraseñas/códigos

## Arquitectura

Ver [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) para el detalle completo.
Resumen: **Feature-based + Clean Architecture** por módulo
(`domain / application / infrastructure / presentation`), organizados por
bounded context: `identity`, `catalog`, `tattoo-shop`, `gallery`, `orders`, `cart`.

## Primeros pasos

```bash
npm install

# 1. Copia las variables de entorno y ajusta DATABASE_URL / SESSION_SECRET
cp .env.example .env

# 2. Levanta el schema en tu Postgres
npm run db:migrate

# 3. Crea el primer administrador (con Código de Acceso 000000 para el
#    primer login — cámbialo en prisma/seed.ts antes de correr en producción)
npm run db:seed

# 4. Arranca en desarrollo
npm run dev
```

Abre `http://localhost:3000` para el sitio público y
`http://localhost:3000/login` para entrar al panel.

## Flujo de Código de Acceso (primer login)

1. El Admin crea un usuario desde `/dashboard/usuarios` → el sistema genera
   un código de 6 dígitos y una contraseña temporal, mostrados **una sola
   vez** en pantalla para que el Admin se los entregue al usuario.
2. El usuario inicia sesión con email + contraseña temporal.
3. Como es su primer login, el sistema le pide el Código de Acceso.
4. Al validarlo correctamente, la cuenta queda marcada como validada
   permanentemente y el código se invalida — nunca se vuelve a pedir.

## Matriz de permisos

Ver [`src/modules/identity/domain/permissions.ts`](./src/modules/identity/domain/permissions.ts).
Es la **única fuente de verdad**: tanto la navegación del dashboard como
cada API route consultan esta matriz — nunca hay un `role === "ADMIN"`
hardcodeado sembrado por el código.

## Estado actual / qué falta

Este repositorio contiene la arquitectura completa y los flujos más
sensibles ya implementados end-to-end (auth + código de acceso + permisos +
schema de datos completo). Lo que sigue está scaffoldeado en la estructura
de carpetas pero pendiente de implementación — ver
[`docs/ROADMAP.md`](./docs/ROADMAP.md) para el plan fase por fase.
