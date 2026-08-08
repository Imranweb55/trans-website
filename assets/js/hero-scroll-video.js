/* ==========================================================================
   Trans Infra & Logistics — Hero Scroll-Controlled Background Video
   --------------------------------------------------------------------------
   Apple-product-page style effect:
     • The video never autoplays and never loops.
     • Its timeline (currentTime) is tied 1:1 to scroll position.
     • Scrolling down plays the video forward, scrolling up reverses it.
     • The Hero section stays pinned on screen for the entire scrub range,
       then releases and normal page scrolling continues underneath it.
     • Stop scrolling → the video stops instantly, on the exact frame.

   This file is fully self-contained and additive: it does not modify any
   existing markup, styles, or other scripts. It only takes over control of
   the .hero-video element that already exists in the page.
   ========================================================================== */
(function () {
  "use strict";

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", initHeroScrollVideo);

  function initHeroScrollVideo() {
    var hero = document.querySelector(".hero");
    var video = hero ? hero.querySelector(".hero-video") : null;

    if (!hero || !video) return;

    // Respect users who've asked for reduced motion: leave the poster/first
    // frame showing instead of scrubbing.
    if (prefersReduced) return;

    // If GSAP or ScrollTrigger failed to load (e.g. offline / CDN blocked),
    // fail silently — the poster image already provides a static fallback.
    if (
      typeof window.gsap === "undefined" ||
      typeof window.ScrollTrigger === "undefined"
    ) {
      console.warn(
        "[hero-scroll-video] GSAP/ScrollTrigger not available — hero video will stay static.",
      );
      return;
    }

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    // Hard guarantee: never let the browser auto-play or loop this video.
    // It is 100% scroll-driven.
    video.autoplay = false;
    video.loop = false;
    video.removeAttribute("autoplay");
    video.removeAttribute("loop");
    video.pause();

    // How much scroll distance (as a % of viewport height) is dedicated to
    // scrubbing through the entire clip before the Hero unpins and normal
    // scrolling continues to the next section. Configurable per-page via
    // data-scrub-length="NNN" on the .hero element (defaults to 250 = 2.5x
    // viewport heights of scroll to play the full video, similar in feel
    // to Apple product pages).
    var scrubLengthVh =
      parseInt(hero.getAttribute("data-scrub-length"), 10) || 250;

    var scrubTween = null;

    function buildScrollTrigger() {
      // Video metadata not ready yet — duration unknown, can't build the
      // scrub timeline. build() is re-invoked once metadata is loaded.
      if (
        !video.duration ||
        isNaN(video.duration) ||
        !isFinite(video.duration)
      ) {
        return;
      }

      // Guard against double-init (e.g. metadata + resize firing together).
      if (scrubTween) return;

      scrubTween = gsap.fromTo(
        video,
        { currentTime: 0 },
        {
          currentTime: video.duration,
          ease: "none", // linear: scroll position <-> video time stay 1:1
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "+=" + scrubLengthVh + "%",
            scrub: true, // exact sync, no catch-up delay — instant stop
            pin: true, // Hero stays pinned while the video is being scrubbed
            anticipatePin: 1, // avoids a flash of unpinned content on fast scroll
            invalidateOnRefresh: true, // recompute duration/bounds on resize
          },
        },
      );
    }

    // iOS/Safari will not allow programmatic seeking (currentTime) on a
    // video that has never been played. This silent play → immediate pause
    // "unlocks" frame-accurate seeking without the visitor ever seeing or
    // hearing playback happen.
    function unlockSeeking() {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(function () {
            video.pause();
            video.currentTime = 0;
          })
          .catch(function () {
            // Blocked by the browser's autoplay policy — scrubbing will
            // still work once the page has any user interaction (a scroll
            // itself counts), so no further action needed here.
          });
      } else {
        video.pause();
      }
    }

    if (video.readyState >= 1 /* HAVE_METADATA */) {
      buildScrollTrigger();
    } else {
      video.addEventListener("loadedmetadata", buildScrollTrigger, {
        once: true,
      });
    }

    video.addEventListener("canplaythrough", unlockSeeking, { once: true });

    // Keep the pinned scroll distance / duration correct across viewport
    // and orientation changes (debounced to avoid thrashing).
    var resizeTimer;
    window.addEventListener(
      "resize",
      function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          ScrollTrigger.refresh();
        }, 200);
      },
      { passive: true },
    );
  }
})();
