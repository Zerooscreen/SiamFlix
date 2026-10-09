document.addEventListener('DOMContentLoaded', () => {
  // Penanganan klik season untuk menampilkan daftar episode
  document.querySelectorAll('.season-item').forEach(item => {
    const head = item.querySelector('.season-head');
    if (!head) return;

    head.addEventListener('click', async () => {
      const tvId = item.getAttribute('data-tv');
      const seasonNum = item.getAttribute('data-season');
      const panel = item.querySelector('.episode-panel');

      if (!panel) return;

      // Toggle buka/tutup
      item.classList.toggle('active');
      if (!item.classList.contains('active')) return;

      // Jika sudah pernah di-load, jangan load ulang
      if (panel.innerHTML.trim() !== '') return;

      panel.innerHTML = '<div class="loading-ep" style="padding: 10px; color: #aaa;">กำลังโหลดตอน...</div>';

      try {
        const res = await fetch(`/api/season/${tvId}/${seasonNum}`);
        const data = await res.json();

        if (data.error || !data.episodes || data.episodes.length === 0) {
          panel.innerHTML = '<div class="empty-ep" style="padding: 10px; color: #aaa;">ไม่พบข้อมูลตอนในซีซั่นนี้</div>';
          return;
        }

        panel.innerHTML = data.episodes.map(ep => `
          <a href="${ep.url}" class="episode-card" style="display: flex; gap: 10px; padding: 10px; text-decoration: none; color: inherit; border-bottom: 1px solid #222;">
            <div class="ep-thumb" style="flex-shrink: 0;"><img src="${ep.still || '/img/no-thumb.jpg'}" alt="${escapeHtml(ep.name)}" style="width: 100px; border-radius: 4px; object-fit: cover;"></div>
            <div class="ep-info">
              <div class="ep-title" style="font-weight: bold; color: #fff; font-size: 0.95rem;">ตอนที่ ${ep.number}: ${escapeHtml(ep.name)}</div>
              <div class="ep-date" style="font-size: 0.8rem; color: #888; margin-top: 4px;">${ep.airDate || ''}</div>
            </div>
          </a>
        `).join('');
      } catch (err) {
        panel.innerHTML = '<div class="empty-ep" style="padding: 10px; color: #e50914;">เกิดข้อผิดพลาดในการโหลด</div>';
      }
    });
  });
});

// Helper escape HTML sederhana untuk keamanan di frontend
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
