// =====================================================
//  Coco Finanzas — lógica de la app (v3)
//  Los datos se guardan en el propio dispositivo (localStorage),
//  por eso funciona sin internet.
// =====================================================

// ---------- 1. Configuración ----------
const CLAVE = 'coco-finanzas-v1';   // nombre con el que se guardan los datos

// Interruptor de la sección de préstamos.
//   false = apagada: no se ve la pestaña, pero tus pagos se registran como gasto "Préstamos"
//   true  = prendida: vuelve la pestaña con el seguimiento de cada préstamo
const MODULO_PRESTAMOS = false;

const TARJETAS = [
  { id: 'nu', nombre: 'Nu', corte: 10, pago: 20 },   // día de corte y día límite de pago
];

const CATEGORIAS_GASTO = {          // categoría: color (tonos pastel)
  Comida: '#a3e635',
  Transporte: '#7dd3fc',
  Salidas: '#fdba74',
  Suscripciones: '#c4b5fd',
  Escuela: '#fde047',
  Compras: '#f9a8d4',
  Salud: '#5eead4',
  Préstamos: '#93c5fd',
  Otros: '#d1d5db',
};
const CATEGORIAS_INGRESO = ['Trabajo', 'Familia', 'Ventas', 'Préstamos', 'Otro'];

const METODOS = { efectivo: 'Efectivo', debito: 'Débito', nu: 'Nu (crédito)' };
const METODOS_PAGO_TARJETA = { debito: 'Débito', efectivo: 'Efectivo' };
const COLORES_AVATAR = ['#d9f99d', '#bae6fd', '#fed7aa', '#ddd6fe', '#fbcfe8', '#99f6e4', '#bfdbfe', '#fef08a'];
const COLOR_NU = { disponible: '#a3e635', actual: '#60a5fa', meses: '#fb923c' };

// ---------- 2. Íconos de línea (en lugar de emojis) ----------
const ICONOS = {
  inicio: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  tarjeta: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
  prestamos: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  historial: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  sube: '<path d="M7 17 17 7M9 7h8v8"/>',
  baja: '<path d="M17 7 7 17M15 17H7V9"/>',
  dinero: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>',
  persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  institucion: '<path d="M3 21h18M4 10h16M12 3 3.5 8h17zM6 10v8M10 10v8M14 10v8M18 10v8"/>',
  ajustes: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  pago: '<path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
};
const ico = n => `<svg class="svg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n]}</svg>`;
const ponerIconos = (raiz = document) => raiz.querySelectorAll('[data-ico]').forEach(el => { el.innerHTML = ico(el.dataset.ico); });
ponerIconos();

// Si la sección de préstamos está apagada, quitamos su pestaña
if (!MODULO_PRESTAMOS) {
  document.querySelector('.tab[data-ir="prestamos"]').remove();
  document.getElementById('vista-prestamos').remove();
}
document.querySelector('.tabbar').style.setProperty('--n', document.querySelectorAll('.tab').length);

// ---------- 3. Guardar y cargar datos ----------
function normalizar(d) {
  d = d || {};
  d.movimientos = d.movimientos || [];
  d.prestamos = d.prestamos || [];
  d.planes = d.planes || [];       // compras a meses
  d.config = d.config || {};       // límite de cada tarjeta
  delete d.pagos;
  return d;
}
function cargar() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(CLAVE)); } catch { /* datos dañados: empezamos de cero */ }
  return normalizar(d);
}
let datos = cargar();
function guardar() { localStorage.setItem(CLAVE, JSON.stringify(datos)); }

// ---------- 4. Ayudantes ----------
const $ = id => document.getElementById(id);
const dinero = n => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const pad = n => String(n).padStart(2, '0');
const aTexto = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // Date -> "2026-11-18"
const deTexto = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const hoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const sumarDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fechaCorta = d => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
const suma = lista => lista.reduce((s, m) => s + m.monto, 0);
const colorDe = cat => CATEGORIAS_GASTO[cat] || '#d1d5db';
const plural = (n, palabra) => `${n} ${palabra}${n === 1 ? '' : 's'}`;
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const casiCero = n => Math.abs(n) < 0.005;
const esTarjeta = metodo => TARJETAS.some(t => t.id === metodo);

function sumarMeses(d, k) {
  const y = d.getFullYear(), m = d.getMonth() + k;
  const ultimoDia = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(d.getDate(), ultimoDia));
}

function animarNumero(el, valor) {
  const desde = Number(el.dataset.valor || 0);
  el.dataset.valor = valor;
  const inicio = performance.now(), duracion = 800;
  function paso(t) {
    const p = Math.min((t - inicio) / duracion, 1);
    const suave = 1 - Math.pow(1 - p, 3);
    el.textContent = dinero(desde + (valor - desde) * suave);
    if (p < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
}

// Barras que se "llenan": cualquier elemento con data-w="porcentaje"
function animarAnchos() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('[data-w]').forEach(el => { el.style.width = el.dataset.w + '%'; });
  }));
}

let temporizadorToast;
function toast(mensaje) {
  const t = $('toast');
  t.textContent = mensaje;
  t.classList.remove('ver');
  void t.offsetWidth;
  t.classList.add('ver');
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => t.classList.remove('ver'), 2600);
}

function confeti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('confeti'), ctx = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const colores = ['#2563eb', '#60a5fa', '#a3e635', '#fdba74', '#fde047', '#c4b5fd', '#f9a8d4'];
  const piezas = Array.from({ length: 150 }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.4,
    vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 5,
    t: Math.random() * 7 + 5, color: colores[Math.floor(Math.random() * colores.length)],
    giro: Math.random() * 6, vg: (Math.random() - 0.5) * 0.35,
  }));
  let cuadros = 0;
  (function animar() {
    ctx.clearRect(0, 0, c.width, c.height);
    piezas.forEach(p => {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.giro += p.vg;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.giro);
      ctx.fillStyle = p.color; ctx.fillRect(-p.t / 2, -p.t / 4, p.t, p.t / 2);
      ctx.restore();
    });
    if (++cuadros < 170) requestAnimationFrame(animar);
    else ctx.clearRect(0, 0, c.width, c.height);
  })();
}

