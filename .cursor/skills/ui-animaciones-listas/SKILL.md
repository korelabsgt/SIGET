---
name: ui-animaciones-listas
description: Anima entradas y salidas de filas, tarjetas o bloques repetibles con framer-motion AnimatePresence y layout. Se usa al agregar o quitar ítems manualmente en formularios, listas dinámicas o acordeones.
---

# Animaciones de listas

Siempre **framer-motion** al agregar o quitar filas, tarjetas o bloques repetibles.

## Patrón obligatorio

```tsx
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence mode="popLayout" initial={false}>
  {items.map((item) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.99 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* contenido */}
    </motion.div>
  ))}
</AnimatePresence>
```

## Reglas

- `mode="popLayout"` e `initial={false}` en el `AnimatePresence`.
- Cada ítem: `layout` + entrada `opacity`/`y` + salida suave inversa.
- Duración ~0.25–0.35 s; easing `[0.4, 0, 0.2, 1]`.
- Respetar `useReducedMotion` o `motion-reduce:transition-none` cuando aplique.
- Sin sombras en las animaciones de entrada/salida.

## Prohibido

- Montar o desmontar ítems sin animación cuando el usuario añade o quita manualmente.
- `useEffect` solo para animar; la animación va en el render con framer-motion.
