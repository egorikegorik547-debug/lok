// @ts-nocheck
/* ====================== ИКОНКИ ======================
   Векторные иконки вместо эмодзи: предметы, патроны, оружие, мебель, существа и значки интерфейса.
   Все иконки — inline-SVG строки, масштабируются размером шрифта (1em), поэтому работают в любом месте UI.
   ico('имя')      — иконка по ключу (SVG-строка)
   iconizeDom(el)  — заменяет оставшиеся эмодзи в тексте интерфейса на соответствующие иконки
   К звуку этот файл отношения не имеет.
*/

const S = '#aab4be', SD = '#5b6670', SK = '#2e3640', SL = '#d7dee5';
const WOOD = '#a06f3c', WOODD = '#6b4423', BRASS = '#e0b24a', COPPER = '#c9763a', RED = '#d9483b', GREEN = '#6dbd78', PAPER = '#e8e0c8';

const wrap = (inner, cls = 'gi') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
// значок интерфейса: контур цвета текста
const ui = inner => wrap(`<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`, 'gi gu');

// патрон (вертикальный): x — центр, y — верх пули, w — ширина, hCase — высота гильзы, hBul — высота пули
const cart = (x, y, w, hCase, hBul, caseC, bulC, rim = true) => {
  const l = x - w / 2, yc = y + hBul;
  return `<path d="M${l} ${yc}V${y + hBul * 0.55}Q${l} ${y} ${x} ${y}Q${l + w} ${y} ${l + w} ${y + hBul * 0.55}V${yc}Z" fill="${bulC}"/>` +
    `<rect x="${l}" y="${yc}" width="${w}" height="${hCase}" rx=".5" fill="${caseC}"/>` +
    `<rect x="${l}" y="${yc}" width="${w}" height=".9" fill="#000" opacity=".25"/>` +
    (rim ? `<rect x="${l - 0.5}" y="${yc + hCase - 1.1}" width="${w + 1}" height="1.1" rx=".4" fill="${caseC}" stroke="#000" stroke-opacity=".3" stroke-width=".4"/>` : '') +
    `<rect x="${l + w * 0.18}" y="${yc + 1}" width="${w * 0.2}" height="${hCase - 2.2}" fill="#fff" opacity=".28"/>`;
};

