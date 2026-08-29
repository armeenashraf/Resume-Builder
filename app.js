import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAlXIf5IH_bdnSm-KUitrJ40pi5pmz_AUI",
  authDomain: "authentication-app-1644e.firebaseapp.com",
  databaseURL: "https://authentication-app-1644e-default-rtdb.firebaseio.com",
  projectId: "authentication-app-1644e",
  storageBucket: "authentication-app-1644e.firebasestorage.app",
  messagingSenderId: "553683581480",
  appId: "1:553683581480:web:6db316cf8ebb074141d31d",
  measurementId: "G-WMKXHZR1BX"
};

let app, auth, db;
try { app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app); } catch (error) { console.error(error); }

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clone = v => JSON.parse(JSON.stringify(v));
const empty = () => ({});
const defaults = {
  resumeName:"Untitled resume",fullName:"",title:"",email:"",phone:"",location:"",website:"",linkedin:"",github:"",summary:"",photo:"",
  education:[],experience:[],projects:[],certifications:[],skills:[],languages:[],achievements:[],interests:[],
  template:"editorial",
  style:{accentColor:"#8b5e3c",textColor:"#332821",backgroundColor:"#ffffff",borderColor:"#332821",headingFont:"Playfair Display",bodyFont:"DM Sans",headingSize:42,bodySize:11,pageWidth:210,pageHeight:297,pagePadding:16,borderWidth:0,borderStyle:"solid",radius:0,lineHeight:1.45},
  createdAt:null,updatedAt:null
};
let state = clone(defaults), user = null, zoom = 0.82, authMode = "login", saveTimer, autoTimer;

const templates = [
 ["editorial","Editorial"],["modern","Modern Sidebar"],["minimal","Minimal"],["creative","Creative"],
 ["executive","Executive"],["classic","Classic"],["luxe","Luxe Magazine"],["bold","Bold Portfolio"],
 ["timeline","Timeline"],["studio","Studio"]
];
const presets=["#8b5e3c","#6e2638","#315c45","#b45f3c","#263c5c","#25201d","#a86d78","#6c7140"];
const fonts=["Playfair Display","DM Sans","Manrope","Montserrat","Libre Baskerville","Space Grotesk","Inter"];

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const listText = arr => arr.filter(Boolean).map(v=>`<span class="pill">${escapeHtml(typeof v==="string"?v:v.name||v.title||"")}</span>`).join("");

function toast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function show(id){$$(".view").forEach(v=>v.classList.add("hidden"));$(id).classList.remove("hidden")}
function showTab(name){$$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));$$(".tab-panel").forEach(p=>p.classList.toggle("active",p.id===name+"Panel"))}
function validHex(v){return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)}
function formatTime(ts){if(!ts)return"Not saved yet";const d=ts.toDate?ts.toDate():new Date(ts);return `Last updated: ${d.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"})} • ${d.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`}
function relativeTime(ts){if(!ts)return"Not saved yet";const d=ts.toDate?ts.toDate():new Date(ts);const mins=Math.floor((Date.now()-d)/60000);if(mins<1)return"Saved just now";if(mins<60)return`Last saved ${mins} min ago`;return formatTime(d)}

