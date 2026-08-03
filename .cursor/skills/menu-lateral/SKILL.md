---
name: menu-lateral
description: >-
  Añade o modifica entradas del menú lateral (drawer): módulos, acordeones,
  sub-opciones, roles, iconos e IDs. Patrón datos en modules.ts + UI en
  Menu.tsx. Usar al registrar ruta nueva, agregar opción de menú, acordeón
  o cambiar visibilidad por rol.
---

# Menú lateral

Patrón: **datos en `modules.ts`**, **UI en `Menu.tsx`**. No duplicar rutas ni textos fuera del archivo de módulos.

En este repo: `src/components/(base)/layout/Menu.tsx` + `src/components/(base)/dashboard/modules.ts`

## Arquitectura

| Archivo | Responsabilidad |
|---------|-----------------|
| `modules.ts` | Módulos, sub-opciones, filtros por rol |
| `Menu.tsx` | Secciones, acordeones, portal, modales del menú |

### Secciones (orden fijo)

1. **Inicio** (`variant="modules"`) — link al home del app
2. **Módulos** — acordeones de grupo + links directos (`mainModules`)
3. **Mi Cuenta** (`variant="account"`) — acordeón perfil (violeta)
4. **Administración** (`variant="admin"`) — acordeón admin (celeste/sky)

### Tipos de ítem

| Tipo | Componente | Cuándo |
|------|------------|--------|
| Link directo | `MenuModuleLink` | Módulo top-level sin acordeón propio |
| Acordeón | `MenuAccordion` | Grupo con sub-opciones |
| Sub-opción con ruta | opción con `href` | Navegación normal |
| Sub-opción modal | sin `href` | Abre modal vía `onOptionClick` |

## Variantes visuales (`MenuSectionVariant`)

| Variant | Uso | Acento |
|---------|-----|--------|
| `modules` | Inicio, módulos | celeste-trifinio, zinc |
| `account` | Mi Cuenta | violeta |
| `admin` | Administración | celeste/sky |

Patrones UI al tocar el menú:

- Botones/links: `cursor-pointer`
- Título: `text-xs font-black uppercase`
- Descripción: `text-[10px] text-muted-foreground line-clamp-2`
- Ícono: `size-9 rounded-lg`; activo `bg-celeste-trifinio/15` (violeta en account)
- Activo: barra izquierda `MenuActiveIndicator`
- Acordeón: `grid-rows-[0fr]` / `grid-rows-[1fr]` + `ChevronDown rotate-180`

## Visibilidad por rol

Centralizar en `modules.ts`:

- `getVisibleDashboardModules(role)` — filtra módulos top-level
- `getVisibleAdminOptions(options, role)` — filtra sub-opciones admin
- Helpers por feature (ej. `getPerfilMenuOptions(enablePasskeys)`)

No duplicar lógica de permisos en `Menu.tsx`.

## Procedimientos

### 1. Nuevo módulo (link directo)

```
- [ ] 1. Ruta en app/.../page.tsx (Suspense + componente)
- [ ] 2. Entrada en DASHBOARD_MODULES (modules.ts)
- [ ] 3. Icono en MODULE_ICONS (Menu.tsx)
- [ ] 4. allowedRoles / requiresAdmin según corresponda
- [ ] 5. Verificar proxy / RLS / permisos del rol
- [ ] 6. Probar menú con distintos roles
```

```typescript
{
  id: "mi-modulo",
  title: "Título",
  subtitle: "Parte 2",
  desc: "Descripción breve.",
  animatedIcon: "lordicon-id", // solo dashboard home, no menú
  href: "/ruta/mi-modulo",
  allowedRoles: ["super", "admin"],
},
```

Los módulos cuyo `id` está reservado para acordeón (observatorio, admin, perfil) no van como link directo.

### 2. Nueva sub-opción bajo acordeón

```
- [ ] 1. Ruta en app/...
- [ ] 2. Entrada en el array del grupo (ej. OBSERVATORIO_MENU_OPTIONS)
- [ ] 3. Icono en MENU_OPTION_ICONS si el id es nuevo
```

```typescript
{
  id: "reportes",
  title: "Reportes",
  desc: "Informes y cruces.",
  href: "/ruta/grupo/reportes",
},
```

### 3. Nueva opción admin

Igual que sub-opción; array `ADMIN_MENU_OPTIONS`. Filtro de rol vía `getVisibleAdminOptions`.

### 4. Opción que abre modal (sin ruta)

```
- [ ] 1. Entrada en array del grupo (sin href)
- [ ] 2. Icono en MENU_OPTION_ICONS
- [ ] 3. Caso en handler onOptionClick (Menu.tsx)
- [ ] 4. Modal en layout/modals/ si aplica
- [ ] 5. Condición de visibilidad en helper de modules.ts
```

### 5. Cambiar textos o roles

Editar **solo** `modules.ts`.

## IDs HTML

| Elemento | Patrón |
|----------|--------|
| Inicio | `menu-inicio` |
| Módulo directo | `menu-{mod.id}` |
| Acordeón | `menu-{grupo}` |
| Sub-opción | `{id-acordeon}-{option.id}` |

## Comportamiento del acordeón

- Un acordeón abierto a la vez (`openAccordionId`)
- Auto-abrir al entrar en ruta del grupo
- Al navegar: `onNavigate` cierra el drawer

## Layout y portal

- `createPortal(..., document.body)` tras `mounted`
- `fixed right-0`, slide `translate-x-full` / `translate-x-0`
- Altura/top: `--banner-height`, `--mobile-header-height`, `--mobile-breadcrumb-height`
- z-index: `z-[110]`

## Prohibido

- Añadir ítems solo en `Menu.tsx` sin entrada en `modules.ts`
- Crear otro menú lateral ad hoc en páginas de módulo
- Duplicar lógica de visibilidad por rol fuera de `modules.ts`
- Hardcodear títulos de módulos en `Menu.tsx`

## Checklist final

```
- [ ] Entrada en modules.ts (id, title, subtitle, desc, href)
- [ ] Permisos coherentes con proxy y backend
- [ ] Icono Lucide en MODULE_ICONS o MENU_OPTION_ICONS
- [ ] Ruta app/ existente
- [ ] IDs menu-* si aplica
- [ ] Tipo correcto: link directo vs acordeón vs modal
- [ ] Probar con roles distintos
```
