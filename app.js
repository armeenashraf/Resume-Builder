import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
GoogleAuthProvider,
signInWithPopup,
sendPasswordResetEmail,
signOut,
onAuthStateChanged,
updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
getDatabase,
ref,
set,
get,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

/* =========================
FIREBASE CONFIG
========================= */

const firebaseConfig = {
apiKey: "AIzaSyDtemoC6pcZwPwZwP6Sb5GsCBjvbDy-xR0",
authDomain: "resume-builder-c77c7.firebaseapp.com",
databaseURL: "https://resume-builder-c77c7-default-rtdb.firebaseio.com",
projectId: "resume-builder-c77c7",
storageBucket: "resume-builder-c77c7.firebasestorage.app",
messagingSenderId: "821521838879",
appId: "1:821521838879:web:2a74dd1ecb04347d58b62a",
measurementId: "G-K3VWTV0TQN"
};

/* =========================
INITIALIZE FIREBASE
========================= */

let app;
let auth;
let db;

try {
app = initializeApp(firebaseConfig);
auth = getAuth(app);
db = getDatabase(app);

console.log("Firebase Realtime Database connected");
} catch (error) {
console.error("Firebase initialization error:", error);
}

/* =========================
HELPERS
========================= */

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const clone = value =>
JSON.parse(JSON.stringify(value));

/* =========================
DEFAULT RESUME
========================= */

const defaults = {
resumeName: "Untitled resume",
fullName: "",
title: "",
email: "",
phone: "",
location: "",
website: "",
linkedin: "",
github: "",
summary: "",
photo: "",

education: [],
experience: [],
projects: [],
certifications: [],
skills: [],
languages: [],
achievements: [],
interests: [],

template: "editorial",

style: {
accentColor: "#8b5e3c",
textColor: "#332821",
backgroundColor: "#ffffff",
borderColor: "#332821",
headingFont: "Playfair Display",
bodyFont: "DM Sans",
headingSize: 42,
bodySize: 11,
pageWidth: 210,
pageHeight: 297,
pagePadding: 16,
borderWidth: 0,
borderStyle: "solid",
radius: 0,
lineHeight: 1.45
},

createdAt: null,
updatedAt: null
};

/* =========================
APP STATE
========================= */

let state = clone(defaults);
let user = null;
let zoom = 0.82;
let authMode = "login";
let autoTimer;

/* =========================
TEMPLATES
========================= */

const templates = [
["editorial", "Editorial"],
["modern", "Modern Sidebar"],
["minimal", "Minimal"],
["creative", "Creative"],
["executive", "Executive"],
["classic", "Classic"],
["luxe", "Luxe Magazine"],
["bold", "Bold Portfolio"],
["timeline", "Timeline"],
["studio", "Studio"]
];

const presets = [
"#8b5e3c",
"#6e2638",
"#315c45",
"#b45f3c",
"#263c5c",
"#25201d",
"#a86d78",
"#6c7140"
];

const fonts = [
"Playfair Display",
"DM Sans",
"Manrope",
"Montserrat",
"Libre Baskerville",
"Space Grotesk",
"Inter"
];

/* =========================
SECURITY / TEXT HELPERS
========================= */