document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn, .btn-sec, .fab, .tab, .filtro');
  if (!b) return;
  const r = b.getBoundingClientRect();
  const tam = Math.max(r.width, r.height);
  const o = document.createElement('span');
  o.className = 'onda';
  o.style.cssText = `width:${tam}px;height:${tam}px;left:${e.clientX - r.left - tam / 2}px;top:${e.clientY - r.top - tam / 2}px`;
  b.appendChild(o);
  setTimeout(() => o.remove(), 650);
});

// ---------- 5. Tarjeta de crédito ----------
// El último periodo que YA cortó
function ultimoCorte(t, ref) {
  let y = ref.getFullYear(), m = ref.getMonth();
  if (ref.getDate() <= t.corte) m -= 1;
  const corte = new Date(y, m, t.corte);
  const inicio = new Date(y, m - 1, t.corte + 1);
  const limitePago = new Date(y, m + (t.pago > t.corte ? 0 : 1), t.pago);
  return { inicio, corte, limitePago };
}
// El corte en el que entra una compra hecha en la fecha d
function corteQueCierra(t, d) {
  return d.getDate() <= t.corte ? new Date(d.getFullYear(), d.getMonth(), t.corte)
                                : new Date(d.getFullYear(), d.getMonth() + 1, t.corte);
}

// --- Compras a meses ---
// Cada plan cobra su mensualidad en los cortes: primerCorte + k meses (k desde "previas" hasta meses-1)
function cuotasCobradas(plan, corte) {
  const inicio = deTexto(plan.primerCorte);
  let n = 0;
  for (let k = plan.previas; k < plan.meses; k++) if (sumarMeses(inicio, k) <= corte) n++;
  return n;
}
function cuotaEnCorte(plan, corte) {
  const inicio = deTexto(plan.primerCorte), objetivo = aTexto(corte);
  for (let k = plan.previas; k < plan.meses; k++) if (aTexto(sumarMeses(inicio, k)) === objetivo) return plan.mensualidad;
  return 0;
}
function estadoPlan(plan, ultCorte) {
  const cobradas = plan.previas + cuotasCobradas(plan, ultCorte);
  const faltan = plan.meses - cobradas;
  return {
    cobradas, faltan, terminado: faltan <= 0,
    restante: Math.max(faltan, 0) * plan.mensualidad,
    proxima: faltan > 0 ? sumarMeses(deTexto(plan.primerCorte), cobradas) : null,
    pct: Math.min(cobradas / plan.meses, 1),
  };
}

function estadoTarjeta(t, h) {
  const ult = ultimoCorte(t, h);
  const C = aTexto(ult.corte);
  const regulares = datos.movimientos.filter(m => m.tipo === 'gasto' && m.metodo === t.id && !m.planId);
  const iniciales = datos.movimientos.filter(m => m.tipo === 'saldoInicial' && m.tarjeta === t.id);
  const pagos = datos.movimientos.filter(m => m.tipo === 'pagoTarjeta' && m.tarjeta === t.id);
  const planes = datos.planes.filter(p => p.tarjeta === t.id);

  const cargos = filtro => suma(regulares.filter(filtro)) + suma(iniciales.filter(filtro));
  const cuotasHastaCorte = planes.reduce((s, p) => s + p.mensualidad * cuotasCobradas(p, ult.corte), 0);

  // Lo que ya facturó el último corte y lo que falta pagar de él
  const facturado = cargos(m => m.fecha <= C) + cuotasHastaCorte;
  const saldoAlCorte = Math.max(facturado - suma(pagos.filter(m => m.fecha <= C)), 0);
  const pagadoDespues = suma(pagos.filter(m => m.fecha > C));
  const pendiente = Math.max(saldoAlCorte - pagadoDespues, 0);

  // Igual que en tu app de Nu: saldo actual + saldo a meses
  const saldoActual = cargos(() => true) + cuotasHastaCorte - suma(pagos);
  const aMeses = planes.reduce((s, p) => s + estadoPlan(p, ult.corte).restante, 0);
  const deuda = saldoActual + aMeses;
  const limite = (datos.config[t.id] || {}).limite || 0;
  const disponible = limite ? limite - Math.max(deuda, 0) : 0;

  const proxCorte = new Date(ult.corte.getFullYear(), ult.corte.getMonth() + 1, t.corte);
  const cuotaProxima = planes.reduce((s, p) => s + cuotaEnCorte(p, proxCorte), 0);
  const actual = cargos(m => m.fecha > C);
  const dias = Math.round((ult.limitePago - h) / 86400000);

  let estado;
  if (casiCero(saldoAlCorte)) estado = 'nada';
  else if (casiCero(pendiente)) estado = 'pagado';
  else if (dias < 0) estado = 'vencido';
  else estado = 'pendiente';

  return {
    ...ult, t, saldoAlCorte, pagadoDespues, pendiente, saldoActual, aMeses, deuda, limite, disponible,
    actual, cuotaProxima, dias, estado, proxCorte,
    inicioActual: sumarDias(ult.corte, 1),
    proxPago: new Date(ult.limitePago.getFullYear(), ult.limitePago.getMonth() + 1, t.pago),
    configurada: limite > 0 || iniciales.length > 0,
    uso: limite ? Math.max(deuda, 0) / limite : 0,
  };
}

// ---------- 6. Préstamos ----------
function estadoPrestamo(p, h) {
  const previos = p.previos || 0;
  const pagado = previos * p.mensualidad + suma(datos.movimientos.filter(m => m.prestamoId === p.id));
  const total = p.mensualidad * p.meses;
  const hechos = Math.min(Math.floor(pagado / p.mensualidad + 1e-6), p.meses);
  const inicio = deTexto(p.inicio);
  let esperados = 0;
  for (let k = 0; k < p.meses; k++) if (sumarMeses(inicio, k) <= h) esperados++;
  const restante = Math.max(total - pagado, 0);
  const terminado = casiCero(restante);
  return {
    pagado, total, hechos, esperados, restante, terminado,
    atrasado: !terminado && hechos < esperados,
    proximo: terminado ? null : sumarMeses(inicio, hechos),
    pct: Math.min(pagado / total, 1),
  };
}

// ---------- 7. Dibujar la pantalla ----------
let filtroHistorial = 'todos';
let estadoNu = null;