const ICONS = {
  /* ---------- предметы ---------- */
  food: wrap(`<ellipse cx="12" cy="18" rx="7" ry="2.4" fill="${SD}"/><rect x="5" y="7" width="14" height="11" fill="${S}"/><ellipse cx="12" cy="7" rx="7" ry="2.4" fill="${SL}"/><rect x="5" y="10.5" width="14" height="5" fill="${RED}"/><circle cx="12" cy="13" r="1.7" fill="${BRASS}"/><rect x="6.2" y="8" width="1.4" height="9" fill="#fff" opacity=".3"/>`),
  meds: wrap(`<rect x="3" y="6" width="18" height="14" rx="2.5" fill="#f1f3f4"/><rect x="3" y="6" width="18" height="3.4" rx="1.7" fill="#cfd6db"/><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1z" fill="${SD}"/><path d="M10.5 11h3v2.5H16v3h-2.5V19h-3v-2.5H8v-3h2.5z" fill="${RED}"/>`),
  band: wrap(`<g transform="rotate(-35 12 12)"><rect x="2" y="8" width="20" height="8" rx="4" fill="#e9c9a0"/><rect x="8.5" y="8" width="7" height="8" fill="#fbf3e6"/><g fill="#c79a66"><circle cx="5" cy="10.5" r=".7"/><circle cx="5" cy="13.5" r=".7"/><circle cx="19" cy="10.5" r=".7"/><circle cx="19" cy="13.5" r=".7"/><circle cx="7.6" cy="12" r=".7"/><circle cx="16.4" cy="12" r=".7"/></g></g>`),
  scrap: wrap(`<g transform="translate(12 12)"><g fill="${S}">${[0, 45, 90, 135].map(a => `<rect x="-2" y="-10" width="4" height="20" rx="1" transform="rotate(${a})"/>`).join('')}<circle r="7.5"/></g><circle r="7.5" fill="none" stroke="${SD}" stroke-width="1.2"/><circle r="3.3" fill="#2a3138"/><circle r="3.3" fill="none" stroke="${SL}" stroke-width=".8"/></g>`),
  wood: wrap(`<rect x="2" y="13" width="20" height="6.5" rx="3.2" fill="${WOOD}"/><ellipse cx="19" cy="16.2" rx="3" ry="3.2" fill="#d9ad74"/><ellipse cx="19" cy="16.2" rx="1.5" ry="1.6" fill="none" stroke="${WOODD}" stroke-width=".8"/><rect x="4" y="5" width="16" height="6.5" rx="3.2" fill="#b98448"/><ellipse cx="17.2" cy="8.2" rx="3" ry="3.2" fill="#e3bb85"/><ellipse cx="17.2" cy="8.2" rx="1.5" ry="1.6" fill="none" stroke="${WOODD}" stroke-width=".8"/><path d="M6 7.4h6M5 15.5h8" stroke="${WOODD}" stroke-width=".8" stroke-linecap="round" opacity=".6"/>`),
  ammo: wrap(cart(8.2, 4, 5, 8, 5, BRASS, COPPER) + cart(15.6, 6.5, 5, 8, 5, BRASS, COPPER)),
  batt: wrap(`<rect x="8" y="2.5" width="8" height="2.6" rx=".8" fill="${SL}"/><rect x="5.5" y="5" width="13" height="17" rx="2.5" fill="#35404a"/><rect x="5.5" y="9" width="13" height="10" fill="${GREEN}"/><path d="M13 9.6l-3.2 5h2.3l-.8 3.6 3.4-5.2h-2.3z" fill="#143d1d"/><rect x="7" y="6.2" width="1.6" height="14" fill="#fff" opacity=".22"/>`),
  key: wrap(`<rect x="2" y="5" width="20" height="14" rx="2.5" fill="#2f6fb0"/><rect x="2" y="8" width="20" height="3" fill="#10243a"/><rect x="4.5" y="13" width="5" height="4" rx=".9" fill="${BRASS}"/><path d="M4.5 15h5M7 13v4" stroke="#8a6a1c" stroke-width=".7"/><rect x="12" y="14" width="7" height="1.2" rx=".6" fill="#9cc4ea"/><rect x="12" y="16.4" width="4.5" height="1.2" rx=".6" fill="#9cc4ea"/>`),
  ammoR: wrap(cart(8, 3, 4.6, 12, 6, BRASS, SL) + cart(15.5, 5, 4.6, 12, 6, BRASS, SL)),
  shells: wrap(`<rect x="3" y="7" width="8" height="14" rx="1.2" fill="${RED}"/><rect x="3" y="18" width="8" height="3" rx="1" fill="${BRASS}"/><rect x="4.2" y="8" width="1.5" height="9" fill="#fff" opacity=".3"/><path d="M3 7a4 1.6 0 0 1 8 0z" fill="#a22b22"/><rect x="13" y="3" width="8" height="14" rx="1.2" fill="${RED}"/><rect x="13" y="14" width="8" height="3" rx="1" fill="${BRASS}"/><rect x="14.2" y="4" width="1.5" height="9" fill="#fff" opacity=".3"/>`),
  fuel: wrap(`<path d="M5 8l3-4h8l3 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" fill="#d6892b"/><path d="M5 8l3-4h8l3 4z" fill="#f0b25a"/><rect x="14.5" y="2" width="3.5" height="3" rx=".7" fill="${SK}"/><path d="M12 12c1.6 1.6 2.6 2.8 2.6 4.2a2.6 2.6 0 0 1-5.2 0c0-.9.4-1.5 1-2.2.1.8.6 1.2 1 1.2.3-1 .6-2 .6-3.2z" fill="#fff3c4"/><rect x="6.5" y="9" width="1.3" height="11" fill="#fff" opacity=".28"/>`),
  ammoV: wrap(cart(8, 2.5, 4.6, 12.5, 6.5, BRASS, SK) + cart(15.5, 4.5, 4.6, 12.5, 6.5, BRASS, SK)),
  powder: wrap(`<rect x="4.5" y="6" width="15" height="15" rx="2" fill="#b9bfc5"/><rect x="4.5" y="6" width="15" height="3" fill="${SD}"/><rect x="3.5" y="4.5" width="17" height="3" rx="1.2" fill="${SL}"/><rect x="4.5" y="10" width="15" height="7" fill="#1f2a33"/><path d="M12 10.8c1.4 1.5 2.1 2.5 2.1 3.6a2.1 2.1 0 0 1-4.2 0c0-.8.3-1.3.8-1.9.1.7.5 1 .8 1 .3-.9.5-1.7.5-2.7z" fill="#f3a73a"/><rect x="6" y="7" width="1.2" height="13" fill="#fff" opacity=".3"/>`),
  ammoRv: wrap(cart(8, 5, 5.4, 8, 6, BRASS, '#8e98a2') + cart(15.6, 8, 5.4, 8, 6, BRASS, '#8e98a2')),
  ammoK: wrap(cart(8, 3.5, 4.4, 11, 6, '#6e5a3a', COPPER, true) + cart(15.5, 5.5, 4.4, 11, 6, '#6e5a3a', COPPER, true)),
  note: wrap(`<path d="M5 3h10l4 4v14H5z" fill="${PAPER}"/><path d="M15 3v4h4z" fill="#c9bf9f"/><g stroke="#7a705a" stroke-width="1.1" stroke-linecap="round"><path d="M8 11h8M8 14h8M8 17h5"/></g>`),

  /* ---------- оружие ---------- */
  pistol: wrap(`<rect x="2.5" y="6.8" width="18.5" height="5" rx="1.1" fill="${S}"/><rect x="2.5" y="6.8" width="18.5" height="1.5" rx=".7" fill="${SL}"/><rect x="20" y="8" width="2" height="2.4" fill="${SK}"/><rect x="2.5" y="5.8" width="1.6" height="1.2" fill="${SK}"/><path d="M4.5 11.8h6.6l-1.4 8.7H5.6z" fill="#4a5560"/><path d="M6.2 14.5h3.4M6 17h3.4" stroke="#2e3640" stroke-width=".8"/><path d="M11.4 11.8v2.6h4.2" fill="none" stroke="${SD}" stroke-width="1.3" stroke-linecap="round"/>`),
  revolver: wrap(`<rect x="9" y="6.4" width="13" height="3.2" rx=".8" fill="${S}"/><rect x="9" y="6.4" width="13" height="1" fill="${SL}"/><rect x="3.5" y="5.8" width="9" height="6" rx="2" fill="#8d98a3"/><circle cx="9.6" cy="8.8" r="3.1" fill="#6b7782" stroke="${SK}" stroke-width=".8"/><g fill="${SK}"><circle cx="9.6" cy="6.9" r=".7"/><circle cx="11.2" cy="9.7" r=".7"/><circle cx="8" cy="9.7" r=".7"/></g><path d="M3.8 10.8l5.4-.2-2.3 9.4H3.2z" fill="#8a5a2e"/><path d="M4.2 13.5h3M3.8 16h3" stroke="${WOODD}" stroke-width=".8"/><path d="M11.6 11.8v2.4h3" fill="none" stroke="${SD}" stroke-width="1.2" stroke-linecap="round"/>`),
  rifle: wrap(`<path d="M1.5 11.8l5.5-1.6h4.4v3.4H8.6L6.4 17H2.8z" fill="${WOOD}"/><rect x="11" y="10.5" width="11.5" height="2" fill="${S}"/><rect x="9" y="9.6" width="5" height="3.8" rx=".8" fill="#4a5560"/><rect x="9" y="6" width="10" height="2.6" rx="1.3" fill="${SK}"/><rect x="8.4" y="5.6" width="2.4" height="3.4" rx=".8" fill="${SD}"/><rect x="17.4" y="5.5" width="2.6" height="3.6" rx=".8" fill="${SD}"/><rect x="11.5" y="8.6" width="1.2" height="1.2" fill="${SD}"/><rect x="16" y="8.6" width="1.2" height="1.2" fill="${SD}"/><path d="M10.4 13.4v2.4h3" fill="none" stroke="${SD}" stroke-width="1.2" stroke-linecap="round"/>`),
  mosin: wrap(`<path d="M1.5 12.4l5-1.8h4.6v3.4H8.5L6.4 17.5H2.8z" fill="${WOOD}"/><rect x="9" y="10.4" width="9" height="3" rx=".6" fill="#b3743a"/><rect x="9" y="10.4" width="9" height="1" fill="#d19a63"/><rect x="17" y="10.9" width="5.5" height="2" fill="${S}"/><rect x="10" y="9.2" width="3.2" height="1.6" fill="#4a5560"/><path d="M12.6 9.6l2.4-2.2" stroke="${SK}" stroke-width="1.2" stroke-linecap="round"/><circle cx="15.2" cy="7.2" r="1" fill="${SK}"/><rect x="21.3" y="9" width="1.2" height="2" fill="${SK}"/><path d="M10 14v2.4h3" fill="none" stroke="${SD}" stroke-width="1.2" stroke-linecap="round"/>`),
  shotgun: wrap(`<path d="M1.5 11.6l5.6-1.5h3v3.8H8L6.2 17H2.6z" fill="${WOOD}"/><rect x="9" y="9.4" width="13.5" height="2.2" rx="1" fill="${S}"/><rect x="9" y="11.6" width="13.5" height="2.2" rx="1" fill="#8d98a3"/><rect x="9" y="9.4" width="13.5" height=".9" fill="${SL}" opacity=".7"/><rect x="13.5" y="12.4" width="6" height="3.1" rx="1.2" fill="${WOODD}"/><rect x="8.5" y="9.2" width="5" height="5" rx="1" fill="#4a5560"/><rect x="21.4" y="8.8" width="1.1" height="1.2" fill="${SK}"/><path d="M10.2 14.2v2.4h2.8" fill="none" stroke="${SD}" stroke-width="1.2" stroke-linecap="round"/>`),
  asval: wrap(`<path d="M1.5 9.8h5.2v1.4H3.6l-.5 3.4H1.5z" fill="${SK}"/><rect x="6" y="8.2" width="8.6" height="4.6" rx=".9" fill="#3a444d"/><rect x="6" y="8.2" width="8.6" height="1.2" fill="${SD}"/><rect x="14" y="9" width="3.6" height="3" fill="#2a3138"/><rect x="17" y="8.6" width="5.6" height="3.8" rx="1.9" fill="${SK}"/><rect x="17" y="8.6" width="5.6" height="1.2" rx=".6" fill="${SD}"/><path d="M11.4 12.8l-.8 6.2h3.4l.6-6.2z" fill="#4a5560"/><path d="M8 12.8l-.6 3.8h2.2l.4-3.8z" fill="${SK}"/><path d="M8 7.6h5v.8H8z" fill="${SD}"/>`),
  ak74: wrap(`<path d="M1.5 9.6l5 .4v3.6l-2.4 2.4L2 16z" fill="${WOOD}"/><rect x="6" y="8.4" width="9" height="4.4" rx=".8" fill="#2f3a43"/><rect x="6" y="8.4" width="9" height="1.2" fill="${SD}"/><rect x="14.4" y="9.2" width="5" height="3" rx=".8" fill="${WOOD}"/><rect x="14.4" y="9.2" width="5" height="1" fill="#c99560"/><rect x="19" y="9.6" width="3.5" height="1.8" fill="${S}"/><path d="M21 8.2l.9.9" stroke="${SK}" stroke-width="1.4"/><path d="M11.2 12.8q.3 4.4 2.2 7.2l2.8-1q-1.4-3.2-1.6-6.2z" fill="#a8651f"/><path d="M7.3 12.8l-1 4.2h2.4l.8-4.2z" fill="${SK}"/><path d="M12.6 7.4h2.4" stroke="${SD}" stroke-width="1.2"/>`),
  flame: wrap(`<rect x="3" y="7.5" width="9" height="11" rx="3.2" fill="${RED}"/><rect x="3" y="7.5" width="9" height="3" rx="1.5" fill="#f0766a"/><rect x="5" y="5.8" width="5" height="2" rx=".8" fill="${SD}"/><rect x="4.6" y="9" width="1.5" height="8" fill="#fff" opacity=".25"/><path d="M12 11.5h4.5v2.2H12z" fill="${SD}"/><rect x="15.5" y="10.4" width="4" height="4.4" rx="1" fill="#3a444d"/><path d="M19.6 11.2c1.2 1.4 2.4 2.2 2.4 3.8a2.4 2.4 0 0 1-4.8 0c0-.9.4-1.6 1-2.2 0 .8.5 1.2.9 1.2.3-.9.5-1.7.5-2.8z" fill="#ffb02e"/><path d="M20 13.8c.5.7.9 1.1.9 1.7a.9.9 0 0 1-1.8 0c0-.4.2-.7.4-1 0 .3.2.5.4.5z" fill="#fff0a8"/>`),
  pipe: wrap(`<g transform="rotate(-45 12 12)"><rect x="1.5" y="9.6" width="21" height="4.8" rx="2.4" fill="#8b959f"/><rect x="1.5" y="9.6" width="21" height="1.5" rx=".8" fill="${SL}"/><rect x="1.5" y="12.8" width="21" height="1.6" fill="${SD}" opacity=".6"/><rect x="4" y="9" width="2.2" height="6" rx=".8" fill="${SD}"/><rect x="17.8" y="9" width="2.2" height="6" rx=".8" fill="${SD}"/></g>`),
  machete: wrap(`<g transform="rotate(-45 12 12)"><path d="M8 9.4h12.2q2.2 0 2.3 2.6c0 1.4-.8 2.6-2.4 2.6H8z" fill="${S}"/><path d="M8 9.4h12.2q2.2 0 2.3 2.6H8z" fill="${SL}"/><rect x="1.5" y="9.6" width="5.8" height="4.8" rx="1.4" fill="${WOODD}"/><path d="M2.8 10.6v2.8M4.4 10.6v2.8M6 10.6v2.8" stroke="#a06f3c" stroke-width=".9"/><rect x="7" y="8.6" width="1.6" height="6.8" rx=".7" fill="${SK}"/></g>`),
  kukri: wrap(`<g transform="rotate(-45 12 12)"><path d="M7.6 10.4h5.4q4.2 0 7.4 1.4l1.9-.2q.2 2.8-1.6 4.4Q16.5 17.8 13 16.8q-3-.8-5.4-3.4z" fill="${S}"/><path d="M7.6 10.4h5.4q4.2 0 7.4 1.4l1.9-.2c-.2-.9-.7-1.5-1.5-1.8-4-1.4-8-1.6-13.2-1.2z" fill="${SL}"/><rect x="1.5" y="9.5" width="5.2" height="4.5" rx="1.6" fill="${WOODD}"/><path d="M3 10.4v2.7M4.6 10.4v2.7" stroke="#a06f3c" stroke-width=".9"/><rect x="6.4" y="8.8" width="1.6" height="6.6" rx=".7" fill="${BRASS}"/></g>`),

  /* ---------- мебель ---------- */
  candle: wrap(`<rect x="8" y="11" width="8" height="10" rx="1.2" fill="#f2e6c8"/><rect x="8" y="11" width="2" height="10" fill="#fff" opacity=".5"/><path d="M12 11v-2" stroke="#3a2c20" stroke-width="1.2" stroke-linecap="round"/><path d="M12 2.5c2.2 2.4 3 4 3 5.4a3 3 0 0 1-6 0c0-1.2.5-2 1.3-3 .1 1 .6 1.5 1.1 1.5.4-1.2.6-2.4.6-3.9z" fill="#ffb02e"/><path d="M12 6.3c.9 1 1.3 1.7 1.3 2.4a1.3 1.3 0 0 1-2.6 0c0-.6.2-1 .6-1.4z" fill="#fff0a8"/><ellipse cx="12" cy="21" rx="6" ry="1.4" fill="${SD}"/>`),
  chair: wrap(`<rect x="6" y="2.5" width="3" height="11" rx="1" fill="${WOOD}"/><rect x="5.5" y="3" width="11" height="2.2" rx=".8" fill="#b98448"/><rect x="5.5" y="7" width="11" height="2" rx=".8" fill="#b98448"/><rect x="4" y="12.5" width="15" height="3" rx="1.2" fill="#c8935a"/><rect x="5" y="15.5" width="2.6" height="6.5" rx=".8" fill="${WOODD}"/><rect x="15.4" y="15.5" width="2.6" height="6.5" rx=".8" fill="${WOODD}"/><rect x="4" y="12.5" width="15" height="1" fill="#e3bb85"/>`),
  painting: wrap(`<rect x="2.5" y="4" width="19" height="16" rx="1" fill="${WOODD}"/><rect x="4.5" y="6" width="15" height="12" fill="#f0a05a"/><rect x="4.5" y="6" width="15" height="6" fill="#ffd27a"/><circle cx="15.5" cy="9.5" r="2.2" fill="#fff1b8"/><path d="M4.5 18v-3.5l4-3 4 3 3-2 4 3V18z" fill="#6a4a6e"/><path d="M4.5 18v-1.5l5-1.5 4 1.5 6-1V18z" fill="#3d2d45"/><rect x="4.5" y="6" width="15" height="12" fill="none" stroke="#e0b878" stroke-width=".7"/>`),
  radio: wrap(`<path d="M7 5.5L17 2" stroke="${S}" stroke-width="1.3" stroke-linecap="round"/><rect x="2.5" y="6.5" width="19" height="14" rx="2.2" fill="#6a5a45"/><rect x="2.5" y="6.5" width="19" height="3" rx="1.5" fill="#85735a"/><rect x="4.5" y="10.5" width="9" height="7" rx="1" fill="#1d2a24"/><path d="M5.5 14h7" stroke="#6fe69a" stroke-width="1"/><path d="M8.5 11.5v5" stroke="#ff7a5a" stroke-width="1"/><circle cx="17.5" cy="12.6" r="2.1" fill="${SK}"/><circle cx="17.5" cy="12.6" r="2.1" fill="none" stroke="${SL}" stroke-width=".8"/><circle cx="17.5" cy="17.4" r="1.3" fill="${SK}"/>`),

  /* ---------- существа (альманах) ---------- */
  walker: wrap(`<path d="M4.5 21v-3.5C4.5 15 7 14 12 14s7.5 1 7.5 3.5V21z" fill="#4a5f78"/><rect x="9.8" y="11.6" width="4.4" height="3.2" fill="#7c8f74"/><path d="M6.8 8.6C6.8 5 9 3 12 3s5.2 2 5.2 5.6c0 3.4-1.8 6-5.2 6s-5.2-2.6-5.2-6z" fill="#93a08c"/><path d="M6.8 8c.4-3 2.4-5 5.2-5 1.6 0 3 .6 3.8 1.7-1.6-.2-3.6.5-5 2.2-1.4 1.7-2.6 2-4 1.1z" fill="#5d6b56"/><circle cx="9.7" cy="9" r="1.3" fill="#1a1d18"/><circle cx="14.3" cy="9" r="1.3" fill="#1a1d18"/><circle cx="9.7" cy="9" r=".5" fill="#ffe27a"/><circle cx="14.3" cy="9" r=".5" fill="#ffe27a"/><path d="M9.6 12.4h4.8" stroke="#2c1a16" stroke-width="1.3" stroke-linecap="round"/><path d="M10.8 12.4v1M12 12.4v1M13.2 12.4v1" stroke="#e6e0cc" stroke-width=".7"/>`),
  runner: wrap(`<path d="M2 8h4M1 12h5M2 16h4" stroke="${SD}" stroke-width="1.5" stroke-linecap="round"/><path d="M8.5 21v-3C8.5 15.5 10.5 14.5 14 14.5s6 1 6 3.5v3z" fill="#a14a2c"/><path d="M9.5 9C9.5 5.6 11.2 3.5 14 3.5S18.8 5.6 18.8 9c0 3.2-1.6 5.5-4.8 5.5S9.5 12.2 9.5 9z" fill="#b6c2ae"/><path d="M9.6 8.5c.4-3 2.2-5 4.4-5 1.2 0 2.4.5 3 1.4-1.4-.1-3 .6-4.2 2.1-1.2 1.4-2 1.8-3.2 1.5z" fill="#6e7c66"/><circle cx="12.6" cy="9.4" r="1.2" fill="#1a1d18"/><circle cx="16.4" cy="9.4" r="1.2" fill="#1a1d18"/><circle cx="12.6" cy="9.4" r=".45" fill="#ff5a4a"/><circle cx="16.4" cy="9.4" r=".45" fill="#ff5a4a"/><path d="M12.6 12.6q2 1.2 3.8 0" stroke="#2c1a16" stroke-width="1.3" stroke-linecap="round" fill="none"/>`),
  pigY: wrap(`<ellipse cx="12" cy="14" rx="8.5" ry="6.5" fill="#b98e63"/><path d="M5 11l-1.5-3.5 3.2 1.5zM19 11l1.5-3.5-3.2 1.5z" fill="#8a6a48"/><ellipse cx="12" cy="15.2" rx="4.4" ry="3.4" fill="#d99a92"/><circle cx="10.7" cy="15.2" r=".7" fill="#4a2a28"/><circle cx="13.3" cy="15.2" r=".7" fill="#4a2a28"/><circle cx="8.6" cy="11.6" r="1.1" fill="#ffc24a"/><circle cx="15.4" cy="11.6" r="1.1" fill="#ffc24a"/><path d="M8 17.5c-1.6.4-2.3-.8-2-2.6M16 17.5c1.6.4 2.3-.8 2-2.6" fill="none" stroke="#f0e8cc" stroke-width="1.5" stroke-linecap="round"/>`),
  pigM: wrap(`<ellipse cx="12" cy="14" rx="8.5" ry="6.5" fill="#3d342e"/><path d="M5 11l-1.5-3.5 3.2 1.5zM19 11l1.5-3.5-3.2 1.5z" fill="#2a2420"/><ellipse cx="12" cy="15.2" rx="4.4" ry="3.4" fill="#d99a92"/><circle cx="10.7" cy="15.2" r=".7" fill="#4a2a28"/><circle cx="13.3" cy="15.2" r=".7" fill="#4a2a28"/><circle cx="8.6" cy="11.6" r="1.1" fill="#ff6a2a"/><circle cx="15.4" cy="11.6" r="1.1" fill="#ff6a2a"/><path d="M8 17.5c-1.6.4-2.3-.8-2-2.6M16 17.5c1.6.4 2.3-.8 2-2.6" fill="none" stroke="#e3d7a8" stroke-width="1.5" stroke-linecap="round"/>`),
  spider: wrap(`<g stroke="#3a3f46" stroke-width="1.5" stroke-linecap="round" fill="none"><path d="M9 11L4 6 2 8M9 12.5L3 12 2 15M9 14L4.5 18 3.5 21M10 15.5L8.5 21"/><path d="M15 11l5-5 2 2M15 12.5l6-.5 1 3M15 14l4.5 4 1 3M14 15.5l1.5 5.5"/></g><ellipse cx="12" cy="15.5" rx="4" ry="4.8" fill="#3d4650"/><circle cx="12" cy="9.6" r="3.2" fill="#2c343c"/><path d="M12 12.5v6" stroke="#8a2d28" stroke-width="1.2"/><circle cx="10.6" cy="9" r=".95" fill="#ff5a4a"/><circle cx="13.4" cy="9" r=".95" fill="#ff5a4a"/><circle cx="11.3" cy="10.8" r=".55" fill="#ff9a8a"/><circle cx="12.7" cy="10.8" r=".55" fill="#ff9a8a"/>`),
  rat: wrap(`<path d="M20.5 15c1.6.2 2.6-.8 2.2-2.2" fill="none" stroke="#c58a86" stroke-width="1.4" stroke-linecap="round"/><path d="M3 17.5C3 13 7 9.8 12.5 9.8c3.6 0 6.2 1.3 7.6 3.4 1 1.5.8 3.8-.8 4.8H5c-1.2 0-2-.5-2-1.5z" fill="#7a6a5c"/><path d="M3 15.8c.6-1.2 1.8-1.7 3.2-1.5l-1.3 3.2H3.6z" fill="#8f7f70"/><circle cx="3.6" cy="16.6" r="1" fill="#e08a86"/><path d="M8 11c-.4-2.4.4-4.4 2.4-4.8 1.8-.3 2.8 1.2 2.4 3.4" fill="#c58a86"/><circle cx="6.2" cy="15.2" r=".9" fill="#1a1411"/><circle cx="6.2" cy="15.2" r=".35" fill="#ff5a4a"/><path d="M8 18.8l-.8 2.2M17 18.8l1 2.2" stroke="#5a4d43" stroke-width="1.5" stroke-linecap="round"/>`),
  spitter: wrap(`<path d="M12 2.5c3.4 4.4 6 7.4 6 10.8a6 6 0 0 1-12 0c0-3.4 2.6-6.4 6-10.8z" fill="#74c93a"/><path d="M12 2.5c3.4 4.4 6 7.4 6 10.8a6 6 0 0 1-12 0c0-3.4 2.6-6.4 6-10.8z" fill="none" stroke="#3d7a1c" stroke-width="1"/><path d="M8.6 10.8c.5-1.6 1.4-2.8 2.4-3.8" stroke="#d6f5a8" stroke-width="1.4" stroke-linecap="round" fill="none"/><circle cx="10" cy="14" r="1.1" fill="#2a4a12"/><circle cx="14.2" cy="14.8" r="1.5" fill="#2a4a12" opacity=".8"/><path d="M10 17.8c1.4.8 2.8.8 4.2 0" stroke="#2a4a12" stroke-width="1.2" stroke-linecap="round" fill="none"/><circle cx="19.5" cy="20" r="1.2" fill="#74c93a"/><circle cx="4.8" cy="19.6" r=".9" fill="#74c93a"/>`),
  bloater: wrap(`<circle cx="12" cy="13.5" r="8" fill="#d28f66"/><circle cx="12" cy="13.5" r="8" fill="none" stroke="#8c5233" stroke-width="1"/><path d="M7.5 10.5c.8-1.8 2.2-2.8 4-3" stroke="#f3caa8" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M13.2 5.6c.2-1.6 1.2-2.6 3-3" stroke="#6a5a45" stroke-width="1.6" stroke-linecap="round" fill="none"/><circle cx="17.2" cy="2.8" r="1.3" fill="#ffb02e"/><circle cx="9.7" cy="12.8" r="1.2" fill="#2a1710"/><circle cx="14.3" cy="12.8" r="1.2" fill="#2a1710"/><circle cx="9.7" cy="12.8" r=".4" fill="#ffe27a"/><circle cx="14.3" cy="12.8" r=".4" fill="#ffe27a"/><path d="M9.4 16.6q2.6 1.6 5.2 0" stroke="#2a1710" stroke-width="1.3" stroke-linecap="round" fill="none"/>`),
  brute: wrap(`<path d="M2.5 21v-4C2.5 14 5 13 12 13s9.5 1 9.5 4v4z" fill="#3f4a3a"/><path d="M2.5 15c1-2.6 3-3.2 5-3.2h9c2 0 4 .6 5 3.2l-1.6 1.2C18.6 14.6 17 14.2 12 14.2s-6.6.4-7.9 2z" fill="#586652"/><path d="M6.4 8.4C6.4 5 8.8 3 12 3s5.6 2 5.6 5.4c0 3.6-2.2 6.2-5.6 6.2s-5.6-2.6-5.6-6.2z" fill="#8f9a85"/><path d="M6.5 7.6c.8-2.8 3-4.6 5.5-4.6s4.7 1.8 5.5 4.6c-2-1.2-3.8-1.6-5.5-1.6s-3.5.4-5.5 1.6z" fill="#4a5444"/><path d="M8.2 9.6l2.4.8M15.8 9.6l-2.4.8" stroke="#1b1f18" stroke-width="1.4" stroke-linecap="round"/><circle cx="9.7" cy="10.8" r=".9" fill="#ff5a4a"/><circle cx="14.3" cy="10.8" r=".9" fill="#ff5a4a"/><path d="M9 13.2h6" stroke="#2c1a16" stroke-width="1.5" stroke-linecap="round"/><path d="M9.8 12.4v1M12 12.4v1M14.2 12.4v1" stroke="#e6e0cc" stroke-width=".8"/>`),

  /* ---------- значки интерфейса (контурные) ---------- */
  heart: ui('<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>'),
  bolt: ui('<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>'),
  flashlight: ui('<path d="M6 2h12l-1.5 6h-9z"/><path d="M8.5 8h7v13a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1z"/><path d="M12 12v3"/>'),
  pin: ui('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
  lock: ui('<rect x="3.5" y="11" width="17" height="11" rx="2"/><path d="M7.5 11V7a4.5 4.5 0 0 1 9 0v4"/>'),
  question: ui('<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
  skull: ui('<path d="M12 2.5a8 8 0 0 0-8 8c0 2.6 1.3 4.6 3.2 5.8V20h9.6v-3.7c1.9-1.2 3.2-3.2 3.2-5.8a8 8 0 0 0-8-8z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M10.5 20v-2.5M13.5 20v-2.5"/>'),
  tools: ui('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>'),
  hammer: ui('<path d="m15 12-8.4 8.4a2.1 2.1 0 0 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.9-1.9a2 2 0 0 1-.6-1.4V7l-2.3-2.3a6 6 0 0 0-4.2-1.8L9 3l.9.8A6.2 6.2 0 0 1 12 8.4V10l2 2h1.2a2 2 0 0 1 1.4.6l1.9 1.9"/>'),
  doc: ui('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>'),
  book: ui('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
  trash: ui('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>'),
  hand: ui('<path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L3.4 16a2 2 0 0 1 3-2.8L8 15"/>'),
  backpack: ui('<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M8 21v-5h8v5M8 10h8"/>'),
  crate: ui('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3.3 7.9 12 13l8.7-5.1M12 22.1V13"/>'),
  person: ui('<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/>'),
  check: ui('<path d="M20 6 9 17l-5-5"/>'),
  cross: ui('<path d="M18 6 6 18M6 6l12 12"/>'),
  music: ui('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  antenna: ui('<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2"/>'),
  pager: ui('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h6M7 14h3M17 10h.01"/>'),
  calendar: ui('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  pulse: ui('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
  bulb: ui('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>'),
  bed: ui('<path d="M2 20v-9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v9M2 16h20M2 4v16"/><path d="M6 9V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>'),
  door: ui('<path d="M14 3h5a1 1 0 0 1 1 1v17H4V4a1 1 0 0 1 1-1h5"/><path d="M10 3v18l8-3V6z"/><path d="M13.5 12h.01"/>'),
  run: ui('<circle cx="14" cy="4" r="2"/><path d="m8 21 3-6 3 1 2 5M11 15l-1-5 4-1 3 4h3M10 10 6 11"/>'),
  target: ui('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  home: ui('<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>'),
  gear: ui('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  swords: ui('<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>'),
  biohazard: ui('<circle cx="12" cy="12" r="2"/><path d="M12 10a5 5 0 0 1-3-8.5 9 9 0 0 1 6 0A5 5 0 0 1 12 10zM13.7 13a5 5 0 0 1 9 .5 9 9 0 0 1-3 5.2 5 5 0 0 1-6-5.7zM10.3 13a5 5 0 0 0-9 .5 9 9 0 0 0 3 5.2 5 5 0 0 0 6-5.7z"/>'),
  empty: ui('<path d="M12 5v14M5 12h14"/>')
};
// чертежи — один вид, у каждого оружия свой цвет метки
const blueprint = c => wrap(`<rect x="3" y="3" width="18" height="18" rx="1.8" fill="#1f5f9c"/><g stroke="#8fc6f2" stroke-width=".6" opacity=".55"><path d="M3 8h18M3 13h18M3 18h18M8 3v18M13 3v18M18 3v18"/></g><path d="M5.5 15l4-5.5 3 3 5-6" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17.5" cy="6.5" r="1.2" fill="${c}"/><rect x="3" y="3" width="18" height="18" rx="1.8" fill="none" stroke="#9fe8ff" stroke-width="1"/>`);
ICONS.bpVal = blueprint('#ffffff'); ICONS.bpRev = blueprint('#ffd27a'); ICONS.bpAk = blueprint('#ffb08a'); ICONS.bpMos = blueprint('#b5f0a8');
ICONS.bp = ICONS.bpVal;

/* ---------- вода, кофеин, энергетик, ящики ---------- */
ICONS.water = wrap(`<path d="M9 2.5h6v2.2l1.6 2.1V20a1.8 1.8 0 0 1-1.8 1.8H9.2A1.8 1.8 0 0 1 7.4 20V6.8L9 4.7z" fill="#bfe4f5" opacity=".92"/><rect x="7.4" y="11" width="9.2" height="10.8" rx="1.6" fill="#3d9ad6"/><path d="M12 12.6c1.5 1.7 2.3 2.8 2.3 4a2.3 2.3 0 0 1-4.6 0c0-1.2.8-2.3 2.3-4z" fill="#d9f1ff"/><rect x="9" y="1.6" width="6" height="2" rx=".8" fill="#2c6f9c"/><rect x="8.2" y="6.5" width="1.3" height="12" fill="#fff" opacity=".35"/>`);
ICONS.caffeine = wrap(`<ellipse cx="12" cy="20" rx="7" ry="2" fill="#2a1a0e"/><rect x="5" y="8" width="14" height="12" fill="#6b3f1f"/><ellipse cx="12" cy="20" rx="7" ry="2" fill="#4d2c14"/><rect x="5" y="11" width="14" height="6" fill="#e7d3a0"/><path d="M8 13.3h8M8 15.2h5.5" stroke="#6b3f1f" stroke-width="1.1" stroke-linecap="round"/><ellipse cx="12" cy="8" rx="7" ry="2.2" fill="#8a5a30"/><ellipse cx="12" cy="6.4" rx="7.4" ry="2" fill="#2b2420"/><ellipse cx="12" cy="6" rx="5.6" ry="1.2" fill="#4a3a2f"/><rect x="6.2" y="9" width="1.5" height="10" fill="#fff" opacity=".18"/>`);
ICONS.energy = wrap(`<rect x="6.5" y="4" width="11" height="17" rx="2" fill="#1e2a33"/><rect x="6.5" y="4" width="11" height="3" rx="1.5" fill="#aab4be"/><rect x="6.5" y="18.5" width="11" height="2.5" rx="1.2" fill="#aab4be"/><rect x="6.5" y="7" width="11" height="11.5" fill="#35d07f"/><path d="M13.4 8.2 9 13.6h3l-.9 4.4 4.5-5.6h-3.1z" fill="#0d2a18"/><rect x="7.8" y="5.4" width="1.3" height="14" fill="#fff" opacity=".3"/><rect x="10" y="2.6" width="4" height="1.8" rx=".7" fill="#7b868f"/>`);
const crateIco = big => wrap(`<rect x="2.5" y="${big ? 6 : 9}" width="19" height="${big ? 14 : 11}" rx="1.2" fill="#a67a48"/><rect x="2.5" y="${big ? 6 : 9}" width="19" height="3" fill="#c79a62"/><g fill="#6b4a2a"><rect x="2.5" y="${big ? 6 : 9}" width="2.4" height="${big ? 14 : 11}"/><rect x="19.1" y="${big ? 6 : 9}" width="2.4" height="${big ? 14 : 11}"/></g><path d="M5 ${big ? 12.5 : 14.2}h14M5 ${big ? 16.5 : 17.5}h14" stroke="#6b4a2a" stroke-width="1" opacity=".7"/>${big ? `<rect x="10.2" y="9" width="3.6" height="5" rx=".8" fill="#8f99a3"/><circle cx="12" cy="12" r=".9" fill="#2a3138"/>` : `<rect x="10.5" y="11.4" width="3" height="3.6" rx=".7" fill="#8f99a3"/>`}`);
ICONS.crateS = crateIco(false);
ICONS.crateL = crateIco(true);

ICONS.rack = wrap(`<rect x="2.5" y="2.5" width="2.6" height="19" rx=".6" fill="#6b4a2a"/><rect x="18.9" y="2.5" width="2.6" height="19" rx=".6" fill="#6b4a2a"/><rect x="2.5" y="20" width="19" height="1.8" fill="#4d3520"/><g fill="#a67a48"><rect x="5" y="7.2" width="14" height="1.3"/><rect x="5" y="12.2" width="14" height="1.3"/><rect x="5" y="17.2" width="14" height="1.3"/></g><g fill="#59626b"><rect x="5.8" y="5.3" width="12.4" height="1.8" rx=".5"/><rect x="6.6" y="10.3" width="10.8" height="1.8" rx=".5"/><rect x="5.4" y="15.3" width="13" height="1.8" rx=".5"/></g><g fill="#7a4a28"><rect x="5.8" y="5.6" width="4" height="1.9" rx=".5"/><rect x="13" y="10.4" width="4.4" height="1.9" rx=".5"/><rect x="5.4" y="15.4" width="3.6" height="1.9" rx=".5"/></g>`);

/* ---------- отмычка ---------- */
ICONS.pick = wrap(`<g transform="rotate(-38 12 12)"><rect x="2" y="10.2" width="15" height="2" rx="1" fill="${SL}"/><rect x="2" y="10.2" width="15" height="0.7" rx=".35" fill="#fff" opacity=".55"/><path d="M16.6 10.2h3.4a1.8 1.8 0 0 1 0 3.6h-3.4v-1.2h2.8a.6.6 0 0 0 0-1.2h-2.8z" fill="${SD}"/><rect x="2" y="13.4" width="9" height="2.4" rx="1.1" fill="${BRASS}"/><rect x="2" y="13.4" width="9" height="0.8" rx=".4" fill="#fff" opacity=".4"/></g><path d="M3.5 21.5l2-2" stroke="${SD}" stroke-width="1" stroke-linecap="round"/>`);

export const ico = k => ICONS[k] || '';

/* ---- замена эмодзи в тексте интерфейса на иконки ---- */
const EMOJI = {
  '🍞': 'food', '💊': 'meds', '🩹': 'band', '🔩': 'scrap', '🪵': 'wood', '🔋': 'batt', '💳': 'key', '🗝': 'pick', '🧨': 'powder', '📐': 'bp',
  '💧': 'water', '☕': 'caffeine', '🥤': 'energy', '📦': 'crateL', '🔫': 'pistol', '🎯': 'target', '🟥': 'shells', '🛢': 'fuel', '🔇': 'asval', '🔸': 'ammoRv', '🟠': 'ammoK', '📄': 'doc', '💥': 'bloater', '🔥': 'flame',
  '🔧': 'pipe', '🗡': 'machete', '🔪': 'kukri', '🕯': 'candle', '🪑': 'chair', '🖼': 'painting', '📻': 'radio',
  '🧟': 'walker', '🏃': 'run', '🕷': 'spider', '🐀': 'rat', '🧪': 'spitter', '🦍': 'brute',
  '🎒': 'backpack', '🗄': 'crate', '❤': 'heart', '⚡': 'bolt', '🔦': 'flashlight', '📍': 'pin', '🔒': 'lock', '❓': 'question', '☠': 'skull',
  '🛠': 'tools', '🔨': 'hammer', '📖': 'book', '📕': 'book', '📜': 'doc', '🗑': 'trash', '✋': 'hand', '🧍': 'person', '✅': 'check', '❌': 'cross',
  '🎵': 'music', '📡': 'antenna', '📟': 'pager', '📅': 'calendar', '🧠': 'pulse', '💡': 'bulb', '🛏': 'bed', '🚪': 'door', '💀': 'skull', '🏠': 'home',
  '⚙': 'gear', '⚔': 'swords', '☣': 'biohazard', '＋': 'empty'
};
const RX = new RegExp('(' + Object.keys(EMOJI).join('|') + ')\\uFE0F?', 'g');
const SKIP = new Set(['SCRIPT', 'STYLE', 'OPTION', 'TEXTAREA', 'INPUT', 'SELECT', 'SVG', 'CANVAS']);
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function convertText(node) {
  const txt = node.nodeValue;
  if (!txt || !node.parentNode) return;
  RX.lastIndex = 0;
  if (!RX.test(txt)) return;
  RX.lastIndex = 0;
  const tpl = document.createElement('template');
  tpl.innerHTML = esc(txt).replace(RX, (m, e) => ICONS[EMOJI[e]] || m);
  node.parentNode.replaceChild(tpl.content, node);
}
function scan(root) {
  if (!root) return;
  if (root.nodeType === 3) { if (root.parentNode && !SKIP.has(root.parentNode.nodeName.toUpperCase())) convertText(root); return; }
  if (root.nodeType !== 1 || SKIP.has(root.nodeName.toUpperCase())) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const list = []; let n;
  while ((n = w.nextNode())) if (!SKIP.has(n.parentNode.nodeName.toUpperCase())) list.push(n);
  list.forEach(convertText);
}

export function iconizeDom(root = document.body) {
  scan(root);
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'characterData') scan(m.target);
      else m.addedNodes.forEach(scan);
    }
  });
  mo.observe(root, { childList: true, subtree: true, characterData: true });
  return mo;
}
