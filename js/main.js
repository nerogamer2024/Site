const games = [

  {
    name: "Blox Fruits ⚔️",
    nameAr: "بلوكس فروتس ⚔️",

    desc: "Blox Fruits scripts",
    descAr: "سكربتات بلوكس فروتس",

    icon: "⚔️",

    scripts: {

      key: [

        {
          name: "Blox Fruits Hub",
          nameAr: "مركز سكربتات بلوكس فروتس",

          code:
            'loadstring(game:HttpGet("YOUR_KEY_SCRIPT_1"))()'
        },

        {
          name: "Blox Fruits Script 2",
          nameAr: "سكربت بلوكس فروتس 2",

          code:
            'loadstring(game:HttpGet("YOUR_KEY_SCRIPT_2"))()'
        }

      ],


      nokey: [

        {
          name: "Blox Fruits NoKey",
          nameAr: "بلوكس فروتس بدون مفتاح",

          code:
            'loadstring(game:HttpGet("YOUR_NOKEY_SCRIPT_1"))()'
        },

        {
          name: "Blox Fruits NoKey 2",
          nameAr: "بلوكس فروتس بدون مفتاح 2",

          code:
            'loadstring(game:HttpGet("YOUR_NOKEY_SCRIPT_2"))()'
        }

      ]

    }
  },


  {
    name: "Brookhaven 🏡",
    nameAr: "بروكهافن 🏡",

    desc: "Brookhaven scripts",
    descAr: "سكربتات بروكهافن",

    icon: "🏡",

    scripts: {

      key: [

        {
          name: "Brookhaven Key",
          nameAr: "بروكهافن بمفتاح",

          code:
            'loadstring(game:HttpGet("YOUR_SCRIPT"))()'
        }

      ],


      nokey: [

        {
          name: "Brookhaven NoKey",
          nameAr: "بروكهافن بدون مفتاح",

          code:
            'loadstring(game:HttpGet("YOUR_SCRIPT"))()'
        },

        {
          name: "Brookhaven NoKey 2",
          nameAr: "بروكهافن بدون مفتاح 2",

          code:
            'loadstring(game:HttpGet("YOUR_SCRIPT"))()'
        }

      ]

    }
  },


  {
    name: "Pet Simulator 99 🐾",
    nameAr: "بت سيموليتر 99 🐾",

    desc: "Pet Simulator 99 scripts",
    descAr: "سكربتات بت سيموليتر 99",

    icon: "🐾",

    scripts: {

      key: [

        {
          name: "PS99 Key",
          nameAr: "بت سيموليتر 99 بمفتاح",

          code:
            'loadstring(game:HttpGet("YOUR_SCRIPT"))()'
        }

      ],


      nokey: [

        {
          name: "PS99 NoKey",
          nameAr: "بت سيموليتر 99 بدون مفتاح",

          code:
            'loadstring(game:HttpGet("YOUR_SCRIPT"))()'
        }

      ]

    }
  }

];

let lang =
  localStorage.getItem("phLang") || "ar";


let activeTab = {};

const $ = selector =>
  document.querySelector(selector);


const $$ = selector =>
  document.querySelectorAll(selector);