function pintar() {
  const h = hoy();
  const mes = aTexto(h).slice(0, 7);
  const hora = new Date().getHours();
  $('saludo').textContent = `${hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'}, Coco`;
  const mesTexto = h.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  $('mes-actual').textContent = mesTexto[0].toUpperCase() + mesTexto.slice(1);

  const delMes = datos.movimientos.filter(m => m.fecha.startsWith(mes));
  const ingresosLista = delMes.filter(m => m.tipo === 'ingreso');
  const gastosLista = delMes.filter(m => m.tipo === 'gasto');
  const ingresos = suma(ingresosLista);
  const gastos = suma(gastosLista);
  const enCredito = suma(gastosLista.filter(m => esTarjeta(m.metodo)));

  animarNumero($('k-ingresos'), ingresos);
  $('k-ingresos-sub').textContent = plural(ingresosLista.length, 'ingreso');
  animarNumero($('k-gastos'), gastos);
  $('k-gastos-sub').textContent = `${dinero(enCredito)} con tarjeta`;
  animarNumero($('k-disponible'), ingresos - gastos);
  $('k-disponible').closest('.kpi').classList.toggle('negativo', ingresos - gastos < 0);

  estadoNu = estadoTarjeta(TARJETAS[0], h);
  pintarDona(gastosLista);
  pintarTarjeta(estadoNu);
  pintarPlanes(estadoNu);
  if (MODULO_PRESTAMOS) pintarPrestamos(h);
  pintarLista($('lista-recientes'), ordenar(datos.movimientos).slice(0, 5));
  pintarLista($('lista-todos'), ordenar(datos.movimientos).filter(m =>
    filtroHistorial === 'todos' ||
    (filtroHistorial === 'prestamos' ? m.categoria === 'Préstamos' : m.tipo === filtroHistorial)));
  pintarConsejo(ingresos, gastos, gastosLista, h);
  animarAnchos();
}

const ordenar = lista => [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);

// ----- Gráfica de dona -----
let categoriaElegida = null;
let datosDona = { total: 0, porCat: {} };

function pintarDona(gastos) {
  const svg = $('dona');
  const total = suma(gastos);
  const r = 50, C = 2 * Math.PI * r;
  const porCat = {};
  gastos.forEach(g => { porCat[g.categoria] = (porCat[g.categoria] || 0) + g.monto; });
  const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
  datosDona = { total, porCat };
  categoriaElegida = null;

  let html = `<circle cx="60" cy="60" r="${r}" stroke="#f1f2f5" style="cursor:default"></circle>`;
  let acumulado = 0;
  cats.forEach(([cat, monto]) => {
    const largo = (monto / total) * C;
    const visible = cats.length > 1 ? Math.max(largo - 1.5, 0.5) : largo;
    html += `<circle cx="60" cy="60" r="${r}" stroke="${colorDe(cat)}" data-cat="${esc(cat)}"
               style="stroke-dasharray:0 ${C};stroke-dashoffset:${-acumulado}" data-largo="${visible}"></circle>`;
    acumulado += largo;
  });
  svg.innerHTML = html;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    svg.querySelectorAll('circle[data-largo]').forEach(c => { c.style.strokeDasharray = `${c.dataset.largo} ${C}`; });
  }));

  $('dona-etq').textContent = 'Gastado este mes';
  animarNumero($('dona-total'), total);

  $('leyenda').innerHTML = cats.length
    ? cats.map(([cat, monto], i) => `
        <li data-cat="${esc(cat)}" style="animation-delay:${i * 60}ms">
          <span class="punto" style="background:${colorDe(cat)}"></span>
          ${esc(cat)}
          <span class="pct">${dinero(monto)} · ${Math.round((monto / total) * 100)}%</span>
        </li>`).join('')
    : '<li style="color:var(--suave);cursor:default">Todavía no hay gastos este mes.</li>';
}

function elegirCategoria(cat) {
  categoriaElegida = categoriaElegida === cat ? null : cat;
  document.querySelectorAll('#dona circle[data-cat], #leyenda li[data-cat]').forEach(el => {
    const esta = el.dataset.cat === categoriaElegida;
    el.classList.toggle('apagado', !!categoriaElegida && !esta);
    el.classList.toggle('elegido', esta);
  });
  if (categoriaElegida) {
    const monto = datosDona.porCat[categoriaElegida];
    $('dona-etq').textContent = `${categoriaElegida} · ${Math.round((monto / datosDona.total) * 100)}%`;
    animarNumero($('dona-total'), monto);
  } else {
    $('dona-etq').textContent = 'Gastado este mes';
    animarNumero($('dona-total'), datosDona.total);
  }
}
document.addEventListener('click', e => {
  const el = e.target.closest('#dona [data-cat], #leyenda [data-cat]');
  if (el) elegirCategoria(el.dataset.cat);
});

// ----- Tarjeta Nu -----
function textoEstado(e) {
  return {
    pagado: 'Pagado ✓',
    nada: 'Sin saldo',
    vencido: `Vencido hace ${plural(-e.dias, 'día')}`,
    pendiente: e.dias === 0 ? 'Pendiente · vence HOY' : `Pendiente · faltan ${plural(e.dias, 'día')}`,
  }[e.estado];
}

// Barra estilo Nu: disponible / saldo actual / a meses
function barraApilada(e, grande = false) {
  const actual = Math.max(e.saldoActual, 0);
  const base = e.limite || (actual + e.aMeses) || 1;
  const partes = [
    [e.limite ? Math.max(e.disponible, 0) : 0, COLOR_NU.disponible],
    [actual, COLOR_NU.actual],
    [e.aMeses, COLOR_NU.meses],
  ].filter(([v]) => v > 0);
  return `<div class="apilada ${grande ? 'grande' : ''}">
    ${partes.map(([v, c]) => `<span style="background:${c}" data-w="${(v / base) * 100}"></span>`).join('')}
  </div>`;
}

