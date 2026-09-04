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


let app, auth, db;

try {
app = initializeApp(firebaseConfig);
auth = getAuth(app);
db = getDatabase(app);
} catch (error) {
console.error("Firebase initialization error:", error);
}

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const clone = v => JSON.parse(JSON.stringify(v));
const empty = () => ({});

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

let state = clone(defaults);
let user = null;
let zoom = 0.82;
let authMode = "login";
let saveTimer;
let autoTimer;

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

const escapeHtml = value =>
String(value ?? "").replace(/[&<>"']/g, m => ({
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
}[m]));

const listText = arr =>
arr
.filter(Boolean)
.map(v =>
`<span class="pill">${escapeHtml(
        typeof v === "string" ? v : v.name || v.title || ""
      )}</span>`
)
.join("");

function toast(message) {
const t = $("#toast");

if (!t) {
console.log(message);
return;
}

t.textContent = message;
t.classList.add("show");

setTimeout(() => {
t.classList.remove("show");
}, 2600);
}

function show(id) {

$$$(".view").forEach(v => v.classList.add("hidden"));

const view = $(id);

if (view) {
  view.classList.remove("hidden");
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
    panel.id === name + "Panel"
  );
});
}


function validHex(value) {
return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}


function formatTime(timestamp) {
if (!timestamp) {
  return "Not saved yet";
}

const date = new Date(timestamp);

if (isNaN(date.getTime())) {
  return "Not saved yet";
}

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
if (!timestamp) {
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

return formatTime(date.getTime());
}


function section(title, content, extra = "") {
return content
  ? `<section class="resume-section ${extra}">
      <h3>${title}</h3>
      ${content}
    </section>`
  : "";
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

return contacts.length
  ? `<div class="resume-contact">
      ${contacts.map(escapeHtml).join(" • ")}
    </div>`
  : "";
}


function itemsHtml(items, type) {
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

const exp = section(
  "Experience",
  itemsHtml(
    state.experience,
    side ? "timeline" : ""
  )
);

const edu = section(
  "Education",
  itemsHtml(
    state.education,
    side ? "timeline" : ""
  )
);

const projects = section(
  "Projects",
  itemsHtml(state.projects)
);

const cert = section(
  "Certifications",
  itemsHtml(state.certifications)
);

const skills = section(
  "Skills",
  listText(state.skills)
);

const languages = section(
  "Languages",
  listText(state.languages)
);

const achievements = section(
  "Achievements",
  itemsHtml(state.achievements)
);

const interests = section(
  "Interests",
  listText(state.interests)
);

return {
  exp,
  edu,
  projects,
  cert,
  skills,
  languages,
  achievements,
  interests
};
}


function renderResume() {

const r = $("#resumePreview");
const s = state.style;
const hasName = state.fullName.trim();

if (!r) {
  return;
}

r.className = `resume template-${state.template}`;

r.style.setProperty(
  "--accent",
  s.accentColor
);

r.style.setProperty(
  "--text",
  s.textColor
);

r.style.setProperty(
  "--body-font",
  `"${s.bodyFont}"`
);

r.style.setProperty(
  "--heading-font",
  `"${s.headingFont}"`
);

r.style.setProperty(
  "--heading-size",
  s.headingSize + "px"
);

r.style.setProperty(
  "--body-size",
  s.bodySize + "px"
);

r.style.setProperty(
  "--page-padding",
  s.pagePadding + "mm"
);

r.style.setProperty(
  "--border-width",
  s.borderWidth + "px"
);

r.style.setProperty(
  "--border-style",
  s.borderStyle
);

r.style.setProperty(
  "--border-color",
  s.borderColor
);

r.style.setProperty(
  "--radius",
  s.radius + "px"
);

r.style.setProperty(
  "--line-height",
  s.lineHeight || 1.45
);

r.style.background =
  s.backgroundColor;

r.style.width =
  s.pageWidth + "mm";

r.style.minHeight =
  s.pageHeight + "mm";


if (!hasName) {

  r.innerHTML = `
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
      alt=""
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
    ? `
      <p>
        ${escapeHtml(state.summary)}
      </p>
    `
    : ""
);


const b = contentBlocks(
  state.template === "timeline"
);


if (state.template === "editorial") {

  r.innerHTML = `
    ${header}
    ${summary}

    <div class="resume-body">

      <div>
        ${b.exp}
        ${b.edu}
        ${b.projects}
        ${b.achievements}
      </div>

      <aside>
        ${b.skills}
        ${b.languages}
        ${b.cert}
        ${b.interests}
      </aside>

    </div>
  `;

} else if (state.template === "modern") {

  r.innerHTML = `

    <aside class="modern-side">

      ${photo}

      <h1 class="resume-name">
        ${escapeHtml(state.fullName)}
      </h1>

      <p class="resume-title">
        ${escapeHtml(state.title)}
      </p>

      ${contactHtml()}
      ${b.skills}
      ${b.languages}
      ${b.interests}

    </aside>

    <main class="modern-main">
      ${summary}
      ${b.exp}
      ${b.edu}
      ${b.projects}
      ${b.cert}
      ${b.achievements}
    </main>
  `;

} else if (state.template === "creative") {

  r.innerHTML = `

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
        ${b.exp}
        ${b.projects}
        ${b.achievements}
      </div>

      <div>
        ${b.edu}
        ${b.skills}
        ${b.languages}
        ${b.cert}
        ${b.interests}
      </div>

    </div>
  `;

} else if (state.template === "executive") {

  r.innerHTML = `
    ${header}
    ${summary}

    <div class="creative-grid">

      <div>
        ${b.exp}
        ${b.projects}
        ${b.achievements}
      </div>

      <div>
        ${b.edu}
        ${b.skills}
        ${b.languages}
        ${b.cert}
        ${b.interests}
      </div>

    </div>
  `;

} else if (state.template === "timeline") {

  r.innerHTML = `
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

    ${b.projects}
    ${b.cert}
    ${b.skills}
    ${b.languages}
    ${b.achievements}
    ${b.interests}
  `;

} else if (state.template === "studio") {

  r.innerHTML = `

    <div class="studio-block">
      ${header}
    </div>

    <div class="creative-grid">

      <div>
        ${summary}
        ${b.exp}
        ${b.projects}
      </div>

      <div>
        ${b.edu}
        ${b.skills}
        ${b.languages}
        ${b.cert}
        ${b.achievements}
        ${b.interests}
      </div>

    </div>
  `;

} else {

  r.innerHTML = `
    ${header}
    ${summary}
    ${b.exp}
    ${b.edu}
    ${b.projects}
    ${b.cert}
    ${b.skills}
    ${b.languages}
    ${b.achievements}
    ${b.interests}
  `;
}


applyZoom();
}


function applyZoom() {

const r = $("#resumePreview");

if (!r) {
  return;
}

r.style.transform =
  `scale(${zoom})`;

const label = $("#zoomLabel");

if (label) {
  label.textContent =
    Math.round(zoom * 100) + "%";
}

if (r.parentElement) {
  r.parentElement.style.minHeight =
    `${Math.max(
      297,
      r.scrollHeight / 3.78
    ) * zoom + 70}px`;
}
}


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

  skills: [
    "Skill"
  ],

  languages: [
    "Language"
  ],

  achievements: [
    "Achievement"
  ],

  interests: [
    "Interest"
  ]
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

  skills: [
    "name"
  ],

  languages: [
    "name"
  ],

  achievements: [
    "name"
  ],

  interests: [
    "name"
  ]
};


Object.entries(groups).forEach(
  ([group, labels]) => {

    const box =
      $("#" + group + "List");

    if (!box) {
      return;
    }

    box.innerHTML = "";


    state[group].forEach(
      (item, index) => {

        const wrap =
          document.createElement("div");

        wrap.className =
          "repeat-item";


        wrap.innerHTML = `

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
          (label, i) => {

            const field =
              document.createElement("div");

            field.className =
              "field";

            const key =
              keys[group][i];


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


            const element =
              field.querySelector(
                "input, textarea"
              );

            element.value =
              item[key] || "";

            wrap.appendChild(field);
          }
        );


        box.appendChild(wrap);
      }
    );
  }
);
}


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


  const key =
    input.dataset.style;

  input.value =
    state.style[key] ?? "";
});


