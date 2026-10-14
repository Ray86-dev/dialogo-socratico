# Diálogo socrático

Aplicación web para móvil con la que el alumnado de Filosofía de 4.º ESO del IES San Nicolás practica el **arte de la mayéutica** dialogando con Sócrates. Está gamificada: el diálogo avanza por las fases del élenchos y se ganan logros por cada movimiento socrático. Al final se descarga un **PDF** maquetado como un diálogo platónico, listo para entregar en el aula virtual.

## Cómo se usa en clase

1. Proyecta **<https://ray86-dev.github.io/dialogo-socratico/proyector>**. Muestra un QR grande e indica si Sócrates está listo.
2. El alumnado escanea el QR, escribe **solo su nombre de pila** y elige una de las cinco preguntas.
3. Dialoga con Sócrates. Si se queda sin ideas, pulsa el botón de pista (Lechuza, Lisis, Glaucón, Oráculo o Chat, según el tema).
4. Al terminar, pulsa **PDF**, escribe una reflexión final opcional y descarga el archivo para subirlo a la tarea.

| Pregunta | Ambientación | Ayudante de pistas |
|---|---|---|
| ¿Qué es la belleza? | Ágora de Atenas: mármol y oro | La lechuza de Atenea |
| ¿Ser libre es hacer lo que quiero? | Palestra, como en el *Lisis*: cerámica de figuras rojas | Lisis |
| ¿Harías lo correcto si nadie te viera? | Noche de antorchas, con el anillo de Giges | Glaucón |
| ¿Puede pensar una inteligencia artificial? | Neo-Atenas 2077: ciberpunk y lluvia de código | El Oráculo |
| ¿Somos lo que mostramos en redes? | La caverna digital: neón y *vaporwave* | El chat del directo |

### Gamificación

- **Camino de la sabiduría**: 4 fases (Opinión → Examen → Aporía → Alumbramiento), como en el fragmento del *Lisis* leído en clase.
- **Logros**: Doxa, Definición, Ejemplo, Contraejemplo, Tábano (preguntar a Sócrates), Ojo de lechuza (detectar la ironía), Sé que no sé (reconocer la aporía) y Alumbramiento (reformular la idea).
- **Marcas de lectura** (botón del lápiz): resaltan en azul las preguntas mayéuticas y en naranja subrayado la ironía, con la misma convención que el texto del *Lisis*.

### El PDF

Se titula con el nombre del estudiante, como los diálogos de Platón: *«Lucía, o sobre la belleza»*. Incluye:
- Portada ilustrada según el tema.
- El diálogo dividido por fases y con numeración al margen al estilo Stephanus.
- Las marcas de lectura.
- El resumen de logros, puntos y pistas usadas.
- La reflexión final.

## Puesta en marcha

- **Web**: <https://ray86-dev.github.io/dialogo-socratico/>. Se publica en **GitHub Pages** automáticamente con cada `git push` a `main` (`.github/workflows/pages.yml`).
- **Proyector**: <https://ray86-dev.github.io/dialogo-socratico/proyector>.
- **Servidor de Sócrates**: una función de **Supabase** (`supabase/functions/socrates`, proyecto `dialogo-socratico`) que guarda la clave de DeepSeek y añade las instrucciones del personaje.

### Clave de DeepSeek (una sola vez)

1. Abre [los secretos de las funciones del proyecto en Supabase](https://supabase.com/dashboard/project/klxpfmkpwoszzrnhyfsn/functions/secrets).
2. Añade `DEEPSEEK_API_KEY` con tu clave de [platform.deepseek.com](https://platform.deepseek.com). Se aplica al momento, sin volver a desplegar.
3. Abre `/proyector`: el indicador debe decir «Sócrates está listo para dialogar».

Opcionales: `DEEPSEEK_MODEL` (por defecto `deepseek-flash`) y `DEEPSEEK_BASE_URL`.

> En el plan gratuito, Supabase **pausa el proyecto tras 7 días sin uso**. Si la app deja de responder después de unas vacaciones, reactívalo desde el panel de Supabase.

### Probar en local

```bash
npm run dev:mock   # respuestas simuladas, sin gastar saldo
npm run dev        # usa la clave de .env.local (copia .env.example)
```

Se abre en `http://localhost:3000`. No hace falta instalar dependencias.

### Volver a desplegar la función tras cambiar `supabase/functions/`

```bash
npx supabase functions deploy socrates --project-ref klxpfmkpwoszzrnhyfsn
```

## Cómo está hecho

- **Interfaz** (`public/`): HTML, CSS y JavaScript sin framework. Es una web para móvil, sin instalación. El progreso se guarda en el propio móvil (`localStorage`), así que recargar no borra el diálogo. La dirección del servidor está en `public/js/config.js`.
- **Servidor** (`supabase/functions/`): la función solo acepta peticiones desde la web publicada y desde el servidor local de pruebas. La clave de DeepSeek y las instrucciones de Sócrates nunca llegan al móvil. La lógica (`_shared/`) es la misma que usa `dev-server.js` en local.
- **Instrucciones del personaje** (`supabase/functions/_shared/prompts.js`): método mayéutico, ironía amable, fases, estilo, marcas y límites. Sócrates no sale del papel, no dice que es una IA ni qué modelo es, no acepta temas ajenos y deriva al profesorado y al 024 o ANAR ante cualquier señal de riesgo. Además, el servidor filtra autodelaciones («soy una IA», nombres de modelos) y regenera la respuesta si aparecen.
- **PDF** (`public/js/pdf.js`): se genera en el móvil con jsPDF.
- **Base teórica**: [`docs/mayeutica.md`](docs/mayeutica.md).

### Privacidad

- El **nombre no sale del móvil**: Sócrates escribe `{nombre}` y la app lo sustituye en pantalla.
- Los mensajes sí pasan por Supabase (servidores en Irlanda) hacia DeepSeek para generar las respuestas. Conviene recordar al alumnado que no escriba datos personales. La pantalla de inicio también lo avisa e indica que Sócrates es un personaje interpretado por IA.

### Coste orientativo

Con `deepseek-flash`, un diálogo completo de unos 30 turnos cuesta del orden de céntimos. Una clase entera suele quedar por debajo de un euro. Supabase y GitHub Pages son gratuitos para este uso.

### Cambiar o añadir preguntas

Cada pregunta tiene dos partes:
- `public/js/topics.js`: lo que ve el alumnado (título, saludo inicial, ambientación).
- `supabase/functions/_shared/prompts.js`: lo que guía a Sócrates (escena, voz, líneas de exploración).

Para un tema nuevo hay que añadirlo en ambos ficheros con el mismo `id` y volver a desplegar la función.