const escapeHtml = value =>
String(value ?? "").replace(
/[&<>"']/g,
character => ({
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
}[character])
);

const listText = array =>
array
.filter(Boolean)
.map(item =>
`<span class="pill">${
        escapeHtml(
          typeof item === "string"
            ? item
            : item.name || item.title || ""
        )
      }</span>`
)
.join("");

/* =========================
UI FUNCTIONS
========================= */

function toast(message) {
const element = $("#toast");

if (!element) {
console.log(message);
return;
}

element.textContent = message;
element.classList.add("show");

setTimeout(() => {
element.classList.remove("show");
}, 2600);
}

function show(id) {

$$$(".view").forEach(view => {
  view.classList.add("hidden");
});

const selected = $(id);

if (selected) {
  selected.classList.remove("hidden");
}
}


function showTab(name) {
$$(".tab").forEach(button => {
  button.classList.toggle(
    "active",
    button.dataset.tab === name
  );
});

$$(".tab-panel").forEach(panel => {
  panel.classList.toggle(
    "active",
    panel.id === `${name}Panel`
  );
});
}


function validHex(value) {
return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}


function formatTime(timestamp) {
if (!timestamp || typeof timestamp !== "number") {
  return "Not saved yet";
}

const date = new Date(timestamp);

return `Last updated: ${date.toLocaleDateString(
  undefined,
  {
    month: "long",
    day: "numeric",
    year: "numeric"
  }
)} • ${date.toLocaleTimeString(
  [],
  {
    hour: "numeric",
    minute: "2-digit"
  }
)}`;
}


function relativeTime(timestamp) {
if (!timestamp || typeof timestamp !== "number") {
  return "Not saved yet";
}

const date = new Date(timestamp);

const minutes = Math.floor(
  (Date.now() - date.getTime()) / 60000
);

if (minutes < 1) {
  return "Saved just now";
}

if (minutes < 60) {
  return `Last saved ${minutes} min ago`;
}

return formatTime(timestamp);
}


/* =========================
 RESUME SECTIONS
========================= */

function section(title, content, extra = "") {
if (!content) {
  return "";
}

return `
  <section class="resume-section ${extra}">
    <h3>${title}</h3>
    ${content}
  </section>
`;
}


function contactHtml() {
const contacts = [
  state.email,
  state.phone,
  state.location,
  state.website,
  state.linkedin,
  state.github
].filter(Boolean);

if (!contacts.length) {
  return "";
}

return `
  <div class="resume-contact">
    ${contacts.map(escapeHtml).join(" • ")}
  </div>
`;
}


function itemsHtml(items, type = "") {
return items
  .map(item => {
    if (typeof item === "string") {
      return `
        <div class="resume-item">
          ${escapeHtml(item)}
        </div>
      `;
    }

    const title =
      item.degree ||
      item.jobTitle ||
      item.projectName ||
      item.certificateName ||
      "";

    const sub =
      item.institution ||
      item.company ||
      item.issuingOrganization ||
      item.technologies ||
      "";

    const date =
      [
        item.startYear || item.startDate,
        item.endYear || item.endDate
      ]
        .filter(Boolean)
        .join(" — ") ||
      item.date ||
      "";

    const description =
      item.description || "";

    return `
      <div class="resume-item ${
        type === "timeline"
          ? "timeline-item"
          : ""
      }">

        <div class="item-top">

          <div>

            <div class="item-title">
              ${escapeHtml(title)}
            </div>

            <div class="item-meta">
              ${escapeHtml(sub)}
            </div>

          </div>

          <div class="item-meta">
            ${escapeHtml(date)}
          </div>

        </div>

        ${
          description
            ? `
              <div class="item-desc">
                ${escapeHtml(description)}
              </div>
            `
            : ""
        }

        ${
          item.projectUrl
            ? `
              <div class="item-meta">
                ${escapeHtml(item.projectUrl)}
              </div>
            `
            : ""
        }

      </div>
    `;
  })
  .join("");
}


function contentBlocks(side = false) {
return {
  exp: section(
    "Experience",
    itemsHtml(
      state.experience,
      side ? "timeline" : ""
    )
  ),

  edu: section(
    "Education",
    itemsHtml(
      state.education,
      side ? "timeline" : ""
    )
  ),

  projects: section(
    "Projects",
    itemsHtml(state.projects)
  ),

  cert: section(
    "Certifications",
    itemsHtml(state.certifications)
  ),

  skills: section(
    "Skills",
    listText(state.skills)
  ),

  languages: section(
    "Languages",
    listText(state.languages)
  ),

  achievements: section(
    "Achievements",
    itemsHtml(state.achievements)
  ),

  interests: section(
    "Interests",
    listText(state.interests)
  )
};
}


/* =========================
 RENDER RESUME
========================= */

function renderResume() {
const resume = $("#resumePreview");

if (!resume) {
  return;
}

const style = state.style;
const hasName = state.fullName.trim();

resume.className =
  `resume template-${state.template}`;

resume.style.setProperty(
  "--accent",
  style.accentColor
);

resume.style.setProperty(
  "--text",
  style.textColor
);

resume.style.setProperty(
  "--body-font",
  `"${style.bodyFont}"`
);

resume.style.setProperty(
  "--heading-font",
  `"${style.headingFont}"`
);

resume.style.setProperty(
  "--heading-size",
  `${style.headingSize}px`
);

resume.style.setProperty(
  "--body-size",
  `${style.bodySize}px`
);

resume.style.setProperty(
  "--page-padding",
  `${style.pagePadding}mm`
);

resume.style.setProperty(
  "--border-width",
  `${style.borderWidth}px`
);

resume.style.setProperty(
  "--border-style",
  style.borderStyle
);

resume.style.setProperty(
  "--border-color",
  style.borderColor
);

resume.style.setProperty(
  "--radius",
  `${style.radius}px`
);

resume.style.setProperty(
  "--line-height",
  style.lineHeight || 1.45
);

resume.style.background =
  style.backgroundColor;

resume.style.width =
  `${style.pageWidth}mm`;

resume.style.minHeight =
  `${style.pageHeight}mm`;


if (!hasName) {
  resume.innerHTML = `
    <div class="resume-empty">
      <div>
        <h2>Start building your resume</h2>
        <p>
          Your live document will appear here as you type.
        </p>
      </div>
    </div>
  `;

  applyZoom();
  return;
}


const photo = state.photo
  ? `
    <img
      class="profile-photo"
      src="${state.photo}"
      alt="Profile photo"
    >
  `
  : "";


const header = `
  <header class="resume-header">

    <div>

      <h1 class="resume-name">
        ${escapeHtml(state.fullName)}
      </h1>

      ${
        state.title
          ? `
            <p class="resume-title">
              ${escapeHtml(state.title)}
            </p>
          `
          : ""
      }

      ${contactHtml()}

    </div>

    ${photo}

  </header>
`;


const summary = section(
  "Profile",
  state.summary
    ? `<p>${escapeHtml(state.summary)}</p>`
    : ""
);


const blocks =
  contentBlocks(
    state.template === "timeline"
  );


if (state.template === "editorial") {

  resume.innerHTML = `
    ${header}
    ${summary}

    <div class="resume-body">

      <div>
        ${blocks.exp}
        ${blocks.edu}
        ${blocks.projects}
        ${blocks.achievements}
      </div>

      <aside>
        ${blocks.skills}
        ${blocks.languages}
        ${blocks.cert}
        ${blocks.interests}
      </aside>

    </div>
  `;

} else if (state.template === "modern") {

  resume.innerHTML = `
    <aside class="modern-side">

      ${photo}

      <h1 class="resume-name">
        ${escapeHtml(state.fullName)}
      </h1>

      <p class="resume-title">
        ${escapeHtml(state.title)}
      </p>

      ${contactHtml()}
      ${blocks.skills}
      ${blocks.languages}
      ${blocks.interests}

    </aside>

    <main class="modern-main">
      ${summary}
      ${blocks.exp}
      ${blocks.edu}
      ${blocks.projects}
      ${blocks.cert}
      ${blocks.achievements}
    </main>
  `;

} else if (state.template === "creative") {

  resume.innerHTML = `
    <div class="creative-hero">

      <h1 class="resume-name">
        ${escapeHtml(state.fullName)}
      </h1>

      <p class="resume-title">
        ${escapeHtml(state.title)}
      </p>

      ${contactHtml()}

    </div>

    ${summary}

    <div class="creative-grid">

      <div>
        ${blocks.exp}
        ${blocks.projects}
        ${blocks.achievements}
      </div>

      <div>
        ${blocks.edu}
        ${blocks.skills}
        ${blocks.languages}
        ${blocks.cert}
        ${blocks.interests}
      </div>

    </div>
  `;

} else if (state.template === "executive") {

  resume.innerHTML = `
    ${header}
    ${summary}

    <div class="creative-grid">

      <div>
        ${blocks.exp}
        ${blocks.projects}
        ${blocks.achievements}
      </div>

      <div>
        ${blocks.edu}
        ${blocks.skills}
        ${blocks.languages}
        ${blocks.cert}
        ${blocks.interests}
      </div>

    </div>
  `;

} else if (state.template === "timeline") {

  resume.innerHTML = `
    ${header}
    ${summary}

    ${section(
      "Experience",
      itemsHtml(
        state.experience,
        "timeline"
      )
    )}

    ${section(
      "Education",
      itemsHtml(
        state.education,
        "timeline"
      )
    )}

    ${blocks.projects}
    ${blocks.cert}
    ${blocks.skills}
    ${blocks.languages}
    ${blocks.achievements}
    ${blocks.interests}
  `;

} else if (state.template === "studio") {

  resume.innerHTML = `
    <div class="studio-block">
      ${header}
    </div>

    <div class="creative-grid">

      <div>
        ${summary}
        ${blocks.exp}
        ${blocks.projects}
      </div>

      <div>
        ${blocks.edu}
        ${blocks.skills}
        ${blocks.languages}
        ${blocks.cert}
        ${blocks.achievements}
        ${blocks.interests}
      </div>

    </div>
  `;

} else {

  resume.innerHTML = `
    ${header}
    ${summary}
    ${blocks.exp}
    ${blocks.edu}
    ${blocks.projects}
    ${blocks.cert}
    ${blocks.skills}
    ${blocks.languages}
    ${blocks.achievements}
    ${blocks.interests}
  `;
}

applyZoom();
}


/* =========================
 ZOOM
========================= */

function applyZoom() {
const resume = $("#resumePreview");

if (!resume) {
  return;
}

resume.style.transform =
  `scale(${zoom})`;

const label = $("#zoomLabel");

if (label) {
  label.textContent =
    `${Math.round(zoom * 100)}%`;
}

if (resume.parentElement) {
  resume.parentElement.style.minHeight =
    `${
      Math.max(
        297,
        resume.scrollHeight / 3.78
      ) * zoom + 70
    }px`;
}
}


/* =========================
 DYNAMIC FORM FIELDS
========================= */

function renderDynamic() {

const groups = {

  education: [
    "Degree",
    "Institution",
    "Start Year",
    "End Year",
    "Description"
  ],

  experience: [
    "Job Title",
    "Company",
    "Location",
    "Start Date",
    "End Date",
    "Description"
  ],

  projects: [
    "Project Name",
    "Description",
    "Technologies",
    "Project URL"
  ],

  certifications: [
    "Certificate Name",
    "Issuing Organization",
    "Date"
  ],

  skills: ["Skill"],
  languages: ["Language"],
  achievements: ["Achievement"],
  interests: ["Interest"]
};


const keys = {

  education: [
    "degree",
    "institution",
    "startYear",
    "endYear",
    "description"
  ],

  experience: [
    "jobTitle",
    "company",
    "location",
    "startDate",
    "endDate",
    "description"
  ],

  projects: [
    "projectName",
    "description",
    "technologies",
    "projectUrl"
  ],

  certifications: [
    "certificateName",
    "issuingOrganization",
    "date"
  ],

  skills: ["name"],
  languages: ["name"],
  achievements: ["name"],
  interests: ["name"]
};


Object.entries(groups).forEach(
  ([group, labels]) => {

    const box =
      $(`#${group}List`);

    if (!box) {
      return;
    }

    box.innerHTML = "";


    state[group].forEach(
      (item, index) => {

        const wrapper =
          document.createElement("div");

        wrapper.className =
          "repeat-item";


        wrapper.innerHTML = `
          <div class="repeat-head">

            <span>
              ${group.slice(0, -1)}
              ${index + 1}
            </span>

            <button
              class="remove-btn"
              data-remove="${group}"
              data-index="${index}"
              type="button"
            >
              Remove
            </button>

          </div>
        `;


        labels.forEach(
          (label, fieldIndex) => {

            const field =
              document.createElement("div");

            field.className =
              "field";

            const key =
              keys[group][fieldIndex];


            field.innerHTML = `
              <label>
                ${label}
              </label>

              ${
                label === "Description"
                  ? `
                    <textarea
                      data-group="${group}"
                      data-index="${index}"
                      data-field="${key}"
                    ></textarea>
                  `
                  : `
                    <input
                      data-group="${group}"
                      data-index="${index}"
                      data-field="${key}"
                    >
                  `
              }
            `;


            const input =
              field.querySelector(
                "input, textarea"
              );

            input.value =
              item[key] || "";

            wrapper.appendChild(field);
          }
        );

        box.appendChild(wrapper);
      }
    );
  }
);
}


/* =========================
 FORM SYNC
========================= */

function fillStatic() {

$$("[data-key]").forEach(input => {
  input.value =
    state[input.dataset.key] || "";
});


$$("[data-style]").forEach(input => {

  if (
    input.tagName === "SELECT" &&
    input.options.length === 0
  ) {

    fonts.forEach(font => {
      input.add(
        new Option(
          font,
          font
        )
      );
    });
  }

  input.value =
    state.style[
      input.dataset.style
    ] ?? "";
});


$$("[data-hex]").forEach(input => {
  input.value =
    state.style[
      input.dataset.style
    ] || "";
});
}


/* =========================
 TEMPLATE UI
========================= */

function renderTemplateGrid() {

const grid =
  $("#templateGrid");

if (!grid) {
  return;
}

grid.innerHTML =
  templates.map(
    ([id, name]) => `
      <button
        class="template-card ${
          state.template === id
            ? "active"
            : ""
        }"
        data-template="${id}"
        type="button"
      >

        <div class="template-thumb"></div>

        <small>
          ${name}
        </small>

      </button>
    `
  )
  .join("");
}


function renderPresets() {

const container =
  $("#presetColors");

if (!container) {
  return;
}

container.innerHTML =
  presets.map(
    color => `
      <button
        class="preset"
        style="background:${color}"
        data-preset="${color}"
        title="${color}"
        type="button"
      ></button>
    `
  )
  .join("");
}


/* =========================
 UPDATE UI
========================= */

function syncAndRender() {

renderResume();
renderTemplateGrid();


const homeName =
  $("#homeResumeName");

if (homeName) {
  homeName.textContent =
    state.fullName ||
    state.resumeName;
}


const homeTitle =
  $("#homeResumeTitle");

if (homeTitle) {
  homeTitle.textContent =
    state.resumeName ||
    "Untitled resume";
}


const lastSaved =
  $("#lastSaved");

if (lastSaved) {
  lastSaved.textContent =
    relativeTime(
      state.updatedAt
    );
}


const builderTime =
  $("#builderTime");

if (builderTime) {
  builderTime.textContent =
    formatTime(
      state.updatedAt
    );
}
}


/* =========================
 AUTO SAVE
========================= */

function markDirty() {

const status =
  $("#resumeStatus");

if (status) {
  status.textContent =
    "Editing…";
}


clearTimeout(autoTimer);


autoTimer =
  setTimeout(
    () => saveResume(true),
    1500
  );


syncAndRender();


localStorage.setItem(
  "maison-resume-draft",
  JSON.stringify(state)
);
}


/* ==========================================
 SAVE TO REALTIME DATABASE
========================================== */

async function saveResume(silent = false) {

if (!user) {

  localStorage.setItem(
    "maison-resume-draft",
    JSON.stringify(state)
  );

  return;
}


const status =
  $("#resumeStatus");

if (status) {
  status.textContent =
    "Saving…";
}


const now =
  Date.now();


if (!state.createdAt) {
  state.createdAt = now;
}

state.updatedAt =
  now;


try {

  const resumeReference =
    ref(
      db,
      `users/${user.uid}/resumes/default`
    );


  await set(
    resumeReference,
    {
      ...state,
      userId: user.uid,
      createdAt: state.createdAt,
      updatedAt: now
    }
  );


  if (status) {
    status.textContent =
      "Saved ✓";
  }


  localStorage.setItem(
    "maison-resume-draft",
    JSON.stringify(state)
  );


  syncAndRender();


  if (!silent) {
    toast(
      "Resume saved successfully"
    );
  }


  console.log(
    "Resume saved to Realtime Database"
  );

} catch (error) {

  console.error(
    "Realtime Database save error:",
    error
  );


  if (status) {
    status.textContent =
      "Saved locally";
  }


  if (!silent) {
    toast(
      "Saved locally — check Firebase Rules"
    );
  }
}
}


/* ==========================================
 LOAD FROM REALTIME DATABASE
========================================== */

async function loadResume() {

const localDraft =
  localStorage.getItem(
    "maison-resume-draft"
  );


if (localDraft) {

  try {

    const savedData =
      JSON.parse(localDraft);


    state = {
      ...clone(defaults),
      ...savedData,

      style: {
        ...defaults.style,
        ...(savedData.style || {})
      }
    };

  } catch (error) {

    console.warn(
      "Local resume could not be loaded:",
      error
    );
  }
}


if (user && db) {

  try {

    const resumeReference =
      ref(
        db,
        `users/${user.uid}/resumes/default`
      );


    const snapshot =
      await get(
        resumeReference
      );


    if (snapshot.exists()) {

      const data =
        snapshot.val();


      state = {
        ...clone(defaults),
        ...data,

        style: {
          ...defaults.style,
          ...(data.style || {})
        },

        createdAt:
          data.createdAt || null,

        updatedAt:
          data.updatedAt || null
      };


      localStorage.setItem(
        "maison-resume-draft",
        JSON.stringify(state)
      );


      console.log(
        "Resume loaded from Realtime Database"
      );
    }

  } catch (error) {

    console.warn(
      "Realtime Database resume could not be loaded:",
      error
    );
  }
}


fillStatic();
renderDynamic();
syncAndRender();
}


/* =========================
 AUTH UI
========================= */

function switchAuthMode(mode) {

authMode =
  mode;


const signup =
  mode === "signup";


$("#authTitle").textContent =
  signup
    ? "Create your account"
    : "Welcome back";


$("#authSubtitle").textContent =
  signup
    ? "Start building a resume that feels like you."
    : "Your next opportunity starts with a better resume.";


$("#nameField").classList.toggle(
  "hidden",
  !signup
);


$("#confirmField").classList.toggle(
  "hidden",
  !signup
);


$("#forgotBtn").classList.toggle(
  "hidden",
  signup
);


$("#authSubmit").textContent =
  signup
    ? "Create account"
    : "Log in";


$("#switchText").textContent =
  signup
    ? "Already have an account?"
    : "Don't have an account?";


$("#switchAuth").textContent =
  signup
    ? "Log in"
    : "Sign up";
}


/* =========================
 EXPORT PNG
========================= */

async function exportImage() {

const button =
  $("#pngBtn");

const oldText =
  button.textContent;


button.textContent =
  "Preparing…";


try {

  const {
    default: html2canvas
  } = await import(
    "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm"
  );


  const preview =
    $("#resumePreview");


  const canvas =
    await html2canvas(
      preview,
      {
        scale: 3,
        useCORS: true,
        backgroundColor:
          state.style.backgroundColor,
        windowWidth:
          preview.scrollWidth,
        windowHeight:
          preview.scrollHeight
      }
    );


  const link =
    document.createElement("a");


  link.download =
    `${state.resumeName || "resume"}.png`;


  link.href =
    canvas.toDataURL(
      "image/png",
      1
    );


  link.click();

} catch (error) {

  console.error(error);

  toast(
    "PNG export failed"
  );

} finally {

  button.textContent =
    oldText;
}
}


/* =========================
 EXPORT PDF
========================= */

async function exportPDF() {

const button =
  $("#pdfBtn");

const oldText =
  button.textContent;


button.textContent =
  "Preparing…";


try {

  const [
    { default: html2canvas },
    { jsPDF }
  ] = await Promise.all([

    import(
      "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm"
    ),

    import(
      "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm"
    )

  ]);


  const element =
    $("#resumePreview");


  const canvas =
    await html2canvas(
      element,
      {
        scale: 3,
        useCORS: true,
        backgroundColor:
          state.style.backgroundColor,
        windowWidth:
          element.scrollWidth,
        windowHeight:
          element.scrollHeight
      }
    );


  const pdf =
    new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true
    });


  const image =
    canvas.toDataURL(
      "image/jpeg",
      0.98
    );


  const pageWidth =
    210;

  const pageHeight =
    297;


  const imageHeight =
    canvas.height *
    pageWidth /
    canvas.width;


  let heightLeft =
    imageHeight;

  let position =
    0;


  pdf.addImage(
    image,
    "JPEG",
    0,
    position,
    pageWidth,
    imageHeight,
    undefined,
    "FAST"
  );


  heightLeft -=
    pageHeight;


  while (
    heightLeft > 0
  ) {

    position =
      heightLeft -
      imageHeight;


    pdf.addPage();


    pdf.addImage(
      image,
      "JPEG",
      0,
      position,
      pageWidth,
      imageHeight,
      undefined,
      "FAST"
    );


    heightLeft -=
      pageHeight;
  }


  pdf.save(
    `${state.resumeName || "resume"}.pdf`
  );

} catch (error) {

  console.error(error);

  toast(
    "PDF export failed"
  );

} finally {

  button.textContent =
    oldText;
}
}