function section(title,content,extra=""){return content?`<section class="resume-section ${extra}"><h3>${title}</h3>${content}</section>`:""}
function contactHtml(){
 const x=[state.email,state.phone,state.location,state.website,state.linkedin,state.github].filter(Boolean);
 return x.length?`<div class="resume-contact">${x.map(escapeHtml).join(" • ")}</div>`:"";
}
function itemsHtml(items,type){
 return items.map(x=>{
   if(typeof x==="string")return `<div class="resume-item">${escapeHtml(x)}</div>`;
   const title=x.degree||x.jobTitle||x.projectName||x.certificateName||"";
   const sub=x.institution||x.company||x.issuingOrganization||x.technologies||"";
   const date=[x.startYear||x.startDate,x.endYear||x.endDate].filter(Boolean).join(" — ")||x.date||"";
   const desc=x.description||"";
   return `<div class="resume-item ${type==="timeline"?"timeline-item":""}"><div class="item-top"><div><div class="item-title">${escapeHtml(title)}</div><div class="item-meta">${escapeHtml(sub)}</div></div><div class="item-meta">${escapeHtml(date)}</div></div>${desc?`<div class="item-desc">${escapeHtml(desc)}</div>`:""}${x.projectUrl?`<div class="item-meta">${escapeHtml(x.projectUrl)}</div>`:""}</div>`;
 }).join("");
}
function contentBlocks(side=false){
 const exp=section("Experience",itemsHtml(state.experience,side?"timeline":""));
 const edu=section("Education",itemsHtml(state.education,side?"timeline":""));
 const projects=section("Projects",itemsHtml(state.projects));
 const cert=section("Certifications",itemsHtml(state.certifications));
 const skills=section("Skills",listText(state.skills));
 const languages=section("Languages",listText(state.languages));
 const achievements=section("Achievements",itemsHtml(state.achievements));
 const interests=section("Interests",listText(state.interests));
 return {exp,edu,projects,cert,skills,languages,achievements,interests};
}
function renderResume(){
 const r=$("#resumePreview"), s=state.style, hasName=state.fullName.trim();
 r.className=`resume template-${state.template}`;
 r.style.setProperty("--accent",s.accentColor);r.style.setProperty("--text",s.textColor);r.style.setProperty("--body-font",`"${s.bodyFont}"`);
 r.style.setProperty("--heading-font",`"${s.headingFont}"`);r.style.setProperty("--heading-size",s.headingSize+"px");r.style.setProperty("--body-size",s.bodySize+"px");
 r.style.setProperty("--page-padding",s.pagePadding+"mm");r.style.setProperty("--border-width",s.borderWidth+"px");r.style.setProperty("--border-style",s.borderStyle);r.style.setProperty("--border-color",s.borderColor);r.style.setProperty("--radius",s.radius+"px");r.style.setProperty("--line-height",s.lineHeight||1.45);
 r.style.background=s.backgroundColor;r.style.width=s.pageWidth+"mm";r.style.minHeight=s.pageHeight+"mm";
 if(!hasName){r.innerHTML=`<div class="resume-empty"><div><h2>Start building your resume</h2><p>Your live document will appear here as you type.</p></div></div>`;applyZoom();return}
 const photo=state.photo?`<img class="profile-photo" src="${state.photo}" alt="">`:"";
 const header=`<header class="resume-header"><div><h1 class="resume-name">${escapeHtml(state.fullName)}</h1>${state.title?`<p class="resume-title">${escapeHtml(state.title)}</p>`:""}${contactHtml()}</div>${photo}</header>`;
 const summary=section("Profile",state.summary?`<p>${escapeHtml(state.summary)}</p>`:"");
 const b=contentBlocks(state.template==="timeline");
 if(state.template==="editorial")r.innerHTML=`${header}${summary}<div class="resume-body"><div>${b.exp}${b.edu}${b.projects}${b.achievements}</div><aside>${b.skills}${b.languages}${b.cert}${b.interests}</aside></div>`;
 else if(state.template==="modern")r.innerHTML=`<aside class="modern-side">${photo}<h1 class="resume-name">${escapeHtml(state.fullName)}</h1><p class="resume-title">${escapeHtml(state.title)}</p>${contactHtml()}${b.skills}${b.languages}${b.interests}</aside><main class="modern-main">${summary}${b.exp}${b.edu}${b.projects}${b.cert}${b.achievements}</main>`;
 else if(state.template==="creative")r.innerHTML=`<div class="creative-hero"><h1 class="resume-name">${escapeHtml(state.fullName)}</h1><p class="resume-title">${escapeHtml(state.title)}</p>${contactHtml()}</div>${summary}<div class="creative-grid"><div>${b.exp}${b.projects}${b.achievements}</div><div>${b.edu}${b.skills}${b.languages}${b.cert}${b.interests}</div></div>`;
 else if(state.template==="executive")r.innerHTML=`${header}${summary}<div class="creative-grid"><div>${b.exp}${b.projects}${b.achievements}</div><div>${b.edu}${b.skills}${b.languages}${b.cert}${b.interests}</div></div>`;
 else if(state.template==="timeline")r.innerHTML=`${header}${summary}${section("Experience",itemsHtml(state.experience,"timeline"))}${section("Education",itemsHtml(state.education,"timeline"))}${b.projects}${b.cert}${b.skills}${b.languages}${b.achievements}${b.interests}`;
 else if(state.template==="studio")r.innerHTML=`<div class="studio-block">${header}</div><div class="creative-grid"><div>${summary}${b.exp}${b.projects}</div><div>${b.edu}${b.skills}${b.languages}${b.cert}${b.achievements}${b.interests}</div></div>`;
 else r.innerHTML=`${header}${summary}${b.exp}${b.edu}${b.projects}${b.cert}${b.skills}${b.languages}${b.achievements}${b.interests}`;
 applyZoom();
}
function applyZoom(){const r=$("#resumePreview");r.style.transform=`scale(${zoom})`;$("#zoomLabel").textContent=Math.round(zoom*100)+"%";r.parentElement.style.minHeight=`${Math.max(297, r.scrollHeight/3.78)*zoom+70}px`}
function renderDynamic(){
 const groups={education:["Degree","Institution","Start Year","End Year","Description"],experience:["Job Title","Company","Location","Start Date","End Date","Description"],projects:["Project Name","Description","Technologies","Project URL"],certifications:["Certificate Name","Issuing Organization","Date"],skills:["Skill"],languages:["Language"],achievements:["Achievement"],interests:["Interest"]};
 const keys={education:["degree","institution","startYear","endYear","description"],experience:["jobTitle","company","location","startDate","endDate","description"],projects:["projectName","description","technologies","projectUrl"],certifications:["certificateName","issuingOrganization","date"],skills:["name"],languages:["name"],achievements:["name"],interests:["name"]};
 Object.entries(groups).forEach(([group,labels])=>{
   const box=$("#"+group+"List");box.innerHTML="";
   state[group].forEach((item,index)=>{
     const wrap=document.createElement("div");wrap.className="repeat-item";
     wrap.innerHTML=`<div class="repeat-head"><span>${group.slice(0,-1)} ${index+1}</span><button class="remove-btn" data-remove="${group}" data-index="${index}">Remove</button></div>`;
     labels.forEach((label,i)=>{const f=document.createElement("div");f.className="field";const key=keys[group][i];f.innerHTML=`<label>${label}</label>${label==="Description"?`<textarea data-group="${group}" data-index="${index}" data-field="${key}"></textarea>`:`<input data-group="${group}" data-index="${index}" data-field="${key}">`}`;const el=f.querySelector("input,textarea");el.value=item[key]||"";wrap.appendChild(f)});
     box.appendChild(wrap);
   });
 });
}
function fillStatic(){
 $$("[data-key]").forEach(i=>i.value=state[i.dataset.key]||"");
 $$("[data-style]").forEach(i=>{if(i.tagName==="SELECT"&&i.options.length===0){fonts.forEach(f=>i.add(new Option(f,f)))}const key=i.dataset.style;i.value=state.style[key]??"";});
 $$("[data-hex]").forEach(i=>i.value=state.style[i.dataset.style]||"");
}
function renderTemplateGrid(){const g=$("#templateGrid");g.innerHTML=templates.map(([id,name])=>`<button class="template-card ${state.template===id?"active":""}" data-template="${id}"><div class="template-thumb"></div><small>${name}</small></button>`).join("")}
function renderPresets(){$("#presetColors").innerHTML=presets.map(c=>`<button class="preset" style="background:${c}" data-preset="${c}" title="${c}"></button>`).join("")}

