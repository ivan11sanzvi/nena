'use strict';
(function () {
  // ---------- Constantes ----------
  const KEY = 'hyroxnena.v1';
  const VERSION = '1.0.0';
  const CLAVE_VIEJA = 'hyrox-state'; // la primera versión de la app
  const CARRERA_DEF = { fecha: '2027-04-18', ciudad: 'Málaga', categoria: 'Open Femenino' };
  // Pesos oficiales HYROX Open Femenino (reglamento 2025/26). Los trineos, con el trineo incluido.
  const OF = { sledPush: 102, sledPull: 78, farmers: 16, sandbag: 10, wallball: 4 };
  const ESTACIONES = [
    { id: 'skierg', n: 'SkiErg', d: '1000 m' },
    { id: 'sledpush', n: 'Sled Push', d: '50 m', p: `${OF.sledPush} kg con trineo` },
    { id: 'sledpull', n: 'Sled Pull', d: '50 m', p: `${OF.sledPull} kg con trineo` },
    { id: 'burpee', n: 'Burpee Broad Jumps', d: '80 m' },
    { id: 'remo', n: 'Remo', d: '1000 m' },
    { id: 'farmers', n: 'Farmers Carry', d: '200 m', p: `2 × ${OF.farmers} kg` },
    { id: 'sandbag', n: 'Sandbag Lunges', d: '100 m', p: `${OF.sandbag} kg` },
    { id: 'wallballs', n: 'Wall Balls', d: '100 reps', p: `${OF.wallball} kg a 2,70 m` }
  ];
  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const DIAS_L = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const FASES = {
    adapt: { n: 'Adaptación', c: '#c4b5fd', desc: 'Aprender bien la técnica y acostumbrar el cuerpo a entrenar cinco días. Cargas suaves.' },
    base: { n: 'Base', c: '#a78bfa', desc: 'Construir la base aeróbica corriendo suave y conocer todas las estaciones.' },
    build: { n: 'Construcción', c: '#8b5cf6', desc: 'Más volumen y más intensidad. Las estaciones ya con peso oficial o cerca.' },
    peak: { n: 'Pico', c: '#7c3aed', desc: 'Simulaciones de carrera, ritmo objetivo y trabajo intenso.' },
    taper: { n: 'Puesta a punto', c: '#e879f9', desc: 'Menos carga para llegar fresca y con ganas a la carrera.' }
  };
  const TIPOS = {
    ep: { n: 'Entreno con tu EP', i: '🧑‍🏫' },
    fuerza: { n: 'Fuerza', i: '💪' },
    carrera: { n: 'Carrera', i: '🏃‍♀️' },
    mixta: { n: 'Carrera + estaciones', i: '🔁' },
    simulacion: { n: 'Simulación', i: '🏁' },
    padel: { n: 'Pádel', i: '🎾' },
    otro: { n: 'Otro', i: '✨' },
    descanso: { n: 'Descanso', i: '🌿' }
  };
  const TITULOS = { hoy: 'Hoy', plan: 'Plan', registro: 'Registro', progreso: 'Progreso', carrera: 'Carrera' };

  // ---------- Utilidades ----------
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const DIA_MS = 864e5;
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const deISO = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
  const hoyISO = () => iso(new Date());
  const masDias = (s, n) => { const d = deISO(s); d.setDate(d.getDate() + n); return iso(d); };
  const diaSemana = s => (deISO(s).getDay() + 6) % 7; // 0 = lunes
  const lunesDe = s => masDias(s, -diaSemana(s));
  const entreDias = (a, b) => Math.round((deISO(b) - deISO(a)) / DIA_MS);
  const fmtN = (v, d = 1) => (v == null || isNaN(v)) ? '—' : new Intl.NumberFormat('es-ES', { maximumFractionDigits: d }).format(v);
  const fmtFecha = s => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${+d} ${MESES[+m - 1]} ${y}`; };
  const fmtCorta = s => { if (!s) return ''; const [, m, d] = s.split('-'); return `${+d} ${MESES[+m - 1]}`; };
  const fmtLarga = s => `${DIAS_L[diaSemana(s)].toLowerCase()} ${fmtFecha(s)}`;
  // Segundos -> «4:35» o «1:12:05»
  function fmtT(seg) {
    if (seg == null || isNaN(seg)) return '—';
    seg = Math.round(seg);
    const h = Math.floor(seg / 3600), m = Math.floor(seg % 3600 / 60), s = seg % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  }
  // Acepta «4:35», «4.35», «4,35», «435» (4 min 35 s), «1:05:30» y «28» (28 minutos)
  function parseT(v) {
    let s = String(v == null ? '' : v).trim().replace(/[´'’]/g, ':').replace(/["”]/g, '');
    if (!s) return null;
    const p = s.split(/[:.,\s]+/).filter(Boolean).map(Number);
    if (p.some(isNaN)) return NaN;
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    if (p.length === 2) return p[1] >= 60 ? NaN : p[0] * 60 + p[1];
    const n = p[0];
    if (s.length >= 3) return Math.floor(n / 100) * 60 + n % 100;
    return n * 60;
  }
  const parseNum = v => { if (v == null || String(v).trim() === '') return null; const n = Number(String(v).trim().replace(',', '.')); return isFinite(n) ? n : NaN; };
  const ritmo = (km, seg) => km > 0 && seg > 0 ? seg / km : null;
  const sum = (a, f) => a.reduce((t, x) => t + (+f(x) || 0), 0);

  // ---------- Datos ----------
  function nuevoDB() {
    return { v: 1, carrera: Object.assign({}, CARRERA_DEF), inicio: lunesDe(hoyISO()), registros: [], objetivo: {}, ultimaCopia: null, ultimoCambio: null };
  }
  function normalizar(d) {
    const o = Object.assign(nuevoDB(), d && typeof d === 'object' ? d : {});
    o.carrera = Object.assign({}, CARRERA_DEF, o.carrera || {});
    if (!Array.isArray(o.registros)) o.registros = [];
    if (!o.objetivo || typeof o.objetivo !== 'object') o.objetivo = {};
    if (!/^\d{4}-\d\d-\d\d$/.test(o.inicio || '')) o.inicio = lunesDe(hoyISO());
    o.inicio = lunesDe(o.inicio);
    return o;
  }
  function cargar() {
    try { const raw = localStorage.getItem(KEY); if (raw) return normalizar(JSON.parse(raw)); } catch (e) { /* sin almacenamiento */ }
    return null;
  }
  let db = cargar();
  const primeraVez = !db;
  if (!db) db = nuevoDB();
  function guardar(cambio = true) {
    if (cambio) db.ultimoCambio = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { toast('No se ha podido guardar en el móvil. Haz una copia de seguridad.'); }
  }
  const registro = id => db.registros.find(r => r.id === id);
  const ordenados = () => db.registros.slice().sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.id > a.id ? 1 : -1));
  const regsDelDia = s => db.registros.filter(r => r.fecha === s);

  // ---------- El plan: se calcula hacia atrás desde la fecha de la carrera ----------
  const lunesCarrera = () => lunesDe(db.carrera.fecha);
  function totalSemanas() {
    const n = Math.round(entreDias(db.inicio, lunesCarrera()) / 7) + 1;
    return Math.max(6, Math.min(40, n || 16));
  }
  const lunesSemana = n => masDias(db.inicio, (n - 1) * 7);
  const semanaDe = s => Math.floor(entreDias(db.inicio, lunesDe(s)) / 7) + 1;
  const semanaActual = () => Math.max(1, Math.min(totalSemanas(), semanaDe(hoyISO())));
  function fases() {
    const t = totalSemanas();
    const taper = 2, pico = t >= 18 ? 5 : t >= 12 ? 4 : 3, adapt = t >= 20 ? 2 : t >= 14 ? 1 : 0;
    const resto = Math.max(0, t - taper - pico - adapt);
    const base = Math.ceil(resto / 2), build = resto - base;
    return [['adapt', adapt], ['base', base], ['build', build], ['peak', pico], ['taper', taper]]
      .filter(f => f[1] > 0).map(([k, w]) => Object.assign({ k, w }, FASES[k]));
  }
  function faseDe(n) {
    let acc = 0;
    for (const f of fases()) { if (n <= acc + f.w) return Object.assign({ en: n - acc }, f); acc += f.w; }
    const fs = fases(); const f = fs[fs.length - 1]; return Object.assign({ en: f.w }, f);
  }
  // Semana de descarga cada 4 semanas en Base y Construcción
  const esDescarga = n => { const k = faseDe(n).k; return (k === 'base' || k === 'build') && n % 4 === 0; };

  const rpeMenos = s => String(s).replace(/\d+/g, x => Math.max(5, +x - 1));
  const ex = (id, n, s, r, rpe, extra) => Object.assign({ id, n, s, r, rpe }, extra || {});

  function bloqueFuerza(k, desc) {
    const B = {
      adapt: [
        ex('goblet', 'Sentadilla goblet', 3, '10', '5-6', { nota: 'Aprende la técnica: espalda recta y rodillas hacia fuera' }),
        ex('rdl', 'Peso muerto rumano', 3, '10', '6'),
        ex('flexiones', 'Flexiones', 3, 'máx − 2', '7', { sinPeso: true, nota: 'Para 2 reps antes de no poder más. Vale con rodillas apoyadas' }),
        ex('remo-mancuerna', 'Remo con mancuerna', 3, '12', '6', { u: 'kg por mano' })
      ],
      base: [
        ex('sentadilla', 'Sentadilla', 3, '8', '6-7', { nota: 'Te tienen que sobrar 2-3 reps' }),
        ex('peso-muerto', 'Peso muerto', 3, '8', '6-7'),
        ex('press-banca', 'Press banca', 3, '10', '7'),
        ex('remo-barra', 'Remo con barra', 3, '10', '7')
      ],
      build: [
        ex('sentadilla', 'Sentadilla', 4, '6', '7-8', { nota: 'La última serie a RPE 8-9 (te sobran 1-2 reps)' }),
        ex('peso-muerto', 'Peso muerto', 4, '5', '8'),
        ex('zancadas', 'Zancadas con mancuernas', 3, '20', '7-8', { u: 'kg por mano' }),
        ex('press-hombro', 'Press de hombro', 3, '8', '7')
      ],
      peak: [
        ex('sentadilla', 'Sentadilla', 5, '5', '8-9', { nota: 'Las 2 últimas series muy cerca del fallo' }),
        ex('peso-muerto', 'Peso muerto', 4, '4', '9', { nota: 'Última serie al fallo técnico: para cuando la técnica empiece a fallar' }),
        ex('kb-swing', 'KB swings', 4, '20', '8'),
        ex('box-jump', 'Saltos al cajón', 3, '10', '—', { sinPeso: true, nota: 'Máxima explosividad, descansa lo que necesites' })
      ],
      taper: [
        ex('sentadilla', 'Sentadilla', 3, '5', '6', { nota: 'Mantener, no cansarse' }),
        ex('peso-muerto', 'Peso muerto', 3, '3', '6'),
        ex('movilidad', 'Movilidad y activación', 1, '15 min', '—', { sinPeso: true })
      ]
    };
    const b = (B[k] || B.base).map(e => Object.assign({}, e));
    if (desc) b.forEach(e => { e.s = Math.max(2, e.s - 1); if (e.rpe !== '—') e.rpe = rpeMenos(e.rpe); e.nota = 'Descarga: el mismo peso que la semana pasada, una serie menos'; });
    return b;
  }
  // Estaciones pesadas del martes (después de la fuerza)
  function estMartes(k, desc) {
    const E = {
      adapt: [ex('st-skierg', 'SkiErg', 3, '300 m', '6', { sinPeso: true }), ex('st-wallballs', 'Wall Balls', 3, '12', '6', { w: OF.wallball, nota: 'Aprende a lanzar a la diana de 2,70 m' })],
      base: [ex('st-skierg', 'SkiErg', 3, '500 m', '7', { sinPeso: true }), ex('st-wallballs', 'Wall Balls', 3, '15', '7', { w: OF.wallball })],
      build: [
        ex('st-sledpush', 'Sled Push', 3, '25 m', '8', { w: 80, nota: `Sube hacia los ${OF.sledPush} kg de carrera cuando lo muevas sin pararte` }),
        ex('st-sledpull', 'Sled Pull', 3, '25 m', '8', { w: 60, nota: `Sube hacia los ${OF.sledPull} kg de carrera` }),
        ex('st-wallballs', 'Wall Balls', 3, '20', '7-8', { w: OF.wallball })
      ],
      peak: [
        ex('st-sledpush', 'Sled Push', 4, '25 m', '8', { w: OF.sledPush, nota: 'Peso de carrera, trineo incluido' }),
        ex('st-sledpull', 'Sled Pull', 4, '25 m', '8', { w: OF.sledPull, nota: 'Peso de carrera, trineo incluido' }),
        ex('st-wallballs', 'Wall Balls', 3, '25', '8', { w: OF.wallball, nota: 'En series de 10 + 10 + 5 si hace falta, como en carrera' })
      ],
      taper: [ex('st-sledpush', 'Sled Push', 2, '25 m', '6', { w: OF.sledPush, nota: 'Ritmo cómodo' }), ex('st-wallballs', 'Wall Balls', 2, '15', '6', { w: OF.wallball })]
    };
    const b = (E[k] || E.base).map(e => Object.assign({}, e));
    if (desc) b.forEach(e => { e.s = Math.max(1, e.s - 1); if (e.rpe !== '—') e.rpe = rpeMenos(e.rpe); });
    return b;
  }
  // Estaciones de la sesión larga del viernes
  function estViernes(k, desc) {
    const E = {
      adapt: [
        ex('st-skierg', 'SkiErg', 2, '500 m', '6', { sinPeso: true }),
        ex('st-remo', 'Remo', 2, '500 m', '6', { sinPeso: true }),
        ex('st-farmers', 'Farmers Carry', 2, '50 m', '6', { w: 12, u: 'kg por mano', nota: `Empieza con 12 kg por mano; en carrera son ${OF.farmers}` }),
        ex('st-burpee', 'Burpee Broad Jumps', 2, '10 m', '6', { sinPeso: true })
      ],
      base: [
        ex('st-skierg', 'SkiErg', 2, '500 m', '7', { sinPeso: true }),
        ex('st-remo', 'Remo', 2, '500 m', '7', { sinPeso: true }),
        ex('st-farmers', 'Farmers Carry', 3, '50 m', '7', { w: OF.farmers, u: 'kg por mano', nota: `Peso oficial: 2 × ${OF.farmers} kg` }),
        ex('st-sandbag', 'Sandbag Lunges', 2, '25 m', '7', { w: OF.sandbag, nota: `Peso oficial: ${OF.sandbag} kg` })
      ],
      build: [
        ex('st-skierg', 'SkiErg', 2, '1000 m', '7-8', { sinPeso: true }),
        ex('st-remo', 'Remo', 2, '1000 m', '7-8', { sinPeso: true }),
        ex('st-burpee', 'Burpee Broad Jumps', 2, '40 m', '8', { sinPeso: true }),
        ex('st-farmers', 'Farmers Carry', 2, '100 m', '8', { w: OF.farmers, u: 'kg por mano' }),
        ex('st-sandbag', 'Sandbag Lunges', 2, '50 m', '7-8', { w: OF.sandbag })
      ],
      taper: [
        ex('st-skierg', 'SkiErg', 1, '500 m', '6', { sinPeso: true }),
        ex('st-remo', 'Remo', 1, '500 m', '6', { sinPeso: true }),
        ex('st-farmers', 'Farmers Carry', 1, '100 m', '6', { w: OF.farmers, u: 'kg por mano' })
      ]
    };
    const b = (E[k] || E.base).map(e => Object.assign({}, e));
    if (desc) b.forEach(e => { e.s = Math.max(1, e.s - 1); if (e.rpe !== '—') e.rpe = rpeMenos(e.rpe); });
    return b;
  }

  // Las 7 sesiones de la semana n (0 = lunes)
  function sesionesSemana(n) {
    const f = faseDe(n), k = f.k, desc = esDescarga(n), total = totalSemanas();
    const paso = Math.floor((f.en - 1) / 2);
    const vol = desc ? 0.65 : 1;
    const km = x => Math.max(3, Math.round(x * vol));
    const z2 = km({ adapt: 4, base: 5 + paso, build: 7 + paso, peak: 8, taper: 5 }[k]);
    const largo = km({ adapt: 3, base: Math.min(8 + paso, 11), build: Math.min(11 + paso, 14), peak: 12, taper: 6 }[k]);
    const notaDesc = desc ? 'Semana de descarga: menos volumen para asimilar el trabajo. No la saltes.' : '';
    const par = f.en % 2 === 0;

    const lun = { tipo: 'ep', titulo: 'Entreno con tu entrenador', resumen: 'Tu sesión HYROX de los lunes',
      detalle: ['Lo que te mande tu entrenador. Al terminar, apunta cómo fue y el esfuerzo (RPE).', desc ? 'Es semana de descarga: díselo por si quiere bajar un poco la carga.' : ''] };
    const mar = { tipo: 'fuerza', titulo: 'Fuerza + estaciones', resumen: '60-70 min en el gimnasio',
      detalle: ['Calentamiento 8 min: movilidad de cadera y hombros y 2 series suaves del primer ejercicio', 'Descansa 2 min entre series de fuerza y 90 s entre estaciones', 'Termina con core: plancha 3 × 40 s y dead bug 3 × 10', notaDesc],
      bloques: [...bloqueFuerza(k, desc), ...estMartes(k, desc)] };
    const mie = { tipo: 'carrera', titulo: `Rodaje suave ${z2} km`, km: z2, rpe: '4-5', resumen: 'Zona 2: tienes que poder hablar mientras corres',
      detalle: ['Ritmo con el que podrías mantener una conversación. Si no, anda un poco y sigue.', 'Termina con 5 min de estiramientos', notaDesc] };
    let jue;
    if (k === 'adapt') jue = { tipo: 'carrera', titulo: 'Fartlek suave', km: km(4), rpe: '7', resumen: '6 × (1 min alegre + 2 min suave)', detalle: ['10 min suaves para calentar', '6 veces: 1 min a ritmo alegre (RPE 7) y 2 min suaves', '5 min suaves para terminar'] };
    else if (k === 'base') jue = par
      ? { tipo: 'carrera', titulo: `Progresivo ${km(5)} km`, km: km(5), rpe: '5-7', resumen: 'De menos a más', detalle: ['Primer tercio suave (RPE 5), segundo a ritmo medio (RPE 6), último alegre (RPE 7)', notaDesc] }
      : { tipo: 'carrera', titulo: 'Fartlek', km: km(5), rpe: '7', resumen: '8 × (1 min alegre + 1 min 30 s suave)', detalle: ['10 min suaves para calentar', '8 veces: 1 min a RPE 7 y 1 min 30 s suave', '5 min suaves para terminar', notaDesc] };
    else if (k === 'build') jue = par
      ? { tipo: 'carrera', titulo: 'Series de 1 km', km: km(7), rpe: '7-8', resumen: '5 × 1 km con 90 s andando', detalle: ['1,5 km suaves para calentar', '5 × 1 km a RPE 7-8 (fuerte pero aguantable), 90 s andando entre medias', '1 km suave para terminar', notaDesc] }
      : { tipo: 'carrera', titulo: 'Tempo', km: km(7), rpe: '7', resumen: '2 × 2 km a ritmo sostenido', detalle: ['1,5 km suaves para calentar', '2 × 2 km a RPE 7, con 3 min suaves entre medias', '1,5 km suaves para terminar', notaDesc] };
    else if (k === 'peak') jue = par
      ? { tipo: 'mixta', titulo: 'Carrera comprometida', km: 4, rpe: '8', resumen: '4 × (1 km + 20 wall balls)', detalle: ['Como en carrera: correr con las piernas cansadas', '4 veces: 1 km a tu ritmo de carrera (RPE 8) y nada más llegar 20 wall balls', 'Sin descanso entre bloques'],
        bloques: [ex('st-wallballs', 'Wall Balls', 4, '20', '8', { w: OF.wallball })] }
      : { tipo: 'carrera', titulo: 'Series de 800 m', km: 7, rpe: '8', resumen: '6 × 800 m a ritmo de carrera', detalle: ['1,5 km suaves para calentar', '6 × 800 m a tu ritmo de carrera (RPE 8), 2 min suaves entre medias', '1 km suave para terminar'] };
    else jue = { tipo: 'carrera', titulo: 'Cambios de ritmo cortos', km: 4, rpe: '6-7', resumen: '4 × 400 m alegres', detalle: ['10 min suaves', '4 × 400 m alegres (RPE 7) con 2 min suaves', 'Piernas sueltas, nada de cansarse'] };

    let vie;
    if (k === 'peak') {
      const completa = f.en % 2 === 1;
      const mitad = (Math.floor(f.en / 2) % 2 === 1) ? ESTACIONES.slice(0, 4) : ESTACIONES.slice(4);
      vie = completa
        ? { tipo: 'simulacion', titulo: 'Simulación completa 🏁', rpe: '8', resumen: '8 × (1 km + estación) con el peso de carrera',
          detalle: ['Calentamiento: 2 km suaves y 5 min de movilidad', 'El recorrido entero, en orden, con los pesos oficiales', 'Esfuerzo RPE 8: fuerte pero sin vaciarte del todo', 'Apunta el tiempo de cada kilómetro y de cada estación'], estaciones: ESTACIONES.map(e => e.id) }
        : { tipo: 'simulacion', titulo: 'Media simulación', rpe: '8', resumen: `4 × (1 km + estación): ${mitad.map(e => e.n).join(', ')}`,
          detalle: ['Calentamiento: 2 km suaves', `4 bloques de 1 km + ${mitad.map(e => e.n).join(' / ')}, con peso de carrera`, 'Apunta los tiempos'], estaciones: mitad.map(e => e.id) };
    } else if (k === 'taper') {
      vie = { tipo: 'mixta', titulo: 'Activación con estaciones', km: 5, rpe: '6', resumen: '5 km suaves + estaciones ligeras', detalle: ['Recordar sensaciones sin cansarte'], bloques: estViernes('taper', false) };
    } else {
      vie = { tipo: 'mixta', titulo: k === 'adapt' ? 'Circuito técnico + carrera suave' : `Tirada larga ${largo} km + estaciones`, km: largo, rpe: k === 'build' ? '7-8' : '6-7',
        resumen: k === 'adapt' ? 'Conocer las estaciones sin prisa' : 'Primero corres, luego las estaciones',
        detalle: [k === 'adapt' ? `${largo} km muy suaves` : `${largo} km a ritmo suave (Zona 2)`, 'Después las estaciones, con 90 s de descanso', notaDesc], bloques: estViernes(k, desc) };
    }
    const sab = { tipo: 'descanso', titulo: 'Descanso activo', resumen: 'Pádel o paseo si te apetece', detalle: ['Si juegas al pádel, apúntalo en el registro', 'Estira caderas, gemelos y espalda'] };
    const dom = { tipo: 'descanso', titulo: 'Descanso', resumen: 'Recupera: duerme bien y come bien', detalle: [] };
    let semana = [lun, mar, mie, jue, vie, sab, dom];

    if (n === total) semana = semanaCarrera();
    return semana.map((s, i) => Object.assign(s, { semana: n, dia: i, fecha: masDias(lunesSemana(n), i), detalle: (s.detalle || []).filter(Boolean) }));
  }
  function semanaCarrera() {
    const s = [
      { tipo: 'ep', titulo: 'Entreno con tu entrenador', resumen: 'Semana de carrera', detalle: ['Avisa a tu entrenador de que es semana de carrera: sesión corta y sin cargas pesadas'] },
      { tipo: 'fuerza', titulo: 'Fuerza de mantenimiento', resumen: '30-40 min muy ligeros', detalle: ['Solo para recordar los movimientos'],
        bloques: [ex('sentadilla', 'Sentadilla', 2, '5', '6'), ex('peso-muerto', 'Peso muerto', 2, '3', '6'), ex('st-wallballs', 'Wall Balls', 2, '15', '6', { w: OF.wallball })] },
      { tipo: 'carrera', titulo: 'Rodaje suave 4 km', km: 4, rpe: '4-5', resumen: 'Con 4 aceleraciones de 100 m', detalle: ['4 km suaves', 'Al final 4 × 100 m alegres, andando la vuelta'] },
      { tipo: 'descanso', titulo: 'Descanso', resumen: 'Piernas en alto', detalle: ['Bebe agua durante todo el día'] },
      { tipo: 'carrera', titulo: 'Activación', km: 3, rpe: '5', resumen: '20 min suaves + 3 × 1 min a ritmo de carrera', detalle: ['Nada más. Hoy no se gana nada, solo se puede perder'] },
      { tipo: 'descanso', titulo: 'Descanso', resumen: 'Prepara la bolsa', detalle: ['Comida y cena con hidratos (pasta, arroz, pan)', 'Prepara zapatillas, ropa, geles y agua', 'A dormir pronto'] },
      { tipo: 'descanso', titulo: 'Descanso', resumen: '', detalle: [] }
    ];
    const dc = diaSemana(db.carrera.fecha);
    s[dc] = { tipo: 'simulacion', carrera: true, titulo: `¡HYROX ${db.carrera.ciudad}! 🏁`, resumen: `${db.carrera.categoria} · 8 km + 8 estaciones`,
      detalle: ['Desayuna 3 horas antes lo de siempre, nada nuevo', 'Calienta 10-15 min: trote suave y movilidad', 'Sal más despacio de lo que te pida el cuerpo en el primer kilómetro', 'Disfrútalo, te lo has ganado ♥'], estaciones: ESTACIONES.map(e => e.id) };
    for (let i = dc + 1; i < 7; i++) s[i] = { tipo: 'descanso', titulo: 'Recuperación', resumen: 'Paseo suave y a celebrarlo', detalle: [] };
    return s;
  }
  const sesionDe = (n, i) => (n >= 1 && n <= totalSemanas()) ? sesionesSemana(n)[i] : null;
  const sesionDeFecha = s => sesionDe(semanaDe(s), diaSemana(s));
  const esEntreno = s => s && s.tipo !== 'descanso';

  // Texto de un ejercicio: «3 × 8 reps · RPE 7 · 60 kg»
  const unidad = e => e.u || 'kg';
  const repsTxt = e => /^\d+$/.test(e.r) ? `${e.r} reps` : e.r;
  const objetivoTxt = e => `${e.s > 1 ? e.s + ' × ' : ''}${repsTxt(e)}`;
  function rpeClase(rpe) {
    const n = Math.max(0, ...(String(rpe).match(/\d+/g) || [0]).map(Number));
    return !n ? '' : n <= 6 ? 'good' : n === 7 ? 'warn' : n === 8 ? 'hot' : 'crit';
  }
  const rpePill = rpe => rpe && rpe !== '—' ? `<span class="pill ${rpeClase(rpe)}">RPE ${esc(rpe)}</span>` : '';

  // ---------- Registros: ayudas ----------
  function ultimoPeso(exId, salvoId) {
    for (const r of ordenados()) {
      if (r.id === salvoId) continue;
      const e = (r.ejercicios || []).find(x => x.id === exId);
      const ps = e ? (e.pesos || []).filter(p => p != null && !isNaN(p)) : [];
      if (ps.length) return { peso: Math.max(...ps), rpe: e.rpeReal, fecha: r.fecha };
    }
    return null;
  }
  const hechoEn = (n, i) => db.registros.some(r => (r.semana === n && r.dia === i) || (r.semana == null && r.fecha === masDias(lunesSemana(n), i)));
  const registroDePlan = (n, i) => db.registros.find(r => r.semana === n && r.dia === i) || null;
  function resumenRegistro(r) {
    const p = [];
    if (r.km) p.push(`${fmtN(r.km)} km` + (r.seg ? ` en ${fmtT(r.seg)} · ${fmtT(ritmo(r.km, r.seg))}/km` : ''));
    if (r.tipo === 'simulacion' && r.total) p.push(`Total ${fmtT(r.total)}`);
    (r.ejercicios || []).forEach(e => { const ps = (e.pesos || []).filter(x => x != null); if (ps.length) p.push(`${e.n} ${Math.max(...ps)} ${e.u === 'kg por mano' ? 'kg/mano' : 'kg'}`); });
    if (r.min && !r.km) p.push(`${r.min} min`);
    if (r.rpe) p.push(`RPE ${r.rpe}`);
    return p.join(' · ');
  }

  // ---------- Estado de la interfaz y botón atrás de Android ----------
  const ui = { tab: 'hoy', semanaPlan: null, diaHoy: null, ejProgreso: '', };
  const capas = [];
  const profundidad = () => capas.length;
  let ignorarPop = 0;
  const pendientes = []; let relojPend = null;
  function soltarPendientes() { clearTimeout(relojPend); relojPend = null; ignorarPop = 0; pendientes.splice(0).forEach(d => { try { history.pushState({ d }, ''); } catch (e) { /* ignorar */ } }); }
  function empujar() {
    const d = profundidad();
    if (ignorarPop > 0) { pendientes.push(d); clearTimeout(relojPend); relojPend = setTimeout(soltarPendientes, 600); return; }
    try { history.pushState({ d }, ''); } catch (e) { /* ignorar */ }
  }
  function deshacerHasta(d) { while (capas.length > d) { const c = capas.pop(); c.el.remove(); } }
  function volverA(d) {
    const n = profundidad() - d; if (n <= 0) return;
    deshacerHasta(d);
    try { ignorarPop++; history.go(-n); } catch (e) { ignorarPop = 0; }
  }
  window.addEventListener('popstate', e => {
    if (ignorarPop > 0) { ignorarPop--; if (!ignorarPop && pendientes.length) soltarPendientes(); return; }
    deshacerHasta((e.state && e.state.d) || 0);
  });
  try { history.replaceState({ d: 0 }, ''); } catch (e) { /* ignorar */ }

  // ---------- Iconos ----------
  const ico = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>'
  };

  // ---------- Piezas de interfaz ----------
  const fechaBox = s => { const [y, m, d] = s.split('-'); return `<div class="date"><b>${+d}</b><span>${MESES[+m - 1]} ${y.slice(2)}</span></div>`; };
  const stat = (k, v) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`;
  const vacio = (t, p, btns = '') => `<div class="card empty"><h3>${t}</h3><p>${p}</p>${btns ? `<div class="btns">${btns}</div>` : ''}</div>`;
  const icoTipo = t => `<div class="tipo ${t}" aria-hidden="true">${(TIPOS[t] || TIPOS.otro).i}</div>`;
  const diasCarrera = () => entreDias(hoyISO(), db.carrera.fecha);

  function bannerCopia() {
    if (!db.registros.length) return '';
    const dias = db.ultimaCopia ? Math.floor((Date.now() - new Date(db.ultimaCopia)) / DIA_MS) : null;
    const pendiente = !db.ultimaCopia || (db.ultimoCambio && db.ultimoCambio > db.ultimaCopia);
    if (!pendiente || (dias != null && dias < 7)) return '';
    const txt = dias == null ? 'Todavía no has hecho ninguna copia de seguridad.' : `Tu última copia es de hace ${dias} días.`;
    return `<div class="banner"><p>${txt} Tus entrenos solo están en este móvil: guarda una copia en Drive o en WhatsApp.</p><button class="btn" data-act="compartirCopia">Hacer copia</button></div>`;
  }
  function bannerVieja() {
    if (!hayDatosViejos() || db.importadoViejo) return '';
    return `<div class="banner acc"><p>Hay entrenos guardados de la versión anterior de la app. ¿Los traigo?</p><button class="btn" data-act="traerViejos">Traerlos</button></div>`;
  }
  function listaEjercicios(s) {
    const b = s.bloques || [];
    if (!b.length) return '';
    return `<div class="ej">${b.map(e => `<div><span class="n">${esc(e.n)}${e.nota ? `<span class="nota">${esc(e.nota)}</span>` : ''}</span><span class="x">${esc(objetivoTxt(e))}${e.w ? ` · ${e.w} ${esc(unidad(e))}` : ''}<br>${rpePill(e.rpe)}</span></div>`).join('')}</div>`;
  }
  // El registro que cuenta como «hecho» para una sesión del plan
  const hechoDe = s => !esEntreno(s) ? null : (registroDePlan(s.semana, s.dia) || regsDelDia(s.fecha).find(r => r.semana == null) || null);
  function tarjetaSesion(s, conBoton = true, enLista = false) {
    const hecho = hechoDe(s);
    const estaciones = s.estaciones ? `<div class="ej">${s.estaciones.map(id => { const e = ESTACIONES.find(x => x.id === id); return `<div><span class="n">1 km + ${esc(e.n)}</span><span class="x">${esc(e.d)}${e.p ? ' · ' + esc(e.p) : ''}</span></div>`; }).join('')}</div>` : '';
    return `<div class="${enLista ? '' : 'card pad '}sesion">
      ${enLista ? (s.resumen || s.rpe ? `<div class="sp"><span class="que">${esc(s.resumen || '')}</span>${rpePill(s.rpe)}</div>` : '')
        : `<div class="cab">${icoTipo(s.tipo)}<div class="main"><h3>${esc(s.titulo)}</h3>${s.resumen ? `<div class="que">${esc(s.resumen)}</div>` : ''}</div>${rpePill(s.rpe)}</div>`}
      ${s.detalle.length ? `<ul class="small" style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px">${s.detalle.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
      ${listaEjercicios(s)}${estaciones}
      ${conBoton && esEntreno(s) ? (hecho
        ? `<div class="sp"><span class="hecho-ok">${ico.ok} Hecho${hecho.rpe ? ` · RPE ${hecho.rpe}` : ''}</span><button class="btn sm" data-act="editReg" data-id="${hecho.id}">Ver o cambiar</button></div>`
        : `<button class="btn primary block" data-act="registrar" data-sem="${s.semana}" data-dia="${s.dia}">${ico.plus} Registrar esta sesión</button>`) : ''}
    </div>`;
  }

  // ---------- Vistas ----------
  function vHoy() {
    let h = bannerVieja() + bannerCopia();
    const hoy = hoyISO(), total = totalSemanas(), faltan = diasCarrera();
    const nSem = semanaDe(hoy);
    if (faltan < 0) {
      h += `<div class="hero"><div class="k">HYROX ${esc(db.carrera.ciudad)}</div><div class="big">¡Hecho! ♥</div><div class="s">La carrera fue el ${fmtFecha(db.carrera.fecha)}. Pon la fecha de la próxima en Ajustes y la app te prepara un plan nuevo.</div></div>`;
      return h + `<button class="btn block" data-act="ajustes">Poner otra carrera</button>`;
    }
    const sem = Math.max(1, Math.min(total, nSem));
    const f = faseDe(sem);
    h += `<div class="hero"><div class="k">HYROX ${esc(db.carrera.ciudad)} · ${esc(db.carrera.categoria)}</div>
      <div class="big">${faltan === 0 ? '¡Es hoy!' : `${faltan} <small>${faltan === 1 ? 'día' : 'días'}</small>`}</div>
      <div class="s">${fmtLarga(db.carrera.fecha)}</div>
      <div class="s">${nSem < 1 ? `El plan empieza el ${fmtFecha(db.inicio)}` : `Semana ${sem} de ${total} · ${f.n} (${f.en} de ${f.w})`}</div>
      <div class="barra" role="progressbar" aria-label="Avance del plan" aria-valuenow="${Math.max(0, sem - (nSem < 1 ? 1 : 0))}" aria-valuemax="${total}"><i style="width:${Math.max(2, (nSem < 1 ? 0 : sem) / total * 100)}%"></i></div></div>`;
    if (esDescarga(sem) && nSem >= 1) h += `<div class="banner acc"><p><b>Semana de descarga.</b> Menos volumen para que el cuerpo asimile el trabajo. Es parte del plan.</p></div>`;

    const lunes = lunesDe(hoy);
    const semPlan = nSem >= 1 && nSem <= total ? sesionesSemana(nSem) : null;
    const sel = ui.diaHoy && lunesDe(ui.diaHoy) === lunes ? ui.diaHoy : hoy;
    h += `<div class="semana" role="group" aria-label="Esta semana">${DIAS.map((d, i) => {
      const f2 = masDias(lunes, i); const s = semPlan ? semPlan[i] : null;
      const cls = ['dia', esEntreno(s) ? 'entreno' : '', regsDelDia(f2).length ? 'hecho' : '', f2 === sel ? 'hoy' : '', s && s.carrera ? 'carrera' : ''].join(' ');
      return `<button class="${cls}" data-act="verDia" data-f="${f2}" aria-pressed="${f2 === sel}" aria-label="${DIAS_L[i]} ${fmtCorta(f2)}${regsDelDia(f2).length ? ', hecho' : ''}"><span class="d">${d}</span><span class="n">${+f2.slice(8)}</span><span class="m"></span></button>`;
    }).join('')}</div>`;

    const s = semPlan ? semPlan[diaSemana(sel)] : null;
    h += `<h2 class="sec">${sel === hoy ? 'Hoy' : DIAS_L[diaSemana(sel)]} · ${fmtCorta(sel)}</h2>`;
    if (s) h += tarjetaSesion(s);
    else h += vacio('Sin plan este día', nSem < 1 ? 'El plan todavía no ha empezado.' : 'Fuera del plan.', '<button class="btn primary" data-act="registrarLibre">Apuntar un entreno</button>');
    const principal = s ? hechoDe(s) : null;
    const extra = regsDelDia(sel).filter(r => r !== principal);
    if (extra.length) h += `<h2 class="sec">También apuntado</h2><div class="list">${extra.map(filaRegistro).join('')}</div>`;
    if (s && !esEntreno(s)) {
      const prox = proximoEntreno(sel);
      if (prox) h += `<h2 class="sec">Próximo entreno · ${DIAS_L[prox.dia]} ${fmtCorta(prox.fecha)}</h2>` + tarjetaSesion(prox, false);
    }
    return h;
  }
  function proximoEntreno(desde) {
    for (let i = 1; i <= 7; i++) { const f = masDias(desde, i); const s = sesionDeFecha(f); if (esEntreno(s)) return s; }
    return null;
  }

  function vPlan() {
    const total = totalSemanas(), act = semanaActual();
    const n = ui.semanaPlan || act;
    const fs = fases();
    let h = `<div class="card pad stack"><div class="sp"><b>${total} semanas hasta ${esc(db.carrera.ciudad)}</b><span class="small muted">${fmtCorta(db.inicio)} → ${fmtCorta(db.carrera.fecha)}</span></div>
      <div class="fases">${fs.map(f => `<i style="flex:${f.w};background:${f.c}" title="${esc(f.n)}"></i>`).join('')}</div>
      <div class="leyenda">${fs.map(f => `<span style="--c:${f.c}">${esc(f.n)} · ${f.w} sem.</span>`).join('')}</div></div>`;
    h += `<div class="semanas" id="semanas" role="group" aria-label="Semanas">${Array.from({ length: total }, (_, i) => i + 1).map(w => {
      const d = esDescarga(w);
      return `<button class="${w === act ? 'actual' : ''} ${d ? 'desc' : ''}" data-act="semana" data-n="${w}" aria-pressed="${w === n}" aria-label="Semana ${w}${d ? ', descarga' : ''}">S${w}<small>${w === total ? 'carrera' : d ? 'descarga' : fmtCorta(lunesSemana(w))}</small></button>`;
    }).join('')}</div>`;
    const f = faseDe(n);
    h += `<div class="stack"><div class="sp"><h2 class="sec" style="margin:0">Semana ${n} · ${fmtCorta(lunesSemana(n))} – ${fmtCorta(masDias(lunesSemana(n), 6))}</h2><span class="pill acc">${esc(f.n)} ${f.en}/${f.w}</span></div>
      <p class="note">${esc(f.desc)}</p>${esDescarga(n) ? '<div class="banner acc"><p><b>Semana de descarga:</b> unos 35 % menos de kilómetros y una serie menos en fuerza.</p></div>' : ''}</div>`;
    const hoy = hoyISO();
    h += `<div class="list">${sesionesSemana(n).map(s => {
      const hecho = hechoEn(s.semana, s.dia);
      return `<details class="diaplan"${s.fecha === hoy ? ' open' : ''}><summary>${icoTipo(s.tipo)}<div class="main" style="flex:1;min-width:0"><div class="small muted" style="font-weight:700">${DIAS_L[s.dia]} ${fmtCorta(s.fecha)}${s.fecha === hoy ? ' · hoy' : ''}</div><div style="font-weight:700">${esc(s.titulo)}</div></div>${hecho ? `<span class="pill good">${ico.ok.replace('width="20" height="20"', 'width="14" height="14"')} hecho</span>` : ''}<span class="chev">${ico.chev}</span></summary>
        <div class="cuerpo">${tarjetaSesion(s, true, true)}</div></details>`;
    }).join('')}</div>`;
    return h;
  }

  function filaRegistro(r) {
    const t = TIPOS[r.tipo] || TIPOS.otro;
    return `<button class="row" data-act="editReg" data-id="${r.id}">${fechaBox(r.fecha)}<div class="main"><div class="t">${t.i} ${esc(r.titulo || t.n)}</div><div class="s">${esc(resumenRegistro(r) || t.n)}</div></div></button>`;
  }
  function vRegistro() {
    let h = bannerVieja() + bannerCopia();
    if (!db.registros.length) {
      return h + vacio('Aún no has apuntado nada', 'Cuando termines un entreno, apúntalo aquí. La app te pone los ejercicios del plan y tú solo escribes el peso.',
        '<button class="btn primary" data-act="registrarHoy">Apuntar el de hoy</button>');
    }
    const grupos = new Map();
    ordenados().forEach(r => { const k = lunesDe(r.fecha); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(r); });
    for (const [lunes, rs] of grupos) {
      const n = semanaDe(lunes); const enPlan = n >= 1 && n <= totalSemanas();
      const prev = enPlan ? sesionesSemana(n).filter(esEntreno).length : 0;
      h += `<div class="sp"><h2 class="sec" style="margin:0">${enPlan ? `Semana ${n} · ` : ''}${fmtCorta(lunes)} – ${fmtCorta(masDias(lunes, 6))}</h2>${enPlan ? `<span class="small muted">${new Set(rs.map(r => r.fecha)).size} de ${prev} días</span>` : ''}</div>`;
      h += `<div class="list">${rs.map(filaRegistro).join('')}</div>`;
    }
    return h;
  }

  // ---------- Gráficas (SVG sencillo) ----------
  function grafBarras(items) {
    const W = 340, H = 150, pl = 6, pb = 20, pt = 14;
    const max = Math.max(1, ...items.map(i => Math.max(i.plan || 0, i.hecho || 0)));
    const bw = (W - pl * 2) / items.length;
    const y = v => H - pb - (v / max) * (H - pb - pt);
    const cada = Math.ceil(items.length / 8);
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Kilómetros por semana: plan y hechos">
      <line class="ax" x1="0" x2="${W}" y1="${H - pb}" y2="${H - pb}"/>
      ${items.map((it, i) => { const x = pl + i * bw; return `
        <rect class="plan" x="${x + bw * .12}" y="${y(it.plan || 0)}" width="${bw * .76}" height="${H - pb - y(it.plan || 0)}" rx="3"/>
        ${it.hecho ? `<rect class="hecho" x="${x + bw * .26}" y="${y(it.hecho)}" width="${bw * .48}" height="${H - pb - y(it.hecho)}" rx="2"/><text class="v" x="${x + bw / 2}" y="${y(it.hecho) - 3}" text-anchor="middle">${fmtN(it.hecho, 0)}</text>` : ''}
        ${i % cada === 0 ? `<text class="lb" x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(it.l)}</text>` : ''}`; }).join('')}
    </svg></div>`;
  }
  function grafLinea(pts, fmt, etiqueta) {
    if (pts.length < 2) return '<p class="small muted">Con dos registros o más verás aquí la evolución.</p>';
    const W = 340, H = 150, pl = 34, pr = 10, pb = 20, pt = 16;
    const vs = pts.map(p => p.v); let lo = Math.min(...vs), hi = Math.max(...vs);
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * .15; lo -= pad; hi += pad;
    const x = i => pl + i * (W - pl - pr) / (pts.length - 1);
    const y = v => H - pb - (v - lo) / (hi - lo) * (H - pb - pt);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    const cada = Math.ceil(pts.length / 6);
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(etiqueta)}">
      <line class="ax" x1="${pl}" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}"/>
      <text class="lb" x="${pl - 6}" y="${y(hi - pad) + 3}" text-anchor="end">${esc(fmt(hi - pad))}</text>
      <text class="lb" x="${pl - 6}" y="${y(lo + pad) + 3}" text-anchor="end">${esc(fmt(lo + pad))}</text>
      <path class="ln" d="${d}"/>
      ${pts.map((p, i) => `<circle class="pt" cx="${x(i)}" cy="${y(p.v)}" r="4"/>${i === pts.length - 1 ? `<text class="v" x="${x(i)}" y="${y(p.v) - 8}" text-anchor="end">${esc(fmt(p.v))}</text>` : ''}${i % cada === 0 || i === pts.length - 1 ? `<text class="lb" x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(p.l)}</text>` : ''}`).join('')}
    </svg></div>`;
  }

  function vProgreso() {
    const hoy = hoyISO(), act = semanaDe(hoy), total = totalSemanas();
    // Cumplimiento: días de entreno del plan hasta ayer con algo apuntado
    let prev = 0, hechos = 0;
    for (let n = 1; n <= Math.min(act, total); n++) sesionesSemana(n).forEach(s => { if (esEntreno(s) && s.fecha < hoy) { prev++; if (hechoEn(n, s.dia)) hechos++; } });
    const kmTot = sum(db.registros, r => r.km);
    let h = `<div class="stats">${stat('Entrenos', db.registros.length)}${stat('Cumplido', prev ? Math.round(hechos / prev * 100) + ' %' : '—')}${stat('Km', fmtN(kmTot, 0))}</div>`;
    if (!db.registros.length) return h + vacio('Todavía no hay datos', 'Apunta tus entrenos y aquí verás cómo subes de peso, cómo mejora tu ritmo y tus tiempos en las estaciones.');

    // Km por semana
    const hasta = Math.max(1, Math.min(total, act));
    const items = [];
    for (let n = Math.max(1, hasta - 11); n <= hasta; n++) {
      const plan = sum(sesionesSemana(n), s => s.km);
      const hecho = sum(db.registros.filter(r => semanaDe(r.fecha) === n), r => r.km);
      items.push({ l: 'S' + n, plan, hecho });
    }
    h += `<h2 class="sec">Kilómetros por semana</h2><div class="card pad stack">${grafBarras(items)}<div class="leyenda"><span style="--c:var(--accent-soft)">Plan</span><span style="--c:var(--accent)">Corrido</span></div></div>`;

    // Fuerza
    const conPeso = new Map();
    db.registros.forEach(r => (r.ejercicios || []).forEach(e => { if ((e.pesos || []).some(p => p != null) && !conPeso.has(e.id)) conPeso.set(e.id, e.n); }));
    if (conPeso.size) {
      const sel = conPeso.has(ui.ejProgreso) ? ui.ejProgreso : [...conPeso.keys()][0];
      const pts = db.registros.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).map(r => {
        const e = (r.ejercicios || []).find(x => x.id === sel); const ps = e ? (e.pesos || []).filter(p => p != null) : [];
        return ps.length ? { l: fmtCorta(r.fecha), v: Math.max(...ps), rpe: e.rpeReal } : null;
      }).filter(Boolean);
      const ult = pts[pts.length - 1], pri = pts[0];
      h += `<h2 class="sec">Fuerza</h2><div class="card pad stack"><div class="field"><select id="ejProgreso" aria-label="Ejercicio">${[...conPeso].sort((a, b) => a[1].localeCompare(b[1], 'es')).map(([id, n]) => `<option value="${id}"${id === sel ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        ${grafLinea(pts, v => fmtN(v) + ' kg', 'Peso por sesión')}
        <p class="small">${pts.length > 1 ? `De <b>${fmtN(pri.v)} kg</b> a <b>${fmtN(ult.v)} kg</b>${ult.v > pri.v ? ` (+${fmtN(ult.v - pri.v)} kg) 💪` : ''}.` : `Última vez: <b>${fmtN(ult.v)} kg</b>.`}${ult.rpe ? ` Último RPE: ${esc(ult.rpe)}.` : ''}</p></div>`;
    }

    // Ritmo de carrera (rodajes con tiempo)
    const runs = db.registros.filter(r => r.km && r.seg).sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (runs.length) {
      const pts = runs.map(r => ({ l: fmtCorta(r.fecha), v: ritmo(r.km, r.seg) / 60 }));
      const mejor = runs.reduce((m, r) => !m || ritmo(r.km, r.seg) < ritmo(m.km, m.seg) ? r : m, null);
      h += `<h2 class="sec">Ritmo corriendo (min/km)</h2><div class="card pad stack">${grafLinea(pts, v => fmtT(v * 60), 'Ritmo por salida, más bajo es más rápido')}
        <p class="small">Cuanto más baja la línea, más rápido. Mejor ritmo: <b>${fmtT(ritmo(mejor.km, mejor.seg))}/km</b> (${fmtN(mejor.km)} km, ${fmtCorta(mejor.fecha)}).</p></div>`;
    }

    // Simulaciones y estaciones
    const sims = db.registros.filter(r => r.tipo === 'simulacion' && r.splits).sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (sims.length) {
      const completas = sims.filter(r => r.total && (r.splits.est || []).filter(v => v != null).length === 8);
      if (completas.length) h += `<h2 class="sec">Simulaciones completas</h2><div class="card pad stack">${grafLinea(completas.map(r => ({ l: fmtCorta(r.fecha), v: r.total / 60 })), v => fmtT(v * 60), 'Tiempo total')}<p class="small">Mejor tiempo: <b>${fmtT(Math.min(...completas.map(r => r.total)))}</b></p></div>`;
      h += `<h2 class="sec">Tus mejores tiempos</h2><div class="card pad"><table class="tabla"><thead><tr><th>Estación</th><th>Mejor</th><th>Última</th></tr></thead><tbody>${ESTACIONES.map((e, i) => {
        const ts = sims.map(r => (r.splits.est || [])[i]).filter(v => v != null);
        return `<tr><td>${esc(e.n)}</td><td><b>${ts.length ? fmtT(Math.min(...ts)) : '—'}</b></td><td>${ts.length ? fmtT(ts[ts.length - 1]) : '—'}</td></tr>`;
      }).join('')}${(() => { const ks = sims.flatMap(r => (r.splits.run || []).filter(v => v != null)); return `<tr><td>1 km corriendo</td><td><b>${ks.length ? fmtT(Math.min(...ks)) : '—'}</b></td><td>${ks.length ? fmtT(ks[ks.length - 1]) : '—'}</td></tr>`; })()}</tbody></table></div>`;
    }

    // Esfuerzo medio por semana
    const rpeSem = [];
    for (let n = Math.max(1, hasta - 11); n <= hasta; n++) { const rs = db.registros.filter(r => semanaDe(r.fecha) === n && r.rpe); if (rs.length) rpeSem.push({ l: 'S' + n, v: sum(rs, r => r.rpe) / rs.length }); }
    if (rpeSem.length > 1) h += `<h2 class="sec">Esfuerzo medio (RPE)</h2><div class="card pad stack">${grafLinea(rpeSem, v => fmtN(v), 'RPE medio por semana')}<p class="small muted">Si sube varias semanas seguidas sin que suba el plan, puede que necesites descansar más.</p></div>`;
    return h;
  }

  function vCarrera() {
    const faltan = diasCarrera();
    let h = `<div class="hero"><div class="k">${esc(db.carrera.categoria)}</div><div class="big">HYROX ${esc(db.carrera.ciudad)}</div>
      <div class="s">${fmtLarga(db.carrera.fecha)}${faltan >= 0 ? ` · ${faltan === 0 ? '¡hoy!' : `faltan ${faltan} días`}` : ''}</div></div>`;
    h += `<h2 class="sec">El recorrido</h2><div class="list">${ESTACIONES.map((e, i) => `<div class="row"><div class="date"><b>${i + 1}</b><span>bloque</span></div><div class="main"><div class="t">1 km corriendo + ${esc(e.n)}</div><div class="s">${esc(e.d)}${e.p ? ' · ' + esc(e.p) : ''}</div></div></div>`).join('')}</div>
      <p class="note">Entre la carrera y cada estación pasas por la «Roxzone», la zona de cambio. También cuenta en el tiempo.</p>`;
    // Objetivo
    const o = db.objetivo || {};
    const sims = db.registros.filter(r => r.tipo === 'simulacion' && r.total && (r.splits && (r.splits.est || []).filter(v => v != null).length === 8));
    const mejor = sims.length ? Math.min(...sims.map(r => r.total)) : null;
    h += `<h2 class="sec">Mi objetivo</h2><div class="card pad stack" id="objetivo">
      <p class="small muted">Pon el tiempo que crees que harás en cada parte (por ejemplo «6.10» son 6 min 10 s). Te calcula el total.</p>
      <div class="tiempos">
        <label class="t"><span class="n">Cada kilómetro<small>Ritmo medio de los 8 km</small></span><input inputmode="decimal" data-obj="km" value="${o.km ? fmtT(o.km) : ''}" placeholder="6:00"></label>
        ${ESTACIONES.map(e => `<label class="t"><span class="n">${esc(e.n)}<small>${esc(e.d)}</small></span><input inputmode="decimal" data-obj="${e.id}" value="${o[e.id] ? fmtT(o[e.id]) : ''}" placeholder="—"></label>`).join('')}
        <label class="t"><span class="n">Roxzone<small>Todos los cambios juntos</small></span><input inputmode="decimal" data-obj="rox" value="${o.rox ? fmtT(o.rox) : ''}" placeholder="7:00"></label>
        <div class="total"><span>Tiempo previsto</span><b id="objTotal">${fmtT(totalObjetivo()) }</b></div>
      </div>
      ${mejor ? `<p class="small">Tu mejor simulación completa: <b>${fmtT(mejor)}</b>.</p>` : ''}
    </div>`;
    h += `<h2 class="sec">Pesos oficiales · ${esc(db.carrera.categoria)}</h2><div class="card pad"><table class="tabla"><tbody>
      <tr><td>Sled Push</td><td><b>${OF.sledPush} kg</b></td></tr><tr><td>Sled Pull</td><td><b>${OF.sledPull} kg</b></td></tr>
      <tr><td>Farmers Carry</td><td><b>2 × ${OF.farmers} kg</b></td></tr><tr><td>Sandbag Lunges</td><td><b>${OF.sandbag} kg</b></td></tr>
      <tr><td>Wall Balls</td><td><b>${OF.wallball} kg · diana a 2,70 m</b></td></tr></tbody></table>
      <p class="small muted" style="margin-top:8px">Los pesos de los trineos llevan el trineo incluido. Reglamento HYROX 2025/26.</p></div>`;
    return h;
  }
  function totalObjetivo() {
    const o = db.objetivo || {};
    let t = (o.km || 0) * 8 + (o.rox || 0);
    ESTACIONES.forEach(e => { t += o[e.id] || 0; });
    return t || null;
  }

  // ---------- Render principal ----------
  function render() {
    const faltan = diasCarrera();
    $('#cuentaBtn').textContent = faltan > 0 ? `🏁 ${faltan} días` : faltan === 0 ? '🏁 ¡Hoy!' : '🏁';
    document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === ui.tab ? 'page' : 'false'));
    document.title = `HYROXNENA · ${TITULOS[ui.tab]}`;
    $('#main').innerHTML = ({ hoy: vHoy, plan: vPlan, registro: vRegistro, progreso: vProgreso, carrera: vCarrera }[ui.tab])();
    $('#fabSlot').innerHTML = (ui.tab === 'registro' || ui.tab === 'progreso') ? `<button class="fab" data-act="registrarHoy">${ico.plus}Apuntar</button>` : '';
    if (ui.tab === 'plan') { const b = $('#semanas [aria-pressed="true"]'); if (b) b.scrollIntoView({ block: 'nearest', inline: 'center' }); }
  }

  // ---------- Hojas ----------
  function abrirCapa(html, onMount) {
    const el = document.createElement('div');
    el.className = 'scrim';
    el.innerHTML = html;
    $('#layer').appendChild(el);
    capas.push({ el });
    empujar();
    const d = profundidad();
    el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-close]')) volverA(d - 1); });
    if (onMount) onMount(el, d);
    return el;
  }
  const cabecera = t => `<header><h3>${t}</h3><button class="iconbtn" data-close aria-label="Cerrar">${ico.x}</button></header>`;
  function confirmar(titulo, texto, ok = 'Borrar') {
    return new Promise(res => {
      let resuelto = false;
      abrirCapa(`<div class="sheet" role="alertdialog" aria-modal="true">${cabecera(titulo)}<div class="body"><p>${texto}</p></div>
        <footer><button class="btn" data-close>Cancelar</button><button class="btn primary" data-ok style="background:var(--crit);color:#fff">${esc(ok)}</button></footer></div>`, (el, d) => {
        el.querySelector('[data-ok]').addEventListener('click', () => { resuelto = true; volverA(d - 1); res({ ok: true }); });
        const obs = new MutationObserver(() => { if (!el.isConnected) { obs.disconnect(); if (!resuelto) res({ ok: false }); } });
        obs.observe($('#layer'), { childList: true });
      });
    });
  }

  // ---------- Formulario de registro ----------
  const GUIA_RPE = `<details class="rpeguia"><summary>¿Qué es el RPE?</summary><div class="filas">
    ${[['5-6', 'good', 'Cómodo. Podrías hacer 4 o más repeticiones más'], ['7', 'warn', 'Exigente. Te sobran unas 3 repeticiones'], ['8', 'hot', 'Duro. Te sobran 2'], ['9', 'crit', 'Muy duro. Solo te queda 1'], ['10', 'crit', 'Fallo: no podrías hacer ni una más']]
      .map(([n, c, t]) => `<div><span class="pill ${c}" style="min-width:66px;text-align:center">RPE ${n}</span><span>${t}</span></div>`).join('')}
    <p class="small muted">Elige el peso con el que la última repetición de cada serie se sienta así. Si te sobra mucho, sube; si fallas antes, baja.</p></div></details>`;

  // Tipos que se pueden elegir para un entreno fuera del plan
  const TIPOS_LIBRES = ['fuerza', 'carrera', 'mixta', 'simulacion', 'padel', 'ep', 'otro'];

  function formRegistro(opts = {}) {
    const r0 = opts.id ? registro(opts.id) : null;
    const st = {
      fecha: r0 ? r0.fecha : opts.fecha || (opts.sem ? masDias(lunesSemana(opts.sem), opts.dia) : hoyISO()),
      plan: null, // {semana, dia}
      tipo: r0 ? r0.tipo : 'fuerza'
    };
    if (r0) st.plan = r0.semana != null ? { semana: r0.semana, dia: r0.dia } : null;
    else if (opts.sem) st.plan = { semana: +opts.sem, dia: +opts.dia };
    else if (!opts.libre) { const s = sesionDeFecha(st.fecha); if (esEntreno(s) && !hechoEn(s.semana, s.dia)) st.plan = { semana: s.semana, dia: s.dia }; }
    const sesionPlan = () => st.plan ? sesionDe(st.plan.semana, st.plan.dia) : null;

    const opcionesPlan = () => {
      const n = semanaDe(st.fecha);
      const ss = n >= 1 && n <= totalSemanas() ? sesionesSemana(n).filter(esEntreno) : [];
      return `<option value="">Fuera del plan</option>${ss.map(s => `<option value="${s.semana}|${s.dia}"${st.plan && st.plan.semana === s.semana && st.plan.dia === s.dia ? ' selected' : ''}>${DIAS[s.dia]} · ${esc(s.titulo)}${hechoEn(s.semana, s.dia) && !(r0 && r0.semana === s.semana && r0.dia === s.dia) ? ' ✓' : ''}</option>`).join('')}`;
    };

    const tarjetaEj = (e, i, prev) => {
      const ult = e.sinPeso ? null : ultimoPeso(e.id, r0 && r0.id);
      const pesos = prev ? prev.pesos || [] : [];
      const ini = j => pesos[j] != null ? pesos[j] : (e.w != null && !prev ? e.w : '');
      return `<div class="ejlog" data-ej="${i}">
        <div class="cab"><div><div class="n">${esc(e.n)}</div><div class="obj">${esc(objetivoTxt(e))}</div></div>${rpePill(e.rpe)}</div>
        ${e.nota ? `<div class="nota">${esc(e.nota)}</div>` : ''}
        ${e.sinPeso ? '<div class="nota">Sin peso: no hace falta apuntar nada.</div>' : `<div class="series">${Array.from({ length: e.s }, (_, j) => `<label class="serie"><span>SERIE ${j + 1}</span><input type="number" inputmode="decimal" step="0.5" min="0" data-serie="${j}" value="${ini(j)}" placeholder="${ult ? fmtN(ult.peso) : 'kg'}" aria-label="${esc(e.n)}, serie ${j + 1}, ${esc(unidad(e))}"></label>`).join('')}</div><div class="nota">en ${esc(unidad(e))}</div>`}
        <div class="pie"><span>${ult ? `La última vez: <b>${fmtN(ult.peso)} ${esc(unidad(e))}</b>${ult.rpe ? ` · RPE ${esc(ult.rpe)}` : ''}<button type="button" class="link" data-usar="${i}" data-p="${ult.peso}">Usar</button>` : ''}</span>
          ${e.rpe && e.rpe !== '—' ? `<label>RPE real <select data-rpereal aria-label="RPE real de ${esc(e.n)}"><option value="">–</option>${[5, 6, 7, 8, 9, 10].map(n => `<option${prev && String(prev.rpeReal) === String(n) ? ' selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}</div>
      </div>`;
    };

    const cuerpo = () => {
      const s = sesionPlan();
      const tipo = s ? s.tipo : st.tipo;
      const bloques = s ? (s.bloques || []) : (r0 && r0.semana == null ? (r0.ejercicios || []) : []);
      const prevEj = id => r0 ? (r0.ejercicios || []).find(x => x.id === id) : null;
      let h = '';
      if (!s) {
        h += `<div class="grid2"><div class="field"><label for="rTipo">Tipo</label><select id="rTipo">${TIPOS_LIBRES.map(t => `<option value="${t}"${t === tipo ? ' selected' : ''}>${TIPOS[t].i} ${TIPOS[t].n}</option>`).join('')}</select></div>
          <div class="field"><label for="rTitulo">Nombre</label><input id="rTitulo" value="${esc(r0 && r0.semana == null ? r0.titulo || '' : '')}" placeholder="${esc(TIPOS[tipo].n)}"></div></div>`;
      } else {
        h += `<div class="card pad" style="display:flex;gap:10px;align-items:center">${icoTipo(s.tipo)}<div style="flex:1;min-width:0"><b>${esc(s.titulo)}</b><div class="small muted">${esc(s.resumen || '')}</div></div>${rpePill(s.rpe)}</div>`;
      }
      if (bloques.length) h += `<div class="stack"><div class="sp"><b>Ejercicios · solo pon el peso</b></div>${GUIA_RPE}${bloques.map((e, i) => tarjetaEj(e, i, prevEj(e.id))).join('')}</div>`;
      else if (!s && (tipo === 'fuerza' || tipo === 'mixta')) h += `<div class="field"><label for="rEjLibre">Qué has hecho</label><textarea id="rEjLibre" placeholder="Sentadilla 4 × 8 con 40 kg…">${esc(r0 ? r0.ejLibre || '' : '')}</textarea></div>`;
      if (tipo === 'carrera' || tipo === 'mixta' || (!s && tipo === 'otro')) {
        const kmIni = r0 ? (r0.km != null ? String(r0.km).replace('.', ',') : '') : (s && s.km ? s.km : '');
        h += `<div class="stack"><b>Carrera</b><div class="grid2"><div class="field"><label for="rKm">Kilómetros</label><input id="rKm" inputmode="decimal" value="${kmIni}" placeholder="0"></div>
          <div class="field"><label for="rTiempo">Tiempo</label><input id="rTiempo" inputmode="decimal" value="${r0 && r0.seg ? fmtT(r0.seg) : ''}" placeholder="32.15"><span class="hint">«32.15» = 32 min 15 s</span></div></div>
          <p class="small muted" id="rRitmo"></p></div>`;
      }
      if (tipo === 'simulacion') {
        const lista = s && s.estaciones ? s.estaciones : ESTACIONES.map(e => e.id);
        const sp = r0 && r0.splits ? r0.splits : { run: [], est: [] };
        h += `<div class="stack"><b>Tiempos</b><p class="small muted">Escribe cada tiempo como «4.35» (4 min 35 s). Deja en blanco lo que no hayas hecho.</p><div class="tiempos">${lista.map(id => {
          const i = ESTACIONES.findIndex(e => e.id === id), e = ESTACIONES[i];
          return `<label class="t"><span class="n">Km ${i + 1}<small>1 km corriendo</small></span><input inputmode="decimal" data-run="${i}" value="${sp.run[i] != null ? fmtT(sp.run[i]) : ''}" placeholder="—"></label>
            <label class="t"><span class="n">${esc(e.n)}<small>${esc(e.d)}${e.p ? ' · ' + esc(e.p) : ''}</small></span><input inputmode="decimal" data-est="${i}" value="${sp.est[i] != null ? fmtT(sp.est[i]) : ''}" placeholder="—"></label>`;
        }).join('')}
          <div class="total"><span>Suma</span><b id="rSuma">—</b></div></div>
          <div class="field"><label for="rTotal">Tiempo total del reloj (si lo tienes)</label><input id="rTotal" inputmode="decimal" value="${r0 && r0.totalReloj ? fmtT(r0.totalReloj) : ''}" placeholder="1.25.00"><span class="hint">Incluye la Roxzone. «1.25.00» = 1 h 25 min</span></div></div>`;
      }
      if (tipo === 'ep' || tipo === 'padel' || tipo === 'otro' || (!s && tipo === 'fuerza')) h += `<div class="field"><label for="rMin">Duración (minutos)</label><input id="rMin" type="number" inputmode="numeric" min="0" value="${r0 && r0.min ? r0.min : ''}" placeholder="60"></div>`;
      h += `<div class="field"><span class="lbl">¿Cómo de duro ha sido? (RPE de la sesión)</span><div class="rpebar" role="group" aria-label="RPE de la sesión">${Array.from({ length: 10 }, (_, i) => `<button type="button" data-rpe="${i + 1}" aria-pressed="${r0 && r0.rpe === i + 1}">${i + 1}</button>`).join('')}</div><span class="hint">1 muy fácil · 5 moderado · 7 duro · 9 muy duro · 10 máximo</span></div>
        <div class="field"><label for="rNotas">Notas</label><textarea id="rNotas" placeholder="${tipo === 'ep' ? '¿Qué hicisteis? ¿Algo que recordar?' : 'Sensaciones, molestias, qué cambiarías…'}">${esc(r0 ? r0.notas || '' : '')}</textarea></div>`;
      return h;
    };

    const html = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Apuntar entreno">${cabecera(r0 ? 'Entreno apuntado' : 'Apuntar entreno')}
      <div class="body"><div class="grid2"><div class="field"><label for="rFecha">Fecha</label><input type="date" id="rFecha" value="${st.fecha}"></div>
        <div class="field"><label for="rPlan">Sesión del plan</label><select id="rPlan">${opcionesPlan()}</select></div></div>
        <div id="rCuerpo" class="stack" style="gap:14px">${cuerpo()}</div></div>
      <footer>${r0 ? '<button class="btn danger" data-borrar>Borrar</button>' : '<button class="btn" data-close>Cancelar</button>'}<button class="btn primary" data-guardar>Guardar</button></footer></div>`;

    abrirCapa(html, (el, d) => {
      let rpe = r0 ? r0.rpe || null : null;
      const repintar = () => { el.querySelector('#rCuerpo').innerHTML = cuerpo(); vivo(); };
      const vivo = () => {
        const km = parseNum((el.querySelector('#rKm') || {}).value), seg = parseT((el.querySelector('#rTiempo') || {}).value);
        const rr = el.querySelector('#rRitmo'); if (rr) rr.textContent = km > 0 && seg > 0 ? `Ritmo: ${fmtT(seg / km)} por km` : '';
        const suma = el.querySelector('#rSuma');
        if (suma) { let t = 0; el.querySelectorAll('[data-run],[data-est]').forEach(i => { const v = parseT(i.value); if (v > 0) t += v; }); suma.textContent = t ? fmtT(t) : '—'; }
        el.querySelectorAll('.rpebar button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.rpe === rpe)));
      };
      vivo();
      el.querySelector('#rFecha').addEventListener('change', e => {
        st.fecha = e.target.value || hoyISO();
        if (!r0) { const s = sesionDeFecha(st.fecha); st.plan = esEntreno(s) && !hechoEn(s.semana, s.dia) ? { semana: s.semana, dia: s.dia } : null; }
        else if (st.plan && semanaDe(st.fecha) !== st.plan.semana) st.plan = null;
        el.querySelector('#rPlan').innerHTML = opcionesPlan(); repintar();
      });
      el.querySelector('#rPlan').addEventListener('change', e => { const v = e.target.value; st.plan = v ? { semana: +v.split('|')[0], dia: +v.split('|')[1] } : null; repintar(); });
      el.addEventListener('change', e => { if (e.target.id === 'rTipo') { st.tipo = e.target.value; repintar(); } });
      el.addEventListener('input', e => {
        const t = e.target;
        if (t.dataset.serie != null) {
          // el peso de una serie se copia a las siguientes que sigan vacías
          t.dataset.auto = '';
          const ins = t.closest('.series').querySelectorAll('input'); const j = +t.dataset.serie;
          ins.forEach((x, k) => { if (k > j && (x.value === '' || x.dataset.auto === '1')) { x.value = t.value; x.dataset.auto = '1'; } });
        }
        vivo();
      });
      el.addEventListener('click', async e => {
        const u = e.target.closest('[data-usar]');
        if (u) { el.querySelectorAll(`[data-ej="${u.dataset.usar}"] [data-serie]`).forEach(x => { x.value = u.dataset.p; x.dataset.auto = '1'; }); return; }
        const b = e.target.closest('[data-rpe]');
        if (b) { rpe = rpe === +b.dataset.rpe ? null : +b.dataset.rpe; vivo(); return; }
        if (e.target.closest('[data-borrar]')) {
          const r = await confirmar('¿Borrar este entreno?', `Se borrará «${esc(r0.titulo)}» del ${fmtFecha(r0.fecha)}.`);
          if (!r.ok) return;
          db.registros = db.registros.filter(x => x.id !== r0.id); guardar(); volverA(d - 1); render(); toast('Entreno borrado');
          return;
        }
        if (e.target.closest('[data-guardar]')) {
          const s = sesionPlan();
          const tipo = s ? s.tipo : st.tipo;
          const r = { id: r0 ? r0.id : uid(), fecha: st.fecha, semana: s ? s.semana : null, dia: s ? s.dia : null, tipo,
            titulo: s ? s.titulo : ((el.querySelector('#rTitulo') || {}).value || '').trim() || TIPOS[tipo].n, rpe, notas: el.querySelector('#rNotas').value.trim() };
          const bloques = s ? (s.bloques || []) : (r0 && r0.semana == null ? (r0.ejercicios || []) : []);
          if (bloques.length) {
            r.ejercicios = bloques.map((e2, i) => {
              const card = el.querySelector(`[data-ej="${i}"]`);
              const pesos = card ? [...card.querySelectorAll('[data-serie]')].map(x => x.value === '' ? null : parseNum(x.value)) : [];
              return { id: e2.id, n: e2.n, s: e2.s, r: e2.r, rpe: e2.rpe, u: e2.u, sinPeso: !!e2.sinPeso, nota: e2.nota, pesos: pesos.map(p => p == null || isNaN(p) ? null : p), rpeReal: card && card.querySelector('[data-rpereal]') ? card.querySelector('[data-rpereal]').value : '' };
            });
          }
          const lib = el.querySelector('#rEjLibre'); if (lib && lib.value.trim()) r.ejLibre = lib.value.trim();
          const kmI = el.querySelector('#rKm');
          if (kmI) {
            const km = parseNum(kmI.value), seg = parseT(el.querySelector('#rTiempo').value);
            if (Number.isNaN(km) || Number.isNaN(seg)) { toast('Revisa los kilómetros y el tiempo'); return; }
            if (km) r.km = km; if (seg) r.seg = seg;
          }
          if (el.querySelector('[data-run],[data-est]')) {
            const run = Array(8).fill(null), est = Array(8).fill(null); let mal = false;
            el.querySelectorAll('[data-run]').forEach(i => { const v = parseT(i.value); if (Number.isNaN(v)) mal = true; else run[+i.dataset.run] = v; });
            el.querySelectorAll('[data-est]').forEach(i => { const v = parseT(i.value); if (Number.isNaN(v)) mal = true; else est[+i.dataset.est] = v; });
            const reloj = parseT(el.querySelector('#rTotal').value);
            if (mal || Number.isNaN(reloj)) { toast('Hay algún tiempo mal escrito: usa «4.35»'); return; }
            r.splits = { run, est };
            r.totalReloj = reloj || null;
            r.total = reloj || (sum(run, v => v) + sum(est, v => v)) || null;
            r.km = run.filter(v => v != null).length || null;
          }
          const mi = el.querySelector('#rMin'); if (mi && mi.value) r.min = +mi.value;
          if (r0) db.registros[db.registros.findIndex(x => x.id === r0.id)] = r;
          else db.registros.push(r);
          guardar(); volverA(d - 1); render();
          toast(r0 ? 'Cambios guardados' : (s && s.carrera ? '¡Enhorabuena, finisher! ♥' : 'Entreno apuntado 💜'));
        }
      });
    });
  }

  // ---------- Ajustes ----------
  function hojaAjustes() {
    const contenido = () => {
      const ult = db.ultimaCopia ? new Date(db.ultimaCopia).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'nunca';
      let tema = 'auto'; try { tema = localStorage.getItem(KEY + '.tema') || 'auto'; } catch (e) { /* ignorar */ }
      return `<h2 class="sec" style="margin-top:0">Copia de seguridad</h2>
        <div class="card pad stack">
          <p>Tus entrenos se guardan solo en este móvil. Haz una copia de vez en cuando y guárdala en Google Drive, en tu correo o en WhatsApp. Con ese archivo lo recuperas todo en otro móvil.</p>
          <p class="small muted">Última copia: <b>${ult}</b></p>
          <button class="btn primary block" data-a="compartir">Compartir copia (Drive, WhatsApp, correo…)</button>
          <button class="btn block" data-a="descargar">Descargar copia en el móvil</button>
          <button class="btn block" data-a="importar">Importar una copia</button>
        </div>
        <h2 class="sec">Mi carrera</h2>
        <div class="card pad stack">
          <div class="grid2"><div class="field"><label for="aFecha">Fecha</label><input type="date" id="aFecha" value="${db.carrera.fecha}"></div>
          <div class="field"><label for="aCiudad">Ciudad</label><input id="aCiudad" value="${esc(db.carrera.ciudad)}"></div></div>
          <div class="field"><label for="aInicio">El plan empezó la semana del</label><input type="date" id="aInicio" value="${db.inicio}"><span class="hint">El plan va desde esa semana hasta la carrera: ahora son ${totalSemanas()} semanas.</span></div>
          <button class="btn block" data-a="guardarCarrera">Guardar cambios de la carrera</button>
        </div>
        <h2 class="sec">Aspecto</h2>
        <div class="segs" role="group" aria-label="Tema">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([k, t]) => `<button data-tema="${k}" aria-pressed="${tema === k}">${t}</button>`).join('')}</div>
        <h2 class="sec">Datos</h2>
        <div class="card pad stack">
          <p class="small muted">${db.registros.length} entrenos apuntados</p>
          ${hayDatosViejos() ? '<button class="btn block" data-a="viejos">Traer los entrenos de la versión anterior</button>' : ''}
          <button class="btn danger block" data-a="borrarTodo">Borrar todos los datos</button>
        </div>
        <p class="note">HYROXNENA ${VERSION} ♥ Funciona sin cobertura.</p>`;
    };
    abrirCapa(`<div class="sheet" role="dialog" aria-modal="true">${cabecera('Ajustes')}<div class="body" id="ajBody">${contenido()}</div></div>`, (el, d) => {
      const body = el.querySelector('#ajBody');
      const repintar = () => { body.innerHTML = contenido(); };
      el.addEventListener('click', async e => {
        const t = e.target.closest('[data-tema]');
        if (t) { aplicarTema(t.dataset.tema); try { localStorage.setItem(KEY + '.tema', t.dataset.tema); } catch (er) { /* ignorar */ } repintar(); return; }
        const b = e.target.closest('[data-a]'); if (!b) return;
        const a = b.dataset.a;
        if (a === 'compartir') { await exportar(true); repintar(); }
        else if (a === 'descargar') { await exportar(false); repintar(); }
        else if (a === 'importar') $('#fileIn').click();
        else if (a === 'viejos') { volverA(d - 1); traerViejos(); }
        else if (a === 'guardarCarrera') {
          const f = el.querySelector('#aFecha').value, c = el.querySelector('#aCiudad').value.trim(), ini = el.querySelector('#aInicio').value;
          if (!f || !ini) { toast('Pon la fecha de la carrera y la del inicio'); return; }
          if (entreDias(lunesDe(ini), f) < 35) { toast('Entre el inicio y la carrera tiene que haber al menos 5 semanas'); return; }
          db.carrera.fecha = f; db.carrera.ciudad = c || db.carrera.ciudad; db.inicio = lunesDe(ini); ui.semanaPlan = null;
          guardar(); render(); repintar(); toast(`Plan recalculado: ${totalSemanas()} semanas`);
        }
        else if (a === 'borrarTodo') {
          const r = await confirmar('¿Borrar todos los datos?', 'Se borrarán todos los entrenos de este móvil. Si no tienes copia de seguridad, no podrás recuperarlos.', 'Borrar todo');
          if (!r.ok) return;
          const c = db.carrera, ini = db.inicio; db = nuevoDB(); db.carrera = c; db.inicio = ini; db.importadoViejo = true; guardar(false); volverA(0); render(); toast('Datos borrados');
        }
      });
    });
  }
  function aplicarTema(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', (t === 'dark' || (t !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)) ? '#2a1840' : '#7e22ce');
  }

  // ---------- Archivos: compartir o descargar ----------
  async function guardarArchivo(blob, nombre, compartir, titulo) {
    let file;
    try { file = new File([blob], nombre, { type: blob.type }); } catch (e) { file = blob; }
    if (compartir && navigator.canShare && file instanceof File && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: titulo || nombre }); return true; }
      catch (e) { if (e && e.name === 'AbortError') return false; }
    }
    try {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      if (compartir) toast('Este navegador no deja compartir; la copia se ha descargado');
      return true;
    } catch (e) { toast('No se ha podido guardar el archivo'); return false; }
  }
  async function exportar(compartir) {
    const json = JSON.stringify({ app: 'hyroxnena', version: VERSION, exportado: new Date().toISOString(), datos: db }, null, 1);
    const ok = await guardarArchivo(new Blob([json], { type: 'application/json' }), `hyroxnena-${hoyISO()}.json`, compartir, `Copia HYROXNENA del ${fmtFecha(hoyISO())}`);
    if (ok) { db.ultimaCopia = new Date().toISOString(); guardar(false); render(); toast('Copia hecha ♥'); }
  }
  $('#fileIn').addEventListener('change', async e => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    let datos;
    try {
      const o = JSON.parse(await file.text());
      if (o && o.datos) datos = o.datos;
      else if (o && o.state && Array.isArray(o.state.logs)) datos = desdeViejo(o.state); // copia de la versión anterior
      if (!datos || !Array.isArray(datos.registros)) throw new Error();
    } catch (err) { toast('Ese archivo no es una copia de HYROXNENA'); return; }
    const r = await confirmar('¿Importar esta copia?', `La copia tiene <b>${datos.registros.length} entrenos</b>. Sustituirá a lo que hay ahora en este móvil (${db.registros.length} entrenos).`, 'Importar');
    if (!r.ok) return;
    db = normalizar(datos); db.ultimaCopia = new Date().toISOString(); db.importadoViejo = true; guardar(false); volverA(0); render(); toast('Copia importada');
  });

  // ---------- Entrenos de la primera versión de la app ----------
  function leerViejo() { try { const s = localStorage.getItem(CLAVE_VIEJA); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function hayDatosViejos() { const v = leerViejo(); return !!(v && Array.isArray(v.logs) && v.logs.length); }
  function desdeViejo(v) {
    const d = nuevoDB();
    if (v.raceDate) d.carrera.fecha = v.raceDate;
    if (v.raceCity) d.carrera.ciudad = v.raceCity;
    if (v.startDate) d.inicio = lunesDe(v.startDate);
    const T = { run: 'carrera', strength: 'fuerza', stations: 'mixta', full: 'simulacion', other: 'otro' };
    d.registros = (v.logs || []).filter(l => l && l.date).map(l => {
      const r = { id: uid(), fecha: l.date, semana: null, dia: null, tipo: T[l.type] || 'otro' };
      r.titulo = (l.planRef && l.planRef.name) || TIPOS[r.tipo].n;
      if (l.distance) r.km = +l.distance;
      if (l.totalSecs && l.type !== 'full') r.seg = +l.totalSecs;
      if (l.type === 'full' && l.totalSecs) { r.total = r.totalReloj = +l.totalSecs; r.splits = { run: Array(8).fill(null), est: Array(8).fill(null) }; }
      const notas = [l.notes || ''];
      if (l.stations && typeof l.stations === 'object') notas.push(Object.entries(l.stations).map(([k, s]) => `${k}: ${fmtT(s)}`).join(', '));
      if (l.exercises && !l.exercisesData) notas.push(l.exercises);
      r.notas = notas.filter(Boolean).join('\n');
      if (Array.isArray(l.exercisesData)) {
        const ID = { squat: 'sentadilla', deadlift: 'peso-muerto', bench: 'press-banca', 'bb-row': 'remo-barra', 'db-row': 'remo-mancuerna', 'db-lunge': 'zancadas', pushup: 'flexiones', 'box-jump': 'box-jump', 'st-row': 'st-remo', 'st-wallball': 'st-wallballs' };
        r.ejercicios = l.exercisesData.map(e => ({ id: ID[e.id] || e.id, n: e.name, s: e.sets, r: String(e.reps), rpe: e.rpe, u: e.unit, sinPeso: !!e.noW, pesos: e.weights || [], rpeReal: e.rpeReal || '' }));
      }
      return r;
    });
    return d;
  }
  async function traerViejos() {
    const v = leerViejo(); if (!v) return;
    const nuevos = desdeViejo(v).registros;
    const r = await confirmar('¿Traer los entrenos anteriores?', `Hay <b>${nuevos.length} entrenos</b> de la versión anterior. Se añadirán a los que ya tienes.`, 'Traerlos');
    if (!r.ok) return;
    const ya = new Set(db.registros.map(x => x.fecha + '|' + x.titulo));
    nuevos.forEach(x => { if (!ya.has(x.fecha + '|' + x.titulo)) db.registros.push(x); });
    db.importadoViejo = true; guardar(); render(); toast(`${nuevos.length} entrenos traídos`);
  }

  // ---------- Eventos ----------
  const acciones = {
    registrar: b => formRegistro({ sem: +b.dataset.sem, dia: +b.dataset.dia }),
    registrarHoy: () => formRegistro({}),
    registrarLibre: () => formRegistro({ fecha: ui.diaHoy || hoyISO(), libre: true }),
    editReg: b => formRegistro({ id: b.dataset.id }),
    verDia: b => { ui.diaHoy = b.dataset.f; render(); },
    semana: b => { ui.semanaPlan = +b.dataset.n; render(); },
    compartirCopia: () => exportar(true),
    traerViejos: () => traerViejos(),
    ajustes: () => hojaAjustes()
  };
  function irTab(t) { volverA(0); ui.tab = t; if (t === 'hoy') ui.diaHoy = null; render(); window.scrollTo(0, 0); }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (b && acciones[b.dataset.act]) acciones[b.dataset.act](b);
  });
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => irTab(b.dataset.tab)));
  $('#main').addEventListener('change', e => {
    if (e.target.id === 'ejProgreso') { ui.ejProgreso = e.target.value; render(); }
    if (e.target.dataset.obj) {
      const v = parseT(e.target.value);
      if (Number.isNaN(v)) { toast('Escribe el tiempo como «4.35»'); return; }
      db.objetivo[e.target.dataset.obj] = v || null; guardar();
      e.target.value = v ? fmtT(v) : '';
      $('#objTotal').textContent = fmtT(totalObjetivo());
    }
  });
  $('#cfgBtn').addEventListener('click', hojaAjustes);
  $('#cuentaBtn').addEventListener('click', () => irTab('carrera'));

  let toastT;
  function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2600); }

  // ---------- Arranque ----------
  try { aplicarTema(localStorage.getItem(KEY + '.tema') || 'auto'); } catch (e) { /* ignorar */ }
  // Primera vez con datos de la versión anterior: se trae su fecha de inicio del plan
  if (primeraVez) { const v = leerViejo(); if (v && v.startDate) db.inicio = lunesDe(v.startDate); if (v && v.raceDate) db.carrera.fecha = v.raceDate === '2027-03-13' ? CARRERA_DEF.fecha : v.raceDate; guardar(false); }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignorar */ }
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
      }).catch(() => {});
    });
    // Cuando llega una versión nueva se recarga sola, pero nunca con un formulario abierto
    let habia = !!navigator.serviceWorker.controller, recargando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!habia) { habia = true; return; }
      if (recargando) return; recargando = true;
      const intentar = () => { if (!capas.length) { try { sessionStorage.setItem(KEY + '.actualizada', '1'); } catch (e) { /* ignorar */ } location.reload(); } else setTimeout(intentar, 1500); };
      intentar();
    });
    try { if (sessionStorage.getItem(KEY + '.actualizada')) { sessionStorage.removeItem(KEY + '.actualizada'); setTimeout(() => toast(`App actualizada a la versión ${VERSION}`), 400); } } catch (e) { /* ignorar */ }
  }
  // Para las pruebas
  window.__hyrox = { get db() { return db; }, sesionesSemana, totalSemanas, fases, semanaActual, parseT, fmtT };
  render();
})();
