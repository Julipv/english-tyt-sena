"use strict";
(function () {
// Datos originales de práctica y Evaluación 1 (copiados sin cambios del sitio anterior).
const practice = {
  part1: [
    {
      bank: ["telescope", "whisk", "lighthouse", "apron", "seedling", "necklace", "cushion", "measuring cup"],
      questions: [
        { prompt: "You look through this to see the moon and distant stars more clearly.", answer: "telescope", keywords: ["look through", "moon", "distant stars"], explanation: "Un telescope amplía objetos lejanos del cielo; las otras opciones no sirven para observar estrellas." },
        { prompt: "A cook uses this wire tool to mix eggs quickly in a bowl.", answer: "whisk", keywords: ["cook", "wire tool", "mix eggs"], explanation: "Un whisk mezcla ingredientes con sus alambres delgados." },
        { prompt: "This tall building sends a light across the sea to guide boats at night.", answer: "lighthouse", keywords: ["light", "sea", "boats"], explanation: "Un lighthouse ayuda a orientar las embarcaciones cerca de la costa." },
        { prompt: "You wear this over your clothes while preparing food to keep them clean.", answer: "apron", keywords: ["wear", "over your clothes", "preparing food"], explanation: "Un apron cubre la ropa mientras se cocina o se realizan otras tareas." },
        { prompt: "A very young plant that has just started to grow is called this.", answer: "seedling", keywords: ["young plant", "started to grow"], explanation: "Seedling es una planta pequeña en sus primeras etapas de crecimiento." }
      ]
    },
    {
      bank: ["compass", "thermos", "binoculars", "calendar", "screwdriver", "diary", "fountain", "suitcase"],
      questions: [
        { prompt: "Hikers use this instrument to find north when they are away from roads.", answer: "compass", keywords: ["hikers", "find north"], explanation: "La aguja de un compass indica direcciones y ayuda a orientarse." },
        { prompt: "This container keeps tea warm for several hours after you pour it in.", answer: "thermos", keywords: ["container", "keeps tea warm"], explanation: "Un thermos conserva la temperatura de las bebidas." },
        { prompt: "You hold this with both hands to watch birds far away through two lenses.", answer: "binoculars", keywords: ["both hands", "birds far away", "two lenses"], explanation: "Binoculars tienen dos lentes y permiten observar objetos lejanos." },
        { prompt: "This printed chart helps you see the days and months of the year.", answer: "calendar", keywords: ["days", "months", "year"], explanation: "Un calendar organiza los días y meses del año." },
        { prompt: "A repair worker turns this tool to tighten or loosen a screw.", answer: "screwdriver", keywords: ["tool", "tighten", "screw"], explanation: "Un screwdriver está diseñado para girar tornillos." }
      ]
    }
  ],
  part2: [
    [
      { message: "FEEDING TIME IS AT 3:30. PLEASE KEEP HANDS OUT OF THE TANK.", kind: "notice", icon: "🐠", places: ["Aquarium", "Art studio", "Bus station", "Bakery"], answer: 0, clue: "“Tank” y la hora de alimentar animales señalan un espacio con vida acuática.", feedback: "Los acuarios tienen tanques con animales; el aviso también explica una regla para protegerlos." },
      { message: "RETURN YOUR AUDIO GUIDE AT THE EXIT.", kind: "info", icon: "🎧", places: ["Museum", "Pharmacy", "Farm", "Sports centre"], answer: 0, clue: "Un audio guide acompaña a las personas mientras recorren una exposición.", feedback: "Los visitantes suelen pedir y devolver guías de audio en un museo." },
      { message: "PLEASE LEAVE YOUR WET PAINTINGS ON THE DRYING RACK.", kind: "notice", icon: "🎨", places: ["Art classroom", "Airport gate", "Restaurant", "Garden shop"], answer: 0, clue: "La pintura húmeda y una rejilla para secar son pistas del tipo de actividad.", feedback: "En un salón de arte se pintan trabajos y se dejan secar antes de guardarlos." },
      { message: "SEEDS AND GARDEN TOOLS MUST BE CLEANED BEFORE STORAGE.", kind: "notice", icon: "🌿", places: ["Community garden", "Cinema", "Hotel lobby", "Computer lab"], answer: 0, clue: "El aviso menciona semillas y herramientas para cuidar plantas.", feedback: "Un jardín comunitario utiliza semillas y herramientas que deben limpiarse y guardarse." },
      { message: "PLEASE DO NOT TOUCH THE GLASS DISPLAY.", kind: "warning", icon: "🪸", places: ["Aquarium exhibit", "Train platform", "Bakery kitchen", "Gym changing room"], answer: 0, clue: "Una vitrina de vidrio protege algo que las personas observan.", feedback: "Una exhibición de acuario puede tener paneles de vidrio que se deben mantener limpios." }
    ],
    [
      { message: "SOUND CHECK IN PROGRESS. PLEASE USE THE SIDE DOOR.", kind: "notice", icon: "🎙️", places: ["Recording studio", "Post office", "Swimming pool", "Bookshop"], answer: 0, clue: "Un sound check se realiza para probar micrófonos e instrumentos.", feedback: "Los estudios de grabación hacen pruebas de sonido antes de comenzar a grabar." },
      { message: "CHILDREN MUST STAY WITH AN ADULT ON THIS TRAIL.", kind: "warning", icon: "🥾", places: ["Nature reserve", "Shopping centre", "Bus depot", "Kitchen"], answer: 0, clue: "Un trail es una ruta para caminar, normalmente en un entorno natural.", feedback: "En una reserva natural, los niños deben permanecer acompañados durante el recorrido." },
      { message: "PLACE USED PAINTBRUSHES IN THE WATER JAR.", kind: "notice", icon: "🖌️", places: ["Art classroom", "Train station", "Bakery", "Hotel room"], answer: 0, clue: "Los pinceles usados y un frasco con agua aparecen después de pintar.", feedback: "El salón de arte es el lugar donde se usan y limpian los pinceles." },
      { message: "COLLECT YOUR PRINTS AFTER THE GREEN LIGHT APPEARS.", kind: "info", icon: "📷", places: ["Photo lab", "Library", "Farm", "Cafeteria"], answer: 0, clue: "Prints y una luz que indica que se puede recoger un pedido sugieren fotografías.", feedback: "Un laboratorio fotográfico prepara impresiones para que sus clientes las recojan." },
      { message: "PLEASE WASH YOUR HANDS BEFORE HANDLING THE PRODUCE.", kind: "notice", icon: "🍎", places: ["Farmers' market stall", "Cinema entrance", "Computer room", "Bus stop"], answer: 0, clue: "Produce se refiere a frutas y verduras frescas.", feedback: "En un puesto de mercado se manipulan frutas y verduras, por eso se pide higiene." }
    ]
  ],
  part3: [
    [
      { a: "What did the chef add to the soup?", b: "________", options: ["A little more pepper.", "At the front door.", "Because it was Tuesday."], answer: 0, intent: "WH question · cosa", explanation: "What pregunta por una cosa; “A little more pepper” indica qué agregó el chef." },
      { a: "Could you hold this ladder while I fix the sign?", b: "________", options: ["Of course. Tell me when you're ready.", "It's made of metal.", "At the hardware store."], answer: 0, intent: "Solicitud · ayuda", explanation: "La persona solicita ayuda; aceptar y ofrecer disponibilidad responde de forma natural." },
      { a: "How did your team travel to the island?", b: "________", options: ["By ferry, early this morning.", "My cousin chose the blue one.", "Because the weather changed."], answer: 0, intent: "WH question · manera", explanation: "How pregunta cómo viajaron; “By ferry” describe el medio de transporte." },
      { a: "Are the new seats comfortable?", b: "________", options: ["Yes, they have soft cushions.", "Near the ticket desk.", "They arrived on Monday."], answer: 0, intent: "Yes/No question · descripción", explanation: "Are the seats…? espera una respuesta afirmativa o negativa sobre su comodidad." },
      { a: "I really appreciate your help with the project.", b: "________", options: ["I'm glad I could help.", "The project is on the second floor.", "It took three weeks."], answer: 0, intent: "Agradecimiento", explanation: "La persona expresa gratitud; “I'm glad I could help” es una respuesta amable." }
    ],
    [
      { a: "When will the science exhibition open?", b: "________", options: ["At ten o'clock on Saturday.", "In the blue display case.", "Because the room is large."], answer: 0, intent: "WH question · tiempo", explanation: "When pregunta cuándo; la respuesta indica una hora y un día." },
      { a: "Would you like to try a piece of this mango cake?", b: "________", options: ["Yes, please. It smells delicious.", "At the end of the street.", "I baked it yesterday."], answer: 0, intent: "Invitación · ofrecimiento", explanation: "La persona ofrece comida; aceptar amablemente es una respuesta apropiada." },
      { a: "Who designed the poster for the festival?", b: "________", options: ["Our art club did.", "Next Thursday afternoon.", "With a blue marker."], answer: 0, intent: "WH question · persona", explanation: "Who pregunta quién realizó el diseño; la respuesta identifica al grupo." },
      { a: "Did you remember to water the balcony plants?", b: "________", options: ["Yes, I watered them before breakfast.", "They are beside the window.", "Because the pots are green."], answer: 0, intent: "Yes/No question · pasado", explanation: "Did you remember…? pregunta si se realizó la acción; “Yes” responde y agrega cuándo." },
      { a: "The printer has stopped working again.", b: "________", options: ["I can check the paper tray for you.", "It printed twelve pages.", "At the copy shop downtown."], answer: 0, intent: "Comentario · ofrecer ayuda", explanation: "Ante un problema con la impresora, ofrecer revisar una posible causa es una respuesta útil." }
    ]
  ]
};

const evaluation = {
  part1: {
    bank: ["sunscreen", "canoe", "tongs", "puzzle", "diary", "waterfall", "kettle", "backpack"],
    questions: [
      { prompt: "You spread this cream on your skin before spending time in strong sunlight.", answer: "sunscreen", keywords: ["cream", "skin", "strong sunlight"], explanation: "Sunscreen protege la piel de los rayos del sol." },
      { prompt: "A small narrow boat that moves through water with a paddle is a ____.", answer: "canoe", keywords: ["small boat", "water", "paddle"], explanation: "A canoe is a small boat that is moved with a paddle." },
      { prompt: "A cook uses this two-armed tool to pick up hot pieces of food.", answer: "tongs", keywords: ["two-armed tool", "hot food"], explanation: "Tongs permiten sujetar alimentos calientes sin tocarlos con las manos." },
      { prompt: "You put many small pieces together to make the complete picture in this game.", answer: "puzzle", keywords: ["small pieces", "complete picture"], explanation: "Un puzzle se resuelve uniendo piezas para formar una imagen." },
      { prompt: "People write personal thoughts or daily events in this book.", answer: "diary", keywords: ["write", "personal thoughts", "daily events"], explanation: "A diary is a personal record of thoughts or events." }
    ]
  },
  part2: [
    { message: "PLEASE WAIT FOR YOUR GROUP BEFORE ENTERING THE PLANETARIUM.", kind: "notice", icon: "🪐", places: ["Planetarium", "Post office", "Greenhouse", "Bus depot"], answer: 0, clue: "A planetarium welcomes groups to a show about space.", feedback: "El planetario organiza el ingreso de los grupos antes de una función sobre el espacio." },
    { message: "PLEASE PLACE YOUR RETURNS IN THE BLUE BOX.", kind: "info", icon: "📬", places: ["Post office", "Art classroom", "Swimming pool", "Restaurant"], answer: 0, clue: "Returns placed in a box are handled as part of a delivery service.", feedback: "Una oficina postal recibe cartas y paquetes que se devuelven." },
    { message: "KEEP THE WALKWAY CLEAR FOR THE PARADE.", kind: "warning", icon: "🥁", places: ["Town square", "Computer lab", "Doctor's office", "Train cabin"], answer: 0, clue: "A parade needs an open route for people to walk through.", feedback: "La plaza principal suele ser el recorrido de desfiles y necesita espacio libre." },
    { message: "PLEASE LABEL YOUR LUNCHBOX BEFORE PLACING IT ON THE SHELF.", kind: "notice", icon: "🍱", places: ["Day-care centre", "Cinema", "Garden centre", "Bus terminal"], answer: 0, clue: "Lunchboxes are stored during the day in a place that cares for children.", feedback: "En un centro infantil guardan las loncheras de los niños en estantes compartidos." },
    { message: "PLEASE RETURN YOUR RENTED SKATES BEFORE CLOSING.", kind: "info", icon: "⛸️", places: ["Ice rink", "Flower shop", "Airport", "Bookshop"], answer: 0, clue: "Skates are special footwear used on ice.", feedback: "Una pista de hielo suele alquilar patines y recibirlos al final de la visita." }
  ],
  part3: [
    { a: "Where did you leave the sketchbook?", b: "________", options: ["On the table near the window.", "At half past four.", "Because it was raining."], answer: 0, intent: "WH question · lugar", explanation: "Where pregunta en qué lugar; la respuesta ubica el cuaderno." },
    { a: "Could you send me the recipe when you have a moment?", b: "________", options: ["Sure, I'll message it tonight.", "It's made with tomatoes.", "At the kitchen table."], answer: 0, intent: "Solicitud · respuesta", explanation: "La persona solicita que le envíen algo; aceptar y decir cuándo es apropiado." },
    { a: "Is the outdoor concert still happening this evening?", b: "________", options: ["Yes, the weather looks clear now.", "Beside the town hall.", "A very loud guitar."], answer: 0, intent: "Yes/No question · confirmación", explanation: "Is it happening? espera confirmar si el concierto se realizará o no." },
    { a: "Thanks for saving a seat for me.", b: "________", options: ["No problem. I'm glad you made it.", "It starts at seven.", "The seats are numbered."], answer: 0, intent: "Agradecimiento", explanation: "La persona agradece un favor; “No problem” responde amablemente." },
    { a: "Why is the classroom door open?", b: "________", options: ["The room needs some fresh air.", "In the main building.", "It opens outwards."], answer: 0, intent: "WH question · razón", explanation: "Why pide una razón; la respuesta explica el motivo." }
  ]
};
function varyPlaceAnswers(questions, answerOrder) {
  questions.forEach((question, index) => {
    const correctPlace = question.places.splice(question.answer, 1)[0];
    const answerIndex = answerOrder[index % answerOrder.length];
    question.places.splice(answerIndex, 0, correctPlace);
    question.answer = answerIndex;
  });
}
practice.part2.forEach((set, index) => varyPlaceAnswers(set, index === 0 ? [2, 0, 3, 1, 2] : [1, 3, 0, 2, 1]));
varyPlaceAnswers(evaluation.part2, [3, 0, 2, 1, 3]);

// ───────────── Las 7 partes ─────────────
const parts = {
  1: {
    label: "Parte 1", title: "Relacionar descripciones", en: "Matching descriptions", icon: "🔎", skill: "Vocabulario",
    summary: "Lees descripciones cortas y las relacionas con una palabra de un banco. Hay más palabras que descripciones: algunas sobran.",
    format: ["5 descripciones (en la prueba real) y un banco de 8 palabras.", "Cada palabra se usa una sola vez y sobran opciones.", "Evalúa vocabulario cotidiano: objetos, lugares, personas, profesiones."],
    steps: ["Lee primero todas las palabras del banco y piensa qué significa cada una.", "Lee la descripción completa y subraya las palabras clave (para qué sirve, dónde está, quién lo usa).", "Decide qué objeto, lugar o persona se describe.", "Busca esa palabra en el banco.", "Comprueba que encaje con TODA la descripción, no solo con una palabra."],
    mistakes: ["Elegir una palabra solo porque reconoces un término de la descripción.", "No leer la descripción hasta el final.", "Olvidar que algunas palabras del banco no se usan."],
    keys: ["“You use this to…” = sirve para…", "“You wear this…” = ropa o accesorio.", "“People go there to…” = un lugar.", "“This person…” = una profesión."],
    examples: [
      { part: 1, bank: ["measuring cup", "compass", "whisk", "backpack", "lighthouse", "seedling", "necklace", "thermos"], questions: [{ prompt: "You use this marked container to measure flour and milk while making a cake.", answer: "measuring cup", hint: "marked container · measure · ingredients", explanation: "Una measuring cup tiene marcas para medir ingredientes." }] },
      { part: 1, bank: ["tongs", "diary", "binoculars", "apron", "cushion", "whisk", "kettle", "seedling"], questions: [{ prompt: "You look through these to watch birds in a tree across the lake.", answer: "binoculars", hint: "look through · watch birds · across the lake", explanation: "Binoculars sirven para observar de cerca cosas que están lejos." }] }
    ]
  },
  2: {
    label: "Parte 2", title: "Avisos y lugares", en: "Notices and places", icon: "📍", skill: "Comprensión de avisos",
    summary: "Lees un aviso o letrero corto y eliges el lugar donde sería más probable encontrarlo.",
    format: ["5 avisos con 3 lugares posibles (A, B o C) en la prueba real.", "El aviso casi nunca dice el nombre del lugar: debes deducirlo.", "Evalúa si entiendes el propósito de un mensaje."],
    steps: ["Identifica el propósito: ¿informa, advierte, prohíbe, pide o anuncia?", "Busca palabras clave: passengers, tickets, silence, wet floor, patients, menu…", "Relaciona esas palabras con un lugar.", "Descarta los lugares donde el aviso no tendría sentido.", "Elige el lugar que mejor explica POR QUÉ estaría allí ese aviso."],
    mistakes: ["Elegir un lugar porque “podría ser” y no porque es el más lógico.", "Traducir palabra por palabra en vez de entender la idea.", "Ignorar palabras pequeñas como “Do not” (prohibición) o “Please” (petición)."],
    keys: ["Please + verbo = petición amable (Please wait here).", "Do not / Don't / No + -ing = prohibición (No smoking).", "Must = obligación (Visitors must sign in).", "Keep… = mantener (Keep off the grass, Keep left)."],
    examples: [
      { part: 2, questions: [{ message: "PLEASE CLOSE THE GLASS DOOR AFTER ENTERING. HELP KEEP THE PLANTS WARM.", kind: "notice", icon: "🌱", places: ["Airport", "Greenhouse", "Swimming pool", "Cinema"], answer: 1, hint: "glass door · plants warm", explanation: "Un greenhouse (invernadero) usa puertas de vidrio para conservar el calor de las plantas." }] },
      { part: 2, questions: [{ message: "FEEDING TIME IS AT 3:30. PLEASE KEEP HANDS OUT OF THE TANK.", kind: "warning", icon: "🐠", places: ["Aquarium", "Art studio", "Bus station", "Bakery"], answer: 0, hint: "feeding time · tank · animals", explanation: "Un aquarium tiene tanques con animales y horarios para alimentarlos." }] }
    ]
  },
  3: {
    label: "Parte 3", title: "Conversaciones cortas", en: "Short conversations", icon: "💬", skill: "Comunicación",
    summary: "Lees lo que dice una persona y eliges la respuesta más natural y lógica.",
    format: ["Una frase o pregunta y 3 respuestas posibles (A, B o C).", "Todas las opciones suelen estar bien escritas: solo una RESPONDE a lo que se dijo.", "Evalúa si entiendes la intención de quien habla."],
    steps: ["Lee la frase y entiende la situación.", "Identifica la intención: preguntar, pedir, invitar, ofrecer, agradecer, disculparse.", "Mira la primera palabra: ¿es una pregunta WH (what, where…) o una pregunta cerrada (Do, Is, Can…)?", "Elige la respuesta que corresponde a esa intención.", "Descarta opciones correctas en inglés pero que hablan de otra cosa."],
    mistakes: ["Responder “Yes/No” a una pregunta WH.", "Responder con un lugar cuando preguntan por un tiempo (where vs. when).", "Elegir la opción que repite palabras de la pregunta sin responderla."],
    keys: ["WH → información: Where? → un lugar · When? → un tiempo · Why? → Because…", "Do/Is/Can/Did…? → Yes/No + auxiliar: “Yes, I do.” “No, it isn't.”", "Could you…? / Can you…? → Sure / Of course / Sorry, I can't.", "Thank you → You're welcome / No problem."],
    examples: [
      { part: 3, questions: [{ a: "Could you tell me where the photography workshop is?", options: ["At 10:30 in the morning.", "In Studio B, beside the courtyard.", "Because she enjoys photography."], answer: 1, hint: "where → pregunta por un lugar", explanation: "Where pregunta dónde está algo. “In Studio B” indica el lugar." }] },
      { part: 3, questions: [{ a: "Do you like working in the morning?", options: ["At seven o'clock.", "In the office.", "Yes, I do. I have more energy."], answer: 2, hint: "Do you…? → pregunta cerrada: Yes/No", explanation: "No es una pregunta WH: empieza con Do, así que se responde con Yes/No + el mismo auxiliar (Yes, I do)." }] }
    ]
  },
  4: {
    label: "Parte 4", title: "Completar el texto", en: "Cloze text (A/B/C)", icon: "🧩", skill: "Gramática y vocabulario",
    summary: "Lees un texto corto con espacios en blanco y eliges la palabra que completa cada espacio.",
    format: ["Un texto con varios espacios numerados.", "3 opciones por espacio (A, B o C).", "Evalúa gramática básica: verbos, artículos, preposiciones, pronombres y conectores."],
    steps: ["Lee el texto completo una vez, sin detenerte, para entender el tema.", "En cada espacio, mira la palabra de ANTES y la de DESPUÉS.", "Pregúntate qué tipo de palabra falta: ¿verbo, preposición, artículo, conector?", "Si es verbo, revisa el sujeto (he/she → -s) y el tiempo (yesterday → pasado).", "Lee la oración completa con tu respuesta: debe sonar natural."],
    mistakes: ["Olvidar la -s en tercera persona: She live → She lives.", "No fijarse en marcadores de tiempo: yesterday, last week, ago → pasado.", "Confundir preposiciones de tiempo: at 7:00 · on Monday · in July."],
    keys: ["at + hora · on + día · in + mes/año.", "a + consonante (a car) · an + vocal (an hour).", "want to / need to / learn to + verbo base.", "and = suma · but = contraste · because = causa · so = consecuencia."],
    examples: [
      { part: 4, passage: "Juan (1) ___ at a bakery. He starts work (2) ___ five o'clock in the morning.", questions: [
        { gap: 1, options: ["work", "works", "working"], answer: 1, hint: "Sujeto: Juan (he) → presente simple con -s", explanation: "Con he/she/it el verbo en presente lleva -s: Juan works." }
      ] }
    ]
  },
  5: {
    label: "Parte 5", title: "Comprensión de lectura", en: "Reading comprehension", icon: "📖", skill: "Lectura literal",
    summary: "Lees un texto y respondes preguntas sobre información que aparece en él.",
    format: ["Un texto corto (una historia, una noticia, una biografía).", "Varias preguntas con 3 opciones (A, B o C).", "Las respuestas están en el texto, aunque con otras palabras."],
    steps: ["Lee las preguntas ANTES del texto: así sabes qué buscar.", "Lee el texto completo para entender la idea general.", "Para cada pregunta, ubica el párrafo donde está la información.", "Compara las opciones con lo que dice el texto: suelen usar sinónimos.", "Descarta lo que el texto no dice, aunque suene lógico."],
    mistakes: ["Responder con lo que tú sabes y no con lo que dice el texto.", "Elegir la opción que copia palabras del texto pero cambia el sentido.", "No fijarse en NOT o en fechas y números."],
    keys: ["Who → persona · When → fecha · How many → número · Why → razón.", "Busca sinónimos: died soon = live only a few months.", "Las preguntas siguen el orden del texto."],
    examples: [
      { part: 5, passage: "Camila is a nurse. She works at a hospital in Cali from Monday to Friday. On weekends she visits her grandparents in the countryside.", questions: [
        { q: "What does Camila do on weekends?", options: ["She works at the hospital.", "She visits her grandparents.", "She studies in Cali."], answer: 1, hint: "Busca “weekends” en el texto", explanation: "El texto dice: “On weekends she visits her grandparents”." }
      ] }
    ]
  },
  6: {
    label: "Parte 6", title: "Lectura crítica", en: "Reading: inference", icon: "🧠", skill: "Inferencia",
    summary: "Lees un texto más largo y respondes preguntas sobre la idea principal, el propósito del autor, su opinión y el significado de palabras en contexto.",
    format: ["Un texto de varios párrafos.", "Preguntas con 4 opciones (A, B, C o D).", "No todo está escrito directamente: debes deducir."],
    steps: ["Lee el título y el primer párrafo: ahí suele estar el tema.", "Lee todo el texto y resume cada párrafo en una frase.", "Para la idea principal, elige la opción que cubre TODO el texto, no un detalle.", "Para palabras desconocidas, usa el contexto: lo que está antes y después.", "Para la opinión del autor, busca palabras como should, I think, however, in the end."],
    mistakes: ["Elegir un detalle verdadero como si fuera la idea principal.", "Confundir lo que piensa una persona del texto con lo que piensa el autor.", "No volver al texto para verificar."],
    keys: ["However / but / although → cambio de idea.", "Because / so / that's why → causa y consecuencia.", "Pronombres (it, they, this, others) se refieren a algo mencionado antes.", "Main idea = ¿de qué trata TODO el texto?"],
    examples: [
      { part: 6, passage: "Many young people in Colombia now learn English online. It is cheap and flexible. However, some students say they miss talking to real people, so they also join conversation clubs.", questions: [
        { q: "Why do some students join conversation clubs?", options: ["Online classes are expensive.", "They want to speak with real people.", "They do not have internet.", "Their teachers ask them to."], answer: 1, hint: "Después de “However” viene el problema; “so” da la consecuencia", explanation: "Extrañan hablar con personas reales, por eso (so) se unen a clubes de conversación." }
      ] }
    ]
  },
  7: {
    label: "Parte 7", title: "Texto con espacios", en: "Cloze text (A/B/C/D)", icon: "✍️", skill: "Gramática avanzada",
    summary: "Lees un texto con espacios en blanco y eliges, entre 4 opciones, la palabra correcta para cada espacio.",
    format: ["Un texto más largo con varios espacios.", "4 opciones por espacio (A, B, C o D).", "Las opciones se parecen: suelen ser formas del mismo verbo o palabras de significado cercano."],
    steps: ["Lee todo el texto primero para entender el tiempo verbal general.", "Mira la estructura alrededor del espacio: ¿hay have/has? (→ participio), ¿hay than? (→ comparativo).", "Si las opciones son palabras parecidas, piensa en cuál se combina con la siguiente palabra (proud OF, interested IN).", "Para who/which/where/when: persona → who, cosa → which, lugar → where, tiempo → when.", "Relee la oración completa con tu opción."],
    mistakes: ["Usar el pasado simple después de have/has: has grew → has grown.", "Olvidar “more” o “-er” antes de than.", "Usar which para personas o who para cosas."],
    keys: ["have/has + participio: has eaten, have lived.", "Comparativo: bigger than, more interesting than · Superlativo: the best, the most…", "Relativos: who (personas), which (cosas), where (lugares), when (tiempo).", "Collocations: make a decision, do homework, take a photo."],
    examples: [
      { part: 7, passage: "My cousin is the girl (1) ___ won the dance competition.", questions: [
        { gap: 1, options: ["which", "who", "where", "when"], answer: 1, hint: "“the girl” es una persona", explanation: "Para personas se usa who: the girl who won." }
      ] }
    ]
  }
};

// ───────────── Claves del inglés ─────────────
const englishKeys = [
  {
    title: "Preguntas WH: se responden con información", icon: "❓",
    intro: "Las preguntas que empiezan con una palabra WH piden un dato concreto. NUNCA se responden solo con Yes o No.",
    table: [["What?", "¿Qué? / ¿Cuál?", "Una cosa o acción", "What do you study? → Software development."], ["Where?", "¿Dónde?", "Un lugar", "Where do you live? → In Bogotá."], ["When?", "¿Cuándo?", "Un tiempo o fecha", "When is the class? → On Monday."], ["What time?", "¿A qué hora?", "Una hora", "What time is it? → It's ten o'clock."], ["Who?", "¿Quién?", "Una persona", "Who is your instructor? → Mr. Gómez."], ["Why?", "¿Por qué?", "Una razón (Because…)", "Why are you tired? → Because I worked late."], ["How?", "¿Cómo?", "Una manera o estado", "How do you go to SENA? → By bus."], ["How much? / How many?", "¿Cuánto? / ¿Cuántos?", "Precio o cantidad", "How many brothers do you have? → Two."], ["Which?", "¿Cuál (de estos)?", "Una elección", "Which bus goes downtown? → The red one."], ["Whose?", "¿De quién?", "Un dueño", "Whose bag is this? → It's Ana's."]]
  },
  {
    title: "Preguntas cerradas: se responden Yes / No", icon: "✅",
    intro: "Si la pregunta NO empieza con una palabra WH, sino con un auxiliar (Do, Does, Did, Is, Are, Was, Can, Will, Have…), es una pregunta cerrada. La respuesta natural es Yes o No + el mismo auxiliar.",
    table: [["Do you…?", "Yes, I do. / No, I don't."], ["Does she…?", "Yes, she does. / No, she doesn't."], ["Did you…?", "Yes, I did. / No, I didn't."], ["Is it…?", "Yes, it is. / No, it isn't."], ["Are you…?", "Yes, I am. / No, I'm not."], ["Can you…?", "Yes, I can. / No, I can't."], ["Will you…?", "Yes, I will. / No, I won't."], ["Have you…?", "Yes, I have. / No, I haven't."]],
    tip: "Truco: el auxiliar de la pregunta se repite en la respuesta. Si preguntan con Did, respondes con did. Después puedes agregar más información: “Yes, I did. I finished it yesterday.”"
  },
  {
    title: "Pedir, ofrecer, invitar y agradecer", icon: "🤝",
    intro: "Algunas frases parecen preguntas cerradas pero en realidad son peticiones u ofrecimientos. Se responde aceptando o rechazando con cortesía.",
    table: [["Could you / Can you help me?", "Petición", "Sure! / Of course. / Sorry, I'm busy right now."], ["Would you like some coffee?", "Ofrecimiento", "Yes, please. / No, thank you."], ["Would you like to come to the party?", "Invitación", "I'd love to! / Sorry, I can't."], ["Shall I open the window?", "Ofrecer ayuda", "Yes, please. / No, it's OK, thanks."], ["Thank you very much.", "Agradecimiento", "You're welcome. / No problem."], ["I'm sorry I'm late.", "Disculpa", "Don't worry. / That's OK."]]
  },
  {
    title: "Avisos y letreros", icon: "🪧",
    intro: "Los avisos usan frases cortas. Reconocer su forma te dice qué intención tienen.",
    table: [["Please + verbo", "Petición amable", "Please wait here."], ["Do not / Don't + verbo", "Prohibición", "Do not touch."], ["No + -ing / sustantivo", "Prohibición", "No smoking. No pets."], ["Must / Must not", "Obligación", "Visitors must sign in."], ["Keep + …", "Mantener", "Keep off the grass."], ["Open / Closed / Sale", "Información", "Closed on Sundays."]]
  },
  {
    title: "Gramática que más se evalúa", icon: "🛠️",
    intro: "En las partes 4 y 7 casi siempre aparecen estos temas.",
    table: [["Presente simple", "I/you/we/they work · he/she/it works"], ["Pasado simple", "worked, went, had, made (con yesterday, last, ago)"], ["Presente perfecto", "have/has + participio: has lived, have eaten"], ["Preposiciones de tiempo", "at 8:00 · on Monday · in May / in 2025"], ["Artículos", "a book · an apple · the (algo específico)"], ["Comparativos", "taller than · more expensive than · the best"], ["Relativos", "who (persona) · which (cosa) · where (lugar) · when (tiempo)"], ["Conectores", "and · but · because · so · although · however"]]
  },
  {
    title: "Estrategias para leer", icon: "🔍",
    intro: "Para las partes 5 y 6.",
    list: ["Lee primero las preguntas, después el texto.", "Las preguntas suelen ir en el mismo orden del texto.", "Las opciones usan sinónimos: no busques las mismas palabras.", "Cuidado con NOT, never, only, always: cambian todo.", "La idea principal cubre todo el texto, no un detalle.", "Si no conoces una palabra, mira la oración completa: el contexto te da la pista."]
  }
];

// ───────────── Evaluaciones ─────────────
const evaluations = {
  eval1: {
    id: "eval1", title: "Evaluación 1", subtitle: "Partes 1, 2 y 3", parts: [1, 2, 3], final: false,
    sections: [
      { part: 1, bank: evaluation.part1.bank, questions: evaluation.part1.questions },
      { part: 2, questions: evaluation.part2 },
      { part: 3, questions: evaluation.part3 }
    ]
  },
  eval2: {
    id: "eval2", title: "Evaluación 2", subtitle: "Partes 4 y 5", parts: [4, 5], final: false,
    sections: [
      { part: 4, title: "Learning at SENA", passage: "Laura is 19 years old and she (1) ___ in Medellín. Every morning she takes (2) ___ bus to the SENA centre. She is studying to (3) ___ a software developer. Her classes start (4) ___ seven o'clock. Last month she (5) ___ her first website for a small bakery. Laura says the course is difficult, (6) ___ she enjoys it very much.", questions: [
        { gap: 1, options: ["live", "lives", "living"], answer: 1, explanation: "Sujeto she → presente simple con -s: she lives." },
        { gap: 2, options: ["an", "the", "some"], answer: 1, explanation: "“bus” empieza con consonante (no an) y es singular (no some): the bus." },
        { gap: 3, options: ["become", "becoming", "became"], answer: 0, explanation: "Después de “to” va el verbo en forma base: to become." },
        { gap: 4, options: ["in", "on", "at"], answer: 2, explanation: "Con horas se usa at: at seven o'clock." },
        { gap: 5, options: ["make", "made", "makes"], answer: 1, explanation: "“Last month” indica pasado: she made." },
        { gap: 6, options: ["because", "so", "but"], answer: 2, explanation: "Difícil vs. lo disfruta = contraste → but." }
      ] },
      { part: 5, title: "A different kind of weekend", passage: "Andrés works in a car repair shop from Monday to Friday. On Saturdays, he volunteers at an animal shelter near his town. He started two years ago, when he found a small dog in the street and took it to the shelter. Now he feeds the animals, cleans their spaces and walks the dogs in the park. Andrés says the work is tiring, but he feels happy when a family adopts one of the animals. Last year, the shelter helped more than 150 dogs and cats find a home. Andrés wants to study veterinary medicine in the future, but first he needs to save money.", questions: [
        { q: "Where does Andrés work during the week?", options: ["At an animal shelter.", "In a car repair shop.", "In a park."], answer: 1, explanation: "“works in a car repair shop from Monday to Friday”." },
        { q: "Why did Andrés go to the shelter the first time?", options: ["He wanted to adopt a cat.", "He was looking for a job.", "He found a dog in the street."], answer: 2, explanation: "“he found a small dog in the street and took it to the shelter”." },
        { q: "What does Andrés NOT do at the shelter?", options: ["Walk the dogs.", "Clean the spaces.", "Sell the animals."], answer: 2, explanation: "El texto menciona alimentar, limpiar y pasear; nunca vender." },
        { q: "How does Andrés feel when an animal is adopted?", options: ["Happy.", "Tired.", "Worried."], answer: 0, explanation: "“he feels happy when a family adopts one of the animals”." },
        { q: "How many animals found a home last year?", options: ["Less than 100.", "More than 150.", "Exactly 200."], answer: 1, explanation: "“more than 150 dogs and cats”." },
        { q: "What is Andrés's plan for the future?", options: ["To open a car shop.", "To study veterinary medicine.", "To move to another town."], answer: 1, explanation: "“wants to study veterinary medicine in the future”." }
      ] }
    ]
  },
  eval3: {
    id: "eval3", title: "Evaluación 3", subtitle: "Partes 6 y 7", parts: [6, 7], final: false,
    sections: [
      { part: 6, title: "Working from home: is it for everyone?", passage: "In the last few years, many companies have allowed their employees to work from home. For some workers, this change has been very positive. They save time and money because they do not travel to the office, and they can organise their day more freely. Marcela, a graphic designer from Bogotá, says she now has more time to exercise and to have breakfast with her children.\n\nHowever, working from home is not easy for everybody. Some people feel lonely because they do not see their colleagues. Others find it difficult to concentrate when there is noise at home, or they end up working more hours than before because they never 'leave' the office. Experts recommend having a special place for work, taking short breaks and turning off the computer at a fixed time.\n\nIn the end, working from home seems to be a good option for people who are organised and independent, but companies should also offer a space in the office for those who prefer it.", questions: [
        { q: "What is the main purpose of the text?", options: ["To sell computers for the home.", "To present advantages and disadvantages of working from home.", "To explain how to become a graphic designer.", "To tell the history of a company in Bogotá."], answer: 1, explanation: "El texto presenta lo positivo (párrafo 1) y lo negativo (párrafo 2) de trabajar desde casa." },
        { q: "Why does the writer mention Marcela?", options: ["To give an example of someone who benefits from working at home.", "To show that designers prefer the office.", "To explain why companies close their offices.", "To describe a typical problem of working from home."], answer: 0, explanation: "Marcela ilustra las ventajas: más tiempo para ejercicio y su familia." },
        { q: "In paragraph 2, the word “Others” refers to…", options: ["companies.", "colleagues.", "people who work from home.", "experts."], answer: 2, explanation: "“Some people… Others…” se refiere a otras personas que trabajan desde casa." },
        { q: "According to experts, a person working from home should…", options: ["work more hours.", "stop exercising.", "have a special place to work.", "visit the office every day."], answer: 2, explanation: "“Experts recommend having a special place for work”." },
        { q: "“They never 'leave' the office” means that these people…", options: ["live inside their company.", "find it hard to stop working.", "cannot find the office.", "prefer to work at night."], answer: 1, explanation: "Como la oficina está en casa, nunca “salen”: les cuesta dejar de trabajar." },
        { q: "What is the writer's opinion?", options: ["Everybody should work from home.", "Working from home is a bad idea.", "It works for some people, so companies should offer both options.", "Offices will disappear soon."], answer: 2, explanation: "El último párrafo: es buena opción para algunos, pero las empresas deben ofrecer también la oficina." }
      ] },
      { part: 7, title: "The coffee farmer", passage: "Don Jairo has (1) ___ coffee in Caldas for more than thirty years. When he was young, he (2) ___ with his father on the family farm. Today, he sells his coffee to a company (3) ___ exports it to Europe. He is (4) ___ than his neighbours because he uses new techniques to protect the plants. Last year, his coffee won a prize, and he was very (5) ___ of his work. He says young people should not leave the countryside (6) ___ there are many opportunities in agriculture.", questions: [
        { gap: 1, options: ["grow", "grew", "grown", "growing"], answer: 2, explanation: "has + participio: has grown." },
        { gap: 2, options: ["works", "worked", "working", "work"], answer: 1, explanation: "“When he was young” = pasado: he worked." },
        { gap: 3, options: ["who", "where", "which", "when"], answer: 2, explanation: "“a company” es una cosa → which." },
        { gap: 4, options: ["successful", "more successful", "most successful", "the successful"], answer: 1, explanation: "Hay “than” → comparativo: more successful than." },
        { gap: 5, options: ["proud", "happy", "pleased", "glad"], answer: 0, explanation: "La combinación correcta es “proud of” (orgulloso de)." },
        { gap: 6, options: ["because", "but", "although", "so"], answer: 0, explanation: "Da la razón de no irse → because." }
      ] }
    ]
  },
  final: {
    id: "final", title: "Evaluación final", subtitle: "Partes 1 a 7 · Nota definitiva", parts: [1, 2, 3, 4, 5, 6, 7], final: true,
    sections: [
      { part: 1, bank: ["toolbox", "umbrella", "passport", "oven", "stapler", "wallet", "ladder", "alarm clock"], questions: [
        { prompt: "You need this document to travel to another country." , answer: "passport" },
        { prompt: "You keep your money and cards in this small thing in your pocket.", answer: "wallet" },
        { prompt: "You climb this to reach a high place, like a roof.", answer: "ladder" },
        { prompt: "This rings in the morning to wake you up.", answer: "alarm clock" }
      ] },
      { part: 2, questions: [
        { message: "PLEASE SHOW YOUR BOARDING PASS.", kind: "info", icon: "✈️", places: ["Hospital", "Airport gate", "Bakery"], answer: 1 },
        { message: "SHOWER BEFORE ENTERING THE WATER.", kind: "warning", icon: "🚿", places: ["Supermarket", "Cinema", "Swimming pool"], answer: 2 },
        { message: "PRESCRIPTIONS READY AFTER 4 P.M.", kind: "info", icon: "💊", places: ["Pharmacy", "Museum", "Gym"], answer: 0 },
        { message: "SILENCE, PLEASE. RETURN BOOKS TO THIS DESK.", kind: "notice", icon: "📚", places: ["Restaurant", "Library", "Garage"], answer: 1 }
      ] },
      { part: 3, questions: [
        { a: "Do you work on weekends?", options: ["Yes, I do. On Saturdays.", "At the factory.", "Because I need money."], answer: 0 },
        { a: "What time does the class start?", options: ["In room 204.", "At eight o'clock.", "Yes, it does."], answer: 1 },
        { a: "Can you lend me your pen?", options: ["It's blue.", "I'm a student.", "Sure, here you are."], answer: 2 },
        { a: "Why are you late?", options: ["The bus didn't come.", "No, I'm not.", "Next to the door."], answer: 0 }
      ] },
      { part: 4, title: "My family", passage: "I (1) ___ two brothers and one sister. My older brother is a nurse and he works (2) ___ night. My sister (3) ___ studying at SENA, like me. Yesterday we (4) ___ dinner together at my grandmother's house.", questions: [
        { gap: 1, options: ["has", "have", "having"], answer: 1 },
        { gap: 2, options: ["at", "in", "on"], answer: 0 },
        { gap: 3, options: ["are", "am", "is"], answer: 2 },
        { gap: 4, options: ["had", "have", "has"], answer: 0 }
      ] },
      { part: 5, title: "Sofía's first job interview", passage: "Last Tuesday, Sofía had her first job interview at a hotel in Cartagena. She was very nervous, so she practised her answers with her mother the night before. She arrived twenty minutes early and wore a white shirt and black trousers. The manager asked her about her studies in tourism and about her English. Sofía answered all the questions in English. Two days later, the hotel called her: she got the job as a receptionist.", questions: [
        { q: "Where was the interview?", options: ["At a school.", "At a hotel.", "At a restaurant."], answer: 1 },
        { q: "Who helped Sofía to prepare?", options: ["Her mother.", "The manager.", "A teacher."], answer: 0 },
        { q: "When did Sofía arrive?", options: ["Late.", "Exactly on time.", "Early."], answer: 2 },
        { q: "What job did Sofía get?", options: ["Receptionist.", "Manager.", "Tour guide."], answer: 0 }
      ] },
      { part: 6, title: "Plastic in the ocean", passage: "Every year, millions of tonnes of plastic end up in the ocean. Much of it comes from bottles, bags and food containers that people use only once. Sea animals such as turtles often confuse plastic bags with food, and many of them die.\n\nSome countries have banned plastic bags, and the results are encouraging: beaches are cleaner and people have started to carry their own reusable bags. Still, scientists say that laws are not enough. If each person reduced the plastic they use every day, the problem would be much smaller.", questions: [
        { q: "What is the text mainly about?", options: ["How turtles find food.", "The problem of plastic in the ocean and possible solutions.", "The best beaches in the world.", "How to make plastic bags."], answer: 1 },
        { q: "Why do many turtles die?", options: ["The water is too cold.", "Fishermen catch them.", "They eat plastic because they think it is food.", "The beaches are too clean."], answer: 2 },
        { q: "The word “encouraging” suggests that the results are…", options: ["positive.", "dangerous.", "expensive.", "confusing."], answer: 0 },
        { q: "What do scientists believe?", options: ["Laws alone will solve the problem.", "Plastic is not a real problem.", "Only governments can do something.", "Individual actions are also necessary."], answer: 3 }
      ] },
      { part: 7, title: "A good habit", passage: "Reading is one of the (1) ___ habits a person can have. People (2) ___ read every day learn new words and improve their writing. If you (3) ___ to start, choose a topic you like. You don't need to read for hours; even fifteen minutes a day (4) ___ a big difference.", questions: [
        { gap: 1, options: ["good", "better", "best", "well"], answer: 2 },
        { gap: 2, options: ["which", "who", "where", "what"], answer: 1 },
        { gap: 3, options: ["wants", "wanting", "want", "wanted"], answer: 2 },
        { gap: 4, options: ["make", "makes", "making", "made"], answer: 1 }
      ] }
    ]
  }
};

const TyTContent = { parts, englishKeys, practice, evaluations };
if (typeof module !== "undefined" && module.exports) module.exports = TyTContent;
else window.TyTContent = TyTContent;
})();
