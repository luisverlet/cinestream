export interface ImdbMovie {
  rank: number;
  title: string;
  originalTitle: string;
  year: number;
  rating: number;
  director: string;
  duration?: string;
  posterUrl: string;
  synopsis: string;
}

export interface ImdbSubgenre {
  id: string;
  name: string;
  description: string;
  icon: string;
  movies: ImdbMovie[];
}

export interface ImdbGenreCategory {
  id: string;
  name: string;
  icon: string;
  subgenres: ImdbSubgenre[];
}

export const IMDB_TOP_GENRES: ImdbGenreCategory[] = [
  {
    id: 'terror',
    name: 'Terror',
    icon: '👻',
    subgenres: [
      {
        id: 'found-footage',
        name: 'Found Footage (Metraje Encontrado)',
        icon: '📹',
        description: 'Grabaciones caseras, cintas perdidas y falso documental donde el terror parece real.',
        movies: [
          {
            rank: 1,
            title: 'El proyecto de la bruja de Blair',
            originalTitle: 'The Blair Witch Project',
            year: 1999,
            rating: 6.5,
            director: 'Daniel Myrick, Eduardo Sánchez',
            duration: '81 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/inD6HqKiqt3yO9RovR6lXzZtZ3L.jpg',
            synopsis: 'Tres estudiantes de cine desaparecen en los bosques de Black Hills mientras filmaban un documental sobre una leyenda local.'
          },
          {
            rank: 2,
            title: '[REC]',
            originalTitle: 'REC',
            year: 2007,
            rating: 7.4,
            director: 'Jaume Balagueró, Paco Plaza',
            duration: '78 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5v2b4pS9W5m6y8rVj9f3oX6j7sU.jpg',
            synopsis: 'Una reportera de televisión y su cámara acompañan a los bomberos a un edificio donde un extraño virus desata el canibalismo.'
          },
          {
            rank: 3,
            title: 'Poder sin límites',
            originalTitle: 'Chronicle',
            year: 2012,
            rating: 7.0,
            director: 'Josh Trank',
            duration: '84 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5k4WkYgqVb1D4Fk1P1l4M6j9z.jpg',
            synopsis: 'Tres adolescentes obtienen telequinesis tras descubrir una misteriosa sustancia, pero uno de ellos pierde el control moral.'
          },
          {
            rank: 4,
            title: 'Cloverfield (Monstruoso)',
            originalTitle: 'Cloverfield',
            year: 2008,
            rating: 7.0,
            director: 'Matt Reeves',
            duration: '85 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/77w0N2bIcsK1Qc4N8wO9jN1V.jpg',
            synopsis: 'Durante una fiesta de despedida en Nueva York, un monstruo colosal de origen desconocido arrasa la ciudad de Manhattan.'
          },
          {
            rank: 5,
            title: 'Actividad Paranormal',
            originalTitle: 'Paranormal Activity',
            year: 2007,
            rating: 6.3,
            director: 'Oren Peli',
            duration: '86 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/44xKq6jWzZtZ3L8rVj9f3oX6j7s.jpg',
            synopsis: 'Una joven pareja instala cámaras en su nueva casa tras notar extraños ruidos, registrando la presencia de un demonio.'
          },
          {
            rank: 6,
            title: 'Creep',
            originalTitle: 'Creep',
            year: 2014,
            rating: 6.3,
            director: 'Patrick Brice',
            duration: '77 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/t7Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un camarógrafo desempleado acepta un trabajo en una cabaña remota para grabar a un hombre que dice tener cáncer terminal.'
          },
          {
            rank: 7,
            title: 'Así en la tierra como en el infierno',
            originalTitle: 'As Above So Below',
            year: 2014,
            rating: 6.2,
            director: 'John Erick Dowdle',
            duration: '93 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/r0s6jWzZtZ3L8rVj9f3oX6j7sU4.jpg',
            synopsis: 'Un equipo de exploradores se adentra en las catacumbas bajo París en busca de la piedra filosofal, despertando sus propios demonios.'
          },
          {
            rank: 8,
            title: 'Grave Encounters (Fenómeno Siniestro)',
            originalTitle: 'Grave Encounters',
            year: 2011,
            rating: 6.1,
            director: 'The Vicious Brothers',
            duration: '92 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6wLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'El equipo de un programa de cazafantasmas se encierra de noche en un hospital psiquiátrico abandonado con actividad paranormal real.'
          },
          {
            rank: 9,
            title: 'Lake Mungo',
            originalTitle: 'Lake Mungo',
            year: 2008,
            rating: 6.3,
            director: 'Joel Anderson',
            duration: '87 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Falso documental sobre una familia australiana afligida tras el ahogamiento de su hija, quien empieza a aparecer en fotos y videos.'
          },
          {
            rank: 10,
            title: 'Hell House LLC',
            originalTitle: 'Hell House LLC',
            year: 2015,
            rating: 6.4,
            director: 'Stephen Cognetti',
            duration: '93 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3wLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un grupo de creadores de casas del terror preparan un hotel abandonado para Halloween; una tragedia sobrenatural cobra 15 vidas.'
          },
          {
            rank: 11,
            title: 'Noroi: La Maldición',
            originalTitle: 'Noroi The Curse',
            year: 2005,
            rating: 6.9,
            director: 'Kôji Shiraishi',
            duration: '115 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2wLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un documentalista paranormal investiga sucesos aparentemente aislados que conducen a una antigua y letal entidad demoníaca: Kagutaba.'
          },
          {
            rank: 12,
            title: 'V/H/S/2',
            originalTitle: 'VHS 2',
            year: 2013,
            rating: 6.1,
            director: 'Gareth Evans, Timo Tjahjanto',
            duration: '96 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1wLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Investigadores privados buscan a un estudiante desaparecido y descubren cintas de video caseras con grotescas historias ocultas.'
          },
          {
            rank: 13,
            title: 'Los huéspedes',
            originalTitle: 'The Visit',
            year: 2015,
            rating: 6.3,
            director: 'M. Night Shyamalan',
            duration: '94 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5wLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Dos hermanos visitan a sus abuelos por primera vez en su remota granja de Pensilvania y descubren que algo perturba a los ancianos de noche.'
          },
          {
            rank: 14,
            title: 'The Poughkeepsie Tapes',
            originalTitle: 'The Poughkeepsie Tapes',
            year: 2007,
            rating: 6.0,
            director: 'John Erick Dowdle',
            duration: '86 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8wLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Cientos de cintas de video descubiertas en una casa abandonada revelan los atroces crímenes y torturas de un asesino en serie impune.'
          },
          {
            rank: 15,
            title: 'Host (Conectados)',
            originalTitle: 'Host',
            year: 2020,
            rating: 6.5,
            director: 'Rob Savage',
            duration: '57 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4wLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Seis amigos contratan a una médium para realizar una sesión espiritista a través de Zoom durante el confinamiento, atrayendo una presencia hostil.'
          }
        ]
      },
      {
        id: 'slasher',
        name: 'Slasher (Asesinos & Psicópatas)',
        icon: '🔪',
        description: 'Psicópatas con armas blancas cazando grupos de jóvenes uno a uno.',
        movies: [
          {
            rank: 1,
            title: 'Psicosis',
            originalTitle: 'Psycho',
            year: 1960,
            rating: 8.5,
            director: 'Alfred Hitchcock',
            duration: '109 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/yz45KMrciuEtJuNd9BPgQhaR67s.jpg',
            synopsis: 'Una secretaria huye con dinero robado y se hospeda en un tétrico motel regentado por Norman Bates y su misteriosa madre.'
          },
          {
            rank: 2,
            title: 'Halloween',
            originalTitle: 'Halloween',
            year: 1978,
            rating: 7.7,
            director: 'John Carpenter',
            duration: '91 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/b4F0Lq9s6jWzZtZ3L8rVj9f3oX6.jpg',
            synopsis: 'Quince años después de asesinar a su hermana, Michael Myers escapa del psiquiátrico y regresa a su pueblo natal en la noche de brujas.'
          },
          {
            rank: 3,
            title: 'Scream: Vigila quién llama',
            originalTitle: 'Scream',
            year: 1996,
            rating: 7.4,
            director: 'Wes Craven',
            duration: '111 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7aLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un enmascarado conocido como Ghostface aterroriza a los estudiantes de Woodsboro usando preguntas sobre cine de terror para matarlos.'
          },
          {
            rank: 4,
            title: 'Pesadilla en la calle del infierno',
            originalTitle: 'A Nightmare on Elm Street',
            year: 1984,
            rating: 7.4,
            director: 'Wes Craven',
            duration: '91 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4nLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Varios adolescentes son perseguidos y asesinados en sus sueños por Freddy Krueger, un asesino quemado con guantes de cuchillas.'
          },
          {
            rank: 5,
            title: 'La masacre de Texas',
            originalTitle: 'The Texas Chain Saw Massacre',
            year: 1974,
            rating: 7.4,
            director: 'Tobe Hooper',
            duration: '83 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6bLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Cinco amigos viajan por el campo de Texas y caen en las manos de una familia de caníbales liderada por el infame Leatherface.'
          },
          {
            rank: 6,
            title: 'La cabaña del terror',
            originalTitle: 'The Cabin in the Woods',
            year: 2011,
            rating: 7.0,
            director: 'Drew Goddard',
            duration: '95 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9bLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Cinco amigos universitarios van a una cabaña aislada, sin saber que están siendo manipulados por un laboratorio secreto para un sacrificio.'
          },
          {
            rank: 7,
            title: 'Pearl',
            originalTitle: 'Pearl',
            year: 2022,
            rating: 7.0,
            director: 'Ti West',
            duration: '103 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/ulBLIBqhe423R0BQc4qO1N4w1L.jpg',
            synopsis: 'Atrapada en la granja aislada de su familia estricta, una joven hace lo que sea con tal de convertirse en una estrella del cine.'
          },
          {
            rank: 8,
            title: 'X',
            originalTitle: 'X',
            year: 2022,
            rating: 6.6,
            director: 'Ti West',
            duration: '105 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/woTQx9Q4b8aQ6L8bQ9x6j7sU4.jpg',
            synopsis: 'En 1979, un grupo de cineastas viaja a una casa rural en Texas para rodar una película para adultos, desatando la envidia letal de los ancianos dueños.'
          },
          {
            rank: 9,
            title: 'Tú eres el siguiente',
            originalTitle: 'You are Next',
            year: 2011,
            rating: 6.6,
            director: 'Adam Wingard',
            duration: '95 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8bLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una cena familiar en una mansión aislada es atacada por asesinos con máscaras de animales, pero una de las invitadas tiene entrenamiento de supervivencia.'
          },
          {
            rank: 10,
            title: 'Chucky: El muñeco diabólico',
            originalTitle: 'Childs Play',
            year: 1988,
            rating: 6.7,
            director: 'Tom Holland',
            duration: '87 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3bLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un asesino moribundo transfiere su alma a un muñeco infantil mediante un ritual vudú, sembrando el terror en la vida de un niño de 6 años.'
          },
          {
            rank: 11,
            title: 'Viernes 13',
            originalTitle: 'Friday the 13th',
            year: 1980,
            rating: 6.4,
            director: 'Sean S. Cunningham',
            duration: '95 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2bLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un grupo de consejeros de campamento intenta reabrir Crystal Lake, donde un niño se ahogó hace años y los asesinatos nunca cesaron.'
          },
          {
            rank: 12,
            title: 'Navidad negra',
            originalTitle: 'Black Christmas',
            year: 1974,
            rating: 7.1,
            director: 'Bob Clark',
            duration: '98 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1bLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un acosador telefónico acecha y asesina sistemáticamente a las chicas de una hermandad universitaria durante las vacaciones de Navidad.'
          },
          {
            rank: 13,
            title: 'Feliz día de tu muerte',
            originalTitle: 'Happy Death Day',
            year: 2017,
            rating: 6.6,
            director: 'Christopher Landon',
            duration: '96 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5bLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una estudiante universitaria revive una y otra vez el día de su cumpleaños en un bucle temporal, terminando siempre asesinada por un encapuchado.'
          },
          {
            rank: 14,
            title: 'Terrifier 2',
            originalTitle: 'Terrifier 2',
            year: 2022,
            rating: 6.1,
            director: 'Damien Leone',
            duration: '138 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/y5Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Art the Clown resucita gracias a una entidad siniestra para aterrorizar a un pueblo en la noche de Halloween con brutales mutilaciones.'
          },
          {
            rank: 15,
            title: 'Campamento sangriento',
            originalTitle: 'Sleepaway Camp',
            year: 1983,
            rating: 6.2,
            director: 'Robert Hiltzik',
            duration: '84 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7bLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una tímida adolescente es enviada a un campamento de verano donde cualquiera que se meta con ella sufre muertes sangrientas y macabras.'
          }
        ]
      },
      {
        id: 'psicologico',
        name: 'Terror Psicológico & Sobrenatural',
        icon: '🧠',
        description: 'Tensión mental, posesiones, traumas y entidades que desafían la cordura.',
        movies: [
          {
            rank: 1,
            title: 'El resplandor',
            originalTitle: 'The Shining',
            year: 1980,
            rating: 8.4,
            director: 'Stanley Kubrick',
            duration: '146 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/bSqtjDELSnPRCoCv9io8YIsNDjh.jpg',
            synopsis: 'Una familia se traslada a un hotel aislado durante el invierno, donde una presencia espiritual siniestra empuja al padre hacia la violencia.'
          },
          {
            rank: 2,
            title: 'El exorcista',
            originalTitle: 'The Exorcist',
            year: 1973,
            rating: 8.1,
            director: 'William Friedkin',
            duration: '122 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4Ws3VfXo8bL8bQ9x6j7sU4.jpg',
            synopsis: 'Cuando una niña de doce años es poseída por una entidad demoníaca milenaria, su madre desesperada acude a dos sacerdotes católicos.'
          },
          {
            rank: 3,
            title: 'El bebé de Rosemary',
            originalTitle: 'Rosemarys Baby',
            year: 1968,
            rating: 8.0,
            director: 'Roman Polanski',
            duration: '137 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9kLq9s6jWzZtZ3L8rVj9f3oX6j8.jpg',
            synopsis: 'Una joven embarazada sospecha que sus excéntricos vecinos ancianos y su ambicioso esposo pertenecen a una secta satánica.'
          },
          {
            rank: 4,
            title: 'Hereditary (El legado del diablo)',
            originalTitle: 'Hereditary',
            year: 2018,
            rating: 7.3,
            director: 'Ari Aster',
            duration: '127 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/p9fknw5S6jWzZtZ3L8rVj9f3oX6.jpg',
            synopsis: 'Tras la muerte de la matriarca de la familia Graham, su hija y nietos empiezan a desentrañar oscuros secretos de su tenebroso linaje.'
          },
          {
            rank: 5,
            title: 'El sexto sentido',
            originalTitle: 'The Sixth Sense',
            year: 1999,
            rating: 8.2,
            director: 'M. Night Shyamalan',
            duration: '107 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
            synopsis: 'Un psicólogo infantil intenta ayudar a un niño atormentado que afirma ver a personas muertas vagando entre los vivos.'
          },
          {
            rank: 6,
            title: 'Los otros',
            originalTitle: 'The Others',
            year: 2001,
            rating: 7.6,
            director: 'Alejandro Amenábar',
            duration: '104 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1s6jWzZtZ3L8rVj9f3oX6j7sU4.jpg',
            synopsis: 'Una mujer vive en una mansión aislada con sus dos hijos enfermos de fotofobia, convencida de que la casa está embrujada.'
          },
          {
            rank: 7,
            title: 'El conjuro',
            originalTitle: 'The Conjuring',
            year: 2013,
            rating: 7.5,
            director: 'James Wan',
            duration: '112 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg',
            synopsis: 'Los investigadores paranormales Ed y Lorraine Warren ayudan a una familia aterrorizada por una presencia oscura en su granja de Rhode Island.'
          },
          {
            rank: 8,
            title: 'La bruja',
            originalTitle: 'The Witch',
            year: 2015,
            rating: 7.0,
            director: 'Robert Eggers',
            duration: '92 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/oJLi3VfXo8bL8bQ9x6j7sU4.jpg',
            synopsis: 'En la Nueva Inglaterra de 1630, una familia puritana desterrada se desmorona cuando su bebé recién nacido desaparece al borde de un bosque oscuro.'
          },
          {
            rank: 9,
            title: 'Midsommar',
            originalTitle: 'Midsommar',
            year: 2019,
            rating: 7.1,
            director: 'Ari Aster',
            duration: '148 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7LEI8ulBsOACQDrW42zAdEG3iUm.jpg',
            synopsis: 'Una pareja viaja a Suecia para visitar el festival de verano de una comunidad rural, que pronto se convierte en una pesadilla pagana a plena luz del sol.'
          },
          {
            rank: 10,
            title: '¡Huye!',
            originalTitle: 'Get Out',
            year: 2017,
            rating: 7.8,
            director: 'Jordan Peele',
            duration: '104 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg',
            synopsis: 'Un joven afroamericano visita la finca de la familia de su novia blanca, descubriendo una perturbadora conspiración detrás de su hospitalidad.'
          },
          {
            rank: 11,
            title: 'The Babadook',
            originalTitle: 'The Babadook',
            year: 2014,
            rating: 6.8,
            director: 'Jennifer Kent',
            duration: '94 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/s9fknw5S6jWzZtZ3L8rVj9f3oX6.jpg',
            synopsis: 'Una madre viuda lucha contra el miedo de su hijo hacia un monstruo que acecha en la casa, hasta que descubre la presencia siniestra que emana de un libro.'
          },
          {
            rank: 12,
            title: 'Está detrás de ti',
            originalTitle: 'It Follows',
            year: 2014,
            rating: 6.8,
            director: 'David Robert Mitchell',
            duration: '100 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/k9fknw5S6jWzZtZ3L8rVj9f3oX6.jpg',
            synopsis: 'Tras un encuentro sexual, una joven es perseguida por una entidad mortal e implacable que cambia de forma y solo ella puede ver.'
          },
          {
            rank: 13,
            title: 'El aro',
            originalTitle: 'The Ring',
            year: 2002,
            rating: 7.1,
            director: 'Gore Verbinski',
            duration: '115 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4V12U5Xw5S6jWzZtZ3L8rVj9f3.jpg',
            synopsis: 'Una periodista investiga una misteriosa cinta de video maldita cuyos espectadores reciben una llamada profetizando su muerte en siete días.'
          },
          {
            rank: 14,
            title: 'Siniestro',
            originalTitle: 'Sinister',
            year: 2012,
            rating: 6.8,
            director: 'Scott Derrickson',
            duration: '110 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1V12U5Xw5S6jWzZtZ3L8rVj9f3.jpg',
            synopsis: 'Un escritor de crímenes reales encuentra una caja de películas en super 8 en su nueva casa, revelando los asesinatos rituales de una deidad pagana: Bughuul.'
          },
          {
            rank: 15,
            title: 'La noche del demonio',
            originalTitle: 'Insidious',
            year: 2010,
            rating: 6.8,
            director: 'James Wan',
            duration: '103 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2V12U5Xw5S6jWzZtZ3L8rVj9f3.jpg',
            synopsis: 'Una familia busca evitar que los espíritus malignos atrapen a su hijo en estado de coma en un reino oscuro conocido como El Más Allá.'
          }
        ]
      },
      {
        id: 'body-horror',
        name: 'Body Horror & Gore',
        icon: '🧬',
        description: 'Mutaciones biológicas grotescas, degradación anatómica y vísceras viscerales.',
        movies: [
          {
            rank: 1,
            title: 'Alien: El octavo pasajero',
            originalTitle: 'Alien',
            year: 1979,
            rating: 8.5,
            director: 'Ridley Scott',
            duration: '117 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/vfrQk5IPloGg1v9Rzmu2u02jRmY.jpg',
            synopsis: 'La tripulación del remolcador espacial Nostromo investiga una transmisión de socorro y se topa con un parasitoide biomecánico letal.'
          },
          {
            rank: 2,
            title: 'La cosa del otro mundo',
            originalTitle: 'The Thing',
            year: 1982,
            rating: 8.2,
            director: 'John Carpenter',
            duration: '109 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/tzGY49GcfqmNkW6qZ0Zq6oU2C6.jpg',
            synopsis: 'En la Antártida, científicos descubren una forma de vida extraterrestre que absorbe e imita perfectamente a cualquier organismo que infecta.'
          },
          {
            rank: 3,
            title: 'La mosca',
            originalTitle: 'The Fly',
            year: 1986,
            rating: 7.6,
            director: 'David Cronenberg',
            duration: '96 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un científico brillante experimenta con la teletransportación, pero su ADN se fusiona accidentalmente con el de una mosca común.'
          },
          {
            rank: 4,
            title: 'La sustancia',
            originalTitle: 'The Substance',
            year: 2024,
            rating: 7.4,
            director: 'Coralie Fargeat',
            duration: '141 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/lqoMzCcZYEFK729Fc6r4n3bpXKa.jpg',
            synopsis: 'Una celebridad en decadencia recurre a una droga del mercado negro para replicar una versión más joven y perfecta de sí misma.'
          },
          {
            rank: 5,
            title: 'El juego del miedo',
            originalTitle: 'Saw',
            year: 2004,
            rating: 7.6,
            director: 'James Wan',
            duration: '103 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Dos hombres despiertan encadenados en un baño subterráneo, piezas de un macabro juego mortal ideado por el asesino Jigsaw.'
          },
          {
            rank: 6,
            title: 'Hellraiser',
            originalTitle: 'Hellraiser',
            year: 1987,
            rating: 6.9,
            director: 'Clive Barker',
            duration: '94 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una caja rompecabezas abre la puerta al dolor y placer supremo controlado por los Cenobitas, seres de otra dimensión liderados por Pinhead.'
          },
          {
            rank: 7,
            title: 'Videodrome',
            originalTitle: 'Videodrome',
            year: 1983,
            rating: 7.2,
            director: 'David Cronenberg',
            duration: '89 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'El presidente de una cadena de televisión abierta descubre una señal pirata de tortura y pornografía que altera el cerebro y la carne de los espectadores.'
          },
          {
            rank: 8,
            title: 'Re-Animator',
            originalTitle: 'Re-Animator',
            year: 1985,
            rating: 7.2,
            director: 'Stuart Gordon',
            duration: '86 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un excéntrico estudiante de medicina inventa un suero verde fosforescente capaz de revivir tejido muerto, con catastróficos resultados.'
          },
          {
            rank: 9,
            title: 'El despertar del diablo 2',
            originalTitle: 'Evil Dead II',
            year: 1987,
            rating: 7.7,
            director: 'Sam Raimi',
            duration: '84 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Ash Williams lucha contra demonios y su propia mano poseída en una cabaña embrujada usando una motosierra y una escopeta recortada.'
          },
          {
            rank: 10,
            title: 'Titane',
            originalTitle: 'Titane',
            year: 2021,
            rating: 6.5,
            director: 'Julia Ducournau',
            duration: '108 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Tras sufrir un accidente en su infancia y recibir una placa de titanio en el cráneo, una bailarina y asesina experimenta una metamorfosis extrema.'
          },
          {
            rank: 11,
            title: 'Eraserhead (Cabeza de borrador)',
            originalTitle: 'Eraserhead',
            year: 1977,
            rating: 7.3,
            director: 'David Lynch',
            duration: '89 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En un desolado paisaje industrial, un hombre intenta cuidar de su hijo recién nacido, una extraña criatura mutante que no para de llorar.'
          },
          {
            rank: 12,
            title: 'Possessor',
            originalTitle: 'Possessor',
            year: 2020,
            rating: 6.5,
            director: 'Brandon Cronenberg',
            duration: '103 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una agente de élite utiliza implantes cerebrales para habitar los cuerpos de otras personas y cometer asesinatos por encargo para corporaciones.'
          },
          {
            rank: 13,
            title: 'Muertos de miedo',
            originalTitle: 'Braindead Dead Alive',
            year: 1992,
            rating: 7.5,
            director: 'Peter Jackson',
            duration: '104 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9kLq9s6jWzZtZ3L8rVj9f3oX6j6.jpg',
            synopsis: 'La mordedura de un mono-rata de Sumatra transforma a la madre de Lionel en un zombi voraz, desatando el apocalipsis gore en su pueblo.'
          },
          {
            rank: 14,
            title: 'Suspiria',
            originalTitle: 'Suspiria',
            year: 1977,
            rating: 7.3,
            director: 'Dario Argento',
            duration: '98 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6vLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una joven bailarina estadounidense ingresa en una prestigiosa academia de ballet en Alemania, que en secreto esconde un aquelarre de brujas.'
          },
          {
            rank: 15,
            title: 'La nave del terror',
            originalTitle: 'Event Horizon',
            year: 1997,
            rating: 6.6,
            director: 'Paul W.S. Anderson',
            duration: '96 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una nave de rescate es enviada a investigar el regreso de una nave experimental desaparecida que viajó a través de una dimensión de puro caos.'
          }
        ]
      }
    ]
  },
  {
    id: 'scifi',
    name: 'Ciencia Ficción',
    icon: '🚀',
    subgenres: [
      {
        id: 'cyberpunk',
        name: 'Cyberpunk & Distopía',
        icon: '🤖',
        description: 'Alta tecnología, baja calidad de vida, inteligencias artificiales y megacorporaciones.',
        movies: [
          {
            rank: 1,
            title: 'The Matrix (Matriz)',
            originalTitle: 'The Matrix',
            year: 1999,
            rating: 8.7,
            director: 'Lana & Lilly Wachowski',
            duration: '136 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
            synopsis: 'Un hacker descubre que la realidad cotidiana es una simulación creada por máquinas inteligentes que cosechan la energía de la humanidad.'
          },
          {
            rank: 2,
            title: 'Blade Runner 2049',
            originalTitle: 'Blade Runner 2049',
            year: 2017,
            rating: 8.0,
            director: 'Denis Villeneuve',
            duration: '164 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
            synopsis: 'Un blade runner desentierra un secreto enterrado que tiene el potencial de sumergir a la sociedad en el caos y busca a Rick Deckard.'
          },
          {
            rank: 3,
            title: 'Blade Runner',
            originalTitle: 'Blade Runner',
            year: 1982,
            rating: 8.1,
            director: 'Ridley Scott',
            duration: '117 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/63N9uy8nd9j7Eyt4axOG9zgK27y.jpg',
            synopsis: 'En un Los Ángeles futurista y lluvioso, un policía especializado debe dar caza a un grupo de replicantes rebeldes liderados por Roy Batty.'
          },
          {
            rank: 4,
            title: 'Akira',
            originalTitle: 'Akira',
            year: 1988,
            rating: 8.0,
            director: 'Katsuhiro Otomo',
            duration: '124 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/neZ0VM8dQZjh5T2O0Vb1D4Fk1P1.jpg',
            synopsis: 'En la reconstruida Neo-Tokio, un joven pandillero adquiere inmensos poderes psíquicos tras un accidente, amenazando con destruir la metrópolis.'
          },
          {
            rank: 5,
            title: 'Niños del hombre',
            originalTitle: 'Children of Men',
            year: 2006,
            rating: 7.9,
            director: 'Alfonso Cuarón',
            duration: '109 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/k1WkYgqVb1D4Fk1P1l4M6j9z.jpg',
            synopsis: 'En 2027, tras dos décadas de infertilidad humana total, un burócrata debe proteger a la única mujer embarazada del planeta hacia un santuario.'
          },
          {
            rank: 6,
            title: 'Ghost in the Shell (Vigilante del futuro)',
            originalTitle: 'Ghost in the Shell',
            year: 1995,
            rating: 7.9,
            director: 'Mamoru Oshii',
            duration: '83 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5k4WkYgqVb1D4Fk1P1l4M6j9z.jpg',
            synopsis: 'La mayor Motoko Kusanagi, una cíborg de operaciones encubiertas, rastrea a un misterioso hacker conocido como El Titiritero.'
          },
          {
            rank: 7,
            title: 'Brazil',
            originalTitle: 'Brazil',
            year: 1985,
            rating: 7.9,
            director: 'Terry Gilliam',
            duration: '142 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un burócrata soñador atrapado en un mundo totalitario y absurdo intenta corregir un error administrativo que costó la vida a un inocente.'
          },
          {
            rank: 8,
            title: 'RoboCop',
            originalTitle: 'RoboCop',
            year: 1987,
            rating: 7.6,
            director: 'Paul Verhoeven',
            duration: '102 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/hsv9wW8zZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En un Detroit dominado por el crimen, un policía asesinado es resucitado como un implacable cíborg de la ley atormentado por sus recuerdos.'
          },
          {
            rank: 9,
            title: 'Minority Report (Sentencia previa)',
            originalTitle: 'Minority Report',
            year: 2002,
            rating: 7.6,
            director: 'Steven Spielberg',
            duration: '145 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7sLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En un futuro donde una unidad policial previene homicidios antes de que ocurran, el jefe de la división es acusado del futuro asesinato de un extraño.'
          },
          {
            rank: 10,
            title: 'Gattaca',
            originalTitle: 'Gattaca',
            year: 1997,
            rating: 7.8,
            director: 'Andrew Niccol',
            duration: '106 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En una sociedad donde la genética dicta el destino, un hombre nacido de forma natural asume la identidad de un atleta superior para viajar al espacio.'
          },
          {
            rank: 11,
            title: 'Ciudad en tinieblas',
            originalTitle: 'Dark City',
            year: 1998,
            rating: 7.6,
            director: 'Alex Proyas',
            duration: '100 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un hombre despierta sin memoria en una ciudad sumergida en la noche perpetua, perseguido por extraños seres con poderes telequinéticos.'
          },
          {
            rank: 12,
            title: 'Dredd',
            originalTitle: 'Dredd',
            year: 2012,
            rating: 7.1,
            director: 'Pete Travis',
            duration: '95 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En una megaciudad futurista, el Juez Dredd y una novata psíquica quedan atrapados en un rascacielos de 200 pisos controlado por una líder narco.'
          },
          {
            rank: 13,
            title: 'El vengador del futuro',
            originalTitle: 'Total Recall',
            year: 1990,
            rating: 7.5,
            director: 'Paul Verhoeven',
            duration: '113 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un obrero compra unas vacaciones de memoria virtual implantada de Marte, pero el proceso desata recuerdos reales de su vida pasada como agente secreto.'
          },
          {
            rank: 14,
            title: 'Equilibrium',
            originalTitle: 'Equilibrium',
            year: 2002,
            rating: 7.3,
            director: 'Kurt Wimmer',
            duration: '107 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En un régimen fascista donde las emociones humanas están prohibidas mediante una droga diaria, un clérigo de élite deja de medicarse.'
          },
          {
            rank: 15,
            title: '1984',
            originalTitle: 'Nineteen Eighty Four',
            year: 1984,
            rating: 7.1,
            director: 'Michael Radford',
            duration: '113 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Winston Smith vive bajo la constante vigilancia del Gran Hermano y comete el crimen mental definitivo: enamorarse y pensar por sí mismo.'
          }
        ]
      },
      {
        id: 'space-hard-scifi',
        name: 'Espacio & Hard Sci-Fi',
        icon: '🌌',
        description: 'Viajes interplanetarios, leyes de la física, agujeros negros y misterios del cosmos.',
        movies: [
          {
            rank: 1,
            title: 'Interestelar',
            originalTitle: 'Interstellar',
            year: 2014,
            rating: 8.7,
            director: 'Christopher Nolan',
            duration: '169 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
            synopsis: 'Un grupo de exploradores viaja a través de un agujero de gusano en el espacio en un intento desesperado por asegurar la supervivencia de la humanidad.'
          },
          {
            rank: 2,
            title: '2001: Odisea del espacio',
            originalTitle: '2001 A Space Odyssey',
            year: 1968,
            rating: 8.3,
            director: 'Stanley Kubrick',
            duration: '149 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/ve72VxNqjGM69Uky4WTo2bK6Noq.jpg',
            synopsis: 'Tras el descubrimiento de un monolito en la Luna, una nave espacial viaja hacia Júpiter tripulada por dos astronautas y la IA HAL 9000.'
          },
          {
            rank: 3,
            title: 'Misión rescate (El marciano)',
            originalTitle: 'The Martian',
            year: 2015,
            rating: 8.0,
            director: 'Ridley Scott',
            duration: '144 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5BHuvQ6p9kLq9s6jWzZtZ3L8rV.jpg',
            synopsis: 'Un astronauta queda atrapado solo en Marte tras una tormenta y debe recurrir a su ingenio botánico y científico para sobrevivir.'
          },
          {
            rank: 4,
            title: 'La llegada',
            originalTitle: 'Arrival',
            year: 2016,
            rating: 7.9,
            director: 'Denis Villeneuve',
            duration: '116 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmvg.jpg',
            synopsis: 'Una experta lingüista es reclutada por los militares para comunicarse con extraterrestres que han llegado a la Tierra en doce inmensas naves.'
          },
          {
            rank: 5,
            title: 'Contacto',
            originalTitle: 'Contact',
            year: 1997,
            rating: 7.5,
            director: 'Robert Zemeckis',
            duration: '150 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'La astrónoma Ellie Arroway capta la primera señal de radio inteligente procedente de la estrella Vega, que contiene planos para construir una máquina.'
          },
          {
            rank: 6,
            title: 'Moon (En la luna)',
            originalTitle: 'Moon',
            year: 2009,
            rating: 7.8,
            director: 'Duncan Jones',
            duration: '97 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Al final de un turno de tres años en la Luna, un operario solitario sufre un accidente y descubre una inquietante verdad sobre su existencia.'
          },
          {
            rank: 7,
            title: 'Gravedad',
            originalTitle: 'Gravity',
            year: 2013,
            rating: 7.7,
            director: 'Alfonso Cuarón',
            duration: '91 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Dos astronautas quedan a la deriva en el espacio exterior después de que los restos de un satélite destruyan su transbordador.'
          },
          {
            rank: 8,
            title: 'Apolo 13',
            originalTitle: 'Apollo 13',
            year: 1995,
            rating: 7.7,
            director: 'Ron Howard',
            duration: '140 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Tres astronautas deben luchar por volver con vida a la Tierra cuando una explosión interna daña gravemente su nave espacial camino a la Luna.'
          },
          {
            rank: 9,
            title: 'Solaris',
            originalTitle: 'Solaris',
            year: 1972,
            rating: 8.0,
            director: 'Andrei Tarkovsky',
            duration: '167 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un psicólogo viaja a una estación orbital sobre el océano viviente del planeta Solaris, donde los científicos sufren alucinaciones de su pasado.'
          },
          {
            rank: 10,
            title: 'Sunshine: Alerta solar',
            originalTitle: 'Sunshine',
            year: 2007,
            rating: 7.2,
            director: 'Danny Boyle',
            duration: '107 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En 2057, un equipo de astronautas viaja hacia el Sol moribundo con una gigantesca bomba nuclear para reavivar su fuego antes de la extinción.'
          },
          {
            rank: 11,
            title: 'El primer hombre en la luna',
            originalTitle: 'First Man',
            year: 2018,
            rating: 7.3,
            director: 'Damien Chazelle',
            duration: '141 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'La intensa mirada a la vida de Neil Armstrong y la misión espacial histórica que lo llevó a pisar la Luna el 20 de julio de 1969.'
          },
          {
            rank: 12,
            title: 'Ad Astra: Hacia las estrellas',
            originalTitle: 'Ad Astra',
            year: 2019,
            rating: 6.5,
            director: 'James Gray',
            duration: '123 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un astronauta emprende una peligrosa misión a los confines del sistema solar para desentrañar un misterio que amenaza la vida en la Tierra.'
          },
          {
            rank: 13,
            title: 'Europa Report',
            originalTitle: 'Europa Report',
            year: 2013,
            rating: 6.4,
            director: 'Sebastián Cordero',
            duration: '90 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una tripulación internacional de astronautas viaja a la luna Europa de Júpiter para investigar la posible existencia de vida en su océano helado.'
          },
          {
            rank: 14,
            title: 'Aniara',
            originalTitle: 'Aniara',
            year: 2018,
            rating: 6.3,
            director: 'Pella Kågerman, Hugo Lilja',
            duration: '106 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una gigantesca nave de pasajeros que transporta colonos a Marte pierde el rumbo y queda a la deriva hacia el vacío infinito del espacio.'
          },
          {
            rank: 15,
            title: 'Gattaca',
            originalTitle: 'Gattaca',
            year: 1997,
            rating: 7.8,
            director: 'Andrew Niccol',
            duration: '106 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'La odisea de un hombre no alterado genéticamente para conseguir un puesto de navegación en la misión espacial a Titán.'
          }
        ]
      },
      {
        id: 'time-travel',
        name: 'Viajes en el Tiempo & Bucles',
        icon: '⏳',
        description: 'Paradojas temporales, bucles infinitos, consecuencias del pasado y multiversos.',
        movies: [
          {
            rank: 1,
            title: 'Volver al futuro',
            originalTitle: 'Back to the Future',
            year: 1985,
            rating: 8.5,
            director: 'Robert Zemeckis',
            duration: '116 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/fNOH9f1aA7XRTzl1sAOx9iF553Q.jpg',
            synopsis: 'Marty McFly viaja accidentalmente a 1955 en un automóvil DeLorean modificado y debe lograr que sus futuros padres se enamoren.'
          },
          {
            rank: 2,
            title: 'Terminator 2: El juicio final',
            originalTitle: 'Terminator 2 Judgment Day',
            year: 1991,
            rating: 8.6,
            director: 'James Cameron',
            duration: '137 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5M0j0B18abtBI5UVqdaIS29brdy.jpg',
            synopsis: 'Un cíborg reprogramado debe proteger a John Connor de un modelo T-1000 de metal líquido enviado desde el futuro para asesinarlo.'
          },
          {
            rank: 3,
            title: '12 Monos',
            originalTitle: '12 Monkeys',
            year: 1995,
            rating: 8.0,
            director: 'Terry Gilliam',
            duration: '129 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En un futuro devastado por un virus, un convicto viaja al pasado para recopilar datos sobre el origen de la plaga antes de que se propague.'
          },
          {
            rank: 4,
            title: 'Donnie Darko',
            originalTitle: 'Donnie Darko',
            year: 2001,
            rating: 8.0,
            director: 'Richard Kelly',
            duration: '113 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un adolescente problemático sobrevive al impacto de un motor de avión en su cuarto y es visitado por un conejo gigante que profetiza el fin del mundo.'
          },
          {
            rank: 5,
            title: 'Al filo del mañana',
            originalTitle: 'Edge of Tomorrow',
            year: 2014,
            rating: 7.9,
            director: 'Doug Liman',
            duration: '113 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/tPOv9f1aA7XRTzl1sAOx9iF553Q.jpg',
            synopsis: 'Un oficial atrapado en un bucle temporal revive la misma batalla contra invasores alienígenas cada vez que muere, volviéndose más letal.'
          },
          {
            rank: 6,
            title: 'Cuestión de tiempo',
            originalTitle: 'About Time',
            year: 2013,
            rating: 7.8,
            director: 'Richard Curtis',
            duration: '123 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'A los 21 años, Tim descubre que los hombres de su familia pueden viajar en el tiempo para mejorar sus vidas y encontrar el amor.'
          },
          {
            rank: 7,
            title: 'Predestinación',
            originalTitle: 'Predestination',
            year: 2014,
            rating: 7.4,
            director: 'Michael & Peter Spierig',
            duration: '97 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un agente temporal realiza una última y compleja serie de viajes a través de las décadas para detener a un terrorista conocido como Fizzle Bomber.'
          },
          {
            rank: 8,
            title: 'Asesino del futuro (Looper)',
            originalTitle: 'Looper',
            year: 2012,
            rating: 7.4,
            director: 'Rian Johnson',
            duration: '119 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En 2074, los objetivos son enviados al pasado para ser ejecutados por loopers; un sicario se ve obligado a cazar a su propio yo del futuro.'
          },
          {
            rank: 9,
            title: 'Ocho minutos antes de morir',
            originalTitle: 'Source Code',
            year: 2011,
            rating: 7.5,
            director: 'Duncan Jones',
            duration: '93 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un soldado es enviado a través de un programa secreto para revivir los últimos 8 minutos de un tren antes de que explote y hallar al atacante.'
          },
          {
            rank: 10,
            title: 'El efecto mariposa',
            originalTitle: 'The Butterfly Effect',
            year: 2004,
            rating: 7.6,
            director: 'Eric Bress, J. Mackye Gruber',
            duration: '113 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un joven descubre que al leer sus diarios de infancia puede retroceder en el tiempo, pero cada pequeño cambio empeora el presente.'
          },
          {
            rank: 11,
            title: 'Tenet',
            originalTitle: 'Tenet',
            year: 2020,
            rating: 7.3,
            director: 'Christopher Nolan',
            duration: '150 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Armado con una sola palabra, un agente secreto viaja a través del crepúsculo del espionaje internacional usando la inversión temporal para evitar la Tercera Guerra Mundial.'
          },
          {
            rank: 12,
            title: 'Primer',
            originalTitle: 'Primer',
            year: 2004,
            rating: 6.7,
            director: 'Shane Carruth',
            duration: '77 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Dos ingenieros construyen accidentalmente un dispositivo temporal en su garaje, desatando una espiral de paranoia y duplicados.'
          },
          {
            rank: 13,
            title: 'Coherence',
            originalTitle: 'Coherence',
            year: 2013,
            rating: 7.2,
            director: 'James Ward Byrkit',
            duration: '89 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Durante el paso de un cometa, un grupo de amigos que cena en una casa descubre que la realidad se fractura en realidades paralelas en el mismo vecindario.'
          },
          {
            rank: 14,
            title: 'Los cronocrímenes',
            originalTitle: 'Timecrimes',
            year: 2007,
            rating: 7.1,
            director: 'Nacho Vigalondo',
            duration: '92 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un hombre común entra en un tanque científico y viaja una hora atrás en el tiempo, desatando una serie de eventos fatales e inevitables.'
          },
          {
            rank: 15,
            title: 'Todo en todas partes al mismo tiempo',
            originalTitle: 'Everything Everywhere All at Once',
            year: 2022,
            rating: 7.8,
            director: 'Daniel Kwan, Daniel Scheinert',
            duration: '139 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/w3LQsGzFLn5e171V7sU4.jpg',
            synopsis: 'Una inmigrante china en EE.UU. descubre que solo ella puede salvar el multiverso conectando con las habilidades de sus vidas paralelas.'
          }
        ]
      }
    ]
  },
  {
    id: 'accion',
    name: 'Acción & Aventura',
    icon: '💥',
    subgenres: [
      {
        id: 'superheroes',
        name: 'Superhéroes & Cómics',
        icon: '🦸',
        description: 'Vigilantes enmascarados, universos de cómic y batallas épicas por el destino del mundo.',
        movies: [
          {
            rank: 1,
            title: 'Batman: El caballero de la noche',
            originalTitle: 'The Dark Knight',
            year: 2008,
            rating: 9.0,
            director: 'Christopher Nolan',
            duration: '152 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
            synopsis: 'Cuando el Joker desata la anarquía en Gotham City, Batman debe aceptar una de las mayores pruebas psicológicas y morales de su vida.'
          },
          {
            rank: 2,
            title: 'Spider-Man: Un nuevo universo',
            originalTitle: 'Spider-Man Into the Spider-Verse',
            year: 2018,
            rating: 8.4,
            director: 'Bob Persichetti, Peter Ramsey',
            duration: '117 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg',
            synopsis: 'El adolescente Miles Morales se convierte en el nuevo Spider-Man y une fuerzas con cinco justicieros arácnidos de otras dimensiones.'
          },
          {
            rank: 3,
            title: 'Avengers: Infinity War',
            originalTitle: 'Avengers Infinity War',
            year: 2018,
            rating: 8.4,
            director: 'Anthony & Joe Russo',
            duration: '149 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
            synopsis: 'Los Vengadores y sus aliados arriesgan todo para derrotar al poderoso Thanos antes de que reúna las seis Gemas del Infinito.'
          },
          {
            rank: 4,
            title: 'El caballero de la noche asciende',
            originalTitle: 'The Dark Knight Rises',
            year: 2012,
            rating: 8.4,
            director: 'Christopher Nolan',
            duration: '164 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg',
            synopsis: 'Ocho años después del reinado de terror del Joker, el implacable terrorista Bane obliga a Bruce Wayne a salir de su exilio.'
          },
          {
            rank: 5,
            title: 'Avengers: Endgame',
            originalTitle: 'Avengers Endgame',
            year: 2019,
            rating: 8.4,
            director: 'Anthony & Joe Russo',
            duration: '181 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
            synopsis: 'Tras los devastadores eventos de Infinity War, los Vengadores restantes se reúnen una vez más para deshacer las acciones de Thanos.'
          },
          {
            rank: 6,
            title: 'Logan',
            originalTitle: 'Logan',
            year: 2017,
            rating: 8.1,
            director: 'James Mangold',
            duration: '137 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/fnbjcRDXdopnKr2yKn09YEv1eXa.jpg',
            synopsis: 'En un futuro cercano, un envejecido y debilitado Wolverine cuida al Profesor X mientras protege a una joven mutante perseguida por mercenarios.'
          },
          {
            rank: 7,
            title: 'Batman inicia',
            originalTitle: 'Batman Begins',
            year: 2005,
            rating: 8.2,
            director: 'Christopher Nolan',
            duration: '140 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1P3GuhN2v5oH6d5F6zZtZ3L8rV.jpg',
            synopsis: 'Tras entrenar con su mentor en la Liga de las Sombras, Bruce Wayne regresa a Gotham para combatir la corrupción bajo la máscara de Batman.'
          },
          {
            rank: 8,
            title: 'Spider-Man: A través del Spider-Verso',
            originalTitle: 'Spider-Man Across the Spider-Verse',
            year: 2023,
            rating: 8.6,
            director: 'Joaquim Dos Santos, Kemp Powers',
            duration: '140 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704wGF.jpg',
            synopsis: 'Miles Morales es catapultado a través del Multiverso, donde se encuentra con una Sociedad de Spider-People encargada de proteger su existencia.'
          },
          {
            rank: 9,
            title: 'Guardianes de la Galaxia',
            originalTitle: 'Guardians of the Galaxy',
            year: 2014,
            rating: 8.0,
            director: 'James Gunn',
            duration: '121 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/y31QB9kn3XOp1z92UQUb5r9io.jpg',
            synopsis: 'Un grupo de criminales intergalácticos debe unirse para detener a un fanático guerrero con planes de purgar el universo.'
          },
          {
            rank: 10,
            title: 'Iron Man (El hombre de hierro)',
            originalTitle: 'Iron Man',
            year: 2008,
            rating: 7.9,
            director: 'Jon Favreau',
            duration: '126 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg',
            synopsis: 'Tras ser retenido en una cueva afgana, el multimillonario Tony Stark crea una armadura biomecánica avanzada para combatir el mal.'
          },
          {
            rank: 11,
            title: 'Deadpool',
            originalTitle: 'Deadpool',
            year: 2016,
            rating: 8.0,
            director: 'Tim Miller',
            duration: '108 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/inD6HqKiqt3yO9RovR6lXzZtZ3L.jpg',
            synopsis: 'Un mercenario bromista con un factor de curación acelerado busca venganza contra el hombre que desfiguró su rostro con crueles experimentos.'
          },
          {
            rank: 12,
            title: 'The Batman',
            originalTitle: 'The Batman',
            year: 2022,
            rating: 7.8,
            director: 'Matt Reeves',
            duration: '176 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9io.jpg',
            synopsis: 'En su segundo año luchando contra el crimen, Batman persigue a un sádico asesino en serie conocido como El Acertijo en el bajo mundo de Gotham.'
          },
          {
            rank: 13,
            title: 'Capitán América: El soldado del invierno',
            originalTitle: 'Captain America The Winter Soldier',
            year: 2014,
            rating: 7.8,
            director: 'Anthony & Joe Russo',
            duration: '136 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Steve Rogers se une a Black Widow para desentrañar una conspiración en S.H.I.E.L.D. mientras enfrenta a un misterioso asesino soviético.'
          },
          {
            rank: 14,
            title: 'Watchmen (Los vigilantes)',
            originalTitle: 'Watchmen',
            year: 2009,
            rating: 7.6,
            director: 'Zack Snyder',
            duration: '162 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En un 1985 alternativo al borde de la guerra nuclear, el asesinato de un colega retirado inicia una investigación que revela un oscuro complot.'
          },
          {
            rank: 15,
            title: 'X-Men: Días del futuro pasado',
            originalTitle: 'X-Men Days of Future Past',
            year: 2014,
            rating: 7.9,
            director: 'Bryan Singer',
            duration: '132 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Los mutantes envían la conciencia de Wolverine al año 1973 para evitar un acontecimiento que condena a mutantes y humanos a la extinción.'
          }
        ]
      },
      {
        id: 'martial-arts',
        name: 'Artes Marciales & Venganza',
        icon: '🥋',
        description: 'Combate cuerpo a cuerpo, coreografías letales y odiseas de venganza implacable.',
        movies: [
          {
            rank: 1,
            title: 'Oldboy (Cinco días para morir)',
            originalTitle: 'Oldboy',
            year: 2003,
            rating: 8.3,
            director: 'Park Chan-wook',
            duration: '120 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/pWDtjs56jWzZtZ3L8rVj9f3oX6.jpg',
            synopsis: 'Tras ser secuestrado y encarcelado durante 15 años sin explicación, un hombre es liberado y tiene cinco días para descubrir la identidad de su captor.'
          },
          {
            rank: 2,
            title: 'Gladiador',
            originalTitle: 'Gladiator',
            year: 2000,
            rating: 8.5,
            director: 'Ridley Scott',
            duration: '155 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
            synopsis: 'Un general romano traicionado por el corrupto hijo del emperador es reducido a la esclavitud y asciende a través de la arena de combate como gladiador.'
          },
          {
            rank: 3,
            title: 'Kill Bill: Volumen 1',
            originalTitle: 'Kill Bill Vol 1',
            year: 2003,
            rating: 8.2,
            director: 'Quentin Tarantino',
            duration: '111 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/v7TaX8kDbDP9E5N40r9io.jpg',
            synopsis: 'Una antigua asesina despierta de un coma de cuatro años y emprende una sangrienta venganza contra el escuadrón que intentó matarla en su boda.'
          },
          {
            rank: 4,
            title: 'The Raid (La redada)',
            originalTitle: 'The Raid Redemption',
            year: 2011,
            rating: 7.6,
            director: 'Gareth Evans',
            duration: '101 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un escuadrón táctico de Yakarta queda atrapado en un edificio de 30 pisos repleto de los asesinos más brutales liderados por un capo narco.'
          },
          {
            rank: 5,
            title: 'John Wick',
            originalTitle: 'John Wick',
            year: 2014,
            rating: 7.4,
            director: 'Chad Stahelski',
            duration: '101 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/fZPSMV48fjhAPUqFi5qYm9io.jpg',
            synopsis: 'Un legendario asesino a sueldo sale de su retiro para cazar a los mafiosos que irrumpieron en su casa, robaron su auto y mataron a su cachorro.'
          },
          {
            rank: 6,
            title: 'El tigre y el dragón',
            originalTitle: 'Crouching Tiger Hidden Dragon',
            year: 2000,
            rating: 7.9,
            director: 'Ang Lee',
            duration: '120 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En la China del siglo XIX, dos guerreros persiguen a una noble rebelde que ha robado la mítica espada de jade Destino Verde.'
          },
          {
            rank: 7,
            title: 'Héroe',
            originalTitle: 'Hero',
            year: 2002,
            rating: 7.9,
            director: 'Zhang Yimou',
            duration: '99 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un guerrero sin nombre relata ante el rey de Qin cómo derrotó a los tres más letales asesinos del imperio que conspiraban contra el trono.'
          },
          {
            rank: 8,
            title: 'Ip Man',
            originalTitle: 'Ip Man',
            year: 2008,
            rating: 8.0,
            director: 'Wilson Yip',
            duration: '106 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Durante la invasión japonesa de 1937, el gran maestro del Wing Chun defiende la dignidad y supervivencia de su pueblo enfrentando al ejército opresor.'
          },
          {
            rank: 9,
            title: 'The Raid 2 (Berandal)',
            originalTitle: 'The Raid 2',
            year: 2014,
            rating: 7.9,
            director: 'Gareth Evans',
            duration: '150 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'El oficial Rama se infiltra encubierto en una poderosa familia criminal de Yakarta para exponer la red de corrupción en la policía.'
          },
          {
            rank: 10,
            title: 'Kill Bill: Volumen 2',
            originalTitle: 'Kill Bill Vol 2',
            year: 2004,
            rating: 8.0,
            director: 'Quentin Tarantino',
            duration: '137 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'La Novia continúa su lista de venganza contra Budd y Elle Driver antes del enfrentamiento final contra su antiguo mentor y amante, Bill.'
          },
          {
            rank: 11,
            title: 'John Wick 4',
            originalTitle: 'John Wick Chapter 4',
            year: 2023,
            rating: 7.7,
            director: 'Chad Stahelski',
            duration: '169 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/vZloFAK7NKnMGKEHv6j7sU4.jpg',
            synopsis: 'John Wick descubre un camino para derrotar a la Alta Mesa, pero antes debe enfrentarse al Marqués de Gramont y a sus viejos amigos en París.'
          },
          {
            rank: 12,
            title: 'Operación Dragón',
            originalTitle: 'Enter the Dragon',
            year: 1973,
            rating: 7.6,
            director: 'Robert Clouse',
            duration: '102 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un monje Shaolin viaja a la fortaleza de una isla privada para participar en un torneo de artes marciales y desmantelar una red de opio y trata.'
          },
          {
            rank: 13,
            title: 'Nadie (Nobody)',
            originalTitle: 'Nobody',
            year: 2021,
            rating: 7.4,
            director: 'Ilya Naishuller',
            duration: '92 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un apacible padre de familia despierta su letal pasado como auditor del gobierno tras un robo en su casa, enfrentándose a la mafia rusa.'
          },
          {
            rank: 14,
            title: 'El hombre sin pasado',
            originalTitle: 'The Man from Nowhere',
            year: 2010,
            rating: 7.7,
            director: 'Lee Jeong-beom',
            duration: '119 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un solitario prestamista con un pasado letal en operaciones especiales mueve cielo y tierra para rescatar a la niña vecina secuestrada por traficantes.'
          },
          {
            rank: 15,
            title: 'Ong-Bak: El guerrero Muay Thai',
            originalTitle: 'Ong Bak The Thai Warrior',
            year: 2003,
            rating: 7.1,
            director: 'Prachya Pinkaew',
            duration: '105 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Cuando la cabeza de una estatua sagrada es robada de su aldea, un joven maestro de Muay Thai viaja a Bangkok para recuperarla a golpes.'
          }
        ]
      }
    ]
  },
  {
    id: 'thriller',
    name: 'Thriller & Misterio',
    icon: '🕵️',
    subgenres: [
      {
        id: 'mindfuck',
        name: 'Psicológico & Giros de Guión',
        icon: '🌀',
        description: 'Mentes maestras, finales inesperados, secretos oscuros y tensión constante.',
        movies: [
          {
            rank: 1,
            title: 'El club de la pelea',
            originalTitle: 'Fight Club',
            year: 1999,
            rating: 8.8,
            director: 'David Fincher',
            duration: '139 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
            synopsis: 'Un empleado insomne conoce al carismático fabricante de jabón Tyler Durden y juntos fundan un club de lucha clandestino que muta en anarquía.'
          },
          {
            rank: 2,
            title: 'El origen (Inception)',
            originalTitle: 'Inception',
            year: 2010,
            rating: 8.8,
            director: 'Christopher Nolan',
            duration: '148 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
            synopsis: 'Un ladrón que roba secretos corporativos a través del sueño es contratado para implantar una idea en la mente del heredero de un imperio.'
          },
          {
            rank: 3,
            title: 'Seven: Los siete pecados capitales',
            originalTitle: 'Se7en',
            year: 1995,
            rating: 8.6,
            director: 'David Fincher',
            duration: '127 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6yoghtyTpznpBik8EngEmJskVUO.jpg',
            synopsis: 'Dos detectives de homicidios van tras la pista de un metódico y brillante asesino en serie que ejecuta crímenes basados en los 7 pecados capitales.'
          },
          {
            rank: 4,
            title: 'El silencio de los inocentes',
            originalTitle: 'The Silence of the Lambs',
            year: 1991,
            rating: 8.6,
            director: 'Jonathan Demme',
            duration: '118 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/rplLJ2hPcOQmkFhTqUte0MkEaO2.jpg',
            synopsis: 'La joven agente del FBI Clarice Starling entrevista al recluso y caníbal Dr. Hannibal Lecter para descifrar la mente del asesino Buffalo Bill.'
          },
          {
            rank: 5,
            title: 'El gran truco (El prestigio)',
            originalTitle: 'The Prestige',
            year: 2006,
            rating: 8.5,
            director: 'Christopher Nolan',
            duration: '130 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/bdN3gXu4VsqJ8Z4m1V1.jpg',
            synopsis: 'En el Londres victoriano, dos magos rivales inician una obsesiva y peligrosa competencia por crear el truco de teletransportación perfecto.'
          },
          {
            rank: 6,
            title: 'Parásitos',
            originalTitle: 'Parasite',
            year: 2019,
            rating: 8.5,
            director: 'Bong Joon-ho',
            duration: '132 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
            synopsis: 'La codicia y la discriminación de clases amenazan la recién establecida relación simbiótica entre la acaudalada familia Park y el empobrecido clan Kim.'
          },
          {
            rank: 7,
            title: 'Memento',
            originalTitle: 'Memento',
            year: 2000,
            rating: 8.4,
            director: 'Christopher Nolan',
            duration: '113 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/yuNs09hvpHVU19thdrnCA2tEx52.jpg',
            synopsis: 'Un hombre con amnesia anterógrada utiliza notas, fotografías Polaroid y tatuajes en su cuerpo para rastrear al asesino de su esposa.'
          },
          {
            rank: 8,
            title: 'Los sospechosos de siempre',
            originalTitle: 'The Usual Suspects',
            year: 1995,
            rating: 8.5,
            director: 'Bryan Singer',
            duration: '106 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'El único superviviente de una masacre en un muelle relata a la policía la historia de un atraco orquestado por el mítico criminal Keyser Söze.'
          },
          {
            rank: 9,
            title: 'La isla siniestra',
            originalTitle: 'Shutter Island',
            year: 2010,
            rating: 8.2,
            director: 'Martin Scorsese',
            duration: '138 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4BgD0O4jV8eWk5N40r9io.jpg',
            synopsis: 'En 1954, un alguacil federal investiga la misteriosa fuga de una peligrosa paciente de un hospital psiquiátrico de máxima seguridad en una isla.'
          },
          {
            rank: 10,
            title: 'Intriga (Prisioneros)',
            originalTitle: 'Prisoners',
            year: 2013,
            rating: 8.2,
            director: 'Denis Villeneuve',
            duration: '153 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Cuando su hija de seis años y su amiga desaparecen, un padre desesperado toma la justicia por mano propia ante la falta de pistas del detective.'
          },
          {
            rank: 11,
            title: 'Perdida (Gone Girl)',
            originalTitle: 'Gone Girl',
            year: 2014,
            rating: 8.1,
            director: 'David Fincher',
            duration: '149 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En el día de su quinto aniversario de bodas, la esposa de Nick Dunne desaparece misteriosamente y la atención pública lo señala como principal sospechoso.'
          },
          {
            rank: 12,
            title: 'Zodiaco (Zodiac)',
            originalTitle: 'Zodiac',
            year: 2007,
            rating: 7.7,
            director: 'David Fincher',
            duration: '157 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En San Francisco, un dibujante de periódicos se obsesiona con descifrar los mensajes en clave enviados por el esquivo Asesino del Zodiaco.'
          },
          {
            rank: 13,
            title: 'El cisne negro',
            originalTitle: 'Black Swan',
            year: 2010,
            rating: 8.0,
            director: 'Darren Aronofsky',
            duration: '108 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una bailarina de ballet es elegida para el papel principal de El lago de los cisnes, pero su obsesión por la perfección desata su lado más oscuro y delirante.'
          },
          {
            rank: 14,
            title: 'La raíz del miedo (Primal Fear)',
            originalTitle: 'Primal Fear',
            year: 1996,
            rating: 7.7,
            director: 'Gregory Hoblit',
            duration: '129 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un arrogante abogado de Chicago asume la defensa probono de un tímido monaguillo acusado de asesinar salvajemente al arzobispo de la ciudad.'
          },
          {
            rank: 15,
            title: 'El camino de los sueños',
            originalTitle: 'Mulholland Drive',
            year: 2001,
            rating: 7.9,
            director: 'David Lynch',
            duration: '147 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Tras sufrir un accidente automovilístico en Mulholland Drive, una mujer pierde la memoria y se une a una aspirante a actriz en Los Ángeles.'
          }
        ]
      },
      {
        id: 'mafia-crime',
        name: 'Crimen Organizado & Mafia',
        icon: '🥃',
        description: 'Padrinos, familias criminales, golpes millonarios y traición en los bajos fondos.',
        movies: [
          {
            rank: 1,
            title: 'El padrino',
            originalTitle: 'The Godfather',
            year: 1972,
            rating: 9.2,
            director: 'Francis Ford Coppola',
            duration: '175 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
            synopsis: 'El patriarca de una dinastía del crimen organizado transfiere el control de su imperio clandestino a su reacio y calculador hijo menor.'
          },
          {
            rank: 2,
            title: 'El padrino: Parte II',
            originalTitle: 'The Godfather Part II',
            year: 1974,
            rating: 9.0,
            director: 'Francis Ford Coppola',
            duration: '202 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/hek3koDUyMrk7uOBK605WkrU6Kq.jpg',
            synopsis: 'Retrata la juventud y ascenso de Vito Corleone en Nueva York a inicios del siglo XX, en paralelo a la consolidación del poder de Michael.'
          },
          {
            rank: 3,
            title: 'Tiempos violentos (Pulp Fiction)',
            originalTitle: 'Pulp Fiction',
            year: 1994,
            rating: 8.9,
            director: 'Quentin Tarantino',
            duration: '154 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
            synopsis: 'Las vidas de dos sicarios, la esposa de un gángster, un boxeador en fuga y dos asaltantes de poca monta se entrelazan en cuatro historias de crimen.'
          },
          {
            rank: 4,
            title: 'Buenos muchachos (Goodfellas)',
            originalTitle: 'Goodfellas',
            year: 1990,
            rating: 8.7,
            director: 'Martin Scorsese',
            duration: '145 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg',
            synopsis: 'La historia real de Henry Hill y su ascenso y caída a lo largo de tres décadas dentro del sindicato del crimen organizado de Nueva York.'
          },
          {
            rank: 5,
            title: 'Los infiltrados (The Departed)',
            originalTitle: 'The Departed',
            year: 2006,
            rating: 8.5,
            director: 'Martin Scorsese',
            duration: '151 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/nT97ifVT2J1yMQmeq20QblgJwME.jpg',
            synopsis: 'Un policía encubierto y un topo de la mafia irlandesa intentan descubrir la identidad del otro mientras se infiltran en bandos opuestos en Boston.'
          },
          {
            rank: 6,
            title: 'Ciudad de Dios',
            originalTitle: 'City of God',
            year: 2002,
            rating: 8.6,
            director: 'Fernando Meirelles, Kátia Lund',
            duration: '130 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En las violentas favelas de Río de Janeiro, dos jóvenes eligen caminos divergentes: uno sueña con ser fotógrafo mientras el otro se vuelve capo.'
          },
          {
            rank: 7,
            title: 'Cara cortada (Scarface)',
            originalTitle: 'Scarface',
            year: 1983,
            rating: 8.3,
            director: 'Brian De Palma',
            duration: '170 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/iQ5ztdjvteGeboxtmRdXEChJOHh.jpg',
            synopsis: 'En 1980, un refugiado cubano llega a Miami y desata una ola de violencia sin precedentes para convertirse en el rey del narcotráfico.'
          },
          {
            rank: 8,
            title: 'Fuego contra fuego (Heat)',
            originalTitle: 'Heat',
            year: 1995,
            rating: 8.3,
            director: 'Michael Mann',
            duration: '170 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/rrBuGu0PjqkhkQo9io.jpg',
            synopsis: 'Un metódico ladrón de bancos planea un último golpe millonario mientras un obsesivo detective del Departamento de Policía de Los Ángeles le pisa los talones.'
          },
          {
            rank: 9,
            title: 'Perros de la calle (Reservoir Dogs)',
            originalTitle: 'Reservoir Dogs',
            year: 1992,
            rating: 8.3,
            director: 'Quentin Tarantino',
            duration: '99 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/xi8Iu6qyTfyZp4io.jpg',
            synopsis: 'Cuando un atraco a una joyería sale catastróficamente mal, los criminales sobrevivientes sospechan que uno de ellos es un policía encubierto.'
          },
          {
            rank: 10,
            title: 'Casino',
            originalTitle: 'Casino',
            year: 1995,
            rating: 8.2,
            director: 'Martin Scorsese',
            duration: '178 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En Las Vegas de los 70, un experto apostador judío es enviado por la mafia de Chicago para supervisar el casino Tangiers con puño de hierro.'
          },
          {
            rank: 11,
            title: 'Snatch: Cerdos y diamantes',
            originalTitle: 'Snatch',
            year: 2000,
            rating: 8.2,
            director: 'Guy Ritchie',
            duration: '102 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Promotores de boxeo sin licencia, gángsters violentos, apostadores rusos y un gitano boxeador se cruzan en la búsqueda de un diamante robado de 84 quilates.'
          },
          {
            rank: 12,
            title: 'Sin lugar para los débiles',
            originalTitle: 'No Country for Old Men',
            year: 2007,
            rating: 8.2,
            director: 'Joel & Ethan Coen',
            duration: '122 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'La violencia se desata en el desierto de Texas cuando un cazador encuentra dos millones de dólares en la escena de un tiroteo entre narcotraficantes.'
          },
          {
            rank: 13,
            title: 'Taxi Driver',
            originalTitle: 'Taxi Driver',
            year: 1976,
            rating: 8.2,
            director: 'Martin Scorsese',
            duration: '114 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/ekstpH694DaNcTX79ZzgHdpjtHF.jpg',
            synopsis: 'Un solitario e insomne veterano de Vietnam trabaja como taxista nocturno en Nueva York, alimentando un creciente desprecio por la decadencia moral que ve.'
          },
          {
            rank: 14,
            title: 'El irlandés (The Irishman)',
            originalTitle: 'The Irishman',
            year: 2019,
            rating: 7.8,
            director: 'Martin Scorsese',
            duration: '209 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/mbm8k3GFhXS0OiHaAvM2rAVscL9.jpg',
            synopsis: 'Un veterano de la Segunda Guerra Mundial y sicario de la mafia recuerda su participación en la misteriosa desaparición del líder sindical Jimmy Hoffa.'
          },
          {
            rank: 15,
            title: 'Fargo',
            originalTitle: 'Fargo',
            year: 1996,
            rating: 8.1,
            director: 'Joel & Ethan Coen',
            duration: '98 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un mediocre vendedor de autos planea el secuestro de su propia esposa para cobrar el rescate de su suegro rico, desatando una serie de sangrientos errores.'
          }
        ]
      }
    ]
  },
  {
    id: 'animacion',
    name: 'Animación',
    icon: '✨',
    subgenres: [
      {
        id: 'anime',
        name: 'Anime & Cine Japonés',
        icon: '🌸',
        description: 'Las mayores joyas cinematográficas de Studio Ghibli, Makoto Shinkai y el anime japonés.',
        movies: [
          {
            rank: 1,
            title: 'El viaje de Chihiro',
            originalTitle: 'Spirited Away',
            year: 2001,
            rating: 8.6,
            director: 'Hayao Miyazaki',
            duration: '125 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
            synopsis: 'Una niña de diez años ingresa en un mundo gobernado por dioses, brujas y espíritus, donde sus padres son convertidos en cerdos.'
          },
          {
            rank: 2,
            title: 'La tumba de las luciérnagas',
            originalTitle: 'Grave of the Fireflies',
            year: 1988,
            rating: 8.5,
            director: 'Isao Takahata',
            duration: '89 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/k9fknw5S6jWzZtZ3L8rVj9f3oX6.jpg',
            synopsis: 'Un joven y su pequeña hermana luchan por sobrevivir solos en el campo japonés durante los últimos meses de la Segunda Guerra Mundial.'
          },
          {
            rank: 3,
            title: 'Your Name (Tu nombre)',
            originalTitle: 'Your Name',
            year: 2016,
            rating: 8.4,
            director: 'Makoto Shinkai',
            duration: '106 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6ditYeZtp9Kq.jpg',
            synopsis: 'Dos adolescentes intercambian cuerpos periódicamente en sus sueños y forjan un vínculo que desafía el espacio y el tiempo.'
          },
          {
            rank: 4,
            title: 'La princesa Mononoke',
            originalTitle: 'Princess Mononoke',
            year: 1997,
            rating: 8.3,
            director: 'Hayao Miyazaki',
            duration: '134 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/cmyDzZz2g5g6L8rVj9f3oX6j7.jpg',
            synopsis: 'En busca de una cura para una maldición, un joven príncipe se encuentra en medio de una guerra entre los dioses del bosque y una colonia minera.'
          },
          {
            rank: 5,
            title: 'El increíble castillo vagabundo',
            originalTitle: 'Howls Moving Castle',
            year: 2004,
            rating: 8.2,
            director: 'Hayao Miyazaki',
            duration: '119 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/6p9Lq9s6jWzZtZ3L8rVj9f3oX6.jpg',
            synopsis: 'Una joven sombrerera víctima de la maldición de una bruja busca ayuda en el mágico castillo andante del misterioso mago Howl.'
          },
          {
            rank: 6,
            title: 'Una voz silenciosa',
            originalTitle: 'A Silent Voice',
            year: 2016,
            rating: 8.1,
            director: 'Naoko Yamada',
            duration: '130 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/tuFaWiqX0io8L8rVj9f3oX6j7.jpg',
            synopsis: 'Un estudiante de secundaria busca redimirse con una chica sorda a la que acosó en la escuela primaria, aprendiendo el verdadero valor de la empatía.'
          },
          {
            rank: 7,
            title: 'Perfect Blue (Azul perfecto)',
            originalTitle: 'Perfect Blue',
            year: 1997,
            rating: 8.0,
            director: 'Satoshi Kon',
            duration: '81 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una cantante de pop se retira de la música para dedicarse a la actuación, pero es acechada por un acosador obsesivo mientras pierde la cordura.'
          },
          {
            rank: 8,
            title: 'Nausicaä del Valle del Viento',
            originalTitle: 'Nausicaa of the Valley of the Wind',
            year: 1984,
            rating: 8.0,
            director: 'Hayao Miyazaki',
            duration: '117 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'La joven princesa Nausicaä lucha por evitar una guerra entre dos reinos que amenaza con extinguir a la humanidad y al bosque tóxico.'
          },
          {
            rank: 9,
            title: 'Paprika (El reino de los sueños)',
            originalTitle: 'Paprika',
            year: 2006,
            rating: 7.7,
            director: 'Satoshi Kon',
            duration: '90 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Cuando una máquina que permite a los terapeutas entrar en los sueños de los pacientes es robada, una psicóloga debe recuperarla antes de que la realidad colapse.'
          },
          {
            rank: 10,
            title: 'El cuento de la princesa Kaguya',
            originalTitle: 'The Tale of the Princess Kaguya',
            year: 2013,
            rating: 8.0,
            director: 'Isao Takahata',
            duration: '137 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Un humilde cortador de bambú encuentra a una diminuta niña dentro de un tallo luminoso, quien crece rápidamente cautivando a todos con su belleza.'
          },
          {
            rank: 11,
            title: 'El niño y la garza',
            originalTitle: 'The Boy and the Heron',
            year: 2023,
            rating: 7.5,
            director: 'Hayao Miyazaki',
            duration: '124 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/jDQFDaaGxz6L8rVj9f3oX6j7.jpg',
            synopsis: 'Durante la Segunda Guerra Mundial, un niño de 12 años entra en un mundo mágico compartido por los vivos y los muertos guiado por una garza parlante.'
          },
          {
            rank: 12,
            title: 'Tokyo Godfathers',
            originalTitle: 'Tokyo Godfathers',
            year: 2003,
            rating: 7.8,
            director: 'Satoshi Kon',
            duration: '92 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'En la víspera de Navidad, tres vagabundos de Tokio encuentran a un bebé recién nacido en la basura y se embarcan en una misión para hallar a sus padres.'
          },
          {
            rank: 13,
            title: 'Demon Slayer: El tren infinito',
            originalTitle: 'Demon Slayer Mugen Train',
            year: 2020,
            rating: 8.2,
            director: 'Haruo Sotozaki',
            duration: '117 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Tanjiro y el Cuerpo de Cazadores de Demonios abordan el tren infinito para unirse al Pilar de la Llama, Kyojuro Rengoku, y abatir a un demonio de las lunas.'
          },
          {
            rank: 14,
            title: 'The End of Evangelion',
            originalTitle: 'The End of Evangelion',
            year: 1997,
            rating: 8.3,
            director: 'Hideaki Anno, Kazuya Tsurumaki',
            duration: '87 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'SEELE lanza un ataque armado total contra el cuartel general de NERV para iniciar el Proyecto de Instrumentalización Humana definitivo.'
          },
          {
            rank: 15,
            title: 'Mi vecino Totoro',
            originalTitle: 'My Neighbor Totoro',
            year: 1988,
            rating: 8.1,
            director: 'Hayao Miyazaki',
            duration: '86 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Dos niñas se mudan al campo con su padre y descubren que el bosque cercano está habitado por espíritus mágicos y amigables liderados por Totoro.'
          }
        ]
      },
      {
        id: 'masterpieces',
        name: 'Obras Maestras Internacionales',
        icon: '🏆',
        description: 'Los mayores clásicos del cine animado universal premiados y aclamados por la crítica.',
        movies: [
          {
            rank: 1,
            title: 'El rey león',
            originalTitle: 'The Lion King',
            year: 1994,
            rating: 8.5,
            director: 'Roger Allers, Rob Minkoff',
            duration: '88 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8CeG9WNu9in5.jpg',
            synopsis: 'Un cachorro de león debe enfrentar su culpa y asumir su derecho legítimo como rey de las Tierras del Reino tras la traición de su tío Scar.'
          },
          {
            rank: 2,
            title: 'WALL-E',
            originalTitle: 'WALL-E',
            year: 2008,
            rating: 8.4,
            director: 'Andrew Stanton',
            duration: '98 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/hbhFnRzzg6xDOK5TVebAgQIWG2b.jpg',
            synopsis: 'Un solitario robot compactador de basura en una Tierra abandonada se embarca en un viaje espacial tras enamorarse de una sonda avanzada llamada EVA.'
          },
          {
            rank: 3,
            title: 'Coco',
            originalTitle: 'Coco',
            year: 2017,
            rating: 8.4,
            director: 'Lee Unkrich, Adrian Molina',
            duration: '105 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg',
            synopsis: 'Un niño mexicano apasionado por la música es transportado accidentalmente a la mágica Tierra de los Muertos en el Día de Muertos.'
          },
          {
            rank: 4,
            title: 'Up: Una aventura de altura',
            originalTitle: 'Up',
            year: 2009,
            rating: 8.3,
            director: 'Pete Docter, Bob Peterson',
            duration: '96 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/vpbaStTMt8qq9E2pkDxrCGzNu6v.jpg',
            synopsis: 'Un anciano viudo ata miles de globos a su casa para viajar a las Cataratas del Paraíso, llevando accidentalmente a un entusiasta niño explorador.'
          },
          {
            rank: 5,
            title: 'Toy Story',
            originalTitle: 'Toy Story',
            year: 1995,
            rating: 8.3,
            director: 'John Lasseter',
            duration: '81 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/uXDcvRSbgKQv5L04TszU59c7y.jpg',
            synopsis: 'Un muñeco vaquero celoso por la llegada de un astronauta moderno debe cooperar con él cuando ambos se pierden lejos de su dueño.'
          },
          {
            rank: 6,
            title: 'Toy Story 3',
            originalTitle: 'Toy Story 3',
            year: 2010,
            rating: 8.3,
            director: 'Lee Unkrich',
            duration: '103 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/AbbXspwhdrnCA2tEx52.jpg',
            synopsis: 'Cuando Andy se prepara para ir a la universidad, sus juguetes son donados accidentalmente a una guardería controlada por un tiránico oso de peluche.'
          },
          {
            rank: 7,
            title: 'Ratatouille',
            originalTitle: 'Ratatouille',
            year: 2007,
            rating: 8.1,
            director: 'Brad Bird',
            duration: '111 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/t3vaWRPSf4WkYgqVb1D4Fk1P1l4.jpg',
            synopsis: 'Una rata con un refinado sentido del gusto se alía con un inepto lavaplatos para cocinar en un prestigioso restaurante de París.'
          },
          {
            rank: 8,
            title: 'Buscando a Nemo',
            originalTitle: 'Finding Nemo',
            year: 2003,
            rating: 8.2,
            director: 'Andrew Stanton, Lee Unkrich',
            duration: '100 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/eHuGQ10ocZZGRH359RV82A.jpg',
            synopsis: 'Un tímido pez payaso cruza el océano junto a una olvidadiza pez cirujano azul para rescatar a su hijo capturado en la Gran Barrera de Coral.'
          },
          {
            rank: 9,
            title: 'Los Increíbles',
            originalTitle: 'The Incredibles',
            year: 2004,
            rating: 8.0,
            director: 'Brad Bird',
            duration: '115 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una familia de superhéroes encubiertos obligada a vivir una vida suburbana ordinaria debe unirse para salvar al mundo del villano Syndrome.'
          },
          {
            rank: 10,
            title: 'Monsters, Inc.',
            originalTitle: 'Monsters Inc',
            year: 2001,
            rating: 8.1,
            director: 'Pete Docter, David Silverman',
            duration: '92 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3Lq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Dos monstruos de la mayor fábrica de sustos del mundo deben regresar a una adorable niña humana a su habitación antes de ser descubiertos.'
          },
          {
            rank: 11,
            title: 'El gato con botas: El último deseo',
            originalTitle: 'Puss in Boots The Last Wish',
            year: 2022,
            rating: 7.9,
            director: 'Joel Crawford',
            duration: '102 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/kuf6dutpsT0vSV9N40r9io.jpg',
            synopsis: 'Tras quemar ocho de sus nueve vidas, el Gato con Botas emprende un épico viaje al Bosque Sombrío para encontrar la mítica Estrella de los Deseos mientras huye de la Muerte.'
          },
          {
            rank: 12,
            title: 'Klaus',
            originalTitle: 'Klaus',
            year: 2019,
            rating: 8.2,
            director: 'Sergio Pablos',
            duration: '96 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/q125Fi8Z9Z4m1V1.jpg',
            synopsis: 'Un cartero egoísta enviado al gélido y hostil pueblo de Smeerensburg forja una amistad con un misterioso carpintero que fabrica juguetes.'
          },
          {
            rank: 13,
            title: 'El fantástico Sr. Zorro',
            originalTitle: 'Fantastic Mr Fox',
            year: 2009,
            rating: 7.9,
            director: 'Wes Anderson',
            duration: '87 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'El Sr. Zorro rompe su promesa a su esposa y vuelve a sus viejas andanzas robando gallinas a tres despiadados granjeros vecinos.'
          },
          {
            rank: 14,
            title: 'Pinocho de Guillermo del Toro',
            originalTitle: 'Guillermo del Toros Pinocchio',
            year: 2022,
            rating: 7.6,
            director: 'Guillermo del Toro, Mark Gustafson',
            duration: '117 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5kLq9s6jWzZtZ3L8rVj9f3oX6j7.jpg',
            synopsis: 'Una marioneta de madera cobra vida por arte de magia en la Italia fascista de los años 30 para sanar el corazón del afligido carpintero Geppetto.'
          },
          {
            rank: 15,
            title: 'Intensa-Mente (Inside Out)',
            originalTitle: 'Inside Out',
            year: 2015,
            rating: 8.1,
            director: 'Pete Docter, Ronnie Del Carmen',
            duration: '95 min',
            posterUrl: 'https://image.tmdb.org/t/p/w500/lRHE0vdp3r9io.jpg',
            synopsis: 'Tras mudarse a una nueva ciudad, las cinco emociones de Riley —Alegría, Tristeza, Furia, Temor y Desagrado— entran en conflicto sobre cómo guiarla.'
          }
        ]
      }
    ]
  }
];
