# La Naranja

Tenés catorce años y una pelota. Veinte temporadas después, alguien decide si
entrás al Salón de la Fama.

Simulador de carrera de básquet. Corre en el navegador, no hay cuenta que crear
y la partida se guarda en tu máquina.

**[Jugar](https://rodcor.github.io/jamstar/)**

---

## De dónde sos decide por dónde vas

Elegís el país en la pantalla de creación, y con eso elegís la escalera.

Un argentino sale de la cantera, debuta en la Liga Nacional y, si crece lo
suficiente, se cruza a Europa. Un serbio entra a una academia con cuchetas al
lado del gimnasio, juega la ABA y apunta a la Euroliga. Un estadounidense pasa
por el circuito de verano, la NCAA y el draft, o por la G League si ninguna
universidad grande lo llama.

Veintiún países, veintiuna escaleras. La escalera también baja: cuando a los
treinta y cuatro ya no das para la liga en la que estás, te mandan a una más
chica sin preguntarte.

## Cartas que solo te tocan si sos de donde sos

Hay un mazo de eventos que se abre según tu pasaporte.

En Alemania te dan la doble ficha. El sábado a la noche jugás en la segunda del
club, contra hombres de treinta que cobran por estar ahí; el domingo a las once,
trescientos kilómetros más allá, jugás el juvenil. Dos entrenadores, un cuerpo, y
los dos hablan de vos como si fueras de ellos.

En China te eligieron a los doce por la altura de tus viejos y una radiografía de
la muñeca. Seis horas por día en un edificio donde también dormís, y el colegio
es lo que queda en el medio.

En Nigeria, Senegal o Camerún la academia paga el pasaje, el colegio y la comida,
y a cambio se queda con una parte de lo que ganes el día que ganes algo. La
reunión es en el patio de tu casa, con toda la familia sentada.

Y en un club de socios, la noche que se vota el presupuesto, los dos bandos dicen
tu apellido desde el micrófono.

## Elegís sabiendo lo que te van a cobrar

Nada está escondido. Al lado de cada atributo, en la pantalla de creación, dice
qué te da y qué te saca.

Físico: explosión, rebote y aguante, con más lesiones y la caída más dura después
de los treinta. Mentalidad es el único que te sigue subiendo a los treinta y
siete.

Con los estilos pasa lo mismo, y está escrito ahí antes de que confirmes. Atleta
explosivo: *volás, sos viral y firmás contratos enormes, pero tu cuerpo paga la
factura después de los 30.* Muralla: *ganás partidos sin que se note en la
planilla; los entrenadores te aman, los votantes de MVP no.*

## La final se juega

Llegar a la final la simula el juego. Ganarla, no.

Si llegás, se para todo y la jugás vos. Tiros libres con el estadio de pie. El
triple de los últimos segundos, porque la pelota terminó en tus manos y no hay
otra jugada. Un punto arriba, quedan seis y ellos sacan de banda.

Cuál te toca depende del jugador que construiste: al pivote defensivo le mandan
la última defensa, al tirador le mandan el tiro. Y no alcanza con una sola. Dos
de tres para las ligas de tu país, tres de cinco en la Euroliga y en la NBA.

## Un rival durante veinte años

Al crear el jugador el juego te asigna uno, de tu misma posición y con
preferencia por tu mismo país. Su carrera se simula en paralelo a la tuya,
temporada por temporada, hasta el final. Cuando te retirás, la última línea de tu
resumen dice si terminaste arriba o abajo de él.

## El draft no te cae encima

Antes de la noche tenés una pantalla que te dice en qué puesto te proyectan, qué
tan probable es que te elijan y qué te está frenando: si todavía no sos lo
bastante bueno, o si sos bueno y nadie te vio jugar. Con eso decidís si te anotás
este año o esperás uno más.

## Dos modos

**Mi Carrera.** Tu suerte, tu historia. Empezás distinto cada vez y jugás las
veces que quieras.

**Carrera del Día.** Todos arrancan con la misma suerte: mismo país, mismo club,
mismas lesiones. Gana el que decide mejor. Una por día.

## Y además

Está en castellano y en inglés, y cambiás de idioma en cualquier momento sin
perder la carrera. Al terminar te queda una tarjeta de retiro para compartir, con
la semilla adentro, así cualquiera puede correr tu carrera exacta.

Sale de la misma familia que [Copero](https://copero.com.ar/juegos/simulador-carrera),
[El Ídolo](https://www.potrerofutbol.ar/el-idolo) y
[F1 Glory](https://f1-glory.vercel.app), a los que les debe más de una idea.

---

## Correrlo

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # build de producción
npm run typecheck
npm test
npm run lint
```

Se publica en **https://rodcor.github.io/jamstar/** con
`.github/workflows/deploy.yml`, en cada push a `main`. El export estático es
opcional: `STATIC_EXPORT=true` lo genera en `out/`, y `NEXT_PUBLIC_BASE_PATH`
sirve desde un subpath. Un `npm run build` pelado sigue dando una app Next
normal, así que Vercel sigue siendo un comando.

## Sobre los nombres

Las ligas, los clubes y los jugadores reales están para que la cosa se sienta
real, igual que en los juegos que lo inspiraron. Son marcas de sus dueños y acá
no hay ninguna afiliación ni aval. Todos los nombres viven en cuatro archivos de
`src/data` y el motor solo usa `id`, así que reemplazarlos por un set inventado
no toca `src/game`. Los escudos de club son obra protegida además de marca:
alcanzan para un proyecto de hobby, no para publicar y cobrar.

## Licencia

MIT — ver [LICENSE](LICENSE).
