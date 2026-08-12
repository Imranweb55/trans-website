/* =========================================================================
   Trans Infra & Logistics — Premium Page Transition
   -------------------------------------------------------------------------
   A horizontal light streak sweeps across the screen with the centered
   wordmark "TRANS INFRA GROUPS" while it plays — no spinner, no progress
   bar. Plays once on every page load (entrance) and again, faster, when
   the visitor clicks an internal link (exit), before the browser
   navigates to the next page. Total duration ~500-800ms either way.
   ========================================================================= */
(function () {
  "use strict";

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var overlay = document.querySelector(".page-transition");
  if (!overlay) return;

  if (prefersReduced) {
    // No motion: just make sure the overlay never blocks the page.
    overlay.style.display = "none";
    return;
  }

  var EXIT_DURATION = 400; // keep in sync with the .pt-exit CSS timings

  // ---- Entrance: play once this page has finished loading -----------
  function playEntrance() {
    overlay.classList.remove("pt-exit");
    overlay.classList.add("pt-run");
  }

  if (document.readyState === "complete") {
    requestAnimationFrame(function () {
      requestAnimationFrame(playEntrance);
    });
  } else {
    window.addEventListener("load", function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(playEntrance);
      });
    });
    // Safety net: never let a slow page keep the overlay up forever.
    setTimeout(playEntrance, 2200);
  }

  // ---- Exit: intercept clicks on internal page links -----------------
  function isInternalPageLink(a) {
    if (!a || !a.getAttribute("href")) return false;
    if (a.target && a.target !== "" && a.target !== "_self") return false;
    if (a.hasAttribute("download")) return false;

    var rawHref = a.getAttribute("href");
    if (rawHref.indexOf("#") === 0) return false; // pure in-page anchor
    if (rawHref.indexOf("mailto:") === 0 || rawHref.indexOf("tel:") === 0) {
      return false;
    }

    var url;
    try {
      url = new URL(a.href, window.location.href);
    } catch (e) {
      return false;
    }
    if (url.origin !== window.location.origin) return false;

    // Same-page anchor (e.g. company.html#team from company.html) — let
    // the browser handle the smooth in-page scroll untouched.
    if (url.pathname === window.location.pathname && url.hash) return false;

    return true;
  }

  document.addEventListener("click", function (e) {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    var a = e.target.closest("a[href]");
    if (!isInternalPageLink(a)) return;

    var dest = a.href;
    e.preventDefault();

    // Collapse an open mobile nav menu, if any, before transitioning.
    var openMenu = document.querySelector(".navbar-collapse.show");
    if (openMenu && window.bootstrap && window.bootstrap.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(openMenu).hide();
    }

    overlay.classList.remove("pt-run");
    void overlay.offsetWidth; // force reflow so the exit animation restarts cleanly
    overlay.classList.add("pt-exit");

    setTimeout(function () {
      window.location.href = dest;
    }, EXIT_DURATION);
  });
})();