function syncAndRender(){renderResume();renderTemplateGrid();$("#homeResumeName").textContent=state.fullName||state.resumeName;$("#homeResumeTitle").textContent=state.resumeName||"Untitled resume";const time=state.updatedAt;$("#lastSaved").textContent=relativeTime(time);$("#builderTime").textContent=formatTime(time)}
function markDirty(){ $("#resumeStatus").textContent="Editing…"; clearTimeout(autoTimer); autoTimer=setTimeout(()=>saveResume(true),1500); syncAndRender(); localStorage.setItem("maison-resume-draft",JSON.stringify(state));}

async function saveResume(silent=false){
 if(!user){localStorage.setItem("maison-resume-draft",JSON.stringify(state));return}
 $("#resumeStatus").textContent="Saving…";
 const now=new Date(); if(!state.createdAt)state.createdAt=now;state.updatedAt=now;
 try{
   await setDoc(doc(db,"users",user.uid,"resumes","default"),{...state,userId:user.uid,createdAt:state.createdAt,updatedAt:serverTimestamp()},{merge:true});
   $("#resumeStatus").textContent="Saved ✓";localStorage.setItem("maison-resume-draft",JSON.stringify(state));syncAndRender();if(!silent)toast("Resume saved successfully");
 }catch(e){console.error(e);$("#resumeStatus").textContent="Saved locally";if(!silent)toast("Saved locally — check Firebase config")}
}
async function loadResume() {
  const local = localStorage.getItem("maison-resume-draft");

  if (local) {
    try {
      const savedData = JSON.parse(local);

      state = {
        ...clone(defaults),
        ...savedData,
        style: {
          ...defaults.style,
          ...(savedData.style || {})
        }
      };
    } catch (error) {
      console.warn("Local resume could not be loaded:", error);
    }
  }

  if (user && db) {
    try {
      const snap = await getDoc(
        doc(db, "users", user.uid, "resumes", "default")
      );

      if (snap.exists()) {
        const d = snap.data();

        state = {
          ...clone(defaults),
          ...d,
          style: {
            ...defaults.style,
            ...(d.style || {})
          },
          createdAt: d.createdAt || null,
          updatedAt: d.updatedAt || null
        };
      }
    } catch (error) {
      console.warn("Firebase resume could not be loaded:", error);
    }
  }

  fillStatic();
  renderDynamic();
  syncAndRender();
}


