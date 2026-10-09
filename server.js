const express = require('express');
const path = require('path');
const { tmdb, img, slugify } = require('./lib/tmdb');
const { head, layout, posterCard, genreRow, trailerBlock, castGrid, similarGrid, watchButton, escapeHtml, movieJsonLd, tvJsonLd, sideBannerAd, nativeBannerAd, DEFAULT_TITLE, DEFAULT_DESC, SITE_NAME } = require('./lib/render');

const app = express();
const PORT = process.env.PORT || 8080;

const SITE_URL = process.env.SITE_URL || 'https://siamflix.up.railway.app';

app.use(express.static(path.join(__dirname, 'public')));

const ROWS = {
  movie: [
    { key: '01', title: 'หนังมาแรงตอนนี้', path: '/trending/movie/week' },
    { key: '02', title: 'หนังยอดนิยม', path: '/movie/popular' },
    { key: '03', title: 'หนังเรตติ้งสูงสุด', path: '/movie/top_rated' },
    { key: '04', title: 'หนังที่จะเข้าฉายเร็วๆ นี้', path: '/movie/upcoming' },
  ],
  tv: [
    { key: '01', title: 'ซีรีส์มาแรงตอนนี้', path: '/trending/tv/week' },
    { key: '02', title: 'ซีรีส์ยอดนิยม', path: '/tv/popular' },
    { key: '03', title: 'ซีรีส์เรตติ้งสูงสุด', path: '/tv/top_rated' },
    { key: '04', title: 'ซีรีส์ที่กำลังฉาย', path: '/tv/on_the_air' },
  ],
};

// ---------- FORMAT JUDUL SEO ----------
function seoTitle(kind, title, originalTitle, year, epNumber = null, isEnded = false) {
  if (kind === 'movie') {
    const orig = originalTitle && originalTitle !== title ? originalTitle : title;
    return `~❄️(ดูหนังใหม่ฟรี‼️)➮ ${title} (FHD) เต็มเรื่อง ${orig} พากย์ไทย/ซับไทย ดูออนไลน์!..`;
  } else {
    const y = year || '2026';
    if (epNumber !== null) {
      const จบ = isEnded ? ' (จบ)' : '';
      return `ดูซีรี่ย์ ${title} (${y}) Ep.${epNumber}${จบ} พากย์ไทย/ซับไทย`;
    } else {
      return `ดูซีรี่ย์ ${title} (${y}) พากย์ไทย/ซับไทย`;
    }
  }
}

function seoDescription(title, year, genreNames) {
  const yearPart = year ? `ปี ${year}, ` : '';
  const genrePart = genreNames ? `แนว ${genreNames}, ` : '';
  return `เรื่องย่อ นักแสดง เรตติ้ง และตัวอย่างหนังอย่างเป็นทางการของ ${title} ดูได้ที่ ${SITE_NAME} ${genrePart}${yearPart}ข้อมูลฉายครบถ้วน`;
}

// ---------- HOME (/, /movie, /tv) ----------
async function renderHome(req, res, tab) {
  try {
    const heroData = await tmdb(tab === 'movie' ? '/trending/movie/week' : '/trending/tv/week');
    const hero = heroData.results[0];
    const heroTitle = hero ? (hero.title || hero.name) : SITE_NAME;
    const heroOverview = hero ? (hero.overview || '') : '';

    const rowsHtml = [];
    for (const def of ROWS[tab]) {
      const data = await tmdb(def.path);
      const cards = data.results.slice(0, 12).map(item => posterCard(item, tab)).join('');
      rowsHtml.push(`
        <section class="row">
          <div class="row-head"><span class="row-num">${def.key}</span><h2>${def.title}</h2></div>
          <div class="grid">${cards}</div>
        </section>
      `);
    }

    const heroHtml = hero ? `
      <div id="hero">
        <div class="hero-bg" style="background-image:url('${img(hero.backdrop_path, 'original')}')"></div>
        <div class="hero-fade"></div>
        <div class="hero-content">
          <div class="hero-eyebrow">มาแรงประจำสัปดาห์</div>
          <div class="hero-title">${escapeHtml(heroTitle)}</div>
          <div class="hero-overview">${escapeHtml(heroOverview).slice(0, 180)}${heroOverview.length > 180 ? '…' : ''}</div>
          <a class="hero-btn" href="/${tab}/${hero.id}/${encodeURIComponent(slugify(heroTitle))}">ดูรายละเอียด ▸</a>
        </div>
      </div>` : '';

    const bodyHtml = heroHtml + `<div id="rows">${rowsHtml.join('')}</div>`;

    const headHtml = head({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESC,
      url: `${SITE_URL}/${tab}`,
      image: hero ? img(hero.backdrop_path, 'w780') : null,
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: tab }));
  } catch (e) {
    res.status(500).send(layout({
      headHtml: head({ title: DEFAULT_TITLE, description: DEFAULT_DESC, url: `${SITE_URL}/${tab}` }),
      bodyHtml: `<div class="empty">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</div>`,
      activeTab: tab,
    }));
  }
}

