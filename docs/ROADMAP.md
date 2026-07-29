# Roadmap — Capital Gang Clothing

Estado: **Fase 0 completa** (arquitectura + auth + permisos + schema).
Cada fase siguiente es un bloque de trabajo independiente y desplegable.

## Fase 1 — Catálogo de Ropa (Clothing Store)
- [ ] Repositorio + casos de uso: `listProducts`, `getProductBySlug`, `createProduct`, `updateProduct`, `toggleActive`
- [ ] Página pública `/tienda` con grid, filtros (categoría, colección, precio) y buscador
- [ ] Página de detalle de producto con galería de imágenes/video y selector de variantes (talla/color)
- [ ] Dashboard `/dashboard/productos`: CRUD completo con subida de imágenes
- [ ] Integración de storage (definir proveedor primero — ver Arquitectura §7)

## Fase 2 — Tattoo Shop (insumos)
- [ ] Reutiliza el mismo módulo `catalog` con `storeType: TATTOO_SHOP`
- [ ] Página pública `/tattoo-shop`
- [ ] Dashboard `/dashboard/tattoo-shop`

## Fase 3 — Galería de Tatuajes (portafolio)
- [ ] CRUD de álbumes + fotos (`GalleryAlbum`, `GalleryPhoto`)
- [ ] Página pública `/galeria` con filtro por estilo (Realismo, Blackwork, etc.)
- [ ] Lightbox con animación de transición entre fotos

## Fase 4 — Carrito + Checkout manual (WhatsApp)
- [ ] Store de Zustand para carrito (persistencia en `localStorage` del navegador)
- [ ] Formulario de checkout (datos de envío) → crea `Order` + `OrderItem`s
- [ ] Al confirmar, genera mensaje pre-llenado de WhatsApp con resumen de la orden
- [ ] Notificación al Admin (WhatsApp Business API o email) de nueva orden

## Fase 5 — Panel de Órdenes
- [ ] Vista de tablero por estatus (Nueva → Contactado → Pagado → Enviado → Entregado)
- [ ] Notas internas por orden (`OrderNote`)
- [ ] Cambio de estatus con registro en `ActivityLog`

## Fase 6 — Gestión de Usuarios (Admin)
- [ ] UI de `/dashboard/usuarios`: tabla + modal de creación (consume `POST /api/users` ya implementado)
- [ ] Pantalla de "credenciales generadas" que se muestra una sola vez tras crear usuario
- [ ] Edición de perfil propio (`users.editSelf`) vs edición de terceros (`users.editAny`, solo Admin)
- [ ] Activar/desactivar cuentas

## Fase 7 — Configuración y pulido
- [ ] `/dashboard/configuracion`: datos de contacto, redes sociales, horarios (solo Admin — `settings.critical.edit`)
- [ ] Tema claro/oscuro persistente por usuario (columna `theme` ya existe en `User`)
- [ ] Internacionalización de fecha/moneda si se requiere (columna `locale` ya existe)
- [ ] Auditoría: vista de `ActivityLog` para el Admin

## Fase 8 — Producción
- [ ] Elegir hosting de Postgres + correr `prisma migrate deploy`
- [ ] Configurar `SESSION_SECRET` real y rotación
- [ ] Generar íconos PWA reales (192/512/maskable) en `public/icons/`
- [ ] Lighthouse audit (performance, PWA installability, accesibilidad)
- [ ] Backups automáticos de base de datos

---

### Nota sobre continuar este proyecto

Este es un proyecto multi-semana. La forma más efectiva de continuarlo es
fase por fase, idealmente en **Claude Code** (terminal, VS Code o la app de
escritorio), donde puedo trabajar directamente sobre este repositorio con
control de versiones, corridas de tests y despliegues reales — en este
chat puedo seguir construyendo módulos, pero cada fase que entregue aquí
tendrás que copiarla/pegarla o descargarla manualmente.