/* =========================
 EMAIL / PASSWORD AUTH
========================= */

$("#authForm").addEventListener(
"submit",
async event => {

  event.preventDefault();


  const email =
    $("#authEmail")
      .value
      .trim();


  const password =
    $("#authPassword")
      .value;


  try {

    if (
      authMode === "signup"
    ) {

      const name =
        $("#authName")
          .value
          .trim();


      const confirmPassword =
        $("#authConfirm")
          .value;


      if (!name) {
        throw new Error(
          "Please enter your name"
        );
      }


      if (
        password !==
        confirmPassword
      ) {

        throw new Error(
          "Passwords do not match"
        );
      }


      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );


      await updateProfile(
        credential.user,
        {
          displayName:
            name
        }
      );

    } else {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    }

  } catch (error) {

    toast(
      error.message.replace(
        "Firebase: ",
        ""
      )
    );
  }
}
);


/* =========================
 AUTH BUTTONS
========================= */

$("#switchAuth").onclick =
() => {

  switchAuthMode(
    authMode === "login"
      ? "signup"
      : "login"
  );

};


$("#googleBtn").onclick =
async () => {

  try {

    await signInWithPopup(
      auth,
      new GoogleAuthProvider()
    );

  } catch (error) {

    toast(
      error.message
    );
  }
};


