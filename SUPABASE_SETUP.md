# Publicar la versión de 7 partes

Hazlo cuando los aprendices NO estén presentando la evaluación.

## 1. Base de datos (primero)
1. Supabase → SQL Editor → pega todo `supabase-migration-2026-11.sql` → Run.
2. Qué hace:
   - Crea `fichas` (con la ficha 3230441) y `assessment_results` (Evaluaciones 2, 3 y final).
   - No borra nada. La tabla `student_results` (Evaluación 1) conserva su estructura y sus datos.
   - Cambia la ficha de TODOS los resultados existentes a 3230441 (autorizado).
3. Si quieres revisar antes qué fichas escribieron, ejecuta primero la consulta comentada al inicio del archivo.

## 2. Sitio (después)
Sube a Netlify solo: `index.html`, `admin.html`, `style.css`, `app.js`, `admin.js`, `content.js`, `engine.js`, `supabase-config.js`.
No hace falta subir `docs/`, `tests/`, `legacy/`, los `.sql`, ni el PDF/DOCX.

## 3. Uso
- La profesora entra a `admin.html`, agrega las fichas y puede desactivarlas cuando terminen.
- El aprendiz elige su ficha de la lista antes de cada evaluación.
- La evaluación final se presenta una sola vez por nombre y ficha.

## Pruebas
`node --test tests/tyt.test.js`