function switchAuthMode(mode){
 authMode=mode;const signup=mode==="signup";$("#authTitle").textContent=signup?"Create your account":"Welcome back";$("#authSubtitle").textContent=signup?"Start building a resume that feels like you.":"Your next opportunity starts with a better resume.";$("#nameField").classList.toggle("hidden",!signup);$("#confirmField").classList.toggle("hidden",!signup);$("#forgotBtn").classList.toggle("hidden",signup);$("#authSubmit").textContent=signup?"Create account":"Log in";$("#switchText").textContent=signup?"Already have an account?":"Don't have an account?";$("#switchAuth").textContent=signup?"Log in":"Sign up";
}

async function exportImage(){
 const old=$("#pngBtn").textContent;$("#pngBtn").textContent="Preparing…";
 try{const {default:html2canvas}=await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm");const canvas=await html2canvas($("#resumePreview"),{scale:3,useCORS:true,backgroundColor:state.style.backgroundColor,windowWidth:$("#resumePreview").scrollWidth,windowHeight:$("#resumePreview").scrollHeight});const a=document.createElement("a");a.download=(state.resumeName||"resume")+".png";a.href=canvas.toDataURL("image/png",1);a.click()}catch(e){console.error(e);toast("PNG export failed")}$("#pngBtn").textContent=old;
}
async function exportPDF(){
 const old=$("#pdfBtn").textContent;$("#pdfBtn").textContent="Preparing…";
 try{const [{default:html2canvas},{jsPDF}]=await Promise.all([import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm"),import("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm")]);const el=$("#resumePreview"),canvas=await html2canvas(el,{scale:3,useCORS:true,backgroundColor:state.style.backgroundColor,windowWidth:el.scrollWidth,windowHeight:el.scrollHeight});const pdf=new jsPDF({orientation:"p",unit:"mm",format:"a4",compress:true});const img=canvas.toDataURL("image/jpeg",.98),pageW=210,pageH=297,imgH=canvas.height*pageW/canvas.width;let heightLeft=imgH,position=0;pdf.addImage(img,"JPEG",0,position,pageW,imgH,undefined,"FAST");heightLeft-=pageH;while(heightLeft>0){position=heightLeft-imgH;pdf.addPage();pdf.addImage(img,"JPEG",0,position,pageW,imgH,undefined,"FAST");heightLeft-=pageH}pdf.save((state.resumeName||"resume")+".pdf");
 }catch(e){console.error(e);toast("PDF export failed")}$("#pdfBtn").textContent=old;
}

$("#authForm").addEventListener("submit",async e=>{
 e.preventDefault();const email=$("#authEmail").value.trim(),pass=$("#authPassword").value;
 try{
  if(authMode==="signup"){const name=$("#authName").value.trim(),confirm=$("#authConfirm").value;if(!name)throw new Error("Please enter your name");if(pass!==confirm)throw new Error("Passwords do not match");const c=await createUserWithEmailAndPassword(auth,email,pass);await updateProfile(c.user,{displayName:name})}
  else await signInWithEmailAndPassword(auth,email,pass);
 }catch(err){toast(err.message.replace("Firebase: ",""))}
});
$("#switchAuth").onclick=()=>switchAuthMode(authMode==="login"?"signup":"login");
$("#googleBtn").onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){toast(e.message)}};
$("#forgotBtn").onclick=async()=>{const email=$("#authEmail").value.trim();if(!email)return toast("Enter your email first");try{await sendPasswordResetEmail(auth,email);toast("Password reset email sent")}catch(e){toast(e.message)}};
$$(".password-toggle").forEach(b=>b.onclick=()=>{const i=$("#"+b.dataset.target);i.type=i.type==="password"?"text":"password";b.textContent=i.type==="password"?"Show":"Hide"});
$("#logoutBtn").onclick=()=>signOut(auth);
$("#newResumeBtn").onclick=()=>{show("#builderView");};
$("#editResumeBtn").onclick=()=>show("#builderView");
$("#backDashboardBtn").onclick=()=>{syncAndRender();show("#dashboardView")};
$("#saveBtn").onclick=()=>saveResume(false);
$("#pdfBtn").onclick=exportPDF;$("#pngBtn").onclick=exportImage;$("#homePdfBtn").onclick=exportPDF;$("#homePngBtn").onclick=exportImage;
$$(".tab").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$("#templateGrid").addEventListener("click",e=>{const b=e.target.closest("[data-template]");if(!b)return;state.template=b.dataset.template;markDirty()});
$("#presetColors").addEventListener("click",e=>{const b=e.target.closest("[data-preset]");if(!b)return;state.style.accentColor=b.dataset.preset;fillStatic();markDirty()});
document.addEventListener("input",e=>{
 const t=e.target;
 if(t.dataset.key){state[t.dataset.key]=t.value;markDirty()}
 if(t.dataset.group){state[t.dataset.group][+t.dataset.index][t.dataset.field]=t.value;markDirty()}
 if(t.dataset.style&&!t.dataset.hex){state.style[t.dataset.style]=t.type==="number"?Number(t.value):t.value;if(t.type==="color"){const h=$(`[data-style="${t.dataset.style}"][data-hex]`);if(h)h.value=t.value}markDirty()}
 if(t.dataset.hex){if(validHex(t.value)){state.style[t.dataset.style]=t.value;const picker=$(`input[type="color"][data-style="${t.dataset.style}"]`);if(picker)picker.value=t.value;markDirty()}}
});
document.addEventListener("change",e=>{const t=e.target;if(t.dataset.style&&t.tagName==="SELECT"){state.style[t.dataset.style]=t.value;markDirty()}});
document.addEventListener("click",e=>{
 const add=e.target.closest("[data-add]");if(add){state[add.dataset.add].push(add.dataset.add==="skills"||add.dataset.add==="languages"||add.dataset.add==="achievements"||add.dataset.add==="interests"?{name:""}:{});renderDynamic();markDirty()}
 const remove=e.target.closest("[data-remove]");if(remove){state[remove.dataset.remove].splice(+remove.dataset.index,1);renderDynamic();markDirty()}
});
$("#photoInput").onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{state.photo=reader.result;markDirty()};reader.readAsDataURL(file)};
$("#zoomIn").onclick=()=>{zoom=Math.min(1.2,zoom+.08);applyZoom()};$("#zoomOut").onclick=()=>{zoom=Math.max(.35,zoom-.08);applyZoom()};
renderTemplateGrid();renderPresets();fillStatic();renderDynamic();syncAndRender();

onAuthStateChanged(auth,async u=>{
 user=u;
 if(!u){show("#authView");return}
 await loadResume();
 const name=u.displayName||u.email?.split("@")[0]||"there";
 $("#userGreeting").textContent=`Hello, ${name}`;$("#dashHello").textContent=`Good day, ${name}`;show("#dashboardView");
});