app.get('/', (req, res) => renderHome(req, res, 'movie'));
app.get('/movie', (req, res) => renderHome(req, res, 'movie'));
app.get('/tv', (req, res) => renderHome(req, res, 'tv'));

// ---------- WATCH REDIRECT / COUNTDOWN PAGE ----------
app.get('/watch/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  let title = 'กำลังเตรียมลิงก์รับชม';
  try {
    const data = await tmdb(`/${type}/${id}`);
    title = data.title || data.name || 'กำลังเตรียมลิงก์รับชม';
  } catch (e) {}

  const bodyHtml = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; text-align:center; padding: 20px;">
      <h1 style="font-size: 1.8rem; margin-bottom: 15px; color: #fff;">กำลังพาคุณไปที่หน้า <span>${escapeHtml(title)}</span></h1>
      <p style="color: #aaa; margin-bottom: 25px;">กรุณารอสักครู่ ระบบกำลังเปลี่ยนเส้นทางใน <span id="countdown" style="color: #e50914; font-weight: bold; font-size: 1.5rem;">5</span> วินาที...</p>
      ${nativeBannerAd()}
      <div style="margin-top: 20px;">
        <a id="direct-link" href="https://moviegate.bolt.host/th?" class="watch-btn" style="text-decoration:none;">คลิกที่นี่หากรอนานเกินไป</a>
      </div>
    </div>
    <script>
      let seconds = 5;
      const countEl = document.getElementById('countdown');
      const timer = setInterval(() => {
        seconds--;
        if(countEl) countEl.innerText = seconds;
        if(seconds <= 0) {
          clearInterval(timer);
          window.location.href = 'https://moviegate.bolt.host/th';
        }
      }, 1000);
    </script>
  `;

  const headHtml = head({
    title: `กำลังเปลี่ยนเส้นทาง · ${SITE_NAME}`,
    description: DEFAULT_DESC,
    url: `${SITE_URL}/watch/${type}/${id}`,
    robots: 'noindex, nofollow',
  });

  res.send(layout({ headHtml, bodyHtml, activeTab: type === 'tv' ? 'tv' : 'movie' }));
});

// ---------- DETAIL: /movie/:id/:slug? ----------
app.get('/movie/:id/:slug?', async (req, res) => {
  const { id } = req.params;
  try {
    const [data, credits, videos, similar] = await Promise.all([
      tmdb(`/movie/${id}`),
      tmdb(`/movie/${id}/credits`),
      tmdb(`/movie/${id}/videos`),
      tmdb(`/movie/${id}/similar`),
    ]);
    const correctSlug = slugify(data.title);
    if (req.params.slug !== correctSlug) {
      return res.redirect(301, `/movie/${id}/${encodeURIComponent(correctSlug)}`);
    }

    const runtime = data.runtime ? `${Math.floor(data.runtime / 60)} ชม. ${data.runtime % 60} นาที` : 'ไม่ทราบข้อมูล';
    const bodyHtml = `
      <a class="back-btn" href="/movie">← กลับ</a>
      <div class="detail-hero">
        <div class="hero-bg" style="background-image:url('${img(data.backdrop_path, 'original')}')"></div>
        <div class="hero-fade"></div>
        <div class="detail-poster"><img src="${img(data.poster_path)}" alt="โปสเตอร์ ${escapeHtml(data.title)}"></div>
        <div class="detail-info">
          <div class="detail-eyebrow">หนัง</div>
          <h1 class="detail-title">${escapeHtml(data.title)}</h1>
          <div class="detail-orig">${escapeHtml(data.original_title)} · ${(data.release_date || '').slice(0, 4) || 'ไม่ทราบปี'}</div>
          ${data.tagline ? `<div class="tagline">"${escapeHtml(data.tagline)}"</div>` : ''}
          <div class="detail-meta">
            <span class="m-item star">★ ${data.vote_average ? data.vote_average.toFixed(1) : '-'} / 10</span>
            <span class="m-item">${runtime}</span>
            <span class="m-item">${escapeHtml(data.status || '')}</span>
          </div>
          ${genreRow(data.genres)}
          ${watchButton(data.id, 'movie')}
        </div>
      </div>
      <div class="section-block"><h3>เรื่องย่อ</h3><div class="bio-text">${escapeHtml(data.overview) || 'ยังไม่มีเรื่องย่อ'}</div></div>
      ${nativeBannerAd()}
      <div class="section-block"><h3>ตัวอย่างหนัง</h3>${trailerBlock(videos)}</div>
      <div class="section-block"><h3>นักแสดง</h3>${castGrid(credits)}</div>
      <div class="section-block"><h3>หนังที่คล้ายกัน</h3>${similarGrid(similar.results, 'movie')}</div>
      ${sideBannerAd()}
      ${movieJsonLd(data, `${SITE_URL}/movie/${id}/${encodeURIComponent(correctSlug)}`)}
    `;

    const headHtml = head({
      title: seoTitle('movie', data.title, data.original_title, (data.release_date || '').slice(0, 4)),
      description: seoDescription(data.title, (data.release_date || '').slice(0, 4), (data.genres || []).map(g => g.name).join(', ')),
      url: `${SITE_URL}/movie/${id}/${encodeURIComponent(correctSlug)}`,
      image: img(data.backdrop_path || data.poster_path, 'w780'),
      type: 'video.movie',
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: 'movie' }));
  } catch (e) {
    res.status(404).send(layout({
      headHtml: head({ title: 'ไม่พบข้อมูลหนัง', description: DEFAULT_DESC, url: `${SITE_URL}/movie/${id}`, robots: 'noindex, nofollow' }),
      bodyHtml: `<a class="back-btn" href="/movie">← กลับ</a><div class="empty">ไม่พบข้อมูลหนังเรื่องนี้</div>`,
      activeTab: 'movie',
    }));
  }
});

// ---------- DETAIL: /tv/:id/:slug? ----------
app.get('/tv/:id/:slug?', async (req, res) => {
  const { id } = req.params;
  try {
    const [data, credits, videos, similar] = await Promise.all([
      tmdb(`/tv/${id}`),
      tmdb(`/tv/${id}/credits`),
      tmdb(`/tv/${id}/videos`),
      tmdb(`/tv/${id}/similar`),
    ]);
    const correctSlug = slugify(data.name);
    if (req.params.slug !== correctSlug) {
      return res.redirect(301, `/tv/${id}/${encodeURIComponent(correctSlug)}`);
    }

    const seasons = (data.seasons || []).filter(s => s.season_number >= 0);
    const seasonsHtml = seasons.map(s => `
      <div class="season-item" data-season="${s.season_number}" data-tv="${id}">
        <div class="season-head">
          <img src="${img(s.poster_path, 'w92')}" alt="${escapeHtml(s.name)}">
          <div>
            <div class="s-title">${escapeHtml(s.name)}</div>
            <div class="s-meta">${s.episode_count} ตอน · ${(s.air_date || '').slice(0, 4) || 'ไม่ทราบปี'}</div>
          </div>
          <div class="chev">▶</div>
        </div>
        <div class="episode-panel"></div>
      </div>
    `).join('');

    const bodyHtml = `
      <a class="back-btn" href="/tv">← กลับ</a>
      <div class="detail-hero">
        <div class="hero-bg" style="background-image:url('${img(data.backdrop_path, 'original')}')"></div>
        <div class="hero-fade"></div>
        <div class="detail-poster"><img src="${img(data.poster_path)}" alt="โปสเตอร์ ${escapeHtml(data.name)}"></div>
        <div class="detail-info">
          <div class="detail-eyebrow">ซีรีส์</div>
          <h1 class="detail-title">${escapeHtml(data.name)}</h1>
          <div class="detail-orig">${escapeHtml(data.original_name)} · ${(data.first_air_date || '').slice(0, 4) || 'ไม่ทราบปี'}</div>
          ${data.tagline ? `<div class="tagline">"${escapeHtml(data.tagline)}"</div>` : ''}
          <div class="detail-meta">
            <span class="m-item star">★ ${data.vote_average ? data.vote_average.toFixed(1) : '-'} / 10</span>
            <span class="m-item">${data.number_of_seasons || '-'} ซีซั่น</span>
            <span class="m-item">${data.number_of_episodes || '-'} ตอน</span>
            <span class="m-item">${escapeHtml(data.status || '')}</span>
          </div>
          ${genreRow(data.genres)}
          ${watchButton(data.id, 'tv')}
        </div>
      </div>
      <div class="section-block"><h3>เรื่องย่อ</h3><div class="bio-text">${escapeHtml(data.overview) || 'ยังไม่มีเรื่องย่อ'}</div></div>
      ${nativeBannerAd()}
      <div class="section-block"><h3>ตัวอย่างหนัง</h3>${trailerBlock(videos)}</div>
      <div class="section-block"><h3>นักแสดง</h3>${castGrid(credits)}</div>
      <div class="section-block">
        <h3>ซีซั่นและตอน</h3>
        <div class="season-list" id="season-list">${seasonsHtml}</div>
      </div>
      <div class="section-block"><h3>ซีรีส์ที่คล้ายกัน</h3>${similarGrid(similar.results, 'tv')}</div>
      ${sideBannerAd()}
      ${tvJsonLd(data, `${SITE_URL}/tv/${id}/${encodeURIComponent(correctSlug)}`)}
    `;

    const headHtml = head({
      title: seoTitle('tv', data.name, null, (data.first_air_date || '').slice(0, 4)),
      description: seoDescription(data.name, (data.first_air_date || '').slice(0, 4), (data.genres || []).map(g => g.name).join(', ')),
      url: `${SITE_URL}/tv/${id}/${encodeURIComponent(correctSlug)}`,
      image: img(data.backdrop_path || data.poster_path, 'w780'),
      type: 'video.tv_show',
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: 'tv' }));
  } catch (e) {
    res.status(404).send(layout({
      headHtml: head({ title: 'ไม่พบข้อมูลซีรีส์', description: DEFAULT_DESC, url: `${SITE_URL}/tv/${id}`, robots: 'noindex, nofollow' }),
      bodyHtml: `<a class="back-btn" href="/tv">← กลับ</a><div class="empty">ไม่พบข้อมูลซีรีส์นี้</div>`,
      activeTab: 'tv',
    }));
  }
});

// ---------- DETAIL EPISODE: /tv/:id/season/:season/episode/:episode ----------
app.get('/tv/:id/season/:season/episode/:episode', async (req, res) => {
  const { id, season, episode } = req.params;
  try {
    const [tvData, epData] = await Promise.all([
      tmdb(`/tv/${id}`),
      tmdb(`/tv/${id}/season/${season}/episode/${episode}`)
    ]);

    const tvTitle = tvData.name || 'ซีรีส์';
    const year = (tvData.first_air_date || '').slice(0, 4);
    const isEnded = tvData.status === 'Ended' || tvData.status === 'Canceled';
    
    const seasonDetail = await tmdb(`/tv/${id}/season/${season}`);
    const totalEpInSeason = (seasonDetail.episodes || []).length;
    const isLastEpisode = parseInt(episode) === totalEpInSeason && isEnded;

    const embedUrl = `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;

    const bodyHtml = `
      <a class="back-btn" href="/tv/${id}/${encodeURIComponent(slugify(tvTitle))}">← กลับหน้าซีรีส์</a>
      <div class="detail-hero">
        <div class="hero-bg" style="background-image:url('${img(epData.still_path || tvData.backdrop_path, 'original')}')"></div>
        <div class="hero-fade"></div>
        <div class="detail-poster"><img src="${img(epData.still_path || tvData.poster_path)}" alt="ภาพตอน ${escapeHtml(epData.name)}"></div>
        <div class="detail-info">
          <div class="detail-eyebrow">${escapeHtml(tvTitle)} · ซีซั่น ${season} ตอนที่ ${episode}</div>
          <h1 class="detail-title">${escapeHtml(epData.name || `Ep. ${episode}`)}</h1>
          <div class="detail-orig">ออกอากาศ: ${escapeHtml(epData.air_date || 'ไม่ระบุ')}</div>
          <div class="detail-meta">
            <span class="m-item star">★ ${epData.vote_average ? epData.vote_average.toFixed(1) : '-'} / 10</span>
            <span class="m-item">ตอนที่ ${episode}</span>
          </div>
        </div>
      </div>

      <div class="section-block">
        <h3>รับชมตอนที่ ${episode}</h3>
        <div style="position:relative; width:100%; padding-bottom:56.25%; background:#000; border-radius:12px; overflow:hidden;">
          <iframe src="${embedUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe>
        </div>
      </div>

      <div class="section-block"><h3>เรื่องย่อประจำตอน</h3><div class="bio-text">${escapeHtml(epData.overview) || 'ยังไม่มีเรื่องย่อสำหรับตอนนี้'}</div></div>
      ${nativeBannerAd()}
    `;

    const headHtml = head({
      title: seoTitle('tv', tvTitle, null, year, episode, isLastEpisode),
      description: `ดูซีรีส์ ${tvTitle} ซีซั่น ${season} ตอนที่ ${episode} (${epData.name}) ซับไทย อรุณรุ่ง`,
      url: `${SITE_URL}/tv/${id}/season/${season}/episode/${episode}`,
      image: img(epData.still_path || tvData.backdrop_path, 'w780'),
      type: 'video.episode',
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: 'tv' }));
  } catch (e) {
    res.status(404).send(layout({
      headHtml: head({ title: 'ไม่พบข้อมูลตอน', description: DEFAULT_DESC, url: `${SITE_URL}/tv/${id}`, robots: 'noindex, nofollow' }),
      bodyHtml: `<a class="back-btn" href="/tv">← กลับ</a><div class="empty">ไม่พบข้อมูลตอนนี้</div>`,
      activeTab: 'tv',
    }));
  }
});

