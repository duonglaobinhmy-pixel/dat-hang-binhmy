(function () {
    const data = window.ORDER_DATA || {};
    let rows = Array.isArray(data.proposal_rows) ? data.proposal_rows : [];
  
    const cycleOrder = ['DAILY', '3_DAYS', 'WEEKLY', '9_DAYS', 'MONTHLY', 'KHÁC'];
  
    function clean(v) {
      return String(v ?? '').replace(/\s+/g, ' ').trim();
    }
  
    function norm(v) {
      return clean(v)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toUpperCase();
    }
  
    function num(v) {
      const n = Number(v ?? 0);
      return Number.isFinite(n) ? n : 0;
    }
  
    function fmt(v) {
      return num(v).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
    }
  
    function esc(v) {
      return clean(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  
    function groupBy(list, fn) {
      return list.reduce((acc, r) => {
        const k = clean(fn(r)) || 'KHÁC';
        if (!acc[k]) acc[k] = [];
        acc[k].push(r);
        return acc;
      }, {});
    }
  
    function filteredRows() {
      const q = norm(document.getElementById('q')?.value || '');
      const cycle = clean(document.getElementById('cycleFilter')?.value || '');
  
      return rows.filter(r => {
        const text = norm([
          r.ma_nvl,
          r.ten_nvl,
          r.ncc,
          r.nhom_hang,
          r.chu_ky_dat
        ].join(' '));
  
        if (cycle && clean(r.chu_ky_dat) !== cycle) return false;
        if (q && !text.includes(q)) return false;
  
        return true;
      });
    }
  
    function table(list, mode) {
      const extraActual = mode === 'actual'
        ? `<th>SL thực tế</th><th>Đơn giá</th><th>Thành tiền</th><th>Trạng thái</th>`
        : '';
  
      return `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width:52px">STT</th>
                <th>Ngày ăn</th>
                <th>Ngày đặt</th>
                <th>Ngày giao</th>
                <th>Chu kỳ</th>
                <th>Nhóm</th>
                <th>Mã NVL</th>
                <th>Tên hàng</th>
                <th>ĐVT</th>
                <th>SL nấu</th>
                <th>Trước sơ chế</th>
                <th>Gối đầu</th>
                <th>HS</th>
                <th>SL đề xuất</th>
                ${extraActual}
                <th>NCC</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${list.map((r, i) => {
                const actual = mode === 'actual'
                  ? `
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><span class="badge">CHỜ CHỐT</span></td>
                  `
                  : '';
  
                return `
                  <tr>
                    <td class="center">${i + 1}</td>
                    <td>${esc(r.ngay_an)}</td>
                    <td>${esc(r.ngay_dat)}</td>
                    <td>${esc(r.ngay_giao)}</td>
                    <td class="center">${esc(r.chu_ky_dat)}</td>
                    <td>${esc(r.nhom_hang || r.nhom_ke_toan)}</td>
                    <td>${esc(r.ma_nvl)}</td>
                    <td class="name">${esc(r.ten_nvl)}</td>
                    <td class="center">${esc(r.don_vi)}</td>
                    <td class="right">${fmt(r.so_luong_nau)}</td>
                    <td class="right">${fmt(r.so_luong_truoc_so_che)}</td>
                    <td class="right">${fmt(r.rau_goi_dau)}</td>
                    <td class="center">${fmt(r.he_so_du_phong)}%</td>
                    <td class="right strong">${fmt(r.so_luong_de_xuat)}</td>
                    ${actual}
                    <td>${esc(r.ncc)}</td>
                    <td>${esc(r.ghi_chu)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  
    function section(title, list, mode) {
      return `
        <section class="block">
          <div class="block-title">
            <span>${esc(title)} — ${list.length} mặt hàng</span>
            <span class="block-sub">Tổng SL đề xuất: ${fmt(list.reduce((s, r) => s + num(r.so_luong_de_xuat), 0))}</span>
          </div>
          ${table(list, mode)}
        </section>
      `;
    }
  
    function renderSummary(list) {
      const byCycle = groupBy(list, r => r.chu_ky_dat);
      const byNcc = groupBy(list, r => r.ncc);
  
      const rau = list.filter(r => norm(`${r.nhom_hang} ${r.loai_nvl} ${r.ten_nvl}`).includes('RAU')).length;
      const monthly = list.filter(r => clean(r.chu_ky_dat) === 'MONTHLY').length;
  
      document.getElementById('summary').innerHTML = `
        <div class="card"><div class="label">Tổng mặt hàng</div><div class="value">${list.length}</div></div>
        <div class="card"><div class="label">Tổng NCC</div><div class="value">${Object.keys(byNcc).length}</div></div>
        <div class="card"><div class="label">Tổng chu kỳ</div><div class="value">${Object.keys(byCycle).length}</div></div>
        <div class="card"><div class="label">Rau củ</div><div class="value">${rau}</div></div>
        <div class="card"><div class="label">Hàng tháng</div><div class="value">${monthly}</div></div>
      `;
    }
  
    function renderCycle(list) {
      const byCycle = groupBy(list, r => r.chu_ky_dat);
  
      const keys = Object.keys(byCycle).sort((a, b) => {
        const ia = cycleOrder.indexOf(a);
        const ib = cycleOrder.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
  
      document.getElementById('cycleRoot').innerHTML = keys.length
        ? keys.map(k => section(`CHU KỲ: ${k}`, byCycle[k], 'proposal')).join('')
        : `<div class="formbox">Không có dữ liệu đề xuất đặt hàng.</div>`;
    }
  
    function renderActual(list) {
      document.getElementById('actualRoot').innerHTML = section('BẢNG CHỐT ĐẶT HÀNG THỰC TẾ', list, 'actual');
    }
  
    function renderNcc(list) {
      const byNcc = groupBy(list, r => r.ncc);
      const html = Object.entries(byNcc)
        .sort((a, b) => a[0].localeCompare(b[0], 'vi'))
        .map(([ncc, list]) => section(`NCC: ${ncc}`, list, 'proposal'))
        .join('');
  
      document.getElementById('nccRoot').innerHTML = html || `<div class="formbox">Chưa có NCC.</div>`;
    }
  
    function renderFilters() {
      const select = document.getElementById('cycleFilter');
      const cycles = Array.from(new Set(rows.map(r => clean(r.chu_ky_dat)).filter(Boolean)));
  
      cycles.sort((a, b) => {
        const ia = cycleOrder.indexOf(a);
        const ib = cycleOrder.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
  
      select.innerHTML = `
        <option value="">Tất cả chu kỳ</option>
        ${cycles.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
      `;
    }
  
    function renderAll() {
      const list = filteredRows();
      renderSummary(list);
      renderCycle(list);
      renderActual(list);
      renderNcc(list);
    }
  
    function setupTabs() {
      document.querySelectorAll('.tabbtn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.tab;
  
          document.querySelectorAll('.tabbtn').forEach(x => x.classList.remove('active'));
          document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  
          btn.classList.add('active');
          document.getElementById(id).classList.add('active');
        });
      });
    }
  
    function init() {
      setupTabs();
      renderFilters();
      renderAll();
  
      document.getElementById('q')?.addEventListener('input', renderAll);
      document.getElementById('cycleFilter')?.addEventListener('change', renderAll);
    }
  
    document.addEventListener('DOMContentLoaded', init);
  })();