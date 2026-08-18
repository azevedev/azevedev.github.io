/* ==========================================================================
   Matheus Azevedo — portfolio behaviour
   Vanilla, deferred, no dependencies. Everything degrades to a working page,
   and every motion path checks prefers-reduced-motion before it runs.
   ========================================================================== */

(function () {
    'use strict';

    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduceMotion = motionQuery.matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var root = document.documentElement;

    function each(list, fn) { Array.prototype.forEach.call(list, fn); }

    /* ------------------------------------------------------------- toast -- */

    var toastEl = document.getElementById('toast');
    var toastTimer;

    function toast(message) {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add('is-up');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('is-up'); }, 2200);
    }

    /* ------------------------------------------------------------- theme -- */

    var themeBtn = document.getElementById('theme-toggle');
    var themeMeta = document.querySelector('meta[name="theme-color"]');

    // The markup ships the ivory ground; the toggle has to carry the dark one,
    // because a theme-color meta can key off a media query but not an attribute.
    var CHROME = { light: '#e7eae0', dark: '#153243' };

    function paintThemeButton() {
        if (!themeBtn) return;
        var light = root.dataset.theme === 'light';
        themeBtn.setAttribute('aria-pressed', String(light));
        themeBtn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    }

    function paintChrome() {
        if (themeMeta) themeMeta.setAttribute('content', CHROME[root.dataset.theme] || CHROME.light);
    }

    function toggleTheme() {
        root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
        try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { /* private mode */ }
        paintThemeButton();
        paintChrome();
    }

    paintThemeButton();
    paintChrome();
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    /* -------------------------------------------------------------- menu -- */

    var nav = document.getElementById('nav');
    var menuBtn = document.getElementById('menu-toggle');

    function setMenu(open) {
        if (!nav || !menuBtn) return;
        nav.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    if (menuBtn && nav) {
        menuBtn.addEventListener('click', function () {
            setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
        });

        nav.addEventListener('click', function (e) {
            if (e.target.closest('a')) setMenu(false);
        });

        window.matchMedia('(min-width: 62em)').addEventListener('change', function (e) {
            if (e.matches) setMenu(false);
        });
    }

    /* ---------------------------------------------------- scroll progress -- */

    var bar = document.getElementById('progress-bar');
    var ticking = false;
    var dots = document.querySelector('.grid-dots');

    function onScrollFrame() {
        ticking = false;
        var y = window.scrollY;

        if (bar) {
            var max = root.scrollHeight - window.innerHeight;
            bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
        }
        if (dots && !reduceMotion) {
            dots.style.setProperty('--par', (y * 0.12).toFixed(1));
        }
    }

    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); }
    }, { passive: true });

    window.addEventListener('resize', onScrollFrame, { passive: true });
    onScrollFrame();

    /* ---------------------------------------------------------- count-up -- */

    function countUp(el) {
        var to = parseInt(el.dataset.to, 10);
        if (isNaN(to)) return;
        if (reduceMotion) { el.textContent = String(to); return; }

        var start = 0;
        var t0 = 0;
        var DURATION = 700;

        function step(t) {
            if (!t0) t0 = t;
            var p = Math.min(1, (t - t0) / DURATION);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = String(Math.round(start + (to - start) * eased));
            if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = '0';
        requestAnimationFrame(step);
    }

    /* ------------------------------------------------------------ reveal -- */

    var revealables = document.querySelectorAll('.reveal');

    function activate(el) {
        el.classList.add('is-in');
        each(el.querySelectorAll('.num'), countUp);
        if (el.classList.contains('num')) countUp(el);
    }

    if (!('IntersectionObserver' in window) || reduceMotion) {
        each(revealables, activate);
    } else {
        var revealObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                var i = parseInt(el.dataset.i || '0', 10);
                if (i && !reduceMotion) el.style.transitionDelay = (i * 80) + 'ms';
                activate(el);
                obs.unobserve(el);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

        each(revealables, function (el) { revealObserver.observe(el); });
    }

    /* -------------------------------------------------------- section spy -- */

    var navLinks = nav ? nav.querySelectorAll('a[href^="#"]') : [];
    var sectionIds = [];

    if (navLinks.length && 'IntersectionObserver' in window) {
        var linkFor = {};
        each(navLinks, function (a) {
            var id = a.getAttribute('href').slice(1);
            linkFor[id] = a;
            sectionIds.push(id);
        });

        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var link = linkFor[entry.target.id];
                if (!link) return;
                each(navLinks, function (a) { a.classList.remove('is-active'); });
                link.classList.add('is-active');
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        sectionIds.forEach(function (id) {
            var section = document.getElementById(id);
            if (section) spy.observe(section);
        });
    }

    /* ------------------------------------------------- portrait assembly -- */
    /* The 64×64 sprite paints itself in, four pixels at a time. */

    var canvas = document.getElementById('portrait-canvas');
    var portrait = document.getElementById('portrait-img');
    var stage = document.getElementById('portrait-stage');

    if (canvas && portrait && !reduceMotion && canvas.getContext) {
        var pctx = canvas.getContext('2d');
        pctx.imageSmoothingEnabled = false;
        var assembling = false;

        var assemble = function () {
            if (assembling) return;
            assembling = true;

            var BLOCK = 4;
            var cols = canvas.width / BLOCK;
            var cells = [];
            var i, j, tmp;

            for (i = 0; i < cols * cols; i++) cells.push(i);
            for (i = cells.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));
                tmp = cells[i]; cells[i] = cells[j]; cells[j] = tmp;
            }

            pctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.opacity = '1';
            portrait.style.opacity = '0';

            var drawn = 0;
            var t0 = 0;
            var DURATION = 640;

            var step = function (t) {
                if (!t0) t0 = t;
                var target = Math.min(cells.length, Math.round((t - t0) / DURATION * cells.length));
                while (drawn < target) {
                    var cell = cells[drawn++];
                    var cx = (cell % cols) * BLOCK;
                    var cy = Math.floor(cell / cols) * BLOCK;
                    pctx.drawImage(portrait, cx, cy, BLOCK, BLOCK, cx, cy, BLOCK, BLOCK);
                }
                if (drawn < cells.length) {
                    requestAnimationFrame(step);
                } else {
                    portrait.style.transition = 'opacity .25s linear';
                    portrait.style.opacity = '1';
                    canvas.style.transition = 'opacity .25s linear';
                    canvas.style.opacity = '0';
                    assembling = false;
                }
            };
            requestAnimationFrame(step);
        };

        var kickOff = function () { setTimeout(assemble, 320); };
        if (portrait.complete && portrait.naturalWidth) kickOff();
        else portrait.addEventListener('load', kickOff, { once: true });

        if (stage) {
            stage.addEventListener('pointerenter', assemble);
            stage.addEventListener('click', assemble);
        }
    } else if (canvas) {
        canvas.remove();
    }

    /* ------------------------------------------------ project card dither -- */
    /* Each screenshot resolves through a handful of pixel resolutions. The
       canvas is genuinely 6px wide on the first step, so this stays cheap. */

    var RESOLUTIONS = [6, 10, 17, 28, 46, 76, 124];

    function dither(shot) {
        var img = shot.querySelector('img');
        if (!img) return;

        var c = document.createElement('canvas');
        c.className = 'dither';
        c.setAttribute('aria-hidden', 'true');
        var ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;

        shot.classList.add('is-resolving');
        shot.appendChild(c);

        var i = 0;
        var ratio = (img.naturalHeight || 750) / (img.naturalWidth || 1200);

        function draw() {
            var w = RESOLUTIONS[i];
            c.width = w;
            c.height = Math.max(1, Math.round(w * ratio));
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, c.width, c.height);
            i++;
            if (i < RESOLUTIONS.length) {
                setTimeout(draw, 90);
            } else {
                shot.classList.remove('is-resolving');
                c.style.opacity = '0';
                setTimeout(function () { c.remove(); }, 320);
            }
        }
        draw();
    }

    var shots = document.querySelectorAll('.card__shot');

    if (shots.length && !reduceMotion && 'IntersectionObserver' in window) {
        var shotObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var shot = entry.target;
                obs.unobserve(shot);
                var img = shot.querySelector('img');
                if (!img) return;
                if (img.complete && img.naturalWidth) dither(shot);
                else img.addEventListener('load', function () { dither(shot); }, { once: true });
            });
        }, { threshold: 0.25 });

        each(shots, function (shot) { shotObserver.observe(shot); });
    }

    /* --------------------------------------------------------- spotlight -- */

    var hero = document.querySelector('.hero');

    if (hero && dots && finePointer && !reduceMotion) {
        hero.addEventListener('pointermove', function (e) {
            var box = hero.getBoundingClientRect();
            dots.style.setProperty('--mx', ((e.clientX - box.left) / box.width * 100).toFixed(2) + '%');
            dots.style.setProperty('--my', ((e.clientY - box.top) / box.height * 100).toFixed(2) + '%');
            dots.style.setProperty('--spot', '1');
        }, { passive: true });

        hero.addEventListener('pointerleave', function () {
            dots.style.setProperty('--spot', '0');
        });
    }

    /* ---------------------------------------------------- magnetic buttons -- */

    if (finePointer && !reduceMotion) {
        each(document.querySelectorAll('.magnet'), function (el) {
            el.addEventListener('pointermove', function (e) {
                var box = el.getBoundingClientRect();
                var dx = (e.clientX - (box.left + box.width / 2)) / box.width;
                var dy = (e.clientY - (box.top + box.height / 2)) / box.height;
                el.classList.add('is-pulling');
                el.style.setProperty('--pull-x', (dx * 10).toFixed(1) + 'px');
                el.style.setProperty('--pull-y', (dy * 8).toFixed(1) + 'px');
            }, { passive: true });

            el.addEventListener('pointerleave', function () {
                el.classList.remove('is-pulling');
                el.style.setProperty('--pull-x', '0px');
                el.style.setProperty('--pull-y', '0px');
            });
        });
    }

    /* ----------------------------------------------------- text scramble -- */
    /* Monospace keeps the width stable while the glyphs settle left to right. */

    var GLYPHS = '@#%&$?/\\|<>[]{}=+*abcdefghijklmnopqrstuvwxyz0123456789';

    function scramble(el) {
        if (el.dataset.busy === '1') return;
        var final = el.dataset.text || el.textContent;
        el.dataset.text = final;
        el.dataset.busy = '1';

        var chars = final.split('');
        var t0 = 0;
        var DURATION = 380;

        function frame(t) {
            if (!t0) t0 = t;
            var p = Math.min(1, (t - t0) / DURATION);
            var settled = Math.floor(p * chars.length);
            var out = '';
            for (var i = 0; i < chars.length; i++) {
                if (i < settled || chars[i] === ' ') out += chars[i];
                else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            }
            el.textContent = out;
            if (p < 1) requestAnimationFrame(frame);
            else { el.textContent = final; el.dataset.busy = '0'; }
        }
        requestAnimationFrame(frame);
    }

    if (finePointer && !reduceMotion) {
        each(document.querySelectorAll('[data-scramble]'), function (el) {
            var target = el.closest('a') || el;
            target.addEventListener('pointerenter', function () { scramble(el); });
            target.addEventListener('focus', function () { scramble(el); });
        });
    }

    /* ------------------------------------------------------------- copy -- */

    each(document.querySelectorAll('[data-copy]'), function (btn) {
        btn.addEventListener('click', function () {
            var value = btn.dataset.copy;
            var done = function () { toast('Copied ' + value); };
            var failed = function () { toast('Could not copy. Select it manually.'); };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(value).then(done, failed);
                return;
            }
            // older Safari and any non-secure context
            var scratch = document.createElement('textarea');
            scratch.value = value;
            scratch.setAttribute('readonly', '');
            scratch.style.position = 'fixed';
            scratch.style.opacity = '0';
            document.body.appendChild(scratch);
            scratch.select();
            try { document.execCommand('copy') ? done() : failed(); } catch (e) { failed(); }
            document.body.removeChild(scratch);
        });
    });

    /* -------------------------------------------------------- shortcuts -- */

    document.addEventListener('keydown', function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

        if (e.key === 'Escape' && menuBtn && menuBtn.getAttribute('aria-expanded') === 'true') {
            setMenu(false);
            menuBtn.focus();
            return;
        }

        var key = e.key.toLowerCase();

        if (key === 't') {
            toggleTheme();
            toast('Theme: ' + root.dataset.theme);
            return;
        }

        if (key === 'g') {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
            return;
        }

        var index = parseInt(e.key, 10);
        if (index >= 1 && index <= sectionIds.length) {
            var section = document.getElementById(sectionIds[index - 1]);
            if (section) {
                section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
                toast(sectionIds[index - 1]);
            }
        }
    });

    /* -------------------------------------------------------------- misc -- */

    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());

})();
