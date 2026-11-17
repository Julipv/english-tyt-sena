"use strict";

const STORAGE_RESULTS = "englishChallengeResultsV1";
const STORAGE_PROGRESS = "englishChallengeProgressV1";
const modules = {
  part1: {
    label: "PART 1", title: "Relacionar descripciones", icon: "🔎",
    description: "Relaciona una descripción breve con la palabra que mejor representa lo que lees.",
    advice: ["Lee toda la descripción antes de elegir.", "Busca palabras clave, pero confirma que encajen con la idea completa.", "Descarta opciones que no correspondan; algunas palabras no se usan."]
  },
  part2: {
    label: "PART 2", title: "Avisos y lugares", icon: "📍",
    description: "Interpreta avisos en inglés y descubre en qué lugar tendría sentido encontrarlos.",
    advice: ["Identifica el propósito: informar, advertir, prohibir o indicar.", "Busca expresiones clave del aviso.", "Piensa en el contexto y descarta lugares que no encajan."]
  },
  part3: {
    label: "PART 3", title: "Conversaciones cortas", icon: "💬",
    description: "Comprende la intención de una conversación y elige una respuesta natural.",
    advice: ["Lee las dos intervenciones para entender la situación.", "Reconoce la intención: preguntar, ofrecer, invitar o agradecer.", "Una frase posible en inglés no siempre responde a lo que se dijo."]
  }
};

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

