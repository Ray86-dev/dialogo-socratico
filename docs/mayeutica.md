# El arte de la mayéutica: ironía y arte de preguntar

Documento de base del proyecto. Resume qué es el método socrático y cómo se ha traducido en las instrucciones que sigue el personaje de Sócrates en la aplicación (`supabase/functions/_shared/prompts.js`).

## 1. Qué es la mayéutica

*Mayéutica* viene del griego *maieutiké (téchne)*, «el arte de la partera» (*maîa*, comadrona). La imagen procede del propio Sócrates en el *Teeteto* (148e-151d): su madre, Fenáreta, era partera, y él dice ejercer el mismo oficio, pero con las almas y no con los cuerpos.

Tres rasgos del pasaje son la clave de la actividad:

1. **Sócrates es «estéril» de sabiduría** (150c). No enseña doctrinas ni da respuestas: ayuda a que el otro alumbre lo que lleva dentro. Por eso pregunta en lugar de explicar.
2. **El parto duele** (151a). Quien es examinado pasa por la incomodidad de ver que no sabía lo que creía saber. Esa incomodidad es productiva.
3. **La partera examina lo que nace** (150b-c). No todo lo que el alma «da a luz» es verdadero: el diálogo sirve para distinguir una idea sólida de una «apariencia», un huevo huero.

En la *Apología* (21d) aparece la actitud de fondo: «lo que no sé, tampoco creo saberlo». La fórmula popular «solo sé que no sé nada» es una versión posterior y simplificada de esa idea.

## 2. Las dos caras del método: ironía y mayéutica

En la tradición escolar el método se presenta en dos momentos.

| Momento | Función | Qué hace Sócrates |
|---|---|---|
| **Ironía** (*pars destruens*) | Desmontar la falsa seguridad | Finge ignorancia, elogia de forma exagerada el saber del otro, se muestra sorprendido ante sus contradicciones |
| **Mayéutica** (*pars construens*) | Ayudar a alumbrar una idea mejor | Pregunta paso a paso, pide definiciones, ejemplos y razones, hasta que el interlocutor reformula por sí mismo |

### La ironía socrática

*Eironeía* significaba en griego «disimulo». Trasímaco acusa a Sócrates de practicar «su habitual ironía» (*República* I, 337a), y Alcibíades dice que se pasa la vida ironizando (*Banquete* 216e). Gregory Vlastos (*Socrates: Ironist and Moral Philosopher*, 1991) habla de **ironía compleja**: cuando Sócrates dice «no sé nada» dice algo verdadero en un sentido (no posee un saber cierto y definitivo) y falso en otro (sabe examinar, preguntar y detectar contradicciones).

Formas de ironía en los diálogos, todas presentes en el *Lisis* leído en clase:

- **Ignorancia fingida**: «yo, que no sé nada…».
- **Elogio exagerado**: «tú, que sabes tanto, me sacarás del apuro».
- **Sorpresa fingida**: «¿Cómo así? ¿Quieren que seas dichoso y te impiden hacer tu voluntad?» (*Lisis*, fragmento leído en clase).
- **Exageración** que lleva una idea al absurdo: «En definitiva, tú, Lisis, ni haces ni diriges nada a tu voluntad».

Para 4.º de ESO conviene subrayar que **la ironía socrática no es burla**. Es un guiño que invita a pensar. Por eso la aplicación exige una ironía amable, nunca humillante.

### Otras imágenes con las que Sócrates se describe

- **El tábano** (*Apología* 30e): pica a Atenas, como a un caballo perezoso, para que no se duerma.
- **El pez torpedo**, la tremielga (*Menón* 80a): Menón dice que Sócrates «paraliza» a quien habla con él, porque lo deja sin respuestas. Es la **aporía**.

## 3. El arte de preguntar: la estructura del élenchos

El *élenchos* (refutación, examen) sigue un patrón reconocible, que el fragmento del *Lisis* (207d-209c) muestra con claridad:

