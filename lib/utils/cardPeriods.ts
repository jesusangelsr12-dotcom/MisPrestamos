// Cálculo de periodos de facturación de tarjeta de crédito a partir del día de
// corte y el día límite de pago. Funciones puras, sin dependencias de DB/Next.js.
//
// Convención: un periodo es (corte anterior, corte actual]. El día exacto del
// corte pertenece al periodo que CIERRA ese día, no al que abre (así el gasto
// hecho el mismo día del corte cae en el estado de cuenta que se genera ese día).

export interface BillingPeriod {
  start: string; // YYYY-MM-DD, primer día del periodo
  end: string; // YYYY-MM-DD, día de corte (incluido en el periodo)
  dueDate: string; // YYYY-MM-DD, fecha límite de pago de este periodo
}

interface YearMonth {
  year: number;
  month: number; // 1-12
}

function daysInMonth(year: number, month: number): number {
  // new Date(year, month, 0) da el último día del mes `month` (1-based),
  // porque el parámetro de mes de Date es 0-based: month=2 (febrero) como
  // índice 0-based es marzo, y el día 0 de marzo es el último día de febrero.
  return new Date(year, month, 0).getDate();
}

function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (((total % 12) + 12) % 12) + 1 };
}

// Construye una fecha para (year, month, day), recortando `day` al último día
// real del mes si no existe (ej. día 31 en un mes de 30, o 29 de feb en año no bisiesto).
function clampedDate(year: number, month: number, day: number): Date {
  const clampedDay = Math.min(day, daysInMonth(year, month));
  return new Date(year, month - 1, clampedDay);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

// Formatea en componentes locales (no UTC) para evitar que toISOString()
// recorra al día anterior en zonas horarias con offset negativo.
function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Parsea "YYYY-MM-DD" como fecha local (evita el corrimiento de un día que
// causa `new Date("YYYY-MM-DD")`, que interpreta el string como UTC medianoche).
export function parseYMD(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function cutOffDateFor(cutOffDay: number, ym: YearMonth): Date {
  return clampedDate(ym.year, ym.month, cutOffDay);
}

// La fecha límite de pago de un periodo que cierra en `periodEndYM`:
// - si paymentDueDay > cutOffDay: cae en el mismo mes del corte.
// - si paymentDueDay <= cutOffDay: cae el mes siguiente (el caso típico de
//   tarjetas de crédito: corte día 20, límite de pago día 5 del mes que sigue).
//   El caso de igualdad se manda al mes siguiente para nunca vencer antes
//   (o el mismo día) del corte.
function dueDateFor(cutOffDay: number, paymentDueDay: number, periodEndYM: YearMonth): Date {
  const dueYM = paymentDueDay > cutOffDay ? periodEndYM : addMonths(periodEndYM, 1);
  return clampedDate(dueYM.year, dueYM.month, paymentDueDay);
}

function buildPeriod(cutOffDay: number, paymentDueDay: number, periodEndYM: YearMonth): BillingPeriod {
  const end = cutOffDateFor(cutOffDay, periodEndYM);
  const previousCutOff = cutOffDateFor(cutOffDay, addMonths(periodEndYM, -1));
  const start = addDays(previousCutOff, 1);
  const dueDate = dueDateFor(cutOffDay, paymentDueDay, periodEndYM);

  return {
    start: formatYMD(start),
    end: formatYMD(end),
    dueDate: formatYMD(dueDate),
  };
}

// Encuentra el mes/año de corte del periodo vigente para `referenceDate`.
function currentPeriodEndYM(cutOffDay: number, referenceDate: Date): YearMonth {
  const refYM: YearMonth = { year: referenceDate.getFullYear(), month: referenceDate.getMonth() + 1 };
  const cutOffThisMonth = cutOffDateFor(cutOffDay, refYM);

  const refAtMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  // El día del corte pertenece al periodo que cierra ese mismo día.
  if (refAtMidnight.getTime() <= cutOffThisMonth.getTime()) {
    return refYM;
  }
  return addMonths(refYM, 1);
}

// Periodo de facturación vigente para `referenceDate` (normalmente "hoy").
export function getBillingPeriod(
  cutOffDay: number,
  paymentDueDay: number,
  referenceDate: Date
): BillingPeriod {
  const periodEndYM = currentPeriodEndYM(cutOffDay, referenceDate);
  return buildPeriod(cutOffDay, paymentDueDay, periodEndYM);
}

// Periodo desplazado `offset` ciclos de facturación respecto al vigente para
// `referenceDate`. offset=0 es el periodo actual, offset=-1 el anterior,
// offset=1 el siguiente. Los periodos consecutivos no dejan huecos ni se
// traslapan: el `start` de un periodo es siempre `end` del anterior + 1 día.
export function getBillingPeriodByOffset(
  cutOffDay: number,
  paymentDueDay: number,
  referenceDate: Date,
  offset: number
): BillingPeriod {
  const baseEndYM = currentPeriodEndYM(cutOffDay, referenceDate);
  const periodEndYM = addMonths(baseEndYM, offset);
  return buildPeriod(cutOffDay, paymentDueDay, periodEndYM);
}

// Mes calendario (día 1 al último día del mes) desplazado `offset` meses
// respecto al mes de `referenceDate`. Se usa como "periodo" para cuentas sin
// fecha de corte (efectivo, ahorro, inversión, otros), que no tienen un
// concepto de saldo a pagar — solo agrupan movimientos por mes.
export function getCalendarMonthPeriod(referenceDate: Date, offset: number): BillingPeriod {
  const ym = addMonths({ year: referenceDate.getFullYear(), month: referenceDate.getMonth() + 1 }, offset);
  const start = new Date(ym.year, ym.month - 1, 1);
  const end = clampedDate(ym.year, ym.month, daysInMonth(ym.year, ym.month));
  return { start: formatYMD(start), end: formatYMD(end), dueDate: "" };
}

// Cuántos ciclos (meses) separan el mes del `end` de un periodo del `end` de
// otro. Sirve para comparar offsets de periodos distintos sin recalcularlos
// desde cero (ej. saber a qué offset corresponde la fecha de creación de una cuenta).
export function periodMonthsBetween(periodEndA: string, periodEndB: string): number {
  const [ay, am] = periodEndA.split("-").map(Number);
  const [by, bm] = periodEndB.split("-").map(Number);
  return by * 12 + bm - (ay * 12 + am);
}