function pintarTarjeta(e) {
  // --- mini resumen en Inicio ---
  $('nu-mini').innerHTML = !e.configurada
    ? `<p class="ayuda">Mete tus saldos actuales de Nu (límite, lo que debes y tus compras a meses) para que la app empiece con tus números reales.</p>
       <button class="btn ancho" data-abrir-config>Configurar mi Nu</button>`
    : `<div class="deuda-total"><small>${e.deuda < 0 ? 'Saldo a favor' : 'Deuda total'}</small><b class="num-deuda">$0.00</b></div>
       ${barraApilada(e)}
       <div class="fila-mini">
         <span>Pago del corte: <b>${dinero(e.pendiente)}</b></span>
         <span class="badge ${e.estado}">${textoEstado(e)}</span>
       </div>
       <div class="fila-mini">
         <span>Compras a meses: <b>${dinero(e.aMeses)}</b></span>
         ${e.limite ? `<span style="color:var(--suave)">Usas ${Math.round(e.uso * 100)}% del límite</span>` : ''}
       </div>`;

  // --- pestaña Tarjeta ---
  $('nu-resumen').innerHTML = `
    <div class="deuda-total"><small>${e.deuda < 0 ? 'Saldo a favor' : 'Deuda total en Nu'}</small><b class="num-deuda">$0.00</b></div>
    ${barraApilada(e, true)}
    <ul class="leyenda-nu">
      ${e.limite ? `<li><span class="punto" style="background:${COLOR_NU.disponible}"></span><div><b>${dinero(e.disponible)}</b><small>Límite disponible</small></div>
        <div class="total"><small>Límite total</small><b>${dinero(e.limite)}</b></div></li>` : ''}
      <li style="animation-delay:60ms"><span class="punto" style="background:${COLOR_NU.actual}"></span><div><b>${dinero(e.saldoActual)}</b><small>Saldo actual</small></div></li>
      <li style="animation-delay:120ms"><span class="punto" style="background:${COLOR_NU.meses}"></span><div><b>${dinero(e.aMeses)}</b><small>Saldo a meses</small></div></li>
    </ul>`;

  const parcial = e.pagadoDespues > 0 && e.pendiente > 0
    ? `<small>Llevas ${dinero(e.pagadoDespues)} pagado de ${dinero(e.saldoAlCorte)}</small>` : '';
  $('nu-bloques').innerHTML = `
    <div class="bloque" style="--d:1">
      <div class="etq">Pago del corte del ${fechaCorta(e.corte)}</div>
      <div class="monto">${dinero(e.pendiente)}</div>
      <div class="fila"><span class="badge ${e.estado}">${textoEstado(e)}</span>${parcial}</div>
      <small>Fecha límite de pago: ${fechaCorta(e.limitePago)}</small>
    </div>
    <div class="bloque" style="--d:2">
      <div class="etq">Próximo corte · ${fechaCorta(e.proxCorte)}</div>
      <div class="monto">${dinero(e.actual + e.cuotaProxima)}</div>
      <small>${dinero(e.actual)} de compras desde el ${fechaCorta(e.inicioActual)}${e.cuotaProxima ? ` + ${dinero(e.cuotaProxima)} de mensualidades a meses` : ''}</small>
      <small>Lo pagas antes del ${fechaCorta(e.proxPago)}</small>
    </div>`;

  document.querySelectorAll('.num-deuda').forEach(el => {
    el.dataset.valor = $('k-deuda').dataset.valor || 0;
    animarNumero(el, Math.abs(e.deuda));
  });

  animarNumero($('k-deuda'), Math.max(e.deuda, 0));
  $('k-deuda-sub').textContent =
    e.estado === 'pendiente' ? `paga ${dinero(e.pendiente)} antes del ${fechaCorta(e.limitePago)}` :
    e.estado === 'vencido' ? 'tienes un pago vencido' :
    e.deuda < 0 ? `saldo a favor ${dinero(-e.deuda)}` : 'al corriente ✓';
}

function pintarPlanes(e) {
  const planes = datos.planes.filter(p => p.tarjeta === e.t.id)
    .map(p => ({ p, s: estadoPlan(p, e.corte) }))
    .sort((a, b) => a.s.terminado - b.s.terminado || b.p.id - a.p.id);

  $('lista-planes').innerHTML = planes.length ? planes.map(({ p, s }, i) => `
    <div class="plan ${s.terminado ? 'terminado' : ''}" style="animation-delay:${i * 60}ms">
      <div class="plan-top">
        <i class="ico">${ico('calendario')}</i>
        <div><b>${esc(p.descripcion)}</b><small>${dinero(p.mensualidad)} al mes · ${s.cobradas} de ${p.meses}</small></div>
        <span class="badge ${s.terminado ? 'terminado' : 'nada'}">${s.terminado ? 'Terminado' : `Faltan ${dinero(s.restante)}`}</span>
      </div>
      <div class="barra durazno"><span data-w="${s.pct * 100}"></span></div>
      <div class="p-pie" style="margin-top:8px">
        <small>${s.terminado ? 'Ya no te cobra nada' : `Próxima mensualidad: corte del ${fechaCorta(s.proxima)}`}</small>
        <button class="borrar" data-borrar-plan="${p.id}" aria-label="Borrar">${ico('cerrar')}</button>
      </div>
    </div>`).join('')
    : `<div class="vacio-grande">${ico('calendario')}No tienes compras a meses registradas.</div>`;
}

$('lista-planes').addEventListener('click', e => {
  const b = e.target.closest('[data-borrar-plan]');
  if (!b) return;
  const id = Number(b.dataset.borrarPlan);
  const plan = datos.planes.find(p => p.id === id);
  const conCompra = plan.movId && datos.movimientos.some(m => m.id === plan.movId);
  if (!confirm(`¿Borrar "${plan.descripcion}"?${conCompra ? ' También se borrará la compra de tu historial.' : ''}`)) return;
  datos.planes = datos.planes.filter(p => p.id !== id);
  if (conCompra) datos.movimientos = datos.movimientos.filter(m => m.id !== plan.movId);
  guardar(); pintar(); toast('Compra a meses borrada');
});