$$("[data-hex]").forEach(input => {

  input.value =
    state.style[
      input.dataset.style
    ] || "";

});
}


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


function syncAndRender() {

renderResume();
renderTemplateGrid();


const homeResumeName =
  $("#homeResumeName");

if (homeResumeName) {
  homeResumeName.textContent =
    state.fullName ||
    state.resumeName;
}


const homeResumeTitle =
  $("#homeResumeTitle");

if (homeResumeTitle) {
  homeResumeTitle.textContent =
    state.resumeName ||
    "Untitled resume";
}


const time =
  state.updatedAt;


const lastSaved =
  $("#lastSaved");

if (lastSaved) {
  lastSaved.textContent =
    relativeTime(time);
}


const builderTime =
  $("#builderTime");

if (builderTime) {
  builderTime.textContent =
    formatTime(time);
}
}


function markDirty() {

const status =
  $("#resumeStatus");

if (status) {
  status.textContent =
    "Editing…";
}


clearTimeout(autoTimer);


autoTimer = setTimeout(
  () => {
    saveResume(true);
  },
  1500
);


syncAndRender();


localStorage.setItem(
  "maison-resume-draft",
  JSON.stringify(state)
);
}


/* ==========================================
 REALTIME DATABASE SAVE
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

  const resumeRef = ref(
    db,
    `users/${user.uid}/resumes/default`
  );


  await set(
    resumeRef,
    {
      ...state,

      userId: user.uid,

      createdAt:
        state.createdAt,

      updatedAt:
        serverTimestamp()
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
      "Saved locally — check Firebase Database Rules"
    );
  }
}
}


/* ==========================================
 REALTIME DATABASE LOAD
========================================== */

