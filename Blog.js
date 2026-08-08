/* Trans Infra Group — Blog / Industry News
   Pulls real, live logistics & supply-chain news for India from Google News
   RSS feeds via the rss2json proxy (no backend required). Content is never
   hardcoded — every article shown is fetched at page load. */
(function () {
  "use strict";

  // Optional: sign up for a free key at https://rss2json.com/ and paste it
  // here to raise the rate limit for production traffic. Works without one
  // for light/demo traffic.
  var RSS2JSON_API_KEY = "";

  var CATEGORY_QUERIES = {
    Logistics: "logistics India",
    "Supply Chain": "supply chain India",
    "Freight & Shipping": "freight OR shipping India",
    Transportation: "transportation OR trucking India",
    Infrastructure: "infrastructure logistics India",
  };

  var state = {
    category: "Logistics",
    search: "",
    articles: [],
    cache: {},
  };

  var els = {};

  document.addEventListener("DOMContentLoaded", function () {
    els.filters = document.getElementById("blogFilters");
    els.search = document.getElementById("blogSearch");
    els.featured = document.getElementById("blogFeatured");
    els.trending = document.getElementById("blogTrending");
    els.grid = document.getElementById("blogGrid");
    els.count = document.getElementById("blogCount");
    els.empty = document.getElementById("blogEmpty");
    els.error = document.getElementById("blogError");

    if (!els.grid) return; // not on blog page

    els.filters.addEventListener("click", function (e) {
      var btn = e.target.closest(".blog-filter-btn");
      if (!btn) return;
      Array.prototype.forEach.call(
        els.filters.querySelectorAll(".blog-filter-btn"),
        function (b) {
          b.classList.remove("active");
        },
      );
      btn.classList.add("active");
      state.category = btn.dataset.categoryClean || btn.dataset.category;
      loadCategory(state.category);
    });

    var searchTimer;
    els.search.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.search = els.search.value.trim().toLowerCase();
        renderGrid();
      }, 200);
    });

    loadCategory(state.category);
  });

  function loadCategory(category) {
    showSkeletons();
    hide(els.empty);
    hide(els.error);

    if (state.cache[category]) {
      state.articles = state.cache[category];
      renderAll();
      return;
    }

    fetchNews(category)
      .then(function (articles) {
        state.cache[category] = articles;
        state.articles = articles;
        renderAll();
      })
      .catch(function (err) {
        console.error("[blog.js] fetch failed", err);
        els.grid.innerHTML = "";
        show(els.error);
        els.featured.innerHTML = "";
        els.trending.innerHTML = "";
      });
  }

  function fetchNews(category) {
    var query = CATEGORY_QUERIES[category] || category;
    var rssUrl =
      "https://news.google.com/rss/search?q=" +
      encodeURIComponent(query) +
      "&hl=en-IN&gl=IN&ceid=IN:en";
    var apiUrl =
      "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent(rssUrl) +
      (RSS2JSON_API_KEY
        ? "&api_key=" + encodeURIComponent(RSS2JSON_API_KEY)
        : "");

    return fetch(apiUrl)
      .then(function (res) {
        if (!res.ok)
          throw new Error("Network response was not ok (" + res.status + ")");
        return res.json();
      })
      .then(function (data) {
        if (data.status !== "ok" || !Array.isArray(data.items)) {
          throw new Error("Unexpected feed response");
        }
        return data.items.map(function (item, idx) {
          return {
            id: category + "-" + idx,
            title: stripHtml(item.title || "Untitled"),
            link: item.link,
            pubDate: item.pubDate,
            source: extractSource(item),
            image:
              item.thumbnail || extractImageFromDescription(item.description),
            summary: truncate(stripHtml(item.description || ""), 160),
          };
        });
      });
  }

  function extractSource(item) {
    if (item.author) return item.author;
    if (item.title && item.title.indexOf(" - ") !== -1) {
      var parts = item.title.split(" - ");
      return parts[parts.length - 1];
    }
    return "Google News";
  }

  function extractImageFromDescription(desc) {
    if (!desc) return "";
    var m = /<img[^>]+src="([^"]+)"/i.exec(desc);
    return m ? m[1] : "";
  }

  function stripHtml(html) {
    var tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
  }

  function truncate(str, len) {
    if (str.length <= len) return str;
    return str.slice(0, len).replace(/\s+\S*$/, "") + "…";
  }

  function formatDate(pubDate) {
    if (!pubDate) return "";
    var d = new Date(pubDate);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function renderAll() {
    renderFeatured();
    renderTrending();
    renderGrid();
  }

  function getFiltered() {
    if (!state.search) return state.articles;
    return state.articles.filter(function (a) {
      return (
        a.title.toLowerCase().indexOf(state.search) !== -1 ||
        a.summary.toLowerCase().indexOf(state.search) !== -1
      );
    });
  }

  function renderFeatured() {
    var a = state.articles[0];
    if (!a) {
      els.featured.innerHTML = "";
      return;
    }
    els.featured.innerHTML =
      '<a href="' +
      escapeAttr(a.link) +
      '" target="_blank" rel="noopener noreferrer" class="blog-featured-card reveal is-visible">' +
      '<div class="blog-featured-media" style="' +
      (a.image ? "background-image:url('" + escapeAttr(a.image) + "')" : "") +
      '">' +
      (a.image
        ? ""
        : '<div class="blog-featured-noimg">Trans Infra Group</div>') +
      "</div>" +
      '<div class="blog-featured-body">' +
      '<span class="blog-badge">Featured</span>' +
      '<h3 class="blog-featured-title">' +
      escapeHtml(a.title) +
      "</h3>" +
      '<p class="blog-featured-summary">' +
      escapeHtml(a.summary) +
      "</p>" +
      '<div class="blog-meta"><span>' +
      escapeHtml(a.source) +
      "</span><span>" +
      escapeHtml(formatDate(a.pubDate)) +
      "</span></div>" +
      "</div></a>";
  }

  function renderTrending() {
    var items = state.articles.slice(1, 6);
    if (!items.length) {
      els.trending.innerHTML = "";
      return;
    }
    els.trending.innerHTML = items
      .map(function (a, i) {
        return (
          '<a href="' +
          escapeAttr(a.link) +
          '" target="_blank" rel="noopener noreferrer" class="blog-trending-item reveal is-visible">' +
          '<span class="blog-trending-rank">' +
          (i + 1) +
          "</span>" +
          '<span class="blog-trending-title">' +
          escapeHtml(a.title) +
          "</span>" +
          "</a>"
        );
      })
      .join("");
  }

  function renderGrid() {
    var items = getFiltered().slice(1); // featured already shown above
    els.count.textContent = items.length
      ? items.length + " article" + (items.length === 1 ? "" : "s")
      : "";

    if (!items.length) {
      els.grid.innerHTML = "";
      show(els.empty);
      return;
    }
    hide(els.empty);

    els.grid.innerHTML = items
      .map(function (a) {
        return (
          '<div class="col-md-6 col-lg-4">' +
          '<a href="' +
          escapeAttr(a.link) +
          '" target="_blank" rel="noopener noreferrer" class="blog-card reveal is-visible">' +
          '<div class="blog-card-media" style="' +
          (a.image
            ? "background-image:url('" + escapeAttr(a.image) + "')"
            : "") +
          '">' +
          (a.image
            ? ""
            : '<div class="blog-card-noimg">Trans Infra Group</div>') +
          "</div>" +
          '<div class="blog-card-body">' +
          '<div class="blog-meta"><span>' +
          escapeHtml(a.source) +
          "</span><span>" +
          escapeHtml(formatDate(a.pubDate)) +
          "</span></div>" +
          '<h3 class="blog-card-title">' +
          escapeHtml(a.title) +
          "</h3>" +
          '<p class="blog-card-summary">' +
          escapeHtml(a.summary) +
          "</p>" +
          '<span class="blog-read-more">Read More →</span>' +
          "</div></a></div>"
        );
      })
      .join("");
  }

  function showSkeletons() {
    els.featured.innerHTML =
      '<div class="blog-featured-skel skel-block"></div>';
    els.trending.innerHTML =
      '<div class="skel-line"></div><div class="skel-line"></div><div class="skel-line"></div>';
    var skel = "";
    for (var i = 0; i < 6; i++) {
      skel +=
        '<div class="col-md-6 col-lg-4"><div class="blog-card-skel skel-block"></div></div>';
    }
    els.grid.innerHTML = skel;
    els.count.textContent = "";
  }

  function show(el) {
    if (el) el.classList.remove("d-none");
  }
  function hide(el) {
    if (el) el.classList.add("d-none");
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }
})();