// ----- Préstamos -----
function pintarPrestamos(h) {
  const lista = datos.prestamos.map(p => ({ p, e: estadoPrestamo(p, h) }));
  const debo = lista.filter(x => x.p.direccion === 'debo');
  const meDeben = lista.filter(x => x.p.direccion === 'medeben');
  const restante = arr => arr.reduce((s, x) => s + x.e.restante, 0);
  const activos = arr => arr.filter(x => !x.e.terminado).length;
  const textoActivos = n => `${n} ${n === 1 ? 'préstamo activo' : 'préstamos activos'}`;

  animarNumero($('k-debo'), restante(debo));
  $('k-debo-sub').textContent = textoActivos(activos(debo));
  animarNumero($('k-medeben'), restante(meDeben));
  $('k-medeben-sub').textContent = textoActivos(activos(meDeben));

  if (!lista.length) {
    $('lista-prestamos').innerHTML = `<div class="vacio-grande">${ico('prestamos')}No tienes préstamos registrados.<br>Toca "Nuevo préstamo" para agregar uno.</div>`;
    return;
  }

  lista.sort((a, b) => a.e.terminado - b.e.terminado || a.p.id - b.p.id);
  $('lista-prestamos').innerHTML = lista.map(({ p, e }, i) => {
    const yoDebo = p.direccion === 'debo';
    const esInstitucion = p.clase === 'institucion';
    const color = COLORES_AVATAR[[...p.persona].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORES_AVATAR.length];
    const [clase, texto] = e.terminado ? ['terminado', 'Liquidado'] : e.atrasado ? ['atrasado', 'Atrasado'] : ['corriente', 'Al corriente'];
    return `
      <article class="prestamo ${p.direccion} ${e.terminado ? 'terminado' : ''}" style="--d:${i}">
        <div class="p-top">
          <span class="avatar" style="background:${color}">${ico(esInstitucion ? 'institucion' : 'persona')}</span>
          <div>
            <b>${esc(p.persona)}</b>
            <small>${yoDebo ? 'Le debo' : 'Me debe'} · ${dinero(p.mensualidad)} al mes</small>
          </div>
          <span class="badge ${clase}">${texto}</span>
        </div>
        <div class="barra"><span data-w="${e.pct * 100}"></span></div>
        <div class="p-datos">
          <span>${e.hechos} de ${p.meses} pagos</span>
          <span>Faltan <b>${dinero(e.restante)}</b></span>
        </div>
        <div class="p-pie">
          <small>${e.terminado ? `Total: ${dinero(e.total)}` : `Próximo pago: ${fechaCorta(e.proximo)}`}</small>
          <div>
            ${e.terminado ? '' : `<button class="btn chico" data-pagar-prestamo="${p.id}">${yoDebo ? 'Registrar pago' : 'Registrar cobro'}</button>`}
            <button class="borrar" data-borrar-prestamo="${p.id}" aria-label="Borrar préstamo">${ico('cerrar')}</button>
          </div>
        </div>
      </article>`;
  }).join('');
}

if (MODULO_PRESTAMOS) $('lista-prestamos').addEventListener('click', e => {
  const pagar = e.target.closest('[data-pagar-prestamo]');
  const borrar = e.target.closest('[data-borrar-prestamo]');
  if (pagar) {
    const p = datos.prestamos.find(x => x.id === Number(pagar.dataset.pagarPrestamo));
    const yoDebo = p.direccion === 'debo';
    abrirFormulario({
      tipo: yoDebo ? 'gasto' : 'ingreso', categoria: 'Préstamos', prestamo: p.id,
      monto: p.mensualidad, nota: `${yoDebo ? 'Pago a' : 'Cobro a'} ${p.persona}`,
    });
  }
  if (borrar) {
    const id = Number(borrar.dataset.borrarPrestamo);
    const p = datos.prestamos.find(x => x.id === id);
    if (!confirm(`¿Borrar el préstamo con ${p.persona}? (los pagos que ya registraste se quedan en tu historial)`)) return;
    datos.prestamos = datos.prestamos.filter(x => x.id !== id);
    guardar(); pintar(); toast('Préstamo borrado');
  }
});

// ----- Listas de movimientos -----
function pintarLista(ul, items) {
  if (!items.length) {
    ul.innerHTML = '<li class="vacio">Aún no hay movimientos. Toca el botón + para agregar.</li>';
    return;
  }
  ul.innerHTML = items.map((m, i) => {
    let color, inicial, titulo, detalle, signo, clase;
    const t = TARJETAS.find(x => x.id === (m.tarjeta || m.metodo));
    if (m.tipo === 'pagoTarjeta') {
      color = '#e0eaff'; inicial = ico('pago'); titulo = `Pago a ${t ? t.nombre : 'tarjeta'}`;
      detalle = ['desde ' + METODOS_PAGO_TARJETA[m.metodo], m.nota];
      signo = ''; clase = 'neutro';
    } else if (m.tipo === 'saldoInicial') {
      color = '#f3f4f6'; inicial = ico('tarjeta'); titulo = `Saldo inicial ${t ? t.nombre : ''}`;
      detalle = [m.nota]; signo = ''; clase = 'neutro';
    } else {
      const esGasto = m.tipo === 'gasto';
      const plan = m.planId && datos.planes.find(p => p.id === m.planId);
      color = esGasto ? colorDe(m.categoria) : '#d9f99d';
      inicial = esc(m.categoria[0]); titulo = esc(m.categoria);
      detalle = [esGasto ? METODOS[m.metodo] : 'Ingreso', plan ? `a ${plan.meses} meses` : '', m.nota];
      signo = esGasto ? '−' : '+'; clase = esGasto ? '' : 'mas';
    }
    const texto = [fechaCorta(deTexto(m.fecha)), ...detalle].filter(Boolean).map(esc).join(' · ');
    return `
      <li style="animation-delay:${Math.min(i, 12) * 35}ms">
        <span class="punto" style="background:${color}">${inicial}</span>
        <div class="info"><b>${titulo}</b><small>${texto}</small></div>
        <span class="monto ${clase}">${signo}${dinero(m.monto)}</span>
        <button class="borrar" data-id="${m.id}" aria-label="Borrar">${ico('cerrar')}</button>
      </li>`;
  }).join('');
}

document.addEventListener('click', e => {
  const b = e.target.closest('.lista .borrar');
  if (!b || !confirm('¿Borrar este movimiento?')) return;
  b.closest('li').classList.add('saliendo');
  setTimeout(() => {
    const id = Number(b.dataset.id);
    datos.movimientos = datos.movimientos.filter(m => m.id !== id);
    datos.planes = datos.planes.filter(p => p.movId !== id);   // si era compra a meses, se va su plan
    guardar(); pintar(); toast('Movimiento borrado');
  }, 280);
});

