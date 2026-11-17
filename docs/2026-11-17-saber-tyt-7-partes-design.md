# Saber TyT Inglés – 7 partes · Diseño

## Para qué
Aprendices del SENA deben entender las 7 partes del módulo de Inglés Saber TyT, practicarlas y ser evaluados.
La profesora organiza los resultados por ficha. La evaluación final es la nota definitiva.

## Metas
- Una sección de aprendizaje por cada parte (1–7): en qué consiste, cómo se resuelve paso a paso, errores típicos, ejemplo resuelto e interactivo.
- Apartado "Claves del inglés" (consejos transversales), con énfasis en:
  - Preguntas WH (what, where, when, who, why, how, which, how much/many) → respuesta con información.
  - Preguntas que NO son WH (Do/Does/Did, Is/Are/Was, Can/Could, Will, Have/Has…) → respuesta cerrada: Yes/No + auxiliar ("Yes, I do", "No, it isn't").
  - Solicitudes/ofrecimientos (Could you…? Would you like…?) → aceptar o rechazar con cortesía.
- Evaluaciones:
  1. **Evaluación 1 – Partes 1, 2, 3**: mismas 15 preguntas actuales, sin cambios de contenido. Solo nuevo diseño (incluido el cartel/aviso de la parte 2).
  2. **Evaluación 2 – Partes 4, 5**: preguntas originales nuevas.
  3. **Evaluación 3 – Partes 6, 7**: preguntas originales nuevas.
  4. **Evaluación final – Partes 1 a 7**: preguntas originales nuevas, nota definitiva.
- Fichas: la profesora agrega/desactiva fichas en el panel; el aprendiz elige su ficha de una lista (no la escribe).
- Panel: filtro por ficha y por evaluación, promedios, CSV.
- Todos los resultados existentes pasan a ficha **3230441**, que queda creada.

## No metas
- Cuentas de usuario para aprendices.
- Copiar preguntas del cuadernillo ICFES (prohíbe reproducción/adaptación): se usa solo como referencia de formato.

## Anti-metas (sería un fracaso aunque funcione)
- Perder o alterar datos existentes (salvo el cambio de ficha autorizado).
- Cambiar el sitio en vivo mientras los aprendices trabajan. Nada se publica ni se ejecuta en Supabase hasta que la profesora lo decida.

## Formato de cada parte (referencia ICFES)
| Parte | Tarea | Opciones |
|---|---|---|
| 1 | Relacionar descripciones con palabras de un banco | 8 palabras, sobran |
| 2 | ¿Dónde se ve este aviso? | A/B/C (la Evaluación 1 conserva sus 4 lugares) |
| 3 | Conversación corta: elegir la respuesta | A/B/C |
| 4 | Texto con espacios (gramática/vocabulario) | A/B/C |
| 5 | Comprensión de lectura literal | A/B/C |
| 6 | Comprensión de lectura (inferencia, propósito, opinión del autor) | A/B/C/D |
| 7 | Texto con espacios (gramática y vocabulario) | A/B/C/D |

## Cantidad de preguntas (decisión mía)
- Evaluación 1: 15 (5+5+5, existente).
- Evaluación 2: 12 (parte 4: 6, parte 5: 6).
- Evaluación 3: 12 (parte 6: 6, parte 7: 6).
- Final: 28 (4 por parte). La profesora confirmó dejar estas cantidades.

## Reglas de la final
- Una sola vez por aprendiz y ficha: bloqueo en el navegador + índice único en la base (ficha + nombre normalizado + evaluación final).
  Límite: si alguien escribe su nombre distinto o cambia de equipo, podría repetir; la profesora lo verá en el panel.
- Al terminar ve su nota y tiempo, pero no las respuestas correctas.
- Las evaluaciones 1–3 muestran explicaciones al final.

## Base de datos (Supabase) – migración no destructiva
- `student_results` (existente): no se borra ni cambia estructura. Sigue recibiendo la Evaluación 1. Única modificación: `update ... set group_name = '3230441'`.
- Tabla nueva `fichas` (code, nombre, activa, created_at). Lectura pública de fichas activas; insertar/editar solo el correo admin.
- Tabla nueva `assessment_results` (id, evaluation, student_name, ficha, completed_at, scores jsonb por parte, total_correct, total_questions, percent, duration_seconds, missed jsonb). Insert anónimo, lectura solo admin, igual que la tabla actual.
- Todo en un archivo `supabase-migration-2026-11.sql`, con transacción, para ejecutar a mano en el SQL Editor cuando se decida.

## Cómo se construye (enfoques)
1. **Elegido: HTML/CSS/JS sin framework, como ahora.** Se publica en Netlify arrastrando la carpeta, sin paso de compilación; reutiliza el flujo de Supabase que ya funciona.
2. React/Vite: más estructura pero agrega build y dependencias sin beneficio real aquí. Descartado.
3. Modificar la tabla existente para aceptar todas las evaluaciones: obliga a quitar restricciones sobre datos vivos. Descartado por riesgo.

## Diseño visual (decisión mía)
Rediseño completo: tipografía moderna (Google Fonts), paleta verde SENA como acento sobre neutros cálidos, tarjetas limpias, navegación por las 7 partes, modo claro/oscuro, responsive (celular primero, ya que muchos aprendices usan el celular).
El aviso de la parte 2 se muestra como un cartel real (placa con borde, ícono, tipografía de señalización).

## Queda a criterio del constructor
Textos exactos de lecciones, preguntas originales, microinteracciones y estructura interna de archivos.
