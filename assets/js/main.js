/* ==========================================================================
   КРЕАМЕТРИКА — поведение интерфейса.
   Без зависимостей. Каждый модуль сам проверяет, есть ли он на странице.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Страховка: начальные состояния анимаций живут под классом js. Если скрипт
  // где-то упадёт, класс снимается — и страница остаётся видимой целиком,
  // просто без движения. Пустых экранов быть не должно ни при каких ошибках.
  window.addEventListener('error', function () {
    document.documentElement.classList.remove('js');
  });

  /* ------------------------------------------------ 1. Тень у липкой шапки */
  (function stickyHeader() {
    var header = document.querySelector('.header');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ----------------------------------------------------- 2. Мобильное меню */
  (function mobileMenu() {
    var burger = document.querySelector('.burger');
    var drawer = document.getElementById('drawer');
    if (!burger || !drawer) return;

    var savedScroll = 0;

    function setOpen(open) {
      burger.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('is-open', open);

      // overflow:hidden в iOS Safari прокрутку не держит — фиксируем body
      // и возвращаем позицию при закрытии.
      if (open) {
        savedScroll = window.scrollY;
        document.body.style.top = -savedScroll + 'px';
        document.body.classList.add('is-locked');
        var first = drawer.querySelector('a');
        if (first) first.focus();
      } else {
        document.body.classList.remove('is-locked');
        document.body.style.top = '';
        // Именно instant: со smooth-прокруткой страница поехала бы обратно
        // на глазах у пользователя вместо мгновенного возврата.
        window.scrollTo({ top: savedScroll, behavior: 'instant' });
      }
    }

    // Пока шторка открыта, Tab не должен уводить фокус на страницу за ней
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusable = drawer.querySelectorAll('a[href]');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        burger.focus();
      }
    });

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        burger.focus();
      }
    });

    // Меню живёт только на мобильных — при расширении окна закрываем.
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  })();

  /* ------------------------------------------- 3. Появление блоков при скролле */
  (function reveal() {
    // Показа ждут оба типа блоков: одиночные (data-reveal) и сетки (data-stagger),
    // у которых скрыты дети. Пропустить любой из них — значит оставить кусок
    // страницы пустым, поэтому список собирается одним запросом.
    var pending = Array.prototype.slice.call(
      document.querySelectorAll('[data-reveal], [data-stagger]')
    );
    if (!pending.length) return;

    // Внутри группы элементы выезжают по очереди, а не все разом
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
      var step = parseInt(group.dataset.stagger, 10) || 90;
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--delay', (i * step) + 'ms');
      });
    });

    function showAll() {
      pending.forEach(function (el) { el.classList.add('is-visible'); });
      pending = [];
    }

    if (reduceMotion) { showAll(); return; }

    var last = 0;

    // Проверяем геометрией, а не наблюдателем: так блок не может «потеряться»,
    // если событие не пришло, и поведение одинаково во всех браузерах.
    function sweep() {
      var limit = window.innerHeight * 0.92;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top > limit) return true;
        el.classList.add('is-visible');
        return false;
      });
      if (!pending.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', sweep);
      }
    }

    function onScroll() {
      var now = Date.now();
      if (now - last < 90) return;   // не чаще ~11 раз в секунду
      last = now;
      sweep();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', sweep, { passive: true });
    window.addEventListener('load', sweep);
    sweep();
  })();

  /* ------------------------------------------------- 4. Вступление первого экрана */
  (function intro() {
    var hero = document.querySelector('[data-intro]');
    if (!hero) return;

    function start() { hero.classList.add('is-intro'); }

    // Ждём кадр, чтобы стартовые состояния успели примениться до анимации.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(start);
    });

    // Кадры могут быть заморожены (вкладка открыта в фоне) — тогда первый экран
    // просто появится без анимации, но появится обязательно.
    window.setTimeout(start, 400);
  })();

  /* ------------------------------------------------------ 5. Полоса прогресса */
  (function progress() {
    var bar = document.querySelector('.progress');
    if (!bar || reduceMotion) return;

    // В браузерах со скролл-таймлайнами полосу двигает CSS — JS не нужен
    if (window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')) return;

    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  })();

  /* ------------------------------------------------- 6. Счётчики в цифрах */
  (function counters() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) return; // значения уже в разметке

    // Разбираем «+312%», «×4,1», «38 млн ₽» на префикс / число / суффикс.
    var pattern = /^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/;

    function run(el) {
      var original = el.textContent.trim();
      var parsed = pattern.exec(original);
      if (!parsed) return;

      // Во вкладке на фоне rAF останавливается — тогда просто оставляем число.
      if (document.hidden) return;

      var prefix = parsed[1];
      var raw = parsed[2];
      var suffix = parsed[3];
      var decimals = (raw.split(/[.,]/)[1] || '').length;
      var target = parseFloat(raw.replace(',', '.'));
      var duration = 900;
      var start = null;

      function frame(now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        if (p < 1) {
          var value = (target * eased).toFixed(decimals).replace('.', ',');
          el.textContent = prefix + value + suffix;
          window.requestAnimationFrame(frame);
        } else {
          el.textContent = original; // финальное значение — ровно как в разметке
        }
      }
      window.requestAnimationFrame(frame);

      // Страховка: если кадры анимации остановились (фоновая вкладка, экономия
      // энергии), цифра всё равно придёт к значению из разметки.
      window.setTimeout(function () { el.textContent = original; }, duration + 500);

      // Если вкладку свернули на середине анимации — возвращаем точное число.
      document.addEventListener('visibilitychange', function restore() {
        if (!document.hidden) return;
        el.textContent = original;
        document.removeEventListener('visibilitychange', restore);
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: .6 });

    nodes.forEach(function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------------------- 7. FAQ */
  (function faq() {
    var buttons = document.querySelectorAll('.faq__btn');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';

        // Аккордеон: одновременно открыт один вопрос.
        buttons.forEach(function (other) {
          other.setAttribute('aria-expanded', 'false');
          var panel = other.nextElementSibling;
          if (panel) panel.setAttribute('aria-hidden', 'true');
        });

        if (!open) {
          btn.setAttribute('aria-expanded', 'true');
          var panel = btn.nextElementSibling;
          if (panel) panel.setAttribute('aria-hidden', 'false');
        }
      });
    });
  })();

  /* -------------------------------------------------- 8. Фильтр кейсов */
  (function caseFilter() {
    var bar = document.querySelector('[data-filters]');
    if (!bar) return;

    var chips = bar.querySelectorAll('.chip');
    var cards = document.querySelectorAll('[data-tags]');
    var counter = document.querySelector('[data-filter-count]');
    var empty = document.querySelector('[data-filter-empty]');

    function apply(value) {
      var shown = 0;

      cards.forEach(function (card) {
        var tags = (card.getAttribute('data-tags') || '').split(/\s+/);
        var match = value === 'all' || tags.indexOf(value) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });

      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', String(chip.dataset.filter === value));
      });

      if (counter) counter.textContent = 'Показано: ' + shown;
      if (empty) empty.hidden = shown !== 0;

      // Ссылку можно скопировать и переслать — фильтр сохранится.
      var url = new URL(window.location.href);
      if (value === 'all') url.searchParams.delete('filter');
      else url.searchParams.set('filter', value);
      history.replaceState(null, '', url);
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () { apply(chip.dataset.filter); });
    });

    var initial = new URL(window.location.href).searchParams.get('filter') || 'all';
    apply(initial);
  })();

  /* --------------------------------------------- 9. Чипы-переключатели формы */
  (function choices() {
    var groups = document.querySelectorAll('.choices');
    if (!groups.length) return;

    groups.forEach(function (group) {
      var labels = group.querySelectorAll('.choice');

      function sync() {
        labels.forEach(function (label) {
          var input = label.querySelector('input');
          label.classList.toggle('is-checked', !!input && input.checked);
        });
      }

      group.addEventListener('change', sync);
      sync();
    });
  })();

  /* --------------------------------- 9a. Метки рекламы для таблицы лидов */
  // utm_* и yclid берём из адреса и запоминаем: человек может прийти по
  // рекламе, походить по страницам и оставить заявку не на посадочной.
  // ClientID Метрики — из её cookie _ym_uid, появится после установки счётчика.
  var TRACK_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'];

  function readTracking() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('km_track') || '{}'); } catch (e) { saved = {}; }
    var params = new URLSearchParams(window.location.search);
    var fresh = {};
    TRACK_KEYS.forEach(function (k) { if (params.get(k)) fresh[k] = params.get(k); });
    if (Object.keys(fresh).length) {              // новый рекламный переход — перезаписываем
      saved = fresh;
      try { localStorage.setItem('km_track', JSON.stringify(saved)); } catch (e) { /* приватный режим */ }
    }
    var ym = document.cookie.match(/(?:^|;\s*)_ym_uid=(\d+)/);
    saved.ym_client_id = ym ? ym[1] : '';
    return saved;
  }

  function fillTracking(form) {
    var data = readTracking();
    TRACK_KEYS.concat('ym_client_id').forEach(function (k) {
      var input = form.querySelector('input[type=hidden][name="' + k + '"]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        form.appendChild(input);
      }
      input.value = data[k] || '';
    });
  }

  document.querySelectorAll('form[data-form]').forEach(fillTracking);

  /* ------------------------------------------------------- 10. Формы заявки */
  (function forms() {
    var forms = document.querySelectorAll('form[data-form]');
    if (!forms.length) return;

    var CONTROLS = 'input:not([type=hidden]), textarea, select';

    function fail(field, message) {
      field.classList.add('has-error');
      var input = field.querySelector(CONTROLS);
      if (input) input.setAttribute('aria-invalid', 'true');
      var error = field.querySelector('.field__error');
      if (error && message) error.textContent = message;
    }

    function clear(field) {
      field.classList.remove('has-error');
      var input = field.querySelector(CONTROLS);
      if (input) input.removeAttribute('aria-invalid');
    }

    function validate(form) {
      var firstBad = null;

      form.querySelectorAll('.field').forEach(function (field) {
        var input = field.querySelector('[required]');
        if (!input) return;

        clear(field);
        var bad = false;

        if (input.type === 'checkbox') {
          bad = !input.checked;                               // текст ошибки — из разметки
          if (bad) fail(field, null);
        } else {
          var value = input.value.trim();
          if (!value) { bad = true; fail(field, 'Заполните поле'); }
          else if (input.dataset.validate === 'contact' && !isContact(value)) { bad = true; fail(field, 'Нужен телефон, e-mail или Telegram'); }
          else if (input.dataset.validate === 'url' && !isUrl(value)) { bad = true; fail(field, 'Нужна ссылка на магазин или карточку'); }
        }

        if (bad && !firstBad) firstBad = input;
      });

      if (firstBad) firstBad.focus();
      return !firstBad;
    }

    function isContact(value) {
      var email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      var phone = value.replace(/[^\d]/g, '').length >= 10;
      var telegram = /^@[\w\d_]{4,}$/.test(value) || /t\.me\/[\w\d_]{4,}/.test(value);
      return email || phone || telegram;
    }

    // Ссылка без протокола тоже годится: «wildberries.ru/catalog/…»
    function isUrl(value) {
      return /^(https?:\/\/)?[^\s.\/]+(\.[^\s.\/]+)+(\/\S*)?$/i.test(value);
    }

    forms.forEach(function (form) {
      var status = form.querySelector('.form__status');
      var submit = form.querySelector('[type="submit"]');

      form.addEventListener('input', function (e) {
        var field = e.target.closest('.field');
        if (field && field.classList.contains('has-error')) clear(field);
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate(form)) return;

        // ─── Точка подключения бэкенда ────────────────────────────────────
        // Здесь отправляем данные в CRM / на почту / в Telegram-бот:
        //   fetch('/api/lead', { method: 'POST', body: new FormData(form) })
        // Пока форма работает в демо-режиме: показываем подтверждение.
        // ──────────────────────────────────────────────────────────────────
        fillTracking(form);
        var data = Object.fromEntries(new FormData(form).entries());
        console.info('[Креаметрика] заявка:', data);

        if (submit) {
          submit.disabled = true;
          submit.textContent = 'Отправлено';
        }
        if (status) {
          status.classList.add('is-visible');
          status.setAttribute('role', 'status');
        }
        form.reset();
        document.querySelectorAll('.choice').forEach(function (label) {
          label.classList.remove('is-checked');
        });
        form.querySelectorAll('[data-other-target]').forEach(function (sel) {
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    });
  })();

  /* ------------------------------------------ 10a. «Другое» в категории товара */
  (function otherCategory() {
    document.querySelectorAll('[data-other-target]').forEach(function (select) {
      var field = document.querySelector('[data-other-field="' + select.dataset.otherTarget + '"]');
      if (!field) return;
      function sync() {
        var on = select.value === 'Другое';
        field.hidden = !on;
        if (!on) field.querySelector('input').value = '';
      }
      select.addEventListener('change', sync);
      sync();   // без JS поле видно всегда, с JS — только при выборе «Другое»
    });

    // Пока в списке ничего не выбрано, подсказка серая, как плейсхолдер у полей
    document.querySelectorAll('form[data-form] select').forEach(function (select) {
      function mark() { select.classList.toggle('is-empty', !select.value); }
      select.addEventListener('change', mark);
      select.form && select.form.addEventListener('reset', function () { setTimeout(mark, 0); });
      mark();
    });
  })();

  /* --------------------------------------------------------- 11. Мелочи */
  (function misc() {
    // Год в подвале
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    // Подсветка текущего пункта меню
    var page = document.body.dataset.page;
    if (page) {
      document.querySelectorAll('[data-nav="' + page + '"]').forEach(function (link) {
        link.setAttribute('aria-current', 'page');
      });
    }
  })();

  /* ------------------------------------------------- 12. Ступени воронки */
  (function funnel() {
    var steps = document.querySelectorAll('.fstep');
    if (!steps.length) return;

    var panels = document.querySelectorAll('.fpanel');

    function select(step) {
      steps.forEach(function (s) { s.setAttribute('aria-selected', String(s === step)); });
      panels.forEach(function (p) { p.hidden = p.id !== step.getAttribute('aria-controls'); });
    }

    steps.forEach(function (step) {
      step.addEventListener('click', function () { select(step); });

      // Стрелками между ступенями — как в обычном наборе вкладок
      step.addEventListener('keydown', function (e) {
        var i = Array.prototype.indexOf.call(steps, step);
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = steps[(i + 1) % steps.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = steps[(i - 1 + steps.length) % steps.length];
        if (!next) return;
        e.preventDefault();
        select(next);
        next.focus();
      });
    });
  })();

  /* --------------------------------------------- 13. Карточка до / после */
  (function beforeAfter() {
    var box = document.querySelector('[data-ba]');
    if (!box) return;

    var range = box.querySelector('[data-ba-range]');
    if (!range) return;

    function apply() {
      box.style.setProperty('--split', range.value + '%');
    }

    function setFromX(x) {
      var r = box.getBoundingClientRect();
      var v = Math.max(0, Math.min(100, (x - r.left) / r.width * 100));
      range.value = Math.round(v);
      apply();
    }

    // Перетаскивание по самому блоку. Мышью — сразу по нажатию; пальцем — только
    // при движении: если человек листает вверх-вниз, браузер забирает жест
    // себе (touch-action: pan-y) и присылает pointercancel, ползунок не дёргается.
    var dragging = false;
    box.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      if (e.pointerType === 'mouse') setFromX(e.clientX);
    });
    box.addEventListener('pointermove', function (e) {
      if (dragging) setFromX(e.clientX);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
      box.addEventListener(type, function () { dragging = false; });
    });

    range.addEventListener('input', apply);
    apply();
  })();

  /* ------------------------------------------ 14. С какой кнопки пришла заявка */
  (function intent() {
    var field = document.querySelector('[data-intent-field]');
    if (!field) return;
    document.querySelectorAll('[data-intent]').forEach(function (link) {
      link.addEventListener('click', function () { field.value = link.dataset.intent; });
    });
  })();

  /* ------------------------------------------------ 15. Бесконечная лента */
  (function marquee() {
    var track = document.querySelector('.marquee__track');
    if (!track) return;
    var group = track.querySelector('.marquee__group');
    if (!group) return;

    var SPEED = 60; // пикселей в секунду — одинаково на любой ширине экрана

    function build() {
      // Оставляем один исходный набор и клонируем его, пока лента не станет
      // шире экрана с запасом на один сдвиг — тогда конец ленты не виден никогда.
      track.querySelectorAll('.marquee__group').forEach(function (g, i) {
        if (i > 0) g.remove();
      });
      var w = group.getBoundingClientRect().width;
      if (!w) return;
      var need = Math.ceil(window.innerWidth / w) + 1;
      for (var i = 0; i < need; i++) {
        var copy = group.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      }
      track.style.setProperty('--marquee-shift', w + 'px');
      track.style.setProperty('--marquee-dur', (w / SPEED).toFixed(2) + 's');
    }

    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    }, { passive: true });

    // Ширина группы зависит от шрифта — считаем после его загрузки
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(build);
    build();
  })();

})();