$('filtros').addEventListener('click', e => {
  const f = e.target.closest('.filtro');
  if (!f) return;
  filtroHistorial = f.dataset.filtro;
  document.querySelectorAll('.filtro').forEach(x => x.classList.toggle('activo', x === f));
  pintar();
});

// ----- El consejo del coco -----
function pintarConsejo(ingresos, gastos, gastosLista, h) {
  const n = estadoNu;
  const atrasado = MODULO_PRESTAMOS && datos.prestamos.find(p => p.direccion === 'debo' && estadoPrestamo(p, h).atrasado);
  let msg;
  if (!n.configurada && !datos.movimientos.length) msg = '¡Hola! Primero configura tu Nu con tus saldos actuales y luego registra tus gastos con el botón +.';
  else if (n.estado === 'vencido') msg = `¡Ojo! Tu pago de Nu de ${dinero(n.pendiente)} está vencido. Págalo lo antes posible.`;
  else if (n.estado === 'pendiente' && n.dias <= 3) msg = `Tu Nu vence ${n.dias === 0 ? 'HOY' : `en ${plural(n.dias, 'día')}`}: paga ${dinero(n.pendiente)} para no generar intereses.`;
  else if (atrasado) msg = `Vas atrasado con el préstamo de ${atrasado.persona}. Registra el pago cuando lo hagas.`;
  else if (n.limite && n.uso >= 0.7) msg = `Ya usas ${Math.round(n.uso * 100)}% de tu límite de Nu. Trata de no usarla hasta bajarle.`;
  else if (gastos > ingresos && ingresos > 0) msg = `Este mes llevas gastado ${dinero(gastos - ingresos)} más de lo que entró. ¡A frenarle tantito!`;
  else if (gastosLista.length) {
    const porCat = {};
    gastosLista.forEach(g => { porCat[g.categoria] = (porCat[g.categoria] || 0) + g.monto; });
    const [cat, monto] = Object.entries(porCat).sort((a, b) => b[1] - a[1])[0];
    msg = `Donde más gastas este mes es en ${cat}: ${Math.round((monto / gastos) * 100)}% de tus gastos.`;
  } else msg = '¡Vas muy bien! Sigue anotando todo lo que gastas.';

  const p = $('consejo-texto');
  if (p.textContent !== msg) {
    p.textContent = msg;
    p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop');
  }
}

// ---------- 8. Pestañas ----------
function irA(vista) {
  document.querySelectorAll('.vista').forEach(v => v.classList.toggle('activa', v.id === 'vista-' + vista));
  document.querySelectorAll('.tab').forEach((b, i) => {
    const activa = b.dataset.ir === vista;
    b.classList.toggle('activa', activa);
    if (activa) document.querySelector('.tabbar').style.setProperty('--i', i);
  });
  pintar();   // para que barras y números se vuelvan a animar
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ir]');
  if (b) irA(b.dataset.ir);
});

// ---------- 9. Ventanas ----------
function cerrar(dialogo) {
  dialogo.classList.add('cerrando');
  setTimeout(() => { dialogo.classList.remove('cerrando'); dialogo.close(); }, 230);
}
document.querySelectorAll('[data-cerrar]').forEach(b => { b.onclick = () => cerrar(b.closest('dialog')); });
document.querySelectorAll('dialog').forEach(d => {
  d.addEventListener('click', e => {
    if (e.target !== d) return;
    const r = d.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cerrar(d);
  });
});

// ----- Formulario de movimiento -----
const modal = $('modal');
const form = $('form');
const opciones = obj => Object.entries(obj).map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
form.tarjeta.innerHTML = TARJETAS.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');

function actualizarFormulario(soloDetalles = false) {
  const tipo = form.tipo.value;
  if (!soloDetalles) {
    const cats = tipo === 'gasto' ? Object.keys(CATEGORIAS_GASTO) : tipo === 'ingreso' ? CATEGORIAS_INGRESO : [];
    form.categoria.innerHTML = cats.map(c => `<option>${c}</option>`).join('');
    form.metodo.innerHTML = opciones(tipo === 'pagoTarjeta' ? METODOS_PAGO_TARJETA : METODOS);
  }
  $('campo-categoria').hidden = tipo === 'pagoTarjeta';
  $('campo-tarjeta').hidden = tipo !== 'pagoTarjeta';
  $('campo-metodo').hidden = tipo === 'ingreso';
  $('ayuda-pago').hidden = tipo !== 'pagoTarjeta';
  $('metodo-etq').textContent = tipo === 'pagoTarjeta' ? '¿De dónde salió el dinero?' : '¿Con qué pagaste?';

  // "¿A meses?" solo si pagas con tarjeta de crédito
  const conTarjeta = tipo === 'gasto' && esTarjeta(form.metodo.value);
  $('campo-msi').hidden = !conTarjeta;
  if (!conTarjeta) form.msi.value = '1';
  const meses = Number(form.msi.value), monto = parseFloat(form.monto.value) || 0;
  $('ayuda-msi').hidden = !(conTarjeta && meses > 1);
  $('ayuda-msi').textContent = `Serían ${meses} mensualidades de ${dinero(monto / meses)}. En tus gastos del mes cuenta completo, pero a la tarjeta se le carga mes por mes.`;

  // Si la categoría es "Préstamos", preguntamos de cuál
  const esPrestamo = tipo !== 'pagoTarjeta' && form.categoria.value === 'Préstamos';
  form.nota.placeholder = esPrestamo ? 'Ej. Pago a Mercado Pago' : 'Ej. tacos con amigos';
  const mostrar = MODULO_PRESTAMOS && esPrestamo;
  $('campo-prestamo').hidden = !mostrar;
  if (mostrar) {
    const dir = tipo === 'gasto' ? 'debo' : 'medeben';
    const anterior = form.prestamo.value;
    form.prestamo.innerHTML = '<option value="">— Ninguno —</option>' +
      datos.prestamos.filter(p => p.direccion === dir && !estadoPrestamo(p, hoy()).terminado)
        .map(p => `<option value="${p.id}">${esc(p.persona)}</option>`).join('');
    form.prestamo.value = anterior;
    if (form.prestamo.selectedIndex < 0) form.prestamo.value = '';
  }
}

