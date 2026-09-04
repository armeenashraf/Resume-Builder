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
  get
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

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


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

console.log("Firebase Authentication connected");
console.log("Firebase Realtime Database connected");


/* =========================================================
   HELPERS
========================================================= */

const $ = selector => document.querySelector(selector);

const $$ = selector => [
  ...document.querySelectorAll(selector)
];

const clone = value =>
  JSON.parse(JSON.stringify(value));


/* =========================================================
   DEFAULT RESUME
========================================================= */

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


/* =========================================================
   APP STATE
========================================================= */

let state = clone(defaults);

let user = null;

let zoom = 0.82;

let authMode = "login";

let autoTimer = null;


/* =========================================================
   ACCOUNT-SPECIFIC LOCAL STORAGE
========================================================= */

/*
   IMPORTANT:
   localStorage is shared by the browser.

   OLD:
   maison-resume-draft

   NEW:
   maison-resume-draft-FIREBASE_UID

   This prevents Account B from seeing Account A's
   locally stored resume.
*/

function getLocalKey() {

  if (!user?.uid) {
    return null;
  }

  return `maison-resume-draft-${user.uid}`;
}


function saveLocalDraft() {

  const key = getLocalKey();

  if (!key) {
    return;
  }

  try {

    localStorage.setItem(
      key,
      JSON.stringify(state)
    );

  }

  catch (error) {

    console.error(
      "Local draft save error:",
      error
    );

  }

}


function loadLocalDraft() {

  const key = getLocalKey();

  if (!key) {
    return false;
  }

  const localDraft =
    localStorage.getItem(key);

  if (!localDraft) {
    return false;
  }

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

    return true;

  }

  catch (error) {

    console.error(
      "Local draft loading error:",
      error
    );

    return false;

  }

}


/* =========================================================
   REMOVE OLD SHARED STORAGE
========================================================= */

try {

  localStorage.removeItem(
    "maison-resume-draft"
  );

}

catch (error) {

  console.warn(
    "Could not remove old local draft:",
    error
  );

}


/* =========================================================
   TEMPLATES
========================================================= */

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


/* =========================================================
   COLOR PRESETS
========================================================= */

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


/* =========================================================
   FONTS
========================================================= */

const fonts = [

  "Playfair Display",

  "DM Sans",

  "Manrope",

  "Montserrat",

  "Libre Baskerville",

  "Space Grotesk",

  "Inter"

];


/* =========================================================
   SECURITY
========================================================= */

const escapeHtml = value =>

  String(value ?? "").replace(

    /[&<>"']/g,

    character => ({

      "&": "&amp;",

      "<": "&lt;",

      ">": "&gt;",

      '"': "&quot;",

      "'": "&#039;"

    }[character])

  );


/* =========================================================
   VALIDATE HEX
========================================================= */

function validHex(value) {

  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
    value.trim()
  );

}


/* =========================================================
   TOAST
========================================================= */

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


/* =========================================================
   VIEW SWITCH
========================================================= */

function show(id) {

  $$(".view").forEach(view => {

    view.classList.add("hidden");

  });

  const selected = $(id);

  if (selected) {

    selected.classList.remove("hidden");

  }

}


/* =========================================================
   TABS
========================================================= */

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


/* =========================================================
   DATE FORMATTING
========================================================= */

