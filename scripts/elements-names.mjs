// Noms d'éléments traduits (es / nl / ht), par SYMBOLE — le symbole est la clé la plus sûre pour ne pas décaler une
// traduction d'un cran. Consommé par build-elements-i18n.mjs (qui n'écrit que ceux qui diffèrent du français).
//
// es : noms de la RAE (« cinc » plutôt que « zinc »). nl : noms usuels néerlandais. ht : première version, à faire relire
// par un locuteur natif — le créole haïtien n'a pas de nomenclature chimique normalisée : on suit l'orthographe IPN en
// transcrivant le nom français (idwojèn, oksijèn, kabòn…), et on garde les noms courants là où ils existent (fè, lò, plon…).

export const NAMES = {
  es: {
    H: 'Hidrógeno', He: 'Helio', Li: 'Litio', Be: 'Berilio', B: 'Boro', C: 'Carbono', N: 'Nitrógeno', O: 'Oxígeno', F: 'Flúor', Ne: 'Neón',
    Na: 'Sodio', Mg: 'Magnesio', Al: 'Aluminio', Si: 'Silicio', P: 'Fósforo', S: 'Azufre', Cl: 'Cloro', Ar: 'Argón', K: 'Potasio', Ca: 'Calcio',
    Sc: 'Escandio', Ti: 'Titanio', V: 'Vanadio', Cr: 'Cromo', Mn: 'Manganeso', Fe: 'Hierro', Co: 'Cobalto', Ni: 'Níquel', Cu: 'Cobre', Zn: 'Cinc',
    Ga: 'Galio', Ge: 'Germanio', As: 'Arsénico', Se: 'Selenio', Br: 'Bromo', Kr: 'Criptón', Rb: 'Rubidio', Sr: 'Estroncio', Y: 'Itrio', Zr: 'Circonio',
    Nb: 'Niobio', Mo: 'Molibdeno', Tc: 'Tecnecio', Ru: 'Rutenio', Rh: 'Rodio', Pd: 'Paladio', Ag: 'Plata', Cd: 'Cadmio', In: 'Indio', Sn: 'Estaño',
    Sb: 'Antimonio', Te: 'Telurio', I: 'Yodo', Xe: 'Xenón', Cs: 'Cesio', Ba: 'Bario', La: 'Lantano', Ce: 'Cerio', Pr: 'Praseodimio', Nd: 'Neodimio',
    Pm: 'Prometio', Sm: 'Samario', Eu: 'Europio', Gd: 'Gadolinio', Tb: 'Terbio', Dy: 'Disprosio', Ho: 'Holmio', Er: 'Erbio', Tm: 'Tulio', Yb: 'Iterbio',
    Lu: 'Lutecio', Hf: 'Hafnio', Ta: 'Tantalio', W: 'Wolframio', Re: 'Renio', Os: 'Osmio', Ir: 'Iridio', Pt: 'Platino', Au: 'Oro', Hg: 'Mercurio',
    Tl: 'Talio', Pb: 'Plomo', Bi: 'Bismuto', Po: 'Polonio', At: 'Astato', Rn: 'Radón', Fr: 'Francio', Ra: 'Radio', Ac: 'Actinio', Th: 'Torio',
    Pa: 'Protactinio', U: 'Uranio', Np: 'Neptunio', Pu: 'Plutonio', Am: 'Americio', Cm: 'Curio', Bk: 'Berkelio', Cf: 'Californio', Es: 'Einstenio', Fm: 'Fermio',
    Md: 'Mendelevio', No: 'Nobelio', Lr: 'Lawrencio', Rf: 'Rutherfordio', Db: 'Dubnio', Sg: 'Seaborgio', Bh: 'Bohrio', Hs: 'Hasio', Mt: 'Meitnerio', Ds: 'Darmstatio',
    Rg: 'Roentgenio', Cn: 'Copernicio', Nh: 'Nihonio', Fl: 'Flerovio', Mc: 'Moscovio', Lv: 'Livermorio', Ts: 'Teneso', Og: 'Oganesón',
  },
  nl: {
    H: 'Waterstof', He: 'Helium', Li: 'Lithium', Be: 'Beryllium', B: 'Boor', C: 'Koolstof', N: 'Stikstof', O: 'Zuurstof', F: 'Fluor', Ne: 'Neon',
    Na: 'Natrium', Mg: 'Magnesium', Al: 'Aluminium', Si: 'Silicium', P: 'Fosfor', S: 'Zwavel', Cl: 'Chloor', Ar: 'Argon', K: 'Kalium', Ca: 'Calcium',
    Sc: 'Scandium', Ti: 'Titaan', V: 'Vanadium', Cr: 'Chroom', Mn: 'Mangaan', Fe: 'IJzer', Co: 'Kobalt', Ni: 'Nikkel', Cu: 'Koper', Zn: 'Zink',
    Ga: 'Gallium', Ge: 'Germanium', As: 'Arseen', Se: 'Seleen', Br: 'Broom', Kr: 'Krypton', Rb: 'Rubidium', Sr: 'Strontium', Y: 'Yttrium', Zr: 'Zirkonium',
    Nb: 'Niobium', Mo: 'Molybdeen', Tc: 'Technetium', Ru: 'Ruthenium', Rh: 'Rodium', Pd: 'Palladium', Ag: 'Zilver', Cd: 'Cadmium', In: 'Indium', Sn: 'Tin',
    Sb: 'Antimoon', Te: 'Telluur', I: 'Jood', Xe: 'Xenon', Cs: 'Cesium', Ba: 'Barium', La: 'Lanthaan', Ce: 'Cerium', Pr: 'Praseodymium', Nd: 'Neodymium',
    Pm: 'Promethium', Sm: 'Samarium', Eu: 'Europium', Gd: 'Gadolinium', Tb: 'Terbium', Dy: 'Dysprosium', Ho: 'Holmium', Er: 'Erbium', Tm: 'Thulium', Yb: 'Ytterbium',
    Lu: 'Lutetium', Hf: 'Hafnium', Ta: 'Tantaal', W: 'Wolfraam', Re: 'Renium', Os: 'Osmium', Ir: 'Iridium', Pt: 'Platina', Au: 'Goud', Hg: 'Kwik',
    Tl: 'Thallium', Pb: 'Lood', Bi: 'Bismut', Po: 'Polonium', At: 'Astaat', Rn: 'Radon', Fr: 'Francium', Ra: 'Radium', Ac: 'Actinium', Th: 'Thorium',
    Pa: 'Protactinium', U: 'Uranium', Np: 'Neptunium', Pu: 'Plutonium', Am: 'Americium', Cm: 'Curium', Bk: 'Berkelium', Cf: 'Californium', Es: 'Einsteinium', Fm: 'Fermium',
    Md: 'Mendelevium', No: 'Nobelium', Lr: 'Lawrencium', Rf: 'Rutherfordium', Db: 'Dubnium', Sg: 'Seaborgium', Bh: 'Bohrium', Hs: 'Hassium', Mt: 'Meitnerium', Ds: 'Darmstadtium',
    Rg: 'Roentgenium', Cn: 'Copernicium', Nh: 'Nihonium', Fl: 'Flerovium', Mc: 'Moscovium', Lv: 'Livermorium', Ts: 'Tennessine', Og: 'Oganesson',
  },
  ht: {
    H: 'Idwojèn', He: 'Eliyòm', Li: 'Litiyòm', Be: 'Beriliyòm', B: 'Bò', C: 'Kabòn', N: 'Azòt', O: 'Oksijèn', F: 'Fliyò', Ne: 'Neyon',
    Na: 'Sodyòm', Mg: 'Majnezyòm', Al: 'Aliminyòm', Si: 'Silisyòm', P: 'Fosfò', S: 'Souf', Cl: 'Klò', Ar: 'Agon', K: 'Potasyòm', Ca: 'Kalsyòm',
    Sc: 'Skandyòm', Ti: 'Titàn', V: 'Vanadyòm', Cr: 'Kwòm', Mn: 'Manganèz', Fe: 'Fè', Co: 'Kobalt', Ni: 'Nikèl', Cu: 'Kwiv', Zn: 'Zenk',
    Ga: 'Galyòm', Ge: 'Jèmanyòm', As: 'Awsenik', Se: 'Selenyòm', Br: 'Bwòm', Kr: 'Kriptòn', Rb: 'Rubidyòm', Sr: 'Stwonsyòm', Y: 'Itriyòm', Zr: 'Zikonyòm',
    Nb: 'Nyobyòm', Mo: 'Molibdèn', Tc: 'Teknesyòm', Ru: 'Riteniyòm', Rh: 'Wodyòm', Pd: 'Paladyòm', Ag: 'Ajan', Cd: 'Kadmyòm', In: 'Endyòm', Sn: 'Etèn',
    Sb: 'Antimwàn', Te: 'Telir', I: 'Yòd', Xe: 'Zenon', Cs: 'Sezyòm', Ba: 'Bariyòm', La: 'Lantàn', Ce: 'Seryòm', Pr: 'Prazeyodim', Nd: 'Neyodim',
    Pm: 'Promesyòm', Sm: 'Samaryòm', Eu: 'Ewopyòm', Gd: 'Gadolinyòm', Tb: 'Terbyòm', Dy: 'Disprozyòm', Ho: 'Olmyòm', Er: 'Erbyòm', Tm: 'Tilyòm', Yb: 'Itèbyòm',
    Lu: 'Litesyòm', Hf: 'Afnyòm', Ta: 'Tantal', W: 'Tengstèn', Re: 'Reniyòm', Os: 'Osmyòm', Ir: 'Iridyòm', Pt: 'Platin', Au: 'Lò', Hg: 'Mèki',
    Tl: 'Talyòm', Pb: 'Plon', Bi: 'Bismit', Po: 'Polonyòm', At: 'Astat', Rn: 'Radon', Fr: 'Fransyòm', Ra: 'Radyòm', Ac: 'Aktinyòm', Th: 'Toryòm',
    Pa: 'Protaktinyòm', U: 'Iranyòm', Np: 'Neptinyòm', Pu: 'Plitonyòm', Am: 'Amerisyòm', Cm: 'Kiryòm', Bk: 'Berkelyòm', Cf: 'Kalifòniyòm', Es: 'Einstenyòm', Fm: 'Fèmyòm',
    Md: 'Mendelevyòm', No: 'Nobelyòm', Lr: 'Lorensyòm', Rf: 'Riterfòdyòm', Db: 'Doubniyòm', Sg: 'Sibòjyòm', Bh: 'Bòryòm', Hs: 'Asyòm', Mt: 'Meitnèryòm', Ds: 'Darmstadtyòm',
    Rg: 'Wontjenyòm', Cn: 'Kopènisyòm', Nh: 'Nihonyòm', Fl: 'Fleroviyòm', Mc: 'Moskovyòm', Lv: 'Livèmoryòm', Ts: 'Tenesin', Og: 'Oganeson',
  },
}

/** Article espagnol des noms d'éléments (« el hierro », « la plata ») : il sert à « del hierro », « de la plata ». */
export const ES_FEMININE = new Set(['Ag'])