function abrirFormulario(pre = {}) {
  form.reset();
  form.tipo.value = pre.tipo || 'gasto';
  form.fecha.value = aTexto(hoy());
  actualizarFormulario();
  if (pre.categoria) { form.categoria.value = pre.categoria; actualizarFormulario(true); }
  if (pre.prestamo) form.prestamo.value = pre.prestamo;
  if (pre.monto) form.monto.value = Math.round(pre.monto * 100) / 100;
  if (pre.nota) form.nota.value = pre.nota;
  actualizarFormulario(true);
  modal.showModal();
}

$('btn-agregar').onclick = () => abrirFormulario();
document.addEventListener('click', e => {
  if (e.target.closest('[data-pagar-tarjeta]'))
    abrirFormulario({ tipo: 'pagoTarjeta', monto: estadoNu.pendiente || Math.max(estadoNu.saldoActual, 0) });
  if (e.target.closest('[data-abrir-config]')) abrirConfig();
});

form.addEventListener('change', e => {
  if (e.target.name === 'tipo') actualizarFormulario();
  else actualizarFormulario(true);
});
form.monto.addEventListener('input', () => actualizarFormulario(true));

form.addEventListener('submit', e => {
  e.preventDefault();
  const monto = parseFloat(form.monto.value);
  if (!(monto > 0)) return;
  const tipo = form.tipo.value;
  const h = hoy();
  const mov = { id: Date.now(), tipo, monto, fecha: form.fecha.value, nota: form.nota.value.trim() };

  if (tipo === 'pagoTarjeta') {
    mov.tarjeta = form.tarjeta.value;
    mov.metodo = form.metodo.value;
    mov.categoria = 'Pago tarjeta';
  } else {
    mov.categoria = form.categoria.value;
    mov.metodo = tipo === 'gasto' ? form.metodo.value : null;
    if (mov.categoria === 'Préstamos' && form.prestamo.value) mov.prestamoId = Number(form.prestamo.value);
  }

  const tarjeta = TARJETAS.find(t => t.id === (mov.tarjeta || mov.metodo));
  const antesTarjeta = tarjeta ? estadoTarjeta(tarjeta, h) : null;
  const prestamo = datos.prestamos.find(p => p.id === mov.prestamoId);
  const antesPrestamo = prestamo ? estadoPrestamo(prestamo, h) : null;

  // Compra nueva a meses: creamos su plan
  const meses = Number(form.msi.value);
  if (tipo === 'gasto' && tarjeta && meses > 1) {
    const plan = {
      id: mov.id + 1, tarjeta: tarjeta.id, movId: mov.id,
      descripcion: mov.nota || mov.categoria, mensualidad: monto / meses, meses, previas: 0,
      primerCorte: aTexto(corteQueCierra(tarjeta, deTexto(mov.fecha))),
    };
    mov.planId = plan.id;
    datos.planes.push(plan);
  }

  datos.movimientos.push(mov);
  guardar();
  cerrar(modal);
  pintar();

  if (tipo === 'pagoTarjeta') {
    const ahora = estadoTarjeta(tarjeta, h);
    if (antesTarjeta.estado !== 'pagado' && ahora.estado === 'pagado') { confeti(); toast(`¡Pagaste tu corte de ${tarjeta.nombre}!`); }
    else toast(`Pago guardado · tu saldo actual es ${dinero(ahora.saldoActual)}`);
  } else if (prestamo) {
    const ahora = estadoPrestamo(prestamo, h);
    if (!antesPrestamo.terminado && ahora.terminado) { confeti(); toast(`¡Préstamo con ${prestamo.persona} liquidado!`); }
    else toast(`Pago guardado · van ${ahora.hechos} de ${prestamo.meses}`);
  } else if (tipo === 'gasto' && tarjeta) {
    toast(meses > 1 ? `Compra a ${meses} meses guardada` : `Gasto guardado · debes ${dinero(estadoTarjeta(tarjeta, h).deuda)} en ${tarjeta.nombre}`);
  } else {
    toast(tipo === 'gasto' ? 'Gasto guardado ✓' : 'Ingreso guardado ✓');
  }
});

// ----- Configurar tarjeta (saldos iniciales) -----
const modalConfig = $('modal-config');
const formConfig = $('form-config');

function abrirConfig() {
  const t = TARJETAS[0], h = hoy();
  const ult = ultimoCorte(t, h);
  const iniciales = datos.movimientos.filter(m => m.tipo === 'saldoInicial' && m.tarjeta === t.id);
  formConfig.limite.value = (datos.config[t.id] || {}).limite || '';
  formConfig.saldoCorte.value = suma(iniciales.filter(m => m.parte === 'corte')) || 0;
  formConfig.saldoPeriodo.value = suma(iniciales.filter(m => m.parte === 'periodo')) || 0;
  $('etq-corte').textContent = `Lo que te falta pagar del corte del ${fechaCorta(ult.corte)} (límite ${fechaCorta(ult.limitePago)})`;
  $('etq-periodo').textContent = `Lo que llevas gastado del ${fechaCorta(sumarDias(ult.corte, 1))} a hoy (sin contar compras a meses)`;
  actualizarConfig();
  modalConfig.showModal();
}
function actualizarConfig() {
  const s = (parseFloat(formConfig.saldoCorte.value) || 0) + (parseFloat(formConfig.saldoPeriodo.value) || 0);
  $('config-suma').textContent = `Saldo actual: ${dinero(s)} (debe coincidir con el "Saldo actual" de tu app de Nu)`;
}
formConfig.addEventListener('input', actualizarConfig);

