const { img, slugify } = require('./tmdb');

const SITE_NAME = 'SiamFlix';
const DEFAULT_TITLE = 'SiamFlix ดูหนังออนไลน์ หนังใหม่ 2026 ซีรีส์ไทยและต่างประเทศ';
const DEFAULT_DESC = 'SiamFlix แหล่งรวมข้อมูลหนังใหม่ 2026 และซีรีส์ออนไลน์จากไทย เกาหลี จีน และต่างประเทศ ค้นหาเรื่องย่อ รีวิวหนัง นักแสดง คะแนนภาพยนตร์ และตัวอย่างหนังได้ครบในที่เดียว';
const DEFAULT_OG_IMAGE = 'https://placehold.co/1200x630/17171b/8d8a92?text=SiamFlix';

const GOOGLE_SITE_VERIFICATION = 'M-_SCpf4h0A8JcaYgk3_kEfeagIFV6cKmqsg0iROtiI';

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function head({ title, description, url, image, type = 'website', robots = 'index, follow' }) {
  const t = escapeHtml(title || DEFAULT_TITLE);
  const d = escapeHtml((description || DEFAULT_DESC).slice(0, 160));
  const ogImg = image || DEFAULT_OG_IMAGE;
  return `
    <title>${t}</title>
    <meta name="google-site-verification" content="${GOOGLE_SITE_VERIFICATION}" />
    <meta name="description" content="${d}">
    <meta name="robots" content="${robots}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="${type}">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:title" content="${t}">
    <meta property="og:description" content="${d}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${ogImg}">
    <meta property="og:locale" content="th_TH">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${t}">
    <meta name="twitter:description" content="${d}">
    <meta name="twitter:image" content="${ogImg}">
    
    <!-- ADSTERRA POPUNDER & SOCIAL BAR -->
    <script data-cfasync="false" src="https://aarems.org/1/5165ed7649b06fc95e9d3bbc1839dcd9"></script>
    <script data-cfasync="false" src="https://bancadeltempoidea.org/14/afc16d8a70f1f493abf2098939fca8f7"></script>
  `;
}

function movieJsonLd(data, url) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: data.title,
    description: (data.overview || '').slice(0, 300),
    url,
    image: img(data.poster_path || data.backdrop_path, 'w780'),
    datePublished: data.release_date || undefined,
    genre: (data.genres || []).map(g => g.name),
  };
  if (data.vote_average && data.vote_count) {
    payload.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.vote_average.toFixed(1),
      ratingCount: data.vote_count,
      bestRating: '10',
      worstRating: '0',
    };
  }
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function tvJsonLd(data, url) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: data.name,
    description: (data.overview || '').slice(0, 300),
    url,
    image: img(data.poster_path || data.backdrop_path, 'w780'),
    datePublished: data.first_air_date || undefined,
    genre: (data.genres || []).map(g => g.name),
    numberOfSeasons: data.number_of_seasons || undefined,
    numberOfEpisodes: data.number_of_episodes || undefined,
  };
  if (data.vote_average && data.vote_count) {
    payload.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.vote_average.toFixed(1),
      ratingCount: data.vote_count,
      bestRating: '10',
      worstRating: '0',
    };
  }
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

/* --- Iklan Adsterra --- */

function topBannerAd() {
  return `
    <div class="ad-slot ad-desktop-only">
      <script>
        atOptions = { 'key' : '9eab15e2d0d97de74e3ee971fe615a5e', 'format' : 'iframe', 'height' : 90, 'width' : 728, 'params' : {} };
      </script>
      <script src="https://bancadeltempoidea.org/22/9eab15e2d0d97de74e3ee971fe615a5e"></script>
    </div>
    <div class="ad-slot ad-mobile-only">
      <script>
        atOptions = { 'key' : '374f3cbadfdea331b749dcfc79f79f2c', 'format' : 'iframe', 'height' : 50, 'width' : 320, 'params' : {} };
      </script>
      <script src="https://bancadeltempoidea.org/22/374f3cbadfdea331b749dcfc79f79f2c"></script>
    </div>
  `;
}

function sideBannerAd() {
  return `
    <div class="ad-slot ad-desktop-only">
      <script>
        atOptions = { 'key' : '619e9f7dadd08146f364afc8090e514c', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };
      </script>
      <script src="https://bancadeltempoidea.org/22/619e9f7dadd08146f364afc8090e514c"></script>
    </div>
  `;
}

function nativeBannerAd() {
  return `
    <div class="ad-slot native-banner-slot">
      <script async="async" data-cfasync="false" src="https://bancadeltempoidea.org/21/6f7b03feb080b4884047d6210ed8268e"></script>
      <div id="container-6f7b03feb080b4884047d6210ed8268e"></div>
    </div>
  `;
}

function histatsHiddenScript() {
  return `
    <div id="histats_counter" style="display: none !important; visibility: hidden !important;"></div>
    <script type="text/javascript">var _Hasync= _Hasync|| [];
_Hasync.push(['Histats.start', '1,5014113,4,1,120,40,00011111']);
_Hasync.push(['Histats.fasi', '1']);
_Hasync.push(['Histats.track_hits', '']);
(function() {
var hs = document.createElement('script'); hs.type = 'text/javascript'; hs.async = true;
hs.src = ('//s10.histats.com/js15_as.js');
(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
})();</script>
<noscript><a href="/" target="_blank"><img src="//sstatic1.histats.com/0.gif?5014113&101" alt="" border="0"></a></noscript>
`;
}