$("#forgotBtn").onclick =
async () => {

  const email =
    $("#authEmail")
      .value
      .trim();


  if (!email) {

    return toast(
      "Enter your email first"
    );
  }


  try {

    await sendPasswordResetEmail(
      auth,
      email
    );


    toast(
      "Password reset email sent"
    );

  } catch (error) {

    toast(
      error.message
    );
  }
};


$$(".password-toggle").forEach(
button => {

  button.onclick =
    () => {

      const input =
        $("#" + button.dataset.target);


      input.type =
        input.type === "password"
          ? "text"
          : "password";


      button.textContent =
        input.type === "password"
          ? "Show"
          : "Hide";
    };

}
);


$("#logoutBtn").onclick =
() => {
  signOut(auth);
};


/* =========================
 NAVIGATION
========================= */

$("#newResumeBtn").onclick =
() => {
  show("#builderView");
};


$("#editResumeBtn").onclick =
() => {
  show("#builderView");
};


$("#backDashboardBtn").onclick =
() => {

  syncAndRender();

  show("#dashboardView");
};


/* =========================
 SAVE / EXPORT BUTTONS
========================= */

$("#saveBtn").onclick =
() => saveResume(false);


$("#pdfBtn").onclick =
exportPDF;


$("#pngBtn").onclick =
exportImage;


