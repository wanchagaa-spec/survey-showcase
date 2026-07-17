/* แกนกลางของเว็บ ใช้ร่วมกันทุกหน้า — ปกติไม่ต้องแก้ไฟล์นี้
   แก้ที่ assets/config.js อย่างเดียว */
(function(){
  "use strict";

  const $  = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s)
    .replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const page = document.body.dataset.page;

  /* ── โหลดข้อมูลจาก Google Sheets พร้อมแคช ────────────────── */
  const TTL = (SITE.cacheMin || 5) * 60 * 1000;

  async function sheet(name){
    // ไม่ได้ต่อ Sheets → ใช้ข้อมูลตัวอย่างในไฟล์ config
    if (!SITE.endpoint) {
      await new Promise(r => setTimeout(r, 320));   // จำลองเวลาโหลดให้เห็นสถานะจริง
      return (SITE.demo && SITE.demo[name]) || [];
    }

    const key = "cache_" + name;
    try {
      const hit = JSON.parse(sessionStorage.getItem(key) || "null");
      if (hit && Date.now() - hit.t < TTL) return hit.d;
    } catch(e){}

    const url = SITE.endpoint + (SITE.endpoint.indexOf("?") === -1 ? "?" : "&") +
                "sheet=" + encodeURIComponent(name);
    const res = await fetch(url);
    const out = await res.json();
    if (!out.ok) throw new Error(out.error || "โหลดข้อมูลไม่สำเร็จ");

    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: out.rows })); } catch(e){}
    return out.rows;
  }

  /* แถวที่ยังใช้งาน: คอลัมน์ active ต้องไม่ใช่ "ไม่" หรือ 0 */
  const live = rows => rows.filter(r => {
    const a = String(r.active == null ? "1" : r.active).trim();
    return a !== "0" && a !== "ไม่" && a.toLowerCase() !== "no" && a !== "false";
  });

  /* ── เมนูและท้ายเว็บ (ฉีดให้ทุกหน้า จะได้แก้ที่เดียว) ────── */
  function chrome(){
    const c = SITE.contact || {};

    const links = SITE.nav.map(n =>
      '<a href="' + n.href + '"' + (n.href === page ? ' class="on" aria-current="page"' : "") +
      ">" + esc(n.label) + "</a>").join("");

    const brand = SITE.logo
      ? '<img src="' + esc(SITE.logo) + '" alt="' + esc(SITE.name) + '">'
      : "<b>" + esc(SITE.name) + "</b>";

    const top = document.createElement("div");
    top.className = "top";
    top.innerHTML =
      '<div class="wrap"><a class="brand" href="index.html">' + brand + "</a>" +
      '<button class="burger" id="bg" aria-label="เปิดเมนู" aria-expanded="false">\u2630</button>' +
      '<nav class="menu" id="mn">' + links + "</nav></div>";
    document.body.insertBefore(top, document.body.firstChild);

    if (!SITE.endpoint){
      const f = document.createElement("div");
      f.className = "demo-flag";
      f.textContent = "โหมดตัวอย่าง · ข้อมูลนี้เป็นข้อมูลสมมติ ยังไม่ได้ต่อกับ Google Sheets";
      document.body.insertBefore(f, top);
    }

    const bg = $("#bg"), mn = $("#mn");
    bg.onclick = () => {
      const open = mn.classList.toggle("open");
      bg.setAttribute("aria-expanded", open ? "true" : "false");
    };

    const ft = document.createElement("footer");
    ft.innerHTML =
      '<div class="wrap"><div class="cols">' +
      "<div><h4>" + esc(SITE.name) + "</h4><p>" + esc(SITE.tagline) + "</p></div>" +
      "<div><h4>เมนู</h4>" +
        SITE.nav.map(n => '<a href="' + n.href + '">' + esc(n.label) + "</a>").join("") + "</div>" +
      "<div><h4>ติดต่อ</h4>" +
        (c.phone ? '<a href="tel:' + esc(c.phone).replace(/[^0-9+]/g,"") + '">โทร ' + esc(c.phone) + "</a>" : "") +
        (c.lineUrl ? '<a href="' + esc(c.lineUrl) + '" target="_blank" rel="noopener">LINE ' + esc(c.line) + "</a>" : "") +
        (c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>" : "") +
      "</div></div>" +
      '<div class="copy">© ' + (new Date().getFullYear() + 543) + " " + esc(SITE.name) + "</div></div>";
    document.body.appendChild(ft);
  }

  /* ── ตัวช่วยแสดงผล ───────────────────────────────────────── */
  const skel = (el, n) => {
    el.innerHTML = "";
    el.className = "cards";
    for (let i = 0; i < n; i++){
      const d = document.createElement("div");
      d.className = "skel";
      el.appendChild(d);
    }
  };

  const fail = (el, msg) => {
    el.className = "";
    el.innerHTML = '<div class="empty">' + esc(msg) +
      '<br><button class="btn o" style="margin-top:14px" onclick="location.reload()">ลองใหม่</button></div>';
  };

  function productCard(p){
    const img = p.image
      ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">'
      : '<span class="noimg"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3" y="5" width="18" height="14" rx="2.5"></rect>' +
        '<circle cx="8.5" cy="10" r="1.5"></circle>' +
        '<path d="M21 16l-5.5-5.5a2 2 0 0 0-2.8 0L5 18"></path>' +
        '</svg><span>ยังไม่มีรูป</span></span>';
    const line = (SITE.contact && SITE.contact.lineUrl) || "";
    return '<article class="card">' +
      '<div class="thumb">' + img + "</div><div class=\"cbody\">" +
      (p.category ? '<span class="cat">' + esc(p.category) + "</span>" : "") +
      "<h3>" + esc(p.name) + "</h3>" +
      "<p>" + esc(p.desc || "") + "</p>" +
      '<div class="price"><b>' + esc(p.price) + " บาท</b>" +
      (p.unit ? "<span>/ " + esc(p.unit) + "</span>" : "") + "</div>" +
      (line ? '<a class="btn l" href="' + esc(line) +
        '" target="_blank" rel="noopener">สั่งซื้อทาง LINE</a>' : "") +
      "</div></article>";
  }

  const TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.",
              "ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  function newsItem(n){
    const d = new Date(n.date);
    const okDate = !isNaN(d);
    return '<article class="news-item">' +
      '<div class="news-date">' +
        (okDate ? "<b>" + d.getDate() + "</b><span>" + TH[d.getMonth()] + " " +
                  ((d.getFullYear() + 543) % 100) + "</span>"
                : "<b>—</b>") +
      "</div><div><h3>" + esc(n.title) + "</h3><p>" + esc(n.body || "") + "</p></div></article>";
  }

  /* ── แต่ละหน้า ───────────────────────────────────────────── */
  const PAGES = {

    "index.html": async () => {
      $("#h-title").textContent = SITE.hero.title;
      $("#h-text").textContent  = SITE.hero.text;
      const b = $("#h-cta");
      b.textContent = SITE.hero.cta.label;
      b.href = SITE.hero.cta.href;

      $("#points").innerHTML = SITE.points.map(p =>
        '<div class="point"><h3>' + esc(p.title) + "</h3><p>" + esc(p.text) + "</p></div>").join("");

      const box = $("#feat");
      skel(box, 3);
      try {
        const all = live(await sheet("products"));
        const pick = all.filter(p => String(p.featured).trim() === "1");
        const show = (pick.length ? pick : all).slice(0, 3);
        if (!show.length) return fail(box, "ยังไม่มีสินค้าในระบบ");
        box.className = "cards";
        box.innerHTML = show.map(productCard).join("");
      } catch(e){ fail(box, "โหลดสินค้าไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต"); }
    },

    "products.html": async () => {
      const box = $("#list"), bar = $("#filters");
      skel(box, 6);
      let items = [];
      try {
        items = live(await sheet("products"));
      } catch(e){ return fail(box, "โหลดสินค้าไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต"); }
      if (!items.length) return fail(box, "ยังไม่มีสินค้าในระบบ");

      const cats = ["ทั้งหมด", ...new Set(items.map(p => p.category).filter(Boolean))];
      bar.innerHTML = cats.map((c,i) =>
        '<button type="button"' + (i === 0 ? ' class="on"' : "") + ">" + esc(c) + "</button>").join("");

      const draw = c => {
        const rows = c === "ทั้งหมด" ? items : items.filter(p => p.category === c);
        box.className = "cards";
        box.innerHTML = rows.length ? rows.map(productCard).join("")
                                    : '<div class="empty">ไม่มีสินค้าในหมวดนี้</div>';
      };
      [...bar.children].forEach(b => b.onclick = () => {
        [...bar.children].forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        draw(b.textContent);
      });
      draw("ทั้งหมด");
    },

    "news.html": async () => {
      const box = $("#list");
      box.innerHTML = '<div class="skel" style="height:118px;margin-bottom:12px"></div>'.repeat(3);
      try {
        const rows = live(await sheet("news"))
          .sort((a,b) => String(b.date).localeCompare(String(a.date)));
        box.innerHTML = rows.length ? rows.map(newsItem).join("")
                                    : '<div class="empty">ยังไม่มีข่าวสาร</div>';
      } catch(e){ fail(box, "โหลดข่าวสารไม่สำเร็จ"); }
    },

    "about.html": async () => {
      $("#a-head").textContent = SITE.about.heading;
      $("#a-body").innerHTML = SITE.about.body.map(p => "<p>" + esc(p) + "</p>").join("");
      if (SITE.about.image)
        $("#a-fig").innerHTML = '<img src="' + esc(SITE.about.image) + '" alt="' + esc(SITE.name) + '">';
      $("#a-points").innerHTML = SITE.points.map(p =>
        '<div class="point"><h3>' + esc(p.title) + "</h3><p>" + esc(p.text) + "</p></div>").join("");
    },

    "contact.html": async () => {
      const c = SITE.contact;
      const rows = [
        ["โทรศัพท์", c.phone ? '<a href="tel:' + esc(c.phone).replace(/[^0-9+]/g,"") + '">' + esc(c.phone) + "</a>" : ""],
        ["LINE", c.lineUrl ? '<a href="' + esc(c.lineUrl) + '" target="_blank" rel="noopener">' + esc(c.line) + "</a>" : ""],
        ["อีเมล", c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>" : ""],
        ["ที่อยู่", esc(c.address)],
        ["เวลาทำการ", esc(c.hours)]
      ].filter(r => r[1]);

      $("#info").innerHTML = rows.map(r => "<div><b>" + r[0] + "</b><span>" + r[1] + "</span></div>").join("");
      if (c.lineUrl){
        const b = $("#c-line");
        b.href = c.lineUrl;
        b.style.display = "inline-flex";
      }
      if (c.mapEmbed)
        $("#map").innerHTML = '<iframe src="' + esc(c.mapEmbed) +
          '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="แผนที่ร้าน"></iframe>';
    }
  };

  /* ── เริ่ม ── */
  document.title = (page === "index.html" ? SITE.name + " · " + SITE.tagline
                                          : document.title + " · " + SITE.name);
  chrome();
  if (PAGES[page]) PAGES[page]();
})();
