/* Trans Infra & Logistics — site interactions */
(function () {
  "use strict";
  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // Each feature is independent — if one throws, the rest of the page
    // (and critically, the scroll-reveal content) must still work.
    var steps = [
      setYear,
      initScrollProgress,
      initNavbarSolid,
      initReveal,
      initCounters,
      initParallaxHero,
      initCardTilt,
      initButtonRipple,
      initBackToTop,
      initSubnavScrollspy,
      initFleetFilters,
      initTestimonialSwipe,
    ];
    steps.forEach(function (fn) {
      try {
        fn();
      } catch (err) {
        console.error("[site.js]", fn.name, err);
      }
    });
    // Fail-safe: no matter what goes wrong above, nothing should stay
    // invisible forever. Force-reveal anything still hidden after 1.6s.
    setTimeout(function () {
      Array.prototype.forEach.call(
        document.querySelectorAll(".reveal:not(.is-visible)"),
        function (el) {
          el.classList.add("is-visible");
        },
      );
    }, 1600);
  }

  function setYear() {
    var yEl = document.getElementById("y");
    if (yEl) yEl.textContent = new Date().getFullYear();
  }

  // ---- Scroll progress bar ----------------------------------------------
  function initScrollProgress() {
    var bar = document.querySelector(".scroll-progress");
    if (!bar) return;
    var onScroll = function () {
      var h = document.documentElement;
      var scrollTop = h.scrollTop || document.body.scrollTop;
      var height = h.scrollHeight - h.clientHeight;
      var pct = height > 0 ? (scrollTop / height) * 100 : 0;
      bar.style.width = pct + "%";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }

  // ---- Navbar solid-on-scroll -------------------------------------------
  function initNavbarSolid() {
    var nav = document.querySelector(".navbar");
    if (!nav) return;
    var onScroll = function () {
      var solid = window.scrollY > 8;
      nav.classList.toggle("is-solid", solid);
      var logo = nav.querySelector(".brand-logo");
      if (logo && logo.dataset.logoLight && logo.dataset.logoDark) {
        logo.setAttribute(
          "src",
          solid ? logo.dataset.logoDark : logo.dataset.logoLight,
        );
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---- Scroll reveal ------------------------------------------------------
  function initReveal() {
    var addReveal = function (selector, opts) {
      opts = opts || {};
      var nodes = Array.prototype.slice.call(
        document.querySelectorAll(selector),
      );
      if (!nodes.length) return;
      if (prefersReduced) {
        nodes.forEach(function (n) {
          n.classList.add("is-visible");
        });
        return;
      }
      nodes.forEach(function (n) {
        n.classList.add("reveal");
        if (opts.extraClass) n.classList.add(opts.extraClass);
      });
      var stagger = opts.stagger != null ? opts.stagger : 90;
      var rootMargin = opts.rootMargin || "0px 0px -5% 0px";
      var threshold = opts.threshold != null ? opts.threshold : 0.01;
      var io = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var el = entry.target;
              var group = nodes.filter(function (n) {
                return n.parentElement === el.parentElement;
              });
              var idx = group.indexOf(el);
              var baseDelay =
                opts.delay != null
                  ? opts.delay
                  : opts.noDelay
                    ? 0
                    : Math.max(0, idx) * stagger;
              el.style.transitionDelay = baseDelay + "ms";
              void el.offsetWidth;
              el.classList.add("is-visible");
              obs.unobserve(el);
            }
          });
        },
        { rootMargin: rootMargin, threshold: threshold },
      );
      nodes.forEach(function (n) {
        io.observe(n);
      });
    };

    addReveal("header .content", { delay: 120, stagger: 0 });
    // Fixes the white-screen bug: several pages have class="reveal" baked
    // straight onto the <section> itself. Earlier this only revealed the
    // *children* inside a section, never the section wrapper, so the whole
    // block stayed invisible forever. This call reveals those wrappers too.
    addReveal("section.reveal", { stagger: 0, extraClass: "reveal-fade" });
    addReveal("section .section-title", {
      stagger: 60,
      extraClass: "reveal-fade",
    });
    addReveal("section .section-lead", {
      stagger: 60,
      extraClass: "reveal-fade",
    });
    addReveal("#who .who-card", { stagger: 120 });
    addReveal("#services .feature-card", { stagger: 120 });
    addReveal("#wind .container", {
      delay: 120,
      stagger: 120,
      extraClass: "reveal-fade",
    });
    addReveal("#projects .feature-card", { stagger: 120 });
    addReveal("#about .testimonial-card", {
      stagger: 140,
      extraClass: "reveal-fade",
    });
    addReveal("#about .logo-marquee", { noDelay: true });
    addReveal(".sector-card", { stagger: 90 });
    addReveal(".kpi-card", { stagger: 80 });
    addReveal(".director-card", { extraClass: "reveal-fade" });
    addReveal(".svc-block", { extraClass: "reveal-fade" });
    addReveal(".page-hero .content", { delay: 100, stagger: 0 });
  }

  // ---- Animated number counters -----------------------------------------
  function initCounters() {
    var els = Array.prototype.slice.call(
      document.querySelectorAll(
        ".kpi-card .display-6, #wind .spec h3, .stat-card h3",
      ),
    );
    if (!els.length) return;

    function animate(el) {
      var text = el.textContent;
      var match = text.match(/[\d,]+/);
      if (!match) return; // nothing numeric (e.g. "24×7", "Zero") — leave as-is
      var raw = match[0];
      var target = parseInt(raw.replace(/,/g, ""), 10);
      if (isNaN(target)) return;
      var prefix = text.slice(0, match.index);
      var suffix = text.slice(match.index + raw.length);
      var dur = prefersReduced ? 0 : 1200;
      var startTime = null;

      if (dur === 0) {
        return;
      }

      function useGrouping() {
        return raw.indexOf(",") !== -1;
      }

      function step(ts) {
        if (startTime === null) startTime = ts;
        var progress = Math.min(1, (ts - startTime) / dur);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(eased * target);
        var display = useGrouping()
          ? current.toLocaleString("en-IN")
          : String(current);
        el.textContent = prefix + display + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = prefix + raw + suffix;
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            animate(e.target);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  // ---- Hero parallax ------------------------------------------------------
  function initParallaxHero() {
    if (prefersReduced) return;
    var media = document.querySelector(".hero .hero-media");
    var hero = document.querySelector(".hero");
    if (!media || !hero) return;
    var ticking = false;
    function update() {
      var rect = hero.getBoundingClientRect();
      var progress = Math.min(
        1,
        Math.max(0, (0 - rect.top) / (rect.height || 1)),
      );
      media.style.transform =
        "translateY(" +
        progress * 60 +
        "px) scale(" +
        (1 + progress * 0.06) +
        ")";
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );
    update();
  }

  // ---- Card tilt on pointer move ------------------------------------------
  function initCardTilt() {
    if (prefersReduced) return;
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;
    var cards = document.querySelectorAll(
      ".feature-card, .sector-card, .who-card",
    );
    cards.forEach(function (card) {
      var raf = null;
      card.style.transformStyle = "preserve-3d";
      card.addEventListener("mousemove", function (e) {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          var rx = (py * -6).toFixed(2);
          var ry = (px * 6).toFixed(2);
          card.style.transform =
            "perspective(900px) rotateX(" +
            rx +
            "deg) rotateY(" +
            ry +
            "deg) translateY(-4px)";
        });
      });
      card.addEventListener("mouseleave", function () {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      });
    });
  }

  // ---- Button ripple -------------------------------------------------------
  function initButtonRipple() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".btn") : null;
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var span = document.createElement("span");
      span.className = "ripple";
      span.style.width = span.style.height = size + "px";
      span.style.left = e.clientX - rect.left - size / 2 + "px";
      span.style.top = e.clientY - rect.top - size / 2 + "px";
      btn.appendChild(span);
      span.addEventListener("animationend", function () {
        span.remove();
      });
    });
  }

  // ---- Back to top --------------------------------------------------------
  function initBackToTop() {
    var btn = document.querySelector(".back-to-top");
    if (!btn) return;
    var onScroll = function () {
      btn.classList.toggle("is-visible", window.scrollY > 480);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  // ---- Subnav scrollspy -----------------------------------------------------
  function initSubnavScrollspy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".subnav-link"),
    );
    if (!links.length) return;
    var map = {};
    links.forEach(function (a) {
      map[a.getAttribute("href").slice(1)] = a;
    });
    var sections = Object.keys(map)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);
    var setActive = function (id) {
      links.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + id);
      });
    };
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0.01 },
    );
    sections.forEach(function (s) {
      io.observe(s);
    });

    var subnav = document.querySelector(".subnav");
    if (subnav) {
      subnav.addEventListener("click", function (ev) {
        var a = ev.target.closest("a.subnav-link");
        if (!a) return;
        var c = document.getElementById("nav");
        if (c && c.classList.contains("show") && window.bootstrap) {
          new bootstrap.Collapse(c).hide();
        }
      });
    }
  }

  // ---- Fleet & Equipment quick filters --------------------------------------
  function initFleetFilters() {
    var chipBar = document.getElementById("chip-bar");
    var listView = document.getElementById("list-view");
    if (!chipBar) return;
    var selected = new Set();

    function applyFilters() {
      var items = document.querySelectorAll("#list-view .filter-item");
      if (selected.size === 0) {
        items.forEach(function (el) {
          el.classList.remove("d-none");
        });
      } else {
        items.forEach(function (el) {
          var tags = (el.getAttribute("data-tags") || "").split(/\s+/);
          var show = tags.some(function (t) {
            return selected.has(t);
          });
          el.classList.toggle("d-none", !show);
        });
      }
      document
        .querySelectorAll("#list-view .group-block")
        .forEach(function (group) {
          var children = Array.prototype.slice.call(
            group.querySelectorAll(".filter-item"),
          );
          var allHidden =
            children.length &&
            children.every(function (c) {
              return c.classList.contains("d-none");
            });
          group.classList.toggle("d-none", selected.size > 0 && allHidden);
        });
    }

    function clearAll() {
      selected.clear();
      chipBar.querySelectorAll("button[data-filter]").forEach(function (b) {
        b.classList.remove("active");
      });
      applyFilters();
    }

    chipBar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      var key = btn.dataset.filter;
      if (key === "all") {
        clearAll();
        return;
      }
      btn.classList.toggle("active");
      if (btn.classList.contains("active")) selected.add(key);
      else selected.delete(key);
      applyFilters();
    });

    if (listView) listView.classList.remove("d-none");
    applyFilters();
  }

  // ---- Testimonial carousel: pause on hover (progressive enhancement) ------
  function initTestimonialSwipe() {
    var carousel = document.getElementById("testimonials");
    if (!carousel || !window.bootstrap) return;
    var instance = null;
    try {
      instance = bootstrap.Carousel.getOrCreateInstance(carousel);
    } catch (e) {
      return;
    }
    carousel.addEventListener("mouseenter", function () {
      instance.pause();
    });
    carousel.addEventListener("mouseleave", function () {
      instance.cycle();
    });
  }
})();
