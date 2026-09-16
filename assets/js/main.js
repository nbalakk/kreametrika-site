/* ==========================================================================
   КРЕАМЕТРИКА — поведение интерфейса.
   Без зависимостей. Каждый модуль сам проверяет, есть ли он на странице.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    var items = document.querySelectorAll('[data-reveal]');

    // Внутри группы элементы выезжают по очереди, а не все разом
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
      var step = parseInt(group.dataset.stagger, 10) || 90;
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--delay', (i * step) + 'ms');
      });
    });

    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    items.forEach(function (el) { io.observe(el); });
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

  /* ------------------------------------------------------- 10. Формы заявки */
  (function forms() {
    var forms = document.querySelectorAll('form[data-form]');
    if (!forms.length) return;

    function fail(field, message) {
      field.classList.add('has-error');
      var input = field.querySelector('input, textarea');
      if (input) input.setAttribute('aria-invalid', 'true');
      var error = field.querySelector('.field__error');
      if (error && message) error.textContent = message;
    }

    function clear(field) {
      field.classList.remove('has-error');
      var input = field.querySelector('input, textarea');
      if (input) input.removeAttribute('aria-invalid');
    }

    function validate(form) {
      var ok = true;
      var firstBad = null;

      form.querySelectorAll('.field').forEach(function (field) {
        var input = field.querySelector('input[required], textarea[required]');
        if (!input) return;

        clear(field);
        var value = input.value.trim();

        if (!value) {
          fail(field, 'Заполните поле');
          ok = false;
        } else if (input.dataset.validate === 'contact' && !isContact(value)) {
          fail(field, 'Нужен телефон или e-mail');
          ok = false;
        }

        if (!ok && !firstBad) firstBad = input;
      });

      if (firstBad) firstBad.focus();
      return ok;
    }

    function isContact(value) {
      var email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      var phone = value.replace(/[^\d]/g, '').length >= 10;
      return email || phone;
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
      });
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
})();
