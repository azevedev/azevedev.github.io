/* ==========================================================================
   Matheus Azevedo — portfolio analytics
   A thin, optional wrapper around the Umami tracker plus one delegated click
   listener. Deliberately separate from app.js: nothing here affects what the
   page does, so a blocked tracker cannot take the portfolio down with it.

   What we send is deliberately coarse — which project link was followed, which
   contact channel was used, whether the CV was downloaded. No form contents,
   no scroll recording, nothing that identifies a visitor.
   ========================================================================== */

(function () {
    'use strict';

    // One Umami website covers all of azevedev.github.io, so every event is
    // stamped with its source to stay separable from the games at
    // /atlas-arcade/ and /omret/.
    var SITE = 'portfolio';

    // Umami caps event names at 50 characters.
    var EVENT_MAX = 50;

    function track(event, data) {
        var um = window.umami;
        if (!um || typeof um.track !== 'function') return;
        try {
            var payload = { site: SITE };
            for (var k in data) {
                if (Object.prototype.hasOwnProperty.call(data, k) && data[k] != null) {
                    payload[k] = data[k];
                }
            }
            um.track(String(event).slice(0, EVENT_MAX), payload);
        } catch (e) {
            // Analytics is never worth an exception.
        }
    }

    /* ----------------------------------------------------- click routing -- */

    // The project cards carry no id, so the heading is the only stable name for
    // the thing that was clicked. Falls back to the hostname for a stray link.
    function projectOf(el) {
        var card = el.closest ? el.closest('.card') : null;
        var heading = card && card.querySelector('h3');
        return heading ? heading.textContent.trim() : null;
    }

    document.addEventListener('click', function (e) {
        var el = e.target.closest && e.target.closest('a[href], button[data-copy]');
        if (!el) return;

        // The copy buttons sit next to the email and phone links and never
        // navigate, so they are a contact signal the anchors would miss.
        if (el.tagName === 'BUTTON') {
            var copied = el.dataset.copy || '';
            track('contact', {
                channel: copied.indexOf('@') > -1 ? 'email' : 'phone',
                how: 'copy'
            });
            return;
        }

        // The raw attribute is what distinguishes the schemes and in-page jumps;
        // everything after that reads the anchor's resolved properties, so a
        // relative href classifies exactly like the absolute one beside it.
        var raw = el.getAttribute('href') || '';

        if (raw.charAt(0) === '#') return; // in-page navigation, not an exit

        if (raw.indexOf('mailto:') === 0) {
            track('contact', { channel: 'email', how: 'link' });
        } else if (raw.indexOf('tel:') === 0) {
            track('contact', { channel: 'phone', how: 'link' });
        } else if (el.hasAttribute('download') || /\.pdf($|\?)/.test(el.pathname)) {
            // The single most useful signal a portfolio has.
            track('cv_download');
        } else if (el.protocol === 'http:' || el.protocol === 'https:') {
            var offsite = el.hostname !== location.hostname;
            // A link back to this same page is a query or hash change, not an exit.
            if (!offsite && el.pathname === location.pathname) return;
            // Same-origin exits are the games and older projects. Their own
            // pageviews confirm the landing; this records the departure.
            track('outbound', {
                to: offsite ? el.hostname : el.pathname,
                project: projectOf(el)
            });
        }
    }, true);
}());
