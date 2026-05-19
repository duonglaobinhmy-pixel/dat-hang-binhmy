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
      if (v === null || v === undefined || v === '') return 0;
      if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  
      let s = String(v).trim().replace(/\s+/g, '');
      if (!s || s === '-') return 0;
  
      if (s.includes('.') && s.includes(',')) {
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
          s = s.replace(/\./g, '').replace(',', '.');
        } else {
          s = s.replace(/,/g, '');
        }
      } else if (s.includes(',') && !s.includes('.')) {
        s = s.replace(',', '.');
      }
  
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    }
  
    function fmt(v) {
      const n = num(v);
      if (!n) return '';
      return n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
    }
  
    function fmtKeepZero(v) {
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
  
    function isRau(r) {
      return norm(`${r.nhom_hang} ${r.loai_nvl} ${r.ten_nvl}`).includes('RAU');
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
  
    function totalDeXuat(list) {
      return list.reduce((s, r) => s + num(r.so_luong_de_xuat), 0);
    }
  
    function table(list, mode) {
      const actualHead = mode === 'actual'
        ? `
          <th>SL thực tế</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
          <th>Trạng thái</th>
        `
        : '';
  
      return `
        <div class="table-wrap">
          <table class="kt-table">
            <thead>
              <tr>
                <th rowspan="2" style="width:52px">STT</th>
                <th rowspan="2">Ngày ăn</th>
                <th rowspan="2">Ngày đặt</th>
                <th rowspan="2">Ngày giao</th>
                <th rowspan="2">Chu kỳ</th>
                <th rowspan="2">Nhóm</th>
                <th rowspan="2">Mã NVL</th>
                <th rowspan="2">Tên hàng</th>
                <th rowspan="2">ĐVT</th>
                <th rowspan="2">Tổng ngày</th>
                <th colspan="2">Sáng</th>
                <th colspan="2">Trưa</th>
                <th colspan="2">Chiều</th>
                <th rowspan="2">Gối đầu</th>
                <th rowspan="2">HS</th>
                <th rowspan="2">SL đề xuất</th>
                ${actualHead}
                <th rowspan="2">NCC</th>
                <th rowspan="2">Ghi chú</th>
              </tr>
              <tr>
                <th>GV-Q12</th>
                <th>Củ Chi</th>
                <th>GV-Q12</th>
                <th>Củ Chi</th>
                <th>GV-Q12</th>
                <th>Củ Chi</th>
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
                    <td class="right strong">${fmtKeepZero(r.so_luong_nau)}</td>
  
                    <td class="right">${fmt(r.sang_go_vap)}</td>
                    <td class="right">${fmt(r.sang_cu_chi)}</td>
                    <td class="right">${fmt(r.trua_go_vap)}</td>
                    <td class="right">${fmt(r.trua_cu_chi)}</td>
                    <td class="right">${fmt(r.chieu_go_vap)}</td>
                    <td class="right">${fmt(r.chieu_cu_chi)}</td>
  
                    <td class="right">${fmtKeepZero(r.rau_goi_dau)}</td>
                    <td class="center">${fmtKeepZero(r.he_so_du_phong)}%</td>
                    <td class="right strong red">${fmtKeepZero(r.so_luong_de_xuat)}</td>
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
            <span class="block-sub">Tổng SL đề xuất: ${fmtKeepZero(totalDeXuat(list))}</span>
          </div>
          ${table(list, mode)}
        </section>
      `;
    }
  
    function renderSummary(list) {
      const byCycle = groupBy(list, r => r.chu_ky_dat);
      const byNcc = groupBy(list, r => r.ncc);
      const rau = list.filter(isRau).length;
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
        .map(([ncc, group]) => section(`NCC: ${ncc}`, group, 'proposal'))
        .join('');
  
      document.getElementById('nccRoot').innerHTML = html || `<div class="formbox">Chưa có NCC.</div>`;
    }
  
    function renderFilters() {
      const select = document.getElementById('cycleFilter');
      if (!select) return;
  
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
          document.getElementById(id)?.classList.add('active');
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