function esc(value) {

  return String(value).replace(
    /[&<>"']/g,

    char => ({

      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"

    })[char]

  );

}

const translations = {

  ar: {

    key:
      "🔑 بمفتاح",

    nokey:
      "🚫 بدون مفتاح",

    copy:
      "نسخ",

    copied:
      "✓ تم النسخ",

    noScripts:
      "لا توجد سكربتات متاحة حالياً.",

    hideParticles:
      "إخفاء الجزيئات",

    showParticles:
      "إظهار الجزيئات",

    lightMode:
      "الوضع الفاتح",

    darkMode:
      "الوضع الداكن",

    copiedToast:
      "تم نسخ السكربت",

    search:
      "ابحث عن لعبة أو سكربت"

  },


  en: {

    key:
      "🔑 Key",

    nokey:
      "🚫 NoKey",

    copy:
      "COPY",

    copied:
      "✓ COPIED",

    noScripts:
      "No scripts available.",

    hideParticles:
      "Hide Particles",

    showParticles:
      "Show Particles",

    lightMode:
      "Light Mode",

    darkMode:
      "Dark Mode",

    copiedToast:
      "Script copied",

    search:
      "Search games or scripts..."

  }

};

function t(key) {

  return translations[lang][key] ||
         translations.en[key] ||
         key;

}

function gameName(game) {

  if (lang === "ar" && game.nameAr) {

    return game.nameAr;

  }

  return game.name;

}


function gameDesc(game) {

  if (lang === "ar" && game.descAr) {

    return game.descAr;

  }

  return game.desc;

}

function scriptName(script) {

  if (lang === "ar" && script.nameAr) {

    return script.nameAr;

  }

  return script.name;

}

function render() {

  const search =
    $("#search")
      .value
      .trim()
      .toLowerCase();


  let html = "";

  let resultCount = 0;


  games.forEach(
    (game, index) => {

      let searchText =

        game.name +
        " " +
        game.nameAr +
        " " +
        game.desc +
        " " +
        game.descAr;

      ["key", "nokey"].forEach(
        type => {

          if (
            Array.isArray(
              game.scripts[type]
            )
          ) {

            game.scripts[type].forEach(
              script => {

                searchText +=
                  " " +
                  script.name +
                  " " +
                  (script.nameAr || "") +
                  " " +
                  script.code;

              }
            );

          }

        }
      );

      if (
        search &&
        !searchText
          .toLowerCase()
          .includes(search)
      ) {

        return;

      }


      resultCount++;

      if (!activeTab[index]) {

        activeTab[index] =
          game.scripts.key?.length
            ? "key"
            : "nokey";

      }


      const currentTab =
        activeTab[index];


      const scripts =
        Array.isArray(
          game.scripts[currentTab]
        )
          ? game.scripts[currentTab]
          : [];


      const keyCount =
        Array.isArray(game.scripts.key)
          ? game.scripts.key.length
          : 0;


      const noKeyCount =
        Array.isArray(game.scripts.nokey)
          ? game.scripts.nokey.length
          : 0;

      let scriptsHTML = "";


      if (scripts.length) {

        scriptsHTML = `

          <div class="script-section">

            ${scripts.map(
              (script, scriptIndex) => `

                <div
                  class="script-item"
                  style="
                    animation-delay:
                    ${scriptIndex * 70}ms;
                  "
                >

                  <div class="script-top">

                    <h4>
                      ${esc(scriptName(script))}
                    </h4>

                  </div>


                  <div class="code">

                    <code>${esc(script.code)}</code>


                    <button
                      class="copy"
                      data-game="${index}"
                      data-tab="${currentTab}"
                      data-script="${scriptIndex}"
                    >
                      ${t("copy")}
                    </button>

                  </div>

                </div>

              `
            ).join("")}

          </div>

        `;

      } else {

        scriptsHTML = `

          <div
            class="script-section"
            style="
              text-align:center;
              padding:35px;
              color:#789;
            "
          >

            ${t("noScripts")}

          </div>

        `;

      }

      html += `

        <article
          class="game"
          data-game="${index}"
          style="
            animation-delay:
            ${resultCount * 70}ms;
          "
        >

          <div class="game-head">

            <div class="game-icon">

              ${game.icon}

            </div>


            <div>

              <h3>
                ${esc(gameName(game))}
              </h3>

              <p>
                ${esc(gameDesc(game))}
              </p>

            </div>

          </div>


          <div class="game-tabs">


            <button
              class="tab-btn ${
                currentTab === "key"
                  ? "active"
                  : ""
              }"
              data-game="${index}"
              data-tab="key"
            >

              ${t("key")}

              <span class="badge">

                ${keyCount}

              </span>

            </button>


            <button
              class="tab-btn ${
                currentTab === "nokey"
                  ? "active"
                  : ""
              }"
              data-game="${index}"
              data-tab="nokey"
            >

              ${t("nokey")}

              <span class="badge">

                ${noKeyCount}

              </span>

            </button>


          </div>


          <div class="script">

            ${scriptsHTML}

          </div>


        </article>

      `;

    }
  );

  $("#cards").innerHTML =
    html;


  $("#empty")
    .classList
    .toggle(
      "hidden",
      resultCount !== 0
    );

  $$(".tab-btn").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const game =
            Number(
              button.dataset.game
            );


          const tab =
            button.dataset.tab;


          activeTab[game] =
            tab;


          render();

        }
      );

    }
  );

  $$(".copy").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const gameIndex =
            Number(
              button.dataset.game
            );


          const tab =
            button.dataset.tab;


          const scriptIndex =
            Number(
              button.dataset.script
            );


          const script =
            games[gameIndex]
              ?.scripts[tab]
              ?. [scriptIndex];


          if (!script) return;


          copyCode(
            button,
            script.code
          );

        }
      );

    }
  );

}