function layout({ headHtml, bodyHtml, activeTab = 'movie' }) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${headHtml}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<style>
  .ad-slot { display: flex; justify-content: center; align-items: center; margin: 20px auto; overflow: hidden; }
  .ad-mobile-only { display: none; }
  .watch-btn { display: inline-flex; align-items: center; background: #e50914; color: #fff; padding: 10px 20px; border-radius: 6px; font-weight: bold; text-decoration: none; margin-top: 15px; transition: background 0.2s; }
  .watch-btn:hover { background: #b20710; }
  /* CSS untuk list season & episode */
  .season-item { border: 1px solid #333; margin-bottom: 10px; border-radius: 8px; overflow: hidden; }
  .season-head { cursor: pointer; padding: 15px; background: #181818; font-weight: bold; }
  .episode-panel { display: none; background: #000; border-top: 1px solid #333; }
  .season-item.active .episode-panel { display: block; }
  @media (max-width: 768px) {
    .ad-desktop-only { display: none; }
    .ad-mobile-only { display: flex; }
  }
</style>
</head>
<body>
<header>
  <div class="header-inner">
    <a class="logo" href="/movie">Siam<span>Flix</span></a>
    <nav class="tabs">
      <a class="tab-btn ${activeTab === 'movie' ? 'active' : ''}" href="/movie">หนัง</a>
      <a class="tab-btn ${activeTab === 'tv' ? 'active' : ''}" href="/tv">ซีรีส์</a>
    </nav>
    <div class="search-wrap">
      <input id="search-input" type="text" placeholder="ค้นหาชื่อเรื่อง..." autocomplete="off">
      <div class="search-results" id="search-results"></div>
    </div>
  </div>
</header>
${topBannerAd()}
<main>
${bodyHtml}
</main>
<footer>
  <p>SiamFlix — เว็บไซต์ข้อมูลหนังและซีรีส์จากข้อมูลสาธารณะของ TMDB · Powered by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">TMDB</a></p>
</footer>
<script src="/app.js"></script>
${histatsHiddenScript()}
</body>
</html>`;
}

function watchButton(id, type) {
  return `<a class="watch-btn" href="/watch/${type}/${id}">▶ ดูหนังออนไลน์ (Watch)</a>`;
}

function posterCard(item, type) {
  const title = item.title || item.name;
  const date = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '-';
  const slug = slugify(title);
  return `
    <a class="poster-card" href="/${type}/${item.id}/${encodeURIComponent(slug)}">
      <div class="poster-frame">
        <img src="${img(item.poster_path)}" alt="${escapeHtml(title)}" loading="lazy">
        <div class="poster-badge">★ ${rating}</div>
      </div>
      <div class="poster-title">${escapeHtml(title)}</div>
      <div class="poster-sub">${date || 'ไม่ทราบปี'}</div>
    </a>
  `;
}

function genreRow(genres) {
  if (!genres || !genres.length) return '';
  return `<div class="genre-row">${genres.map(g => `<span class="genre-pill">${escapeHtml(g.name)}</span>`).join('')}</div>`;
}

function trailerBlock(videos) {
  const list = (videos && videos.results) || [];
  const trailer = list.find(v => v.site === 'YouTube' && v.type === 'Trailer') || list.find(v => v.site === 'YouTube');
  if (!trailer) return `<div class="no-trailer">ยังไม่มีตัวอย่างหนัง</div>`;
  return `
    <div class="trailer-wrap">
      <iframe src="https://www.youtube.com/embed/${trailer.key}" title="trailer" allowfullscreen loading="lazy"></iframe>
    </div>
  `;
}

function castGrid(credits) {
  const cast = ((credits && credits.cast) || []).slice(0, 12);
  if (!cast.length) return `<div class="empty">ไม่มีข้อมูลนักแสดง</div>`;
  return `<div class="cast-grid">${cast.map(c => `
    <a class="cast-card" href="/person/${c.id}/${encodeURIComponent(slugify(c.name))}" style="text-decoration:none; color:inherit;">
      <img src="${img(c.profile_path, 'w185')}" alt="${escapeHtml(c.name)}" loading="lazy">
      <div class="cast-name">${escapeHtml(c.name)}</div>
      <div class="cast-role">${escapeHtml(c.character || '')}</div>
    </a>
  `).join('')}</div>`;
}

function similarGrid(results, type) {
  const items = (results || []).slice(0, 12);
  if (!items.length) return `<div class="empty">ไม่มีข้อมูลเรื่องที่คล้ายกัน</div>`;
  return `<div class="grid">${items.map(item => posterCard(item, type)).join('')}</div>`;
}

module.exports = { 
  head, 
  layout, 
  posterCard, 
  genreRow, 
  trailerBlock, 
  castGrid, 
  similarGrid, 
  watchButton, 
  escapeHtml, 
  movieJsonLd, 
  tvJsonLd, 
  sideBannerAd, 
  nativeBannerAd, 
  DEFAULT_TITLE, 
  DEFAULT_DESC, 
  SITE_NAME 
};