// ---------- PERSON DETAIL: /person/:id/:slug? ----------
app.get('/person/:id/:slug?', async (req, res) => {
  const { id } = req.params;
  try {
    const [person, credits] = await Promise.all([
      tmdb(`/person/${id}`),
      tmdb(`/person/${id}/combined_credits`),
    ]);
    const correctSlug = slugify(person.name);
    if (req.params.slug !== correctSlug) {
      return res.redirect(301, `/person/${id}/${encodeURIComponent(correctSlug)}`);
    }

    const castList = (credits.cast || []).sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
    const cards = castList.slice(0, 18).map(item => posterCard(item, item.media_type === 'tv' ? 'tv' : 'movie')).join('');

    const bodyHtml = `
      <a class="back-btn" href="/movie">← กลับหน้าแรก</a>
      <div class="person-profile" style="display:flex; gap:24px; align-items:center; margin: 20px 0; flex-wrap:wrap;">
        <img src="${img(person.profile_path, 'w300')}" alt="${escapeHtml(person.name)}" style="border-radius:12px; width:200px; object-fit:cover;">
        <div>
          <h1 style="font-size:2rem; margin-bottom:10px;">${escapeHtml(person.name)}</h1>
          <p style="color:#aaa; margin-bottom:8px;"><strong>อาชีพ:</strong> ${escapeHtml(person.known_for_department || '-')}</p>
          <p style="color:#aaa; margin-bottom:8px;"><strong>วันเกิด:</strong> ${escapeHtml(person.birthday || '-')}</p>
          <p style="color:#aaa;"><strong>สถานที่เกิด:</strong> ${escapeHtml(person.place_of_birth || '-')}</p>
        </div>
      </div>
      <div class="section-block"><h3>ประวัติส่วนตัว</h3><div class="bio-text">${escapeHtml(person.biography) || 'ไม่มีประวัติส่วนตัว'}</div></div>
      <div class="section-block"><h3>ผลงานการแสดง</h3><div class="grid">${cards}</div></div>
    `;

    const headHtml = head({
      title: `${person.name} · ประวัติ ผลงานและข้อมูลนักแสดง · SiamFlix`,
      description: `ประวัติและผลงานการแสดงของ ${person.name} ข้อมูลภาพยนตร์และซีรีส์ทั้งหมดที่ร่วมแสดง`,
      url: `${SITE_URL}/person/${id}/${encodeURIComponent(correctSlug)}`,
      image: img(person.profile_path, 'w780'),
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: 'movie' }));
  } catch (e) {
    res.status(404).send(layout({
      headHtml: head({ title: 'ไม่พบข้อมูลนักแสดง', description: DEFAULT_DESC, url: `${SITE_URL}`, robots: 'noindex, nofollow' }),
      bodyHtml: `<div class="empty">ไม่พบข้อมูลบุคคลนี้</div>`,
      activeTab: 'movie',
    }));
  }
});