const lessons = {
  part1: [
    { title: "Relacionar una descripción con una palabra", body: "En esta parte aparece una descripción corta en inglés y varias palabras posibles. La respuesta es el objeto, animal o lugar que coincide con lo que dice la descripción. No es necesario usar todas las opciones: algunas están ahí para confundir." },
    { title: "Las pistas describen la función", body: "Las descripciones suelen decir para qué sirve algo, cómo es o dónde se usa. Por ejemplo, “You use it to tell the time” describe algo que sirve para saber la hora: a clock. La palabra clave no siempre es el nombre del objeto; a veces hay que unir varias pistas para reconocerlo. Leer la oración completa ayuda a diferenciar opciones parecidas." },
    { title: "Veamos dos ejemplos", body: "En cada ejemplo, la descripción señala una función o situación de uso. La respuesta correcta debe coincidir con todas las pistas, no solo con una palabra aislada.", example: true }
  ],
  part2: [
    { title: "Los avisos tienen un propósito", body: "En esta parte se lee un aviso en inglés y se identifica el lugar donde podría aparecer. Un aviso puede dar una instrucción, compartir información o advertir sobre una situación. El lugar correcto es aquel donde el mensaje sería útil y tendría sentido." },
    { title: "El mensaje y el lugar van juntos", body: "Palabras relacionadas con actividades, objetos y personas ayudan a reconocer el contexto. Por ejemplo, “Please return your books” encaja con una biblioteca, mientras que “Keep off the grass” podría aparecer en un parque. También importa el propósito: una regla de seguridad puede estar en un lugar distinto al que solo vende o exhibe algo." },
    { title: "Veamos dos ejemplos", body: "Cada aviso incluye pistas sobre una actividad o un espacio. Para identificar el lugar, fíjate en el mensaje completo y en quién lo leería allí.", example: true }
  ],
  part3: [
    { title: "Entender lo que ocurre en un diálogo", body: "En esta parte hay una pregunta o comentario en inglés y se elige una respuesta que encaje con la conversación. La respuesta debe corresponder al significado y a la intención de la otra persona: pedir información, ofrecer ayuda, invitar, agradecer o responder una pregunta." },
    { title: "La intención determina la respuesta", body: "Las palabras interrogativas indican qué información se necesita: who pregunta por una persona, where por un lugar, when por un momento, what por una cosa o actividad y why por una razón. En una solicitud, como “Could you help me?”, lo natural es aceptar, rechazar amablemente o responder a esa petición. Una opción puede ser una oración correcta, pero no servir como respuesta si cambia el tema." },
    { title: "Veamos dos ejemplos", body: "En cada diálogo, la respuesta correcta continúa la misma idea. Fíjate en lo que pregunta o pide la primera persona y en la información que la otra debería contestar.", example: true }
  ]
};
const lessonExamples = {
  part1: [
    { prompt: "You use this marked container to measure flour and milk while making a cake.", options: ["measuring cup", "compass", "whisk", "backpack", "lighthouse", "seedling", "necklace", "thermos"], answer: 0, hint: "marked container · measure · ingredients", explanation: "Una measuring cup tiene marcas para medir ingredientes." },
    { prompt: "You look through these to watch birds in a tree across the lake.", options: ["tongs", "diary", "binoculars", "apron", "cushion", "whisk", "kettle", "seedling"], answer: 2, hint: "look through · watch birds · across the lake", explanation: "Binoculars sirven para observar de cerca cosas que están lejos." }
  ],
  part2: [
    { notice: "PLEASE CLOSE THE GLASS DOOR AFTER ENTERING.", subtitle: "Help keep the plants warm", icon: "🌱", options: ["Airport", "Greenhouse", "Swimming pool", "Cinema"], answer: 1, hint: "glass door · plants warm", explanation: "Un greenhouse es un invernadero: su puerta de vidrio ayuda a conservar el calor para las plantas." },
    { notice: "FEEDING TIME IS AT 3:30. PLEASE KEEP HANDS OUT OF THE TANK.", subtitle: "Thank you for protecting the animals", icon: "🐠", options: ["Aquarium", "Art studio", "Bus station", "Bakery"], answer: 0, hint: "feeding time · tank · animals", explanation: "Un aquarium tiene tanques con animales acuáticos y horarios para alimentarlos." }
  ],
  part3: [
    { conversation: ["Could you tell me where the photography workshop is?", "________"], options: ["At 10:30 in the morning.", "In Studio B, beside the courtyard.", "Because she enjoys photography."], answer: 1, hint: "where pregunta por un lugar", explanation: "Where pregunta dónde queda algo. “In Studio B” indica el lugar." },
    { conversation: ["Would you mind showing me how to use this camera?", "________"], options: ["Not at all. Let me show you.", "It is on the top shelf.", "At the photo shop yesterday."], answer: 0, hint: "would you mind pide ayuda amablemente", explanation: "La persona pide ayuda. “Not at all. Let me show you” acepta de forma natural." }
  ]
};
let view = "home";
let currentModule = null;
let currentSet = 0;
let lessonStep = 0;
let lessonAnswerShown = false;
let lessonHintsShown = false;
let lessonSelectedChoice = "";
let lessonAnswerChecked = false;
let lessonExampleIndex = 0;
let activeQuiz = null;
let toastTimer;
let clockTimer;
const app = document.getElementById("app");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    notify(`No se pudieron leer los datos guardados: ${error.message}`, true);
    return fallback;
  }
}
function saveStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    notify(`No se pudo guardar en este dispositivo: ${error.message}`, true);
    return false;
  }
}
function notify(message, error = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.toggle("error", error);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3600);
}
function navigate(next) {
  view = next;
  render();
  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function progressData() { return readStored(STORAGE_PROGRESS, {}); }
function completedSets(moduleId) { return progressData()[moduleId] || []; }
function moduleCard(id) {
  const item = modules[id];
  const done = completedSets(id).length;
  return `<article class="module-card">
    <span class="module-icon" aria-hidden="true">${item.icon}</span>
    <p class="eyebrow">${item.label}</p><h3>${item.title}</h3>
    <p>${item.description}</p>
    <div class="progress-track" aria-label="Progreso: ${done} de 2 ejercicios"><span style="width:${done * 50}%"></span></div>
    <div class="progress-caption"><span>${done} de 2 ejercicios completados</span><span>${done === 2 ? "¡Listo!" : "En progreso"}</span></div>
    <div class="button-row"><button class="button small outline" data-action="lesson" data-module="${id}">Ver exposición</button><button class="button small" data-action="practice-menu" data-module="${id}">Practicar →</button></div>
  </article>`;
}
function renderHome() {
  return `<section class="hero">
    <div class="hero-copy"><p class="eyebrow">Aprende · Interpreta · Resuelve</p>
      <h1>English <span>Challenge</span></h1>
      <p>Aprende, comprende y supera el reto. Practica las primeras tres partes de Inglés Saber TyT con ejemplos, estrategias y desafíos interactivos.</p>
      <div class="button-row"><button class="button" data-action="menu">Comenzar <span aria-hidden="true">→</span></button><button class="button secondary" data-action="how">¿Cómo funciona?</button></div>
      <div class="part-pills"><span class="part-pill">01 · DESCRIPCIONES</span><span class="part-pill">02 · AVISOS</span><span class="part-pill">03 · CONVERSACIONES</span></div>
    </div>
    <div class="hero-art" aria-label="Ilustración de aprendizaje de inglés"><div class="hero-orbit"></div><span class="floating-chip chip-a">✨ TU SIGUIENTE RETO</span><span class="floating-chip chip-b">📚 Aprende pensando</span><span class="floating-chip chip-c">A · B · C</span><div class="hero-card"><span class="big-icon">🧠</span><strong>Piensa en contexto</strong><small>Una pista a la vez</small></div></div>
  </section>
  <div class="section-heading"><h2>Un reto, tres habilidades</h2><button class="link-button" data-action="how">Conoce la dinámica →</button></div>
  <section class="feature-grid">
    <article class="feature-card"><span class="icon">🧩</span><h3>Aprende a pensar</h3><p>Descubre pistas y estrategias para elegir con sentido.</p></article>
    <article class="feature-card"><span class="icon">🎤</span><h3>Expón a tu ritmo</h3><p>Controla las pistas y respuestas en el modo expositor.</p></article>
    <article class="feature-card"><span class="icon">🏆</span><h3>Mide tu avance</h3><p>Al terminar la evaluación, tu resultado se envía al registro compartido de la clase.</p></article>
  </section>`;
}
function renderMenu() {
  return `<button class="back-link" data-action="home">← Inicio</button>
    <section class="page-heading"><div><p class="eyebrow">Elige tu camino</p><h1>Tu mapa de aprendizaje</h1><p>En cada tema: primero mira la exposición, después practica y, al final, realiza la evaluación individual.</p></div></section>
    <section class="module-grid">${Object.keys(modules).map(moduleCard).join("")}</section>
    <div class="section-heading"><h2>¿Listo para el reto final?</h2></div>
    <section class="panel" style="display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap"><div><p class="eyebrow">Paso 3 · comprueba lo aprendido</p><h3 style="margin-bottom:5px">Evaluación individual</h3><p class="muted" style="margin:0">15 preguntas · nota por tema · tiempo registrado</p></div><button class="button" data-action="register">Hacer evaluación →</button></section>
    <p class="small-note" style="margin-top:20px">Al terminar la evaluación, tu resultado se enviará al registro compartido de la clase.</p>`;
}
function renderHow() {
  return `<button class="back-link" data-action="home">← Inicio</button><section class="page-heading"><div><p class="eyebrow">Guía rápida</p><h1>¿Cómo funciona?</h1><p>Una experiencia para aprender en grupo y después comprobar lo aprendido de manera individual.</p></div></section>
    <section class="feature-grid">
      <article class="feature-card"><span class="icon">🎙️</span><h3>1. Expón</h3><p>Avanza paso a paso, muestra pistas, invita a participar y revela el ejemplo solo cuando quieras.</p></article>
      <article class="feature-card"><span class="icon">🕹️</span><h3>2. Practica</h3><p>Resuelve dos ejercicios de cinco preguntas por cada parte y recibe retroalimentación inmediata.</p></article>
      <article class="feature-card"><span class="icon">📊</span><h3>3. Evalúate</h3><p>Escribe tu nombre y grupo. La calificación y el tiempo llegarán al registro compartido de la clase.</p></article>
    </section>
    <div class="section-heading"><h2>Las tres partes</h2></div><section class="module-grid">${Object.keys(modules).map(moduleCard).join("")}</section>
    <p class="small-note" style="margin-top:18px">No se solicitan contraseñas ni se envían resultados a un servidor. La evaluación contiene preguntas distintas de las prácticas.</p>`;
}
function renderLesson() {
  const mod = modules[currentModule];
  const steps = lessons[currentModule];
  const step = steps[lessonStep];
  const progress = Math.round((lessonStep + 1) / steps.length * 100);
  const stepLabels = ["Concepto", "Cómo funciona", "Ejemplos"];
  return `<button class="back-link" data-action="menu">← Menú principal</button>
    <section class="page-heading"><div><p class="eyebrow">EXPOSICIÓN · ${mod.label}</p><h1>${mod.title}</h1><p>Aprende el concepto, entiende cómo se aplica y revisa dos ejemplos.</p></div><button class="button small outline" data-action="practice-menu" data-module="${currentModule}">Terminar y practicar →</button></section>
    <section class="panel lesson-stage">
      <div class="lesson-progress-copy"><span>La exposición tiene 3 pasos</span><strong>Paso ${lessonStep + 1} de ${steps.length}</strong></div><div class="progress-track" role="progressbar" aria-label="Progreso de la exposición" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><span style="width:${progress}%"></span></div>
      <nav class="lesson-step-nav" aria-label="Pasos de la exposición">${steps.map((item, i) => `<button class="lesson-step-button" data-action="lesson-go-step" data-step="${i}" aria-label="Ir al paso ${i + 1}: ${stepLabels[i]}" ${i === lessonStep ? 'aria-current="step"' : ""}>${i + 1}. ${stepLabels[i]}</button>`).join("")}</nav>
      <div class="lesson-content"><p class="eyebrow">${stepLabels[lessonStep]}</p><h2>${step.title}</h2><p class="lesson-explanation">${esc(step.body).replace(/\n/g, "<br>")}</p>
      ${step.example ? renderInteractiveLessonExample() : ""}</div>
      <div class="lesson-nav"><button class="button small secondary" data-action="lesson-prev" ${lessonStep === 0 ? "disabled" : ""}>← Anterior</button><button class="button small" data-action="lesson-next">${lessonStep === steps.length - 1 ? "Terminar exposición ✓" : "Siguiente paso →"}</button></div>
    </section>`;
}
function renderInteractiveLessonExample() {
  const examples = lessonExamples[currentModule];
  const example = examples[lessonExampleIndex];
  const isNotice = Boolean(example.notice);
  const isConversation = Boolean(example.conversation);
  const selected = lessonSelectedChoice === "" ? null : Number(lessonSelectedChoice);
  const correct = selected === example.answer;
  const options = example.options.map((option, index) => `<button class="option-button ${selected === index ? "selected" : ""}" data-action="select-lesson-choice" data-value="${index}"><span class="option-letter">${String.fromCharCode(65 + index)}</span>${esc(option)}</button>`).join("");
  return `<section class="lesson-example">
    <div class="lesson-example-heading"><div><p class="eyebrow">EJEMPLO ${lessonExampleIndex + 1} DE 2</p><h3>${isNotice ? "¿Dónde encontrarías este aviso?" : isConversation ? "¿Qué respuesta completa el diálogo?" : "¿Qué palabra completa la descripción?"}</h3></div>
      <div class="lesson-example-switch" aria-label="Elegir ejemplo">${examples.map((_, index) => `<button class="lesson-example-button" data-action="lesson-example" data-index="${index}" aria-pressed="${index === lessonExampleIndex}">Ejemplo ${index + 1}</button>`).join("")}</div></div>
    ${isNotice ? `<div class="sign-wrap"><div class="sign notice"><span class="sign-icon">${example.icon}</span><p class="sign-message">${esc(example.notice)}</p><p class="sign-subtitle">${esc(example.subtitle)}</p></div></div>` : ""}
    ${isConversation ? `<div class="speech-pair">${example.conversation.map((line, index) => `<div class="speech ${index ? "right" : ""}"><span class="speaker">${index ? "Respuesta" : "Conversación"}</span>${esc(line)}</div>`).join("")}</div>` : ""}
    ${!isNotice && !isConversation ? `<p class="question-text">${esc(example.prompt)}</p>` : ""}
    <div class="example-options">${options}</div>
    <div class="button-row lesson-example-actions"><button class="button small outline" data-action="toggle-keywords">${lessonHintsShown ? "Ocultar pista" : "Ver una pista"}</button><button class="button small" data-action="check-lesson-answer">Comprobar respuesta</button></div>
    ${lessonHintsShown ? `<p class="lesson-hint"><strong>Pista:</strong> ${esc(example.hint)}</p>` : ""}
    ${lessonAnswerShown ? `<div class="answer-reveal visible"><strong>${lessonAnswerChecked ? correct ? "¡Muy bien, es correcto!" : "Esa no es. Mira cuál opción encaja mejor." : "Respuesta"}: ${String.fromCharCode(65 + example.answer)}. ${esc(example.options[example.answer])}</strong>${selected !== null ? `<p>Elegiste: ${esc(example.options[selected])}</p>` : ""}<p>${esc(example.explanation)}</p></div>` : ""}
  </section>`;
}
function renderPracticeMenu() {
  const mod = modules[currentModule];
  const sets = completedSets(currentModule);
  return `<button class="back-link" data-action="menu">← Menú principal</button><section class="page-heading"><div><p class="eyebrow">${mod.label} · PRÁCTICA</p><h1>${mod.title}</h1><p>${mod.description} Cada desafío tiene cinco preguntas originales y retroalimentación inmediata.</p></div><button class="button small outline" data-action="lesson" data-module="${currentModule}">Modo expositor</button></section>
    <section class="module-grid">${[0, 1].map(i => `<article class="module-card"><span class="module-icon">${i === 0 ? "🌱" : "🚀"}</span><p class="eyebrow">EJERCICIO ${i + 1} · ${i === 0 ? "NIVEL INICIAL" : "NIVEL AVANZADO"}</p><h3>${currentModule === "part1" ? "Descripciones y palabras" : currentModule === "part2" ? "Carteles en contexto" : "Respuestas naturales"}</h3><p>${i === 0 ? "Comprueba las pistas esenciales y razona con calma." : "Aplica la estrategia en situaciones y vocabulario nuevos."}</p><span class="progress-caption"><span>5 preguntas · ${sets.includes(i) ? "Completado ✓" : "Por resolver"}</span></span><button class="button" data-action="start-practice" data-module="${currentModule}" data-set="${i}">${sets.includes(i) ? "Repetir ejercicio" : "Comenzar"} →</button></article>`).join("")}</section>`;
}
function setFor(moduleId, setIndex) {
  if (moduleId === "part1") return practice.part1[setIndex];
  if (moduleId === "part2") return { questions: practice.part2[setIndex] };
  return { questions: practice.part3[setIndex] };
}
function startPractice(moduleId, setIndex) {
  currentModule = moduleId;
  currentSet = setIndex;
  const set = setFor(moduleId, setIndex);
  beginQuiz("practice", moduleId, set.questions, set.bank || null, null);
}
function beginQuiz(kind, moduleId, questions, bank, student = null) {
  activeQuiz = { kind, moduleId, questions, bank, student, index: 0, answers: [], startedAt: Date.now(), showTip: false };
  navigate("quiz");
}
function currentQuestion() { return activeQuiz.questions[activeQuiz.index]; }
function questionOptions(q, moduleId, bank) {
  if (moduleId === "part1") return bank || [];
  return q.options || q.places;
}
function renderOptions(q, selected, moduleId, bank) {
  return questionOptions(q, moduleId, bank).map((text, i) => {
    const correct = moduleId === "part1" ? text === q.answer : i === q.answer;
    const chosen = selected === i;
    const klass = selected === null ? "" : (correct ? " correct" : (chosen ? " incorrect" : ""));
    return `<button class="option-button${klass}" data-action="answer" data-index="${i}" ${selected !== null ? "disabled" : ""}><span class="option-letter">${activeQuiz.moduleId === "part1" ? String.fromCharCode(65 + i) : String.fromCharCode(65 + i)}</span>${esc(text)}</button>`;
  }).join("");
}
function renderNotice(q) {
  return `<div class="sign-wrap"><div class="sign ${esc(q.kind)}"><span class="sign-icon" aria-hidden="true">${esc(q.icon)}</span><p class="sign-message">${esc(q.message)}</p><p class="sign-subtitle">Notice · Read the message</p></div></div>`;
}
function renderConversation(q) {
  return `<div class="speech-pair"><div class="speech"><span class="speaker">Speaker A</span>${esc(q.a)}</div><div class="speech right"><span class="speaker">Speaker B</span>${esc(q.b)}</div></div>`;
}
function renderQuiz() {
  const context = activeQuiz.kind === "assessment"
    ? currentEvaluationQuestion(activeQuiz.index)
    : { moduleId: activeQuiz.moduleId, q: currentQuestion(), bank: activeQuiz.bank };
  const q = context.q;
  const moduleId = context.moduleId;
  const bank = context.bank;
  const saved = activeQuiz.answers[activeQuiz.index];
  const selected = saved ? saved.selected : null;
  const pct = Math.round(activeQuiz.index / activeQuiz.questions.length * 100);
  const title = activeQuiz.kind === "assessment" ? `Evaluación individual · ${modules[moduleId].label}` : `${modules[moduleId].label} · Ejercicio ${currentSet + 1}`;
  let promptContent = "";
  if (moduleId === "part1") {
    promptContent = `<p class="quiz-prompt">${esc(q.prompt)}</p><p class="question-label">Word bank · Some words are not used</p><ul class="word-bank">${activeQuiz.bank.map((word, i) => `<li>${String.fromCharCode(65 + i)}. ${esc(word)}</li>`).join("")}</ul>`;
  } else if (moduleId === "part2") {
    promptContent = renderNotice(q) + `<p class="question-label">Where can you see this notice?</p>`;
  } else {
    promptContent = renderConversation(q) + `<p class="question-label">Choose the best response</p>`;
  }
  const explanation = moduleId === "part1" ? q.explanation : q.feedback || q.explanation;
  const feedback = saved ? `<div class="feedback ${saved.correct ? "good" : "bad"}"><strong>${saved.correct ? "¡Muy bien! Respuesta correcta." : "Sigue razonando: revisa la pista."}</strong>${esc(explanation)}${q.clue ? `<br><span class="small-note">Pista clave: ${esc(q.clue)}</span>` : ""}</div>` : "";
  return `<button class="back-link" data-action="${activeQuiz.kind === "assessment" ? "menu" : "practice-menu"}" ${activeQuiz.kind === "practice" ? `data-module="${activeQuiz.moduleId}"` : ""}>← ${activeQuiz.kind === "assessment" ? "Salir a menú" : "Ejercicios"}</button>
    <section class="panel quiz-card"><div class="quiz-top"><span class="badge">${title}</span><span class="small-note">⏱ ${formatDuration(Date.now() - activeQuiz.startedAt)}</span></div>
      <div class="progress-row"><strong>Pregunta ${activeQuiz.index + 1} de ${activeQuiz.questions.length}</strong><span>${pct}%</span></div><div class="progress-track"><span style="width:${pct}%"></span></div>
      ${promptContent}<div class="option-list">${renderOptions(q, selected, moduleId, bank)}</div>
      ${feedback}
      <div class="tip-box ${activeQuiz.showTip ? "visible" : ""}">${esc(modules[moduleId].advice[Math.min(activeQuiz.index, 2)])}</div>
      <div class="button-row" style="justify-content:space-between;margin-top:18px"><button class="button small secondary" data-action="toggle-tip">Ver estrategia</button>${saved ? `<button class="button small" data-action="next-question">${activeQuiz.index === activeQuiz.questions.length - 1 ? (activeQuiz.kind === "assessment" ? "Ver resultados →" : "Finalizar ejercicio →") : "Siguiente pregunta →"}</button>` : ""}</div>
    </section>`;
}
function chooseAnswer(index) {
  if (activeQuiz.answers[activeQuiz.index]) return;
  const q = currentQuestion();
  const selectedText = questionOptions(q, activeQuiz.moduleId, activeQuiz.bank)[index];
  const correct = activeQuiz.moduleId === "part1" ? selectedText === q.answer : index === q.answer;
  activeQuiz.answers[activeQuiz.index] = { selected: index, correct, selectedText };
  render();
}
function nextQuestion() {
  if (activeQuiz.index < activeQuiz.questions.length - 1) {
    activeQuiz.index += 1;
    activeQuiz.showTip = false;
    render();
  } else if (activeQuiz.kind === "assessment") finishAssessment();
  else finishPractice();
}
function finishPractice() {
  const record = progressData();
  record[currentModule] = [...new Set([...(record[currentModule] || []), currentSet])];
  saveStored(STORAGE_PROGRESS, record);
  view = "practice-complete";
  render();
}
function renderPracticeComplete() {
  const correct = activeQuiz.answers.filter(a => a.correct).length;
  return `<section class="panel" style="max-width:700px;margin:32px auto;text-align:center"><div class="success-mark" style="margin:0 auto 17px">✓</div><p class="eyebrow">${modules[activeQuiz.moduleId].label} · EJERCICIO ${currentSet + 1}</p><h1 style="font-size:38px">¡Reto completado!</h1><p class="muted">Respondiste correctamente <strong>${correct} de ${activeQuiz.questions.length}</strong>. Lee las explicaciones para reforzar tu estrategia.</p><div class="stat-grid" style="grid-template-columns:repeat(2,1fr)"><div class="stat-card"><strong>${correct}/${activeQuiz.questions.length}</strong><span>Respuestas correctas</span></div><div class="stat-card"><strong>${Math.round(correct / activeQuiz.questions.length * 100)}%</strong><span>Precisión</span></div></div><div class="button-row" style="justify-content:center"><button class="button" data-action="practice-menu" data-module="${activeQuiz.moduleId}">Volver a ejercicios</button><button class="button secondary" data-action="menu">Menú principal</button></div></section>`;
}
function renderRegister() {
  return `<button class="back-link" data-action="menu">← Menú principal</button><section class="panel" style="max-width:650px;margin:28px auto"><p class="eyebrow">PASO 3 · EVALUACIÓN · 15 PREGUNTAS</p><h1 style="font-size:38px">Tu reto individual</h1><p class="muted">Escribe tu nombre y grupo. Al terminar verás tu nota y el tiempo empleado; el resultado se enviará al panel privado de la clase.</p><form id="student-form"><div class="field"><label for="student-name">Nombre del estudiante</label><input id="student-name" name="name" maxlength="60" required autocomplete="name" placeholder="Ej. Andrea Pérez"></div><div class="field"><label for="student-group">Grupo o ficha <span class="muted">(opcional)</span></label><input id="student-group" name="group" maxlength="40" placeholder="Ej. Ficha 204"></div><p class="small-note">15 preguntas nuevas · 5 de cada tema · el tiempo se cuenta hasta terminar la evaluación.</p><button class="button" type="submit">Empezar evaluación →</button></form></section>`;
}
async function finishAssessment() {
  if (activeQuiz.finishing) return;
  activeQuiz.finishing = true;
  const answers = activeQuiz.answers;
  const byModule = {};
  for (const id of Object.keys(modules)) {
    const start = id === "part1" ? 0 : id === "part2" ? 5 : 10;
    const correct = answers.slice(start, start + 5).filter(a => a.correct).length;
    byModule[id] = { correct, total: 5, percent: correct * 20 };
  }
  const correct = answers.filter(a => a.correct).length;
  const result = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: activeQuiz.student.name,
    group: activeQuiz.student.group,
    date: new Date().toISOString(),
    duration: Math.round((Date.now() - activeQuiz.startedAt) / 1000),
    correct, total: 15, percent: Math.round(correct / 15 * 100), byModule,
    missed: answers.map((a, i) => ({ module: i < 5 ? "part1" : i < 10 ? "part2" : "part3", index: i % 5, correct: a.correct }))
      .filter(x => !x.correct).map(x => ({ module: x.module, question: x.index + 1, prompt: evaluationQuestionText(x.module, x.index) }))
  };
  const records = readStored(STORAGE_RESULTS, []);
  records.push(result);
  if (!saveStored(STORAGE_RESULTS, records)) {
    result.syncStatus = "failed";
    result.syncError = "No se pudo guardar una copia local.";
  } else {
    try {
      await sendResultToSupabase(result);
      result.syncStatus = "sent";
    } catch (error) {
      result.syncStatus = "failed";
      result.syncError = error.message;
    }
  }
  activeQuiz.result = result;
  navigate("result");
}
async function sendResultToSupabase(result) {
  const config = window.APP_SUPABASE_CONFIG;
  if (!config?.url || !config?.anonKey) {
    throw new Error("La conexión a la base de datos aún no está configurada.");
  }
  if (!window.supabase?.createClient) {
    throw new Error("No se pudo cargar el servicio de conexión. Revisa tu conexión a internet e inténtalo de nuevo.");
  }
  const client = window.supabase.createClient(config.url, config.anonKey);
  const { error } = await client.from("student_results").insert({
    id: result.id,
    student_name: result.name,
    group_name: result.group || "",
    completed_at: result.date,
    score_part1: result.byModule.part1.correct,
    score_part2: result.byModule.part2.correct,
    score_part3: result.byModule.part3.correct,
    total_correct: result.correct,
    total_questions: result.total,
    percent: result.percent,
    duration_seconds: result.duration,
    missed: result.missed
  });
  if (error) throw new Error(`No fue posible enviar el resultado: ${error.message}`);
}
function evaluationQuestionText(moduleId, index) {
  if (moduleId === "part1") return evaluation.part1.questions[index].prompt;
  if (moduleId === "part2") return evaluation.part2[index].message;
  return evaluation.part3[index].a;
}
function personalizedAdvice(result) {
  const low = Object.keys(result.byModule).filter(id => result.byModule[id].percent < 60);
  if (low.length === 0) return "<li>¡Buen trabajo! Mantén el hábito de justificar tus respuestas con pistas del texto y el contexto.</li>";
  return low.map(id => `<li><strong>${modules[id].title}:</strong> ${modules[id].advice[0]} ${modules[id].advice[1]}</li>`).join("");
}
function renderResult() {
  const result = activeQuiz && activeQuiz.result;
  if (!result) return renderHistory();
  const strength = Object.keys(result.byModule).filter(id => result.byModule[id].percent >= 80);
  return `<button class="back-link" data-action="menu">← Menú principal</button><section class="panel"><div style="display:flex;align-items:center;gap:17px;flex-wrap:wrap"><div class="success-mark">✓</div><div><p class="eyebrow">Evaluación finalizada</p><h1 style="font-size:36px;margin:0">${esc(result.name)}</h1><p class="muted" style="margin:4px 0">${result.group ? `Grupo: ${esc(result.group)} · ` : ""}${new Date(result.date).toLocaleString("es-CO")}</p></div></div>
    ${result.syncStatus === "sent" ? `<div class="feedback good"><strong>Resultado enviado</strong>La profesora ya puede verlo en el panel privado de resultados.</div>` : `<div class="feedback bad"><strong>No se pudo confirmar el envío</strong>${esc(result.syncError || "No se pudo conectar al registro de la clase. Descarga una copia y entrégasela a la vocera.")} <button class="button small secondary" data-action="export-one">Descargar mi resultado CSV</button></div>`}
    <div class="stat-grid"><div class="stat-card"><span>Puntaje</span><strong>${result.correct}/${result.total}</strong><span>respuestas correctas</span></div><div class="stat-card"><span>Resultado general</span><strong>${result.percent}%</strong><span>de aciertos</span></div><div class="stat-card"><span>Tiempo empleado</span><strong>${formatDuration(result.duration * 1000)}</strong><span>en la evaluación</span></div><div class="stat-card"><span>Por reforzar</span><strong>${result.missed.length}</strong><span>preguntas incorrectas</span></div></div>
    <div class="section-heading"><h2>Tu resultado por parte</h2></div><div class="feature-grid">${Object.keys(modules).map(id => `<article class="feature-card"><p class="eyebrow">${modules[id].label}</p><h3>${modules[id].title}</h3><p><strong>${result.byModule[id].correct}/5 · ${result.byModule[id].percent}%</strong></p><div class="progress-track"><span style="width:${result.byModule[id].percent}%"></span></div></article>`).join("")}</div>
    <div class="section-heading"><h2>Lo que ya haces bien</h2></div><p>${strength.length ? `Fortaleza destacada: ${strength.map(id => esc(modules[id].title)).join(", ")}.` : "Sigue practicando: cada error te da una pista para mejorar."}</p>
    <div class="soft-panel"><strong>🎯 Recomendación personalizada</strong><ul class="step-list" style="margin-bottom:0">${personalizedAdvice(result)}</ul></div>
    ${result.missed.length ? `<div class="section-heading"><h2>Temas para reforzar</h2></div><div class="result-list">${result.missed.map(item => `<div class="result-row"><span><span class="badge">${modules[item.module].label}</span> ${esc(item.prompt)}</span><button class="link-button" data-action="practice-menu" data-module="${item.module}">Practicar →</button></div>`).join("")}</div>` : ""}
    <div class="button-row" style="margin-top:25px"><button class="button" data-action="menu">Volver al menú</button><button class="button secondary" data-action="export-one">Descargar mi resultado ↓</button></div></section>`;
}
function renderHistory() {
  const records = readStored(STORAGE_RESULTS, []).slice().reverse();
  const avg = records.length ? Math.round(records.reduce((sum, item) => sum + item.percent, 0) / records.length) : 0;
  const missedCounts = Object.keys(modules).map(id => ({
    id,
    count: records.reduce((sum, item) => sum + item.missed.filter(missed => missed.module === id).length, 0)
  })).sort((a, b) => b.count - a.count);
  const difficulties = Object.keys(modules).map(id => {
    const total = records.reduce((sum, item) => sum + (item.byModule[id]?.total || 0), 0);
    const correct = records.reduce((sum, item) => sum + (item.byModule[id]?.correct || 0), 0);
    return { id, percent: total ? Math.round(correct / total * 100) : null };
  });
  return `<button class="back-link" data-action="menu">← Menú principal</button><section class="page-heading"><div><p class="eyebrow">PANEL DOCENTE</p><h1>Resultados del grupo</h1><p>Revisa las notas y el tiempo de cada estudiante. Para reunir resultados de otros equipos, importa los CSV que descargó cada estudiante.</p></div><div class="button-row"><button class="button secondary" data-action="import-results">Importar CSV ↑</button><button class="button" data-action="export" ${records.length ? "" : "disabled"}>Descargar lista CSV ↓</button></div></section>
    <section class="soft-panel" style="margin-bottom:18px"><strong>¿Cómo funciona?</strong><p style="margin:5px 0 0">En un solo equipo, los resultados se guardan automáticamente. Si usan equipos diferentes: cada estudiante descarga su resultado y la profesora selecciona aquí todos esos archivos para reunirlos. Los registros importados se guardan en este navegador; no se envían a internet.</p></section>
    <div class="stat-grid"><div class="stat-card"><span>Estudiantes evaluados</span><strong>${records.length}</strong><span>evaluaciones guardadas</span></div><div class="stat-card"><span>Promedio general</span><strong>${records.length ? `${avg}%` : "—"}</strong><span>del grupo</span></div><div class="stat-card"><span>Mayor refuerzo</span><strong style="font-size:17px">${records.length ? esc(difficulties.filter(x => x.percent !== null).sort((a, b) => a.percent - b.percent)[0]?.id.replace("part", "Parte ") || "—") : "—"}</strong><span>menor precisión grupal</span></div><div class="stat-card"><span>Almacenamiento</span><strong style="font-size:18px">Local</strong><span>solo en este dispositivo</span></div></div>
    ${records.length ? `<div class="table-wrap"><table><thead><tr><th>Estudiante</th><th>Grupo</th><th>Fecha</th><th>Part 1</th><th>Part 2</th><th>Part 3</th><th>Total</th><th>Tiempo</th></tr></thead><tbody>${records.map(r => `<tr><td><strong>${esc(r.name)}</strong></td><td>${esc(r.group || "—")}</td><td>${new Date(r.date).toLocaleDateString("es-CO")}</td>${["part1","part2","part3"].map(id => `<td>${r.byModule[id].percent}%</td>`).join("")}<td><strong>${r.percent}%</strong></td><td>${formatDuration(r.duration * 1000)}</td></tr>`).join("")}</tbody></table></div>
    <div class="section-heading"><h2>Promedio por parte</h2></div><section class="feature-grid">${difficulties.map(x => `<article class="feature-card"><p class="eyebrow">${modules[x.id].label}</p><h3>${modules[x.id].title}</h3><p>${x.percent === null ? "Sin datos" : `${x.percent}% de aciertos grupales`}</p>${x.percent !== null ? `<div class="progress-track"><span style="width:${x.percent}%"></span></div>` : ""}</article>`).join("")}</section>
    <div class="section-heading"><h2>Dificultades más frecuentes</h2></div><section class="panel">${missedCounts.map(item => `<div class="result-row"><span><span class="badge">${modules[item.id].label}</span> ${modules[item.id].title}</span><strong>${item.count} errores</strong></div>`).join("")}
    <div class="section-heading"><h3>Estudiantes que necesitan refuerzo</h3></div>${Object.keys(modules).map(id => {
      const needsHelp = records.filter(record => record.byModule[id].percent < 60);
      return `<p><strong>${modules[id].label}:</strong> ${needsHelp.length ? needsHelp.map(record => `${esc(record.name)} (${record.byModule[id].percent}%)`).join(", ") : "Ningún estudiante bajo 60%."}</p>`;
    }).join("")}</section>` : `<section class="panel empty-state"><div class="icon">📋</div><h3>Aún no hay resultados</h3><p>Cuando un estudiante termine la evaluación, su resultado aparecerá aquí. También puedes importar los CSV que descargó el grupo.</p><div class="button-row" style="justify-content:center"><button class="button" data-action="register">Registrar primer estudiante</button><button class="button secondary" data-action="import-results">Importar resultados CSV</button></div></section>`}`;
}
function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}
function render() {
  if (view === "home") app.innerHTML = renderHome();
  else if (view === "menu") app.innerHTML = renderMenu();
  else if (view === "how") app.innerHTML = renderHow();
  else if (view === "lesson") app.innerHTML = renderLesson();
  else if (view === "practice-menu") app.innerHTML = renderPracticeMenu();
  else if (view === "quiz") app.innerHTML = renderQuiz();
  else if (view === "practice-complete") app.innerHTML = renderPracticeComplete();
  else if (view === "register") app.innerHTML = renderRegister();
  else if (view === "result") app.innerHTML = renderResult();
  else if (view === "history") app.innerHTML = renderHistory();
  clearTimeout(clockTimer);
  if (view === "quiz") clockTimer = setTimeout(updateClock, 1000);
}
function updateClock() {
  if (view !== "quiz" || !activeQuiz) return;
  const label = app.querySelector(".quiz-top .small-note");
  if (label) label.textContent = `⏱ ${formatDuration(Date.now() - activeQuiz.startedAt)}`;
  clockTimer = setTimeout(updateClock, 1000);
}
function currentEvaluationQuestion(index) {
  if (index < 5) return { moduleId: "part1", q: evaluation.part1.questions[index], bank: evaluation.part1.bank };
  if (index < 10) return { moduleId: "part2", q: evaluation.part2[index - 5] };
  return { moduleId: "part3", q: evaluation.part3[index - 10] };
}
function handleAnswer(index) {
  if (activeQuiz.kind === "practice") return chooseAnswer(index);
  if (activeQuiz.answers[activeQuiz.index]) return;
  const { moduleId, q, bank } = currentEvaluationQuestion(activeQuiz.index);
  const options = moduleId === "part1" ? bank : q.options || q.places;
  const correct = moduleId === "part1" ? options[index] === q.answer : index === q.answer;
  activeQuiz.answers[activeQuiz.index] = { selected: index, correct, selectedText: options[index] };
  activeQuiz.moduleId = moduleId;
  activeQuiz.bank = bank || null;
  activeQuiz.questions = [
    ...evaluation.part1.questions,
    ...evaluation.part2,
    ...evaluation.part3
  ];
  render();
}
function init() {
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const moduleId = button.dataset.module;
    if (action === "home") navigate("home");
    if (action === "menu") navigate("menu");
    if (action === "how") navigate("how");
    if (action === "history") navigate("history");
    if (action === "lesson") { currentModule = moduleId; lessonStep = 0; lessonExampleIndex = 0; lessonAnswerShown = false; lessonHintsShown = false; lessonSelectedChoice = ""; lessonAnswerChecked = false; navigate("lesson"); }
    if (action === "practice-menu") { currentModule = moduleId; navigate("practice-menu"); }
    if (action === "start-practice") startPractice(moduleId, Number(button.dataset.set));
    if (action === "answer") handleAnswer(Number(button.dataset.index));
    if (action === "next-question") nextQuestion();
    if (action === "toggle-tip") { activeQuiz.showTip = !activeQuiz.showTip; render(); }
    if (action === "register") navigate("register");
    if (action === "export") exportResults();
    if (action === "export-one" && activeQuiz?.result) exportResults([activeQuiz.result], "english-challenge-mi-resultado.csv");
    if (action === "import-results") document.getElementById("results-import").click();
    if (action === "lesson-prev") { lessonStep = Math.max(0, lessonStep - 1); lessonAnswerShown = false; lessonHintsShown = false; lessonSelectedChoice = ""; lessonAnswerChecked = false; render(); }
    if (action === "lesson-go-step") {
      lessonStep = Number(button.dataset.step);
      lessonAnswerShown = false;
      lessonHintsShown = false;
      lessonSelectedChoice = "";
      lessonAnswerChecked = false;
      render();
    }
    if (action === "lesson-example") {
      lessonExampleIndex = Number(button.dataset.index);
      lessonAnswerShown = false;
      lessonHintsShown = false;
      lessonSelectedChoice = "";
      lessonAnswerChecked = false;
      render();
    }
    if (action === "lesson-next") {
      if (lessonStep < lessons[currentModule].length - 1) { lessonStep++; lessonAnswerShown = false; lessonHintsShown = false; lessonSelectedChoice = ""; lessonAnswerChecked = false; }
      else { navigate("menu"); notify("Exposición finalizada. ¡Buen trabajo!"); return; }
      render();
    }
    if (action === "toggle-keywords") { lessonHintsShown = !lessonHintsShown; render(); }
    if (action === "select-lesson-choice") { lessonSelectedChoice = button.dataset.value; render(); }
    if (action === "check-lesson-answer") {
      if (!lessonSelectedChoice) { notify("Selecciona una opción antes de comprobarla."); return; }
      lessonAnswerShown = true;
      lessonAnswerChecked = true;
      render();
    }
    if (action === "pause") {
      if (button.dataset.paused === "true") { button.dataset.paused = "false"; button.textContent = "Iniciar pausa de 20 s"; return; }
      button.textContent = "Pausa activa · 20 s";
      button.disabled = true;
      let remaining = 20;
      const timer = setInterval(() => {
        remaining--;
        if (!button.isConnected) { clearInterval(timer); return; }
        button.textContent = remaining ? `Pausa activa · ${remaining} s` : "Continuar exposición";
        if (remaining <= 0) {
          clearInterval(timer);
          button.disabled = false;
          button.dataset.paused = "true";
        }
      }, 1000);
    }
  });
  app.addEventListener("submit", event => {
    if (event.target.id !== "student-form") return;
    event.preventDefault();
    const data = new FormData(event.target);
    const student = { name: String(data.get("name") || "").trim(), group: String(data.get("group") || "").trim() };
    if (!student.name) { notify("Escribe el nombre del estudiante para continuar.", true); return; }
    const questions = [...evaluation.part1.questions, ...evaluation.part2, ...evaluation.part3];
    activeQuiz = { kind: "assessment", moduleId: "part1", questions, bank: evaluation.part1.bank, student, index: 0, answers: [], startedAt: Date.now(), showTip: false };
    navigate("quiz");
  });
  document.getElementById("results-import").addEventListener("change", async event => {
    const input = event.target;
    try {
      await importResults(Array.from(input.files || []));
    } catch (error) {
      notify(error.message, true);
    } finally {
      input.value = "";
    }
  });
  render();
}
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell.length === 0) quoted = true;
    else if (char === ";") { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") {
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      cell = "";
      if (char === "\r" && text[i + 1] === "\n") i++;
    } else cell += char;
  }
  if (quoted) throw new Error("El archivo CSV tiene comillas sin cerrar.");
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}
function importedResult(row, indexes, fileName) {
  const value = key => row[indexes[key]] ?? "";
  const required = ["ID", "Nombre", "Fecha ISO", "Part 1 (%)", "Part 2 (%)", "Part 3 (%)", "Correctas", "Total", "Porcentaje (%)", "Tiempo (seg)", "Dificultades"];
  if (required.some(key => indexes[key] === undefined)) {
    throw new Error(`${fileName}: faltan columnas. Usa el CSV descargado desde English Challenge.`);
  }
  const name = value("Nombre").trim();
  const id = value("ID").trim();
  const date = value("Fecha ISO").trim();
  const numeric = key => {
    const raw = value(key).trim();
    if (!raw || !Number.isFinite(Number(raw))) throw new Error(`${fileName}: valor inválido en "${key}".`);
    return Number(raw);
  };
  const correct = numeric("Correctas");
  const total = numeric("Total");
  const percent = numeric("Porcentaje (%)");
  const duration = numeric("Tiempo (seg)");
  const dateValue = new Date(date);
  if (!id || !name || !date || Number.isNaN(dateValue.getTime())) throw new Error(`${fileName}: falta el nombre, el identificador o una fecha válida.`);
  if (!Number.isInteger(correct) || !Number.isInteger(total) || total !== 15 || correct < 0 || correct > total || percent !== Math.round(correct / total * 100) || !Number.isInteger(duration) || duration < 0) {
    throw new Error(`${fileName}: hay una calificación, total o tiempo fuera de rango.`);
  }
  const byModule = {};
  for (const [index, moduleId] of ["part1", "part2", "part3"].entries()) {
    const modulePercent = numeric(`Part ${index + 1} (%)`);
    if (!Number.isInteger(modulePercent) || modulePercent < 0 || modulePercent > 100 || modulePercent % 20 !== 0) {
      throw new Error(`${fileName}: la calificación de la parte ${index + 1} no es válida.`);
    }
    byModule[moduleId] = { correct: modulePercent / 20, total: 5, percent: modulePercent };
  }
  const missedItems = value("Dificultades").split("|").map(item => item.trim()).filter(Boolean);
  const missed = missedItems.map(item => {
    const match = item.match(/^PART ([123]) P(\d+)$/);
    if (!match || Number(match[2]) < 1 || Number(match[2]) > 5) throw new Error(`${fileName}: hay un dato inválido en "Dificultades".`);
    const moduleId = `part${match[1]}`;
    return { module: moduleId, question: Number(match[2]), prompt: `Pregunta ${match[2]} (resultado importado)` };
  });
  if (Object.values(byModule).reduce((sum, module) => sum + module.correct, 0) !== correct) {
    throw new Error(`${fileName}: el puntaje por tema no coincide con el total.`);
  }
  return {
    id, name, group: value("Grupo").trim(), date: dateValue.toISOString(), duration, correct, total, percent, byModule, missed
  };
}
async function importResults(files) {
  if (!files.length) return;
  const imported = [];
  for (const file of files) {
    const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
    if (rows.length < 2) throw new Error(`${file.name}: no contiene resultados para importar.`);
    const headers = rows[0].map(header => header.trim());
    const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
    for (const row of rows.slice(1)) {
      if (row.length !== headers.length) throw new Error(`${file.name}: hay una fila incompleta o con formato incorrecto.`);
      imported.push(importedResult(row, indexes, file.name));
    }
  }
  const records = readStored(STORAGE_RESULTS, []);
  const knownIds = new Set(records.map(record => record.id).filter(Boolean));
  const unique = imported.filter(record => {
    if (knownIds.has(record.id)) return false;
    knownIds.add(record.id);
    return true;
  });
  const duplicates = imported.length - unique.length;
  if (!unique.length) {
    notify(`No hay resultados nuevos. ${duplicates} registro(s) ya estaban guardados.`);
    return;
  }
  if (!saveStored(STORAGE_RESULTS, [...records, ...unique])) return;
  notify(`${unique.length} resultado(s) importado(s). ${duplicates} duplicado(s) omitido(s).`);
  if (view === "history") render();
}
function exportResults(records = readStored(STORAGE_RESULTS, []), fileName = "english-challenge-resultados.csv") {
  if (!records.length) { notify("Todavía no hay resultados para exportar.", true); return; }
  const headers = ["ID", "Nombre", "Grupo", "Fecha", "Fecha ISO", "Part 1 (%)", "Part 2 (%)", "Part 3 (%)", "Correctas", "Total", "Porcentaje (%)", "Tiempo (seg)", "Dificultades"];
  const rows = records.map(r => [r.id, r.name, r.group || "", new Date(r.date).toLocaleString("es-CO"), r.date, r.byModule.part1.percent, r.byModule.part2.percent, r.byModule.part3.percent, r.correct, r.total, r.percent, r.duration, r.missed.map(x => `${modules[x.module].label} P${x.question}`).join(" | ")]);
  const csv = "\uFEFF" + [headers, ...rows].map(row => row.map(value => {
    const safeValue = /^[\s]*[=+\-@]/.test(String(value)) ? `'${value}` : value;
    return `"${String(safeValue).replace(/"/g, '""')}"`;
  }).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  notify("Descarga de resultados iniciada.");
}
init();