async function copyCode(
  button,
  code
) {

  try {

    await navigator
      .clipboard
      .writeText(code);

  } catch {

    const textarea =
      document.createElement(
        "textarea"
      );


    textarea.value =
      code;


    document
      .body
      .appendChild(
        textarea
      );


    textarea.select();


    document.execCommand(
      "copy"
    );


    textarea.remove();

  }


  button.textContent =
    t("copied");


  button.style.transform =
    "translateY(-50%) scale(1.04)";


  $("#toast")
    .classList
    .add("show");


  setTimeout(
    () => {

      button.textContent =
        t("copy");


      button.style.transform =
        "";


      $("#toast")
        .classList
        .remove("show");

    },
    1500
  );

}

function setLang() {

  window.lang = lang;

  document.documentElement.lang =
    lang;


  // Keep the layout fixed in RTL for both languages; only the text changes.
  document.documentElement.dir = "ltr";

  $$("[data-ar]").forEach(
    element => {

      const value =
        element.dataset[lang];

      if (value) {

        element.textContent =
          value;

      }

    }
  );

  const search =
    $("#search");


  if (search) {

    search.placeholder =
      lang === "ar"
        ? (
            search.dataset.arPlaceholder ||
            t("search")
          )
        : (
            search.dataset.enPlaceholder ||
            t("search")
          );

  }

  $("#lang").textContent =
    lang === "ar"
      ? "EN"
      : "AR";

  updateThemeLanguage();
  updateParticlesLanguage();
  render();
  if (window.updateAuthLanguage) window.updateAuthLanguage();

}

$("#search")
  .addEventListener(
    "input",
    render
  );

$("#lang")
  .addEventListener(
    "click",
    () => {

      lang =
        lang === "ar"
          ? "en"
          : "ar";


      localStorage.setItem(
        "phLang",
        lang
      );


      setLang();

    }
  );

const themeToggle =
  $("#themeToggle");


const savedTheme =
  localStorage.getItem(
    "phTheme"
  );


function applyTheme(theme) {

  const light =
    theme === "light";


  document.body
    .classList
    .toggle(
      "light-mode",
      light
    );


  themeToggle.textContent =
    light
      ? "☀️"
      : "🌙";


  updateThemeLanguage();

}

function updateThemeLanguage() {

  if (!themeToggle) return;


  const isLight =
    document.body
      .classList
      .contains(
        "light-mode"
      );


  themeToggle.title =
    isLight
      ? t("darkMode")
      : t("lightMode");


  themeToggle.setAttribute(
    "aria-label",
    themeToggle.title
  );

}

applyTheme(
  savedTheme === "light"
    ? "light"
    : "dark"
);

themeToggle.addEventListener(
  "click",
  () => {

    const isLight =
      document.body
        .classList
        .contains(
          "light-mode"
        );


    const newTheme =
      isLight
        ? "dark"
        : "light";


    localStorage.setItem(
      "phTheme",
      newTheme
    );


    applyTheme(
      newTheme
    );

  }
);

const particlesToggle =
  $("#particlesToggle");


const savedParticles =
  localStorage.getItem(
    "phParticles"
  );


function applyParticles(enabled) {

  document.body
    .classList
    .toggle(
      "particles-off",
      !enabled
    );


  particlesToggle.textContent =
    enabled
      ? "✨"
      : "🌑";


  updateParticlesLanguage();

}

function updateParticlesLanguage() {

  if (!particlesToggle) return;


  const enabled =
    !document.body
      .classList
      .contains(
        "particles-off"
      );


  particlesToggle.title =
    enabled
      ? t("hideParticles")
      : t("showParticles");


  particlesToggle.setAttribute(
    "aria-label",
    particlesToggle.title
  );

}

applyParticles(
  savedParticles !== "off"
);

particlesToggle.addEventListener(
  "click",
  () => {

    const disabled =
      document.body
        .classList
        .contains(
          "particles-off"
        );


    const enabled =
      disabled;


    localStorage.setItem(
      "phParticles",
      enabled
        ? "on"
        : "off"
    );


    applyParticles(
      enabled
    );

  }
);

const cursorGlow =
  $("#cursorGlow");


let mouseX = 0;
let mouseY = 0;


let glowX = 0;
let glowY = 0;


document.addEventListener(
  "mousemove",
  event => {

    mouseX =
      event.clientX;

    mouseY =
      event.clientY;

  }
);