formConfig.addEventListener('submit', e => {
  e.preventDefault();
  const t = TARJETAS[0], h = hoy();
  const ult = ultimoCorte(t, h);
  const corte = parseFloat(formConfig.saldoCorte.value) || 0;
  const periodo = parseFloat(formConfig.saldoPeriodo.value) || 0;
  datos.config[t.id] = { limite: parseFloat(formConfig.limite.value) || 0 };
  datos.movimientos = datos.movimientos.filter(m => !(m.tipo === 'saldoInicial' && m.tarjeta === t.id));
  const base = Date.now();
  if (corte > 0) datos.movimientos.push({ id: base, tipo: 'saldoInicial', parte: 'corte', tarjeta: t.id, monto: corte, fecha: aTexto(ult.corte), categoria: 'Saldo inicial', nota: 'Del corte ya cerrado' });
  if (periodo > 0) datos.movimientos.push({ id: base + 1, tipo: 'saldoInicial', parte: 'periodo', tarjeta: t.id, monto: periodo, fecha: aTexto(h), categoria: 'Saldo inicial', nota: 'Gastado después del corte' });
  guardar();
  cerrar(modalConfig);
  pintar();
  toast(`${t.nombre} configurada ✓`);
});

// ----- Compra a meses que ya tenías -----
const modalPlan = $('modal-plan');
const formPlan = $('form-plan');

function actualizarPlan() {
  const mensualidad = parseFloat(formPlan.mensualidad.value) || 0;
  const meses = parseInt(formPlan.meses.value) || 0;
  const cobradas = parseInt(formPlan.cobradas.value) || 0;
  const faltan = Math.max(meses - cobradas, 0);
  $('plan-resumen').textContent = `Te faltan ${plural(faltan, 'mensualidad').replace('mensualidads', 'mensualidades')}: ${dinero(faltan * mensualidad)}`;
}
formPlan.addEventListener('input', actualizarPlan);

$('btn-nuevo-plan').onclick = () => {
  formPlan.reset();
  actualizarPlan();
  modalPlan.showModal();
};

formPlan.addEventListener('submit', e => {
  e.preventDefault();
  const t = TARJETAS[0];
  const mensualidad = parseFloat(formPlan.mensualidad.value);
  const meses = parseInt(formPlan.meses.value);
  const cobradas = parseInt(formPlan.cobradas.value);
  if (!(mensualidad > 0) || !(meses >= 2) || !(cobradas >= 0)) return;
  if (cobradas >= meses) { toast('Si ya te cobraron todas, esa compra ya está pagada'); return; }
  const ult = ultimoCorte(t, hoy());
  datos.planes.push({
    id: Date.now(), tarjeta: t.id, descripcion: formPlan.descripcion.value.trim(),
    mensualidad, meses, previas: cobradas,
    // la mensualidad número "cobradas" (contando desde 0) toca en el siguiente corte
    primerCorte: aTexto(sumarMeses(ult.corte, 1 - cobradas)),
  });
  guardar();
  cerrar(modalPlan);
  pintar();
  toast('Compra a meses agregada');
});

// ----- Préstamos -----
const modalPrestamo = $('modal-prestamo');
const formPrestamo = $('form-prestamo');
if (MODULO_PRESTAMOS) {

function actualizarTotalPrestamo() {
  const mensualidad = parseFloat(formPrestamo.mensualidad.value) || 0;
  const meses = parseInt(formPrestamo.meses.value) || 0;
  const previos = parseInt(formPrestamo.previos.value) || 0;
  $('total-prestamo').textContent = `Total: ${dinero(mensualidad * meses)} · te faltan ${dinero(Math.max(meses - previos, 0) * mensualidad)}`;
  formPrestamo.persona.placeholder = formPrestamo.clase.value === 'institucion' ? 'Ej. Mercado Pago' : 'Ej. Tía Lupe';
}
formPrestamo.addEventListener('input', actualizarTotalPrestamo);
formPrestamo.addEventListener('change', actualizarTotalPrestamo);

$('btn-nuevo-prestamo').onclick = () => {
  formPrestamo.reset();
  formPrestamo.inicio.value = aTexto(hoy());
  actualizarTotalPrestamo();
  modalPrestamo.showModal();
};

formPrestamo.addEventListener('submit', e => {
  e.preventDefault();
  const mensualidad = parseFloat(formPrestamo.mensualidad.value);
  const meses = parseInt(formPrestamo.meses.value);
  const previos = parseInt(formPrestamo.previos.value) || 0;
  if (!(mensualidad > 0) || !(meses >= 1)) return;
  if (previos >= meses) { toast('Si ya hiciste todos los pagos, ese préstamo ya está liquidado'); return; }
  datos.prestamos.push({
    id: Date.now(),
    direccion: formPrestamo.direccion.value,
    clase: formPrestamo.clase.value,
    persona: formPrestamo.persona.value.trim(),
    mensualidad, meses, previos,
    inicio: formPrestamo.inicio.value,
  });
  guardar();
  cerrar(modalPrestamo);
  pintar();
  toast('Préstamo agregado');
});
}

// ----- Respaldo: descargar y restaurar -----
const modalAjustes = $('modal-ajustes');
function pintarUltimoRespaldo() {
  const f = datos.config.ultimoRespaldo;
  $('ultimo-respaldo').textContent = f ? `Último respaldo: ${fechaCorta(deTexto(f))}` : 'Todavía no has hecho ningún respaldo';
}
$('btn-ajustes').onclick = () => { pintarUltimoRespaldo(); modalAjustes.showModal(); };

$('btn-respaldar').onclick = () => {
  datos.config.ultimoRespaldo = aTexto(hoy());
  guardar();
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `coco-finanzas-respaldo-${aTexto(hoy())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  pintarUltimoRespaldo();
  toast('Respaldo descargado');
};

$('archivo-respaldo').addEventListener('change', e => {
  const archivo = e.target.files[0];
  e.target.value = '';
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = () => {
    let nuevo;
    try { nuevo = JSON.parse(lector.result); } catch { nuevo = null; }
    if (!nuevo || !Array.isArray(nuevo.movimientos)) { toast('Ese archivo no es un respaldo de Coco Finanzas'); return; }
    if (!confirm(`¿Restaurar este respaldo? (${plural(nuevo.movimientos.length, 'movimiento')}) Lo que tienes ahorita en la app se reemplaza.`)) return;
    datos = normalizar(nuevo);
    guardar();
    cerrar(modalAjustes);
    pintar();
    toast('Respaldo restaurado ✓');
  };
  lector.readAsText(archivo);
});

// ---------- 10. Modo app (funciona sin internet) ----------
// El "service worker" guarda una copia de la app en el cel para abrirla sin internet
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
// Le pedimos al navegador que no borre nuestros datos para liberar espacio
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// ---------- 11. Arrancar ----------
pintar();
