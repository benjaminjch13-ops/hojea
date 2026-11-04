// Ideas de citas de Muu. Sirven de base para la IA y son la lista que se usa cuando no hay IA o conexión.
// src: guatemala | internet (tendencias de redes) | clasica | vaquitas
// lugar: casa | ciudad | escapada · costo: 1 (gratis o barato), 2 (normal), 3 (para consentirse)
// No lleva precios ni horarios exactos porque cambian: cada plan fuera de casa se confirma antes de ir.
const idea = (id, src, lugar, costo, t, tip) => ({ id, src, lugar, costo, t, tip });

export const DATE_IDEAS = [
  // Guatemala
  idea('gt-cerro-cruz', 'guatemala', 'escapada', 1, 'Subir al Cerro de la Cruz en Antigua', 'Vayan temprano para ver el Agua despejado y bajen por un café en el centro.'),
  idea('gt-calle-arco', 'guatemala', 'escapada', 1, 'Tarde de fotos en la Calle del Arco', 'Tómense una foto en cada esquina y péguenlas en su libreta al volver.'),
  idea('gt-antigua-pepian', 'guatemala', 'escapada', 2, 'Cena de pepián en Antigua', 'Elijan un lugar que ninguno conozca y terminen caminando por el Parque Central.'),
  idea('gt-clase-cocina', 'guatemala', 'escapada', 2, 'Clase de cocina guatemalteca en Antigua', 'Aprendan un plato y repítanlo en casa para ver a quién le sale mejor.'),
  idea('gt-chocolate', 'guatemala', 'escapada', 2, 'Taller de chocolate en Antigua', 'Hagan una barra para el otro con los ingredientes que crean que le gustan.'),
  idea('gt-cafe-finca', 'guatemala', 'escapada', 2, 'Tour por una finca de café cerca de Antigua', 'Compren una bolsa del café que más les guste y estrénenla al día siguiente.'),
  idea('gt-macadamia', 'guatemala', 'escapada', 2, 'Visitar una finca de macadamia en San Miguel Dueñas', 'Pregunten antes por los horarios de las visitas guiadas.'),
  idea('gt-hobbitenango', 'guatemala', 'escapada', 2, 'Día en Hobbitenango, en las colinas de Antigua', 'Lleven abrigo y quédense hasta que empiece a bajar el sol.'),
  idea('gt-atitlan-atardecer', 'guatemala', 'escapada', 2, 'Ver el atardecer en el Lago de Atitlán', 'Lleguen con tiempo a Panajachel y busquen un muelle tranquilo.'),
  idea('gt-atitlan-kayak', 'guatemala', 'escapada', 2, 'Remar en kayak por Atitlán', 'Salgan temprano, cuando el lago suele estar más calmado, y confirmen el clima.'),
  idea('gt-atitlan-pueblos', 'guatemala', 'escapada', 2, 'Recorrer pueblos de Atitlán en lancha', 'Compren un recuerdo pequeño en cada pueblo para pegarlo en su libreta.'),
  idea('gt-pacaya', 'guatemala', 'escapada', 2, 'Subir el Volcán de Pacaya y asar malvaviscos', 'Lleven sus malvaviscos, vayan con guía y confirmen el estado del volcán antes de salir.'),
  idea('gt-monterrico', 'guatemala', 'escapada', 2, 'Liberar tortugas al atardecer en Monterrico', 'La temporada suele ir de julio a enero: confirmen las fechas con el centro de conservación.'),
  idea('gt-manglar', 'guatemala', 'escapada', 2, 'Paseo por los manglares de Monterrico', 'Salgan al amanecer y lleven bloqueador y repelente.'),
  idea('gt-georginas', 'guatemala', 'escapada', 2, 'Aguas termales en Fuentes Georginas, cerca de Xela', 'Lleven ropa abrigada para cuando salgan del agua y coman algo caliente en Xela.'),
  idea('gt-tikal', 'guatemala', 'escapada', 3, 'Viaje a Tikal para ver el amanecer entre templos', 'Reserven con guía y dejen un día libre para descansar en Flores.'),
  idea('gt-semuc', 'guatemala', 'escapada', 3, 'Escapada a las pozas de Semuc Champey', 'Planeen al menos dos noches, porque el camino es largo.'),
  idea('gt-rio-dulce', 'guatemala', 'escapada', 3, 'Paseo en lancha por Río Dulce', 'Aprovechen para seguir hasta Livingston y probar el tapado.'),
  idea('gt-4-grados', 'guatemala', 'ciudad', 2, 'Caminar y cenar en Cuatro Grados Norte', 'Revisen si hay algo en el Centro Cultural de España y cierren con un postre.'),
  idea('gt-cayala', 'guatemala', 'ciudad', 2, 'Paseo por Cayalá al caer la tarde', 'Compren algo dulce y busquen una banca para ver pasar a la gente.'),
  idea('gt-teatro', 'guatemala', 'ciudad', 2, 'Función en el Teatro Nacional', 'Revisen la cartelera del Centro Cultural Miguel Ángel Asturias y suban a ver la vista.'),
  idea('gt-museos-z13', 'guatemala', 'ciudad', 1, 'Tarde de museos en la zona 13', 'Cada uno elige su pieza favorita y le explica al otro por qué.'),
  idea('gt-mapa-relieve', 'guatemala', 'ciudad', 1, 'Visitar el Mapa en Relieve y elegir su próximo viaje', 'Señalen el lugar al que quieren ir juntos y pónganle fecha.'),
  idea('gt-mercado-artesanias', 'guatemala', 'ciudad', 1, 'Comprarse un detalle en el Mercado de Artesanías', 'Pongan un límite pequeño y den el regalo a escondidas al final.'),
  idea('gt-chocolate-pan', 'guatemala', 'casa', 1, 'Tarde de chocolate caliente y pan dulce chapín', 'Pongan música de cuando se conocieron y saquen las cobijas.'),
  idea('gt-receta-abuela', 'guatemala', 'casa', 1, 'Cocinar juntos un plato chapín de la familia', 'Pidan la receta por teléfono a alguien de la familia y escríbanla en su libreta.'),

  // Tendencias de redes
  idea('net-alfabeto', 'internet', 'ciudad', 2, 'Empezar sus citas del alfabeto: A de…', 'Una cita por letra. Túrnense para elegir y lleven la lista en una libreta.'),
  idea('net-retrato', 'internet', 'casa', 1, 'Paint Your Partner: pintar al otro sin mirar', 'Pinten al mismo tiempo, sin ver el lienzo del otro hasta el final.'),
  idea('net-reto-compras', 'internet', 'ciudad', 1, 'Reto del súper: un regalo con presupuesto', 'Cada uno elige un regalo con el mismo límite y lo abren en el carro.'),
  idea('net-ruleta-comida', 'internet', 'ciudad', 1, 'Ruleta de comida: que la suerte elija la cena', 'Escriban cinco antojos y comprométanse a respetar lo que salga.'),
  idea('net-manualidades', 'internet', 'casa', 1, 'Manualidades con cosas de la tienda de todo barato', 'Compren materiales con poco dinero y hagan algo para el otro.'),
  idea('net-baile', 'internet', 'casa', 1, 'Aprender un baile de TikTok', 'Grábense aunque salga mal: es el mejor recuerdo.'),
  idea('net-receta-viral', 'internet', 'casa', 1, 'Probar una receta viral de TikTok', 'Califiquen del 1 al 10 y anoten el veredicto en su libreta.'),
  idea('net-retos', 'internet', 'casa', 1, 'Noche de retos en pareja con puntos', 'El que pierda prepara el desayuno del día siguiente.'),
  idea('net-scrapbook', 'internet', 'casa', 1, 'Armar un scrapbook de sus mejores citas', 'Junten fotos y boletos y úsenlos para decorar una página de su libreta.'),
  idea('net-sorpresa', 'internet', 'ciudad', 2, 'Cita sorpresa: quien la planea no da pistas', 'Solo avisen qué ropa llevar. A la próxima planea el otro.'),

  // Clásicas
  idea('cl-picnic', 'clasica', 'ciudad', 1, 'Picnic al atardecer con su comida favorita', 'Lleven manta, algo dulce y una lista de canciones.'),
  idea('cl-cocinar', 'clasica', 'casa', 1, 'Cocinar una receta que nunca han probado', 'Elijan un país al azar y pongan música de allá.'),
  idea('cl-peliculas', 'clasica', 'casa', 1, 'Noche de películas con fuerte de cobijas', 'Cada uno elige una película y el otro no puede quejarse.'),
  idea('cl-estrellas', 'clasica', 'escapada', 1, 'Ver las estrellas lejos de la ciudad', 'Busquen un mirador seguro, lleven abrigo y chocolate en un termo.'),
  idea('cl-desayuno', 'clasica', 'ciudad', 2, 'Desayuno sin prisa en un lugar nuevo', 'Pidan algo que no conozcan y compártanlo.'),
  idea('cl-amanecer', 'clasica', 'escapada', 1, 'Caminar a un mirador para ver el amanecer', 'Preparen la mochila la noche anterior y vayan acompañados de un buen café.'),
  idea('cl-juegos', 'clasica', 'casa', 1, 'Tarde de juegos de mesa con apuesta de besos', 'Sumen un premio para el que gane más partidas.'),
  idea('cl-cafes', 'clasica', 'ciudad', 2, 'Tour de cafeterías: tres en un día', 'Pidan lo mismo en cada una y elijan a la ganadora.'),
  idea('cl-karaoke', 'clasica', 'casa', 1, 'Noche de karaoke en casa', 'Dedíquense una canción cada uno, sin importar cómo cante.'),
  idea('cl-playlist', 'clasica', 'casa', 1, 'Armar la playlist de su historia', 'Una canción por cada momento importante, en orden.'),
  idea('cl-primera-cita', 'clasica', 'ciudad', 2, 'Volver al lugar de su primera cita', 'Pidan lo mismo de aquella vez y cuéntense qué pensaban ese día.'),
  idea('cl-rompecabezas', 'clasica', 'casa', 1, 'Rompecabezas con una copa de vino', 'Elijan uno con una imagen que les guste para enmarcarlo.'),
  idea('cl-libreria', 'clasica', 'ciudad', 2, 'Ir a una librería y regalarse un libro', 'Escriban una dedicatoria en la primera página.'),
  idea('cl-sesion-fotos', 'clasica', 'ciudad', 1, 'Sesión de fotos en su lugar favorito', 'Impriman la mejor y pónganla en su libreta.'),
  idea('cl-velas', 'clasica', 'casa', 2, 'Cena a la luz de las velas en casa', 'Vístanse como si fueran a salir, aunque no salgan.'),
  idea('cl-plantar', 'clasica', 'casa', 1, 'Plantar algo juntos y cuidarlo', 'Pónganle nombre y túrnense para regarla.'),
  idea('cl-carta', 'clasica', 'casa', 1, 'Escribirse una carta y abrirla en un año', 'Séllenlas y pongan la fecha en su libreta.'),

  // Vaquitas
  idea('va-finca', 'vaquitas', 'escapada', 2, 'Quedarse en una finca con vacas cerca de Antigua', 'Hay estadías de finca con tour lechero, como Finca La Torre: confirmen si sigue disponible.'),
  idea('va-documental', 'vaquitas', 'casa', 1, 'Documental de vacas peludas con chocolate caliente', 'Pongan nombre a cada vaca que salga y elijan a su favorita.'),
  idea('va-taza', 'vaquitas', 'casa', 1, 'Pintar vaquitas en una taza y estrenarla', 'Usen marcadores para cerámica y brinden con leche y galletas.'),
  idea('va-galletas', 'vaquitas', 'casa', 1, 'Hornear galletas con forma de vaquita', 'Decórenlas con manchas de chocolate y regálense la más fea.'),
];

export const SOURCE_LABELS = {
  guatemala: 'En Guatemala', internet: 'Visto en redes', clasica: 'Clásica', vaquitas: 'De vaquitas',
};

// Elige una idea que cumpla los filtros. Si ya se mostraron todas, puede repetir antes que quedarse sin idea.
export function pickIdea({ lugar, costo } = {}, avoid = [], random = Math.random) {
  const matching = DATE_IDEAS.filter((d) => (!lugar || d.lugar === lugar) && (!costo || d.costo === costo));
  const pool = matching.length ? matching : DATE_IDEAS;
  const fresh = pool.filter((d) => !avoid.includes(d.id));
  const options = fresh.length ? fresh : pool;
  return options[Math.floor(random() * options.length)];
}