$("#homePdfBtn").onclick =
exportPDF;


$("#homePngBtn").onclick =
exportImage;


/* =========================
 TABS
========================= */

$$(".tab").forEach(
button => {

  button.onclick =
    () => {

      showTab(
        button.dataset.tab
      );
    };

}
);


/* =========================
 TEMPLATE SELECT
========================= */

$("#templateGrid").addEventListener(
"click",
event => {

  const button =
    event.target.closest(
      "[data-template]"
    );


  if (!button) {
    return;
  }


  state.template =
    button.dataset.template;


  markDirty();
}
);


/* =========================
 COLOR PRESETS
========================= */

$("#presetColors").addEventListener(
"click",
event => {

  const button =
    event.target.closest(
      "[data-preset]"
    );


  if (!button) {
    return;
  }


  state.style.accentColor =
    button.dataset.preset;


  fillStatic();

  markDirty();
}
);


/* =========================
 INPUT CHANGES
========================= */

document.addEventListener(
"input",
event => {

  const target =
    event.target;


  if (target.dataset.key) {

    state[
      target.dataset.key
    ] =
      target.value;


    markDirty();
  }


  if (target.dataset.group) {

    state[
      target.dataset.group
    ][
      Number(
        target.dataset.index
      )
    ][
      target.dataset.field
    ] =
      target.value;


    markDirty();
  }


  if (
    target.dataset.style &&
    !target.dataset.hex
  ) {

    state.style[
      target.dataset.style
    ] =
      target.type === "number"
        ? Number(target.value)
        : target.value;


    if (
      target.type === "color"
    ) {

      const hex =
        $(
          `[data-style="${target.dataset.style}"][data-hex]`
        );


      if (hex) {

        hex.value =
          target.value;
      }
    }


    markDirty();
  }


  if (
    target.dataset.hex &&
    validHex(target.value)
  ) {

    state.style[
      target.dataset.style
    ] =
      target.value;


    const picker =
      $(
        `input[type="color"][data-style="${target.dataset.style}"]`
      );


    if (picker) {

      picker.value =
        target.value;
    }


    markDirty();
  }
}
);