async function loadResume() {

/* Load local draft first */

const local =
  localStorage.getItem(
    "maison-resume-draft"
  );


if (local) {

  try {

    const savedData =
      JSON.parse(local);


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


/* Load from Realtime Database */

if (user && db) {

  try {

    const resumeRef = ref(
      db,
      `users/${user.uid}/resumes/default`
    );


    const snapshot =
      await get(resumeRef);


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


      /* Update local backup */

      localStorage.setItem(
        "maison-resume-draft",
        JSON.stringify(state)
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


async function exportImage() {

const button =
  $("#pngBtn");

const old =
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
    (state.resumeName || "resume") +
    ".png";


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
    old;
}
}


async function exportPDF() {

const button =
  $("#pdfBtn");

const old =
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


  while (heightLeft > 0) {

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
    (state.resumeName || "resume") +
    ".pdf"
  );

} catch (error) {

  console.error(error);

  toast(
    "PDF export failed"
  );

} finally {

  button.textContent =
    old;
}
}


/* ==========================================
 AUTHENTICATION
========================================== */

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


      const confirm =
        $("#authConfirm")
          .value;


      if (!name) {

        throw new Error(
          "Please enter your name"
        );
      }


      if (
        password !== confirm
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
() => signOut(auth);


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
      +target.dataset.index
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


  if (target.dataset.hex) {

    if (
      validHex(
        target.value
      )
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
}
);


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
      +remove.dataset.index,
      1
    );


    renderDynamic();

    markDirty();
  }
}
);


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


/* ==========================================
 INITIAL RENDER
========================================== */

renderTemplateGrid();

renderPresets();

fillStatic();

renderDynamic();

syncAndRender();


/* ==========================================
 AUTH STATE
========================================== */

onAuthStateChanged(
auth,
async currentUser => {

  user =
    currentUser;


  if (!currentUser) {

    show(
      "#authView"
    );

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


  show(
    "#dashboardView"
  );
}
);
$$$
