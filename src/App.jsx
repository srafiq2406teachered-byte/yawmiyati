import { useState, useEffect } from "react";

// ── Google Fonts ──────────────────────────────────────────────────────────────
const FONT_LINK = document.createElement("link");
FONT_LINK.rel  = "stylesheet";
FONT_LINK.href = "https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:wght@400;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;600;700;800&family=Fredoka+One&display=swap";
document.head.appendChild(FONT_LINK);

// ── Hijri conversion ──────────────────────────────────────────────────────────
function toHijri(date) {
  const jd = Math.floor(date.getTime() / 86400000 + 2440587.5);
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day   = l - Math.floor((709 * month) / 24);
  const year  = 30 * n + j - 30;
  return { day, month, year };
}

const HM_EN = ["Muharram","Safar","Rabi al-Awwal","Rabi al-Thani","Jumada al-Ula","Jumada al-Akhirah","Rajab","Shaban","Ramadan","Shawwal","Dhu al-Qidah","Dhu al-Hijjah"];
const HM_AR = ["محرم","صفر","ربيع الأول","ربيع الآخر","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];

const DUAS = [
  { ar:"رَبِّ زِدْنِي عِلْمًا", en:"My Lord, increase me in knowledge.", src:"Quran 20:114" },
  { ar:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", en:"Our Lord, give us good in this world and the Hereafter.", src:"Quran 2:201" },
  { ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ", en:"O Allah, I ask You for pardon and well-being.", src:"Ibn Majah" },
  { ar:"حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", en:"Allah is sufficient for us, and He is the best Disposer of affairs.", src:"Quran 3:173" },
  { ar:"اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", en:"O Allah, help me remember You, be grateful, and worship You well.", src:"Abu Dawud" },
  { ar:"رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي", en:"My Lord, expand my breast and ease my task.", src:"Quran 20:25-26" },
  { ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ", en:"O Allah, I seek refuge in You from anxiety and grief.", src:"Bukhari" },
];

// ── Date helpers ──────────────────────────────────────────────────────────────
function dateStr(d) {
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function firstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

const TODAY     = new Date();
const TODAY_KEY = dateStr(TODAY);
const DOW       = TODAY.getDay();
const DOM       = TODAY.getDate();
const IS_FRI    = DOW === 5;
const IS_MON    = DOW === 1;
const IS_THU    = DOW === 4;
const IS_WHITE  = DOM >= 13 && DOM <= 15;
const IS_FAST   = IS_MON || IS_THU || IS_WHITE;
// HIJRI is fetched dynamically inside the component via Aladhan API
const HIJRI_FALLBACK = toHijri(TODAY);

const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const DAYS_LONG  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MON_SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DUA        = DUAS[TODAY_KEY.split("-").reduce((a,b) => a + parseInt(b,10), 0) % DUAS.length];

// ── Prayer definitions ────────────────────────────────────────────────────────
const PRAYERS = [
  { id:"fajr",     label:"Fajr",     ar:"الفجر",  icon:"🌙", rows:[
    { id:"fajr_sun",  label:"2 Sunnah", ar:"سنة قبلية", type:"S" },
    { id:"fajr_fard", label:"2 Fard",   ar:"فرض",        type:"F" },
  ]},
  { id:"duha",     label:"Duha",     ar:"الضحى",  icon:"🌅", rows:[
    { id:"duha_pray", label:"Duha", ar:"صلاة الضحى", type:"N", note:"2-12 rak'ahs after sunrise" },
  ]},
  { id:"dhuhr",    label:"Dhuhr",    ar:"الظهر",  icon:"☀️", rows:[
    { id:"dhuhr_sunB", label:"4 Sunnah", ar:"سنة قبلية", type:"S" },
    { id:"dhuhr_fard", label:"4 Fard",   ar:"فرض",        type:"F" },
    { id:"dhuhr_sunA", label:"2 Sunnah", ar:"سنة بعدية", type:"S" },
    { id:"dhuhr_nafl", label:"2 Nafl",   ar:"نافلة",      type:"N", optional:true },
  ]},
  { id:"asr",      label:"Asr",      ar:"العصر",  icon:"🌤️", rows:[
    { id:"asr_sun",  label:"4 Sunnah", ar:"سنة قبلية", type:"S", optional:true },
    { id:"asr_fard", label:"4 Fard",   ar:"فرض",        type:"F" },
  ]},
  { id:"maghrib",  label:"Maghrib",  ar:"المغرب", icon:"🌆", rows:[
    { id:"magh_fard", label:"3 Fard",   ar:"فرض",        type:"F" },
    { id:"magh_sunA", label:"2 Sunnah", ar:"سنة بعدية", type:"S" },
    { id:"magh_nafl", label:"2 Nafl",   ar:"نافلة",      type:"N", optional:true },
  ]},
  { id:"isha",     label:"Isha",     ar:"العشاء", icon:"🌃", rows:[
    { id:"isha_sunB", label:"4 Sunnah", ar:"سنة قبلية",  type:"S", optional:true },
    { id:"isha_fard", label:"4 Fard",   ar:"فرض",         type:"F" },
    { id:"isha_sunA", label:"2 Sunnah", ar:"سنة بعدية",  type:"S" },
    { id:"isha_nafl", label:"2 Nafl",   ar:"نافلة",       type:"N", optional:true },
    { id:"witr",      label:"3 Witr",   ar:"الوتر",         type:"W", note:"Do not sleep without Witr" },
    { id:"tarawih",   label:"Tarawih",  ar:"التراويح",   type:"S", ramadan:true, note:"After Isha in Ramadan" },
  ]},
  { id:"tahajjud", label:"Tahajjud", ar:"التهجد", icon:"⭐", rows:[
    { id:"tahajjud_pray", label:"Tahajjud", ar:"قيام الليل", type:"N", note:"Last third of the night" },
  ]},
];

// RAMADAN_TASKS is built dynamically in the component using live hijri state
const RAMADAN_TASKS_BASE = [
  { id:"ram_fast", section:"Ramadan", label:"Ramadan Fast", ar:"صوم رمضان", icon:"🌙" },
];

const OTHER_TASKS = [
  { id:"jumuah",   section:"Jumuah",  label:"Jumu'ah Prayer", ar:"صلاة الجمعة",    icon:"🕌", friday:true, note:"Replaces Dhuhr" },
  { id:"kahf",     section:"Jumuah",  label:"Surah Al-Kahf",  ar:"سورة الكهف",     icon:"📜", friday:true, note:"Light between two Fridays" },
  { id:"morn_adh", section:"Adhkar",  label:"Morning Adhkar", ar:"أذكار الصباح",   icon:"📿" },
  { id:"even_adh", section:"Adhkar",  label:"Evening Adhkar", ar:"أذكار المساء",   icon:"📿" },
  { id:"sleep_adh",section:"Adhkar",  label:"Sleep Adhkar",   ar:"أذكار النوم",    icon:"🌛" },
  { id:"quran",    section:"Quran",   label:"Quran Recitation",ar:"تلاوة القرآن",  icon:"📖" },
  { id:"sadaqah",  section:"Charity", label:"Daily Sadaqah",  ar:"الصدقة اليومية", icon:"🤲" },
  { id:"fasting",  section:"Fasting",
    label: IS_WHITE ? "Fast — White Day (" + DOM + "th)" : IS_MON ? "Fast — Monday" : "Fast — Thursday",
    ar:"الصيام", icon:"🌿", fast:true,
    note: IS_WHITE ? "Ayyam al-Bid (13-15th)" : "Sunnah fast" },
];

const TC = { F:"#16a34a", S:"#2563eb", N:"#7c3aed", W:"#b45309" };
const TL = { F:"Fard", S:"Sunnah", N:"Nafl", W:"Witr" };

const SEC_STYLE_L = {
  Ramadan: { bg:"#fff7ed", ac:"#ea580c", bd:"#fed7aa" },
  Jumuah:  { bg:"#eef2ff", ac:"#4f46e5", bd:"#c7d2fe" },
  Adhkar:  { bg:"#faf5ff", ac:"#7c3aed", bd:"#ddd6fe" },
  Quran:   { bg:"#fff7ed", ac:"#c2410c", bd:"#fed7aa" },
  Charity: { bg:"#ecfdf5", ac:"#059669", bd:"#a7f3d0" },
  Fasting: { bg:"#fefce8", ac:"#a16207", bd:"#fef08a" },
  Custom:  { bg:"#fdf4ff", ac:"#a21caf", bd:"#f0abfc" },
};
const SEC_STYLE_D = {
  Ramadan: { bg:"#2a1200", ac:"#fb923c", bd:"#7c2d12" },
  Jumuah:  { bg:"#13133a", ac:"#818cf8", bd:"#312e81" },
  Adhkar:  { bg:"#180d2e", ac:"#a78bfa", bd:"#3b0764" },
  Quran:   { bg:"#2a1000", ac:"#f97316", bd:"#7c2d12" },
  Charity: { bg:"#042015", ac:"#34d399", bd:"#064e3b" },
  Fasting: { bg:"#201800", ac:"#fbbf24", bd:"#78350f" },
  Custom:  { bg:"#1a0828", ac:"#e879f9", bd:"#581c87" },
};

// ── Themes ────────────────────────────────────────────────────────────────────
const TH = {
  light: {
    bg:"#fdf8f0", card:"#ffffff", alt:"#fef6e8",
    border:"#e8d5b0", borderL:"#f5ead0",
    text:"#2d1f0e", sub:"#8b6f47", muted:"#c4a882",
    gold:"#c27c2a",
    salahBg:"#f0fdf4", salahAc:"#16a34a", salahBd:"#bbf7d0",
    ramBg:"#fff7ed", ramBanner:"#fff3e0",
  },
  dark: {
    bg:"#0e0e10", card:"#18181b", alt:"#1f1f23",
    border:"#2d2d32", borderL:"#252528",
    text:"#f0e6d3", sub:"#a08060", muted:"#604830",
    gold:"#c8a96e",
    salahBg:"#0a1f0a", salahAc:"#ffffff", salahBd:"#14532d",
    ramBg:"#1a0a00", ramBanner:"#2a1200",
  },
};

// ── Mode colour schemes ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const MODE_META = {
  classic: {
    label:"Classic", icon:"☪️",
    bismillahBg: (gold) => gold + "18",
    headerGradient: "none",
    headerBg: (T) => T.card,
    headerBorder: (T) => T.border,
    titleAr: "يَوْم",
    titleEn: "Yawm",
    subtitle: "My Daily Deeds",
    titleColor: (T) => T.gold,
  },
  gamified: {
    label:"Journey", icon:"⭐",
    bismillahBg: () => "#0d2a1a",
    headerGradient: "linear-gradient(135deg,#0d4a2a,#1a6b3a)",
    headerBg: () => "#0d4a2a",
    headerBorder: () => "#1a6b3a",
    titleAr: "يَوْم",
    titleEn: "Yawm",
    subtitle: "My Daily Journey",
    titleColor: () => "#ffffff",
  },
};

// ── Kids themes ──────────────────────────────────────────────────────────────
const KIDS_THEME = {
  little: { // Under 7 — very bright, big, playful
    bg:"#fffbea", card:"#ffffff", alt:"#fff8d6",
    border:"#fcd34d", borderL:"#fde68a",
    text:"#92400e", sub:"#b45309", muted:"#d97706",
    gold:"#f59e0b", accent:"#ec4899",
    salahBg:"#fdf2f8", salahAc:"#db2777", salahBd:"#fbcfe8",
    headerBg:"linear-gradient(135deg,#f59e0b,#ec4899)",
    fontSize:18, iconSize:30, rowPad:"15px 16px",
  },
  older: { // 7-12 — sky blue and teal, fresh and clear
    bg:"#f0f9ff", card:"#ffffff", alt:"#e0f2fe",
    border:"#7dd3fc", borderL:"#bae6fd",
    text:"#0c4a6e", sub:"#0369a1", muted:"#38bdf8",
    gold:"#0284c7", accent:"#06b6d4",
    salahBg:"#ecfdf5", salahAc:"#059669", salahBd:"#6ee7b7",
    headerBg:"linear-gradient(135deg,#0284c7,#06b6d4)",
    fontSize:15, iconSize:24, rowPad:"12px 16px",
  },
};

// Kids prayer rows
// eslint-disable-next-line no-unused-vars
const KIDS_PRAYERS = [
  { id:"kp_fajr",    label:"Fajr",    ar:"الفجر",  icon:"🌙", color:"#7c3aed", rows:[
    { id:"kp_fajr_sun",   label:"2 Sunnah", ar:"سنة",  type:"S", pts:5 },
    { id:"kp_fajr_fard",  label:"2 Fard",   ar:"فرض",  type:"F", pts:10 },
  ]},
  { id:"kp_dhuhr",   label:"Dhuhr",   ar:"الظهر",  icon:"☀️", color:"#b45309", rows:[
    { id:"kp_dhuhr_sunB", label:"4 Sunnah", ar:"سنة قبل",  type:"S", pts:4 },
    { id:"kp_dhuhr_fard", label:"4 Fard",   ar:"فرض",  type:"F", pts:10 },
    { id:"kp_dhuhr_sunA", label:"2 Sunnah", ar:"سنة بعد",  type:"S", pts:4 },
  ]},
  { id:"kp_asr",     label:"Asr",     ar:"العصر",  icon:"🌤️", color:"#0369a1", rows:[
    { id:"kp_asr_fard",   label:"4 Fard",   ar:"فرض",  type:"F", pts:10 },
  ]},
  { id:"kp_maghrib", label:"Maghrib", ar:"المغرب", icon:"🌆", color:"#dc2626", rows:[
    { id:"kp_magh_fard",  label:"3 Fard",   ar:"فرض",  type:"F", pts:10 },
    { id:"kp_magh_sunA",  label:"2 Sunnah", ar:"سنة",  type:"S", pts:4 },
  ]},
  { id:"kp_isha",    label:"Isha",    ar:"العشاء", icon:"🌃", color:"#0f766e", rows:[
    { id:"kp_isha_fard",  label:"4 Fard",   ar:"فرض",  type:"F", pts:10 },
    { id:"kp_isha_sunA",  label:"2 Sunnah", ar:"سنة",  type:"S", pts:4 },
    { id:"kp_witr",       label:"3 Witr",   ar:"الوتر",  type:"W", pts:8, note:"Do not sleep without Witr" },
  ]},
];

// Kids deeds (non-prayer)
const ALL_KIDS_TASKS = [
  { id:"k_quran",    label:"Read Quran",    ar:"قرآن",         emoji:"📖", points:8, cat:"quran" },
  { id:"k_adkhar",   label:"Say Adhkar",    ar:"الأذكار",      emoji:"📿", points:5, cat:"dhikr" },
  { id:"k_dua",      label:"Make Dua",      ar:"الدعاء",        emoji:"🤲", points:5, cat:"dhikr" },
  { id:"k_sadaqah",  label:"Give Sadaqah",  ar:"الصدقة",      emoji:"🤝", points:8, cat:"good" },
  { id:"k_kind",     label:"Be Kind",       ar:"اللطف",        emoji:"💛", points:5, cat:"good" },
  { id:"k_parents",  label:"Help Parents",  ar:"بر الوالدين", emoji:"👪", points:8, cat:"good" },
  { id:"k_bismillah",label:"Say Bismillah", ar:"بسم الله",   emoji:"💬", points:3, cat:"dhikr" },
];

const BADGE_LEVELS = [
  { min:0,   label:"Beginner",   icon:"🌱", color:"#66bb6a" },
  { min:50,  label:"Good",       icon:"⭐",     color:"#ffa726" },
  { min:100, label:"Dedicated",  icon:"🏅", color:"#ab47bc" },
  { min:200, label:"Champion",   icon:"🥇", color:"#ef5350" },
  { min:500, label:"Star",       icon:"🌟", color:"#ff9800" },
  { min:1000,label:"Legend",     icon:"👑", color:"#c27c2a" },
];

function getBadge(pts) {
  let b = BADGE_LEVELS[0];
  for (let i = 0; i < BADGE_LEVELS.length; i++) {
    if (pts >= BADGE_LEVELS[i].min) b = BADGE_LEVELS[i];
  }
  return b;
}

// ── Adult gamified — deed points ──────────────────────────────────────────────
const DEED_POINTS = {
  fajr_sun:5, fajr_fard:15,
  duha_pray:8,
  dhuhr_sunB:4, dhuhr_fard:10, dhuhr_sunA:4, dhuhr_nafl:3,
  asr_sun:4, asr_fard:10,
  magh_fard:10, magh_sunA:4, magh_nafl:3,
  isha_sunB:4, isha_fard:10, isha_sunA:4, isha_nafl:3, witr:8,
  tahajjud_pray:12,
  adhkar_morning:6, adhkar_evening:6, adhkar_sleep:4,
  quran_recite:10,
  jumuah_prayer:10, jumuah_kahf:8,
  sadaqah_daily:8,
  fast_today:10,
  ramadan_fast:12,
};

// ── Adult gamified — achievement badges ───────────────────────────────────────
const ACHIEVEMENTS = [
  { id:"fajr_warrior",   label:"Fajr Warrior",      icon:"🌙", color:"#1e3a5f", desc:"Complete Fajr fard 40 days in a row", check:(hist) => {
    let streak = 0; let d = new Date(TODAY);
    for (let i=0;i<365;i++) { const h=hist[dateStr(d)]||{}; if(h["fajr_fard"]) streak++; else break; d=addDays(d,-1); }
    return streak >= 40;
  }},
  { id:"night_warrior",  label:"Night Warrior",      icon:"⭐",     color:"#2d1b69", desc:"Pray Tahajjud 20 days", check:(hist) => Object.values(hist).filter(h=>h["tahajjud_pray"]).length >= 20 },
  { id:"duha_devotee",   label:"Duha Devotee",       icon:"🌅", color:"#78350f", desc:"Pray Duha 30 days",     check:(hist) => Object.values(hist).filter(h=>h["duha_pray"]).length >= 30 },
  { id:"quran_keeper",   label:"Quran Keeper",        icon:"📖", color:"#14532d", desc:"Read Quran 30 days",    check:(hist) => Object.values(hist).filter(h=>h["quran_recite"]).length >= 30 },
  { id:"generous_soul",  label:"Generous Soul",       icon:"🤝", color:"#064e3b", desc:"Give Sadaqah 30 days",  check:(hist) => Object.values(hist).filter(h=>h["sadaqah_daily"]).length >= 30 },
  { id:"iron_will_7",    label:"Iron Will I",         icon:"🔥", color:"#7c2d12", desc:"7-day full streak",     check:(_,streak) => streak >= 7 },
  { id:"iron_will_30",   label:"Iron Will II",        icon:"🏅", color:"#991b1b", desc:"30-day full streak",    check:(_,streak) => streak >= 30 },
  { id:"iron_will_100",  label:"Iron Will III",       icon:"👑", color:"#7f1d1d", desc:"100-day full streak",   check:(_,streak) => streak >= 100 },
  { id:"sunnah_faster",  label:"Sunnah Faster",       icon:"🌿", color:"#14532d", desc:"Fast Mon/Thu 10 times", check:(hist) => Object.values(hist).filter(h=>h["fast_today"]).length >= 10 },
  { id:"witr_guardian",  label:"Witr Guardian",       icon:"🌍", color:"#1e1b4b", desc:"Never miss Witr for 30 days", check:(hist) => {
    let streak=0; let d=new Date(TODAY);
    for(let i=0;i<365;i++){const h=hist[dateStr(d)]||{};if(h["witr"])streak++;else break;d=addDays(d,-1);}
    return streak>=30;
  }},
];

// ── Quran unlocks at point milestones ─────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const QURAN_UNLOCKS = [
  { pts:100,  label:"Ayat al-Kursi",   ar:"آية الكرسي",
    text:"اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ♥ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ", src:"Quran 2:255" },
  { pts:300,  label:"Al-Ikhlas",       ar:"سورة الإخلاص",
    text:"قُلْ هُوَ اللَّهُ أَحَدٌ ♥ اللَّهُ الصَّمَدُ ♥ لَمْ يَلِدْ وَلَمْ يُولَدْ ♥ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", src:"Quran 112" },
  { pts:500,  label:"Al-Falaq & An-Nas", ar:"المعوذتين",
    text:"قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ♥ مِن شَرِّ مَا خَلَقَ ♥ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", src:"Quran 113-114" },
  { pts:1000, label:"Al-Mulk (opening)", ar:"سورة المُلك",
    text:"تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلىٰ كُلِّ شَيْءٍ قَدِيرٌ ♥ الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا", src:"Quran 67:1-2" },
];

// ── Gamified adult theme ───────────────────────────────────────────────────────
const GAMIFIED_THEME = {
  bg:"#f5f3ff", card:"#ffffff", alt:"#ede9fe",
  border:"#c4b5fd", borderL:"#ddd6fe",
  text:"#1e1b4b", sub:"#4338ca", muted:"#a5b4fc",
  gold:"#6366f1", accent:"#8b5cf6",
  salahBg:"#eef2ff", salahAc:"#4f46e5", salahBd:"#c7d2fe",
  headerBg:"linear-gradient(135deg,#4f46e5,#7c3aed)",
};

// ── Animated Checkbox ─────────────────────────────────────────────────────────
function Checkbox({ checked, color, size }) {
  const sz = size || 20;
  return (
    <div style={{
      width:sz, height:sz, borderRadius:Math.round(sz*0.28),
      border:"2px solid " + (checked ? color : "#c4a882"),
      background: checked ? color : "transparent",
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:0,
      transition:"background 0.18s ease, border-color 0.18s ease, transform 0.12s ease",
      transform: checked ? "scale(1.08)" : "scale(1)",
    }}>
      {checked && (
        <svg width={sz*0.55} height={sz*0.55} viewBox="0 0 12 10" fill="none">
          <polyline points="1,5 4.5,8.5 11,1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray:20, strokeDashoffset:0, transition:"stroke-dashoffset 0.2s ease" }} />
        </svg>
      )}
    </div>
  );
}

// ── Storage helpers ───────────────────────────────────────────────────────────
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── All task IDs for a given day ──────────────────────────────────────────────
function getDayIds(isRamadan, isFriday, isFast, customs) {
  const ids = [];
  PRAYERS.forEach(p => p.rows.forEach(r => ids.push(r.id)));
  if (isRamadan) RAMADAN_TASKS_BASE.forEach(t => ids.push(t.id));
  OTHER_TASKS.forEach(t => {
    if (t.friday && !isFriday) return;
    if (t.fast && !isFast) return;
    ids.push(t.id);
  });
  customs.forEach(c => ids.push(c.id));
  return ids;
}

const FARD_IDS = [];
PRAYERS.forEach(p => p.rows.filter(r => r.type === "F").forEach(r => FARD_IDS.push(r.id)));

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme]     = useState(() => load("yawm_theme", "light"));
  const [tab, setTab]         = useState("today");
  const [customs, setCustoms] = useState(() => load("yawm_custom", []));
  // Mode declared early so hist/notes can use it
  const [mode, setMode]       = useState(() => load("yawm_mode", "classic"));
  const kidsMode = mode === "kids";
  const [classicHist, setClassicHist] = useState(() => {
    const existing = load("yawm_hist_classic", null);
    if (existing) return existing;
    // Migrate from old shared history on first load
    return load("yawm_hist", {});
  });
  const [journeyHist, setJourneyHist] = useState(() => {
    const existing = load("yawm_hist_journey", null);
    if (existing) return existing;
    return load("yawm_hist", {});
  });
  // Active history based on mode
  const hist    = mode === "gamified" ? journeyHist : classicHist;
  const setHist = mode === "gamified" ? setJourneyHist : setClassicHist;
  const [classicNotes, setClassicNotes] = useState(() => load("yawm_notes_classic", {}));
  const [journeyNotes, setJourneyNotes] = useState(() => load("yawm_notes_journey", {}));
  const notes    = mode === "gamified" ? journeyNotes : classicNotes;
  const setNotes = mode === "gamified" ? setJourneyNotes : setClassicNotes;
  const [noteOpen, setNoteOpen] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [adding, setAdding]   = useState(false);
  const [newLbl, setNewLbl]   = useState("");
  const [newIco, setNewIco]   = useState("✨");
  const [calMonth, setCalMonth] = useState(TODAY.getMonth());
  const [calYear, setCalYear]   = useState(TODAY.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [hijri, setHijri]           = useState(HIJRI_FALLBACK);
  const [hijriEdit, setHijriEdit]   = useState(false);
  const [hijriDraft, setHijriDraft] = useState({ day:"", month:"", year:"" });


  const [kidsAge, setKidsAge]           = useState(() => load("yawm_kids_age", "older"));
  const [kidsParent, setKidsParent]     = useState(false);
  const [kidsPin, setKidsPin]           = useState(() => load("yawm_kids_pin", "1234"));
  const [kidsPinDraft, setKidsPinDraft] = useState("");
  const [kidsPinError, setKidsPinError] = useState(false);
  const [kidsEnabledTasks, setKidsEnabledTasks] = useState(() => load("yawm_kids_tasks", ALL_KIDS_TASKS.map(t => t.id)));
  const [adultPoints, setAdultPoints] = useState(() => load("yawm_adult_pts", {}));
  const [kidsPoints, setKidsPoints]     = useState(() => load("yawm_kids_pts", {}));
  const [kidsChecked, setKidsChecked]   = useState(() => load("yawm_kids_" + TODAY_KEY, {}));
  const [confetti, setConfetti]         = useState(false);
  const [kidsTab, setKidsTab]           = useState("deeds");

  const T  = mode === "gamified" ? GAMIFIED_THEME : TH[theme];
  const SS = theme === "light" ? SEC_STYLE_L : SEC_STYLE_D;
  const KT = KIDS_THEME[kidsAge];
  const GOLD = T.gold;
  const IS_RAMADAN = hijri.month === 9;

  // Prayer times state
  const [prayerTimes, setPrayerTimes]   = useState(null);
  const [prayerError, setPrayerError]   = useState(null);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [calcMethod, setCalcMethod]     = useState(() => load("yawm_calc", 3));   // 3=MWL default
  const [madhab, setMadhab]             = useState(() => load("yawm_madhab", 1)); // 1=Shafi, 0=Hanafi
  const [locationName, setLocationName] = useState(null);
  const [now, setNow]                   = useState(new Date());

  useEffect(() => { save("yawm_theme", theme); }, [theme]);
  useEffect(() => { save("yawm_mode", mode); }, [mode]);
  useEffect(() => { save("yawm_adult_pts", adultPoints); }, [adultPoints]);
  useEffect(() => { save("yawm_kids_age", kidsAge); }, [kidsAge]);
  useEffect(() => { save("yawm_kids_pin", kidsPin); }, [kidsPin]);
  useEffect(() => { save("yawm_kids_tasks", kidsEnabledTasks); }, [kidsEnabledTasks]);
  useEffect(() => { save("yawm_kids_pts", kidsPoints); }, [kidsPoints]);
  useEffect(() => { save("yawm_kids_" + TODAY_KEY, kidsChecked); }, [kidsChecked]);
  useEffect(() => { save("yawm_calc", calcMethod); }, [calcMethod]);
  useEffect(() => { save("yawm_madhab", madhab); }, [madhab]);

  // Live clock — updates every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch accurate Hijri date from Aladhan API using user location
  useEffect(() => {
    function fetchHijri(lat, lng) {
      const dateParam = String(DOM).padStart(2,"0") + "-" + String(TODAY.getMonth()+1).padStart(2,"0") + "-" + TODAY.getFullYear();
      const url = "https://api.aladhan.com/v1/gToH?date=" + dateParam + (lat ? "&latitude=" + lat + "&longitude=" + lng : "");
      fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.data && data.data.hijri) {
            const h = data.data.hijri;
            setHijri({ day: parseInt(h.day, 10), month: parseInt(h.month.number, 10), year: parseInt(h.year, 10), monthAr: h.month.ar, monthEn: h.month.en });
          }
        })
        .catch(function() {});
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(pos) { fetchHijri(pos.coords.latitude, pos.coords.longitude); },
        function()    { fetchHijri(null, null); }
      );
    } else {
      fetchHijri(null, null);
    }
  }, []);

  // Fetch prayer times from Aladhan
  useEffect(() => {
    setPrayerLoading(true);
    setPrayerError(null);
    function fetchTimes(lat, lng) {
      const d = String(DOM).padStart(2,"0") + "-" + String(TODAY.getMonth()+1).padStart(2,"0") + "-" + TODAY.getFullYear();
      const base = "https://api.aladhan.com/v1/timings/" + d;
      const url  = lat
        ? base + "?latitude=" + lat + "&longitude=" + lng + "&method=" + calcMethod + "&school=" + madhab
        : base + "?address=Mecca&method=" + calcMethod + "&school=" + madhab;
      fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.data && data.data.timings) {
            setPrayerTimes(data.data.timings);
            if (data.data.meta) {
              const m = data.data.meta;
              setLocationName((m.timezone || "").replace("_"," "));
            }
          } else {
            setPrayerError("Could not load prayer times.");
          }
          setPrayerLoading(false);
        })
        .catch(function() {
          setPrayerError("Network error. Check connection.");
          setPrayerLoading(false);
        });
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(pos) { fetchTimes(pos.coords.latitude, pos.coords.longitude); },
        function()    { fetchTimes(null, null); }
      );
    } else {
      fetchTimes(null, null);
    }
  }, [calcMethod, madhab]);

  const todayChecked = hist[TODAY_KEY] || {};

  function toggle(id) {
    const next = { ...todayChecked, [id]: !todayChecked[id] };
    const h2   = { ...hist, [TODAY_KEY]: next };
    setHist(h2);
    save("yawm_hist", h2);
    // Save daily points for Journey mode
    if (mode === "gamified") {
      const dayPts = Object.keys(next).filter(k=>next[k]&&DEED_POINTS[k]).reduce((s,k)=>s+(DEED_POINTS[k]||0),0);
      const newPts = { ...adultPoints, [TODAY_KEY]: dayPts };
      setAdultPoints(newPts);
      save("yawm_adult_pts", newPts);
    }
  }

  function saveCustoms(arr) { setCustoms(arr); save("yawm_custom", arr); }
  function addCustom() {
    if (!newLbl.trim()) return;
    saveCustoms([...customs, { id:"c_" + Date.now(), label:newLbl.trim(), icon:newIco }]);
    setNewLbl(""); setNewIco("✨"); setAdding(false);
  }

  function saveNote(taskId, text) {
    const n2 = { ...notes, [TODAY_KEY + "_" + taskId]: text };
    setNotes(n2); save("yawm_notes", n2);
  }

  const allIds = getDayIds(IS_RAMADAN, IS_FRI, IS_FAST, customs);
  const total  = allIds.length;
  const done   = allIds.filter(id => todayChecked[id]).length;
  const pct    = total ? Math.round((done / total) * 100) : 0;

  const streak = (() => {
    let s = 0, d = new Date(TODAY);
    for (let i = 0; i < 365; i++) {
      const k = dateStr(d);
      const h = hist[k] || {};
      if (FARD_IDS.filter(id => h[id]).length < FARD_IDS.length) break;
      s++; d = addDays(d, -1);
    }
    return s;
  })();

  const otherVisible = OTHER_TASKS.filter(t => {
    if (t.friday && !IS_FRI) return false;
    if (t.fast && !IS_FAST)  return false;
    return true;
  });
  const otherBySection = {};
  otherVisible.forEach(t => {
    if (!otherBySection[t.section]) otherBySection[t.section] = [];
    otherBySection[t.section].push(t);
  });

  const circ = 2 * Math.PI * 32;

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const calDays   = daysInMonth(calYear, calMonth);
  const calOffset = firstDayOfMonth(calYear, calMonth);
  function calDayPct(day) {
    const k = calYear + "-" + String(calMonth+1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
    const h = k === TODAY_KEY ? todayChecked : (hist[k] || {});
    return FARD_IDS.length ? Math.round((FARD_IDS.filter(id => h[id]).length / FARD_IDS.length) * 100) : 0;
  }
  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  }
  function nextMonth() {
    if (calMonth === TODAY.getMonth() && calYear === TODAY.getFullYear()) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  }
  const isCurrentMonth = calMonth === TODAY.getMonth() && calYear === TODAY.getFullYear();

  // ── Note modal ────────────────────────────────────────────────────────────
  function openNote(id) {
    setNoteOpen(id);
    setNoteDraft(notes[TODAY_KEY + "_" + id] || "");
  }
  function closeNote() {
    if (noteOpen) saveNote(noteOpen, noteDraft);
    setNoteOpen(null);
  }

  // ── CSS ───────────────────────────────────────────────────────────────────
  const css = `
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background:${T.bg}; }
    .row-btn:hover { opacity:0.85; }
    .tab-btn:hover { opacity:0.7; }
    input,textarea { outline:none; font-family:'Lora','Georgia',serif; }
    .mode-classic { font-size: 15px; }
    .mode-gamified { font-size: 14px; font-family: 'Nunito', sans-serif; }
    .mode-kids { font-family: 'Fredoka One', 'Nunito', sans-serif; }
    input::placeholder,textarea::placeholder { color:${T.muted}; }
    ::-webkit-scrollbar { width:3px; }
    ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:2px; }
    @keyframes popIn { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1.08);opacity:1} }
    .check-pop { animation: popIn 0.22s ease forwards; }
  `;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={"mode-" + mode} style={{ minHeight:"100vh", background:
        kidsMode ? KT.bg :
        mode === "gamified" ? (theme === "dark" ? "#0f0e1a" : "#f5f3ff") :
        T.bg,
      fontFamily: mode === "gamified" ? "'Nunito','Lora',sans-serif" : kidsMode ? "'Fredoka One','Nunito',sans-serif" : "'Lora','Georgia',serif",
      color:T.text }}>
      <style>{css}</style>

      {/* Note modal */}
      {noteOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.card, borderRadius:16, padding:18, width:"100%", maxWidth:380, border:"1px solid " + T.border }}>
            <div style={{ fontSize:12, color:T.sub, fontFamily:"sans-serif", marginBottom:8, letterSpacing:1 }}>Note for deed</div>
            <textarea
              value={noteDraft}
              onChange={e => setNoteDraft(e.target.value)}
              rows={4}
              placeholder="Add a note or reflection..."
              style={{ width:"100%", padding:"10px", border:"1px solid " + T.border, borderRadius:8, background:T.alt, color:T.text, fontSize:13, resize:"vertical" }}
            />
            <div style={{ display:"flex", gap:8, marginTop:10 }}>
              <button onClick={closeNote} style={{ flex:2, padding:"8px", background:GOLD, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>Save</button>
              <button onClick={() => { setNoteDraft(""); }} style={{ flex:1, padding:"8px", background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:8, color:"#dc2626", cursor:"pointer", fontSize:13 }}>🗑️ Delete</button>
              <button onClick={() => setNoteOpen(null)} style={{ flex:1, padding:"8px", background:T.alt, border:"1px solid " + T.border, borderRadius:8, color:T.sub, cursor:"pointer", fontSize:13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Day detail modal */}
      {selectedDay && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
          onClick={() => setSelectedDay(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background:T.card, borderRadius:"20px 20px 0 0", padding:"20px 16px 32px", width:"100%", maxWidth:480, border:"1px solid " + T.border, maxHeight:"70vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:T.text, fontFamily:"'Lora',serif" }}>
                  {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" })}
                </div>
                <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", marginTop:2 }}>
                  {(() => { const h = selectedDay === TODAY_KEY ? todayChecked : (hist[selectedDay] || {}); const dp = FARD_IDS.length ? Math.round((FARD_IDS.filter(id => h[id]).length / FARD_IDS.length) * 100) : 0; return dp + "% of fard prayers completed"; })()}
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:20, padding:"4px 8px" }}>✕</button>
            </div>
            {/* Show all prayer rows for that day */}
            {PRAYERS.map(function(prayer) {
              const dayH = selectedDay === TODAY_KEY ? todayChecked : (hist[selectedDay] || {});
              const rows = prayer.rows.filter(function(r) { return !r.ramadan; });
              const pDone = rows.filter(r => dayH[r.id]).length;
              return (
                <div key={prayer.id} style={{ marginBottom:8, borderRadius:10, border:"1px solid " + T.salahBd, overflow:"hidden", background:T.salahBg }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 12px", borderBottom:"1px solid " + T.salahBd }}>
                    <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{prayer.icon} {prayer.label}</span>
                    <span style={{ fontSize:10, fontFamily:"sans-serif", color:T.salahAc, fontWeight:700 }}>{pDone}/{rows.length}</span>
                  </div>
                  <div style={{ padding:"4px 0" }}>
                    {rows.map(function(row) {
                      const chk = !!dayH[row.id];
                      const col = TC[row.type];
                      return (
                        <div key={row.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 12px", opacity: chk ? 1 : 0.4 }}>
                          <span style={{ fontSize:9, padding:"1px 5px", borderRadius:5, fontFamily:"sans-serif", fontWeight:700, background:col + "20", color:col, border:"1px solid " + col + "44" }}>{TL[row.type]}</span>
                          <span style={{ fontSize:12, color: chk ? T.text : T.muted, textDecoration: chk ? "none" : "line-through", flex:1 }}>{row.label}</span>
                          <span style={{ fontSize:12 }}>{chk ? "✅" : "⬜"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bismillah */}
      {!kidsMode && (
        <div style={{ textAlign:"center", padding:"11px 16px",
          background: mode === "gamified" ? "#4f46e5" : IS_RAMADAN ? T.ramBanner : T.alt,
          borderBottom:"1px solid " + (mode === "gamified" ? "#4338ca" : GOLD + "44"),
          fontSize:18, letterSpacing:2, fontFamily:"'Amiri Quran','Amiri',serif",
          color: mode === "gamified" ? "#ffffff" : GOLD }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      )}

      {/* Ramadan banner */}
      {IS_RAMADAN && !kidsMode && (
        <div style={{ textAlign:"center", padding:"8px 16px", background:"linear-gradient(135deg,#ea580c22,#f59e0b22)", borderBottom:"1px solid #ea580c33", fontFamily:"sans-serif", fontSize:12, color:"#ea580c" }}>
          🌙 Ramadan Mubarak — Day {hijri.day} · Night {hijri.day + 1 <= 30 ? hijri.day + 1 : "—"}
        </div>
      )}

      <div style={{ maxWidth:480, margin:"0 auto", paddingBottom:56 }}>

        {/* ── Mode switcher ── */}
        <div style={{ display:"flex", gap:0, margin:"10px 14px 0", borderRadius:14, overflow:"hidden", border:"1px solid " + (kidsMode ? KT.border : mode === "gamified" ? "#6366f1" : T.border) }}>
          {[
            { key:"classic",  label:"Classic",  icon:"☪️" },
            { key:"gamified", label:"Journey",  icon:"⭐" },
            { key:"kids",     label:"Kids",     icon:"🌱" },
          ].map(function(m) {
            const active = mode === m.key;
            const bg = active
              ? m.key === "classic"  ? GOLD
              : m.key === "gamified" ? "#6366f1"
              : KT.gold
              : T.alt;
            return (
              <button key={m.key} onClick={() => setMode(m.key)} style={{
                flex:1, padding:"9px 4px", border:"none", cursor:"pointer",
                background: bg,
                color: active ? "#fff" : T.muted,
                fontFamily:"sans-serif", fontSize:11, fontWeight: active ? 700 : 400,
                transition:"all 0.2s",
                borderRight: m.key !== "kids" ? "1px solid " + T.border : "none",
              }}>
                {m.icon} {m.label}
              </button>
            );
          })}
        </div>

        {/* Top bar — hidden in kids mode */}
        {!kidsMode && <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"12px 16px 0" }}>
          <div>
            {!hijriEdit ? (
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ fontSize:16, color:GOLD, fontFamily:"'Amiri',serif", lineHeight:"1.4" }}>
                    {hijri.day} {HM_AR[hijri.month-1]} {hijri.year} هـ
                  </div>
                  <button onClick={() => { setHijriDraft({ day:String(hijri.day), month:String(hijri.month), year:String(hijri.year) }); setHijriEdit(true); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:T.muted, padding:"0 2px" }} title="Adjust Hijri date">✏️</button>
                </div>
                <div style={{ fontSize:9, color:T.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"sans-serif" }}>
                  {hijri.day} {HM_EN[hijri.month-1]} {hijri.year} AH
                </div>
                <div style={{ fontSize:11, color:T.sub, fontFamily:"sans-serif" }}>
                  {DAYS_LONG[DOW]}, {MON_SHORT[TODAY.getMonth()]} {DOM} {TODAY.getFullYear()}
                </div>
              </div>
            ) : (
              <div style={{ background:T.card, border:"1px solid " + T.border, borderRadius:12, padding:"10px 12px", minWidth:220 }}>
                <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", letterSpacing:1, marginBottom:8 }}>ADJUST HIJRI DATE</div>
                <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif", marginBottom:3 }}>Day</div>
                    <input type="number" min="1" max="30" value={hijriDraft.day} onChange={e => setHijriDraft(function(p){ return {...p, day:e.target.value}; })}
                      style={{ width:44, padding:"5px 4px", border:"1px solid " + T.border, borderRadius:6, background:T.alt, color:T.text, fontSize:13, textAlign:"center" }} />
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif", marginBottom:3 }}>Month</div>
                    <input type="number" min="1" max="12" value={hijriDraft.month} onChange={e => setHijriDraft(function(p){ return {...p, month:e.target.value}; })}
                      style={{ width:44, padding:"5px 4px", border:"1px solid " + T.border, borderRadius:6, background:T.alt, color:T.text, fontSize:13, textAlign:"center" }} />
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif", marginBottom:3 }}>Year</div>
                    <input type="number" min="1400" max="1500" value={hijriDraft.year} onChange={e => setHijriDraft(function(p){ return {...p, year:e.target.value}; })}
                      style={{ width:56, padding:"5px 4px", border:"1px solid " + T.border, borderRadius:6, background:T.alt, color:T.text, fontSize:13, textAlign:"center" }} />
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={() => {
                    const d = parseInt(hijriDraft.day,10), m = parseInt(hijriDraft.month,10), y = parseInt(hijriDraft.year,10);
                    if (d>=1&&d<=30&&m>=1&&m<=12&&y>=1400) {
                      setHijri({ day:d, month:m, year:y });
                      setHijriEdit(false);
                    }
                  }} style={{ flex:1, padding:"6px", background:GOLD, border:"none", borderRadius:6, color:"#fff", cursor:"pointer", fontSize:12, fontWeight:600 }}>Save ✓</button>
                  <button onClick={() => setHijriEdit(false)} style={{ flex:1, padding:"6px", background:T.alt, border:"1px solid " + T.border, borderRadius:6, color:T.sub, cursor:"pointer", fontSize:12 }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:5 }}>
            {mode !== "kids" && (
              <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} style={{ background:"transparent", border:"1px solid " + T.border, borderRadius:20, padding:"5px 10px", cursor:"pointer", fontSize:13, color:T.sub, fontFamily:"sans-serif" }}>
                {theme === "light" ? "🌙" : "☀️"}
              </button>
            )}
          </div>
        </div>}

        {/* Hero — hidden in kids mode, they have their own header */}
        {!kidsMode && (
        <div style={{ margin:"10px 14px 0", borderRadius:18, padding:"14px",
          background: mode === "gamified" ? "linear-gradient(135deg,#4f46e5,#6d28d9)" : T.card,
          border:"1px solid " + (mode === "gamified" ? "#6366f1" : T.border) }}>
          <div style={{ display:"flex", alignItems:"center", gap:13 }}>
            <div style={{ position:"relative", width:70, height:70, flexShrink:0 }}>
              <svg width="70" height="70" style={{ transform:"rotate(-90deg)" }}>
                <circle cx="35" cy="35" r="32" fill="none" stroke={T.borderL} strokeWidth="5" />
                <circle cx="35" cy="35" r="32" fill="none" stroke={GOLD} strokeWidth="5"
                  strokeDasharray={String(circ)}
                  strokeDashoffset={String(circ - (pct/100)*circ)}
                  strokeLinecap="round"
                  style={{ transition:"stroke-dashoffset 0.5s ease" }} />
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:15, fontWeight:700, color:GOLD, lineHeight:"1" }}>{pct}%</span>
                <span style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif" }}>{done}/{total}</span>
              </div>
            </div>
            <div>
              <div style={{ marginBottom:10 }}>
                <div style={{
                  fontSize:32, fontFamily:"'Amiri',serif", lineHeight:"1", letterSpacing:2,
                  color: kidsMode ? KT.gold : mode === "gamified" ? "#a5b4fc" : GOLD,
                  textShadow: mode === "gamified" ? "0 0 12px #ffffff44" : "0 1px 4px " + GOLD + "44",
                }}>{kidsMode ? "السَّلامُ" : "يَوْم"}</div>
                <div style={{ width:32, height:2, borderRadius:2, margin:"5px 0",
                  background: mode === "gamified" ? "linear-gradient(to right,#ffffff,#ffffff44)"
                    : "linear-gradient(to right," + GOLD + "," + GOLD + "44)" }} />
                <div style={{ fontSize:18, letterSpacing:4, fontWeight:600, lineHeight:"1", textTransform:"uppercase",
                  fontFamily: mode === "gamified" ? "'Nunito',sans-serif" : "'Lora',serif",
                  color: kidsMode ? KT.gold : mode === "gamified" ? "#a5b4fc" : GOLD,
                }}>{kidsMode ? "Assalamu Alaikum" : "Yawm"}</div>
                <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontFamily:"sans-serif", marginTop:4, marginBottom:7,
                  color: kidsMode ? KT.muted : T.muted }}>
                  {kidsMode ? "My Daily Deeds 🌙" : mode === "gamified" ? "My Daily Journey ⭐" : "My Daily Deeds"}
                </div>
              </div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                <span style={{ background:T.alt, border:"1px solid " + T.border, borderRadius:10, padding:"3px 9px", fontSize:11, color:GOLD, fontFamily:"sans-serif" }}>
                  🔥 {streak} day{streak !== 1 ? "s" : ""}
                </span>
                {mode === "gamified" && (() => {
                  const todayPts = Object.keys(todayChecked).filter(k=>todayChecked[k]&&DEED_POINTS[k]).reduce((s,k)=>s+(DEED_POINTS[k]||0),0);
                  const totalPts = Object.values(adultPoints).reduce((s,v)=>s+(v||0),0) + todayPts;
                  const badge    = getBadge(totalPts);
                  return (
                    <span style={{ background:badge.color + "22", border:"1px solid " + badge.color + "55", borderRadius:10, padding:"3px 9px", fontSize:11, color:badge.color, fontFamily:"sans-serif", fontWeight:600 }}>
                      {badge.icon} {badge.label} · {totalPts}pts
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
          {(IS_FRI || IS_FAST) && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
              {IS_FRI  && <span style={{ background:"#eef2ff", border:"1px solid #c7d2fe", borderRadius:10, padding:"3px 10px", fontSize:11, color:"#4f46e5", fontFamily:"sans-serif" }}>🕌 Jumu'ah</span>}
              {IS_FAST && !IS_RAMADAN && <span style={{ background:"#fefce8", border:"1px solid #fcd34d", borderRadius:10, padding:"3px 10px", fontSize:11, color:"#a16207", fontFamily:"sans-serif" }}>🌿 {IS_WHITE ? "Ayyam al-Bid — " + DOM + "th" : IS_MON ? "Monday Fast" : "Thursday Fast"}</span>}
            </div>
          )}
        </div>
        )} {/* end !kidsMode hero */}

        {/* ══ KIDS MODE ══ */}
        {kidsMode && (
          <div>
            {/* Kids header */}
            <div style={{ margin:"10px 14px 0", borderRadius:20, padding:"16px", background:KT.headerBg, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:4 }}>
                {kidsAge === "little" ? "🌟" : "⭐"}
              </div>
              <div style={{ fontSize:22, fontWeight:700, color:"#fff", fontFamily:"'Lora',serif", textShadow:"0 2px 8px rgba(0,0,0,0.2)" }}>
                السَّلَامُ عَلَيْكُمْ
              </div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", fontFamily:"sans-serif", marginTop:2 }}>
                Assalamu Alaikum! Let's do our daily deeds 🌙
              </div>
              {/* Points & badge */}
              {(() => {
                const todayPts = ALL_KIDS_TASKS.filter(t => kidsChecked[t.id]).reduce((s,t) => s+t.points, 0);
                const totalPts = Object.values(kidsPoints).reduce((s,v) => s+(v||0), 0) + todayPts;
                const badge    = getBadge(totalPts);
                const maxPts   = ALL_KIDS_TASKS.filter(t => kidsEnabledTasks.includes(t.id)).reduce((s,t) => s+t.points, 0);
                const pct      = maxPts ? Math.round((todayPts/maxPts)*100) : 0;
                return (
                  <div style={{ marginTop:12 }}>
                    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:22 }}>{badge.icon}</span>
                      <span style={{ fontSize:14, fontWeight:700, color:"#fff", fontFamily:"sans-serif" }}>{badge.label}</span>
                      <span style={{ fontSize:13, color:"rgba(255,255,255,0.8)", fontFamily:"sans-serif" }}>{totalPts} pts</span>
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:10, height:12, overflow:"hidden", margin:"0 20px" }}>
                      <div style={{ height:"100%", width:pct+"%", background:"#fff", borderRadius:10, transition:"width 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontFamily:"sans-serif", marginTop:4 }}>{todayPts}/{maxPts} points today</div>
                  </div>
                );
              })()}
            </div>

            {/* Kids tab bar */}
            <div style={{ display:"flex", margin:"10px 14px 0", borderRadius:14, overflow:"hidden",
              border:"2px solid " + KT.border }}>
              {[["deeds","📋","Deeds"],["garden","🏡","Garden"]].map(function(t) {
                const active = kidsTab === t[0];
                return (
                  <button key={t[0]} onClick={() => setKidsTab(t[0])} style={{
                    flex:1, padding:"11px 4px", border:"none", cursor:"pointer",
                    background: active ? KT.gold : KT.alt,
                    color: active ? "#fff" : KT.muted,
                    fontFamily:"'Fredoka One','Nunito',sans-serif",
                    fontSize:14, fontWeight: active ? 700 : 400,
                    transition:"all 0.2s",
                    borderRight: t[0] === "deeds" ? "2px solid " + KT.border : "none",
                  }}>
                    {t[1]} {t[2]}
                  </button>
                );
              })}
            </div>

            {/* Kids deeds tab */}
            {kidsTab === "deeds" && (
            <div style={{ padding:"10px 14px 0" }}>

              {/* Prayer boxes */}
              {KIDS_PRAYERS.map(function(prayer) {
                const visRows = prayer.rows;
                const pDone = visRows.filter(r => kidsChecked[r.id]).length;
                const allDone = pDone === visRows.length;
                return (
                  <div key={prayer.id} style={{ marginBottom:10, borderRadius:16, overflow:"hidden",
                    border:"2px solid " + (allDone ? prayer.color : KT.border),
                    background: allDone ? prayer.color + "18" : KT.card }}>
                    {/* Prayer header */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"12px 14px 10px",
                      background: allDone ? prayer.color : prayer.color + "33",
                      borderBottom:"2px solid " + prayer.color + "55" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                        <span style={{ fontSize:26 }}>{prayer.icon}</span>
                        <div>
                          <div style={{ fontSize:18, fontWeight:800,
                            color: allDone ? "#fff" : prayer.color,
                            textDecoration: allDone ? "line-through" : "none",
                            fontFamily:"'Fredoka One','Nunito',sans-serif", lineHeight:"1.1" }}>{prayer.label}</div>
                          <div style={{ fontSize:13, color: allDone ? "#fff" : prayer.color + "cc",
                            fontFamily:"'Amiri',serif" }}>{prayer.ar}</div>
                        </div>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:18, fontWeight:800,
                          color: allDone ? "#fff" : prayer.color,
                          fontFamily:"'Fredoka One',sans-serif", lineHeight:"1" }}>{pDone}/{visRows.length}</div>
                        {allDone && <div style={{ fontSize:14 }}>✅</div>}
                      </div>
                    </div>
                    {/* Prayer rows — big fun buttons */}
                    <div style={{ padding:"8px 10px", display:"flex", flexDirection:"column", gap:7 }}>
                    {visRows.map(function(row) {
                      const chk = !!kidsChecked[row.id];
                      const rowCol = row.type === "F" ? prayer.color : row.type === "W" ? "#b45309" : "#7c3aed";
                      const typeLabel = row.type === "F" ? "Fard فرض" : row.type === "W" ? "Witr وتر" : "Sunnah سنة";
                      return (
                        <button key={row.id} onClick={() => {
                          const next = { ...kidsChecked, [row.id]: !kidsChecked[row.id] };
                          setKidsChecked(next);
                          if (!chk) {
                            const allPts = [...KIDS_PRAYERS.flatMap(p=>p.rows), ...ALL_KIDS_TASKS].reduce((s,t) => next[t.id] ? s+(t.pts||t.points||0) : s, 0);
                            const newPts = { ...kidsPoints, [TODAY_KEY]: allPts };
                            setKidsPoints(newPts); save("yawm_kids_pts", newPts);
                            setConfetti(true); setTimeout(() => setConfetti(false), 1200);
                          }
                        }} style={{
                          display:"flex", alignItems:"center", gap:10,
                          width:"100%", padding:"11px 13px",
                          background: chk ? rowCol + "18" : "#fff",
                          border:"2px solid " + (chk ? rowCol : rowCol + "44"),
                          borderRadius:12, cursor:"pointer", textAlign:"left",
                          transition:"all 0.18s",
                          transform: chk ? "scale(0.97)" : "scale(1)",
                          boxShadow: chk ? "none" : "0 2px 6px " + rowCol + "22",
                        }}>
                          {/* Type badge */}
                          <span style={{ fontSize:11, padding:"3px 8px", borderRadius:8,
                            fontFamily:"'Nunito',sans-serif", fontWeight:800,
                            background: rowCol + "22", color: rowCol,
                            border:"1.5px solid " + rowCol + "55", flexShrink:0, lineHeight:"1.4" }}>
                            {typeLabel}
                          </span>
                          {/* Label */}
                          <span style={{ flex:1, fontSize:15, fontWeight:700,
                            color: chk ? KT.muted : KT.text,
                            textDecoration: chk ? "line-through" : "none",
                            fontFamily:"'Fredoka One','Nunito',sans-serif" }}>
                            {row.label}
                          </span>
                          {/* Points */}
                          <span style={{ fontSize:12, fontWeight:800, color: rowCol,
                            fontFamily:"'Nunito',sans-serif" }}>+{row.pts}</span>
                          {/* Big checkbox */}
                          <div style={{
                            width:38, height:38, borderRadius:10, flexShrink:0,
                            background: chk ? rowCol : "#fff",
                            border:"2.5px solid " + (chk ? rowCol : rowCol + "66"),
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:20, transition:"all 0.2s",
                            transform: chk ? "scale(1.08) rotate(-5deg)" : "scale(1)",
                            boxShadow: chk ? "0 3px 8px " + rowCol + "55" : "none",
                          }}>
                            {chk ? "⭐" : ""}
                          </div>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                );
              })}

              {/* Daily Deeds section header */}
              <div style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700,
                fontFamily:"sans-serif", color:KT.gold, marginBottom:8, marginTop:4 }}>Daily Deeds</div>

              {/* Non-prayer tasks */}
              {ALL_KIDS_TASKS.filter(t => kidsEnabledTasks.includes(t.id)).map(function(task) {
                const chk  = !!kidsChecked[task.id];
                const cats = { prayer:"#2e7d32", quran:"#b71c1c", dhikr:"#4a148c", good:"#e65100" };
                const catC = cats[task.cat] || KT.gold;
                return (
                  <button key={task.id} onClick={() => {
                    const next = { ...kidsChecked, [task.id]: !kidsChecked[task.id] };
                    setKidsChecked(next);
                    if (!chk) {
                      const allPts = [...KIDS_PRAYERS.flatMap(p=>p.rows), ...ALL_KIDS_TASKS].reduce((s,t) => next[t.id] ? s+(t.pts||t.points||0) : s, 0);
                      const newPts = { ...kidsPoints, [TODAY_KEY]: allPts };
                      setKidsPoints(newPts); save("yawm_kids_pts", newPts);
                      setConfetti(true); setTimeout(() => setConfetti(false), 1200);
                    }
                  }} style={{
                    display:"flex", alignItems:"center", gap:12,
                    width:"100%", marginBottom:8, padding:KT.rowPad,
                    background: chk ? catC + "22" : KT.card,
                    border:"2px solid " + (chk ? catC : KT.border),
                    borderRadius:16, cursor:"pointer", textAlign:"left",
                    transition:"all 0.2s", transform: chk ? "scale(0.98)" : "scale(1)",
                  }}>
                    <span style={{ fontSize:KT.iconSize, flexShrink:0 }}>{task.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:KT.fontSize, fontWeight:600, color: chk ? catC : KT.text,
                        textDecoration: chk ? "line-through" : "none",
                        fontFamily:"'Fredoka One','Nunito',sans-serif" }}>{task.label}</div>
                      <div style={{ fontSize:13, color:KT.muted, fontFamily:"'Amiri',serif", marginTop:1 }}>{task.ar}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                      <div style={{ width:32, height:32, borderRadius:10,
                        background: chk ? catC : "transparent",
                        border:"2px solid " + (chk ? catC : KT.border),
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:18, transition:"all 0.2s",
                        transform: chk ? "scale(1.1) rotate(-3deg)" : "scale(1)" }}>
                        {chk ? "⭐" : "○"}
                      </div>
                      <span style={{ fontSize:9, color:chk ? catC : KT.muted, fontFamily:"sans-serif", fontWeight:700 }}>+{task.points}</span>
                    </div>
                  </button>
                );
              })}

              {/* Confetti burst */}
              {confetti && (
                <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ fontSize:60, animation:"popIn 0.8s ease" }}>🌟</div>
                </div>
              )}

              {/* All done celebration */}
              {ALL_KIDS_TASKS.filter(t => kidsEnabledTasks.includes(t.id)).every(t => kidsChecked[t.id]) && (
                <div style={{ padding:"16px", background:"linear-gradient(135deg,#ff9800,#e91e63)", borderRadius:16, textAlign:"center", marginBottom:12, color:"#fff" }}>
                  <div style={{ fontSize:32, marginBottom:4 }}>🎉</div>
                  <div style={{ fontSize:16, fontWeight:700, fontFamily:"'Lora',serif" }}>الحمد لله! All done!</div>
                  <div style={{ fontSize:12, fontFamily:"sans-serif", marginTop:4, opacity:0.9 }}>Amazing work today! Allah is pleased with you 🌟</div>
                </div>
              )}

                            {/* Parent settings button */}
              <button onClick={() => { setKidsPinDraft(""); setKidsParent(true); }} style={{ width:"100%", padding:"10px", background:KT.alt, border:"2px dashed " + KT.border, borderRadius:12, cursor:"pointer", color:KT.muted, fontSize:13, fontFamily:"sans-serif", marginBottom:10 }}>
                🔒 Parent Settings
              </button>
            </div>
            )} {/* end deeds tab */}

            {/* Kids garden tab */}
            {kidsTab === "garden" && (
            <div style={{ padding:"10px 14px 0" }}>
              {/* Kids Garden — House in Jannah */}
              <div style={{ marginBottom:12, borderRadius:20, overflow:"hidden",
                border:"3px solid " + KT.border,
                background:"linear-gradient(180deg,#bfdbfe 0%,#93c5fd 30%,#86efac 60%,#4ade80 100%)" }}>
                {/* Garden header */}
                <div style={{ padding:"10px 14px 8px",
                  background: KT.headerBg, textAlign:"center" }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#fff",
                    fontFamily:"'Fredoka One',sans-serif", letterSpacing:1 }}>
                    🏡 MY HOUSE IN JANNAH
                  </div>
                </div>
                {/* Visual house scene */}
                {(() => {
                  const allK = { ...kidsChecked };
                  const prayersDone  = KIDS_PRAYERS.flatMap(p=>p.rows.filter(r=>r.type==="F")).filter(r=>allK[r.id]).length;
                  const sunnahDone   = KIDS_PRAYERS.flatMap(p=>p.rows.filter(r=>r.type==="S")).filter(r=>allK[r.id]).length;
                  const witrDone     = allK["kp_witr"];
                  const quranDone    = allK["k_quran"];
                  const kindDone     = allK["k_kind"];
                  const parentsDone  = allK["k_parents"];
                  const sadaqahDone  = allK["k_sadaqah"];
                  const dhikrDone    = allK["k_adkhar"] || allK["k_bismillah"];
                  // House parts unlock as prayers done
                  const BRICKS   = Math.min(prayersDone, 5);
                  const HAS_ROOF = prayersDone >= 3;
                  const HAS_DOOR = prayersDone >= 2;
                  // HAS_WIN used to show windows (prayersDone >= 4 shows 🏡 which includes windows)
                  const HAS_GARDEN = sunnahDone >= 2;
                  const HAS_TREE = sunnahDone >= 4;
                  const HAS_STAR = witrDone;
                  const HAS_RIVER = quranDone;
                  const HAS_RAINBOW = kindDone && parentsDone;
                  const HAS_FOUNTAIN = sadaqahDone;
                  const HAS_LIGHT  = dhikrDone;
                  const DONE_ALL = prayersDone >= 5;
                  return (
                    <div style={{ minHeight:200, position:"relative", padding:"8px 10px 4px" }}>
                      {/* Sky */}
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:"50%",
                        background:"linear-gradient(180deg,#bfdbfe,#dbeafe)" }} />
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"50%",
                        background:"linear-gradient(180deg,#86efac,#4ade80)" }} />
                      {/* Sun */}
                      <div style={{ position:"absolute", top:8, right:16, fontSize:26 }}>☀️</div>
                      {/* Rainbow */}
                      {HAS_RAINBOW && <div style={{ position:"absolute", top:6, left:10, fontSize:22 }}>🌈</div>}
                      {/* Stars */}
                      {HAS_STAR && <div style={{ position:"absolute", top:12, left:"35%", fontSize:14 }}>⭐⭐⭐</div>}
                      {/* Light glow */}
                      {HAS_LIGHT && <div style={{ position:"absolute", top:8, left:"55%", fontSize:16 }}>✨</div>}
                      {/* River */}
                      {HAS_RIVER && <div style={{ position:"absolute", bottom:"22%", left:0, right:0, height:14,
                        background:"linear-gradient(90deg,#93c5fd88,#60a5fa,#93c5fd88)",
                        borderRadius:7, margin:"0 20px" }} />}
                      {/* Fountain */}
                      {HAS_FOUNTAIN && <div style={{ position:"absolute", bottom:"28%", right:"12%", fontSize:20 }}>⛲</div>}
                      {/* Tree */}
                      {HAS_TREE && <div style={{ position:"absolute", bottom:"28%", left:"8%", fontSize:26 }}>🌳</div>}
                      {/* Flowers */}
                      {HAS_GARDEN && <div style={{ position:"absolute", bottom:"12%", left:0, right:0,
                        display:"flex", justifyContent:"space-around", padding:"0 10px" }}>
                        {["🌸","🌺","🌼","🌻","🌹"].slice(0, sunnahDone).map((f,i)=>(
                          <span key={i} style={{ fontSize:16 }}>{f}</span>
                        ))}
                      </div>}
                      {/* House */}
                      <div style={{ position:"absolute", bottom:"20%", left:"50%", transform:"translateX(-50%)",
                        textAlign:"center" }}>
                        {DONE_ALL
                          ? <div style={{ fontSize:52 }}>🏡</div>
                          : HAS_ROOF
                          ? <div style={{ fontSize:44 }}>🏠</div>
                          : HAS_DOOR
                          ? <div style={{ fontSize:36 }}>🧱</div>
                          : <div style={{ fontSize:28, opacity:0.5 }}>🪨</div>}
                        {DONE_ALL && (
                          <div style={{ fontSize:9, fontWeight:800, color:"#166534",
                            fontFamily:"'Fredoka One',sans-serif", background:"#fff8",
                            padding:"1px 6px", borderRadius:6 }}>Your Jannah Home!</div>
                        )}
                      </div>
                      {/* Brick progress */}
                      <div style={{ position:"absolute", top:8, left:12,
                        display:"flex", gap:3 }}>
                        {Array.from({length:5}).map((_,i) => (
                          <span key={i} style={{ fontSize:14, opacity: i < BRICKS ? 1 : 0.2 }}>🧱</span>
                        ))}
                      </div>
                      {/* Empty state */}
                      {prayersDone === 0 && (
                        <div style={{ position:"absolute", inset:0, display:"flex",
                          flexDirection:"column", alignItems:"center", justifyContent:"center",
                          textAlign:"center", padding:16 }}>
                          <div style={{ fontSize:32 }}>🪨</div>
                          <div style={{ fontSize:13, fontWeight:700, color:"#166534",
                            fontFamily:"'Fredoka One',sans-serif", marginTop:6 }}>
                            Pray to build your house! 🏡
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {/* Mini legend */}
                <div style={{ padding:"8px 12px", background:"rgba(255,255,255,0.7)",
                  display:"flex", flexWrap:"wrap", gap:6 }}>
                  {[
                    { icon:"🏠", label:"Prayers build your house" },
                    { icon:"🌸", label:"Sunnah = flowers" },
                    { icon:"⭐", label:"Witr = stars" },
                    { icon:"💧", label:"Quran = river" },
                    { icon:"🌈", label:"Kindness = rainbow" },
                  ].map(item => (
                    <div key={item.label} style={{ display:"flex", alignItems:"center", gap:4,
                      fontSize:10, color:"#166534", fontFamily:"'Nunito',sans-serif", fontWeight:600 }}>
                      <span>{item.icon}</span><span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => { setKidsPinDraft(""); setKidsParent(true); }} style={{ width:"100%", padding:"10px", background:KT.alt, border:"2px dashed " + KT.border, borderRadius:12, cursor:"pointer", color:KT.muted, fontSize:13, fontFamily:"sans-serif", marginBottom:10 }}>
                🔒 Parent Settings
              </button>
            </div>
            )} {/* end garden tab */}

            {/* Parent PIN modal */}
            {kidsParent && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                <div style={{ background:"#fff", borderRadius:20, padding:24, width:"100%", maxWidth:340 }}>
                  {kidsPinDraft !== kidsPin + "_ok" ? (
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, color:"#1a1a1a", fontFamily:"'Lora',serif", marginBottom:4 }}>🔒 Parent Access</div>
                      <div style={{ fontSize:12, color:"#888", fontFamily:"sans-serif", marginBottom:16 }}>Enter your PIN to access settings</div>
                      <input type="password" maxLength={4} value={kidsPinDraft} onChange={e => { setKidsPinDraft(e.target.value); setKidsPinError(false); }} placeholder="Enter PIN" style={{ width:"100%", padding:"10px", border:"1px solid " + (kidsPinError ? "#ef4444" : "#e0e0e0"), borderRadius:8, fontSize:18, textAlign:"center", letterSpacing:8, outline:"none", marginBottom:8 }} />
                      {kidsPinError && <div style={{ fontSize:11, color:"#ef4444", fontFamily:"sans-serif", textAlign:"center", marginBottom:8 }}>Incorrect PIN</div>}
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => { if (kidsPinDraft === kidsPin) { setKidsPinDraft(kidsPin + "_ok"); setKidsPinError(false); } else { setKidsPinError(true); } }} style={{ flex:1, padding:"10px", background:"#7c3aed", border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontSize:14, fontWeight:600 }}>Unlock</button>
                        <button onClick={() => setKidsParent(false)} style={{ flex:1, padding:"10px", background:"#f5f5f5", border:"1px solid #e0e0e0", borderRadius:8, color:"#666", cursor:"pointer", fontSize:14 }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, color:"#1a1a1a", fontFamily:"'Lora',serif", marginBottom:16 }}>⚙️ Parent Settings</div>

                      {/* Age group */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11, color:"#888", fontFamily:"sans-serif", marginBottom:6 }}>Age Group</div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => setKidsAge("little")} style={{ flex:1, padding:"8px", borderRadius:8, border:"1px solid #e0e0e0", background: kidsAge==="little" ? "#ff9800" : "#f5f5f5", color: kidsAge==="little" ? "#fff" : "#333", cursor:"pointer", fontSize:12, fontFamily:"sans-serif", fontWeight: kidsAge==="little"?700:400 }}>🌱 Under 7</button>
                          <button onClick={() => setKidsAge("older")} style={{ flex:1, padding:"8px", borderRadius:8, border:"1px solid #e0e0e0", background: kidsAge==="older" ? "#7c3aed" : "#f5f5f5", color: kidsAge==="older" ? "#fff" : "#333", cursor:"pointer", fontSize:12, fontFamily:"sans-serif", fontWeight: kidsAge==="older"?700:400 }}>🌟 Ages 7-12</button>
                        </div>
                      </div>

                      {/* Tasks toggle */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11, color:"#888", fontFamily:"sans-serif", marginBottom:6 }}>Which tasks to show</div>
                        <div style={{ maxHeight:200, overflowY:"auto" }}>
                          {ALL_KIDS_TASKS.map(function(task) {
                            const on = kidsEnabledTasks.includes(task.id);
                            return (
                              <div key={task.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f0f0f0" }}>
                                <span style={{ fontSize:13, color:"#333", fontFamily:"sans-serif" }}>{task.emoji} {task.label}</span>
                                <button onClick={() => setKidsEnabledTasks(on ? kidsEnabledTasks.filter(id => id!==task.id) : [...kidsEnabledTasks, task.id])} style={{ padding:"3px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:600, background: on ? "#4caf50" : "#e0e0e0", color: on ? "#fff" : "#666" }}>
                                  {on ? "On" : "Off"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Change PIN */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11, color:"#888", fontFamily:"sans-serif", marginBottom:6 }}>Change PIN (4 digits)</div>
                        <input type="number" maxLength={4} placeholder="New PIN" onChange={e => { if(e.target.value.length===4) setKidsPin(e.target.value); }} style={{ width:"100%", padding:"8px", border:"1px solid #e0e0e0", borderRadius:8, fontSize:14, textAlign:"center", outline:"none" }} />
                      </div>

                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => { setKidsParent(false); setKidsPinDraft(""); }} style={{ flex:1, padding:"10px", background:"#7c3aed", border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>Done</button>
                        <button onClick={() => { setMode("classic"); setKidsParent(false); setKidsPinDraft(""); }} style={{ flex:1, padding:"10px", background:"#f5f5f5", border:"1px solid #e0e0e0", borderRadius:8, color:"#666", cursor:"pointer", fontSize:12 }}>Exit Kids Mode</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Adult mode */}
        {!kidsMode && (
        <>

        {/* Tabs */}
        <div style={{ display:"flex", margin:"10px 14px 0", background:T.alt, borderRadius:12, padding:3, border:"1px solid " + T.border, boxShadow: mode === "gamified" ? "0 1px 4px #6366f122" : "none" }}>
          {(mode === "gamified"
            ? [["today","📋","Today"],["garden","🌳","Garden"],["badges","🏅","Badges"],["times","🕐","Times"],["calendar","📅","Cal"],["dua","🤲","Dua"]]
            : [["today","📋"],["times","🕐"],["calendar","📅"],["dua","🤲"]]
          ).map(function(item) {
            return (
              <button key={item[0]} className="tab-btn" onClick={() => setTab(item[0])} style={{
                flex:1, padding:"7px 4px", border:"none", cursor:"pointer", borderRadius:9,
                fontFamily: mode === "gamified" ? "'Nunito',sans-serif" : "'Lora','Georgia',serif", fontSize: mode === "gamified" ? 10 : 12,
                background: tab === item[0] ? T.card : "transparent",
                color: tab === item[0] ? (mode === 'gamified' ? '#4f46e5' : GOLD) : T.muted,
                fontWeight: tab === item[0] ? 600 : 400,
                transition:"all 0.18s",
              }}>
                {item[1]} {item[2] || item[0].charAt(0).toUpperCase() + item[0].slice(1)}
              </button>
            );
          })}
        </div>

        {/* ══ TODAY ══ */}
        {tab === "today" && (
          <div style={{ padding:"10px 14px 0" }}>

            {/* Ramadan section */}
            {IS_RAMADAN && (
              <div style={{ marginBottom:10, borderRadius:13, border:"1px solid " + SS.Ramadan.bd, overflow:"hidden", background:SS.Ramadan.bg }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 13px 6px", borderBottom:"1px solid " + SS.Ramadan.bd }}>
                  <span style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:SS.Ramadan.ac }}>🌙 Ramadan</span>
                  <span style={{ fontSize:10, fontFamily:"sans-serif", fontWeight:700, color:SS.Ramadan.ac, background:SS.Ramadan.ac + "18", padding:"2px 7px", borderRadius:7 }}>
                    Day {hijri.day}
                  </span>
                </div>
                {/* Fast checkbox */}
                {RAMADAN_TASKS_BASE.map(function(task, i) {
                  const chk = !!todayChecked[task.id];
                  const nk  = TODAY_KEY + "_" + task.id;
                  return (
                    <div key={task.id} style={{ display:"flex", alignItems:"center" }}>
                      <button className="row-btn" onClick={() => toggle(task.id)} style={{ display:"flex", alignItems:"center", gap:9, flex:1, padding:"10px 13px", background:"transparent", border:"none", borderLeft: chk ? "3px solid " + SS.Ramadan.ac : "3px solid transparent", cursor:"pointer", textAlign:"left", opacity: chk ? 0.55 : 1 }}>
                        <span style={{ fontSize:15, width:22, textAlign:"center", flexShrink:0 }}>{task.icon}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:13, fontWeight:500, color: chk ? T.muted : T.text, textDecoration: chk ? "line-through" : "none" }}>{task.label}</span>
                            <span style={{ fontSize:11, color:T.muted, fontFamily:"'Amiri',serif" }}>{task.ar}</span>
                          </div>
                          <div style={{ fontSize:10, color:SS.Ramadan.ac + "bb", fontFamily:"sans-serif" }}>Day {hijri.day} of Ramadan</div>
                          {notes[nk] && <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", fontStyle:"italic", marginTop:1 }}>📝 {notes[nk]}</div>}
                        </div>
                        <div className={chk ? "check-pop" : ""}>
                          <Checkbox checked={chk} color={SS.Ramadan.ac} />
                        </div>
                      </button>
                      <button onClick={() => openNote(task.id)} style={{ background:"none", border:"none", cursor:"pointer", color: notes[nk] ? SS.Ramadan.ac : T.muted, fontSize:13, padding:"0 10px 0 4px", flexShrink:0 }} title="Add note">📝</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Salah — individual prayer boxes */}
            {PRAYERS.map(function(prayer) {
              const visRows = prayer.rows.filter(function(row) { return !row.ramadan || IS_RAMADAN; });
              const pDone   = visRows.filter(r => todayChecked[r.id]).length;
              const allDone = pDone === visRows.length;
              // Map prayer id to Aladhan timings key
              const PT_KEY  = { fajr:"Fajr", duha:"Sunrise", dhuhr:"Dhuhr", asr:"Asr", maghrib:"Maghrib", isha:"Isha", tahajjud:"Midnight" };
              const ptRaw   = prayerTimes && PT_KEY[prayer.id] ? prayerTimes[PT_KEY[prayer.id]] : null;
              function fmtTime(t) {
                if (!t) return null;
                const pts = t.split(":");
                let h = parseInt(pts[0],10);
                const m = pts[1];
                const ap = h >= 12 ? "PM" : "AM";
                h = h % 12 || 12;
                return h + ":" + m + " " + ap;
              }
              const ptFmt = fmtTime(ptRaw);
              return (
                <div key={prayer.id} style={{ marginBottom:8, borderRadius:13, border:"1px solid " + T.salahBd, overflow:"hidden", background:T.salahBg }}>
                  {/* Prayer header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 13px 6px", borderBottom:"1px solid " + T.salahBd }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <span style={{ fontSize:16 }}>{prayer.icon}</span>
                      <span style={{ fontSize: mode === "classic" ? 15 : 14, fontWeight:600, color: allDone ? T.salahAc : T.text, textDecoration: allDone ? "line-through" : "none", fontFamily: mode === "gamified" ? "'Nunito',sans-serif" : "'Lora',serif" }}>{prayer.label}</span>
                      <span style={{ fontSize:13, color:T.muted, fontFamily:"'Amiri',serif" }}>{prayer.ar}</span>
                      {ptFmt && <span style={{ fontSize:11, color:GOLD, fontFamily:"sans-serif", fontWeight:600, background:GOLD + "15", padding:"1px 7px", borderRadius:8, marginLeft:2 }}>{ptFmt}</span>}
                    </div>
                    <span style={{ fontSize:10, fontFamily:"sans-serif", fontWeight:700, color:T.salahAc, background:T.salahAc + "18", padding:"2px 7px", borderRadius:7 }}>{pDone}/{visRows.length}</span>
                  </div>
                  {/* Prayer rows */}
                  <div style={{ paddingBottom:4 }}>
                    {visRows.map(function(row) {
                      const chk = !!todayChecked[row.id];
                      const col = TC[row.type];
                      const nk  = TODAY_KEY + "_" + row.id;
                      return (
                        <div key={row.id} style={{ display:"flex", alignItems:"center", borderBottom:"1px solid " + T.salahBd + "33" }}>
                          <button className="row-btn" onClick={() => toggle(row.id)} style={{ display:"flex", alignItems:"center", gap:7, flex:1, padding:"5px 13px 5px 14px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", opacity: chk ? 0.5 : 1 }}>
                            <div style={{ width:3, height:14, borderRadius:2, background:col, flexShrink:0 }} />
                            <span style={{ fontSize:9, padding:"1px 5px", borderRadius:5, fontFamily:"sans-serif", fontWeight:700, background:col + "20", color:col, border:"1px solid " + col + "44", flexShrink:0 }}>{TL[row.type]}</span>
                            <span style={{ fontSize:12, color: chk ? T.muted : T.text, textDecoration: chk ? "line-through" : "none", flex:1 }}>
                              {row.label}
                              {row.optional && <span style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}> · optional</span>}
                            </span>
                            {notes[nk] && <span style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", fontStyle:"italic" }}>📝</span>}
                            {mode === "gamified" && DEED_POINTS[row.id] && (
                              <span style={{ fontSize:10, fontFamily:"sans-serif", fontWeight:700, color: chk ? GOLD : T.muted, background: chk ? GOLD+"22" : T.alt, border:"1px solid "+(chk?GOLD+"44":T.border), borderRadius:8, padding:"1px 6px", flexShrink:0 }}>
                                +{DEED_POINTS[row.id]}
                              </span>
                            )}
                            <div className={chk ? "check-pop" : ""}>
                              <Checkbox checked={chk} color={T.salahAc} size={18} />
                            </div>
                          </button>
                          <button onClick={() => openNote(row.id)} style={{ background:"none", border:"none", cursor:"pointer", color: notes[nk] ? T.salahAc : T.muted, fontSize:11, padding:"0 10px 0 2px", flexShrink:0 }}>📝</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Other sections */}
            {["Jumuah","Adhkar","Quran","Charity","Fasting","Custom"].map(function(sec) {
              const tasks = sec === "Custom"
                ? customs.map(c => ({ ...c, section:"Custom" }))
                : (otherBySection[sec] || []);
              if (!tasks.length) return null;
              const S = SS[sec] || SS.Custom;
              const secDone = tasks.filter(t => todayChecked[t.id]).length;
              return (
                <div key={sec} style={{ marginBottom:10, borderRadius:13, border:"1px solid " + S.bd, overflow:"hidden", background:S.bg }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 13px 6px", borderBottom:"1px solid " + S.bd }}>
                    <span style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:S.ac }}>{sec === "Jumuah" ? "Jumu'ah" : sec}</span>
                    <span style={{ fontSize:10, fontFamily:"sans-serif", fontWeight:700, color:S.ac, background:S.ac + "18", padding:"2px 7px", borderRadius:7 }}>{secDone}/{tasks.length}</span>
                  </div>
                  {tasks.map(function(task, i) {
                    const chk = !!todayChecked[task.id];
                    const nk  = TODAY_KEY + "_" + task.id;
                    return (
                      <div key={task.id} style={{ borderBottom: i < tasks.length - 1 ? "1px solid " + S.bd + "44" : "none", display:"flex", alignItems:"center", position:"relative" }}>
                        <button className="row-btn" onClick={() => toggle(task.id)} style={{ display:"flex", alignItems:"center", gap:9, flex:1, padding:"10px 13px", background:"transparent", border:"none", borderLeft: chk ? "3px solid " + S.ac : "3px solid transparent", cursor:"pointer", textAlign:"left", opacity: chk ? 0.5 : 1 }}>
                          <span style={{ fontSize:15, width:22, textAlign:"center", flexShrink:0 }}>{task.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                              <span style={{ fontSize:13, fontWeight:500, color: chk ? T.muted : T.text, textDecoration: chk ? "line-through" : "none" }}>{task.label}</span>
                              {task.ar && <span style={{ fontSize:12, color:T.muted, fontFamily:"'Amiri',serif" }}>{task.ar}</span>}
                            </div>
                            {task.note && <div style={{ fontSize:10, color:S.ac + "bb", fontFamily:"sans-serif" }}>{task.note}</div>}
                            {notes[nk] && <div style={{ fontSize:10, color:T.muted, fontStyle:"italic", fontFamily:"sans-serif", marginTop:1 }}>📝 {notes[nk]}</div>}
                          </div>
                          <div className={chk ? "check-pop" : ""}>
                            <Checkbox checked={chk} color={S.ac} />
                          </div>
                        </button>
                        <button onClick={() => openNote(task.id)} style={{ background:"none", border:"none", cursor:"pointer", color: notes[nk] ? S.ac : T.muted, fontSize:13, padding:"0 8px 0 2px", flexShrink:0 }}>📝</button>
                        {sec === "Custom" && (
                          <button onClick={() => saveCustoms(customs.filter(c => c.id !== task.id))} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:11, padding:"0 10px 0 2px", flexShrink:0 }}>✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Add custom */}
            {!adding ? (
              <button className="tab-btn" onClick={() => setAdding(true)} style={{ width:"100%", padding:"10px", background:T.card, border:"2px dashed " + T.border, borderRadius:12, cursor:"pointer", color:T.muted, fontSize:13, fontFamily:"'Lora',Georgia,serif", marginBottom:10 }}>
                + Add Custom Deed
              </button>
            ) : (
              <div style={{ background:T.card, border:"1px solid " + T.border, borderRadius:12, padding:12, marginBottom:10 }}>
                <div style={{ display:"flex", gap:7, marginBottom:8 }}>
                  <input value={newIco} onChange={e => setNewIco(e.target.value)} style={{ width:38, padding:"6px 2px", border:"1px solid " + T.border, borderRadius:7, background:T.alt, color:T.text, fontSize:16, textAlign:"center" }} />
                  <input value={newLbl} onChange={e => setNewLbl(e.target.value)} placeholder="Deed name..." onKeyDown={e => e.key === "Enter" && addCustom()} style={{ flex:1, padding:"6px 10px", border:"1px solid " + T.border, borderRadius:7, background:T.alt, color:T.text, fontSize:13 }} />
                </div>
                <div style={{ display:"flex", gap:7 }}>
                  <button onClick={addCustom} style={{ flex:1, padding:"7px", background:GOLD, border:"none", borderRadius:7, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>Add</button>
                  <button onClick={() => { setAdding(false); setNewLbl(""); }} style={{ flex:1, padding:"7px", background:T.alt, border:"1px solid " + T.border, borderRadius:7, color:T.sub, cursor:"pointer", fontSize:13 }}>Cancel</button>
                </div>
              </div>
            )}

            {pct === 100 && (
              <div style={{ padding:"13px", background:GOLD + "18", border:"1px solid " + GOLD + "44", borderRadius:13, textAlign:"center", color:GOLD, fontSize:15, marginBottom:12, fontFamily:"'Amiri',serif", letterSpacing:0.5 }}>
                ✨ الحمد لله — All deeds complete today!
              </div>
            )}
          </div>
        )}

        {/* ══ CALENDAR ══ */}
        {tab === "calendar" && (
          <div style={{ padding:"10px 14px 0" }}>

            {/* Month nav */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:T.card, borderRadius:13, border:"1px solid " + T.border, padding:"10px 14px", marginBottom:10 }}>
              <button onClick={prevMonth} style={{ background:T.alt, border:"1px solid " + T.border, borderRadius:10, cursor:"pointer", color:GOLD, fontSize:22, padding:"6px 16px", minWidth:44 }}>‹</button>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:14, fontWeight:600, color:T.text, fontFamily:"'Lora',serif" }}>{MON_SHORT[calMonth]} {calYear}</div>
              </div>
              <button onClick={nextMonth} style={{ background:T.alt, border:"1px solid " + T.border, borderRadius:10, cursor:"pointer", color: isCurrentMonth ? T.muted : GOLD, fontSize:22, padding:"6px 16px", minWidth:44, opacity: isCurrentMonth ? 0.3 : 1 }}>›</button>
            </div>

            {/* Day-of-week headers */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:4 }}>
              {DAYS_SHORT.map(function(d) {
                return <div key={d} style={{ textAlign:"center", fontSize:9, color:T.muted, fontFamily:"sans-serif", textTransform:"uppercase", padding:"2px 0" }}>{d}</div>;
              })}
            </div>

            {/* Calendar grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
              {Array.from({ length: calOffset }, function(_, i) {
                return <div key={"e" + i} />;
              })}
              {Array.from({ length: calDays }, function(_, i) {
                const day   = i + 1;
                const k     = calYear + "-" + String(calMonth+1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
                const dp    = calDayPct(day);
                const isT   = k === TODAY_KEY;
                const isFut = new Date(calYear, calMonth, day) > TODAY;
                const alpha = isFut ? "0.04" : String(Math.max(0.07, dp/100));
                const rgb   = theme === "light" ? "194,124,42" : "200,169,110";
                return (
                  <div key={day} onClick={() => !isFut && setSelectedDay(k)}
                    style={{ aspectRatio:"1", borderRadius:8, position:"relative", background:"rgba(" + rgb + "," + alpha + ")", border: isT ? "2px solid " + GOLD : "1px solid " + T.border, cursor: isFut ? "default" : "pointer" }}>
                    <div style={{ position:"absolute", top:2, left:0, right:0, textAlign:"center", fontSize:9, fontWeight: isT ? 700 : 400, color: isT ? GOLD : T.sub, fontFamily:"sans-serif" }}>{day}</div>
                    {!isFut && dp > 0 && (
                      <div style={{ position:"absolute", bottom:2, left:0, right:0, textAlign:"center", fontSize:7, fontWeight:700, color: dp === 100 ? GOLD : T.muted, fontFamily:"sans-serif" }}>
                        {dp === 100 ? "⭐" : dp + "%"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Week bar chart */}
            <div style={{ background:T.card, borderRadius:13, border:"1px solid " + T.border, padding:13, marginTop:10 }}>
              <div style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD, marginBottom:9 }}>Last 7 Days</div>
              {Array.from({ length:7 }, function(_, i) { return addDays(TODAY, i - 6); }).map(function(d) {
                const k    = dateStr(d);
                const h    = k === TODAY_KEY ? todayChecked : (hist[k] || {});
                const dp   = FARD_IDS.length ? Math.round((FARD_IDS.filter(id => h[id]).length / FARD_IDS.length) * 100) : 0;
                const isT  = k === TODAY_KEY;
                const isFut = d > TODAY;
                return (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom:"1px solid " + T.borderL }}>
                    <div style={{ width:28, textAlign:"center", flexShrink:0 }}>
                      <div style={{ fontSize:8, color:T.muted, fontFamily:"sans-serif", textTransform:"uppercase" }}>{DAYS_SHORT[d.getDay()]}</div>
                      <div style={{ fontSize:13, fontWeight:600, color: isT ? GOLD : T.text }}>{d.getDate()}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ height:6, background:T.borderL, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:(isFut ? 0 : dp) + "%", background: dp === 100 ? GOLD : GOLD + "70", borderRadius:3, transition:"width 0.4s ease" }} />
                      </div>
                    </div>
                    <span style={{ width:28, textAlign:"right", fontSize:10, fontFamily:"sans-serif", fontWeight:600, color: dp === 100 ? GOLD : T.sub }}>
                      {isFut ? "–" : dp === 100 ? "⭐" : dp + "%"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ PRAYER TIMES ══ */}
        {tab === "times" && (
          <div style={{ padding:"10px 14px 0" }}>

            {/* Next prayer card */}
            {prayerTimes && (() => {
              const ORDER = ["Fajr","Sunrise","Dhuhr","Asr","Maghrib","Isha","Midnight"];
              const LABELS = { Fajr:"Fajr", Sunrise:"Sunrise", Dhuhr:"Dhuhr", Asr:"Asr", Maghrib:"Maghrib", Isha:"Isha", Midnight:"Midnight" };
              const ICONS  = { Fajr:"🌙", Sunrise:"🌅", Dhuhr:"☀️", Asr:"🌤️", Maghrib:"🌆", Isha:"🌃", Midnight:"🌑" };
              const nowMins = now.getHours() * 60 + now.getMinutes();
              function toMins(t) {
                if (!t) return 9999;
                const parts = t.split(":");
                return parseInt(parts[0],10) * 60 + parseInt(parts[1],10);
              }
              function fmt(t) {
                if (!t) return "--:--";
                const parts = t.split(":");
                let h = parseInt(parts[0],10);
                const m = parts[1];
                const ampm = h >= 12 ? "PM" : "AM";
                h = h % 12 || 12;
                return h + ":" + m + " " + ampm;
              }
              function countdown(t) {
                const diff = toMins(t) - nowMins;
                if (diff <= 0) return null;
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                return h > 0 ? h + "h " + m + "m" : m + "m";
              }
              let nextPrayer = null;
              for (let i = 0; i < ORDER.length; i++) {
                const key = ORDER[i];
                if (toMins(prayerTimes[key]) > nowMins) { nextPrayer = key; break; }
              }
              if (!nextPrayer) nextPrayer = "Fajr";
              const cd = countdown(prayerTimes[nextPrayer]);
              return (
                <div style={{ background:"linear-gradient(135deg," + GOLD + "22," + GOLD + "0a)", border:"1px solid " + GOLD + "44", borderRadius:16, padding:"16px", marginBottom:11, textAlign:"center" }}>
                  <div style={{ fontSize:9, color:T.muted, letterSpacing:3, textTransform:"uppercase", fontFamily:"sans-serif", marginBottom:6 }}>Next Prayer</div>
                  <div style={{ fontSize:28 }}>{ICONS[nextPrayer]}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:GOLD, fontFamily:"'Lora',serif", marginTop:4 }}>{LABELS[nextPrayer]}</div>
                  <div style={{ fontSize:22, color:T.text, fontFamily:"sans-serif", fontWeight:600, marginTop:2 }}>{fmt(prayerTimes[nextPrayer])}</div>
                  {cd && <div style={{ fontSize:13, color:T.muted, fontFamily:"sans-serif", marginTop:4 }}>in {cd}</div>}
                  {locationName && <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", marginTop:6 }}>📍 {locationName}</div>}
                </div>
              );
            })()}

            {/* Loading / error */}
            {prayerLoading && (
              <div style={{ textAlign:"center", padding:"20px", color:T.muted, fontFamily:"sans-serif", fontSize:13 }}>Loading prayer times...</div>
            )}
            {prayerError && (
              <div style={{ textAlign:"center", padding:"16px", color:"#ef4444", fontFamily:"sans-serif", fontSize:13, background:"#fef2f2", borderRadius:12, border:"1px solid #fecaca", marginBottom:11 }}>{prayerError}</div>
            )}

            {/* All prayer times */}
            {prayerTimes && (
              <div style={{ background:T.card, borderRadius:14, border:"1px solid " + T.border, overflow:"hidden", marginBottom:11 }}>
                <div style={{ padding:"9px 14px 7px", borderBottom:"1px solid " + T.border, fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD }}>Today's Times</div>
                {[
                  { key:"Fajr",    label:"Fajr",    ar:"الفجر",  icon:"🌙" },
                  { key:"Sunrise", label:"Sunrise", ar:"الشروق", icon:"🌅" },
                  { key:"Dhuhr",   label:"Dhuhr",   ar:"الظهر",  icon:"☀️" },
                  { key:"Asr",     label:"Asr",     ar:"العصر",  icon:"🌤️" },
                  { key:"Maghrib", label:"Maghrib", ar:"المغرب", icon:"🌆" },
                  { key:"Isha",    label:"Isha",    ar:"العشاء", icon:"🌃" },
                  { key:"Midnight",label:"Midnight",ar:"منتصف الليل", icon:"🌑" },
                ].map(function(p, i, arr) {
                  const nowMins = now.getHours() * 60 + now.getMinutes();
                  function toMins(t) { if (!t) return 9999; const pts = t.split(":"); return parseInt(pts[0],10)*60+parseInt(pts[1],10); }
                  function fmt(t) { if(!t) return "--:--"; const pts=t.split(":"); let h=parseInt(pts[0],10); const m=pts[1]; const ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+m+" "+ap; }
                  const tm  = prayerTimes[p.key];
                  const isNext = (() => {
                    const ORDER = ["Fajr","Sunrise","Dhuhr","Asr","Maghrib","Isha","Midnight"];
                    let next = null;
                    for (let j=0;j<ORDER.length;j++) { if(toMins(prayerTimes[ORDER[j]])>nowMins){next=ORDER[j];break;} }
                    if(!next) next="Fajr";
                    return next === p.key;
                  })();
                  const isPast = toMins(tm) < nowMins;
                  return (
                    <div key={p.key} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderBottom: i < arr.length-1 ? "1px solid " + T.borderL : "none", background: isNext ? GOLD + "10" : "transparent" }}>
                      <span style={{ fontSize:18, width:24, textAlign:"center", flexShrink:0 }}>{p.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight: isNext ? 700 : 500, color: isNext ? GOLD : isPast ? T.muted : T.text, fontFamily:"'Lora',serif" }}>{p.label}</div>
                        <div style={{ fontSize:11, color:T.muted, fontFamily:"'Amiri',serif" }}>{p.ar}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:15, fontWeight:600, color: isNext ? GOLD : isPast ? T.muted : T.text, fontFamily:"sans-serif" }}>{fmt(tm)}</div>
                        {isNext && <div style={{ fontSize:9, color:GOLD, fontFamily:"sans-serif", letterSpacing:1 }}>NEXT</div>}
                        {isPast && !isNext && <div style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif" }}>passed</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Settings */}
            <div style={{ background:T.card, borderRadius:14, border:"1px solid " + T.border, padding:13, marginBottom:11 }}>
              <div style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD, marginBottom:10 }}>Settings</div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:T.sub, fontFamily:"sans-serif", marginBottom:5 }}>Calculation Method</div>
                <select value={calcMethod} onChange={e => setCalcMethod(parseInt(e.target.value,10))} style={{ width:"100%", padding:"8px 10px", border:"1px solid " + T.border, borderRadius:8, background:T.alt, color:T.text, fontSize:12, fontFamily:"sans-serif" }}>
                  <option value={1}>University of Islamic Sciences, Karachi</option>
                  <option value={2}>Islamic Society of North America (ISNA)</option>
                  <option value={3}>Muslim World League (MWL)</option>
                  <option value={4}>Umm Al-Qura, Makkah</option>
                  <option value={5}>Egyptian General Authority</option>
                  <option value={7}>Institute of Geophysics, Tehran</option>
                  <option value={8}>Gulf Region</option>
                  <option value={9}>Kuwait</option>
                  <option value={10}>Qatar</option>
                  <option value={11}>Majlis Ugama Islam Singapura</option>
                  <option value={12}>Union des Organisations Islamiques de France</option>
                  <option value={13}>Diyanet İşleri Başkanlığı, Turkey</option>
                  <option value={15}>Spiritual Administration of Muslims of Russia</option>
                  <option value={16}>Moonsighting Committee Worldwide (Khalid Shaukat)</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:T.sub, fontFamily:"sans-serif", marginBottom:5 }}>Asr Calculation (Madhab)</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => setMadhab(0)} style={{ flex:1, padding:"7px", borderRadius:8, border:"1px solid " + T.border, background: madhab===0 ? GOLD : T.alt, color: madhab===0 ? "#fff" : T.text, cursor:"pointer", fontSize:12, fontFamily:"sans-serif", fontWeight: madhab===0 ? 600 : 400 }}>Hanafi</button>
                  <button onClick={() => setMadhab(1)} style={{ flex:1, padding:"7px", borderRadius:8, border:"1px solid " + T.border, background: madhab===1 ? GOLD : T.alt, color: madhab===1 ? "#fff" : T.text, cursor:"pointer", fontSize:12, fontFamily:"sans-serif", fontWeight: madhab===1 ? 600 : 400 }}>Shafi / Maliki / Hanbali</button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ══ GARDEN ══ */}
        {tab === "garden" && mode === "gamified" && (
          <div style={{ padding:"10px 14px 0" }}>
            {(() => {
              // Count deeds across ALL journey history
              const allHist = { ...journeyHist, [TODAY_KEY]: hist[TODAY_KEY] || {} };
              const totals = {
                fard:    Object.values(allHist).reduce((s,h)=>s+(["fajr_fard","dhuhr_fard","asr_fard","magh_fard","isha_fard"].filter(k=>h[k]).length),0),
                sunnah:  Object.values(allHist).reduce((s,h)=>s+(["fajr_sun","dhuhr_sunB","dhuhr_sunA","magh_sunA","isha_sunA"].filter(k=>h[k]).length),0),
                witr:    Object.values(allHist).filter(h=>h["witr"]).length,
                quran:   Object.values(allHist).filter(h=>h["quran_recite"]).length,
                sadaqah: Object.values(allHist).filter(h=>h["sadaqah_daily"]).length,
                tahajjud:Object.values(allHist).filter(h=>h["tahajjud_pray"]).length,
                duha:    Object.values(allHist).filter(h=>h["duha_pray"]).length,
                adhkar:  Object.values(allHist).reduce((s,h)=>s+(["adhkar_morning","adhkar_evening","adhkar_sleep"].filter(k=>h[k]).length),0),
              };

              // Garden elements — each unlocks at threshold
              const TREES    = Math.min(Math.floor(totals.fard / 5), 12);
              const FLOWERS  = Math.min(Math.floor(totals.sunnah / 3), 15);
              const STARS    = Math.min(Math.floor(totals.witr / 2), 10);
              const RIVER    = totals.quran >= 7;
              const FOUNTAIN = totals.sadaqah >= 5;
              const PALACE   = streak >= 30;
              const GATE     = streak >= 7;
              const BIRDS    = totals.tahajjud >= 5;
              const SUN      = totals.duha >= 5;
              const DHIKR_GLOW = totals.adhkar >= 10;

              return (
                <>
                  {/* Garden canvas */}
                  <div style={{ borderRadius:20, overflow:"hidden", marginBottom:12, border:"2px solid #6366f155",
                    background:"linear-gradient(180deg,#dbeafe 0%,#bfdbfe 25%,#86efac 60%,#4ade80 100%)",
                    minHeight:320, position:"relative", padding:"10px" }}>

                    {/* Sky */}
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:"45%",
                      background: SUN
                        ? "linear-gradient(180deg,#fef9c3,#bfdbfe)"
                        : "linear-gradient(180deg,#dbeafe,#bfdbfe)" }} />

                    {/* Sun / Moon */}
                    {SUN
                      ? <div style={{ position:"absolute", top:14, right:24, fontSize:36 }}>☀️</div>
                      : <div style={{ position:"absolute", top:14, right:24, fontSize:28, opacity:0.6 }}>🌙</div>}

                    {/* Birds */}
                    {BIRDS && <div style={{ position:"absolute", top:22, left:"20%", fontSize:16, letterSpacing:4 }}>🕊️🕊️</div>}

                    {/* Dhikr glow */}
                    {DHIKR_GLOW && (
                      <div style={{ position:"absolute", top:10, left:"40%", fontSize:13, color:"#a855f7",
                        fontFamily:"'Amiri',serif", opacity:0.7 }}>✨ سُبْحَانَ اللَّه ✨</div>
                    )}

                    {/* Palace / Gate */}
                    {PALACE && (
                      <div style={{ position:"absolute", top:"28%", left:"50%", transform:"translateX(-50%)",
                        textAlign:"center" }}>
                        <div style={{ fontSize:52 }}>🏰</div>
                        <div style={{ fontSize:9, color:"#1e3a5f", fontFamily:"sans-serif", fontWeight:700,
                          background:"#fff8", padding:"1px 6px", borderRadius:6 }}>Palace of Jannah</div>
                      </div>
                    )}
                    {GATE && !PALACE && (
                      <div style={{ position:"absolute", top:"32%", left:"50%", transform:"translateX(-50%)",
                        textAlign:"center" }}>
                        <div style={{ fontSize:40 }}>🕌</div>
                        <div style={{ fontSize:9, color:"#1e3a5f", fontFamily:"sans-serif", fontWeight:700,
                          background:"#fff8", padding:"1px 6px", borderRadius:6 }}>Gate of Jannah</div>
                      </div>
                    )}

                    {/* Ground layer */}
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"48%",
                      background:"linear-gradient(180deg,#86efac,#4ade80)" }} />

                    {/* River */}
                    {RIVER && (
                      <div style={{ position:"absolute", bottom:"18%", left:0, right:0, height:18,
                        background:"linear-gradient(90deg,#93c5fd88,#60a5fa,#93c5fd88)",
                        borderRadius:9, margin:"0 30px" }} />
                    )}

                    {/* Fountain */}
                    {FOUNTAIN && (
                      <div style={{ position:"absolute", bottom:"28%", left:"12%", fontSize:24 }}>⛲</div>
                    )}

                    {/* Trees row */}
                    <div style={{ position:"absolute", bottom:"30%", left:0, right:0,
                      display:"flex", justifyContent:"space-around", padding:"0 10px", flexWrap:"wrap" }}>
                      {Array.from({ length: TREES }).map((_,i) => (
                        <span key={i} style={{ fontSize: i % 3 === 0 ? 28 : 22 }}>🌳</span>
                      ))}
                    </div>

                    {/* Flowers row */}
                    <div style={{ position:"absolute", bottom:"12%", left:0, right:0,
                      display:"flex", justifyContent:"space-around", padding:"0 8px", flexWrap:"wrap" }}>
                      {Array.from({ length: FLOWERS }).map((_,i) => (
                        <span key={i} style={{ fontSize:16 }}>
                          {["🌸","🌺","🌼","🌻","🌹"][i % 5]}
                        </span>
                      ))}
                    </div>

                    {/* Stars night overlay */}
                    <div style={{ position:"absolute", top:8, left:0, right:0,
                      display:"flex", justifyContent:"space-around", padding:"0 20px" }}>
                      {Array.from({ length: STARS }).map((_,i) => (
                        <span key={i} style={{ fontSize:12, opacity:0.8 }}>⭐</span>
                      ))}
                    </div>

                    {/* Empty state */}
                    {TREES === 0 && FLOWERS === 0 && !GATE && (
                      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
                        alignItems:"center", justifyContent:"center", textAlign:"center", padding:20 }}>
                        <div style={{ fontSize:36, marginBottom:8 }}>🌱</div>
                        <div style={{ fontSize:13, color:"#166534", fontFamily:"'Nunito',sans-serif", fontWeight:600 }}>
                          Your garden is waiting...
                        </div>
                        <div style={{ fontSize:11, color:"#16a34a", fontFamily:"sans-serif", marginTop:4 }}>
                          Complete prayers to plant trees 🌳
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Garden legend */}
                  <div style={{ background:T.card, borderRadius:14, border:"1px solid " + T.border, padding:"12px 14px", marginBottom:12 }}>
                    <div style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700,
                      fontFamily:"sans-serif", color:GOLD, marginBottom:10 }}>How your garden grows</div>
                    {[
                      { icon:"🌳", label:"Trees", desc:"5 Fard prayers → 1 tree", count:TREES, max:12 },
                      { icon:"🌸", label:"Flowers", desc:"3 Sunnah prayers → 1 flower", count:FLOWERS, max:15 },
                      { icon:"⭐", label:"Stars", desc:"2 Witr nights → 1 star", count:STARS, max:10 },
                      { icon:"💧", label:"River", desc:"7 days Quran recitation", count:RIVER?1:0, max:1 },
                      { icon:"⛲", label:"Fountain", desc:"5 days Sadaqah", count:FOUNTAIN?1:0, max:1 },
                      { icon:"🕊️", label:"Birds", desc:"5 Tahajjud nights", count:BIRDS?1:0, max:1 },
                      { icon:"☀️", label:"Sun", desc:"5 Duha prayers", count:SUN?1:0, max:1 },
                      { icon:"🕌", label:"Gate", desc:"7-day streak", count:GATE?1:0, max:1 },
                      { icon:"🏰", label:"Palace", desc:"30-day streak", count:PALACE?1:0, max:1 },
                    ].map(function(item) {
                      const done = item.count > 0;
                      return (
                        <div key={item.label} style={{ display:"flex", alignItems:"center", gap:10,
                          padding:"6px 0", borderBottom:"1px solid " + T.borderL, opacity: done ? 1 : 0.5 }}>
                          <span style={{ fontSize:20, width:28, textAlign:"center" }}>{item.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:600, color: done ? T.text : T.muted,
                              fontFamily:"'Nunito',sans-serif" }}>{item.label}
                              {item.max > 1 && <span style={{ color:GOLD, fontWeight:700 }}> ×{item.count}</span>}
                            </div>
                            <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>{item.desc}</div>
                          </div>
                          <span style={{ fontSize:12 }}>{done ? "✅" : "🔒"}</span>
                        </div>
                      );
                    })}
                    <div style={{ marginTop:10, padding:"10px", background:GOLD+"12",
                      borderRadius:10, textAlign:"center" }}>
                      <div style={{ fontSize:11, color:GOLD, fontFamily:"'Lora',serif", fontStyle:"italic" }}>
                        "Whoever says SubhanAllah 100 times, a thousand good deeds are recorded for him"
                      </div>
                      <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", marginTop:3 }}>— Sahih Muslim</div>
                    </div>
                  </div>

                  {/* Today's garden additions */}
                  <div style={{ background:T.card, borderRadius:14, border:"1px solid " + T.border, padding:"12px 14px", marginBottom:12 }}>
                    <div style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700,
                      fontFamily:"sans-serif", color:GOLD, marginBottom:8 }}>Added today</div>
                    {(() => {
                      const todayH = hist[TODAY_KEY] || {};
                      const added = [];
                      if (["fajr_fard","dhuhr_fard","asr_fard","magh_fard","isha_fard"].some(k=>todayH[k])) added.push("🌳 Prayer trees growing");
                      if (["fajr_sun","dhuhr_sunB","dhuhr_sunA","magh_sunA","isha_sunA"].some(k=>todayH[k])) added.push("🌸 Sunnah flowers blooming");
                      if (todayH["witr"]) added.push("⭐ Witr star shining");
                      if (todayH["quran_recite"]) added.push("💧 Quran river flowing");
                      if (todayH["sadaqah_daily"]) added.push("⛲ Sadaqah fountain");
                      if (todayH["tahajjud_pray"]) added.push("🕊️ Tahajjud birds singing");
                      if (todayH["duha_pray"]) added.push("☀️ Duha sun glowing");
                      return added.length > 0
                        ? added.map((a,i) => <div key={i} style={{ fontSize:12, color:T.sub, fontFamily:"'Nunito',sans-serif", padding:"3px 0" }}>{a}</div>)
                        : <div style={{ fontSize:12, color:T.muted, fontFamily:"sans-serif", fontStyle:"italic" }}>Complete deeds today to add to your garden</div>;
                    })()}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ══ BADGES ══ */}
        {tab === "badges" && mode === "gamified" && (
          <div style={{ padding:"10px 14px 0" }}>
            {(() => {
              const todayPts   = Object.keys(todayChecked).filter(k=>todayChecked[k]&&DEED_POINTS[k]).reduce((s,k)=>s+(DEED_POINTS[k]||0),0);
              const totalPts   = Object.values(adultPoints).reduce((s,v)=>s+(v||0),0) + todayPts;
              const badge      = getBadge(totalPts);
              const nextBadge  = BADGE_LEVELS.find(b => b.min > totalPts);
              const ptsToNext  = nextBadge ? nextBadge.min - totalPts : 0;
              return (
                <>
                  {/* Level card */}
                  <div style={{ background:"linear-gradient(135deg,#4f46e5,#7c3aed)", borderRadius:18, padding:"18px 16px", marginBottom:12, textAlign:"center", color:"#fff" }}>
                    <div style={{ fontSize:42, marginBottom:4 }}>{badge.icon}</div>
                    <div style={{ fontSize:22, fontWeight:800, fontFamily:"'Nunito',sans-serif", marginBottom:2 }}>{badge.label}</div>
                    <div style={{ fontSize:28, fontWeight:800, fontFamily:"'Nunito',sans-serif", marginBottom:8 }}>{totalPts} <span style={{ fontSize:14, fontWeight:400, opacity:0.8 }}>total points</span></div>
                    {nextBadge && (
                      <>
                        <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:10, height:10, overflow:"hidden", margin:"0 20px 6px" }}>
                          <div style={{ height:"100%", borderRadius:10, background:"#fff",
                            width: Math.round(((totalPts - badge.min) / (nextBadge.min - badge.min)) * 100) + "%",
                            transition:"width 0.5s ease" }} />
                        </div>
                        <div style={{ fontSize:12, opacity:0.85, fontFamily:"sans-serif" }}>{ptsToNext} pts to {nextBadge.label} {nextBadge.icon}</div>
                      </>
                    )}
                    {!nextBadge && <div style={{ fontSize:13, opacity:0.85, fontFamily:"sans-serif" }}>Maximum level reached! 👑</div>}
                  </div>

                  {/* Achievement badges */}
                  <div style={{ background:T.card, borderRadius:14, border:"1px solid " + T.border, overflow:"hidden", marginBottom:12 }}>
                    <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid " + T.border, fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD }}>Achievements</div>
                    {ACHIEVEMENTS.map(function(a) {
                      const earned = a.check(hist, streak);
                      return (
                        <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px",
                          borderBottom:"1px solid " + T.borderL,
                          background: earned ? a.color + "12" : "transparent",
                          opacity: earned ? 1 : 0.45 }}>
                          <div style={{ width:42, height:42, borderRadius:12, flexShrink:0,
                            background: earned ? a.color : T.alt,
                            border:"2px solid " + (earned ? a.color : T.border),
                            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                            {earned ? a.icon : "🔒"}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:700, color: earned ? a.color : T.text, fontFamily:"'Nunito',sans-serif" }}>{a.label}</div>
                            <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginTop:1 }}>{a.desc}</div>
                          </div>
                          {earned && <span style={{ fontSize:11, color:a.color, fontFamily:"sans-serif", fontWeight:700, background:a.color+"18", padding:"2px 8px", borderRadius:8 }}>Earned ✓</span>}
                        </div>
                      );
                    })}
                  </div>


                </>
              );
            })()}
          </div>
        )}

        {/* ══ DUA ══ */}
        {tab === "dua" && (
          <div style={{ padding:"10px 14px 0" }}>
            <div style={{ background:T.card, borderRadius:18, border:"1px solid " + T.border, padding:"20px 16px", textAlign:"center", marginBottom:11 }}>
              <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontFamily:"sans-serif", color:T.muted, marginBottom:14 }}>Dua of the Day</div>
              <div style={{ fontSize:20, color:GOLD, lineHeight:"2.1", marginBottom:14, fontFamily:"'Amiri Quran','Amiri',serif", direction:"rtl", padding:"0 8px" }}>{DUA.ar}</div>
              <div style={{ fontSize:13, color:T.sub, fontStyle:"italic", lineHeight:"1.7", marginBottom:9, fontFamily:"'Lora',serif" }}>"{DUA.en}"</div>
              <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>— {DUA.src}</div>
            </div>
            <div style={{ background:T.card, borderRadius:13, border:"1px solid " + T.border, padding:13 }}>
              <div style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD, marginBottom:9 }}>Hijri Months</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                {HM_EN.map(function(m, i) {
                  const cur = hijri.month - 1 === i;
                  return (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 9px", borderRadius:7, background: cur ? GOLD + "18" : T.alt, border: cur ? "1px solid " + GOLD + "44" : "1px solid " + T.border }}>
                      <span style={{ fontSize:10, color: cur ? GOLD : T.sub, fontFamily:"sans-serif", fontWeight: cur ? 700 : 400 }}>{m}</span>
                      <span style={{ fontSize:13, color: cur ? GOLD : T.muted, fontFamily:"'Amiri',serif" }}>{HM_AR[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        </>
        )}

      </div>
    </div>
  );
}