function animateGlow() {

  glowX +=
    (mouseX - glowX) * .4;


  glowY +=
    (mouseY - glowY) * .4;


  cursorGlow.style.left =
    glowX + "px";


  cursorGlow.style.top =
    glowY + "px";


  requestAnimationFrame(
    animateGlow
  );

}


animateGlow();

const canvas =
  $("#particles");


const ctx =
  canvas.getContext("2d");


let width = 0;
let height = 0;


let particles = [];

function resizeParticles() {

  width =
    canvas.width =
      window.innerWidth;


  height =
    canvas.height =
      window.innerHeight;


  const amount =
    Math.min(
      80,

      Math.floor(
        (width * height) /
        18000
      )
    );


  particles =
    Array.from(
      {
        length:
          Math.max(
            30,
            amount
          )
      },

      () => ({

        x:
          Math.random() *
          width,

        y:
          Math.random() *
          height,

        vx:
          (Math.random() - .5)
          * .35,

        vy:
          (Math.random() - .5)
          * .35,

        radius:
          Math.random()
          * 1.5
          + .5

      })
    );

}

function drawParticles() {

  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  particles.forEach(
    (particle, index) => {

      particle.x +=
        particle.vx;


      particle.y +=
        particle.vy;


      if (
        particle.x < 0 ||
        particle.x > width
      ) {

        particle.vx *= -1;

      }


      if (
        particle.y < 0 ||
        particle.y > height
      ) {

        particle.vy *= -1;

      }


      ctx.beginPath();


      ctx.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        document.body
          .classList
          .contains(
            "light-mode"
          )

          ? "rgba(20,120,220,.30)"

          : "rgba(55,165,255,.55)";


      ctx.fill();

      for (
        let j = index + 1;
        j < particles.length;
        j++
      ) {

        const other =
          particles[j];


        const distance =
          Math.hypot(
            particle.x -
              other.x,

            particle.y -
              other.y
          );


        if (
          distance < 120
        ) {

          ctx.beginPath();


          ctx.moveTo(
            particle.x,
            particle.y
          );


          ctx.lineTo(
            other.x,
            other.y
          );


          const opacity =
            .08 *
            (
              1 -
              distance / 120
            );


          ctx.strokeStyle =
            document.body
              .classList
              .contains(
                "light-mode"
              )

              ? `rgba(20,120,220,${opacity})`

              : `rgba(55,165,255,${opacity})`;


          ctx.stroke();

        }

      }

    }
  );


  requestAnimationFrame(
    drawParticles
  );

}

window.addEventListener(
  "resize",
  resizeParticles
);