1. **Opinión inicial (dóxa).** El interlocutor afirma algo con seguridad. *Lisis: ser feliz es poder hacer lo que uno quiere.*
2. **Examen.** Sócrates obtiene su acuerdo en pasos pequeños (premisas) y lo pone a prueba con casos concretos. *Tus padres te quieren y quieren tu felicidad; sin embargo no te dejan conducir el carro ni tocar el telar.*
3. **Aporía.** Aparece una contradicción: el interlocutor no puede sostener a la vez todo lo que ha dicho. Ensaya una salida (*«es porque aún no tengo la edad»*) y Sócrates la refuta con contraejemplos (*te dejan escribir y tocar la lira*).
4. **Alumbramiento.** El interlocutor formula él mismo una idea mejor. *«Unas cosas las sé y otras no las sé»*: la libertad depende del saber, no de la edad.

Lo decisivo es que **la conclusión la enuncia Lisis, no Sócrates**.

### Tipos de pregunta socrática

Tipos de pregunta habituales en los diálogos platónicos, ordenados en la línea de la taxonomía didáctica de R. Paul y L. Elder:

| Tipo | Ejemplo |
|---|---|
| Pedir una definición general («¿qué es X?») | No preguntar qué cosas son bellas, sino qué es lo bello en sí (idea central del *Hipias Mayor*) |
| Pedir ejemplos | «¿Me pones un caso de tu vida?» |
| Proponer contraejemplos y casos límite | «¿Y una persona que hace lo que quiere pero no puede dejar el móvil, es libre?» |
| Pedir razones | «¿Por qué piensas eso?» |
| Sacar consecuencias | «Si eso es así, ¿no se seguiría que…?» |
| Contrastar con lo dicho antes | «Antes dijiste que…, y ahora que…: ¿pueden ser verdad las dos cosas?» |
| Cambiar de perspectiva | «¿Qué diría alguien que no piensa como tú?» |

Los diálogos de definición (*Eutifrón* sobre la piedad, *Laques* sobre el valor, *Hipias Mayor* sobre la belleza) suelen terminar en aporía. Para un primer acercamiento a la filosofía es bueno que el alumnado lo viva: no llegar a una respuesta definitiva no es fracasar. *Hipias Mayor* se cierra con un «lo bello es difícil» (304e).

## 4. Cómo se ha trasladado a la aplicación

| Principio | Decisión de diseño |
|---|---|
| Sócrates no da respuestas | El personaje tiene prohibido dar la conclusión o hacer la tarea; solo pregunta, contraejemplifica y devuelve la pregunta |
| Ironía amable | Ironía obligatoria pero nunca humillante; marcada como `<iro>` |
| Una pregunta cada vez | Turnos breves (2-5 frases), una o dos preguntas como máximo, marcadas como `<may>` |
| Estructura del élenchos | Las 4 fases (Opinión → Examen → Aporía → Alumbramiento) forman la barra de progreso del juego |
| Movimientos del alumnado | Los logros premian definir, ejemplificar, contraejemplificar, preguntar a Sócrates, detectar la ironía, reconocer la aporía y reformular |
| La aporía es valiosa | Llegar a la aporía cuenta como avance, no como error |
| Marcas de lectura | El chat y el PDF usan la misma convención que el texto del *Lisis* trabajado en clase: azul para la mayéutica y naranja subrayado para la ironía |

## Referencias

- Platón, *Teeteto* 148e-151d; *Apología* 21a-23b y 30e; *Menón* 80a-b y 82b-85b; *República* I 337a y II 359c-360d (anillo de Giges); *Banquete* 216e; *Hipias Mayor* 304e; *Lisis* 207d-210d. Traducciones recomendadas: Biblioteca Clásica Gredos.
- G. Vlastos, *Socrates: Ironist and Moral Philosopher*, Cambridge University Press, 1991.
- R. Paul y L. Elder, *The Thinker's Guide to the Art of Socratic Questioning*, Foundation for Critical Thinking, 2006.
- S. Kierkegaard, *Sobre el concepto de ironía en constante referencia a Sócrates* (1841).