/* =========================
 SELECT CHANGES
========================= */

document.addEventListener(
"change",
event => {

  const target =
    event.target;


  if (
    target.dataset.style &&
    target.tagName === "SELECT"
  ) {

    state.style[
      target.dataset.style
    ] =
      target.value;


    markDirty();
  }
}
);


/* =========================
 ADD / REMOVE FIELDS
========================= */

document.addEventListener(
"click",
event => {

  const add =
    event.target.closest(
      "[data-add]"
    );


  if (add) {

    const group =
      add.dataset.add;


    const simpleGroups = [
      "skills",
      "languages",
      "achievements",
      "interests"
    ];


    state[group].push(
      simpleGroups.includes(group)
        ? { name: "" }
        : {}
    );


    renderDynamic();

    markDirty();
  }


  const remove =
    event.target.closest(
      "[data-remove]"
    );


  if (remove) {

    const group =
      remove.dataset.remove;


    state[group].splice(
      Number(
        remove.dataset.index
      ),
      1
    );


    renderDynamic();

    markDirty();
  }
}
);


/* =========================
 PROFILE PHOTO
========================= */

$("#photoInput").onchange =
event => {

  const file =
    event.target.files[0];


  if (!file) {
    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    () => {

      state.photo =
        reader.result;


      markDirty();
    };


  reader.readAsDataURL(
    file
  );
};


/* =========================
 ZOOM BUTTONS
========================= */

$("#zoomIn").onclick =
() => {

  zoom =
    Math.min(
      1.2,
      zoom + 0.08
    );

  applyZoom();
};


$("#zoomOut").onclick =
() => {

  zoom =
    Math.max(
      0.35,
      zoom - 0.08
    );

  applyZoom();
};


/* =========================
 INITIAL RENDER
========================= */

renderTemplateGrid();
renderPresets();
fillStatic();
renderDynamic();
syncAndRender();


/* =========================
 AUTH STATE
========================= */

onAuthStateChanged(
auth,
async currentUser => {

  user =
    currentUser;


  if (!currentUser) {

    show("#authView");

    return;
  }


  await loadResume();


  const name =
    currentUser.displayName ||
    currentUser.email
      ?.split("@")[0] ||
    "there";


  $("#userGreeting").textContent =
    `Hello, ${name}`;


  $("#dashHello").textContent =
    `Good day, ${name}`;


  show("#dashboardView");
}
);
$$$
