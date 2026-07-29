# Arquitectura — Capital Gang Clothing

## 1. Filosofía

**Feature-based + Clean Architecture selectiva.** No es DDD puro (seria
sobre-ingeniería para este dominio), pero toma prestado lo que sí aporta:
bounded contexts explícitos y una separación estricta entre reglas de
negocio y frameworks.

Cada módulo en `src/modules/<contexto>/` tiene 4 capas:

```
domain/          Tipos, entidades, invariantes de negocio puros.
                 Cero imports de Next.js, Prisma o React.
application/     Casos de uso (use-cases). Orquestan domain + infrastructure.
                 Un archivo = una acción de negocio completa
                 (ej. AuthenticateUserUseCase, CreateUserUseCase).
infrastructure/  Implementaciones concretas: repositorios Prisma,
                 clientes de storage, integraciones externas.
presentation/    Componentes React, hooks, schemas de formulario
                 específicos de este contexto.
```

**Regla de dependencia:** `presentation → application → domain`,
`infrastructure → domain`. `domain` nunca importa de las otras tres.
Esto es lo que permite testear reglas de negocio (ej. la matriz de
permisos, el flujo de código de acceso) sin levantar una base de datos.

## 2. Bounded contexts

| Contexto      | Responsabilidad                                          |
|----------------|-----------------------------------------------------------|
| `identity`     | Usuarios, roles, permisos, sesiones, código de acceso     |
| `catalog`      | Productos de ropa urbana, categorías, colecciones/drops   |
| `tattoo-shop`  | Productos de insumos de tatuaje (mismo modelo `Product`, `storeType` distinto) |
| `gallery`      | Portafolio de tatuajes (álbumes/fotos — no es catálogo de venta) |
| `orders`       | Órdenes generadas por checkout manual (WhatsApp-driven)    |
| `cart`         | Estado de carrito en cliente (Zustand, no persiste en servidor) |

`catalog` y `tattoo-shop` comparten los mismos modelos de datos
(`Product`, `Category`, `Collection`) diferenciados por el enum
`StoreType`, en vez de duplicar tablas — son el mismo concepto de negocio
("algo que se vende") con catálogos independientes en la UI.

## 3. Autorización — una sola fuente de verdad

Todo permiso vive como un literal en `Permission` (`identity/domain/permissions.ts`)
y se resuelve con `can(role, permission)`. Tres capas lo consultan:

1. **Middleware** (`src/middleware.ts`) — bloquea `/dashboard/*` completo a
   quien no tiene sesión válida o no ha completado la validación de código
   de acceso.
2. **Dashboard layout** — filtra qué enlaces de navegación se renderizan.
3. **Cada API route** — vuelve a verificar el permiso server-side
   (`assertCan`) antes de ejecutar la acción. Este es el límite de
   seguridad real; los puntos 1 y 2 son UX, no seguridad.

Esto es intencional: ocultar un botón en el UI nunca es suficiente,
porque cualquiera puede llamar al endpoint directamente.

## 4. Autenticación y Código de Acceso

Flujo completo implementado en:
- `identity/application/authenticate-user.usecase.ts` — orquesta la lógica
- `identity/application/create-user.usecase.ts` — genera el código al crear usuario
- `shared/lib/session.ts` — JWT firmado con `jose` (compatible con Edge Middleware)
- `app/(auth)/login/page.tsx` — UI de dos pasos

Decisión clave: el código de acceso **nunca se compara en texto plano**
(se hashea con bcrypt igual que la contraseña) y se **elimina de la base
de datos** en cuanto se valida — no queda ni siquiera un hash residual que
pudiera reusarse.

## 5. Datos

Ver `prisma/schema.prisma`. Puntos de diseño:

- `ProductVariant.attributes` es un `Json` flexible en vez de columnas
  fijas `size`/`color`, porque ropa (talla/color) e insumos de tatuaje
  (calibre/presentación) necesitan atributos distintos sobre el mismo modelo.
- `GalleryAlbum`/`GalleryPhoto` están completamente separados de `Product`
  — el portafolio de tatuajes no tiene precio ni se puede "comprar", es
  contenido editorial, no catálogo.
- `ActivityLog` registra cada acción sensible (crear usuario, cambiar
  estatus de orden) con el actor, para auditoría futura sin rediseñar nada.

## 6. Rendimiento y PWA

- `next-pwa` con estrategias de cache diferenciadas por tipo de dato
  (`next.config.ts`): imágenes → cache-first (30 días), catálogo →
  stale-while-revalidate, órdenes/auth → siempre red, nunca cache.
- `optimizePackageImports` para `lucide-react` y `framer-motion` reduce el
  bundle inicial — solo se compila el JS de los íconos/animaciones
  realmente usados.
- Server Components por default (App Router); `"use client"` solo donde
  hay estado o interactividad (formularios, animaciones con hooks).

## 7. Lo que falta diseñar/decidir contigo

- Proveedor de storage de imágenes/video (R2 vs Cloudinary vs S3) — el
  `next.config.ts` ya tiene ambos dominios permitidos, falta elegir e
  implementar el cliente de subida.
- Proveedor de hosting de Postgres (Supabase / Neon / Railway).
- Integración real de WhatsApp Business API para notificar nuevas
  órdenes (variables ya están en `.env.example`).
- Método de pago si en el futuro se agrega checkout real (por ahora el
  spec pide "checkout manual" → WhatsApp, sin pasarela).