// ---------- API proxy ----------
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ results: [] });
    const data = await tmdb('/search/multi', { query: q });
    const results = data.results
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 8)
      .map(r => ({
        id: r.id,
        type: r.media_type,
        title: r.title || r.name,
        year: (r.release_date || r.first_air_date || '').slice(0, 4),
        poster: img(r.poster_path, 'w92'),
        slug: slugify(r.title || r.name),
      }));
    res.json({ results });
  } catch (e) {
    res.status(500).json({ results: [], error: true });
  }
});

app.get('/api/season/:tvId/:seasonNumber', async (req, res) => {
  try {
    const { tvId, seasonNumber } = req.params;
    const data = await tmdb(`/tv/${tvId}/season/${seasonNumber}`);
    const episodes = (data.episodes || []).map(ep => ({
      number: ep.episode_number,
      name: ep.name,
      airDate: ep.air_date,
      rating: ep.vote_average ? ep.vote_average.toFixed(1) : '-',
      overview: ep.overview,
      still: img(ep.still_path, 'w300'),
      url: `/tv/${tvId}/season/${seasonNumber}/episode/${ep.episode_number}`
    }));
    res.json({ episodes });
  } catch (e) {
    res.status(500).json({ episodes: [], error: true });
  }
});

// ---------- sitemap.xml ----------
app.get('/sitemap.xml', async (req, res) => {
  try {
    const [mp, tp] = await Promise.all([
      tmdb('/movie/popular'),
      tmdb('/tv/popular'),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const urls = [
      { loc: `${SITE_URL}/movie`, priority: '1.0', changefreq: 'daily' },
      { loc: `${SITE_URL}/tv`, priority: '1.0', changefreq: 'daily' },
      ...(mp.results || []).map(m => ({ loc: `${SITE_URL}/movie/${m.id}/${encodeURIComponent(slugify(m.title))}`, priority: '0.7', changefreq: 'weekly' })),
      ...(tp.results || []).map(t => ({ loc: `${SITE_URL}/tv/${t.id}/${encodeURIComponent(slugify(t.name))}`, priority: '0.7', changefreq: 'weekly' })),
    ];
    const uniq = [...new Map(urls.map(u => [u.loc, u])).values()];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniq.map(u => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  } catch (e) {
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

// ---------- robots.txt ----------
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

app.listen(PORT, () => {
  console.log(`SiamFlix เซิร์ฟเวอร์ทำงานที่: http://localhost:${PORT}`);
});