resizeParticles();
drawParticles();
setLang();
/* ===== AUTHENTICATION ===== */
(function initAuthentication(){
  const overlay = document.getElementById('authOverlay');
  const userBtn = document.getElementById('authUserBtn');
  const userName = document.getElementById('authUserName');
  const closeBtn = document.getElementById('authClose');
  const loginTab = document.getElementById('showLogin');
  const registerTab = document.getElementById('showRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const guestBtn = document.getElementById('guestBtn');
  const message = document.getElementById('authMessage');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  if (!overlay || !userBtn) return;

  let authState = null;

  const authText = {
    ar: {
      guest:'زائر', login:'تسجيل الدخول', register:'إنشاء حساب', welcome:'سجل حسابك أو ادخل كضيف',
      loginSuccess:'تم تسجيل الدخول بنجاح', registerSuccess:'تم إنشاء الحساب بنجاح', guestSuccess:'تم الدخول كضيف',
      logout:'تسجيل الخروج', error:'حدث خطأ، حاول مرة أخرى', close:'إغلاق'
    },
    en: {
      guest:'Guest', login:'Sign in', register:'Register', welcome:'Create an account or continue as a guest',
      loginSuccess:'Signed in successfully', registerSuccess:'Account created successfully', guestSuccess:'Joined as guest',
      logout:'Log out', error:'Something went wrong. Try again', close:'Close'
    }
  };

  function A(){ return authText[window.lang || document.documentElement.lang || 'ar'] || authText.ar; }
  function setMessage(text, success=false){ message.textContent=text||''; message.classList.toggle('success',success); }
  function openAuth(mode){ if(mode) setMode(mode); overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); setMessage(''); }
  function closeAuth(){ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); if (!authState) { userName.textContent=A().guest; } }
  function setMode(mode){
    const login = mode === 'login';
    loginTab.classList.toggle('active',login); registerTab.classList.toggle('active',!login);
    loginForm.classList.toggle('hidden',!login); registerForm.classList.toggle('hidden',login);
    title.textContent = login ? A().login : A().register;
    subtitle.textContent = A().welcome;
    setMessage('');
  }
  function updateAuthText(){
    const a=A();
    if (!authState) { userName.textContent = a.guest; }
    title.textContent = loginTab.classList.contains('active') ? a.login : a.register;
    subtitle.textContent = a.welcome;
    userBtn.title = authState?.guest ? (a.logout + ' / ' + a.guest) : (authState?.username || a.login);
  }
  async function request(url, body){
    let res;
    try {
      res = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});
    } catch (networkErr) {
      const err = new Error(window.lang === 'en' ? `Cannot connect to the API from ${location.origin}. Open the site through the running server, not as a file.` : `مش قادر أتصل بـ API من ${location.origin}. افتح الموقع من السيرفر وليس كملف HTML مباشرة.`);
      err.status = 0;
      throw err;
    }
    const raw = await res.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = { error: raw || '' }; }
    if(!res.ok){
      const serverMessage = data.message || data.error || '';
      const err = new Error(serverMessage || `${A().error} [HTTP ${res.status}]`);
      err.status = res.status;
      if (data.detail) err.detail = data.detail;
      throw err;
    }
    return data;
  }
  function applyAuth(data){
    authState=data;
    window.authState=data;
    userName.textContent=data.username;
    closeAuth();
    setMessage('');
    updateAuthText();
    if (typeof window.onAuthChanged === 'function') window.onAuthChanged(data);
  }
  async function loadMe(){
    try{
      const res=await fetch('/api/auth/me',{credentials:'include'});
      const data=await res.json();
      if(data.authenticated) { applyAuth(data); }
      else { userName.textContent=A().guest; openAuth(); }
    }catch(e){
      setMessage(window.lang === 'en' ? 'Server/MongoDB is not reachable. Open the site through http://localhost:3000.' : 'السيرفر أو MongoDB مش متاح. افتح الموقع من http://localhost:3000.',false);
      openAuth();
    }
  }
  loginTab.addEventListener('click',()=>setMode('login'));
  registerTab.addEventListener('click',()=>setMode('register'));
  closeBtn.addEventListener('click',()=>{ closeAuth(); });
  overlay.addEventListener('click',e=>{ if(e.target===overlay) closeAuth(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && overlay.classList.contains('open')) closeAuth(); });
  userBtn.addEventListener('click',async()=>{
    if(authState){
      if(confirm(A().logout+'?')){
        try{ await request('/api/auth/logout',{}); authState=null; window.authState=null; updateAuthText(); if (typeof window.onAuthChanged === 'function') window.onAuthChanged(null); openAuth(); setMode('login'); }
        catch(err){ setMessage(err.message); openAuth(); }
      }
    }else openAuth();
  });
  loginForm.addEventListener('submit',async e=>{
    e.preventDefault(); setMessage('');
    try{
      const data=await request('/api/auth/login',{username:document.getElementById('loginUsername').value,password:document.getElementById('loginPassword').value});
      applyAuth(data); loginForm.reset();
    }catch(err){ setMessage(err.detail ? `${err.message} (${err.detail})` : err.message); }
  });
  registerForm.addEventListener('submit',async e=>{
    e.preventDefault(); setMessage('');
    const password=document.getElementById('registerPassword').value;
    const confirmPassword=document.getElementById('registerConfirm').value;
    if(password!==confirmPassword){ setMessage(window.lang==='en'?'Passwords do not match.':'كلمتا السر غير متطابقتين.'); return; }
    try{
      const data=await request('/api/auth/register',{username:document.getElementById('registerUsername').value,password,confirmPassword});
      applyAuth(data); registerForm.reset();
    }catch(err){ setMessage(err.detail ? `${err.message} (${err.detail})` : err.message); }
  });
  guestBtn.addEventListener('click',async()=>{
    setMessage(''); guestBtn.disabled=true;
    try{ const data=await request('/api/auth/guest',{}); applyAuth(data); }
    catch(err){ setMessage(err.detail ? `${err.message} (${err.detail})` : err.message); }
    finally{ guestBtn.disabled=false; }
  });

  window.updateAuthLanguage = updateAuthText;
  window.openAuth = openAuth;
  setMode('login');
  loadMe();
})();