function formatTime(timestamp) {

  if (
    !timestamp ||
    typeof timestamp !== "number"
  ) {

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


/* =========================================================
   RELATIVE TIME
========================================================= */

function relativeTime(timestamp) {

  if (
    !timestamp ||
    typeof timestamp !== "number"
  ) {

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


/* =========================================================
   RESUME SECTION
========================================================= */

function section(title, content, extra = "") {

  if (!content) {

    return "";

  }

  return `

    <section class="resume-section ${extra}">

      <h3>${escapeHtml(title)}</h3>

      ${content}

    </section>

  `;

}


/* =========================================================
   CONTACT
========================================================= */

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

      ${contacts
        .map(escapeHtml)
        .join(" • ")}

    </div>

  `;

}


/* =========================================================
   LIST TEXT
========================================================= */

function listText(array) {

  if (!Array.isArray(array)) {

    return "";

  }

  return array

    .filter(Boolean)

    .map(item => {

      const text =

        typeof item === "string"

          ? item

          : item.name ||
            item.title ||
            "";

      if (!text) {

        return "";

      }

      return `

        <span class="pill">

          ${escapeHtml(text)}

        </span>

      `;

    })

    .join("");

}


/* =========================================================
   RESUME ITEMS
========================================================= */

function itemsHtml(items, type = "") {

  if (!Array.isArray(items)) {

    return "";

  }

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

        item.name ||

        "";

      const sub =

        item.institution ||

        item.company ||

        item.issuingOrganization ||

        item.technologies ||

        item.location ||

        "";

      const date = [

        item.startYear ||
        item.startDate,

        item.endYear ||
        item.endDate

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


/* =========================================================
   CONTENT BLOCKS
========================================================= */

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


/* =========================================================
   RENDER RESUME
========================================================= */

function renderResume() {

  const resume = $("#resumePreview");

  if (!resume) {

    return;

  }

  const style = state.style;

  const hasName =
    state.fullName.trim();

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

  resume.style.boxSizing =
    "border-box";

  if (!hasName) {

    resume.innerHTML = `

      <div class="resume-empty">

        <div>

          <h2>
            Start building your resume
          </h2>

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
        src="${escapeHtml(state.photo)}"
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


  /* =====================================================
     EDITORIAL
  ===================================================== */

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

  }


  /* =====================================================
     MODERN
  ===================================================== */

  else if (state.template === "modern") {

    resume.innerHTML = `

      <aside class="modern-side">

        ${photo}

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

  }


  /* =====================================================
     CREATIVE
  ===================================================== */

  else if (state.template === "creative") {

    resume.innerHTML = `

      <div class="creative-hero">

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

  }


  /* =====================================================
     EXECUTIVE
  ===================================================== */

  else if (state.template === "executive") {

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

  }


  /* =====================================================
     TIMELINE
  ===================================================== */

  else if (state.template === "timeline") {

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

  }


  /* =====================================================
     STUDIO
  ===================================================== */

  else if (state.template === "studio") {

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

  }


  /* =====================================================
     DEFAULT TEMPLATES
  ===================================================== */

  else {

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


/* =========================================================
   ZOOM
========================================================= */

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


/* =========================================================
   DYNAMIC FORM FIELDS
========================================================= */

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
        $(`#${group}List`);

      if (!box) {
        return;
      }

      box.innerHTML = "";

      const items =
        Array.isArray(state[group])
          ? state[group]
          : [];


      items.forEach(
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

                  ${escapeHtml(label)}

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


/* =========================================================
   FILL STATIC INPUTS
========================================================= */

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


/* =========================================================
   TEMPLATE GRID
========================================================= */

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
            ${escapeHtml(name)}
          </small>

        </button>

      `
    )

    .join("");

}


/* =========================================================
   PRESET COLORS
========================================================= */

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


/* =========================================================
   SYNC UI
========================================================= */

function syncAndRender() {

  renderResume();

  renderTemplateGrid();


  const homeName =
    $("#homeResumeName");

  if (homeName) {

    homeName.textContent =
      state.fullName ||
      state.resumeName ||
      "Untitled resume";

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


/* =========================================================
   MARK DIRTY
========================================================= */

function markDirty() {

  const status =
    $("#resumeStatus");

  if (status) {

    status.textContent =
      "Editing…";

  }


  /*
     Save locally immediately,
     but under the current user's UID.
  */

  saveLocalDraft();


  clearTimeout(autoTimer);


  autoTimer =
    setTimeout(
      () => {

        saveResume(true);

      },
      1500
    );


  syncAndRender();

}


/* =========================================================
   SAVE RESUME TO FIREBASE
========================================================= */

async function saveResume(silent = false) {

  /*
     If there is no authenticated user,
     do NOT write a shared localStorage key.
  */

  if (!user) {

    if (!silent) {

      toast(
        "Please log in to save your resume."
      );

    }

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

    state.createdAt =
      now;

  }


  state.updatedAt =
    now;


  try {

    const resumeReference =
      ref(
        db,
        `users/${user.uid}/resumes/default`
      );


    const resumeData = {

      ...clone(state),

      userId:
        user.uid,

      createdAt:
        state.createdAt,

      updatedAt:
        state.updatedAt

    };


    await set(
      resumeReference,
      resumeData
    );


    /*
       Also keep the current user's
       local copy updated.
    */

    saveLocalDraft();


    if (status) {

      status.textContent =
        "Saved ✓";

    }


    syncAndRender();


    if (!silent) {

      toast(
        "Resume saved successfully ✓"
      );

    }


    console.log(
      "Resume saved for:",
      user.uid
    );

    console.log(
      `Firebase path: users/${user.uid}/resumes/default`
    );

  }


  catch (error) {

    console.error(
      "Realtime Database save error:",
      error
    );


    if (status) {

      status.textContent =
        "Save failed";

    }


    if (!silent) {

      toast(
        "Could not save to Firebase. Check your Database Rules."
      );

    }

  }

}


/* =========================================================
   LOAD RESUME
========================================================= */

async function loadResume() {

  /*
     ALWAYS reset state first.
     This is important when switching accounts.
  */

  state =
    clone(defaults);


  /*
     Load only the current user's
     localStorage draft.
  */

  loadLocalDraft();


  /*
     If there is no user, stop here.
  */

  if (!user || !db) {

    fillStatic();

    renderDynamic();

    syncAndRender();

    return;

  }


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


    /*
       Firebase has the user's resume.
       Firebase is the source of truth.
    */

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


      /*
         Sync Firebase copy to this
         user's localStorage.
      */

      saveLocalDraft();


      console.log(
        "Resume loaded from Firebase for:",
        user.uid
      );

    }


    /*
       IMPORTANT:
       If Firebase has NO resume for this
       account, start completely fresh.

       We do NOT use another user's data.
    */

    else {

      state =
        clone(defaults);

      console.log(
        "New account detected. Starting fresh resume for:",
        user.uid
      );

      saveLocalDraft();

    }

  }


  catch (error) {

    console.error(
      "Firebase resume load error:",
      error
    );


    /*
       If Firebase temporarily fails,
       use ONLY this user's local draft.
    */

    state =
      clone(defaults);

    loadLocalDraft();


    toast(
      "Could not load Firebase data. Using your local draft."
    );

  }


  fillStatic();

  renderDynamic();

  syncAndRender();

}


/* =========================================================
   AUTH MODE
========================================================= */

function switchAuthMode(mode) {

  authMode =
    mode;


  const signup =
    mode === "signup";


  const authTitle =
    $("#authTitle");

  if (authTitle) {

    authTitle.textContent =
      signup
        ? "Create your account"
        : "Welcome back";

  }


  const authSubtitle =
    $("#authSubtitle");

  if (authSubtitle) {

    authSubtitle.textContent =
      signup
        ? "Start building a resume that feels like you."
        : "Your next opportunity starts with a better resume.";

  }


  const nameField =
    $("#nameField");

  if (nameField) {

    nameField.classList.toggle(
      "hidden",
      !signup
    );

  }


  const confirmField =
    $("#confirmField");

  if (confirmField) {

    confirmField.classList.toggle(
      "hidden",
      !signup
    );

  }


  const forgotBtn =
    $("#forgotBtn");

  if (forgotBtn) {

    forgotBtn.classList.toggle(
      "hidden",
      signup
    );

  }


  const authSubmit =
    $("#authSubmit");

  if (authSubmit) {

    authSubmit.textContent =
      signup
        ? "Create account"
        : "Log in";

  }


  const switchText =
    $("#switchText");

  if (switchText) {

    switchText.textContent =
      signup
        ? "Already have an account?"
        : "Don't have an account?";

  }


  const switchAuthButton =
    $("#switchAuth");

  if (switchAuthButton) {

    switchAuthButton.textContent =
      signup
        ? "Log in"
        : "Sign up";

  }

}


/* =========================================================
   EMAIL AUTH
========================================================= */

const authForm =
  $("#authForm");


if (authForm) {

  authForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const email =
        $("#authEmail")
          ?.value
          .trim();


      const password =
        $("#authPassword")
          ?.value || "";


      if (!email) {

        toast(
          "Please enter your email."
        );

        return;

      }


      if (!password) {

        toast(
          "Please enter your password."
        );

        return;

      }


      const submitButton =
        $("#authSubmit");


      const originalText =
        submitButton?.textContent ||
        "Submit";


      if (submitButton) {

        submitButton.disabled =
          true;

        submitButton.textContent =
          authMode === "signup"
            ? "Creating..."
            : "Logging in...";

      }


      try {

        /* -------------------------------------
           SIGN UP
        ------------------------------------- */

        if (authMode === "signup") {

          const name =
            $("#authName")
              ?.value
              .trim();


          const confirmPassword =
            $("#authConfirm")
              ?.value || "";


          if (!name) {

            throw new Error(
              "Please enter your name."
            );

          }


          if (password.length < 6) {

            throw new Error(
              "Password must be at least 6 characters."
            );

          }


          if (
            password !==
            confirmPassword
          ) {

            throw new Error(
              "Passwords do not match."
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
              displayName: name
            }
          );


          /*
             New account = completely fresh resume.
          */

          user =
            credential.user;

          state =
            clone(defaults);

          saveLocalDraft();


          toast(
            "Account created successfully ✓"
          );

        }


        /* -------------------------------------
           LOGIN
        ------------------------------------- */

        else {

          await signInWithEmailAndPassword(
            auth,
            email,
            password
          );


          toast(
            "Welcome back ✓"
          );

        }

      }


      catch (error) {

        console.error(
          "Authentication error:",
          error
        );


        let message =
          error.message ||
          "Authentication failed.";


        const errorMap = {

          "auth/email-already-in-use":
            "This email is already registered.",

          "auth/invalid-email":
            "Please enter a valid email.",

          "auth/weak-password":
            "Password must be at least 6 characters.",

          "auth/invalid-credential":
            "Incorrect email or password.",

          "auth/user-not-found":
            "Incorrect email or password.",

          "auth/wrong-password":
            "Incorrect email or password.",

          "auth/popup-closed-by-user":
            "Google login was cancelled.",

          "auth/popup-blocked":
            "Please allow popups for Google login.",

          "auth/network-request-failed":
            "Network error. Please check your internet.",

          "auth/too-many-requests":
            "Too many attempts. Please try again later."

        };


        Object.entries(errorMap)
          .forEach(
            ([key, value]) => {

              if (
                error.code === key ||
                error.message?.includes(key)
              ) {

                message =
                  value;

              }

            }
          );


        toast(message);

      }


      finally {

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            originalText;

        }

      }

    }
  );

}


/* =========================================================
   SWITCH LOGIN / SIGNUP
========================================================= */

const switchAuth =
  $("#switchAuth");


if (switchAuth) {

  switchAuth.onclick = () => {

    switchAuthMode(
      authMode === "login"
        ? "signup"
        : "login"
    );

  };

}


/* =========================================================
   GOOGLE LOGIN
========================================================= */

const googleBtn =
  $("#googleBtn");


if (googleBtn) {

  googleBtn.onclick =
    async () => {

      const button =
        $("#googleBtn");


      const originalText =
        button.textContent;


      button.disabled =
        true;

      button.textContent =
        "Opening Google...";


      try {

        const provider =
          new GoogleAuthProvider();


        provider.setCustomParameters({
          prompt: "select_account"
        });


        await signInWithPopup(
          auth,
          provider
        );


        toast(
          "Google login successful ✓"
        );

      }


      catch (error) {

        console.error(
          "Google authentication error:",
          error
        );


        let message =
          error.message ||
          "Google login failed.";


        if (
          error.code ===
          "auth/popup-closed-by-user"
        ) {

          message =
            "Google login was cancelled.";

        }


        if (
          error.code ===
          "auth/popup-blocked"
        ) {

          message =
            "Please allow popups for this website.";

        }


        toast(message);

      }


      finally {

        button.disabled =
          false;

        button.textContent =
          originalText;

      }

    };

}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

const forgotBtn =
  $("#forgotBtn");


if (forgotBtn) {

  forgotBtn.onclick =
    async () => {

      const email =
        $("#authEmail")
          ?.value
          .trim();


      if (!email) {

        toast(
          "Enter your email first."
        );

        return;

      }


      try {

        await sendPasswordResetEmail(
          auth,
          email
        );


        toast(
          "Password reset email sent ✓"
        );

      }


      catch (error) {

        console.error(error);

        toast(
          "Could not send password reset email."
        );

      }

    };

}


/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

$$(".password-toggle").forEach(
  button => {

    button.onclick = () => {

      const input =
        $("#" + button.dataset.target);


      if (!input) {
        return;
      }


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


/* =========================================================
   LOGOUT
========================================================= */

const logoutBtn =
  $("#logoutBtn");


if (logoutBtn) {

  logoutBtn.onclick =
    async () => {

      try {

        clearTimeout(autoTimer);

        await signOut(auth);


        /*
           Completely clear in-memory state.
           This prevents the previous account's
           resume from remaining visible.
        */

        user = null;

        state =
          clone(defaults);


        fillStatic();
        renderDynamic();
        syncAndRender();


        show("#authView");


        toast(
          "Logged out successfully."
        );

      }


      catch (error) {

        console.error(error);

        toast(
          "Logout failed."
        );

      }

    };

}


/* =========================================================
   DASHBOARD NAVIGATION
========================================================= */

const newResumeBtn =
  $("#newResumeBtn");


if (newResumeBtn) {

  newResumeBtn.onclick =
    () => {

      /*
         "New Resume" should create a fresh
         resume for the CURRENT account.
      */

      state =
        clone(defaults);

      saveLocalDraft();

      fillStatic();
      renderDynamic();
      syncAndRender();

      show("#builderView");

    };

}


const editResumeBtn =
  $("#editResumeBtn");


if (editResumeBtn) {

  editResumeBtn.onclick =
    () => {

      show("#builderView");

      fillStatic();
      renderDynamic();
      syncAndRender();

    };

}


const backDashboardBtn =
  $("#backDashboardBtn");


if (backDashboardBtn) {

  backDashboardBtn.onclick =
    () => {

      syncAndRender();

      show("#dashboardView");

    };

}


/* =========================================================
   SAVE BUTTON
========================================================= */

const saveBtn =
  $("#saveBtn");


if (saveBtn) {

  saveBtn.onclick =
    () => {

      saveResume(false);

    };

}


/* =========================================================
   PNG EXPORT
========================================================= */

async function exportImage(
  buttonId = "#pngBtn"
) {

  const button =
    $(buttonId);


  /*
     Important:
     Dashboard buttons now work too.
  */

  const oldText =
    button?.textContent ||
    "Download PNG";


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Preparing…";

  }


  try {

    const {
      default: html2canvas
    } = await import(
      "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm"
    );


    const preview =
      $("#resumePreview");


    if (!preview) {

      throw new Error(
        "Resume preview not found."
      );

    }


    const canvas =
      await html2canvas(
        preview,
        {

          scale: 3,

          useCORS: true,

          allowTaint: false,

          backgroundColor:
            state.style.backgroundColor,

          logging: false,

          windowWidth:
            preview.scrollWidth,

          windowHeight:
            preview.scrollHeight

        }
      );


    const link =
      document.createElement("a");


    const fileName =
      (
        state.resumeName ||
        state.fullName ||
        "resume"
      )
        .replace(
          /[^a-z0-9_\-\s]/gi,
          ""
        )
        .trim() ||
      "resume";


    link.download =
      `${fileName}.png`;


    link.href =
      canvas.toDataURL(
        "image/png",
        1
      );


    document.body.appendChild(link);

    link.click();

    link.remove();


    toast(
      "PNG downloaded successfully ✓"
    );

  }


  catch (error) {

    console.error(
      "PNG export error:",
      error
    );


    toast(
      "PNG export failed."
    );

  }


  finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        oldText;

    }

  }

}


/* =========================================================
   PDF EXPORT
========================================================= */

async function exportPDF(
  buttonId = "#pdfBtn"
) {

  const button =
    $(buttonId);


  const oldText =
    button?.textContent ||
    "Download PDF";


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Preparing…";

  }


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


    if (!element) {

      throw new Error(
        "Resume preview not found."
      );

    }


    const pageWidth =
      Number(
        state.style.pageWidth
      ) || 210;


    const pageHeight =
      Number(
        state.style.pageHeight
      ) || 297;


    const canvas =
      await html2canvas(
        element,
        {

          scale: 3,

          useCORS: true,

          allowTaint: false,

          backgroundColor:
            state.style.backgroundColor,

          logging: false,

          windowWidth:
            element.scrollWidth,

          windowHeight:
            element.scrollHeight

        }
      );


    const pdf =
      new jsPDF({

        orientation:
          pageWidth > pageHeight
            ? "landscape"
            : "portrait",

        unit: "mm",

        format: [
          pageWidth,
          pageHeight
        ],

        compress: true

      });


    const imageHeight =
      canvas.height *
      pageWidth /
      canvas.width;


    const image =
      canvas.toDataURL(
        "image/jpeg",
        0.98
      );


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


      pdf.addPage(
        [
          pageWidth,
          pageHeight
        ]
      );


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


    const fileName =
      (
        state.resumeName ||
        state.fullName ||
        "resume"
      )
        .replace(
          /[^a-z0-9_\-\s]/gi,
          ""
        )
        .trim() ||
      "resume";


    pdf.save(
      `${fileName}.pdf`
    );


    toast(
      "PDF downloaded successfully ✓"
    );

  }


  catch (error) {

    console.error(
      "PDF export error:",
      error
    );


    toast(
      "PDF export failed."
    );

  }


  finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        oldText;

    }

  }

}


/* =========================================================
   EXPORT BUTTONS
========================================================= */

const pdfBtn =
  $("#pdfBtn");


if (pdfBtn) {

  pdfBtn.onclick =
    () => exportPDF("#pdfBtn");

}


const pngBtn =
  $("#pngBtn");


if (pngBtn) {

  pngBtn.onclick =
    () => exportImage("#pngBtn");

}


const homePdfBtn =
  $("#homePdfBtn");


if (homePdfBtn) {

  homePdfBtn.onclick =
    () => {

      /*
         Make sure dashboard export has
         the current resume rendered.
      */

      syncAndRender();

      exportPDF("#homePdfBtn");

    };

}


const homePngBtn =
  $("#homePngBtn");


if (homePngBtn) {

  homePngBtn.onclick =
    () => {

      syncAndRender();

      exportImage("#homePngBtn");

    };

}


/* =========================================================
   TABS
========================================================= */

$$(".tab").forEach(
  button => {

    button.onclick = () => {

      showTab(
        button.dataset.tab
      );

    };

  }
);


/* =========================================================
   TEMPLATE SELECT
========================================================= */

const templateGrid =
  $("#templateGrid");


if (templateGrid) {

  templateGrid.addEventListener(
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

}


/* =========================================================
   PRESET COLORS
========================================================= */

const presetColors =
  $("#presetColors");


if (presetColors) {

  presetColors.addEventListener(
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

}


/* =========================================================
   INPUT CHANGES
========================================================= */

document.addEventListener(
  "input",
  event => {

    const target =
      event.target;


    /* ---------------------------------------
       STATIC INPUT
    --------------------------------------- */

    if (target.dataset.key) {

      state[
        target.dataset.key
      ] =
        target.value;


      markDirty();

    }


    /* ---------------------------------------
       DYNAMIC INPUT
    --------------------------------------- */

    if (target.dataset.group) {

      const group =
        target.dataset.group;


      const index =
        Number(
          target.dataset.index
        );


      const field =
        target.dataset.field;


      if (
        Array.isArray(
          state[group]
        ) &&
        state[group][index]
      ) {

        state[group][index][field] =
          target.value;

      }


      markDirty();

    }


    /* ---------------------------------------
       STYLE INPUT
    --------------------------------------- */

    if (
      target.dataset.style &&
      !target.dataset.hex
    ) {

      const key =
        target.dataset.style;


      state.style[key] =

        target.type === "number"

          ? Number(target.value)

          : target.value;


      if (
        target.type === "color"
      ) {

        const hexInput =
          document.querySelector(
            `input.hex[data-style="${key}"]`
          );


        if (hexInput) {

          hexInput.value =
            target.value;

        }

      }


      markDirty();

    }


    /* ---------------------------------------
       HEX INPUT
    --------------------------------------- */

    if (
      target.dataset.hex
    ) {

      const value =
        target.value.trim();


      if (validHex(value)) {

        const key =
          target.dataset.style;


        state.style[key] =
          value;


        const picker =
          document.querySelector(
            `input[type="color"][data-style="${key}"]`
          );


        if (picker) {

          picker.value =
            value;

        }


        markDirty();

      }

    }

  }
);


/* =========================================================
   SELECT CHANGES
========================================================= */

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


/* =========================================================
   ADD / REMOVE
========================================================= */

document.addEventListener(
  "click",
  event => {


    /* ---------------------------------------
       ADD
    --------------------------------------- */

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


      if (
        !Array.isArray(
          state[group]
        )
      ) {

        state[group] = [];

      }


      state[group].push(

        simpleGroups.includes(group)

          ? { name: "" }

          : {}

      );


      renderDynamic();

      markDirty();


      return;

    }


    /* ---------------------------------------
       REMOVE
    --------------------------------------- */

    const remove =
      event.target.closest(
        "[data-remove]"
      );


    if (remove) {

      const group =
        remove.dataset.remove;


      const index =
        Number(
          remove.dataset.index
        );


      if (
        Array.isArray(
          state[group]
        )
      ) {

        state[group].splice(
          index,
          1
        );

      }


      renderDynamic();

      markDirty();

    }

  }
);


/* =========================================================
   PROFILE PHOTO
========================================================= */

const photoInput =
  $("#photoInput");


if (photoInput) {

  photoInput.onchange =
    event => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      if (
        !file.type.startsWith("image/")
      ) {

        toast(
          "Please select an image."
        );

        return;

      }


      /*
         Limit huge photos so localStorage
         doesn't get filled too quickly.
      */

      if (
        file.size > 5 * 1024 * 1024
      ) {

        toast(
          "Please choose an image smaller than 5MB."
        );

        return;

      }


      const reader =
        new FileReader();


      reader.onload =
        () => {

          state.photo =
            reader.result;


          markDirty();


          toast(
            "Profile photo added ✓"
          );

        };


      reader.onerror =
        () => {

          toast(
            "Could not read the image."
          );

        };


      reader.readAsDataURL(file);

    };

}


/* =========================================================
   ZOOM IN
========================================================= */

const zoomIn =
  $("#zoomIn");


if (zoomIn) {

  zoomIn.onclick =
    () => {

      zoom =
        Math.min(
          1.2,
          zoom + 0.08
        );


      applyZoom();

    };

}


/* =========================================================
   ZOOM OUT
========================================================= */

const zoomOut =
  $("#zoomOut");


if (zoomOut) {

  zoomOut.onclick =
    () => {

      zoom =
        Math.max(
          0.35,
          zoom - 0.08
        );


      applyZoom();

    };

}


/* =========================================================
   INITIAL RENDER
========================================================= */

renderTemplateGrid();

renderPresets();

fillStatic();

renderDynamic();

syncAndRender();


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async currentUser => {

    /*
       Clear pending auto-save from previous account.
    */

    clearTimeout(autoTimer);


    user =
      currentUser;


    /* ---------------------------------------
       NOT LOGGED IN
    --------------------------------------- */

    if (!currentUser) {

      state =
        clone(defaults);


      fillStatic();

      renderDynamic();

      syncAndRender();


      show("#authView");


      return;

    }


    /* ---------------------------------------
       LOGGED IN
    --------------------------------------- */

    try {

      await loadResume();

    }

    catch (error) {

      console.error(
        "Resume loading error:",
        error
      );

    }


    const name =
      currentUser.displayName ||

      currentUser.email
        ?.split("@")[0] ||

      "there";


    const userGreeting =
      $("#userGreeting");


    if (userGreeting) {

      userGreeting.textContent =
        `Hello, ${name}`;

    }


    const dashHello =
      $("#dashHello");


    if (dashHello) {

      dashHello.textContent =
        `Good day, ${name}`;

    }


    show("#dashboardView");


    console.log(
      "Current authenticated user:",
      currentUser.uid
    );

    console.log(
      "Current resume path:",
      `users/${currentUser.uid}/resumes/default`
    );

  }
);
