export const MARKUP = /* html */ `
<div id="game"></div>
<div id="vig" class="off"></div>
<div id="danger"></div>
<div id="scope"><i class="h"></i><i class="v"></i><i class="dot"></i></div>
<div id="dmg"></div>

<!-- ============ HUD ============ -->
<div id="hud" class="off">
  <div class="absolute top-3 left-3 max-w-sm">
    <div id="objective" class="text-sm font-semibold text-amber-200"></div>
    <div id="zoneInfo" class="text-sm font-semibold text-cyan-200 mt-1"></div>
    <div id="sortieInfo" class="text-xs text-white/60 mt-1"></div>
  </div>
  <canvas id="mini" width="170" height="170" class="absolute top-3 right-3 rounded border border-white/25"></canvas>
  <div id="cross"></div>
  <div id="prompt" class="absolute left-1/2 text-center off" style="top:57%;transform:translateX(-50%)">
    <div id="promptText" class="text-sm font-semibold mb-1"></div>
    <div class="bar" style="width:170px;margin:auto"><i id="promptBar" style="background:#e8c04a;width:0%"></i></div>
  </div>
  <div id="toasts" class="absolute left-1/2 flex flex-col items-center gap-1" style="bottom:7.5rem;transform:translateX(-50%)"></div>
  <div id="noteBox" class="absolute left-1/2 off panel p-4 text-sm" style="bottom:12rem;transform:translateX(-50%);max-width:30rem;width:92%">
    <div id="noteTitle" class="font-bold text-amber-200 mb-1"></div><div id="noteText" class="text-white/85 leading-relaxed"></div>
  </div>
  <div id="fxCaf" class="fx off" title="Кофеин: выносливость восстанавливается быстрее"></div>
  <div class="absolute bottom-3 left-3" style="width:15rem">
    <div class="flex items-center gap-2 text-xs mb-1"><span style="width:1.5rem">❤</span><div class="bar flex-1"><i id="hpBar" style="background:#d9473b"></i></div><span id="hpTxt" class="w-8 text-right"></span></div>
    <div class="flex items-center gap-2 text-xs mb-1"><span style="width:1.5rem">⚡</span><div class="bar flex-1"><i id="stBar" style="background:#e0b83d"></i></div></div>
    <div class="flex items-center gap-2 text-xs"><span style="width:1.5rem">🔦</span><div class="bar flex-1"><i id="btBar" style="background:#5fb5ff"></i></div></div>
  </div>
  <div class="absolute bottom-3 left-1/2 text-center" style="transform:translateX(-50%);width:9rem">
    <div class="text-[10px] tracking-widest text-white/60 mb-1">ШУМ</div>
    <div class="bar"><i id="noiseBar" style="background:#8fe3a0;width:5%"></i></div>
  </div>
  <div class="absolute bottom-3 right-3 text-right">
    <div id="wpnBar" class="flex gap-1 justify-end mb-1"></div>
    <div id="wpnTxt" class="text-[10px] tracking-widest text-white/60"></div>
    <div class="text-3xl font-black"><span id="magTxt">8</span><span class="text-lg text-white/60"> / <span id="ammoTxt">0</span></span></div>
    <div id="invTxt" class="text-sm text-white/80 mt-1"></div>
  </div>
</div>

<!-- ============ ГЛАВНОЕ МЕНЮ ============ -->
<div id="scr-menu" class="screen">
  <div class="panel p-8 text-center" style="max-width:30rem;width:100%">
    <div class="text-5xl mb-2">☣</div>
    <h1 class="title text-5xl mb-1">БЫВШИЕ</h1>
    <p class="text-white/60 mb-6 text-sm">Вылазки в сеть бункеров. Ты — последний живой.</p>
    <div class="space-y-3">
      <button id="btnContinue" class="btn main">▶ Продолжить</button>
      <button id="btnNew" class="btn">Новая игра</button>
      <button id="btnSettings" class="btn">⚙ Настройки</button>
      <button id="btnHelp" class="btn">❓ Как играть</button>
      <button id="btnMusic" class="btn sm" style="width:100%">🎵 Музыка: вкл</button>
    </div>
    <p class="text-[10px] text-white/35 mt-4 tracking-wider">♪ «Пепел над убежищем» — саундтрек главного меню</p>
    <div id="helpBox" class="off text-left text-sm text-white/80 mt-5 space-y-1.5"></div>
  </div>
</div>

<!-- ============ УБЕЖИЩЕ (3D-комната) ============ -->
<div id="hubhud" class="off" style="position:fixed;inset:0;z-index:10;pointer-events:none;text-shadow:0 1px 3px #000">
  <div class="absolute top-3 left-3">
    <div class="title text-xl">УБЕЖИЩЕ №17</div>
    <div class="text-xs text-white/70 mt-1">День <b id="hubDay">1</b> · вылазок: <span id="hSort">0</span> · убито бывших: <span id="hKills">0</span> · потерь: <span id="hDeaths">0</span></div>
  </div>
  <div id="hubUnplaced" class="hub-warn absolute off"></div>
  <div id="hubChips" class="absolute top-3 right-3 flex flex-wrap gap-1.5 justify-end" style="max-width:28rem"></div>
  <div id="hcross" class="off"></div>
  <div id="hPrompt" class="absolute left-1/2 off" style="top:60%;transform:translateX(-50%)">
    <div class="hprompt"><kbd id="hPromptKey">E</kbd><span id="hPromptText"></span></div>
  </div>
</div>
<div id="hfade"></div>
<div id="hToasts" class="fixed left-1/2 flex flex-col items-center gap-1" style="bottom:6rem;transform:translateX(-50%);z-index:85;pointer-events:none"></div>

<div id="scr-hubpause" class="screen off hubpause">
  <div class="panel p-6 text-center" style="max-width:36rem;width:100%">
    <h2 class="title text-3xl mb-1">УБЕЖИЩЕ №17</h2>
    <p class="text-white/55 text-sm mb-3">День <b id="hpDay">1</b></p>
    <p id="hubText" class="text-white/80 text-sm leading-relaxed mb-5"></p>
    <div class="space-y-2">
      <button id="hubEnter" class="btn main">🏠 Осмотреться в комнате</button>
      <button id="hubSettings" class="btn">⚙ Настройки</button>
      <button id="hubMenu" class="btn">☰ В главное меню</button>
    </div>
    <p class="text-[11px] text-white/40 mt-3">Верстак — крафт, мебель и энергетики · Стол — записи и альманах · Стеллаж — учёт ресурсов · Ящики — склад (раскладывайте ресурсы сами) · Кровать — отдых · Шлюз — вылазка · Tab — инвентарь</p>
  </div>
</div>

<div id="scr-station" class="screen dim off">
  <div class="panel p-5 w-full" style="max-width:66rem">
    <div class="flex items-center justify-between gap-3 mb-3 flex-none">
      <h2 id="stTitle" class="font-bold text-xl text-emerald-300"></h2>
      <button id="stClose" class="btn sm">✕ Закрыть (Esc)</button>
    </div>
    <div id="stBody"></div>
  </div>
</div>

<!-- ============ ПАУЗА / СТАРТ ВЫЛАЗКИ ============ -->
<div id="scr-lock" class="screen dim off">
  <div class="panel p-7 text-center" style="max-width:28rem;width:100%">
    <h2 id="lockTitle" class="title text-3xl mb-2"></h2>
    <p id="lockText" class="text-white/75 text-sm mb-5 leading-relaxed"></p>
    <div class="space-y-3">
      <button id="btnLockGo" class="btn main">Продолжить</button>
      <button id="lockSettings" class="btn">⚙ Настройки</button>
      <button id="btnLockQuit" class="btn danger">Бросить вылазку (потерять добычу)</button>
    </div>
    <p id="lockHint" class="text-amber-300 text-xs mt-3"></p>
  </div>
</div>

<!-- ============ ВЗЛОМ ОТМЫЧКОЙ ============ -->
<div id="scr-pick" class="screen dim off">
  <div class="panel p-4 text-center" style="max-width:36rem;width:100%">
    <div class="flex items-center justify-between mb-2 gap-2">
      <h2 id="pickTitle" class="font-bold text-lg text-emerald-300 text-left"></h2>
      <span id="pickTier" class="chip text-xs"></span>
    </div>
    <canvas id="pickCv"></canvas>
    <div id="pickInfo" class="text-sm text-white/80 mt-1"></div>
    <p class="text-xs text-white/55 mt-2 leading-snug">Ведите отмычку <b>мышью</b> по замку или клавишами <kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd>. Рядом с «чувствительным» положением отмычка дрожит и щёлкает чаще. Найдите его и <b>удерживайте</b> <kbd>Пробел</kbd> / ЛКМ, пока штифт не встанет. Нажим не в том месте перегружает отмычку — она сломается.</p>
    <div class="flex gap-2 mt-3 justify-center flex-wrap">
      <button id="pickKeyBtn" class="btn sm off">💳 Карта доступа (<kbd>K</kbd>)</button>
      <button id="pickCancel" class="btn sm">✕ Отойти <kbd>Esc</kbd></button>
    </div>
  </div>
</div>

<!-- ============ ИНВЕНТАРЬ ============ -->
<div id="scr-inv" class="screen dim off">
  <div class="panel p-4 w-full" style="max-width:56rem">
    <div class="flex items-center justify-between mb-3">
      <h2 id="invTitle" class="font-bold text-xl text-emerald-300">🎒 Инвентарь</h2>
      <button class="btn sm" data-act="close">✕ Закрыть <kbd id="invCloseKey">Tab</kbd></button>
    </div>
    <div id="invEquipWrap" class="mb-3">
      <h3 class="font-bold text-sm text-white/80 mb-2">⚔ Экипировка <span class="text-xs text-white/45 font-normal">— нажмите на слот, чтобы заменить оружие</span></h3>
      <div id="invEquip" class="eqrow"></div>
    </div>
    <div class="grid md:grid-cols-2 gap-4">
      <div>
        <div class="flex justify-between items-center mb-2">
          <h3 id="bagTitle" class="font-bold text-sm text-white/80">🎒 Рюкзак</h3><span id="bagCnt" class="text-xs text-white/60"></span>
        </div>
        <div id="invBag" class="slots"></div>
        <div id="invBagNote" class="off text-[11px] text-emerald-200/70 mt-2 leading-snug">Это тот же инвентарь, что и на вылазке: всё, что здесь лежит, уйдёт с вами за шлюз, а добыча вернётся сюда же. Погибнете — потеряете (оружие сохранится). Ничего не положили — пойдёте пустым.</div>
      </div>
      <div>
        <div class="flex justify-between items-center mb-2">
          <h3 id="rightTitle" class="font-bold text-sm text-white/80"></h3>
          <div class="flex gap-1.5"><button id="btnPutAll" class="btn sm off" data-act="putall">⇨ Выложить все ресурсы</button><button id="btnTakeAll" class="btn sm off" data-act="takeall">⇦ Взять всё</button></div>
        </div>
        <div id="invRight"></div>
      </div>
    </div>
    <div id="invDetail" class="detail mt-4 text-sm"></div>
  </div>
</div>

<!-- ============ РЕЗУЛЬТАТ ============ -->
<div id="scr-result" class="screen off">
  <div class="panel p-8 text-center" style="max-width:30rem;width:100%">
    <div id="resEmoji" class="text-5xl mb-2"></div>
    <h2 id="resTitle" class="title text-3xl mb-2"></h2>
    <div id="resBody" class="text-sm text-white/80 text-left leading-relaxed mb-5"></div>
    <button id="btnResult" class="btn main">В убежище</button>
  </div>
</div>

<!-- ============ НАСТРОЙКИ ============ -->
<div id="scr-settings" class="screen dim off" style="z-index:90">
  <div class="panel p-5 w-full" style="max-width:34rem">
    <div class="flex items-center justify-between gap-3 mb-3">
      <h2 class="font-bold text-xl text-emerald-300">⚙ Настройки</h2>
      <button id="setClose" class="btn sm">✕ Закрыть (Esc)</button>
    </div>
    <div id="setBody" style="max-height:66vh;overflow:auto;padding-right:.3rem"></div>
    <div class="flex justify-between items-center mt-4 gap-3">
      <span class="text-[11px] text-white/45">Настройки сохраняются автоматически.</span>
      <button id="setReset" class="btn sm danger">↺ По умолчанию</button>
    </div>
  </div>
</div>
`;
