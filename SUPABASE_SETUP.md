# Publicar la versión de 7 partes

Hazlo cuando los aprendices NO estén presentando la evaluación.

## 1. Base de datos (primero)
1. Supabase → SQL Editor → pega todo `supabase-migration-2026-11.sql` → Run.
2. Qué hace:
   - Crea `fichas` (con la ficha 3230441) y `assessment_results` (Evaluaciones 2, 3 y final).
   - No borra nada. La tabla `student_results` (Evaluación 1) conserva su estructura y sus datos.
   - Cambia la ficha de TODOS los resultados existentes a 3230441 (autorizado).
3. Si quieres revisar antes qué fichas escribieron, ejecuta primero la consulta comentada al inicio del archivo.

## 2. Seguridad: la nota la calcula el servidor
Todo lo que se publica en un sitio web se puede ver y cambiar con "Inspeccionar"; eso no se puede evitar.
Por eso el sitio ya no lleva las respuestas de las evaluaciones ni guarda notas: solo envía las opciones elegidas
y Supabase califica con las claves guardadas en la tabla `answer_keys`, que los aprendices no pueden leer.

1. En la terminal: `node tools/publicar.js` → crea la carpeta `publicar/` (sin respuestas) y `supabase-claves.sql`.
2. Supabase → SQL Editor → ejecuta `supabase-seguridad-2026-11.sql`.
3. Luego ejecuta `supabase-claves.sql`. Repite los pasos 1 y 3 cada vez que cambies una evaluación en `content.js`.

## 3. Sitio (después)
Sube a Netlify **solo el contenido de la carpeta `publicar/`**. Nunca subas el `content.js` de la raíz (tiene las respuestas)
ni los `.sql`, `docs/`, `tests/`, `tools/`, `legacy/`, el PDF o el DOCX.

## 4. Uso
- La profesora entra a `admin.html`, agrega las fichas y puede desactivarlas cuando terminen.
- El aprendiz elige su ficha de la lista antes de cada evaluación.
- La evaluación final se presenta una sola vez por nombre y ficha.

## Pruebas
`node --test tests/tyt.test.js`
