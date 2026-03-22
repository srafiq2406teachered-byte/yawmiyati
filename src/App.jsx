import React, { useState, useEffect, useMemo } from "react";

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
  { ar:"رَبِّ زِدْنِي عِلْمًا", en:"My Lord, increase me in knowledge.", src:"Quran 20:114", cat:"Knowledge" },
  { ar:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", en:"Our Lord, give us good in this world and the Hereafter.", src:"Quran 2:201", cat:"General" },
  { ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ", en:"O Allah, I ask You for pardon and well-being.", src:"Ibn Majah", cat:"Health" },
  { ar:"حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", en:"Allah is sufficient for us, and He is the best Disposer of affairs.", src:"Quran 3:173", cat:"Trust" },
  { ar:"اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", en:"O Allah, help me remember You, be grateful, and worship You well.", src:"Abu Dawud", cat:"Worship" },
  { ar:"رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي", en:"My Lord, expand my breast and ease my task.", src:"Quran 20:25-26", cat:"Ease" },
  { ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ", en:"O Allah, I seek refuge in You from anxiety and grief.", src:"Bukhari", cat:"Anxiety" },
  { ar:"رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ", en:"My Lord, I am in need of whatever good You send down to me.", src:"Quran 28:24", cat:"Need" },
  { ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ", en:"O Allah, I seek refuge in You from disbelief and poverty.", src:"Abu Dawud", cat:"Protection" },
  { ar:"رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ", en:"Our Lord, grant us from our spouses and children comfort and coolness of our eyes.", src:"Quran 25:74", cat:"Family" },
  { ar:"اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ", en:"O Allah, make me of those who repent and make me of those who purify themselves.", src:"Tirmidhi", cat:"Repentance" },
  { ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ", en:"O Allah, I ask You for Paradise and seek refuge in You from the Fire.", src:"Abu Dawud", cat:"Afterlife" },
  { ar:"رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا", en:"Our Lord, do not let our hearts deviate after You have guided us.", src:"Quran 3:8", cat:"Guidance" },
  { ar:"اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي", en:"O Allah, rectify for me my religion which is the safeguard of my affairs.", src:"Muslim", cat:"Religion" },
  { ar:"اللَّهُمَّ بَارِكْ لَنَا فِي رِزْقِنَا", en:"O Allah, bless us in our provision.", src:"Ibn Majah", cat:"Provision" },
  { ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى", en:"O Allah, I ask You for guidance, piety, chastity and self-sufficiency.", src:"Muslim 2721", cat:"Guidance" },
  { ar:"اللَّهُمَّ أَصْلِحْ لِي شَأْنِي كُلَّهُ", en:"O Allah, rectify all my affairs.", src:"Abu Dawud 5090", cat:"General" },
  { ar:"رَبِّ أَعِنِّي وَلَا تُعِنْ عَلَيَّ", en:"My Lord, help me and do not help against me.", src:"Tirmidhi 3551", cat:"Help" },
  { ar:"اللَّهُمَّ اجْعَلِ الْقُرْآنَ رَبِيعَ قَلْبِي", en:"O Allah, make the Quran the spring of my heart.", src:"Ahmad 3712", cat:"Quran" },
  { ar:"يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ", en:"O Ever-Living, O Sustainer, by Your mercy I seek relief.", src:"Tirmidhi 3524", cat:"Distress" },
  { ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ", en:"O Allah, I seek refuge in You from incapacity and laziness.", src:"Bukhari 6367", cat:"Protection" },
  { ar:"رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ", en:"My Lord, inspire me to be grateful for Your favour upon me.", src:"Quran 46:15", cat:"Gratitude" },
  { ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ حُسْنَ الْخَاتِمَةِ", en:"O Allah, I ask You for a good end.", src:"Tabarani", cat:"Afterlife" },
  { ar:"اللَّهُمَّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا", en:"O Allah, forgive me and my parents and have mercy on them.", src:"Quran 71:28", cat:"Family" },
  { ar:"رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا", en:"Our Lord, do not hold us to account if we forget or make mistakes.", src:"Quran 2:286", cat:"Forgiveness" },
  { ar:"اللَّهُمَّ أَلِّفْ بَيْنَ قُلُوبِنَا", en:"O Allah, bring our hearts together.", src:"Abu Dawud 969", cat:"Family" },
  { ar:"رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً", en:"My Lord, grant me from Yourself righteous offspring.", src:"Quran 3:38", cat:"Family" },
  { ar:"اللَّهُمَّ عَافِنِي فِي بَدَنِي وَعَافِنِي فِي سَمْعِي وَعَافِنِي فِي بَصَرِي", en:"O Allah, grant me health in my body, hearing and sight.", src:"Abu Dawud 5090", cat:"Health" },
  { ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا", en:"O Allah, I ask You for beneficial knowledge, good provision and accepted deeds.", src:"Ibn Majah 925", cat:"Worship" },
];

// 99 Names of Allah
const ASMA = [
  {n:1,  ar:"اللَّهُ",        en:"Allah",         meaning:"The Greatest Name"},
  {n:2,  ar:"الرَّحْمَٰنُ",   en:"Ar-Rahman",     meaning:"The Entirely Merciful"},
  {n:3,  ar:"الرَّحِيمُ",     en:"Ar-Raheem",     meaning:"The Especially Merciful"},
  {n:4,  ar:"الْمَلِكُ",      en:"Al-Malik",      meaning:"The Sovereign"},
  {n:5,  ar:"الْقُدُّوسُ",    en:"Al-Quddus",     meaning:"The Perfectly Holy"},
  {n:6,  ar:"السَّلَامُ",     en:"As-Salam",      meaning:"The Source of Peace"},
  {n:7,  ar:"الْمُؤْمِنُ",    en:"Al-Mumin",      meaning:"The Guarantor of Faith"},
  {n:8,  ar:"الْمُهَيْمِنُ",  en:"Al-Muhaymin",   meaning:"The Ever-Watchful Guardian"},
  {n:9,  ar:"الْعَزِيزُ",     en:"Al-Aziz",       meaning:"The All-Mighty"},
  {n:10, ar:"الْجَبَّارُ",    en:"Al-Jabbar",     meaning:"The Compeller"},
  {n:11, ar:"الْمُتَكَبِّرُ", en:"Al-Mutakabbir", meaning:"The Greatest in Pride"},
  {n:12, ar:"الْخَالِقُ",     en:"Al-Khaliq",     meaning:"The Creator"},
  {n:13, ar:"الْبَارِئُ",     en:"Al-Bari",       meaning:"The Originator"},
  {n:14, ar:"الْمُصَوِّرُ",   en:"Al-Musawwir",   meaning:"The Fashioner of Forms"},
  {n:15, ar:"الْغَفَّارُ",    en:"Al-Ghaffar",    meaning:"The Ever-Forgiving"},
  {n:16, ar:"الْقَهَّارُ",    en:"Al-Qahhar",     meaning:"The All-Prevailing One"},
  {n:17, ar:"الْوَهَّابُ",    en:"Al-Wahhab",     meaning:"The Supreme Bestower"},
  {n:18, ar:"الرَّزَّاقُ",    en:"Ar-Razzaq",     meaning:"The Total Provider"},
  {n:19, ar:"الْفَتَّاحُ",    en:"Al-Fattah",     meaning:"The Opener"},
  {n:20, ar:"الْعَلِيمُ",     en:"Al-Alim",       meaning:"The All-Knowing"},
  {n:21, ar:"الْقَابِضُ",     en:"Al-Qabid",      meaning:"The Withholder"},
  {n:22, ar:"الْبَاسِطُ",     en:"Al-Basit",      meaning:"The Extender"},
  {n:23, ar:"الْخَافِضُ",     en:"Al-Khafid",     meaning:"The Reducer"},
  {n:24, ar:"الرَّافِعُ",     en:"Ar-Rafi",       meaning:"The Exalter"},
  {n:25, ar:"الْمُعِزُّ",     en:"Al-Muizz",      meaning:"The Honourer"},
  {n:26, ar:"الْمُذِلُّ",     en:"Al-Mudhill",    meaning:"The Dishonourer"},
  {n:27, ar:"السَّمِيعُ",     en:"As-Sami",       meaning:"The All-Hearing"},
  {n:28, ar:"الْبَصِيرُ",     en:"Al-Basir",      meaning:"The All-Seeing"},
  {n:29, ar:"الْحَكَمُ",      en:"Al-Hakam",      meaning:"The Impartial Judge"},
  {n:30, ar:"الْعَدْلُ",      en:"Al-Adl",        meaning:"The Utterly Just"},
  {n:31, ar:"اللَّطِيفُ",     en:"Al-Latif",      meaning:"The Subtle One"},
  {n:32, ar:"الْخَبِيرُ",     en:"Al-Khabir",     meaning:"The All-Aware"},
  {n:33, ar:"الْحَلِيمُ",     en:"Al-Halim",      meaning:"The Most Forbearing"},
  {n:34, ar:"الْعَظِيمُ",     en:"Al-Azim",       meaning:"The Magnificent"},
  {n:35, ar:"الْغَفُورُ",     en:"Al-Ghafur",     meaning:"The Great Forgiver"},
  {n:36, ar:"الشَّكُورُ",     en:"Ash-Shakur",    meaning:"The Most Appreciative"},
  {n:37, ar:"الْعَلِيُّ",     en:"Al-Ali",        meaning:"The Most High"},
  {n:38, ar:"الْكَبِيرُ",     en:"Al-Kabir",      meaning:"The Most Great"},
  {n:39, ar:"الْحَفِيظُ",     en:"Al-Hafiz",      meaning:"The Preserver"},
  {n:40, ar:"الْمُقِيتُ",     en:"Al-Muqit",      meaning:"The Sustainer"},
  {n:41, ar:"الْحَسِيبُ",     en:"Al-Hasib",      meaning:"The Reckoner"},
  {n:42, ar:"الْجَلِيلُ",     en:"Al-Jalil",      meaning:"The Majestic"},
  {n:43, ar:"الْكَرِيمُ",     en:"Al-Karim",      meaning:"The Most Generous"},
  {n:44, ar:"الرَّقِيبُ",     en:"Ar-Raqib",      meaning:"The Watchful One"},
  {n:45, ar:"الْمُجِيبُ",     en:"Al-Mujib",      meaning:"The Responsive One"},
  {n:46, ar:"الْوَاسِعُ",     en:"Al-Wasi",       meaning:"The All-Encompassing"},
  {n:47, ar:"الْحَكِيمُ",     en:"Al-Hakim",      meaning:"The Perfectly Wise"},
  {n:48, ar:"الْوَدُودُ",     en:"Al-Wadud",      meaning:"The Most Loving"},
  {n:49, ar:"الْمَجِيدُ",     en:"Al-Majid",      meaning:"The Most Glorious"},
  {n:50, ar:"الْبَاعِثُ",     en:"Al-Baith",      meaning:"The Resurrector"},
  {n:51, ar:"الشَّهِيدُ",     en:"Ash-Shahid",    meaning:"The All-Witnessing"},
  {n:52, ar:"الْحَقُّ",       en:"Al-Haqq",       meaning:"The Absolute Truth"},
  {n:53, ar:"الْوَكِيلُ",     en:"Al-Wakil",      meaning:"The Trustee"},
  {n:54, ar:"الْقَوِيُّ",     en:"Al-Qawi",       meaning:"The All-Strong"},
  {n:55, ar:"الْمَتِينُ",     en:"Al-Matin",      meaning:"The Firm One"},
  {n:56, ar:"الْوَلِيُّ",     en:"Al-Wali",       meaning:"The Protecting Friend"},
  {n:57, ar:"الْحَمِيدُ",     en:"Al-Hamid",      meaning:"The Praiseworthy"},
  {n:58, ar:"الْمُحْصِي",     en:"Al-Muhsi",      meaning:"The All-Enumerating"},
  {n:59, ar:"الْمُبْدِئُ",    en:"Al-Mubdi",      meaning:"The Originator"},
  {n:60, ar:"الْمُعِيدُ",     en:"Al-Muid",       meaning:"The Restorer"},
  {n:61, ar:"الْمُحْيِي",     en:"Al-Muhyi",      meaning:"The Giver of Life"},
  {n:62, ar:"الْمُمِيتُ",     en:"Al-Mumit",      meaning:"The Taker of Life"},
  {n:63, ar:"الْحَيُّ",       en:"Al-Hayy",       meaning:"The Ever-Living"},
  {n:64, ar:"الْقَيُّومُ",    en:"Al-Qayyum",     meaning:"The Self-Subsisting"},
  {n:65, ar:"الْوَاجِدُ",     en:"Al-Wajid",      meaning:"The Finder"},
  {n:66, ar:"الْمَاجِدُ",     en:"Al-Majid",      meaning:"The Glorious"},
  {n:67, ar:"الْوَاحِدُ",     en:"Al-Wahid",      meaning:"The One"},
  {n:68, ar:"الْأَحَدُ",      en:"Al-Ahad",       meaning:"The Unique"},
  {n:69, ar:"الصَّمَدُ",      en:"As-Samad",      meaning:"The Eternal"},
  {n:70, ar:"الْقَادِرُ",     en:"Al-Qadir",      meaning:"The All-Powerful"},
  {n:71, ar:"الْمُقْتَدِرُ",  en:"Al-Muqtadir",   meaning:"The Omnipotent"},
  {n:72, ar:"الْمُقَدِّمُ",   en:"Al-Muqaddim",   meaning:"The Expediter"},
  {n:73, ar:"الْمُؤَخِّرُ",   en:"Al-Muakhkhir",  meaning:"The Delayer"},
  {n:74, ar:"الْأَوَّلُ",     en:"Al-Awwal",      meaning:"The First"},
  {n:75, ar:"الْآخِرُ",       en:"Al-Akhir",      meaning:"The Last"},
  {n:76, ar:"الظَّاهِرُ",     en:"Az-Zahir",      meaning:"The Manifest"},
  {n:77, ar:"الْبَاطِنُ",     en:"Al-Batin",      meaning:"The Hidden"},
  {n:78, ar:"الْوَالِي",      en:"Al-Wali",       meaning:"The Governor"},
  {n:79, ar:"الْمُتَعَالِي",  en:"Al-Mutaali",    meaning:"The Self Exalted"},
  {n:80, ar:"الْبَرُّ",       en:"Al-Barr",       meaning:"The Source of Goodness"},
  {n:81, ar:"التَّوَّابُ",    en:"At-Tawwab",     meaning:"The Ever-Pardoning"},
  {n:82, ar:"الْمُنْتَقِمُ",  en:"Al-Muntaqim",   meaning:"The Avenger"},
  {n:83, ar:"الْعَفُوُّ",     en:"Al-Afuww",      meaning:"The Pardoner"},
  {n:84, ar:"الرَّؤُوفُ",     en:"Ar-Rauf",       meaning:"The Most Kind"},
  {n:85, ar:"مَالِكُ الْمُلْكِ",en:"Malik-ul-Mulk",meaning:"Owner of All Sovereignty"},
  {n:86, ar:"ذُو الْجَلَالِ", en:"Dhul-Jalal",    meaning:"Lord of Majesty and Bounty"},
  {n:87, ar:"الْمُقْسِطُ",    en:"Al-Muqsit",     meaning:"The Equitable One"},
  {n:88, ar:"الْجَامِعُ",     en:"Al-Jami",       meaning:"The Gatherer"},
  {n:89, ar:"الْغَنِيُّ",     en:"Al-Ghani",      meaning:"The Self-Sufficient"},
  {n:90, ar:"الْمُغْنِي",     en:"Al-Mughni",     meaning:"The Enricher"},
  {n:91, ar:"الْمَانِعُ",     en:"Al-Mani",       meaning:"The Preventer"},
  {n:92, ar:"الضَّارُّ",      en:"Ad-Darr",       meaning:"The Distresser"},
  {n:93, ar:"النَّافِعُ",     en:"An-Nafi",       meaning:"The Propitious"},
  {n:94, ar:"النُّورُ",       en:"An-Nur",        meaning:"The Light"},
  {n:95, ar:"الْهَادِي",      en:"Al-Hadi",       meaning:"The Guide"},
  {n:96, ar:"الْبَدِيعُ",     en:"Al-Badi",       meaning:"The Incomparable Originator"},
  {n:97, ar:"الْبَاقِي",      en:"Al-Baqi",       meaning:"The Ever-Lasting"},
  {n:98, ar:"الْوَارِثُ",     en:"Al-Warith",     meaning:"The Inheritor"},
  {n:99, ar:"الرَّشِيدُ",     en:"Ar-Rashid",     meaning:"The Guide to the Right Path"},
];

// Daily Quran verses
const QURAN_VERSES = [
  { ar:"إِنَّ مَعَ الْعُسْرِ يُسْرًا",                           en:"Indeed, with hardship comes ease.",                                    src:"94:6"  },
  { ar:"وَاللَّهُ يُحِبُّ الصَّابِرِينَ",                         en:"And Allah loves the patient.",                                         src:"3:146" },
  { ar:"إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",                         en:"Indeed, Allah is with the patient.",                                   src:"2:153" },
  { ar:"وَتَوَكَّلْ عَلَى اللَّهِ وَكَفَىٰ بِاللَّهِ وَكِيلًا",   en:"And put your trust in Allah — Allah is sufficient as Disposer.",      src:"33:3"  },
  { ar:"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",                          en:"For indeed, with hardship will be ease.",                              src:"94:5"  },
  { ar:"وَاللَّهُ خَيْرُ الرَّازِقِينَ",                          en:"And Allah is the best of providers.",                                  src:"62:11" },
  { ar:"وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",                      en:"And He is with you wherever you are.",                                 src:"57:4"  },
  { ar:"قُلْ حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ",           en:"Sufficient for me is Allah; there is no deity except Him.",            src:"9:129" },
  { ar:"وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",            en:"Whoever fears Allah, He will make a way out for him.",                src:"65:2"  },
  { ar:"وَاللَّهُ يَرْزُقُ مَن يَشَاءُ بِغَيْرِ حِسَابٍ",          en:"And Allah provides for whom He wills without account.",                src:"2:212" },
  { ar:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", en:"Our Lord, give us good in this world and the Hereafter.",      src:"2:201" },
  { ar:"إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ",          en:"Indeed, Allah does not allow the reward of the doers of good to be lost.", src:"9:120"},
  { ar:"وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ",  en:"Do not weaken and do not grieve — you will be superior.",             src:"3:139" },
  { ar:"إِنَّ اللَّهَ مَعَ الَّذِينَ اتَّقَوا وَّالَّذِينَ هُم مُّحْسِنُونَ", en:"Indeed, Allah is with those who fear Him and those who do good.", src:"16:128"},
  { ar:"وَفَوْقَ كُلِّ ذِي عِلْمٍ عَلِيمٌ",                        en:"And above every possessor of knowledge is one more knowing.",         src:"12:76" },
  { ar:"يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", en:"O you who believe, seek help through patience and prayer.",   src:"2:153" },
  { ar:"وَاذْكُر رَّبَّكَ كَثِيرًا",                               en:"And remember your Lord much.",                                        src:"3:41"  },
  { ar:"إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ", en:"Indeed, the patient will be given their reward without account.",    src:"39:10" },
  { ar:"وَلَذِكْرُ اللَّهِ أَكْبَرُ",                              en:"And the remembrance of Allah is greater.",                            src:"29:45" },
  { ar:"فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ", en:"Remember Me and I will remember you. Be grateful and do not deny Me.", src:"2:152"},
];

// ── Post-prayer Adhkar data ──────────────────────────────────────────────────
const ADHKAR_POST_PRAYER = [
  { id:"istighfar",    ar:"أَسْتَغْفِرُ اللَّهَ",                                   transliteration:"Astaghfirullah",           en:"I seek forgiveness from Allah",                         count:3,  src:"Muslim 591" },
  { id:"subhanallah",  ar:"سُبْحَانَ اللَّهِ",                                      transliteration:"SubhanAllah",              en:"Glory be to Allah",                                     count:33, src:"Muslim 597" },
  { id:"alhamdulillah",ar:"الْحَمْدُ لِللَّهِ",                                      transliteration:"Alhamdulillah",            en:"All praise is due to Allah",                            count:33, src:"Muslim 597" },
  { id:"allahuakbar",  ar:"اللَّهُ أَكْبَرُ",                                       transliteration:"Allahu Akbar",             en:"Allah is the Greatest",                                 count:34, src:"Muslim 597" },
  { id:"ayat_kursi",   ar:"اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ♥ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ♥ لَهُ مَا فِي السَّمَٰوَاتِ وَمَا فِي الْأَرْضِ ♥ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ♥ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ♥ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ♥ وَسِعَ كُرْسِيُّهُ السَّمَٰوَاتِ وَالْأَرْضَ ♥ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ", transliteration:"Ayat al-Kursi (2:255)", en:"Allah — there is no deity except Him, the Ever-Living, the Sustainer. Neither drowsiness nor sleep overtakes Him. To Him belongs whatever is in the heavens and earth. Who could intercede with Him except by His permission? He knows what is before them and behind them, but they cannot encompass any of His knowledge except what He wills. His Throne extends over the heavens and earth, and preserving them does not tire Him. He is the Most High, the Magnificent.", count:1, src:"Quran 2:255 — Nasai 9928" },
  { id:"tahlil",       ar:"لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ ♥ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ ♥ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", transliteration:"La ilaha illallah wahdah",  en:"None has the right to be worshipped except Allah, alone, without partner. To Him belongs dominion and praise and He is over all things capable.",    count:1,  src:"Muslim 597" },
];
const ADHKAR_MORNING_EVENING = [
  { id:"sayyid",  ar:"اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ ♥ خَلَقْتَنِي وَأَنَا عَبْدُكَ ♥ وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ ♥ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ ♥ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي ♥ فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", transliteration:"Sayyid al-Istighfar", en:"O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant. I am upon Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.", count:1, src:"Bukhari 6306" },
  { id:"asbahna", ar:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ ♥ وَالْحَمْدُ لِلَّهِ ♥ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ ♥ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ ♥ رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ", transliteration:"Asbahna", en:"We have reached the morning and at this very time unto Allah belongs all sovereignty. All praise is for Allah. None has the right to be worshipped except Allah, alone, without partner. To Him belongs the dominion and all praise, and He has power over all things. My Lord, I ask You for the good of this day and the good of what follows it.", count:1, src:"Abu Dawud 5071" },
  { id:"ikhlas",  ar:"قُلْ هُوَ اللَّهُ أَحَدٌ ♥ اللَّهُ الصَّمَدُ ♥ لَمْ يَلِدْ وَلَمْ يُولَدْ ♥ وَلَمْ يَكُن لَهُ كُفُوًا أَحَدٌ", transliteration:"Surah Al-Ikhlas", en:"Say: He is Allah, One. Allah the Eternal Refuge. He neither begets nor is born. Nor is there to Him any equivalent.", count:3, src:"Abu Dawud 5082" },
  { id:"falaq",   ar:"قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ♥ مِن شَرِّ مَا خَلَقَ ♥ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ♥ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ♥ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", transliteration:"Surah Al-Falaq", en:"Say: I seek refuge with the Lord of the daybreak. From the evil of what He created. From the evil of darkness when it settles. From the evil of those who blow on knots. And from the evil of the envier when he envies.", count:3, src:"Abu Dawud 5082" },
  { id:"nas",     ar:"قُلْ أَعُوذُ بِرَبِّ النَّاسِ ♥ مَلِكِ النَّاسِ ♥ إِلَٰهِ النَّاسِ ♥ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ♥ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ♥ مِنَ الْجِنَّةِ وَالنَّاسِ", transliteration:"Surah An-Nas", en:"Say: I seek refuge with the Lord of mankind. The Sovereign of mankind. The God of mankind. From the evil of the whispering retreater. Who whispers into the hearts of mankind. From among jinn and mankind.", count:3, src:"Abu Dawud 5082" },
];
const ADHKAR_SLEEP = [
  { id:"ayat_s",  ar:"اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيَّومُ",   transliteration:"Ayat al-Kursi",    en:"Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence", count:1,  src:"Bukhari 2311" },
  { id:"kafirun", ar:"قُلْ يَا أَيُّهَا الْكَافِرُونَ ♥ لَا أَعْبُدُ مَا تَعْبُدُونَ ♥ وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ ♥ وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ ♥ وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ ♥ لَكُمْ دِينُكُمْ وَلِيَ دِينِ", transliteration:"Surah Al-Kafirun", en:"Say: O you who disbelieve. I do not worship what you worship. Nor are you worshippers of what I worship. Nor will I be a worshipper of what you worship. Nor will you be worshippers of what I worship. For you is your religion, and for me is my religion.", count:1, src:"Abu Dawud 5055" },
  { id:"sub_s",   ar:"سُبْحَانَ اللَّهِ",   transliteration:"SubhanAllah",      en:"Glory be to Allah",            count:33, src:"Bukhari 5362" },
  { id:"ham_s",   ar:"الْحَمْدُ لِللَّهِ",   transliteration:"Alhamdulillah",    en:"All praise is due to Allah",   count:33, src:"Bukhari 5362" },
  { id:"akb_s",   ar:"اللَّهُ أَكْبَرُ",    transliteration:"Allahu Akbar",     en:"Allah is the Greatest",        count:34, src:"Bukhari 5362" },
  { id:"bismika", ar:"بِاسْمِكَ اللَّهُمَّ أَحْيَا وَأَمُوتُ",  transliteration:"Bismika Allahumma",en:"In Your name, O Allah, I live and die", count:1, src:"Bukhari 6324" },
];
const ADHKAR_ADHAN = [
  { id:"repeat",  ar:"أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ",  transliteration:"Repeat after muadhin",           en:"Repeat each phrase after the muadhin (say La hawla instead of Hayya alas-Salah)", count:1, src:"Bukhari 611" },
  { id:"lahawla", ar:"لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", transliteration:"La hawla wala quwwata",           en:"There is no power or might except with Allah (say this when muadhin says Hayya alas-Salah)", count:1, src:"Muslim 385" },
  { id:"salawat", ar:"اللَّهُمَّ صَلَّ عَلَى مُحَمَّدٍ",  transliteration:"Allahumma salli ala Muhammad",   en:"O Allah, send blessings upon Muhammad", count:1, src:"Muslim 384" },
  { id:"dua_adh", ar:"اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ ♥ وَالصَّلَاةِ الْقَائِمَةِ ♥ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ ♥ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ", transliteration:"Allahumma Rabba hadhihid-da'wah", en:"O Allah, Lord of this perfect call and the prayer to be offered, grant Muhammad the intercession and the elevated position, and raise him to the praiseworthy station that You have promised him.", count:1, src:"Bukhari 614" },
];
const ADHKAR_SALAH_DUAS = {
  Fajr:    { ar:"اللَّهُمَّ إِنَّي أَسْأَلُكَ عِلْمًا نَافِعًا ♥ وَرِزْقًا طَيَّبًا ♥ وَعَمَلًا مُتَقَبَّلًا", transliteration:"Allahumma inni as'aluka ilman nafi'a", en:"O Allah, I ask You for beneficial knowledge, good provision and accepted deeds", src:"Ibn Majah 925" },
  Dhuhr:   { ar:"اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ ♥ وَعَلَى آلِ مُحَمَّدٍ ♥ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ ♥ إِنَّكَ حَمِيدٌ مَجِيدٌ ♥ اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ ♥ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ ♥ إِنَّكَ حَمِيدٌ مَجِيدٌ", transliteration:"Allahumma salli ala Muhammad", en:"O Allah, send blessings upon Muhammad and the family of Muhammad, as You sent blessings upon Ibrahim and the family of Ibrahim. Indeed You are Praiseworthy and Glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrahim and the family of Ibrahim. Indeed You are Praiseworthy and Glorious.", src:"Bukhari 3370" },
  Asr:     { ar:"رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا ♥ وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً", transliteration:"Rabbana la tuzigh qulubana", en:"Our Lord, do not let our hearts deviate after You have guided us. And grant us from Yourself mercy.", src:"Quran 3:8" },
  Maghrib: { ar:"اللَّهُمَّ إِنَّي أَسْأَلُكَ جَنَّتَكَ ♥ وَأَعُوذُ بِكَ مِنْ نَارِكَ", transliteration:"Allahumma inni as'aluka jannatak", en:"O Allah, I ask You for Paradise and seek Your protection from the Hellfire", src:"Abu Dawud 792" },
  Isha:    { ar:"اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ ♥ وَوَجَّهْتُ وَجْهِي إِلَيْكَ ♥ وَفَوَّضْتُ أَمْرِي إِلَيْكَ ♥ وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ ♥ رَغْبَةً وَرَهْبَةً إِلَيْكَ ♥ لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ ♥ آمَنْتُ بِكِتَابِكَ الَّذِي أَنزَلْتَ وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ", transliteration:"Allahumma aslamtu nafsi ilayk", en:"O Allah, I have submitted my soul to You, turned my face to You, entrusted my affairs to You, and relied upon You, in hope and fear of You. There is no refuge or escape from You except to You. I believe in Your Book which You revealed and Your Prophet whom You sent.", src:"Bukhari 247" },
};

// ── Adhkar Counter Component ──────────────────────────────────────────────────
// ── Tasbih click sound using Web Audio API ────────────────────────────────────
function playTasbihClick(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === "complete") {
      // Completion — soft rising tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "alldone") {
      // All done — gentle chime
      [440, 550, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i*0.12);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i*0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i*0.12 + 0.4);
        osc.start(ctx.currentTime + i*0.12);
        osc.stop(ctx.currentTime + i*0.12 + 0.4);
      });
    } else {
      // Normal tap — short woody click
      const bufSize = ctx.sampleRate * 0.04;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 8);
      }
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      src.buffer = buf;
      filter.type = "bandpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.8;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.6;
      src.start();
    }
  } catch(e) {}
}

function AdhkarCounter({ items, title, onBack, onComplete, T, GOLD }) {
  const [ticked, setTicked] = React.useState(new Set());
  const allDone = items.length > 0 && ticked.size >= items.length;
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (allDone && !firedRef.current) {
      firedRef.current = true;
      if (onComplete) onComplete();
    }
  }, [allDone]); // eslint-disable-line

  function tick(id) {
    setTicked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  return (
    <div style={{ padding:"10px 14px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer",
          color:T.muted, fontSize:12, fontFamily:"sans-serif", display:"flex", alignItems:"center", gap:4 }}>
          ← Back
        </button>
        <span style={{ fontSize:11, fontFamily:"sans-serif",
          color:allDone?"#16a34a":T.muted, fontWeight:allDone?700:400 }}>
          {allDone ? "✓ All done" : ticked.size + "/" + items.length}
        </span>
      </div>

      <div style={{ fontSize:13, fontWeight:700, color:GOLD, fontFamily:"'Lora',serif",
        textAlign:"center", marginBottom:8 }}>{title}</div>

      <div style={{ height:4, background:T.alt, borderRadius:2, overflow:"hidden", marginBottom:14 }}>
        <div style={{ height:"100%", borderRadius:2,
          background:"linear-gradient(to right,"+GOLD+",#16a34a)",
          width:(items.length ? Math.round((ticked.size/items.length)*100) : 0)+"%",
          transition:"width 0.3s ease" }} />
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:allDone?90:16 }}>
        {items.map(function(item) {
          const done = ticked.has(item.id);
          return (
            <button key={item.id} onClick={() => tick(item.id)} style={{
              width:"100%", padding:"14px",
              background: done ? "#16a34a12" : T.card,
              border:"2px solid "+(done ? "#16a34a66" : T.border),
              borderRadius:14, cursor:"pointer", textAlign:"right",
              transition:"all 0.18s",
            }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  {item.count > 1 && (
                    <div style={{ textAlign:"left", marginBottom:6 }}>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10,
                        background: done ? "#16a34a22" : GOLD+"22",
                        color: done ? "#16a34a" : GOLD,
                        fontFamily:"sans-serif", fontWeight:700 }}>×{item.count}</span>
                    </div>
                  )}
                  {item.ar.split("♥").map(function(phrase, pi) {
                    const parts = item.ar.split("♥");
                    const fs = item.ar.length > 200 ? 15 : item.ar.length > 100 ? 17 : item.ar.length > 50 ? 20 : 24;
                    return (
                      <div key={pi} style={{
                        fontSize:fs, lineHeight:"2.2", direction:"rtl",
                        fontFamily:"'Amiri Quran','Amiri',serif",
                        color: done ? T.muted : T.text,
                        paddingBottom: pi < parts.length-1 ? 4 : 0,
                        borderBottom: pi < parts.length-1 ? "1px solid "+T.border+"44" : "none",
                        marginBottom: pi < parts.length-1 ? 4 : 0,
                      }}>{phrase.trim()}</div>
                    );
                  })}
                  <div style={{ fontSize:10, color:done?"#16a34a":GOLD, fontFamily:"sans-serif",
                    fontWeight:600, letterSpacing:0.5, marginTop:6, textAlign:"left" }}>
                    {item.transliteration}
                  </div>
                  <div style={{ fontSize:11, color:T.muted, fontStyle:"italic",
                    fontFamily:"sans-serif", marginTop:3, textAlign:"left", lineHeight:"1.5" }}>
                    {item.en}
                  </div>
                  <div style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif",
                    marginTop:2, textAlign:"left" }}>— {item.src}</div>
                </div>
                <div style={{ flexShrink:0, width:26, height:26, borderRadius:7, marginTop:4,
                  background: done ? "#16a34a" : "transparent",
                  border:"2px solid "+(done ? "#16a34a" : T.border),
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all 0.18s", fontSize:14, color:"#fff" }}>
                  {done ? "✓" : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {allDone && (
        <div style={{ position:"fixed", bottom:72, left:"50%", transform:"translateX(-50%)",
          width:"calc(100% - 28px)", maxWidth:452, zIndex:30 }}>
          <button onClick={onBack} style={{
            width:"100%", padding:"14px", background:"#16a34a", border:"none",
            borderRadius:14, color:"#fff", fontSize:14, fontWeight:700,
            fontFamily:"'Lora',serif", cursor:"pointer",
            boxShadow:"0 4px 16px #16a34a44",
          }}>الحمد لله · Done ✓</button>
        </div>
      )}
    </div>
  );
}

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
// HIJRI is fetched dynamically inside the component via Aladhan API
const HIJRI_FALLBACK = toHijri(TODAY);
const IS_WHITE  = HIJRI_FALLBACK.day >= 13 && HIJRI_FALLBACK.day <= 15;
const IS_FAST   = IS_MON || IS_THU || IS_WHITE;

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

const RAMADAN_TASKS_BASE = [
  { id:"ram_fast", section:"Ramadan", label:"Ramadan Fast", ar:"صوم رمضان", icon:"🌙" },
];

const OTHER_TASKS = [
  { id:"jumuah_prayer", section:"Jumuah", label:"Jumu'ah Prayer", ar:"صلاة الجمعة", icon:"🕌", friday:true, note:"Replaces Dhuhr" },
  { id:"jumuah_kahf", section:"Jumuah", label:"Surah Al-Kahf", ar:"سورة الكهف", icon:"📜", friday:true, note:"Light between two Fridays" },
  { id:"adhkar_morning", section:"Adhkar", label:"Morning Adhkar", ar:"أذكار الصباح", icon:"📿" },
  { id:"adhkar_evening", section:"Adhkar", label:"Evening Adhkar", ar:"أذكار المساء", icon:"📿" },
  { id:"adhkar_sleep", section:"Adhkar", label:"Sleep Adhkar", ar:"أذكار النوم", icon:"🌛" },
  { id:"quran_recite", section:"Quran", label:"Quran Recitation", ar:"تلاوة القرآن", icon:"📖" },
  { id:"sadaqah_daily", section:"Charity", label:"Daily Sadaqah", ar:"الصدقة اليومية", icon:"🤲" },
  { id:"fast_today", section:"Fasting",
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

// ── Kids themes ──────────────────────────────────────────────────────────────
const KIDS_THEME = {
  little: {
    bg:"#fffbea", card:"#ffffff", alt:"#fff8d6",
    border:"#fcd34d", borderL:"#fde68a",
    text:"#92400e", sub:"#b45309", muted:"#d97706",
    gold:"#f59e0b", accent:"#ec4899",
    salahBg:"#fdf2f8", salahAc:"#db2777", salahBd:"#fbcfe8",
    headerBg:"linear-gradient(135deg,#f59e0b,#ec4899)",
    fontSize:18, iconSize:30, rowPad:"15px 16px",
  },
  older: {
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
  eid_prayer:20,
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
  { id:"masjid_regular", icon:"🕌", label:"Masjid Regular",  desc:"Prayed all 5 in Masjid in a day", check:(hist) => Object.values(hist).some(function(h){ const m=h._masjid||[]; return m.length>=5; }) },
];

// ── Gamified adult theme ───────────────────────────────────────────────────────
const GAMIFIED_THEME = {
  light: {
    bg:"#f5f3ff", card:"#ffffff", alt:"#ede9fe",
    border:"#c4b5fd", borderL:"#ddd6fe",
    text:"#1e1b4b", sub:"#4338ca", muted:"#a5b4fc",
    gold:"#6366f1", accent:"#8b5cf6",
    salahBg:"#eef2ff", salahAc:"#4f46e5", salahBd:"#c7d2fe",
    headerBg:"linear-gradient(135deg,#4f46e5,#7c3aed)",
  },
  dark: {
    bg:"#0f0e1a", card:"#1a1830", alt:"#221f38",
    border:"#312e5a", borderL:"#28254a",
    text:"#e8e4ff", sub:"#9896d8", muted:"#5a5880",
    gold:"#818cf8", accent:"#a78bfa",
    salahBg:"#0d1326", salahAc:"#818cf8", salahBd:"#312e5a",
    headerBg:"linear-gradient(135deg,#312e81,#4c1d95)",
  },
};

// ── Qibla Finder ─────────────────────────────────────────────────────────────
function QiblaFinder({ T, GOLD }) {
  const [angle,         setAngle]         = React.useState(null);
  const [heading,       setHeading]       = React.useState(null);
  const [error,         setError]         = React.useState(null);
  const [loading,       setLoading]       = React.useState(false);
  const [compassActive, setCompassActive] = React.useState(false);
  const listenerRef = React.useRef(null);

  React.useEffect(() => {
    return function() {
      if (listenerRef.current) {
        window.removeEventListener("deviceorientation", listenerRef.current);
        window.removeEventListener("deviceorientationabsolute", listenerRef.current);
      }
    };
  }, []);

  function startCompass() {
    const handler = function(e) {
      const h = e.webkitCompassHeading != null
        ? e.webkitCompassHeading
        : (e.absolute && e.alpha != null ? e.alpha : null);
      if (h !== null) { setHeading(Math.round(h)); setCompassActive(true); }
    };
    listenerRef.current = handler;
    window.addEventListener("deviceorientationabsolute", handler, { passive:true });
    window.addEventListener("deviceorientation", handler, { passive:true });
  }

  function getQibla() {
    setLoading(true); setError(null);
    if (!navigator.geolocation) { setError("Geolocation not supported"); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(function(pos) {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const KAABA_LAT = 21.4225;
      const KAABA_LNG = 39.8262;
      const dLng = (KAABA_LNG - lng) * Math.PI / 180;
      const lat1 = lat * Math.PI / 180;
      const lat2 = KAABA_LAT * Math.PI / 180;
      const y = Math.sin(dLng) * Math.cos(lat2);
      const x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLng);
      const qiblaAngle = ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
      setAngle(Math.round(qiblaAngle));
      setLoading(false);
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission().then(function(perm) {
          if (perm === "granted") startCompass();
          else setError("Compass permission denied. Showing static direction.");
        }).catch(function() { startCompass(); });
      } else {
        startCompass();
      }
    }, function() { setError("Could not get location. Please enable location access."); setLoading(false); });
  }

  return (
    <div>
      {!angle && !loading && (
        <div style={{ textAlign:"center", padding:"20px 0" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🧭</div>
          <div style={{ fontSize:14, color:T.text, fontFamily:"'Lora',serif", marginBottom:6 }}>Find the Qibla</div>
          <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginBottom:20, lineHeight:"1.6" }}>
            Uses your location to calculate the direction of the Kaaba in Makkah
          </div>
          <button onClick={getQibla} style={{ padding:"12px 28px", background:GOLD, border:"none",
            borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lora',serif" }}>
            Find Qibla Direction
          </button>
        </div>
      )}
      {loading && (
        <div style={{ textAlign:"center", padding:"40px 0", color:T.muted, fontFamily:"sans-serif" }}>
          Getting location...
        </div>
      )}
      {error && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10,
          padding:"12px 14px", fontSize:12, color:"#dc2626", fontFamily:"sans-serif" }}>
          ⚠️ {error}
        </div>
      )}
      {angle !== null && !loading && (
        <div style={{ textAlign:"center" }}>
          <div style={{ position:"relative", width:240, height:240, margin:"0 auto 16px" }}>
            <svg width="240" height="240" viewBox="0 0 240 240" style={{ position:"absolute", top:0, left:0 }}>
              <circle cx="120" cy="120" r="115" fill="none" stroke={T.border} strokeWidth="1.5"/>
            </svg>
            <div style={{ position:"absolute", inset:0, transform:"rotate("+(-heading||0)+"deg)", transition:"transform 0.15s linear" }}>
              <svg width="240" height="240" viewBox="0 0 240 240">
                <circle cx="120" cy="120" r="110" fill={T.alt} stroke={T.border} strokeWidth="1"/>
                {[["N",0,GOLD],["E",90,T.muted],["S",180,T.muted],["W",270,T.muted]].map(([d,deg,col]) => {
                  const a = deg * Math.PI / 180;
                  const x = 120 + 93 * Math.sin(a);
                  const y = 120 - 93 * Math.cos(a);
                  return <text key={d} x={x} y={y+5} textAnchor="middle" fontSize="14" fontWeight="800" fill={col} fontFamily="sans-serif">{d}</text>;
                })}
                {Array.from({length:36},(_,i) => {
                  const a = i*10*Math.PI/180;
                  const r1 = i%9===0?105:i%3===0?107:109;
                  return <line key={i} x1={120+r1*Math.sin(a)} y1={120-r1*Math.cos(a)} x2={120+110*Math.sin(a)} y2={120-110*Math.cos(a)} stroke={T.border} strokeWidth={i%9===0?2:1}/>;
                })}
              </svg>
            </div>
            <div style={{ position:"absolute", inset:0, transform:"rotate("+(angle||0)+"deg)", transition:"transform 0.3s ease" }}>
              <svg width="240" height="240" viewBox="0 0 240 240">
                <polygon points="120,18 113,120 127,120" fill={GOLD} opacity="0.95"/>
                <polygon points="120,222 113,120 127,120" fill={T.muted} opacity="0.5"/>
                <circle cx="120" cy="120" r="6" fill={GOLD}/>
                <circle cx="120" cy="120" r="3" fill="#fff"/>
                <text x="120" y="14" textAnchor="middle" fontSize="16">🕋</text>
              </svg>
            </div>
          </div>
          <div style={{ fontSize:26, fontWeight:800, color:GOLD, fontFamily:"sans-serif", marginBottom:4 }}>{angle}°</div>
          <div style={{ fontSize:13, color:T.sub, fontFamily:"sans-serif", marginBottom:4 }}>Qibla is {angle}° from North</div>
          <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginBottom:16,
            padding:"6px 12px", background:compassActive?GOLD+"15":T.alt, borderRadius:8, display:"inline-block",
            border:"1px solid "+(compassActive?GOLD+"44":T.border) }}>
            {compassActive ? "🧭 Live · point 🕋 away from you" : "📍 Static · compass unavailable — rotate manually"}
          </div>
          <div/>
          <button onClick={getQibla} style={{ padding:"8px 20px", background:T.alt, border:"1px solid "+T.border,
            borderRadius:10, color:T.muted, cursor:"pointer", fontSize:12, fontFamily:"sans-serif", marginBottom:0 }}>
            ↺ Recalculate
          </button>
          <div style={{ background:GOLD+"10", borderRadius:12, border:"1px solid "+GOLD+"33",
            padding:"12px 14px", marginTop:14, textAlign:"center" }}>
            <div style={{ fontSize:13, color:GOLD, fontFamily:"'Amiri',serif", direction:"rtl", lineHeight:"2", marginBottom:4 }}>
              فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ
            </div>
            <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", fontStyle:"italic" }}>
              "Turn your face toward the Sacred Mosque" — Quran 2:144
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




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
  PRAYERS.forEach(p => p.rows.forEach(r => {
    if (r.ramadan && !isRamadan) return; // don't count tarawih outside Ramadan
    ids.push(r.id);
  }));
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
  const [onboardStep, setOnboardStep] = useState(() => load("yawm_onboarded", false) ? null : 0);
  function finishOnboard() { save("yawm_onboarded", true); setOnboardStep(null); }
  const [gender, setGender]   = useState(() => load("yawm_gender", "male"));
  const [fontScale, setFontScale] = useState(() => load("yawm_font_scale", 1.0));
  const [isExempt, setIsExempt] = useState(() => load("yawm_exempt_" + (new Date().toISOString().slice(0,10)), false));
  function toggleExempt() {
    const next = !isExempt;
    setIsExempt(next);
    save("yawm_exempt_" + TODAY_KEY, next);
  }
  const [tab, setTab]         = useState("today");
  const [todayTab, setTodayTab] = useState("salah"); // "salah" | "deeds"
  const [customs, setCustoms] = useState(() => load("yawm_custom", []));
  // Mode declared early so hist/notes can use it
  const [mode, setMode]       = useState(() => load("yawm_mode", "classic"));
  const kidsMode = mode === "kids";
  const [classicHist, setClassicHist] = useState(() => {
    const existing = load("yawm_hist_classic", null);
    if (existing) return existing;
    // Migrate from old shared history — copy to classic only
    const legacy = load("yawm_hist", {});
    if (Object.keys(legacy).length > 0) {
      save("yawm_hist_classic", legacy);
    }
    return legacy;
  });
  const [journeyHist, setJourneyHist] = useState(() => {
    // Journey starts from classic — no separate migration from old shared key
    return load("yawm_hist_journey", {});
  });
  // Classic is source of truth — Journey reads from classic merged with journey extras
  // Journey-only keys (bonus deeds not in classic checklist)
  const JOURNEY_ONLY_IDS = useMemo(() => new Set(["tahajjud_pray"]), []);
  const hist = useMemo(() => {
    if (mode !== "gamified") return classicHist;
    const merged = {};
    const allDays = new Set([...Object.keys(classicHist), ...Object.keys(journeyHist)]);
    allDays.forEach(day => {
      const c = classicHist[day] || {};
      const j = journeyHist[day] || {};
      const dayMerged = { ...c };
      JOURNEY_ONLY_IDS.forEach(id => { if (j[id]) dayMerged[id] = true; });
      merged[day] = dayMerged;
    });
    return merged;
  }, [mode, classicHist, journeyHist, JOURNEY_ONLY_IDS]);
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
  const [kidsEnabledTasks, setKidsEnabledTasks] = useState(() => load("yawm_kids_tasks", ALL_KIDS_TASKS.map(t => t.id)));
  const [adultPoints, setAdultPoints] = useState(() => load("yawm_adult_pts", {}));
  const [kidsPoints, setKidsPoints]     = useState(() => load("yawm_kids_pts", {}));
  const [kidsChecked, setKidsChecked]   = useState(() => load("yawm_kids_" + TODAY_KEY, {}));
  const [confetti, setConfetti]         = useState(false);
  const [kidsTab, setKidsTab]           = useState("deeds");
  const [kidsSubTab, setKidsSubTab]     = useState("salah"); // "salah" | "deeds"
  const kidsStreak = useMemo(() => {
    let s = 0, d = new Date(TODAY);
    for (let i = 0; i < 365; i++) {
      const k = "yawm_kids_" + dateStr(d);
      try {
        const h = JSON.parse(localStorage.getItem(k) || "{}");
        let qualified = false;
        if (kidsAge === "little") {
          // Grace: streak counts if at least half the enabled deeds are done
          const enC = ALL_KIDS_TASKS.length;
          const dC  = ALL_KIDS_TASKS.filter(t => h[t.id]).length;
          qualified = enC > 0 && dC >= Math.ceil(enC / 2);
        } else {
          const fardIds = KIDS_PRAYERS.flatMap(p => p.rows.filter(r=>r.type==="F").map(r=>r.id));
          qualified = fardIds.length > 0 && fardIds.every(id => h[id]);
        }
        if (qualified) s++;
        else break;
      } catch(e) { break; }
      d = addDays(d, -1);
    }
    return s;
  }, [kidsChecked, kidsAge]); // eslint-disable-line react-hooks/exhaustive-deps
  const [adhkarScreen, setAdhkarScreen] = useState("home");   // home | select | count

  // ── Masjid / Jamaah state ──────────────────────────────────────────────────
  const [masjidPrayers, setMasjidPrayers] = useState(() => load("yawm_masjid_" + (new Date().toISOString().slice(0,10)), []));
  function toggleMasjid(prayerId, fardRowIds) {
    const isOn = masjidPrayers.includes(prayerId);
    let next;
    if (isOn) {
      next = masjidPrayers.filter(id => id !== prayerId);
    } else {
      next = [...masjidPrayers, prayerId];
      // Auto-tick all fard rows for this prayer via hist
      const updatedChecked = { ...(hist[TODAY_KEY] || {}) };
      fardRowIds.forEach(id => { updatedChecked[id] = true; });
      const h2 = { ...hist, [TODAY_KEY]: updatedChecked };
      if (mode === "gamified") { setJourneyHist(h2); save("yawm_hist_journey", h2); }
      else { setClassicHist(h2); save("yawm_hist_classic", h2); }
      // Bonus points in Journey
      if (mode === "gamified") {
        const bonus = fardRowIds.length * 5;
        setAdultPoints(prev => {
          const k = TODAY_KEY;
          const updated = { ...prev, [k]: (prev[k] || 0) + bonus };
          save("yawm_adult_pts", updated);
          return updated;
        });
      }
    }
    setMasjidPrayers(next);
    save("yawm_masjid_" + TODAY_KEY, next);
  }
  const jamaahStreak = useMemo(() => {
    let s = 0, d = new Date(TODAY);
    for (let i = 0; i < 365; i++) {
      const k = dateStr(d);
      const m = load("yawm_masjid_" + k, []);
      if (m.length > 0) s++; else break;
      d = addDays(d, -1);
    }
    return s;
  }, [masjidPrayers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Muhasaba state ──────────────────────────────────────────────────────────
  const MH_KEY = "yawm_muhasaba_" + TODAY_KEY;
  function loadMH() { try { return JSON.parse(localStorage.getItem(MH_KEY) || "null") || {}; } catch(e) { return {}; } }
  function saveMH(data) { try { localStorage.setItem(MH_KEY, JSON.stringify(data)); } catch(e) {} }
  const initMH = loadMH();
  const [mhMood,      setMhMood]      = useState(initMH.mood      || null);
  const [mhGood,      setMhGood]      = useState(initMH.good      || "");
  const [mhImprove,   setMhImprove]   = useState(initMH.improve   || "");
  const [mhGrateful,  setMhGrateful]  = useState(initMH.grateful  || "");
  const [mhIstighfar, setMhIstighfar] = useState(initMH.istighfar || false);
  const [mhSaved,     setMhSaved]     = useState(!!initMH.saved);
  function saveMuhasaba() {
    const data = { mood:mhMood, good:mhGood, improve:mhImprove, grateful:mhGrateful, istighfar:mhIstighfar, saved:true };
    saveMH(data);
    setMhSaved(true);
  }
  const [adhkarPrayer, setAdhkarPrayer] = useState(null);
  const [adhkarSetKey, setAdhkarSetKey] = useState(null);
  // Track which adhkar sets completed today: Set of "prayer_setkey" strings
  const [adhkarDone, setAdhkarDone] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("yawm_adhkar_done_"+TODAY_KEY)||"[]")); }
    catch(e) { return new Set(); }
  });
  function markAdhkarDone(key) {
    setAdhkarDone(prev => {
      const next = new Set(prev); next.add(key);
      try { localStorage.setItem("yawm_adhkar_done_"+TODAY_KEY, JSON.stringify([...next])); } catch(e) {}
      return next;
    });
  }

  const T  = mode === "gamified" ? GAMIFIED_THEME[theme] : TH[theme];
  const SS = theme === "light" ? SEC_STYLE_L : SEC_STYLE_D;
  const KT = KIDS_THEME[kidsAge];
  const GOLD = T.gold;
  const IS_RAMADAN   = hijri.month === 9;
  const IS_EID_FITR  = hijri.month === 10 && hijri.day === 1;
  const IS_EID_ADHA  = hijri.month === 12 && hijri.day === 10;
  const IS_EID       = IS_EID_FITR || IS_EID_ADHA;
  const EID_NAME     = IS_EID_FITR ? "Eid al-Fitr" : "Eid al-Adha";
  const EID_AR       = IS_EID_FITR ? "عِيدُ الْفِطْر" : "عِيدُ الْأَضْحَى";
  const EID_TAKBEER  = IS_EID_FITR
    ? "اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ لَا إِلَهَ إِلَّا اللَّهُ ♥ وَاللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ"
    : "اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ ♥ لَا إِلَهَ إِلَّا اللَّهُ ♥ وَاللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ";

  // Prayer times state
  const [prayerTimes, setPrayerTimes]   = useState(null);
  const [prayerError, setPrayerError]   = useState(null);
  const [isOnline,    setIsOnline]      = useState(() => navigator.onLine);
  useEffect(function() {
    function handleOnline()  { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return function() { window.removeEventListener("online",handleOnline); window.removeEventListener("offline",handleOffline); };
  }, []);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [calcMethod, setCalcMethod]     = useState(() => load("yawm_calc", 3));   // 3=MWL default
  const [madhab, setMadhab]             = useState(() => load("yawm_madhab", 1)); // 1=Shafi, 0=Hanafi
  const [notifEnabled, setNotifEnabled] = useState(() => load("yawm_notif", false));
  const [notifOffset,  setNotifOffset]  = useState(() => load("yawm_notif_offset", 0));
  const [tasbihCount,  setTasbihCount]  = useState(0);

  // ── Garden placement state ────────────────────────────────────────────────
  const GARDEN_LAYOUT_KEY = "yawm_garden_layout_" + TODAY_KEY;
  const [gardenLayout, setGardenLayout] = useState(() => load(GARDEN_LAYOUT_KEY, {}));
  const [pendingItem,  setPendingItem]  = useState(null); // { key, emoji, label } waiting to be placed
  const [gardenMsg,    setGardenMsg]    = useState(null); // toast message

  function saveGardenLayout(next) {
    setGardenLayout(next);
    save(GARDEN_LAYOUT_KEY, next);
  }
  function earnGardenItem(key, emoji, label) {
    // Only earn if not already placed and not already pending
    if (gardenLayout[key]) return;
    setPendingItem({ key, emoji, label });
    setGardenMsg("You earned " + emoji + " " + label + "! Go to your garden to place it 🌱");
    setTimeout(() => setGardenMsg(null), 3500);
  }
  function placeItem(key, emoji, xPct, yPct) {
    const next = { ...gardenLayout, [key]: { emoji, x: xPct, y: yPct } };
    saveGardenLayout(next);
    setPendingItem(null);
  }
  function removeItem(key) {
    const next = { ...gardenLayout };
    delete next[key];
    saveGardenLayout(next);
  }

  // Kids garden placement (separate layout)
  const KIDS_GARDEN_KEY = "yawm_kids_garden_" + TODAY_KEY;
  const [kidsGardenLayout, setKidsGardenLayout] = useState(() => load(KIDS_GARDEN_KEY, {}));
  const [kidsPendingItem,  setKidsPendingItem]  = useState(null);
  const [kidsGardenMsg,    setKidsGardenMsg]    = useState(null);

  function saveKidsGardenLayout(next) {
    setKidsGardenLayout(next);
    save(KIDS_GARDEN_KEY, next);
  }
  function placeKidsItem(key, emoji, xPct, yPct) {
    const next = { ...kidsGardenLayout, [key]: { emoji, x: xPct, y: yPct } };
    saveKidsGardenLayout(next);
    setKidsPendingItem(null);
  }
  const [tasbihTarget, setTasbihTarget] = useState(33);
  const [duaCatFilter, setDuaCatFilter] = useState(null);
  const [namesFlipped, setNamesFlipped] = useState(new Set());
  const [settingsPage, setSettingsPage] = useState(0);
  const [tasbihPhrase, setTasbihPhrase] = useState(0); // 0=SubhanAllah,1=Alhamdulillah,2=AllahuAkbar
  const [tasbihFlash,  setTasbihFlash]  = useState(false);
  const [uncheckConfirm, setUncheckConfirm] = useState(false);
  const [installPrompt, setInstallPrompt]   = useState(null);
  const [showInstall,   setShowInstall]     = useState(false);

  // Capture the beforeinstallprompt event
  useEffect(() => {
    function handler(e) {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const TASBIH_PHRASES = [
    { ar:"سُبْحَانَ اللَّهِ",  tr:"SubhanAllah",   en:"Glory be to Allah",         color:"#16a34a" },
    { ar:"الْحَمْدُ لِلَّهِ", tr:"Alhamdulillah", en:"All praise is due to Allah", color:"#0369a1" },
    { ar:"اللَّهُ أَكْبَرُ",  tr:"Allahu Akbar",   en:"Allah is the Greatest",     color:GOLD      },
  ];
  function tasbihTap() {
    if (navigator.vibrate) navigator.vibrate(18);
    playTasbihClick("tap");
    const next = tasbihCount + 1;
    setTasbihCount(next);
    if (next >= tasbihTarget) {
      setTasbihFlash(true);
      playTasbihClick("complete");
      if (navigator.vibrate) navigator.vibrate([60,40,60]);
      setTimeout(() => {
        setTasbihFlash(false);
        setTasbihCount(0);
        // Auto-advance to next phrase in 33-33-34 sequence
        if (tasbihTarget === 33 && tasbihPhrase === 0) { setTasbihPhrase(1); }
        else if (tasbihTarget === 33 && tasbihPhrase === 1) { setTasbihPhrase(2); setTasbihTarget(34); }
        else { setTasbihPhrase(0); setTasbihTarget(33); }
      }, 900);
    }
  } // mins before prayer

  async function requestNotifications() {
    if (!("Notification" in window)) { alert("Notifications not supported on this device."); return; }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifEnabled(true);
      save("yawm_notif", true);
      scheduleNotifications();
      // Confirmation ping
      setTimeout(() => {
        new Notification("يَوْم · Yawm", {
          body:"Prayer notifications enabled. JazakAllah khayran! 🌙",
          icon:"/icon-192.png"
        });
      }, 500);
    } else {
      setNotifEnabled(false);
      save("yawm_notif", false);
    }
  }

  function disableNotifications() {
    setNotifEnabled(false);
    save("yawm_notif", false);
  }

  function scheduleNotifications() {
    if (!prayerTimes || !("serviceWorker" in navigator)) return;
    const PRAYER_MAP = [
      { id:"fajr",    name:"Fajr",    key:"Fajr",    body:"الفجر · Time for Fajr prayer 🌙" },
      { id:"dhuhr",   name:"Dhuhr",   key:"Dhuhr",   body:"الظهر · Time for Dhuhr prayer ☀️" },
      { id:"asr",     name:"Asr",     key:"Asr",     body:"العصر · Time for Asr prayer 🌤️" },
      { id:"maghrib", name:"Maghrib", key:"Maghrib", body:"المغرب · Time for Maghrib prayer 🌆" },
      { id:"isha",    name:"Isha",    key:"Isha",    body:"العشاء · Time for Isha prayer 🌃" },
    ];
    const prayers = PRAYER_MAP.map(function(p) {
      const t = prayerTimes[p.key];
      if (!t) return null;
      const [h, m] = t.split(":").map(Number);
      const today = new Date();
      const pTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0);
      pTime.setMinutes(pTime.getMinutes() - (notifOffset || 0));
      return { id:p.id, name:p.name, body:p.body, time:pTime.getTime() };
    }).filter(Boolean);
    navigator.serviceWorker.ready.then(function(sw) {
      sw.active.postMessage({ type:"SCHEDULE_NOTIFICATIONS", prayers });
    });
  }

  // Schedule notifications whenever prayer times load
  useEffect(function() {
    if (notifEnabled && prayerTimes) scheduleNotifications();
  }, [prayerTimes, notifEnabled, notifOffset]); // eslint-disable-line
  const [locationName, setLocationName] = useState(null);
  const [now, setNow]                   = useState(new Date());

  useEffect(() => { save("yawm_theme", theme); }, [theme]);
  // Reset settingsPage when navigating to settings
  // Don't reset settings page — user navigates back to where they were
  useEffect(() => { save("yawm_gender", gender); }, [gender]);
  useEffect(() => { save("yawm_font_scale", fontScale); }, [fontScale]);
  useEffect(() => { save("yawm_mode", mode); }, [mode]);
  useEffect(() => { save("yawm_adult_pts", adultPoints); }, [adultPoints]);
  useEffect(() => { save("yawm_kids_age", kidsAge); }, [kidsAge]);
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

  // Clean up old dated localStorage keys older than 90 days
  useEffect(() => {
    try {
      const cutoff = new Date(TODAY);
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffStr = dateStr(cutoff);
      const prefixes = ["yawm_garden_layout_","yawm_kids_garden_","yawm_masjid_","yawm_exempt_","yawm_kids_"];
      Object.keys(localStorage).forEach(key => {
        prefixes.forEach(pfx => {
          if (key.startsWith(pfx)) {
            const dateKey = key.slice(pfx.length);
            if (dateKey.match(/^\d{4}-\d{2}-\d{2}$/) && dateKey < cutoffStr) {
              localStorage.removeItem(key);
            }
          }
        });
      });
    } catch(e) {}
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

  // Deed → garden element mapping for Journey mode
  const DEED_GARDEN_MAP = {
    fajr_fard:    { key:"fajr",     emoji:"🌴", label:"Fajr Palm" },
    dhuhr_fard:   { key:"dhuhr",    emoji:"🌲", label:"Dhuhr Pine" },
    asr_fard:     { key:"asr",      emoji:"🌳", label:"Asr Oak" },
    magh_fard:    { key:"maghrib",  emoji:"🎋", label:"Maghrib Bamboo" },
    isha_fard:    { key:"isha",     emoji:"🌵", label:"Isha Cedar" },
    witr:         { key:"witr",     emoji:"⭐", label:"Witr Star" },
    quran_recite: { key:"quran",    emoji:"💧", label:"River of Quran" },
    duha_pray:    { key:"duha",     emoji:"☀️", label:"Duha Sun" },
    tahajjud_pray:{ key:"tahajjud", emoji:"🕊️", label:"Tahajjud Dove" },
    adhkar_morning:{ key:"adhkar",  emoji:"✨", label:"Dhikr Light" },
    adhkar_evening:{ key:"adhkar",  emoji:"✨", label:"Dhikr Light" },
    sadaqah_daily:{ key:"sadaqah",  emoji:"⛲", label:"Sadaqah Fountain" },
    fajr_sun:     { key:"sun_0",    emoji:"🌸", label:"Sunnah Flower" },
    dhuhr_sunB:   { key:"sun_1",    emoji:"🌺", label:"Sunnah Flower" },
    dhuhr_sunA:   { key:"sun_2",    emoji:"🌼", label:"Sunnah Flower" },
    magh_sunA:    { key:"sun_3",    emoji:"🌻", label:"Sunnah Flower" },
    isha_sunA:    { key:"sun_4",    emoji:"🌹", label:"Sunnah Flower" },
  };
  function toggle(id) {
    const next = { ...todayChecked, [id]: !todayChecked[id] };
    // Always write to classic (source of truth)
    const c2 = { ...classicHist, [TODAY_KEY]: { ...(classicHist[TODAY_KEY] || {}), ...Object.fromEntries(Object.entries(next).filter(([k]) => !JOURNEY_ONLY_IDS.has(k))) } };
    setClassicHist(c2);
    save("yawm_hist_classic", c2);
    // Always keep journey in sync
    const j2 = { ...journeyHist, [TODAY_KEY]: { ...(journeyHist[TODAY_KEY] || {}), [id]: next[id] } };
    setJourneyHist(j2);
    save("yawm_hist_journey", j2);
    const h2 = { ...hist, [TODAY_KEY]: next };
    setHist(h2);
    if (mode === "gamified") {
      const dayPts = Object.keys(next).filter(k=>next[k]&&DEED_POINTS[k]).reduce((s,k)=>s+(DEED_POINTS[k]||0),0);
      const newPts = { ...adultPoints, [TODAY_KEY]: dayPts };
      setAdultPoints(newPts);
      save("yawm_adult_pts", newPts);
      // Earn garden item if newly checked
      if (next[id] && DEED_GARDEN_MAP[id]) {
        const g = DEED_GARDEN_MAP[id];
        earnGardenItem(g.key, g.emoji, g.label);
      }
      // Remove from garden if unchecked
      if (!next[id] && DEED_GARDEN_MAP[id]) {
        removeItem(DEED_GARDEN_MAP[id].key);
      }
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
    setNotes(n2);
    if (mode === "gamified") { save("yawm_notes_journey", n2); }
    else { save("yawm_notes_classic", n2); }
  }

  const isFemale = gender === "female";
  // Females don't have Jumu'ah; on exemption days prayers are not required
  // Males: Jumu'ah is obligatory. Females: Jumu'ah is optional (show but not required for streak/pct)
  const effectiveFriday = IS_FRI; // Show Jumuah section for both on Fridays
  const allIds = [...getDayIds(IS_RAMADAN, effectiveFriday, IS_FAST, customs),
    ...(IS_EID ? ["eid_prayer"] : []),
  ].filter(id => {
    // For females, exclude jumuah from required count (it's optional)
    if (isFemale && id === "jumuah_prayer") return false;
    // On exemption days, remove all prayer row ids
    if (isExempt && isFemale) {
      const prayerRowIds = PRAYERS.flatMap(p => p.rows.map(r => r.id));
      if (prayerRowIds.includes(id)) return false;
    }
    return true;
  });
  const total  = allIds.length;
  const done   = allIds.filter(id => todayChecked[id]).length;
  const pct    = total ? Math.round((done / total) * 100) : 0;

  const streak = useMemo(() => {
    let s = 0, d = new Date(TODAY);
    for (let i = 0; i < 365; i++) {
      const k = dateStr(d);
      const h = hist[k] || {};
      // Exempt days count as valid for female users
      const dayExempt = isFemale && load("yawm_exempt_" + k, false);
      if (!dayExempt && FARD_IDS.filter(id => h[id]).length < FARD_IDS.length) break;
      s++; d = addDays(d, -1);
    }
    return s;
  }, [hist, isFemale]);

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
    body { background:${T.bg}; font-size:${fontScale}rem; }
    .row-btn:hover { opacity:0.85; }
    .tab-btn:hover { opacity:0.7; }
    input,textarea { outline:none; font-family:'Lora','Georgia',serif; }
    .mode-classic { font-size: 15px; }
    .mode-gamified { font-size: 14px; font-family: 'Nunito', Arial, sans-serif; }
    .mode-kids { font-family: 'Fredoka One', 'Nunito', Arial, sans-serif; }
    @font-face { font-family: 'Amiri'; src: local('Amiri'); }
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      body { padding-bottom: env(safe-area-inset-bottom); }
    }
    input::placeholder,textarea::placeholder { color:${T.muted}; }
    ::-webkit-scrollbar { width:3px; }
    ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:2px; }
    @keyframes popIn { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1.08);opacity:1} }
    .check-pop { animation: popIn 0.22s ease forwards; }
  `;


  // ── Render ────────────────────────────────────────────────────────────────

  // ── Onboarding ──────────────────────────────────────────────────────────────
  if (onboardStep !== null) {
    const STEPS = [
      {
        icon:"📋",
        title:"Track your daily deeds",
        body:"Tick off your prayers and deeds each day. Your streak grows as you stay consistent.",
        ar:"وَأَقِيمُوا الصَّلَاةَ",
        arEn:"Establish prayer — Quran 2:43",
      },
      {
        icon:"📿",
        title:"Post-prayer Adhkar",
        body:"After each prayer, tap the Adhkar banner to say SubhanAllah, Alhamdulillah and Ayat al-Kursi with a guided tasbih counter.",
        ar:"اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا",
        arEn:"Remember Allah much — Quran 33:41",
      },
      {
        icon:"🪞",
        title:"Reflect each evening",
        body:"Use the Reflect tab for your daily Muhasaba — check your mood, write what you are grateful for, and make Istighfar.",
        ar:"حَاسِبُوا أَنْفُسَكُمْ قَبْلَ أَنْ تُحَاسَبُوا",
        arEn:'"Take account before you are taken to account" — Umar ibn al-Khattab',
      },
    ];
    const step = STEPS[onboardStep];
    const isLast = onboardStep === STEPS.length - 1;
    const OB_BG  = T.bg;
    const OB_ACC = mode === "gamified" ? "#4f46e5" : GOLD;
    return (
      <div style={{ minHeight:"100vh", background:OB_BG, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"32px 24px", textAlign:"center",
        fontFamily:"'Lora','Georgia',serif" }}>
        {/* Progress dots */}
        <div style={{ display:"flex", gap:8, marginBottom:32 }}>
          {STEPS.map((_,i) => (
            <div key={i} style={{ width:i===onboardStep?24:8, height:8, borderRadius:4,
              background:i<=onboardStep?OB_ACC:T.border, transition:"all 0.3s" }} />
          ))}
        </div>
        {/* Bismillah */}
        <div style={{ fontSize:14, color:OB_ACC, fontFamily:"'Amiri Quran','Amiri',serif",
          letterSpacing:2, marginBottom:20 }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        {/* Icon */}
        <div style={{ fontSize:64, marginBottom:20 }}>{step.icon}</div>
        {/* Arabic */}
        <div style={{ fontSize:18, color:OB_ACC, fontFamily:"'Amiri Quran','Amiri',serif",
          direction:"rtl", lineHeight:"2.2", marginBottom:6, padding:"0 16px" }}>{step.ar}</div>
        <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", fontStyle:"italic",
          marginBottom:24 }}>{step.arEn}</div>
        {/* Title */}
        <div style={{ fontSize:22, fontWeight:700, color:T.text, fontFamily:"'Lora',serif",
          marginBottom:12 }}>{step.title}</div>
        {/* Body */}
        <div style={{ fontSize:14, color:T.sub, fontFamily:"sans-serif", lineHeight:"1.8",
          maxWidth:320, marginBottom:40 }}>{step.body}</div>
        {/* Button */}
        <button onClick={() => isLast ? finishOnboard() : setOnboardStep(s=>s+1)} style={{
          width:"100%", maxWidth:320, padding:"14px", background:OB_ACC, border:"none",
          borderRadius:14, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer",
          fontFamily:"'Lora',serif", marginBottom:12,
          boxShadow:"0 4px 16px "+OB_ACC+"44",
        }}>
          {isLast ? "Begin — بِسْمِ اللَّهِ 🌙" : "Next →"}
        </button>
        <button onClick={finishOnboard} style={{ background:"none", border:"none",
          color:T.muted, fontSize:12, cursor:"pointer", fontFamily:"sans-serif" }}>
          Skip
        </button>
      </div>
    );
  }

  return (
    <div className={"mode-" + mode} style={{ minHeight:"100vh", background:
        kidsMode ? KT.bg : T.bg,
      fontFamily: mode === "gamified" ? "'Nunito','Lora',sans-serif" : kidsMode ? "'Fredoka One','Nunito',sans-serif" : "'Lora','Georgia',serif",
      color:T.text,
      fontSize: fontScale + "rem" }}>
      <style>{css}</style>

      {/* Share card modal */}

      {/* Garden earned toast */}
      {gardenMsg && (
        <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          background:"#1a1a1a", color:"#fff", padding:"10px 18px", borderRadius:20,
          fontSize:12, fontFamily:"sans-serif", zIndex:999, whiteSpace:"nowrap",
          boxShadow:"0 4px 16px rgba(0,0,0,0.3)", display:"flex", alignItems:"center", gap:8 }}>
          <span>🌱</span> {gardenMsg}
        </div>
      )}
      {/* Kids garden earned toast */}
      {kidsGardenMsg && (
        <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          background:"linear-gradient(135deg,#f59e0b,#ec4899)",
          color:"#fff", padding:"10px 18px", borderRadius:20,
          fontSize:13, fontFamily:"'Fredoka One',sans-serif", zIndex:999,
          boxShadow:"0 4px 16px rgba(0,0,0,0.2)", textAlign:"center" }}>
          {kidsGardenMsg}
        </div>
      )}
      {/* Uncheck all confirm modal */}
      {uncheckConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200,
          display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:T.card, borderRadius:20, padding:24,
            width:"100%", maxWidth:320, boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:16, fontWeight:700, color:T.text,
              fontFamily:"'Lora',serif", marginBottom:8 }}>↺ Uncheck all today?</div>
            <div style={{ fontSize:13, color:T.muted, fontFamily:"sans-serif",
              marginBottom:20, lineHeight:"1.6" }}>
              This will clear all ticked deeds for today. This cannot be undone.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => {
                const c2 = { ...classicHist, [TODAY_KEY]: {} };
                setClassicHist(c2); save("yawm_hist_classic", c2);
                const j2 = { ...journeyHist, [TODAY_KEY]: {} };
                setJourneyHist(j2); save("yawm_hist_journey", j2);
                setMasjidPrayers([]); save("yawm_masjid_" + TODAY_KEY, []);
                setUncheckConfirm(false);
              }} style={{ flex:1, padding:"11px", background:"#ef4444", border:"none",
                borderRadius:10, color:"#fff", cursor:"pointer", fontSize:13,
                fontWeight:700, fontFamily:"sans-serif" }}>
                Yes, uncheck all
              </button>
              <button onClick={() => setUncheckConfirm(false)} style={{
                flex:1, padding:"11px", background:T.alt,
                border:"1px solid "+T.border, borderRadius:10, color:T.sub,
                cursor:"pointer", fontSize:13, fontFamily:"sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
            {/* Edit past day label */}
            {selectedDay !== TODAY_KEY && (
              <div style={{ background:GOLD+"12", borderRadius:10, border:"1px solid "+GOLD+"33",
                padding:"7px 12px", marginBottom:12, fontSize:11,
                color:GOLD, fontFamily:"sans-serif" }}>
                ✏️ Tap any row to toggle it — edits save immediately
              </div>
            )}
            {/* Show all prayer rows for that day */}
            {PRAYERS.map(function(prayer) {
              const dayH = selectedDay === TODAY_KEY ? todayChecked : (hist[selectedDay] || {});
              const rows = prayer.rows.filter(function(r) { return !r.ramadan; });
              const pDone = rows.filter(r => dayH[r.id]).length;
              const isPast = selectedDay !== TODAY_KEY;
              function toggleDay(rowId) {
                if (selectedDay === TODAY_KEY) { toggle(rowId); return; }
                const updated = { ...dayH, [rowId]: !dayH[rowId] };
                const c2 = { ...classicHist, [selectedDay]: updated };
                setClassicHist(c2); save("yawm_hist_classic", c2);
                const j2 = { ...journeyHist, [selectedDay]: { ...(journeyHist[selectedDay]||{}), [rowId]: !dayH[rowId] } };
                setJourneyHist(j2); save("yawm_hist_journey", j2);
              }
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
                        <button key={row.id} onClick={() => toggleDay(row.id)}
                          style={{ display:"flex", alignItems:"center", gap:8,
                            padding:"6px 12px", width:"100%", background:"none",
                            border:"none", cursor: isPast ? "pointer" : "default",
                            textAlign:"left", transition:"opacity 0.15s",
                            opacity: chk ? 1 : 0.45 }}>
                          <span style={{ fontSize:9, padding:"1px 5px", borderRadius:5,
                            fontFamily:"sans-serif", fontWeight:700,
                            background:col+"20", color:col, border:"1px solid "+col+"44" }}>
                            {TL[row.type]}
                          </span>
                          <span style={{ fontSize:12, color:chk?T.text:T.muted,
                            textDecoration:chk?"none":"line-through", flex:1 }}>
                            {row.label}
                          </span>
                          <span style={{ fontSize:12 }}>{chk ? "✅" : "⬜"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Install prompt banner */}
      {showInstall && !kidsMode && (
        <div style={{ display:"flex", alignItems:"center", gap:10,
          padding:"10px 14px", background:GOLD+"18",
          borderBottom:"1px solid "+GOLD+"33" }}>
          <span style={{ fontSize:18 }}>📲</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:GOLD,
              fontFamily:"'Lora',serif" }}>Install Yawm</div>
            <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>
              Add to home screen for the best experience
            </div>
          </div>
          <button onClick={async () => {
            if (installPrompt) {
              installPrompt.prompt();
              const result = await installPrompt.userChoice;
              if (result.outcome === "accepted") setShowInstall(false);
            }
            setShowInstall(false);
          }} style={{ padding:"5px 12px", background:GOLD, border:"none",
            borderRadius:10, color:"#fff", fontSize:11, fontWeight:700,
            cursor:"pointer", fontFamily:"sans-serif", flexShrink:0 }}>
            Install
          </button>
          <button onClick={() => setShowInstall(false)} style={{
            background:"none", border:"none", cursor:"pointer",
            color:T.muted, fontSize:16, padding:"0 4px", flexShrink:0 }}>✕</button>
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

      {/* Offline notice */}
      {!isOnline && !kidsMode && (
        <div style={{ textAlign:"center", padding:"7px 16px",
          background:"#fef3c7", borderBottom:"1px solid #fde68a",
          fontFamily:"sans-serif", fontSize:11, color:"#92400e",
          display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <span>📵</span>
          <span>Offline — showing last known prayer times. Data will sync when connected.</span>
        </div>
      )}
      {/* Eid / Ramadan banner */}
      {IS_EID && !kidsMode && (
        <div style={{ textAlign:"center", padding:"12px 16px",
          background:"linear-gradient(135deg,#fef9c3,#fef3c7)",
          borderBottom:"1px solid #fde68a", fontFamily:"sans-serif" }}>
          <div style={{ fontSize:20, marginBottom:2 }}>🌙✨🌙</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#92400e",
            fontFamily:"'Lora',serif" }}>
            {EID_NAME} Mubarak! · {EID_AR}
          </div>
          <div style={{ fontSize:11, color:"#a16207", marginTop:2 }}>
            تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ — May Allah accept from us and you
          </div>
        </div>
      )}
      {IS_RAMADAN && !IS_EID && !kidsMode && (
        <div style={{ textAlign:"center", padding:"8px 16px", background:"linear-gradient(135deg,#ea580c22,#f59e0b22)", borderBottom:"1px solid #ea580c33", fontFamily:"sans-serif", fontSize:12, color:"#ea580c" }}>
          🌙 Ramadan Mubarak — Day {hijri.day} · Night {hijri.day + 1 <= 30 ? hijri.day + 1 : "—"}
        </div>
      )}

      <div style={{ maxWidth:480, margin:"0 auto", paddingBottom:120 }}>

        {/* Top bar — hidden in kids mode */}
        {!kidsMode && <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"12px 16px 0" }}>
          <div style={{ flex:1, minWidth:0 }}>
            {!hijriEdit ? (
              <div>
                {/* Gregorian date — large */}
                <div style={{ fontSize:22, fontWeight:700, color:T.text,
                  fontFamily:"'Lora',serif", lineHeight:"1.1", marginBottom:2 }}>
                  {DAYS_LONG[DOW]}
                </div>
                <div style={{ fontSize:16, color:T.sub, fontFamily:"sans-serif", marginBottom:6 }}>
                  {MON_SHORT[TODAY.getMonth()]} {DOM}, {TODAY.getFullYear()}
                </div>
                {/* Hijri date — both Arabic and English */}
                <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:18, color:GOLD, fontFamily:"'Amiri',serif", lineHeight:"1.3" }}>
                      {hijri.day} {HM_AR[hijri.month-1]} {hijri.year} هـ
                    </div>
                    <div style={{ fontSize:12, color:GOLD, fontFamily:"sans-serif", fontWeight:600, marginTop:1, whiteSpace:"nowrap" }}>
                      {hijri.day} {HM_EN[hijri.month-1]} {hijri.year} AH
                    </div>
                  </div>
                  <button onClick={() => { setHijriDraft({ day:String(hijri.day), month:String(hijri.month), year:String(hijri.year) }); setHijriEdit(true); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:T.muted, padding:"0 2px" }} title="Adjust Hijri date">✏️</button>
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
          <div style={{ display:"flex", gap:5, alignItems:"center" }}>
            {/* Classic ↔ Journey toggle — only between these two modes */}
            {(mode === "classic" || mode === "gamified") && (
              <button onClick={() => {
                const next = mode === "classic" ? "gamified" : "classic";
                setMode(next);
              }} style={{
                display:"flex", alignItems:"center", gap:0,
                background:T.alt, border:"1px solid "+T.border,
                borderRadius:20, padding:"3px 4px",
                cursor:"pointer", overflow:"hidden",
              }}>
                {[["classic","☪️"],["gamified","⭐"]].map(([m, icon]) => (
                  <span key={m} style={{
                    padding:"3px 9px", borderRadius:16, fontSize:11,
                    fontFamily:"sans-serif", fontWeight:700,
                    background: mode===m ? GOLD : "transparent",
                    color: mode===m ? "#fff" : T.muted,
                    transition:"all 0.2s",
                  }}>{icon} {mode===m ? (m==="classic"?"Classic":"Journey") : ""}</span>
                ))}
              </button>
            )}
            {mode !== "kids" && (
              <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} style={{ background:"transparent", border:"1px solid " + T.border, borderRadius:20, padding:"5px 10px", cursor:"pointer", fontSize:13, color:T.sub, fontFamily:"sans-serif" }}>
                {theme === "light" ? "🌙" : "☀️"}
              </button>
            )}
          </div>
        </div>}

        {/* Hero — shown on Today tab only, not on More/Settings/etc */}
        {!kidsMode && tab === "today" && (
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
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
              {IS_FRI && <span style={{ background:"#eef2ff", border:"1px solid #c7d2fe", borderRadius:10, padding:"3px 10px", fontSize:11, color:"#4f46e5", fontFamily:"sans-serif" }}>🕌 Jumu'ah</span>}
              {IS_FAST && !IS_RAMADAN && <span style={{ background:"#fefce8", border:"1px solid #fcd34d", borderRadius:10, padding:"3px 10px", fontSize:11, color:"#a16207", fontFamily:"sans-serif" }}>🌿 {IS_WHITE ? "Ayyam al-Bid — " + DOM + "th" : IS_MON ? "Monday Fast" : "Thursday Fast"}</span>}
              <button onClick={async () => {
                const text = "يَوْم · Yawm — " + DAYS_LONG[DOW] + "\n" +
                  "🔥 " + streak + " day streak · " + FARD_IDS.filter(id=>todayChecked[id]).length + "/" + FARD_IDS.length + " Fard\n" +
                  PRAYERS.filter(p=>p.rows.filter(r=>r.type==="F").every(r=>todayChecked[r.id])).map(p=>p.icon+" "+p.label).join(" · ") +
                  "\n\nتَقَبَّلَ اللَّهُ مِنَّا — tracked with Yawm";
                try {
                  if (navigator.share) { await navigator.share({ text, title:"My Yawm Deeds" }); }
                  else { await navigator.clipboard.writeText(text); alert("Copied! 📋"); }
                } catch(e) {}
              }} style={{
                background:"none", border:"1px solid " + T.border, borderRadius:10,
                padding:"3px 10px", fontSize:11, color:GOLD,
                fontFamily:"sans-serif", cursor:"pointer",
              }}>📤 Share</button>
              {/* Check all fard — always visible when not all done */}
              {!isExempt && !FARD_IDS.every(id => todayChecked[id]) && (
                <button onClick={() => {
                  const next = { ...todayChecked };
                  FARD_IDS.forEach(id => { next[id] = true; });
                  const c2 = { ...classicHist, [TODAY_KEY]: { ...(classicHist[TODAY_KEY]||{}), ...Object.fromEntries(FARD_IDS.map(id=>[id,true])) }};
                  setClassicHist(c2); save("yawm_hist_classic", c2);
                  const j2 = { ...journeyHist, [TODAY_KEY]: { ...(journeyHist[TODAY_KEY]||{}), ...Object.fromEntries(FARD_IDS.map(id=>[id,true])) }};
                  setJourneyHist(j2); save("yawm_hist_journey", j2);
                }} style={{
                  background:"none", border:"1px solid "+T.border, borderRadius:10,
                  padding:"3px 10px", fontSize:11, color:T.muted,
                  fontFamily:"sans-serif", cursor:"pointer",
                }}>✓ Check all fard</button>
              )}
              {/* Uncheck all */}
              {done > 0 && (
                <button onClick={() => setUncheckConfirm(true)} style={{
                  background:"none", border:"1px solid " + T.border, borderRadius:10,
                  padding:"3px 10px", fontSize:11, color:T.muted,
                  fontFamily:"sans-serif", cursor:"pointer",
                }}>↺ Uncheck all</button>
              )}
            </div>
        </div>
        )} {/* end !kidsMode hero */}

        {/* ══ KIDS MODE ══ */}
        {IS_EID && kidsMode && (
          <div style={{ textAlign:"center", padding:"12px 16px",
            background:"linear-gradient(135deg,#fef9c3,#fef3c7)",
            marginBottom:8, borderRadius:12, margin:"8px 14px" }}>
            <div style={{ fontSize:24, marginBottom:2 }}>🌙✨🎉</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#92400e",
              fontFamily:"'Fredoka One',sans-serif" }}>
              {EID_NAME} Mubarak!
            </div>
            <div style={{ fontSize:11, color:"#a16207", fontFamily:"sans-serif", marginTop:2 }}>
              تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ 🌟
            </div>
          </div>
        )}
        {kidsMode && (
          <div>
            {/* Kids header */}
            <div style={{ margin:"10px 14px 0", borderRadius:20, padding:"16px", background:KT.headerBg, textAlign:"center", position:"relative" }}>
              {/* Exit kids mode */}
              <button onClick={() => setMode("classic")} style={{
                position:"absolute", top:10, left:12,
                background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.35)",
                borderRadius:20, padding:"4px 10px", cursor:"pointer",
                fontSize:10, color:"#fff", fontFamily:"sans-serif", fontWeight:600,
              }}>← Exit</button>
              <div style={{ fontSize:32, marginBottom:4 }}>
                {kidsAge === "little" ? "🌟" : "⭐"}
              </div>
              <div style={{ fontSize:22, fontWeight:700, color:"#fff", fontFamily:"'Lora',serif", textShadow:"0 2px 8px rgba(0,0,0,0.2)" }}>
                السَّلَامُ عَلَيْكُمْ
              </div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", fontFamily:"sans-serif", marginTop:2 }}>
                Assalamu Alaikum! Let's do our daily deeds 🌙
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", fontFamily:"sans-serif", marginTop:4 }}>
                {kidsAge === "little" ? "Tap ← Exit in top-left to return to adult mode" : "🕌 Salah · 📋 Deeds · 🏡 Garden · 📖 Learn"}
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
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontFamily:"sans-serif", marginTop:4 }}>{todayPts}/{maxPts} points today · 🔥 {kidsStreak} day streak</div>
                  </div>
                );
              })()}
            </div>

            {/* Kids deeds tab */}
            {kidsTab === "deeds" && (
            <div style={{ padding:"10px 14px 0" }}>

              {/* Sub-tabs — Salah / Deeds (only for 7-12) */}
              {kidsAge !== "little" && (
                <div style={{ display:"flex", gap:0, borderRadius:14, overflow:"hidden",
                  border:"2px solid "+KT.border, marginBottom:12 }}>
                  {[["salah","🕌","Salah"],["deeds","📋","Deeds"]].map(([k,ic,lb]) => {
                    const active = kidsSubTab === k;
                    return (
                      <button key={k} onClick={() => setKidsSubTab(k)} style={{
                        flex:1, padding:"11px 8px", border:"none", cursor:"pointer",
                        background:active?KT.gold:KT.alt,
                        color:active?"#fff":KT.muted,
                        fontSize:14, fontWeight:active?700:500,
                        fontFamily:"'Fredoka One','Nunito',sans-serif",
                        borderRight:k==="salah"?"2px solid "+KT.border:"none",
                        transition:"all 0.18s",
                      }}>{ic} {lb}</button>
                    );
                  })}
                </div>
              )}

              {/* Under-7: gentle message on Salah tab */}
              {kidsAge === "little" && kidsSubTab === "salah" && (
                <div style={{ textAlign:"center", padding:"30px 20px",
                  background:KT.card, borderRadius:20, border:"2px solid "+KT.border, marginBottom:12 }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>🌙</div>
                  <div style={{ fontSize:18, fontWeight:700, color:KT.text,
                    fontFamily:"'Fredoka One',sans-serif", marginBottom:8 }}>
                    Prayers come soon!
                  </div>
                  <div style={{ fontSize:14, color:KT.muted, fontFamily:"sans-serif",
                    lineHeight:"1.7", marginBottom:12 }}>
                    When you are a little older, you will learn to pray 5 times a day.
                    For now, keep doing your good deeds! 🌟
                  </div>
                  <div style={{ fontSize:15, color:KT.gold, fontFamily:"'Amiri',serif",
                    direction:"rtl", lineHeight:"2" }}>
                    وَأَقِيمُوا الصَّلَاةَ
                  </div>
                  <div style={{ fontSize:11, color:KT.muted, fontFamily:"sans-serif",
                    fontStyle:"italic", marginTop:4 }}>
                    "Establish prayer" — Quran 2:43
                  </div>
                </div>
              )}

              {/* Prayer boxes — Salah sub-tab (7-12) */}
              {kidsAge !== "little" && kidsSubTab === "salah" && KIDS_PRAYERS.map(function(prayer) {
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

              {/* Daily Deeds — show when: under-7 always, or 7-12 on deeds sub-tab */}
              {(kidsAge === "little" || kidsSubTab === "deeds") && (
              <div>
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
                    const KIDS_GARDEN_EARN = {
                      k_quran:    { emoji:"🌊", label:"Quran River"    },
                      k_adkhar:   { emoji:"✨", label:"Fireflies"      },
                      k_dua:      { emoji:"☁️", label:"Dua Cloud"      },
                      k_sadaqah:  { emoji:"🌻", label:"Sunflower"      },
                      k_kind:     { emoji:"🕊️", label:"Kindness Dove"  },
                      k_parents:  { emoji:"🌳", label:"Oak Tree"       },
                      k_bismillah:{ emoji:"🌟", label:"Star"           },
                    };
                    if (!chk) {
                      const allPts = [...KIDS_PRAYERS.flatMap(p=>p.rows), ...ALL_KIDS_TASKS].reduce((s,t) => next[t.id] ? s+(t.pts||t.points||0) : s, 0);
                      const newPts = { ...kidsPoints, [TODAY_KEY]: allPts };
                      setKidsPoints(newPts); save("yawm_kids_pts", newPts);
                      setConfetti(true); setTimeout(() => setConfetti(false), 1200);
                      const g = KIDS_GARDEN_EARN[task.id];
                      if (g) {
                        setKidsPendingItem({ key:task.id, emoji:g.emoji, label:g.label });
                        setKidsGardenMsg("You earned " + g.emoji + " " + g.label + "! Go to garden to place it!");
                        setTimeout(() => setKidsGardenMsg(null), 3000);
                      }
                    } else {
                      const nk = { ...kidsGardenLayout }; delete nk[task.id]; saveKidsGardenLayout(nk);
                    }
                  if (navigator.vibrate) navigator.vibrate(chk ? 15 : [20,10,20]);
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

              </div>)} {/* end deeds sub-section */}

              {/* Confetti burst */}
              {confetti && (
                <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ fontSize:60, animation:"popIn 0.8s ease" }}>🌟</div>
                </div>
              )}

              {/* All done celebration */}
              {ALL_KIDS_TASKS.filter(t => kidsEnabledTasks.includes(t.id)).every(t => kidsChecked[t.id]) &&
               KIDS_PRAYERS.flatMap(p=>p.rows.filter(r=>r.type==="F")).every(r => kidsChecked[r.id]) && (
                <div style={{ padding:"16px", background:"linear-gradient(135deg,#ff9800,#e91e63)", borderRadius:16, textAlign:"center", marginBottom:12, color:"#fff" }}>
                  <div style={{ fontSize:32, marginBottom:4 }}>🎉</div>
                  <div style={{ fontSize:16, fontWeight:700, fontFamily:"'Lora',serif" }}>الحمد لله! All done!</div>
                  <div style={{ fontSize:12, fontFamily:"sans-serif", marginTop:4, opacity:0.9 }}>Amazing work today! Allah is pleased with you 🌟</div>
                </div>
              )}

              
            </div>
            )} {/* end deeds tab */}

            {/* Kids garden tab */}
            {kidsTab === "garden" && (
            <div style={{ padding:"10px 14px 0" }}>

              {/* ── Under 7: Stepping Stones to Jannah ── */}
              {kidsAge === "little" && (() => {
                const STONES = [
                  { id:"k_bismillah", label:"Bismillah",    emoji:"💬", color:"#f59e0b", lit_emoji:"✨" },
                  { id:"k_dua",       label:"Made Dua",     emoji:"🤲", color:"#a855f7", lit_emoji:"💜" },
                  { id:"k_adkhar",    label:"Said Adhkar",  emoji:"📿", color:"#8b5cf6", lit_emoji:"💫" },
                  { id:"k_kind",      label:"Was Kind",     emoji:"💛", color:"#ec4899", lit_emoji:"💛" },
                  { id:"k_parents",   label:"Helped Parents",emoji:"👪",color:"#f97316", lit_emoji:"🧡" },
                  { id:"k_sadaqah",   label:"Gave Sadaqah", emoji:"🤝", color:"#16a34a", lit_emoji:"💚" },
                  { id:"k_quran",     label:"Read Quran",   emoji:"📖", color:"#dc2626", lit_emoji:"❤️" },
                ];
                const litCount = STONES.filter(s => kidsChecked[s.id]).length;
                const allLit   = litCount === STONES.length;

                // Winding path positions (S-curve across canvas)
                const positions = [
                  { x:15,  y:78 },
                  { x:30,  y:58 },
                  { x:50,  y:48 },
                  { x:68,  y:55 },
                  { x:82,  y:40 },
                  { x:68,  y:25 },
                  { x:50,  y:15 },
                ];

                return (
                  <div>
                    <div style={{ background:"linear-gradient(180deg,#fef9c3 0%,#bfdbfe 40%,#86efac 100%)",
                      borderRadius:20, border:"3px solid "+KT.border, overflow:"hidden", marginBottom:12 }}>

                      {/* Header */}
                      <div style={{ padding:"10px 14px 8px", background:KT.headerBg, textAlign:"center" }}>
                        <div style={{ fontSize:11, fontWeight:800, color:"#fff",
                          fontFamily:"'Fredoka One',sans-serif", letterSpacing:1 }}>
                          🌟 MY PATH TO JANNAH
                        </div>
                      </div>

                      {/* SVG path scene */}
                      <div style={{ position:"relative", height:220 }}>
                        <svg width="100%" height="220" viewBox="0 0 100 100"
                          preserveAspectRatio="none" style={{ position:"absolute", inset:0 }}>
                          {/* Sky gradient */}
                          <defs>
                            <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fef9c3"/>
                              <stop offset="50%" stopColor="#bfdbfe"/>
                              <stop offset="100%" stopColor="#86efac"/>
                            </linearGradient>
                          </defs>
                          <rect width="100" height="100" fill="url(#skyG)"/>
                          {/* Path line — winding */}
                          <polyline
                            points={positions.map(p=>`${p.x},${p.y}`).join(" ")}
                            fill="none" stroke="#fff" strokeWidth="3.5"
                            strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                          <polyline
                            points={positions.map(p=>`${p.x},${p.y}`).join(" ")}
                            fill="none" stroke="#fbbf24" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round"
                            strokeDasharray="2,3" opacity="0.8"/>
                        </svg>

                        {/* Sun */}
                        <div style={{ position:"absolute", top:6, right:10, fontSize:22 }}>☀️</div>
                        {/* Clouds */}
                        <div style={{ position:"absolute", top:4, left:"20%", fontSize:14, opacity:0.7 }}>☁️</div>
                        <div style={{ position:"absolute", top:8, left:"55%", fontSize:11, opacity:0.6 }}>☁️</div>

                        {/* Gate at top */}
                        <div style={{ position:"absolute", top:"-2%", left:"42%",
                          textAlign:"center", transition:"all 0.4s" }}>
                          <div style={{ fontSize: allLit ? 38 : 28,
                            filter: allLit ? "drop-shadow(0 0 8px #fbbf24)" : "grayscale(0.6)",
                            transition:"all 0.5s" }}>
                            {allLit ? "✨🌟✨" : "🌟"}
                          </div>
                          <div style={{ fontSize:7, fontWeight:800, color:"#92400e",
                            fontFamily:"'Fredoka One',sans-serif", background:"#fff8",
                            padding:"1px 4px", borderRadius:4, whiteSpace:"nowrap",
                            marginTop:2 }}>
                            {allLit ? "Jannah Gate! 🎉" : "Jannah Gate"}
                          </div>
                        </div>

                        {/* Stepping stones */}
                        {STONES.map((stone, i) => {
                          const pos = positions[i];
                          const lit = !!kidsChecked[stone.id];
                          return (
                            <div key={stone.id} style={{
                              position:"absolute",
                              left: pos.x + "%",
                              top:  pos.y + "%",
                              transform:"translate(-50%,-50%)",
                              transition:"all 0.3s",
                            }}>
                              {/* Stone circle */}
                              <div style={{
                                width:36, height:36, borderRadius:"50%",
                                background: lit
                                  ? `radial-gradient(circle, ${stone.color}ff, ${stone.color}88)`
                                  : "rgba(255,255,255,0.6)",
                                border: `3px solid ${lit ? stone.color : "rgba(255,255,255,0.8)"}`,
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:16,
                                boxShadow: lit ? `0 0 12px ${stone.color}99` : "0 2px 6px rgba(0,0,0,0.1)",
                                transition:"all 0.35s ease",
                                transform: lit ? "scale(1.15)" : "scale(1)",
                              }}>
                                {lit ? stone.lit_emoji : stone.emoji}
                              </div>
                              {/* Label */}
                              <div style={{
                                position:"absolute", top:"100%", left:"50%",
                                transform:"translateX(-50%)",
                                fontSize:7, fontWeight:800,
                                color: lit ? stone.color : "#6b7280",
                                fontFamily:"'Fredoka One',sans-serif",
                                whiteSpace:"nowrap", marginTop:2,
                                background:"rgba(255,255,255,0.85)",
                                padding:"1px 4px", borderRadius:4,
                              }}>{stone.label}</div>
                            </div>
                          );
                        })}

                        {/* All lit celebration overlay */}
                        {allLit && (
                          <div style={{ position:"absolute", inset:0,
                            background:"radial-gradient(ellipse at 50% 20%,#fef08a55,transparent 60%)",
                            pointerEvents:"none" }} />
                        )}
                      </div>

                      {/* Progress bar + message */}
                      <div style={{ padding:"10px 14px 12px", background:"rgba(255,255,255,0.8)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between",
                          alignItems:"center", marginBottom:6 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:"#92400e",
                            fontFamily:"'Fredoka One',sans-serif" }}>
                            {litCount === 0 ? "Start your journey! 🌟"
                              : allLit ? "You reached Jannah Gate! 🎉 الحمد لله"
                              : `${litCount} of ${STONES.length} steps lit up! Keep going! ✨`}
                          </div>
                          <div style={{ fontSize:12, fontWeight:800, color:KT.gold,
                            fontFamily:"'Fredoka One',sans-serif" }}>
                            {litCount}/{STONES.length}
                          </div>
                        </div>
                        <div style={{ height:10, background:"#e5e7eb", borderRadius:5, overflow:"hidden" }}>
                          <div style={{ height:"100%", borderRadius:5,
                            background:`linear-gradient(to right,#f59e0b,#ec4899,#a855f7)`,
                            width:(litCount/STONES.length*100)+"%",
                            transition:"width 0.5s ease",
                            boxShadow:"0 0 6px #f59e0b66" }} />
                        </div>
                      </div>
                    </div>

                    {/* Stone legend */}
                    <div style={{ background:KT.card, borderRadius:14, border:"2px solid "+KT.border,
                      padding:"10px 12px" }}>
                      <div style={{ fontSize:9, color:KT.gold, fontFamily:"sans-serif",
                        letterSpacing:2, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>
                        Each deed lights a stone 🌟
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
                        {[
                          { emoji:"💬", label:"Bismillah", color:"#f59e0b" },
                          { emoji:"🤲", label:"Make Dua",  color:"#a855f7" },
                          { emoji:"📿", label:"Adhkar",    color:"#8b5cf6" },
                          { emoji:"💛", label:"Be Kind",   color:"#ec4899" },
                          { emoji:"👪", label:"Help Parents",color:"#f97316"},
                          { emoji:"🤝", label:"Sadaqah",   color:"#16a34a" },
                          { emoji:"📖", label:"Read Quran",color:"#dc2626" },
                        ].map(s => (
                          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:5,
                            padding:"4px 0" }}>
                            <span style={{ fontSize:14 }}>{s.emoji}</span>
                            <span style={{ fontSize:10, color:kidsChecked[ALL_KIDS_TASKS.find(t=>t.emoji===s.emoji)?.id]?s.color:KT.muted,
                              fontFamily:"'Fredoka One',sans-serif",
                              fontWeight:kidsChecked[ALL_KIDS_TASKS.find(t=>t.emoji===s.emoji)?.id]?700:400 }}>
                              {s.label}
                            </span>
                            {kidsChecked[ALL_KIDS_TASKS.find(t=>t.emoji===s.emoji)?.id] &&
                              <span style={{ fontSize:10 }}>✓</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Ages 7-12: House in Jannah ── */}
              {kidsAge !== "little" && (() => {
                const allK = { ...kidsChecked };
                const prayersDone  = KIDS_PRAYERS.flatMap(p=>p.rows.filter(r=>r.type==="F")).filter(r=>allK[r.id]).length;
                const sunnahDone   = KIDS_PRAYERS.flatMap(p=>p.rows.filter(r=>r.type==="S")).filter(r=>allK[r.id]).length;
                const witrDone     = allK["kp_witr"];
                const quranDone    = allK["k_quran"];
                const kindDone     = allK["k_kind"];
                const parentsDone  = allK["k_parents"];
                const sadaqahDone  = allK["k_sadaqah"];
                const dhikrDone    = allK["k_adkhar"] || allK["k_bismillah"];
                const BRICKS   = Math.min(prayersDone, 5);
                const HAS_ROOF = prayersDone >= 3;
                const HAS_DOOR = prayersDone >= 2;
                const HAS_STAR = witrDone;
                const HAS_RIVER = quranDone;
                const HAS_KINDNESS = kindDone && parentsDone;
                const HAS_FOUNTAIN = sadaqahDone;
                const HAS_LIGHT  = dhikrDone;
                const DONE_ALL = prayersDone >= 5;
                // 4 varied tree types, scattered positions — grow from sunnah count
                const KIDS_TREES = [
                  { emoji:"🌴", left:"6%",  bottom:"30%", size:30 },
                  { emoji:"🌲", left:"80%", bottom:"28%", size:26 },
                  { emoji:"🌳", left:"18%", bottom:"33%", size:28 },
                  { emoji:"🎋", left:"70%", bottom:"32%", size:22 },
                ];
                return (
                  <div style={{ marginBottom:12, borderRadius:20, overflow:"hidden",
                    border:"3px solid " + KT.border }}>
                    <div style={{ padding:"10px 14px 8px", background: KT.headerBg,
                      display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:11, fontWeight:800, color:"#fff",
                        fontFamily:"'Fredoka One',sans-serif", letterSpacing:1 }}>
                        🏡 MY HOUSE IN JANNAH
                      </div>
                      {Object.keys(kidsGardenLayout).length > 0 && (
                        <button onClick={() => { saveKidsGardenLayout({}); setKidsPendingItem(null); }}
                          style={{ background:"rgba(255,255,255,0.25)", border:"1px solid rgba(255,255,255,0.4)",
                            borderRadius:8, padding:"3px 9px", fontSize:10, color:"#fff",
                            fontFamily:"sans-serif", cursor:"pointer" }}>
                          ↺ Reset
                        </button>
                      )}
                    </div>
                    {/* Unplaced kids items */}
                    {(() => {
                      const KIDS_GARDEN_MAP = {
                        k_quran:"🌊", k_adkhar:"✨", k_dua:"☁️",
                        k_sadaqah:"🌻", k_kind:"🕊️", k_parents:"🌳", k_bismillah:"🌟",
                      };
                      const unplacedKids = ALL_KIDS_TASKS.filter(t=>kidsChecked[t.id] && !kidsGardenLayout[t.id] && t.id!=="k_quran");
                      const quranPlaced  = !!kidsGardenLayout["k_quran"];
                      const quranEarned  = !!kidsChecked["k_quran"] && !quranPlaced;
                      const showPanel    = unplacedKids.length > 0 || quranEarned;
                      if (!showPanel) return null;
                      return (
                        <div style={{ padding:"8px 12px", background:"rgba(255,255,255,0.92)",
                          display:"flex", alignItems:"center", gap:8, flexWrap:"wrap",
                          borderBottom:"1px solid "+KT.border }}>
                          <span style={{ fontSize:10, color:KT.gold,
                            fontFamily:"'Fredoka One',sans-serif", fontWeight:700 }}>
                            🌱 Tap to place:
                          </span>
                          {quranEarned && (
                            <button onClick={() => setKidsPendingItem({ key:"k_quran", emoji:"🌊", label:"Quran River" })}
                              style={{ fontSize:22, background:kidsPendingItem?.key==="k_quran"?"#fef3c7":"transparent",
                                border:"2px solid "+(kidsPendingItem?.key==="k_quran"?KT.gold:"transparent"),
                                borderRadius:8, padding:"2px 6px", cursor:"pointer",
                                transform:kidsPendingItem?.key==="k_quran"?"scale(1.25)":"scale(1)",
                                transition:"all 0.18s" }}>🌊
                            </button>
                          )}
                          {unplacedKids.map(task => {
                            const em = KIDS_GARDEN_MAP[task.id] || "✨";
                            const isPend = kidsPendingItem?.key===task.id;
                            return (
                              <button key={task.id}
                                onClick={() => setKidsPendingItem({ key:task.id, emoji:em, label:task.label })}
                                style={{ fontSize:22, background:isPend?"#fef3c7":"transparent",
                                  border:"2px solid "+(isPend?KT.gold:"transparent"),
                                  borderRadius:8, padding:"2px 6px", cursor:"pointer",
                                  transform:isPend?"scale(1.25)":"scale(1)",
                                  transition:"all 0.18s" }}>
                                {em}
                              </button>
                            );
                          })}
                          {kidsPendingItem && (
                            <span style={{ fontSize:9, color:KT.gold, fontFamily:"sans-serif",
                              fontStyle:"italic" }}>tap garden ↓</span>
                          )}
                        </div>
                      );
                    })()}
                    <div
                      onClick={function(e) {
                        if (!kidsPendingItem) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const xPct = Math.round(((e.clientX-rect.left)/rect.width)*100);
                        const yPct = Math.round(((e.clientY-rect.top)/rect.height)*100);
                        placeKidsItem(kidsPendingItem.key, kidsPendingItem.emoji,
                          Math.min(Math.max(xPct,8),92)+"%",
                          Math.min(Math.max(yPct,8),85)+"%");
                      }}
                      style={{ minHeight:220, position:"relative",
                        cursor: kidsPendingItem && kidsTab==="garden" ? "crosshair" : "default",
                        border: kidsPendingItem && kidsTab==="garden" ? "2px solid "+KT.gold : "2px solid transparent",
                      }}>
                      {/* Sky */}
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:"52%",
                        background:"linear-gradient(180deg,#bfdbfe,#dbeafe)" }} />
                      {/* Horizon blend */}
                      <div style={{ position:"absolute", top:"48%", left:0, right:0, height:"8%",
                        background:"linear-gradient(180deg,#dbeafe,#bbf7d0)" }} />
                      {/* Ground — greener with more prayers */}
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"44%",
                        background: prayersDone >= 3
                          ? "linear-gradient(180deg,#86efac,#4ade80)"
                          : "linear-gradient(180deg,#bbf7d0,#86efac)" }} />
                      {/* Sun always shown */}
                      <div style={{ position:"absolute", top:8, right:14, fontSize:26 }}>☀️</div>
                      {/* Witr → single star */}
                      {HAS_STAR && <div style={{ position:"absolute", top:8, left:14, fontSize:20 }}>⭐</div>}
                      {/* Dhikr → sparkle */}
                      {HAS_LIGHT && <div style={{ position:"absolute", top:10, left:"42%", fontSize:16 }}>✨</div>}
                      {/* Kindness → doves */}
                      {HAS_KINDNESS && <>
                        <div style={{ position:"absolute", top:14, left:"24%", fontSize:15 }}>🕊️</div>
                        <div style={{ position:"absolute", top:9,  left:"36%", fontSize:12 }}>🕊️</div>
                      </>}
                      {/* River */}
                      {HAS_RIVER && <div style={{ position:"absolute", bottom:"24%", left:0, right:0, height:12,
                        background:"linear-gradient(90deg,#93c5fd66,#60a5fa,#93c5fd66)",
                        borderRadius:6, margin:"0 16px" }} />}
                      {/* Fountain */}
                      {HAS_FOUNTAIN && <div style={{ position:"absolute", bottom:"29%", right:"8%", fontSize:22 }}>⛲</div>}
                      {/* Quran river — rendered as strip */}
                      {kidsGardenLayout["k_quran"] && (
                        <div style={{ position:"absolute", bottom:"26%", left:0, right:0, height:13,
                          background:"linear-gradient(90deg,#93c5fd66,#60a5fa,#93c5fd66)",
                          borderRadius:6, margin:"0 14px" }} />
                      )}
                      {/* Placed deed items — sized by type */}
                      {Object.entries(kidsGardenLayout).map(([key, item]) => {
                        if (!item || key==="k_quran") return null;
                        const SIZES = { k_parents:34, k_sadaqah:26, k_kind:20,
                          k_adkhar:16, k_dua:24, k_bismillah:22 };
                        const sz = SIZES[key] || 22;
                        return (
                          <div key={key} style={{
                            position:"absolute", left:item.x, top:item.y,
                            transform:"translate(-50%,-50%)",
                            fontSize:sz, lineHeight:1,
                            filter:"drop-shadow(0 2px 5px rgba(0,0,0,0.15))",
                            transition:"all 0.35s ease",
                          }}>{item.emoji}</div>
                        );
                      })}
                      {/* Varied trees from sunnah (non-interactive, auto-placed) */}
                      {KIDS_TREES.slice(0, Math.min(sunnahDone, 4)).map((t,i) => (
                        <div key={i} style={{ position:"absolute", bottom:t.bottom,
                          left:t.left, fontSize:t.size }}>{t.emoji}</div>
                      ))}
                      {/* House */}
                      <div style={{ position:"absolute", bottom:"22%", left:"50%",
                        transform:"translateX(-50%)", textAlign:"center" }}>
                        {DONE_ALL
                          ? <><div style={{ fontSize:52 }}>🏡</div>
                            <div style={{ fontSize:9, fontWeight:800, color:"#166534",
                              fontFamily:"'Fredoka One',sans-serif",
                              background:"rgba(255,255,255,0.85)", padding:"1px 6px",
                              borderRadius:6, marginTop:2 }}>Your Jannah Home!</div></>
                          : HAS_ROOF ? <div style={{ fontSize:46 }}>🏠</div>
                          : HAS_DOOR ? <div style={{ fontSize:38 }}>🧱</div>
                          : <div style={{ fontSize:30, opacity:0.45 }}>🪨</div>}
                      </div>
                      {/* Brick progress — centred top */}
                      <div style={{ position:"absolute", top:8, left:"50%",
                        transform:"translateX(-50%)", display:"flex", gap:4 }}>
                        {Array.from({length:5}).map((_,i) => (
                          <span key={i} style={{ fontSize:15,
                            opacity:i<BRICKS?1:0.18,
                            filter:i<BRICKS?"none":"grayscale(1)" }}>🧱</span>
                        ))}
                      </div>
                      {/* Placing hint */}
                      {kidsPendingItem && kidsTab==="garden" && (
                        <div style={{ position:"absolute", inset:0, display:"flex",
                          alignItems:"flex-end", justifyContent:"center",
                          paddingBottom:10, pointerEvents:"none" }}>
                          <div style={{ background:"rgba(0,0,0,0.55)", borderRadius:20,
                            padding:"6px 14px", fontSize:12, color:"#fff",
                            fontFamily:"'Fredoka One',sans-serif" }}>
                            Tap to plant {kidsPendingItem.emoji}!
                          </div>
                        </div>
                      )}
                      {prayersDone === 0 && kidsAge!=="little" && Object.keys(kidsGardenLayout).length===0 && (
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
                    <div style={{ padding:"8px 12px", background:"rgba(255,255,255,0.8)",
                      display:"flex", flexWrap:"wrap", gap:6 }}>
                      {[
                        { icon:"🏠", label:"Prayers = house" },
                        { icon:"🌴", label:"Sunnah = trees & flowers" },
                        { icon:"🌊", label:"Quran = river" },
                        { icon:"🌳", label:"Help Parents = oak" },
                        { icon:"🌻", label:"Sadaqah = sunflower" },
                        { icon:"🕊️", label:"Kindness = dove" },
                        { icon:"☁️", label:"Dua = cloud" },
                        { icon:"✨", label:"Adhkar = fireflies" },
                        { icon:"🌟", label:"Bismillah = star" },
                      ].map(item => (
                        <div key={item.label} style={{ display:"flex", alignItems:"center", gap:3,
                          fontSize:10, color:"#166534", fontFamily:"'Nunito',sans-serif", fontWeight:600 }}>
                          <span>{item.icon}</span><span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>
            )} {/* end garden tab */}

            {/* Kids learn tab */}
            {kidsTab === "learn" && (() => {
              const KIDS_FACTS = [
                { emoji:"☪️", title:"Why do we pray?",    body:"Allah loves us and wants us to talk to Him 5 times a day. Prayer is like a phone call to Allah! 📞", ar:"وَأَقِيمُوا الصَّلَاةَ", src:"Quran 2:43" },
                { emoji:"📿", title:"What is Dhikr?",     body:"Dhikr means remembering Allah. When we say SubhanAllah, Alhamdulillah, or Allahu Akbar — that is dhikr! Angels write it down. 📝", ar:"اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا", src:"Quran 33:41" },
                { emoji:"📖", title:"Why read Quran?",    body:"The Quran is Allah's message to us. Every letter we read gives us 10 good deeds! That's a LOT of points! 🌟", ar:"اقْرَأْ بِاسْمِ رَبِّكَ", src:"Quran 96:1" },
                { emoji:"🤝", title:"Be Kind to everyone",body:"The Prophet ﷺ said: 'The best of you are those who are best in character.' Being kind to family and friends makes Allah happy! 😊", ar:"إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ", src:"Quran 2:195" },
                { emoji:"🤲", title:"What is Dua?",       body:"Dua is asking Allah for anything you need. You can make dua anytime, anywhere — Allah is always listening! 👂", ar:"ادْعُونِي أَسْتَجِبْ لَكُمْ", src:"Quran 40:60" },
                { emoji:"💛", title:"Sadaqah is amazing!", body:"Sadaqah means giving something to help others. Even a smile is sadaqah! And it never makes you poorer — Allah gives back more! 🎁", ar:"مَن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا", src:"Quran 2:245" },
                { emoji:"🌙", title:"What is Ramadan?",   body:"Ramadan is the special month when we fast (no food or drink during the day) to get closer to Allah. The Quran was sent down in this month! 🌙", ar:"شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ", src:"Quran 2:185" },
                { emoji:"🕋", title:"What is Hajj?",       body:"Hajj is the big trip to Makkah that Muslims do once in their life. Millions of people go together to worship Allah. Maybe you'll go one day! ✈️", ar:"وَلِلَّهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ", src:"Quran 3:97" },
                { emoji:"💧", title:"What is Wudu?",       body:"Wudu is washing before prayer — your hands, face, arms and feet. The Prophet ﷺ said sins fall off with the water. You become clean inside and outside! 💧", ar:"يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ", src:"Quran 5:6" },
                { emoji:"🌟", title:"Who was the Prophet?", body:"Prophet Muhammad ﷺ was the best human who ever lived. He was kind, honest and loved everyone. We follow his example called the Sunnah. ﷺ", ar:"لَقَدْ كَانَ لَكُمْ فِي رَسُولِ اللَّهِ أُسْوَةٌ حَسَنَةٌ", src:"Quran 33:21" },
                { emoji:"👼", title:"What are Angels?",    body:"Angels are made of light and they never disobey Allah. Two angels write down everything you do — the good and the bad. They love it when you do good! ✨", ar:"وَإِنَّ عَلَيْكُمْ لَحَافِظِينَ كِرَامًا كَاتِبِينَ", src:"Quran 82:10-11" },
                { emoji:"🏡", title:"What is Jannah?",     body:"Jannah is Paradise — the most beautiful place ever! No sadness, no pain, everything you love forever. Good deeds build your home there! 🌈", ar:"وَبَشِّرِ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ أَنَّ لَهُمْ جَنَّاتٍ", src:"Quran 2:25" },
                { emoji:"🤲", title:"When to make Dua?",   body:"You can make dua anytime but the best times are: after prayer, when it rains, when fasting, and the last third of the night. Allah loves to hear you! 💛", ar:"وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ", src:"Quran 2:186" },
              ];
              const factIdx = Math.floor(Date.now() / 86400000) % KIDS_FACTS.length;
              const fact = KIDS_FACTS[factIdx];
              return (
                <div style={{ padding:"10px 14px 0" }}>
                  <div style={{ background:KT.card, borderRadius:20, border:"3px solid "+KT.border,
                    overflow:"hidden", marginBottom:12 }}>
                    <div style={{ background:KT.headerBg, padding:"12px 16px", textAlign:"center" }}>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontFamily:"sans-serif",
                        letterSpacing:2, textTransform:"uppercase" }}>Today I Learn</div>
                    </div>
                    <div style={{ padding:"20px 16px", textAlign:"center" }}>
                      <div style={{ fontSize:52, marginBottom:12 }}>{fact.emoji}</div>
                      <div style={{ fontSize:17, fontWeight:700, color:KT.text,
                        fontFamily:"'Fredoka One',sans-serif", marginBottom:12 }}>{fact.title}</div>
                      <div style={{ fontSize:14, color:KT.sub, fontFamily:"sans-serif",
                        lineHeight:"1.7", marginBottom:16 }}>{fact.body}</div>
                      <div style={{ fontSize:16, color:KT.gold, fontFamily:"'Amiri Quran','Amiri',serif",
                        direction:"rtl", lineHeight:"2.2", marginBottom:6 }}>{fact.ar}</div>
                      <div style={{ fontSize:10, color:KT.muted, fontFamily:"sans-serif",
                        fontStyle:"italic" }}>— {fact.src}</div>
                    </div>
                  </div>
                  {/* All facts list */}
                  <div style={{ fontSize:9, color:KT.gold, fontFamily:"sans-serif",
                    letterSpacing:2, textTransform:"uppercase", marginBottom:8, fontWeight:700 }}>All Lessons</div>
                  {KIDS_FACTS.map((f,i) => (
                    <div key={i} style={{ background:i===factIdx?KT.gold+"18":KT.card,
                      border:"2px solid "+(i===factIdx?KT.gold:KT.border),
                      borderRadius:14, padding:"12px 14px", marginBottom:8,
                      display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:24 }}>{f.emoji}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:i===factIdx?KT.gold:KT.text,
                          fontFamily:"'Fredoka One',sans-serif" }}>{f.title}</div>
                        <div style={{ fontSize:10, color:KT.muted, fontFamily:"sans-serif" }}>
                          {i===factIdx?"Today's lesson ✨":"Lesson "+(i+1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Kids settings tab — show full settings */}
            {kidsTab === "settings" && (
              <div style={{ padding:"10px 14px 0" }}>

                {/* Return to adult mode — prominent at top */}
                <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                  <button onClick={() => setMode("classic")} style={{
                    flex:1, padding:"13px", borderRadius:14,
                    background:"linear-gradient(135deg,#c27c2a,#a05a18)",
                    border:"none", color:"#fff", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  }}>
                    <span style={{ fontSize:20 }}>☪️</span>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontSize:13, fontWeight:700,
                        fontFamily:"'Lora',serif" }}>Switch to Classic</div>
                      <div style={{ fontSize:10, opacity:0.85,
                        fontFamily:"sans-serif" }}>Adult tracker</div>
                    </div>
                  </button>
                  <button onClick={() => setMode("gamified")} style={{
                    flex:1, padding:"13px", borderRadius:14,
                    background:"linear-gradient(135deg,#6366f1,#7c3aed)",
                    border:"none", color:"#fff", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  }}>
                    <span style={{ fontSize:20 }}>⭐</span>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontSize:13, fontWeight:700,
                        fontFamily:"'Lora',serif" }}>Switch to Journey</div>
                      <div style={{ fontSize:10, opacity:0.85,
                        fontFamily:"sans-serif" }}>Points & garden</div>
                    </div>
                  </button>
                </div>

                {/* Mode */}
                <div style={{ background:KT.card, borderRadius:14, border:"2px solid "+KT.border,
                  overflow:"hidden", marginBottom:12 }}>
                  <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid "+KT.border,
                    fontSize:10, letterSpacing:3, textTransform:"uppercase",
                    fontWeight:700, fontFamily:"sans-serif", color:KT.gold }}>Mode</div>
                  <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                    {[
                      { key:"classic",  icon:"☪️", label:"Classic",  desc:"Adult tracker" },
                      { key:"gamified", icon:"⭐", label:"Journey",  desc:"Points & garden" },
                      { key:"kids",     icon:"🌱", label:"Kids",     desc:"Currently active" },
                    ].map(function(m) {
                      const active = mode === m.key;
                      return (
                        <button key={m.key} onClick={() => setMode(m.key)} style={{
                          display:"flex", alignItems:"center", gap:12, padding:"11px 14px",
                          borderRadius:12, border:"2px solid "+(active?KT.gold:KT.border),
                          background:active?KT.gold+"22":KT.alt,
                          cursor:"pointer", textAlign:"left", transition:"all 0.18s",
                        }}>
                          <span style={{ fontSize:22 }}>{m.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14, fontWeight:700,
                              color:active?KT.gold:KT.text,
                              fontFamily:"'Fredoka One',sans-serif" }}>{m.label}</div>
                            <div style={{ fontSize:11, color:KT.muted,
                              fontFamily:"sans-serif" }}>{m.desc}</div>
                          </div>
                          {active && <span style={{ fontSize:16, color:KT.gold }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Age group */}
                <div style={{ background:KT.card, borderRadius:14, border:"2px solid "+KT.border,
                  overflow:"hidden", marginBottom:12 }}>
                  <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid "+KT.border,
                    fontSize:10, letterSpacing:3, textTransform:"uppercase",
                    fontWeight:700, fontFamily:"sans-serif", color:KT.gold }}>Age Group</div>
                  <div style={{ padding:"12px 14px", display:"flex", gap:8 }}>
                    <button onClick={() => setKidsAge("little")} style={{
                      flex:1, padding:"12px 8px", borderRadius:12,
                      border:"2px solid "+(kidsAge==="little"?"#f59e0b":KT.border),
                      background:kidsAge==="little"?"#fef3c7":KT.alt,
                      cursor:"pointer", textAlign:"center" }}>
                      <div style={{ fontSize:22, marginBottom:4 }}>🌱</div>
                      <div style={{ fontSize:13, fontWeight:700, color:kidsAge==="little"?"#f59e0b":KT.text,
                        fontFamily:"'Fredoka One',sans-serif" }}>Under 7</div>
                    </button>
                    <button onClick={() => setKidsAge("older")} style={{
                      flex:1, padding:"12px 8px", borderRadius:12,
                      border:"2px solid "+(kidsAge==="older"?KT.gold:KT.border),
                      background:kidsAge==="older"?KT.gold+"22":KT.alt,
                      cursor:"pointer", textAlign:"center" }}>
                      <div style={{ fontSize:22, marginBottom:4 }}>🌟</div>
                      <div style={{ fontSize:13, fontWeight:700, color:kidsAge==="older"?KT.gold:KT.text,
                        fontFamily:"'Fredoka One',sans-serif" }}>Ages 7-12</div>
                    </button>
                  </div>
                </div>

                {/* Theme */}
                <div style={{ background:KT.card, borderRadius:14, border:"2px solid "+KT.border,
                  overflow:"hidden", marginBottom:12 }}>
                  <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid "+KT.border,
                    fontSize:10, letterSpacing:3, textTransform:"uppercase",
                    fontWeight:700, fontFamily:"sans-serif", color:KT.gold }}>Appearance</div>
                  <div style={{ padding:"12px 14px", display:"flex", gap:8 }}>
                    {[["light","☀️","Light"],["dark","🌙","Dark"]].map(function(t) {
                      const active = theme === t[0];
                      return (
                        <button key={t[0]} onClick={() => setTheme(t[0])} style={{
                          flex:1, padding:"10px", borderRadius:10,
                          border:"2px solid "+(active?KT.gold:KT.border),
                          background:active?KT.gold+"22":KT.alt,
                          cursor:"pointer", fontSize:13, fontFamily:"'Fredoka One',sans-serif",
                          color:active?KT.gold:KT.text, fontWeight:active?700:400 }}>
                          {t[1]} {t[2]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prayer times */}
                <div style={{ background:KT.card, borderRadius:14, border:"2px solid "+KT.border,
                  overflow:"hidden", marginBottom:12 }}>
                  <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid "+KT.border,
                    fontSize:10, letterSpacing:3, textTransform:"uppercase",
                    fontWeight:700, fontFamily:"sans-serif", color:KT.gold }}>Prayer Times</div>
                  <div style={{ padding:"12px 14px" }}>
                    <button onClick={() => setTab("times")} style={{
                      display:"flex", alignItems:"center", gap:10, width:"100%",
                      padding:"10px 12px", background:KT.alt, border:"1px solid "+KT.border,
                      borderRadius:10, cursor:"pointer", textAlign:"left" }}>
                      <span style={{ fontSize:18 }}>🕐</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:KT.text,
                          fontFamily:"'Fredoka One',sans-serif" }}>View Prayer Times</div>
                        <div style={{ fontSize:10, color:KT.muted, fontFamily:"sans-serif" }}>
                          Fajr, Dhuhr, Asr, Maghrib, Isha
                        </div>
                      </div>
                      <span style={{ color:KT.muted }}>›</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Parent settings modal — no PIN needed */}
            {kidsParent && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                <div style={{ background:"#fff", borderRadius:20, padding:24, width:"100%", maxWidth:340 }}>
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



                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => { setKidsParent(false); }} style={{ flex:1, padding:"10px", background:"#7c3aed", border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>Done</button>
                        <button onClick={() => { setMode("classic"); setKidsParent(false); }} style={{ flex:1, padding:"10px", background:"#f5f5f5", border:"1px solid #e0e0e0", borderRadius:8, color:"#666", cursor:"pointer", fontSize:12 }}>Exit Kids Mode</button>
                      </div>
                    </div>
                </div>
              </div>
            )}
            {/* Kids bottom spacer */}
            <div style={{ height:120 }} />
          </div>
        )}

        {/* ── Bottom nav (fixed) — adult and kids ── */}
        <div style={{
          position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
          width:"100%", maxWidth:480, zIndex:50,
          display:"flex",
          background: kidsMode ? KT.card : T.card,
          borderTop:"1px solid " + (kidsMode ? KT.border : T.border),
          boxShadow:"0 -2px 12px rgba(0,0,0,0.08)",
          paddingBottom:"env(safe-area-inset-bottom, 0px)",
        }}>
          {kidsMode ? (
            // Kids bottom nav
            [
              { key:"deeds",    icon:"📋", label:"Deeds"    },
              { key:"garden",   icon:"🏡", label:"Garden"   },
              { key:"learn",    icon:"📖", label:"Learn"    },
              { key:"settings", icon:"⚙️", label:"Settings" },
            ].map(function(item) {
              const active = kidsTab === item.key;
              return (
                <button key={item.key} onClick={() => setKidsTab(item.key)} style={{
                  flex:1, padding:"10px 4px 8px", border:"none", cursor:"pointer",
                  background:"transparent",
                  color: active ? KT.gold : KT.muted,
                  display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                  transition:"all 0.18s",
                }}>
                  <span style={{ fontSize:18, lineHeight:"1" }}>{item.icon}</span>
                  <span style={{ fontSize:9, fontFamily:"'Fredoka One','Nunito',sans-serif",
                    fontWeight: active ? 700 : 400, letterSpacing:0.5 }}>{item.label}</span>
                  {active && <div style={{ width:18, height:2, borderRadius:1,
                    background:KT.gold, marginTop:1 }} />}
                </button>
              );
            })
          ) : (
            // Adult bottom nav — garden in Journey, Reflect in Classic
            (mode === "gamified"
              ? [
                  { key:"today",    icon:"📋", label:"Today"   },
                  { key:"muhasaba", icon:"🪞", label:"Reflect" },
                  { key:"garden",   icon:"🌳", label:"Garden"  },
                  { key:"more",     icon:"☰",  label:"More"    },
                  { key:"settings", icon:"⚙️", label:"Settings"},
                ]
              : [
                  { key:"today",    icon:"📋", label:"Today"   },
                  { key:"muhasaba", icon:"🪞", label:"Reflect" },
                  { key:"adhkar",   icon:"📿", label:"Adhkar"  },
                  { key:"more",     icon:"☰",  label:"More"    },
                  { key:"settings", icon:"⚙️", label:"Settings"},
                ]
            ).map(function(item) {
              const active = tab === item.key;
              return (
                <button key={item.key} onClick={() => setTab(item.key)} style={{
                  flex:1, padding:"10px 4px 8px", border:"none", cursor:"pointer",
                  background:"transparent",
                  color: active ? GOLD : T.muted,
                  display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                  transition:"all 0.18s",
                }}>
                  <span style={{ fontSize:18, lineHeight:"1" }}>{item.icon}</span>
                  <span style={{ fontSize:9, fontFamily:"sans-serif", fontWeight: active ? 700 : 400,
                    letterSpacing:0.5 }}>{item.label}</span>
                  {active && <div style={{ width:18, height:2, borderRadius:1,
                    background:GOLD, marginTop:1 }} />}
                </button>
              );
            })
          )}
        </div>

        {/* ══ TODAY ══ */}
        {!kidsMode && tab === "today" && (
          <div style={{ padding:"10px 14px 0" }}>

            {/* Sub-tabs — Salah / Deeds */}
            {!kidsMode && (
              <div style={{ display:"flex", gap:0, borderRadius:12, overflow:"hidden",
                border:"1px solid "+T.border, marginBottom:12 }}>
                {[["salah","🕌","Salah"],["deeds","📋","Deeds"]].map(function([k,icon,label]) {
                  const active = todayTab === k;
                  return (
                    <button key={k} onClick={() => setTodayTab(k)} style={{
                      flex:1, padding:"10px", border:"none", cursor:"pointer",
                      background: active ? GOLD : T.alt,
                      color: active ? "#fff" : T.muted,
                      fontFamily:"'Lora',Georgia,serif", fontSize:13,
                      fontWeight: active ? 700 : 400,
                      borderRight: k==="salah" ? "1px solid "+T.border : "none",
                      transition:"all 0.18s",
                    }}>
                      {icon} {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Smart context-aware banners — Deeds tab ── */}
            {(todayTab === "deeds" || kidsMode) && (() => {
              const nowMins = new Date().getHours()*60 + new Date().getMinutes();
              function ptMins(key) {
                if (!prayerTimes || !prayerTimes[key]) return null;
                const [h,m] = prayerTimes[key].split(":").map(Number);
                return h*60+m;
              }
              const fajrM    = ptMins("Fajr");
              const dhuhrM   = ptMins("Dhuhr");
              const maghribM = ptMins("Maghrib");
              const ishaM    = ptMins("Isha");

              // Morning window: after Fajr, before Dhuhr
              const isMorningWindow = fajrM && dhuhrM
                ? nowMins >= fajrM && nowMins < dhuhrM
                : new Date().getHours() >= 4 && new Date().getHours() < 12;

              // Evening window: after Maghrib, before Isha+90
              const isEveningWindow = maghribM
                ? nowMins >= maghribM && nowMins < maghribM + 90
                : new Date().getHours() >= 18 && new Date().getHours() < 22;

              // After any prayer window (general): show post-prayer
              const isAfterPrayer = fajrM && (() => {
                const times = [fajrM, dhuhrM, ptMins("Asr"), maghribM, ishaM].filter(Boolean);
                return times.some(t => nowMins >= t && nowMins < t + 30);
              })();

              const banners = [];

              // 1. Friday Surah Al-Kahf reminder
              if (IS_FRI) {
                const kahfDone = !!todayChecked["kahf"];
                banners.push(
                  <button key="kahf" onClick={() => { setTab("today"); }} style={{
                    display:"flex", alignItems:"center", gap:10, width:"100%",
                    padding:"11px 14px", marginBottom:8,
                    background: kahfDone ? "#f0fdf4" : "linear-gradient(135deg,#eef2ff,#ede9fe)",
                    border:"1px solid " + (kahfDone ? "#bbf7d0" : "#c7d2fe"), borderRadius:13,
                    cursor:"pointer", textAlign:"left", opacity: kahfDone ? 0.7 : 1,
                  }}>
                    <span style={{ fontSize:22 }}>{kahfDone ? "✅" : "📜"}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color: kahfDone ? "#16a34a" : "#4f46e5", fontFamily:"'Lora',serif" }}>
                        {kahfDone ? "Surah Al-Kahf read ✓" : "Read Surah Al-Kahf today"}
                      </div>
                      <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", marginTop:1 }}>
                        {kahfDone ? "جزاك الله خيرًا" : "It is Friday — light between two Fridays 🌟"}
                      </div>
                    </div>
                    {!kahfDone && <span style={{ fontSize:16, color:"#4f46e5" }}>›</span>}
                  </button>
                );
              }

              // 2. Morning adhkar after Fajr
              if (isMorningWindow) {
                banners.push(
                  <button key="morning" onClick={() => {
                    setAdhkarSetKey("morning_evening");
                    setAdhkarPrayer("Fajr");
                    setAdhkarScreen("count");
                    setTab("adhkar");
                  }} style={{
                    display:"flex", alignItems:"center", gap:10, width:"100%",
                    padding:"11px 14px", marginBottom:8,
                    background:"linear-gradient(135deg,#fef9c3,#fef3c7)",
                    border:"1px solid #fde68a", borderRadius:13,
                    cursor:"pointer", textAlign:"left",
                  }}>
                    <span style={{ fontSize:22 }}>🌅</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#92400e", fontFamily:"'Lora',serif" }}>Morning Adhkar</div>
                      <div style={{ fontSize:10, color:"#a16207", fontFamily:"sans-serif", marginTop:1 }}>Start your day with remembrance of Allah</div>
                    </div>
                    <span style={{ fontSize:16, color:"#92400e" }}>›</span>
                  </button>
                );
              }

              // 3. Evening adhkar after Maghrib
              if (isEveningWindow) {
                banners.push(
                  <button key="evening" onClick={() => {
                    setAdhkarSetKey("morning_evening");
                    setAdhkarPrayer("Maghrib");
                    setAdhkarScreen("count");
                    setTab("adhkar");
                  }} style={{
                    display:"flex", alignItems:"center", gap:10, width:"100%",
                    padding:"11px 14px", marginBottom:8,
                    background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",
                    border:"1px solid #c4b5fd", borderRadius:13,
                    cursor:"pointer", textAlign:"left",
                  }}>
                    <span style={{ fontSize:22 }}>🌇</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#5b21b6", fontFamily:"'Lora',serif" }}>Evening Adhkar</div>
                      <div style={{ fontSize:10, color:"#6d28d9", fontFamily:"sans-serif", marginTop:1 }}>End your day with remembrance of Allah</div>
                    </div>
                    <span style={{ fontSize:16, color:"#5b21b6" }}>›</span>
                  </button>
                );
              }

              // 4. Quran verse of the day
              const verseIdx = Math.floor((new Date().getTime() / 86400000)) % QURAN_VERSES.length;
              const verse = QURAN_VERSES[verseIdx];
              banners.push(
                <div key="verse" style={{
                  background:T.alt, border:"1px solid "+T.border, borderRadius:13,
                  padding:"12px 14px", marginBottom:8, textAlign:"center",
                }}>
                  <div style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif",
                    letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Verse of the Day</div>
                  <div style={{ fontSize:17, color:GOLD, fontFamily:"'Amiri Quran','Amiri',serif",
                    direction:"rtl", lineHeight:"2.2", marginBottom:6 }}>{verse.ar}</div>
                  <div style={{ fontSize:12, color:T.sub, fontStyle:"italic",
                    fontFamily:"'Lora',serif", lineHeight:"1.6", marginBottom:4 }}>"{verse.en}"</div>
                  <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>— Quran {verse.src}</div>
                </div>
              );

              // 5. Post-prayer adhkar (always shown, lower priority)
              banners.push(
                <button key="post" onClick={() => {
                  setAdhkarSetKey("post_prayer");
                  setAdhkarScreen("count");
                  setTab("adhkar");
                }} style={{
                  display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"11px 14px", marginBottom:10,
                  background:"linear-gradient(135deg," + GOLD + "18," + GOLD + "08)",
                  border:"1px solid " + GOLD + "44", borderRadius:13,
                  cursor:"pointer", textAlign:"left",
                }}>
                  <span style={{ fontSize:22 }}>📿</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:GOLD, fontFamily:"'Lora',serif" }}>
                      {isAfterPrayer ? "Time for Post-Prayer Adhkar" : "Post-Prayer Adhkar"}
                    </div>
                    <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", marginTop:1 }}>SubhanAllah · Alhamdulillah · Allahu Akbar · Ayat al-Kursi</div>
                  </div>
                  <span style={{ fontSize:16, color:GOLD }}>›</span>
                </button>
              );

              return banners;
            })()}

            {/* Exemption day banner for females — Deeds tab */}
            {todayTab === "deeds" && isFemale && (
              <div style={{ marginBottom:10 }}>
                <button onClick={toggleExempt} style={{
                  display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"11px 14px",
                  background: isExempt ? "#fdf2f8" : T.card,
                  border:"1px solid " + (isExempt ? "#f9a8d4" : T.border),
                  borderRadius:13, cursor:"pointer", textAlign:"left", transition:"all 0.18s",
                }}>
                  <span style={{ fontSize:20 }}>{isExempt ? "🌸" : "🌸"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700,
                      color: isExempt ? "#be185d" : T.sub,
                      fontFamily:"'Lora',serif" }}>
                      {isExempt ? "Exemption day active" : "Mark as exemption day"}
                    </div>
                    <div style={{ fontSize:10, color: isExempt ? "#ec4899" : T.muted,
                      fontFamily:"sans-serif", marginTop:1 }}>
                      {isExempt
                        ? "Prayers paused — du'a and dhikr are still open 🤍"
                        : "Tap to mark — prayers will be hidden for today"}
                    </div>
                  </div>
                  <div style={{
                    width:22, height:22, borderRadius:6,
                    background: isExempt ? "#ec4899" : "transparent",
                    border:"2px solid " + (isExempt ? "#ec4899" : T.border),
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, color:"#fff", flexShrink:0,
                    transition:"all 0.18s",
                  }}>{isExempt ? "✓" : ""}</div>
                </button>
                {isExempt && (
                  <div style={{ background:"#fdf2f8", border:"1px solid #f9a8d4",
                    borderRadius:"0 0 12px 12px", padding:"10px 14px",
                    marginTop:-4, borderTop:"none" }}>
                    <div style={{ fontSize:13, color:"#be185d",
                      fontFamily:"'Amiri Quran','Amiri',serif",
                      direction:"rtl", textAlign:"center", lineHeight:"2" }}>
                      اللَّهُمَّ إِنِّي أَسْأَلُكَ رِضَاكَ وَالْجَنَّةَ
                    </div>
                    <div style={{ fontSize:10, color:"#ec4899", textAlign:"center",
                      fontFamily:"sans-serif", fontStyle:"italic", marginTop:2 }}>
                      "O Allah, I ask You for Your pleasure and for Paradise"
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Eid section — Deeds tab ── */}
            {todayTab === "deeds" && IS_EID && (
              <div style={{ marginBottom:12, borderRadius:13,
                border:"1px solid #fde68a", overflow:"hidden",
                background:"linear-gradient(135deg,#fffbeb,#fef9c3)" }}>

                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"10px 13px 8px", borderBottom:"1px solid #fde68a" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:18 }}>🌙</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#92400e",
                      fontFamily:"'Lora',serif" }}>{EID_NAME}</span>
                    <span style={{ fontSize:13, color:"#a16207",
                      fontFamily:"'Amiri',serif" }}>{EID_AR}</span>
                  </div>
                  <span style={{ fontSize:10, fontFamily:"sans-serif", fontWeight:700,
                    color:"#92400e", background:"#fde68a", padding:"2px 8px", borderRadius:7 }}>
                    ✨ Eid Mubarak
                  </span>
                </div>

                {/* Eid prayer deed */}
                <div style={{ display:"flex", alignItems:"center" }}>
                  <button className="row-btn" onClick={() => toggle("eid_prayer")} style={{
                    display:"flex", alignItems:"center", gap:9, flex:1,
                    padding:"10px 13px", background:"transparent", border:"none",
                    borderLeft: todayChecked["eid_prayer"] ? "3px solid #f59e0b" : "3px solid transparent",
                    cursor:"pointer", textAlign:"left",
                    opacity: todayChecked["eid_prayer"] ? 0.55 : 1,
                  }}>
                    <span style={{ fontSize:18, width:22, textAlign:"center" }}>🕌</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:13, fontWeight:500, color:T.text,
                          textDecoration: todayChecked["eid_prayer"] ? "line-through" : "none" }}>
                          Eid Prayer
                        </span>
                        <span style={{ fontSize:12, color:T.muted, fontFamily:"'Amiri',serif" }}>
                          صلاة العيد
                        </span>
                      </div>
                      <div style={{ fontSize:10, color:"#a16207", fontFamily:"sans-serif" }}>
                        2 rak'ahs with extra takbeer — prayed in congregation
                      </div>
                    </div>
                    <Checkbox checked={!!todayChecked["eid_prayer"]} color="#f59e0b" />
                  </button>
                </div>

                {/* Takbeer */}
                <div style={{ padding:"10px 13px", borderTop:"1px solid #fde68a" }}>
                  <div style={{ fontSize:10, color:"#a16207", fontFamily:"sans-serif",
                    letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>
                    Eid Takbeer
                  </div>
                  <div style={{ fontSize:15, color:"#92400e",
                    fontFamily:"'Amiri Quran','Amiri',serif",
                    direction:"rtl", lineHeight:"2.2", textAlign:"center" }}>
                    {EID_TAKBEER.split("♥").map((phrase, i) => (
                      <div key={i}>{phrase.trim()}</div>
                    ))}
                  </div>
                </div>

                {/* Fasting forbidden note */}
                <div style={{ padding:"8px 13px 10px", borderTop:"1px solid #fde68a",
                  background:"#fff7ed", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16 }}>⚠️</span>
                  <div style={{ fontSize:11, color:"#9a3412", fontFamily:"sans-serif" }}>
                    <strong>Fasting is forbidden on Eid</strong> — it is haram to fast today.
                    Eat, celebrate and give thanks to Allah. 🍽️
                  </div>
                </div>
              </div>
            )}

            {/* Ramadan section — Deeds tab */}
            {todayTab === "deeds" && IS_RAMADAN && (
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

            {/* ── Sunnah Fasts reminder — Deeds tab ── */}
            {todayTab === "deeds" && !IS_RAMADAN && !IS_EID && (() => {
              const WHITE_DAYS = [13,14,15];
              const isWhiteDay = WHITE_DAYS.includes(hijri.day);
              const isMonThu   = DOW === 1 || DOW === 4;
              const isArafah   = hijri.month === 12 && hijri.day === 9;
              const isAshura   = hijri.month === 1  && hijri.day === 10;
              const isMuharram = hijri.month === 1  && hijri.day === 9;
              const isShabanFast = hijri.month === 8 && hijri.day <= 15;
              const fastLabel  = isArafah ? "Day of Arafah fast 🕌 — expiation for 2 years"
                : isAshura ? "Day of Ashura fast — expiation for previous year"
                : isMuharram ? "9th Muharram — recommended to fast with Ashura"
                : isWhiteDay ? "Ayyam al-Beed — White Days fast (day "+hijri.day+")"
                : isMonThu ? (DOW===1?"Monday":"Thursday")+" — Sunnah fast day"
                : isShabanFast ? "Sha'ban fast — Prophet ﷺ fasted much in Sha'ban"
                : null;
              if (!fastLabel) return null;
              const fastDone = !!todayChecked["fast_today"];
              return (
                <div style={{ marginBottom:8, borderRadius:12,
                  border:"1px solid "+(isArafah||isAshura?"#c7d2fe":"#fde68a"),
                  background:isArafah||isAshura?"#eef2ff":"#fffbeb",
                  display:"flex", alignItems:"center", gap:10, padding:"10px 13px" }}>
                  <span style={{ fontSize:18 }}>{isArafah||isAshura?"🕌":"🌙"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600,
                      color:isArafah||isAshura?"#4338ca":"#92400e",
                      fontFamily:"'Lora',serif" }}>{fastLabel}</div>
                    <div style={{ fontSize:10, color:isArafah||isAshura?"#6366f1":"#a16207",
                      fontFamily:"sans-serif", marginTop:1 }}>
                      {fastDone ? "✅ Fasting today — بارك الله فيك" : "Tap to mark fast in your deeds below"}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Salah — shown on Salah tab, hidden on exemption days */}
            {todayTab === "salah" && isFemale && isExempt && (
              <div style={{ background:"#fdf2f8", border:"1px solid #f9a8d4",
                borderRadius:13, padding:"16px 14px", marginBottom:10, textAlign:"center" }}>
                <div style={{ fontSize:22, marginBottom:6 }}>🌸</div>
                <div style={{ fontSize:13, color:"#be185d", fontWeight:600,
                  fontFamily:"'Lora',serif", marginBottom:4 }}>Exemption day</div>
                <div style={{ fontSize:11, color:"#ec4899", fontFamily:"sans-serif",
                  lineHeight:"1.6" }}>
                  Prayers are paused today. You can still make du'a,<br/>
                  read Quran, and do dhikr. 🤍
                </div>
              </div>
            )}
            {/* Salah — individual prayer boxes */}
            {todayTab === "salah" && (!isFemale || !isExempt) && PRAYERS.map(function(prayer) {
              const visRows = prayer.rows.filter(function(row) { return !row.ramadan || IS_RAMADAN; });
              const pDone    = visRows.filter(r => todayChecked[r.id]).length;
              const allDone  = pDone === visRows.length;
              const fardRows = visRows.filter(r => r.type === "F");
              const inMasjid = masjidPrayers.includes(prayer.id);
              // Only show masjid button for main 5 prayers (not duha/tahajjud)
              const showMasjid = ["fajr","dhuhr","asr","maghrib","isha"].includes(prayer.id);
              // Map prayer id to Aladhan timings key
              const PT_KEY  = { fajr:"Fajr", duha:"Sunrise", dhuhr:"Dhuhr", asr:"Asr", maghrib:"Maghrib", isha:"Isha", tahajjud:"Midnight" };
              const PT_LABEL = { duha:"After Sunrise", tahajjud:"After Midnight" };
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
              const ptFmt = PT_LABEL[prayer.id] || fmtTime(ptRaw);
              return (
                <div key={prayer.id} style={{ marginBottom:8, borderRadius:13, border:"1px solid " + T.salahBd, overflow:"hidden", background:T.salahBg }}>
                  {/* Prayer header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 13px 6px", borderBottom:"1px solid " + T.salahBd }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <span style={{ fontSize:16 }}>{prayer.icon}</span>
                      <span style={{ fontSize: mode === "classic" ? 15 : 14, fontWeight:600, color: allDone ? T.salahAc : T.text, textDecoration: allDone ? "line-through" : "none", fontFamily: mode === "gamified" ? "'Nunito',sans-serif" : "'Lora',serif" }}>{prayer.label}{prayer.id==="dhuhr"&&IS_FRI?" (Jumu'ah day)":""}</span>
                      <span style={{ fontSize:13, color:T.muted, fontFamily:"'Amiri',serif" }}>{prayer.ar}</span>
                      {ptFmt && <span style={{ fontSize:11, color:GOLD, fontFamily:"sans-serif", fontWeight:600, background:GOLD + "15", padding:"1px 7px", borderRadius:8, marginLeft:2 }}>{ptFmt}</span>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {inMasjid && (
                        <span style={{ fontSize:10, color:"#0369a1", background:"#e0f2fe",
                          padding:"1px 6px", borderRadius:6, fontFamily:"sans-serif", fontWeight:700 }}>
                          🕌 Jamaah
                        </span>
                      )}
                      <span style={{ fontSize:10, fontFamily:"sans-serif", fontWeight:700, color:T.salahAc, background:T.salahAc + "18", padding:"2px 7px", borderRadius:7 }}>{pDone}/{visRows.length}</span>
                      {showMasjid && (
                        <button onClick={() => toggleMasjid(prayer.id, fardRows.map(r=>r.id))} style={{
                          padding:"3px 8px", borderRadius:8,
                          border:"1px solid " + (inMasjid ? "#0369a1" : T.border),
                          background: inMasjid ? "#0369a1" : T.alt,
                          color: inMasjid ? "#fff" : T.muted,
                          cursor:"pointer", fontSize:11, fontFamily:"sans-serif",
                          transition:"all 0.18s",
                        }}>🕌</button>
                      )}
                    </div>
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
                            <span style={{ fontSize:12, color: chk ? T.muted : (row.optional ? T.muted : T.text), textDecoration: chk ? "line-through" : "none", flex:1, opacity: row.optional && !chk ? 0.7 : 1 }}>
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

            {/* Other sections — Deeds tab */}
            {todayTab === "deeds" && ["Jumuah","Adhkar","Quran","Charity","Fasting","Custom"].map(function(sec) {
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
                            {isFemale && task.id === "jumuah_prayer" && (
                              <div style={{ fontSize:10, color:"#7c3aed", fontFamily:"sans-serif", fontWeight:600, marginTop:1 }}>
                                🟣 Optional for women — rewarded if attended
                              </div>
                            )}
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

            {/* Add custom — Deeds tab */}
            {todayTab === "deeds" && !adding ? (
              <button className="tab-btn" onClick={() => setAdding(true)} style={{ width:"100%", padding:"10px", background:T.card, border:"2px dashed " + T.border, borderRadius:12, cursor:"pointer", color:T.muted, fontSize:13, fontFamily:"'Lora',Georgia,serif", marginBottom:10 }}>
                + Add Custom Deed
              </button>
            ) : (todayTab === "deeds" &&
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
        {!kidsMode && tab === "calendar" && (
          <div style={{ padding:"10px 14px 0" }}>
              <button onClick={() => setTab("more")} style={{
                display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
                cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif",
                padding:"0 0 10px", marginTop:4,
              }}>
                ← Back
              </button>


            {/* Month nav */}
            {(() => {
              // Compute Hijri month for the 15th of this Gregorian month (middle of month)
              const midGreg = new Date(calYear, calMonth, 15);
              const midHijri = toHijri(midGreg);
              return (
                <div style={{ background:T.card, borderRadius:13, border:"1px solid "+T.border, padding:"10px 14px", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                    <button onClick={prevMonth} style={{ background:T.alt, border:"1px solid "+T.border, borderRadius:10, cursor:"pointer", color:GOLD, fontSize:22, padding:"6px 16px", minWidth:44 }}>‹</button>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:14, fontWeight:600, color:T.text, fontFamily:"'Lora',serif" }}>{MON_SHORT[calMonth]} {calYear}</div>
                    </div>
                    <button onClick={nextMonth} style={{ background:T.alt, border:"1px solid "+T.border, borderRadius:10, cursor:"pointer", color:isCurrentMonth?T.muted:GOLD, fontSize:22, padding:"6px 16px", minWidth:44, opacity:isCurrentMonth?0.3:1 }}>›</button>
                  </div>
                  {/* Hijri month range */}
                  <div style={{ textAlign:"center", fontSize:12, color:GOLD, fontFamily:"'Amiri',serif" }}>
                    {HM_AR[midHijri.month-1]} — {HM_EN[midHijri.month-1]} {midHijri.year} AH
                  </div>
                </div>
              );
            })()}

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
                const hDay = toHijri(new Date(calYear, calMonth, day));
                return (
                      <div key={day} onClick={() => !isFut && setSelectedDay(k)}
                        style={{ aspectRatio:"1", borderRadius:8, position:"relative",
                          background:"rgba("+rgb+","+alpha+")",
                          border:isT?"2px solid "+GOLD:"1px solid "+T.border,
                          cursor:isFut?"default":"pointer" }}>
                        <div style={{ position:"absolute", top:2, left:0, right:0, textAlign:"center",
                          fontSize:9, fontWeight:isT?700:400,
                          color:isT?GOLD:T.sub, fontFamily:"sans-serif" }}>{day}</div>
                        {/* Hijri day number */}
                        <div style={{ position:"absolute", top:"40%", left:0, right:0, textAlign:"center",
                          fontSize:7, color:T.muted, fontFamily:"'Amiri',serif", opacity:0.7 }}>
                          {hDay.day}
                        </div>
                        {!isFut && dp > 0 && (
                          <div style={{ position:"absolute", bottom:2, left:0, right:0, textAlign:"center",
                            fontSize:7, fontWeight:700,
                            color:dp===100?GOLD:T.muted, fontFamily:"sans-serif" }}>
                            {dp===100?"⭐":dp+"%"}
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
        {!kidsMode && tab === "times" && (
          <div style={{ padding:"10px 14px 0" }}>
              <button onClick={() => setTab("more")} style={{
                display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
                cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif",
                padding:"0 0 10px", marginTop:4,
              }}>
                ← Back
              </button>


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

            <div style={{ background:T.card, borderRadius:14, border:"1px solid "+T.border, overflow:"hidden", marginBottom:12 }}>
              <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid "+T.border, fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD }}>Notifications</div>
              <div style={{ padding:"12px 14px" }}>
                {!("Notification" in window) ? (
                  <div style={{ fontSize:12, color:T.muted, fontFamily:"sans-serif", fontStyle:"italic" }}>
                    Notifications not supported on this device
                  </div>
                ) : (
                  <>
                    {/* Enable/disable */}
                    {/* Show denied warning */}
                    {Notification.permission === "denied" && (
                      <div style={{ background:"#fef2f2", border:"1px solid #fecaca",
                        borderRadius:8, padding:"8px 10px", marginBottom:10,
                        fontSize:11, color:"#dc2626", fontFamily:"sans-serif" }}>
                        ⚠️ Notifications blocked. Enable them in your device/browser settings, then refresh.
                      </div>
                    )}
                    <button onClick={function(e) {
                      e.preventDefault();
                      if (notifEnabled) { disableNotifications(); }
                      else { requestNotifications(); }
                    }} style={{
                      display:"flex", alignItems:"center", gap:10, width:"100%",
                      padding:"11px 12px", marginBottom: notifEnabled ? 12 : 0,
                      background: notifEnabled ? "#f0fdf4" : T.alt,
                      border:"1px solid "+(notifEnabled?"#bbf7d0":T.border),
                      borderRadius:11, cursor:"pointer", textAlign:"left", transition:"all 0.18s",
                    }}>
                      <span style={{ fontSize:20 }}>{notifEnabled ? "🔔" : "🔕"}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700,
                          color:notifEnabled?"#16a34a":T.text, fontFamily:"'Lora',serif" }}>
                          {notifEnabled ? "Prayer reminders on" : "Enable prayer reminders"}
                        </div>
                        <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", marginTop:1 }}>
                          {notifEnabled
                            ? "Tap to turn off · Notified at each prayer time"
                            : "Tap to enable · Fajr, Dhuhr, Asr, Maghrib, Isha"}
                        </div>
                      </div>
                      <div style={{ width:22, height:22, borderRadius:6, flexShrink:0,
                        background:notifEnabled?"#16a34a":"transparent",
                        border:"2px solid "+(notifEnabled?"#16a34a":T.border),
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:12, color:"#fff", transition:"all 0.18s" }}>
                        {notifEnabled?"✓":""}
                      </div>
                    </button>

                    {/* Offset slider */}
                    {notifEnabled && (
                      <div>
                        <div style={{ fontSize:11, color:T.sub, fontFamily:"sans-serif", marginBottom:6 }}>
                          Notify me
                          <strong style={{ color:GOLD }}> {notifOffset === 0 ? "at prayer time" : notifOffset+" min before"}</strong>
                        </div>
                        <input type="range" min="0" max="30" step="5" value={notifOffset}
                          onChange={e => { const v=parseInt(e.target.value); setNotifOffset(v); save("yawm_notif_offset",v); scheduleNotifications(); }}
                          style={{ width:"100%", accentColor:GOLD, cursor:"pointer" }} />
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                          <span style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif" }}>At prayer time</span>
                          <span style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif" }}>30 min before</span>
                        </div>
                        <div style={{ marginTop:8, padding:"8px 10px", background:GOLD+"10",
                          borderRadius:8, border:"1px solid "+GOLD+"33" }}>
                          <div style={{ fontSize:10, color:GOLD, fontFamily:"sans-serif" }}>
                            ℹ️ Notifications require prayer times to be loaded. Make sure location is enabled.
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ══ GARDEN ══ */}
        {!kidsMode && tab === "garden" && mode === "gamified" && (() => {
          // ── Daily garden — reflects TODAY only, resets each day ──────────────
          const todayH = hist[TODAY_KEY] || {};

          // What has been done today
          const FARD_DONE    = ["fajr_fard","dhuhr_fard","asr_fard","magh_fard","isha_fard"].filter(k=>todayH[k]).length; // 0-5
          const SUNNAH_DONE  = ["fajr_sun","dhuhr_sunB","dhuhr_sunA","magh_sunA","isha_sunA"].filter(k=>todayH[k]).length;
          const HAS_WITR     = !!todayH["witr"];
          const HAS_QURAN    = !!todayH["quran_recite"];
          const HAS_SADAQAH  = !!todayH["sadaqah_daily"];
          const HAS_TAHAJJUD = !!todayH["tahajjud_pray"];
          const HAS_DUHA     = !!todayH["duha_pray"];
          const HAS_ADHKAR   = !!(todayH["adhkar_morning"] || todayH["adhkar_evening"]);

          // Streak-based rewards (carry over — earned through consistency)
          const PALACE = streak >= 30;
          const GATE   = streak >= 7;

          // Garden richness score 0-100 for sky colour
          const richness = Math.round(
            (FARD_DONE/5)*40 + (SUNNAH_DONE/5)*15 +
            (HAS_QURAN?15:0) + (HAS_WITR?10:0) +
            (HAS_DUHA?5:0) + (HAS_TAHAJJUD?10:0) + (HAS_SADAQAH?5:0)
          );

          // Sky changes with richness
          const skyGrad = richness >= 80
            ? "linear-gradient(180deg,#fef9c3 0%,#bfdbfe 50%)"   // golden hour
            : richness >= 50
            ? "linear-gradient(180deg,#dbeafe 0%,#bfdbfe 50%)"   // bright blue
            : richness >= 20
            ? "linear-gradient(180deg,#e0f2fe 0%,#bae6fd 50%)"   // pale blue
            : "linear-gradient(180deg,#f1f5f9 0%,#e2e8f0 50%)";  // grey — nothing done

          // Hadith-linked garden elements — varied positions, different tree types
          // 5 prayer trees: palm 🌴, pine 🎄, deciduous 🌳, willow 🌿(use 🪴), baobab/oak 🌲
          // Scattered naturally — front trees lower/bigger, back trees higher/smaller (depth)
          const PRAYER_TREES = [
            { key:"fajr",    fardKey:"fajr_fard",  emoji:"🌴", x:"7%",  y:"34%", size:34, label:"Fajr — Palm",      hadith:"Fard prayer plants a tree in Jannah" },
            { key:"dhuhr",   fardKey:"dhuhr_fard", emoji:"🌲", x:"78%", y:"28%", size:26, label:"Dhuhr — Pine",     hadith:"" },
            { key:"asr",     fardKey:"asr_fard",   emoji:"🌳", x:"42%", y:"36%", size:36, label:"Asr — Oak",        hadith:"" },
            { key:"maghrib", fardKey:"magh_fard",  emoji:"🎋", x:"88%", y:"38%", size:28, label:"Maghrib — Bamboo", hadith:"" },
            { key:"isha",    fardKey:"isha_fard",  emoji:"🌵", x:"24%", y:"26%", size:24, label:"Isha — Cedar",     hadith:"" },
          ];
          // Sunnah flowers — scattered at varying heights near ground
          const FLOWER_POSITIONS = [
            { x:"6%",  y:"60%", size:20 },
            { x:"18%", y:"64%", size:16 },
            { x:"31%", y:"58%", size:18 },
            { x:"55%", y:"63%", size:20 },
            { x:"70%", y:"57%", size:16 },
          ];
          const SUNNAH_KEYS = ["fajr_sun","dhuhr_sunB","dhuhr_sunA","magh_sunA","isha_sunA"];
          const FLOWER_EMOJIS = ["🌸","🌺","🌼","🌻","🌹"];

          const GARDEN_ITEMS = [
            ...PRAYER_TREES.map(t => ({
              key:t.key, show:!!todayH[t.fardKey],
              emoji:t.emoji, x:t.x, y:t.y, size:t.size,
              label:t.label, hadith:t.hadith,
            })),
            ...SUNNAH_KEYS.map((k,i) => ({
              key:"sun_"+i, show:!!todayH[k],
              emoji:FLOWER_EMOJIS[i],
              x:FLOWER_POSITIONS[i].x, y:FLOWER_POSITIONS[i].y,
              size:FLOWER_POSITIONS[i].size, label:"Sunnah flower", hadith:"",
            })),
            // Witr → two stars, spread across sky
            { key:"witr",     show:HAS_WITR,      emoji:"⭐", x:"15%", y:"7%",  size:18, label:"Witr star",        hadith:"Do not sleep without Witr" },
            { key:"witr2",    show:HAS_WITR,      emoji:"✨", x:"60%", y:"9%",  size:14, label:"",                  hadith:"" },
            // Quran → River (rendered separately as strip)
            { key:"quran",    show:HAS_QURAN,     emoji:"💧", x:"50%", y:"66%", size:0,  label:"River of Quran",   hadith:"Recite Quran, for it will intercede — Muslim 804" },
            // Duha → Sun top right
            { key:"duha",     show:HAS_DUHA,      emoji:"☀️", x:"84%", y:"5%",  size:34, label:"Duha sun",         hadith:"Whoever prays Duha — Tirmidhi 474" },
            // Moon when no duha (always shown dimly in background)
            { key:"moon",     show:!HAS_DUHA,     emoji:"🌙", x:"84%", y:"5%",  size:22, label:"",                  hadith:"" },
            // Tahajjud → doves, spread across sky
            { key:"tahajjud", show:HAS_TAHAJJUD,  emoji:"🕊️", x:"28%", y:"11%", size:16, label:"Tahajjud dove",    hadith:"Best prayer after obligatory — Muslim 1163" },
            { key:"tahajjud2",show:HAS_TAHAJJUD,  emoji:"🕊️", x:"44%", y:"8%",  size:14, label:"",                  hadith:"" },
            // Adhkar → sparkles scattered
            { key:"adhkar",   show:HAS_ADHKAR,    emoji:"✨", x:"52%", y:"14%", size:16, label:"Dhikr light",      hadith:"SubhanAllah plants a tree in Jannah — Tirmidhi 3464" },
            { key:"adhkar2",  show:HAS_ADHKAR,    emoji:"✨", x:"34%", y:"17%", size:12, label:"",                  hadith:"" },
            // Sadaqah → fountain, left side mid-ground
            { key:"sadaqah",  show:HAS_SADAQAH,   emoji:"⛲", x:"20%", y:"50%", size:24, label:"Sadaqah fountain", hadith:"Sadaqah extinguishes sin — Tirmidhi 614" },
            // Streak gate / palace — centred, dominant
            { key:"gate",     show:GATE&&!PALACE, emoji:"🕌", x:"50%", y:"22%", size:40, label:"Gate of Jannah",   hadith:"7-day streak — باب الجنة" },
            { key:"palace",   show:PALACE,         emoji:"🏰", x:"50%", y:"16%", size:52, label:"Palace of Jannah", hadith:"30-day streak — قصر في الجنة" },
            // Eid — top left, separate from sun
            { key:"eid",      show:IS_EID,          emoji:"🌙", x:"10%", y:"5%",  size:20, label:"Eid Mubarak",      hadith:"تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ" },
          ];

          // Items earned today (completed deeds) — placed or unplaced
          const earnedItems = GARDEN_ITEMS.filter(i => i.show && i.size > 0);
          const placedItems = earnedItems.filter(i => gardenLayout[i.key]);
          const unplacedItems = earnedItems.filter(i => !gardenLayout[i.key] && i.key !== "moon");
          const isPlacingMode = pendingItem !== null && tab === "garden";
          const isEmpty = earnedItems.length === 0;

          function handleGardenTap(e) {
            if (!pendingItem) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
            const yPct = Math.round(((e.clientY - rect.top)  / rect.height) * 100);
            // Keep away from edges
            const clampedX = Math.min(Math.max(xPct, 8), 92);
            const clampedY = Math.min(Math.max(yPct, 8), 85);
            placeItem(pendingItem.key, pendingItem.emoji, clampedX + "%", clampedY + "%");
          }

          return (
            <div style={{ padding:"10px 14px 0" }}>
              <button onClick={() => setTab("more")} style={{
                display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
                cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif",
                padding:"0 0 10px", marginTop:4,
              }}>← Back</button>

              {/* Header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontWeight:700,
                  fontFamily:"sans-serif", color:GOLD }}>Today's Garden</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>
                    {placedItems.length} placed · {unplacedItems.length} to plant
                  </div>
                  {Object.keys(gardenLayout).length > 0 && (
                    <button onClick={() => { saveGardenLayout({}); setPendingItem(null); }} style={{
                      background:"none", border:"1px solid "+T.border, borderRadius:8,
                      padding:"3px 9px", fontSize:10, color:T.muted,
                      fontFamily:"sans-serif", cursor:"pointer",
                    }}>↺ Reset</button>
                  )}
                </div>
              </div>

              {/* Unplaced items — tap to select for placing */}
              {unplacedItems.length > 0 && (
                <div style={{ background: GOLD+"10", border:"1px solid "+GOLD+"33",
                  borderRadius:12, padding:"10px 12px", marginBottom:10 }}>
                  <div style={{ fontSize:10, color:GOLD, fontFamily:"sans-serif",
                    fontWeight:700, marginBottom:8 }}>
                    🌱 Tap an item to place it in your garden
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {unplacedItems.map(item => (
                      <button key={item.key}
                        onClick={() => setPendingItem({ key:item.key, emoji:item.emoji, label:item.label })}
                        style={{
                          padding:"6px 12px", borderRadius:10, cursor:"pointer",
                          border:"2px solid " + (pendingItem?.key===item.key ? GOLD : T.border),
                          background: pendingItem?.key===item.key ? GOLD+"22" : T.alt,
                          fontSize:20, transition:"all 0.18s",
                          transform: pendingItem?.key===item.key ? "scale(1.15)" : "scale(1)",
                        }}>
                        {item.emoji}
                        <div style={{ fontSize:8, color:T.muted, fontFamily:"sans-serif",
                          marginTop:2, textAlign:"center" }}>{item.label.split(" ")[0]}</div>
                      </button>
                    ))}
                  </div>
                  {pendingItem && (
                    <div style={{ fontSize:10, color:GOLD, fontFamily:"sans-serif",
                      marginTop:8, textAlign:"center", fontStyle:"italic" }}>
                      Now tap anywhere on the garden to plant {pendingItem.emoji}
                    </div>
                  )}
                </div>
              )}

              {/* Garden canvas — tappable when placing */}
              <div
                onClick={handleGardenTap}
                style={{ borderRadius:20, overflow:"hidden", marginBottom:12,
                  border:"2px solid " + (isPlacingMode ? GOLD : richness > 50 ? "#6366f155" : T.border),
                  minHeight:300, position:"relative",
                  cursor: isPlacingMode ? "crosshair" : "default",
                  boxShadow: isPlacingMode ? "0 0 0 3px "+GOLD+"44" : "none",
                  transition:"box-shadow 0.2s, border-color 0.2s",
                }}>

                {/* Sky */}
                <div style={{ position:"absolute", top:0, left:0, right:0, height:"50%", background:skyGrad }} />

                {/* Ground */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"42%",
                  background: FARD_DONE >= 3
                    ? "linear-gradient(180deg,#86efac,#4ade80)"
                    : FARD_DONE >= 1
                    ? "linear-gradient(180deg,#bbf7d0,#86efac)"
                    : "linear-gradient(180deg,#d1fae5,#a7f3d0)" }} />

                {/* Quran river — spans full width if placed */}
                {gardenLayout["quran"] && (
                  <div style={{ position:"absolute", bottom:"28%", left:0, right:0, height:14,
                    background:"linear-gradient(90deg,#93c5fd44,#60a5fa,#93c5fd44)",
                    borderRadius:7 }} />
                )}

                {/* Moon always in background */}
                {!HAS_DUHA && (
                  <div style={{ position:"absolute", right:"8%", top:"6%", fontSize:22, opacity:0.5 }}>🌙</div>
                )}

                {/* Placed items */}
                {Object.entries(gardenLayout).map(([key, item]) => {
                  if (!item || key === "quran") return null;
                  return (
                    <div key={key} style={{
                      position:"absolute",
                      left:item.x, top:item.y,
                      transform:"translate(-50%,-50%)",
                      fontSize: key==="palace"?48:key==="gate"?38:key==="duha"?32:
                                key.startsWith("sun")?18:22,
                      lineHeight:1,
                      filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                      transition:"all 0.4s ease",
                      cursor:"pointer",
                      userSelect:"none",
                    }}
                    title={key}
                    onClick={function(e) {
                      if (isPlacingMode) return; // don't remove while placing
                      e.stopPropagation();
                    }}>
                      {item.emoji}
                    </div>
                  );
                })}

                {/* Placing hint overlay */}
                {isPlacingMode && (
                  <div style={{ position:"absolute", inset:0, display:"flex",
                    alignItems:"flex-end", justifyContent:"center",
                    paddingBottom:12, pointerEvents:"none" }}>
                    <div style={{ background:"rgba(0,0,0,0.55)", borderRadius:20,
                      padding:"6px 16px", fontSize:12, color:"#fff",
                      fontFamily:"sans-serif" }}>
                      Tap to place {pendingItem?.emoji}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {isEmpty && (
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center", textAlign:"center", padding:24 }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>🌱</div>
                    <div style={{ fontSize:14, color:"#166534", fontFamily:"'Lora',serif",
                      fontWeight:600, marginBottom:6 }}>Your garden awaits</div>
                    <div style={{ fontSize:11, color:"#16a34a", fontFamily:"sans-serif", lineHeight:"1.6" }}>
                      Complete deeds today to earn garden items<br/>
                      then tap to place them where you like 🌳
                    </div>
                  </div>
                )}

                {/* Richness glow */}
                {richness >= 80 && (
                  <div style={{ position:"absolute", inset:0,
                    background:"radial-gradient(ellipse at 50% 30%,#fef08a22,transparent 60%)",
                    pointerEvents:"none" }} />
                )}
              </div>

              {/* Garden elements — what each deed grows */}
              <div style={{ background:T.card, borderRadius:14, border:"1px solid "+T.border,
                padding:"12px 14px", marginBottom:12 }}>
                <div style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700,
                  fontFamily:"sans-serif", color:GOLD, marginBottom:10 }}>What grows today</div>
                {[
                  { emoji:"🌳", label:"Fard Prayer Trees",   sub:"Each of the 5 daily prayers",    done:FARD_DONE,  total:5,  hadith:"Prayer is the pillar of the deen — Tirmidhi 2616" },
                  { emoji:"🌸", label:"Sunnah Flowers",      sub:"Sunnah prayers before & after",  done:SUNNAH_DONE,total:5,  hadith:"" },
                  { emoji:"⭐", label:"Witr Star",            sub:"Night prayer seal",              done:HAS_WITR?1:0,total:1, hadith:"Do not sleep without praying Witr — Abu Dawud 1416" },
                  { emoji:"💧", label:"River of Quran",       sub:"Daily Quran recitation",         done:HAS_QURAN?1:0,total:1,hadith:"Recite Quran, for it will intercede — Muslim 804" },
                  { emoji:"☀️", label:"Duha Sun",             sub:"Morning voluntary prayer",       done:HAS_DUHA?1:0,total:1, hadith:"Allah says: Son of Adam, pray 4 rak'ahs — Abu Dawud 1289" },
                  { emoji:"🕊️", label:"Tahajjud Dove",        sub:"Night vigil prayer",             done:HAS_TAHAJJUD?1:0,total:1,hadith:"Best prayer after obligatory — Muslim 1163" },
                  { emoji:"✨", label:"Dhikr Light",           sub:"Morning or evening adhkar",      done:HAS_ADHKAR?1:0,total:1,hadith:"SubhanAllah plants a tree in Jannah — Tirmidhi 3464" },
                  { emoji:"⛲", label:"Sadaqah Fountain",     sub:"Daily charity",                  done:HAS_SADAQAH?1:0,total:1,hadith:"Sadaqah extinguishes sin as water extinguishes fire — Tirmidhi 614" },
                  { emoji:"🕌", label:"Gate of Jannah",       sub:"7-day streak",                   done:GATE?1:0,  total:1,  hadith:"باب الجنة لمن داوم" },
                  { emoji:"🏰", label:"Palace of Jannah",     sub:"30-day streak",                  done:PALACE?1:0,total:1,  hadith:"قصر في الجنة لمن صبر" },
                ].map(function(row) {
                  // pct used below for bar width
                  const rowPct = row.total > 1 ? Math.round((row.done/row.total)*100) : null; // eslint-disable-line
                  const active = row.done > 0;
                  return (
                    <div key={row.label} style={{ marginBottom:10, opacity: active ? 1 : 0.45 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: row.hadith ? 3 : 0 }}>
                        <span style={{ fontSize:18, width:24, textAlign:"center" }}>{row.emoji}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:12, fontWeight:600, color: active ? T.text : T.muted,
                              fontFamily:"'Lora',serif" }}>{row.label}</span>
                            <span style={{ fontSize:11, fontWeight:700, color: active ? "#16a34a" : T.muted,
                              fontFamily:"sans-serif" }}>
                              {row.total > 1 ? row.done+"/"+row.total : (active ? "✓" : "—")}
                            </span>
                          </div>
                          <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>{row.sub}</div>
                          {row.total > 1 && (
                            <div style={{ height:4, background:T.borderL, borderRadius:2, marginTop:3, overflow:"hidden" }}>
                              <div style={{ height:"100%", borderRadius:2, background:active?"#16a34a":T.border,
                                width:(row.done/row.total*100)+"%", transition:"width 0.4s" }} />
                            </div>
                          )}
                        </div>
                      </div>
                      {row.hadith !== "" && active && (
                        <div style={{ marginLeft:32, fontSize:9, color:GOLD, fontFamily:"sans-serif",
                          fontStyle:"italic", marginTop:1 }}>{row.hadith}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tomorrow message */}
              {!isEmpty && (
                <div style={{ background:GOLD+"12", borderRadius:13, border:"1px solid "+GOLD+"33",
                  padding:"12px 14px", textAlign:"center", marginBottom:12 }}>
                  <div style={{ fontSize:13, color:GOLD, fontFamily:"'Amiri',serif",
                    lineHeight:"2", direction:"rtl", marginBottom:4 }}>
                    مَنْ عَمِلَ صَالِحًا فَلِنَفْسِهِ
                  </div>
                  <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", fontStyle:"italic" }}>
                    "Whoever does righteous deeds — it is for himself." — Quran 41:46
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ BADGES ══ */}
        {!kidsMode && tab === "badges" && mode === "gamified" && (
          <div style={{ padding:"10px 14px 0" }}>
              <button onClick={() => setTab("more")} style={{
                display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
                cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif",
                padding:"0 0 10px", marginTop:4,
              }}>
                ← Back
              </button>

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

        {/* ══ MUHASABA ══ */}
        {!kidsMode && tab === "muhasaba" && (
          <div style={{ padding:"10px 14px 16px" }}>

            {/* Daily status card */}
            {(() => {
              const fardDone  = FARD_IDS.filter(id => todayChecked[id]).length;
              const fardTotal = FARD_IDS.length;
              const fardPct   = fardTotal ? Math.round((fardDone/fardTotal)*100) : 0;
              const allIds    = getDayIds(IS_RAMADAN, IS_FRI && gender!=="female", IS_FAST, customs)
                                  .filter(id => !(isFemale && isExempt && FARD_IDS.includes(id)));
              const totalDone = allIds.filter(id => todayChecked[id]).length;
              const totalAll  = allIds.length;
              const totalPct  = totalAll ? Math.round((totalDone/totalAll)*100) : 0;
              const PRAYERS_STATUS = PRAYERS.map(p => {
                const fRows = p.rows.filter(r => r.type==="F");
                return { icon:p.icon, label:p.label, done:fRows.length>0 && fRows.every(r=>todayChecked[r.id]) };
              });
              const barCol = fardPct===100?"#16a34a":fardPct>=60?GOLD:"#f59e0b";
              const msg = fardPct===100
                ? "All prayers complete · الحمد لله"
                : fardPct===0
                ? "No prayers logged yet today"
                : fardDone + " of " + fardTotal + " prayers done today";
              return (
                <div style={{ background:T.card, borderRadius:14, border:"1px solid "+T.border,
                  padding:"14px", marginBottom:14 }}>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.text,
                      fontFamily:"'Lora',serif" }}>Today's Status</div>
                    <div style={{ fontSize:11, fontWeight:700, color:barCol,
                      fontFamily:"sans-serif" }}>{totalDone}/{totalAll} deeds</div>
                  </div>
                  {/* Prayer pills */}
                  <div style={{ display:"flex", gap:5, marginBottom:10, flexWrap:"wrap" }}>
                    {PRAYERS_STATUS.map(p => (
                      <div key={p.label} style={{ display:"flex", alignItems:"center", gap:3,
                        padding:"3px 8px", borderRadius:12,
                        background:p.done?"#f0fdf4":"#f9fafb",
                        border:"1px solid "+(p.done?"#bbf7d0":"#e5e7eb") }}>
                        <span style={{ fontSize:11 }}>{p.icon}</span>
                        <span style={{ fontSize:9, fontFamily:"sans-serif",
                          color:p.done?"#16a34a":"#9ca3af",
                          fontWeight:p.done?700:400 }}>{p.label}</span>
                        <span style={{ fontSize:8 }}>{p.done?"✓":"○"}</span>
                      </div>
                    ))}
                  </div>
                  {/* Overall progress bar */}
                  <div style={{ height:7, background:T.alt, borderRadius:4, overflow:"hidden", marginBottom:6 }}>
                    <div style={{ height:"100%", borderRadius:4, background:barCol,
                      width:totalPct+"%", transition:"width 0.4s" }} />
                  </div>
                  <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>{msg}</div>
                  {/* Streak */}
                  {streak > 0 && (
                    <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:14 }}>🔥</span>
                      <span style={{ fontSize:11, color:GOLD, fontFamily:"sans-serif", fontWeight:700 }}>
                        {streak} day streak — keep it going!
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Ayah header */}
            <div style={{ background:GOLD+"12", borderRadius:13, border:"1px solid "+GOLD+"33",
              padding:"14px 16px", textAlign:"center", marginBottom:14 }}>
              <div style={{ fontSize:15, color:GOLD, fontFamily:"'Amiri Quran','Amiri',serif",
                lineHeight:"2.2", direction:"rtl", marginBottom:6 }}>
                حَاسِبُوا أَنْفُسَكُمْ قَبْلَ أَنْ تُحَاسَبُوا
              </div>
              <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", fontStyle:"italic" }}>
                "Take account of yourselves before you are taken to account" — Umar ibn al-Khattab رضي الله عنه
              </div>
            </div>

            {/* Saved confirmation */}
            {mhSaved && (
              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:11,
                padding:"9px 13px", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:16 }}>✅</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#16a34a", fontFamily:"sans-serif" }}>Reflection saved</div>
                  <div style={{ fontSize:10, color:"#15803d", fontFamily:"sans-serif" }}>جزاك الله خيرًا — May Allah accept it from you</div>
                </div>
                <button onClick={() => setMhSaved(false)} style={{ background:"none", border:"none",
                  color:"#86efac", cursor:"pointer", fontSize:12 }}>✏️</button>
              </div>
            )}

            {/* Mood */}
            <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontWeight:700,
              fontFamily:"sans-serif", color:GOLD, marginBottom:8 }}>How was your heart today?</div>
            <div style={{ display:"flex", gap:6, marginBottom:14 }}>
              {[
                { id:"excellent", en:"Excellent", icon:"🌟", color:"#16a34a" },
                { id:"good",      en:"Good",      icon:"😊", color:"#2563eb" },
                { id:"okay",      en:"Okay",      icon:"😐", color:"#d97706" },
                { id:"hard",      en:"Hard",      icon:"😔", color:"#7c3aed" },
                { id:"struggling",en:"Struggling",icon:"🤲", color:"#dc2626" },
              ].map(m => {
                const active = mhMood === m.id;
                return (
                  <button key={m.id} onClick={() => { setMhMood(m.id); setMhSaved(false); }} style={{
                    flex:1, padding:"9px 3px", borderRadius:10,
                    border:"2px solid " + (active ? m.color : T.border),
                    background: active ? m.color+"18" : T.card,
                    cursor:"pointer", textAlign:"center", transition:"all 0.18s",
                    transform: active ? "scale(1.06)" : "scale(1)",
                  }}>
                    <div style={{ fontSize:18, marginBottom:2 }}>{m.icon}</div>
                    <div style={{ fontSize:8, color: active ? m.color : T.muted,
                      fontFamily:"sans-serif", fontWeight: active ? 700 : 400 }}>{m.en}</div>
                  </button>
                );
              })}
            </div>

            {/* Reflection prompts */}
            {[
              { key:"good",     icon:"✅", label:"What did I do well today?",         val:mhGood,     set:setMhGood },
              { key:"improve",  icon:"💭", label:"What can I improve tomorrow?",      val:mhImprove,  set:setMhImprove },
              { key:"grateful", icon:"🤲", label:"What am I grateful for today?",     val:mhGrateful, set:setMhGrateful },
            ].map(p => (
              <div key={p.key} style={{ marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.sub,
                  fontFamily:"'Lora',serif", marginBottom:6 }}>{p.icon} {p.label}</div>
                <textarea
                  value={p.val}
                  onChange={e => { p.set(e.target.value); setMhSaved(false); }}
                  rows={2}
                  placeholder="Write here..."
                  style={{ width:"100%", padding:"10px 12px",
                    border:"1px solid " + T.border, borderRadius:10,
                    background:T.alt, color:T.text, fontSize:13,
                    resize:"none", outline:"none",
                    fontFamily:"'Lora',serif", lineHeight:"1.6",
                    boxSizing:"border-box",
                    transition:"border 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              </div>
            ))}

            {/* Istighfar checkbox */}
            <button onClick={() => { setMhIstighfar(!mhIstighfar); setMhSaved(false); }} style={{
              display:"flex", alignItems:"center", gap:12, width:"100%",
              padding:"12px 14px", marginBottom:16,
              background: mhIstighfar ? "#fef9c3" : T.card,
              border:"1px solid " + (mhIstighfar ? "#fde68a" : T.border),
              borderRadius:12, cursor:"pointer", textAlign:"left", transition:"all 0.18s",
            }}>
              <div style={{ width:24, height:24, borderRadius:7, flexShrink:0,
                background: mhIstighfar ? "#f59e0b" : "transparent",
                border:"2px solid " + (mhIstighfar ? "#f59e0b" : T.border),
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, color:"#fff", transition:"all 0.18s" }}>
                {mhIstighfar ? "✓" : ""}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color: mhIstighfar ? "#92400e" : T.text,
                  fontFamily:"'Lora',serif" }}>I made Istighfar today 🤲</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:"'Amiri',serif", marginTop:2 }}>
                  أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ
                </div>
              </div>
            </button>

            {/* Save button */}
            <button onClick={saveMuhasaba} disabled={!mhMood} style={{
              width:"100%", padding:"13px",
              background: mhMood ? GOLD : T.borderL,
              border:"none", borderRadius:13,
              color: mhMood ? "#fff" : T.muted,
              cursor: mhMood ? "pointer" : "not-allowed",
              fontSize:14, fontWeight:700, fontFamily:"'Lora',serif",
              transition:"all 0.18s",
              boxShadow: mhMood ? "0 3px 10px "+GOLD+"44" : "none",
            }}>
              {mhSaved ? "✓ Saved" : "Save Reflection"}
            </button>
            {!mhMood && (
              <div style={{ textAlign:"center", fontSize:10, color:T.muted,
                fontFamily:"sans-serif", marginTop:6 }}>Select your mood to save</div>
            )}

          </div>
        )}

        {/* ══ METRICS ══ */}
        {!kidsMode && tab === "metrics" && (() => {
          // ── Compute real metrics from history ──────────────────────────────
          // Last 7 days (most recent = today)
          const last7 = Array.from({length:7}, (_,i) => addDays(TODAY, -(6-i)));
          
          

          function dayPct(d) {
            const k = dateStr(d);
            const h = k === TODAY_KEY ? todayChecked : (hist[k] || {});
            return FARD_IDS.length ? Math.round((FARD_IDS.filter(id => h[id]).length / FARD_IDS.length) * 100) : 0;
          }

          const weekData  = last7.map(d => dayPct(d));
          const weekAvg   = Math.round(weekData.reduce((a,b)=>a+b,0)/weekData.length);
          const todayPctM = dayPct(TODAY);

          // Best streak
          let bestS = 0, curS = 0, bd = addDays(TODAY, -1);
          for (let i=0;i<365;i++) {
            const h = hist[dateStr(bd)] || {};
            if (FARD_IDS.filter(id=>h[id]).length >= FARD_IDS.length) { curS++; if (curS>bestS) bestS=curS; }
            else curS=0;
            bd = addDays(bd,-1);
          }
          bestS = Math.max(bestS, streak);

          // 30-day prayer consistency per prayer
          const last30 = Array.from({length:30}, (_,i) => addDays(TODAY, -i));
          const prayerConsistency = PRAYERS.map(prayer => {
            const fardRows = prayer.rows.filter(r => r.type === "F");
            if (!fardRows.length) return null;
            const days = last30.filter(d => {
              const h = dateStr(d)===TODAY_KEY ? todayChecked : (hist[dateStr(d)]||{});
              return fardRows.every(r => h[r.id]);
            }).length;
            return { name:prayer.label, ar:prayer.ar, icon:prayer.icon, pct: Math.round((days/30)*100) };
          }).filter(Boolean);

          // Monthly avg (last 30 days)
          const monthlyAvg = Math.round(last30.reduce((s,d) => s + dayPct(d), 0) / 30);

          // Points this week (Journey)
          const weekPoints = last7.map(d => adultPoints[dateStr(d)] || 0);

          // Heatmap color
          function heatCol(p) {
            if (p===0)  return T.borderL;
            if (p<40)   return "#fde68a";
            if (p<70)   return "#fbbf24";
            if (p<90)   return GOLD;
            return "#16a34a";
          }

          // Trend line SVG
          const SVG_W = 300, SVG_H = 64;
          const tPts = weekData.map((v,i) => ({
            x: (i/(weekData.length-1))*(SVG_W-20)+10,
            y: SVG_H - (v/100)*(SVG_H-12) - 6,
          }));
          const tPath = tPts.map((p,i)=>(i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`)).join(" ");
          const aPath = `${tPath} L${tPts[tPts.length-1].x},${SVG_H} L${tPts[0].x},${SVG_H} Z`;
          const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];


          return (
            <div style={{ padding:"10px 14px 16px" }}>

              {/* ── Stat cards ── */}
              <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD, marginBottom:10 }}>Overview</div>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                {[
                  { icon:"🔥", val:streak,        label:"Streak",      col:GOLD },
                  { icon:"✅", val:todayPctM+"%",  label:"Today",       col:todayPctM>79?"#16a34a":GOLD },
                  { icon:"🏆", val:bestS,          label:"Best",        col:T.sub },
                  { icon:"🕌", val:jamaahStreak,   label:"Jamaah",      col:"#0369a1" },
                ].map(s => (
                  <div key={s.label} style={{ flex:1, background:T.card, borderRadius:13, border:"1px solid "+T.border, padding:"12px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:20, marginBottom:3 }}>{s.icon}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:s.col, fontFamily:"sans-serif", lineHeight:1, marginBottom:3 }}>{s.val}</div>
                    <div style={{ fontSize:8, color:T.muted, fontFamily:"sans-serif", letterSpacing:1, textTransform:"uppercase" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Weekly heatmap ── */}
              <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD, marginBottom:10 }}>This Week</div>
              <div style={{ background:T.card, borderRadius:13, border:"1px solid "+T.border, padding:"13px", marginBottom:14 }}>
                <div style={{ display:"flex", gap:5, marginBottom:7 }}>
                  {weekData.map((p,i) => {
                    const isToday = i===6;
                    return (
                      <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                        <div style={{ width:"100%", aspectRatio:"1", borderRadius:7,
                          background:heatCol(p),
                          border: isToday ? "2px solid "+GOLD : "2px solid transparent",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:7, fontWeight:700, fontFamily:"sans-serif",
                          color:p>=70?"#fff":"#92400e",
                          boxShadow:isToday?"0 0 0 2px "+GOLD+"44":"none",
                        }}>
                          {p>0?p+"%":""}
                        </div>
                        <div style={{ fontSize:7, color:isToday?GOLD:T.muted, fontFamily:"sans-serif", fontWeight:isToday?700:400 }}>
                          {DAYS_SHORT[i]}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5, justifyContent:"flex-end" }}>
                  <span style={{ fontSize:7, color:T.muted, fontFamily:"sans-serif" }}>Less</span>
                  {[T.borderL,"#fde68a","#fbbf24",GOLD,"#16a34a"].map((c,i) => (
                    <div key={i} style={{ width:9, height:9, borderRadius:2, background:c }} />
                  ))}
                  <span style={{ fontSize:7, color:T.muted, fontFamily:"sans-serif" }}>More</span>
                </div>
              </div>

              {/* ── 7-day trend ── */}
              <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD, marginBottom:10 }}>7-Day Trend</div>
              <div style={{ background:T.card, borderRadius:13, border:"1px solid "+T.border, padding:"13px", marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:11, color:T.sub, fontFamily:"sans-serif" }}>Daily completion %</span>
                  <span style={{ fontSize:11, color:GOLD, fontWeight:700, fontFamily:"sans-serif" }}>avg {weekAvg}%</span>
                </div>
                <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H+10}`} style={{ overflow:"visible" }}>
                  {[25,50,75,100].map(v => {
                    const y = SVG_H-(v/100)*(SVG_H-12)-6;
                    return (
                      <g key={v}>
                        <line x1="10" y1={y} x2={SVG_W-10} y2={y} stroke={T.borderL} strokeWidth="1" strokeDasharray="3,3"/>
                        <text x="6" y={y+3} fontSize="7" fill={T.muted} textAnchor="middle" fontFamily="sans-serif">{v}</text>
                      </g>
                    );
                  })}
                  <path d={aPath} fill={GOLD+"18"}/>
                  <path d={tPath} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {tPts.map((p,i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r={i===6?5:3.5} fill={weekData[i]===100?"#16a34a":GOLD} stroke="#fff" strokeWidth="1.5"/>
                      {i===6 && <text x={p.x} y={p.y-9} fontSize="8" fill={GOLD} textAnchor="middle" fontFamily="sans-serif" fontWeight="700">{weekData[i]}%</text>}
                    </g>
                  ))}
                </svg>
                <div style={{ display:"flex", marginTop:4 }}>
                  {DAYS_SHORT.map((d,i) => (
                    <div key={i} style={{ flex:1, textAlign:"center", fontSize:7, color:i===6?GOLD:T.muted, fontFamily:"sans-serif", fontWeight:i===6?700:400 }}>{d}</div>
                  ))}
                </div>
              </div>

              {/* ── Prayer consistency ── */}
              <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD, marginBottom:10 }}>Prayer Consistency (30 days)</div>
              <div style={{ background:T.card, borderRadius:13, border:"1px solid "+T.border, padding:"13px", marginBottom:14 }}>
                {prayerConsistency.map((p,i) => (
                  <div key={p.name} style={{ marginBottom: i<prayerConsistency.length-1?11:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:13 }}>{p.icon}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:"'Lora',serif" }}>{p.name}</span>
                        <span style={{ fontSize:11, color:T.muted, fontFamily:"'Amiri',serif" }}>{p.ar}</span>
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, fontFamily:"sans-serif", color:p.pct>=90?"#16a34a":p.pct>=70?GOLD:"#ef4444" }}>{p.pct}%</span>
                    </div>
                    <div style={{ height:7, background:T.alt, borderRadius:4, overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:4, width:p.pct+"%",
                        background:p.pct>=90?"#16a34a":p.pct>=70?GOLD:"#f59e0b",
                        transition:"width 0.4s ease" }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:11, paddingTop:9, borderTop:"1px solid "+T.borderL, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>Monthly average</span>
                  <span style={{ fontSize:13, fontWeight:700, color:GOLD, fontFamily:"sans-serif" }}>{monthlyAvg}%</span>
                </div>
              </div>

              {/* ── Journey points ── */}
              {mode === "gamified" && (
                <>
                  <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD, marginBottom:10 }}>Points This Week</div>
                  <div style={{ background:T.card, borderRadius:13, border:"1px solid "+T.border, padding:"13px", marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                      <span style={{ fontSize:11, color:T.sub, fontFamily:"sans-serif" }}>Daily points</span>
                      <span style={{ fontSize:11, color:GOLD, fontWeight:700, fontFamily:"sans-serif" }}>{weekPoints.reduce((a,b)=>a+b,0)} total</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:60 }}>
                      {weekPoints.map((pts,i) => {
                        const maxP = Math.max(...weekPoints, 1);
                        const h = Math.max(5, Math.round((pts/maxP)*54));
                        const isToday = i===6;
                        return (
                          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, height:"100%", justifyContent:"flex-end" }}>
                            <div style={{ fontSize:7, color:isToday?GOLD:T.muted, fontFamily:"sans-serif", fontWeight:700 }}>{isToday&&pts?pts:""}</div>
                            <div style={{ width:"100%", borderRadius:"3px 3px 0 0", height:h,
                              background:isToday?"linear-gradient(to top,"+GOLD+","+GOLD+"aa)":T.borderL,
                              boxShadow:isToday?"0 0 6px "+GOLD+"66":"none",
                              transition:"height 0.3s" }} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:"flex", marginTop:4 }}>
                      {DAYS_SHORT.map((d,i) => (
                        <div key={i} style={{ flex:1, textAlign:"center", fontSize:7, color:i===6?GOLD:T.muted, fontFamily:"sans-serif", fontWeight:i===6?700:400 }}>{d}</div>
                      ))}
                    </div>
                  </div>
                </>
              )}



              {/* ── Monthly report ── */}
              {(() => {
                const last30 = Array.from({length:30}, (_,i) => addDays(TODAY,-i));
                const pcts   = last30.map(d => {
                  const h = dateStr(d)===TODAY_KEY?todayChecked:(hist[dateStr(d)]||{});
                  return FARD_IDS.length?Math.round((FARD_IDS.filter(id=>h[id]).length/FARD_IDS.length)*100):0;
                });
                const avg    = Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length);
                const best   = Math.max(...pcts);
                const bestIdx= pcts.indexOf(best);
                const bestDay= addDays(TODAY,-bestIdx);
                const perfect= pcts.filter(p=>p===100).length;
                const missed = pcts.filter(p=>p===0).length;
                return (
                  <>
                    <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD, marginBottom:10 }}>30-Day Report</div>
                    <div style={{ background:T.card, borderRadius:13, border:"1px solid "+T.border, padding:"13px", marginBottom:14 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                        {[
                          { icon:"📊", val:avg+"%",  label:"Monthly avg",    col:avg>79?"#16a34a":GOLD },
                          { icon:"⭐", val:perfect,   label:"Perfect days",   col:GOLD },
                          { icon:"🔥", val:streak,    label:"Current streak", col:GOLD },
                          { icon:"📅", val:missed,    label:"Missed days",    col:missed>5?"#ef4444":T.muted },
                        ].map(s => (
                          <div key={s.label} style={{ background:T.alt, borderRadius:10,
                            padding:"10px", textAlign:"center",
                            border:"1px solid "+T.border }}>
                            <div style={{ fontSize:16, marginBottom:2 }}>{s.icon}</div>
                            <div style={{ fontSize:18, fontWeight:800, color:s.col,
                              fontFamily:"sans-serif", lineHeight:1, marginBottom:2 }}>{s.val}</div>
                            <div style={{ fontSize:8, color:T.muted, fontFamily:"sans-serif",
                              letterSpacing:1, textTransform:"uppercase" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      {best === 100 && (
                        <div style={{ padding:"8px 10px", background:GOLD+"10",
                          borderRadius:8, border:"1px solid "+GOLD+"22",
                          fontSize:10, color:GOLD, fontFamily:"sans-serif", textAlign:"center" }}>
                          🌟 Best day: {DAYS_LONG[bestDay.getDay()]}, {MON_SHORT[bestDay.getMonth()]} {bestDay.getDate()} — 100% complete
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* ── Export data ── */}
              <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD, marginBottom:10 }}>Your Data</div>
              <div style={{ background:T.card, borderRadius:13, border:"1px solid "+T.border, padding:"13px", marginBottom:14 }}>
                <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginBottom:10, lineHeight:"1.6" }}>
                  Your deeds are stored locally on your device. Export a backup or restore from a previous export.
                </div>
                <button onClick={() => {
                  try {
                    const exportData = {
                      exported: new Date().toISOString(),
                      app: "Yawm يَوْم",
                      history: mode==="gamified" ? journeyHist : classicHist,
                      notes: mode==="gamified" ? journeyNotes : classicNotes,
                      mode, gender, streak,
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type:"application/json" });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement("a");
                    a.href = url;
                    a.download = "yawm-export-"+TODAY_KEY+".json";
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch(e) { alert("Export failed. Please try again."); }
                }} style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"11px 12px", background:T.alt, border:"1px solid "+T.border,
                  borderRadius:10, cursor:"pointer", textAlign:"left" }}>
                  <span style={{ fontSize:18 }}>💾</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text, fontFamily:"'Lora',serif" }}>Export my data</div>
                    <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", marginTop:1 }}>Download as JSON · Includes all history and notes</div>
                  </div>
                  <span style={{ fontSize:14, color:T.muted }}>↓</span>
                </button>
                {/* Import/restore */}
                <label style={{ display:"flex", alignItems:"center", gap:10, marginTop:10,
                  padding:"11px 12px", background:T.alt, border:"1px solid "+T.border,
                  borderRadius:10, cursor:"pointer" }}>
                  <span style={{ fontSize:18 }}>📂</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text, fontFamily:"'Lora',serif" }}>Restore from backup</div>
                    <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", marginTop:1 }}>Import a previously exported JSON file</div>
                  </div>
                  <span style={{ fontSize:14, color:T.muted }}>↑</span>
                  <input type="file" accept=".json" style={{ display:"none" }} onChange={function(e) {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                      try {
                        const data = JSON.parse(ev.target.result);
                        if (!data.history || data.app !== "Yawm يَوْم") {
                          alert("Invalid backup file. Please use a Yawm export.");
                          return;
                        }
                        // Restore to both classic and journey
                        setClassicHist(data.history);
                        save("yawm_hist_classic", data.history);
                        setJourneyHist(data.history);
                        save("yawm_hist_journey", data.history);
                        if (data.notes) {
                          setClassicNotes(data.notes); save("yawm_notes_classic", data.notes);
                          setJourneyNotes(data.notes); save("yawm_notes_journey", data.notes);
                        }
                        alert("Restore successful — " + Object.keys(data.history).length + " days imported.");
                      } catch(err) {
                        alert("Failed to read file. Make sure it is a valid Yawm backup.");
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = "";
                  }} />
                </label>
              </div>

              {/* ── Ayah footer ── */}
              <div style={{ background:T.alt, borderRadius:13, border:"1px solid "+GOLD+"33", padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontSize:15, color:GOLD, fontFamily:"'Amiri Quran','Amiri',serif", lineHeight:"2.2", direction:"rtl", marginBottom:6 }}>
                  وَمَا تُقَدِّمُوا لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ اللَّهِ
                </div>
                <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", fontStyle:"italic" }}>
                  "Whatever good you put forward for yourselves — you will find it with Allah." — 2:110
                </div>
              </div>

            </div>
          );
        })()}

        {/* ══ MORE ══ */}
        {!kidsMode && tab === "more" && (
          <div style={{ padding:"10px 14px 0" }}>
            <div style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700,
              fontFamily:"sans-serif", color:GOLD, marginBottom:12 }}>More</div>

            {/* Grid of tiles */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              {[
                { key:"times",    icon:"🕐", label:"Prayer Times",  desc:"Today's salah times" },
                { key:"calendar", icon:"📅", label:"Calendar",      desc:"Monthly overview" },
                { key:"metrics",  icon:"📊", label:"Metrics",       desc:"Stats & progress" },
                { key:"dua",      icon:"🤲", label:"Dua",           desc:"Daily supplications" },
                { key:"adhkar",   icon:"🤲", label:"Adhkar",        desc:"Guided post-prayer dhikr" },
                { key:"tasbih",   icon:"📿", label:"Tasbih",        desc:"Free dhikr counter" },
                { key:"months",   icon:"🗓️", label:"Islamic Months",desc:"Hijri calendar" },
                { key:"qibla",    icon:"🧭", label:"Qibla",         desc:"Direction of prayer" },
                { key:"names99",  icon:"✨", label:"99 Names",       desc:"Asma al-Husna" },
                ...(mode === "gamified" ? [
                  { key:"badges",  icon:"🏅", label:"Badges",   desc:"Achievements earned" },
                ] : []),
              ].map(function(item) {
                return (
                  <button key={item.key} onClick={() => setTab(item.key)} style={{
                    padding:"16px 14px", borderRadius:14,
                    border:"1px solid " + T.border,
                    background:T.card, cursor:"pointer", textAlign:"left",
                    transition:"all 0.18s",
                    boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>{item.icon}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text,
                      fontFamily:"'Lora',serif", marginBottom:3 }}>{item.label}</div>
                    <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ ADHKAR ══ */}
        {!kidsMode && tab === "adhkar" && (
          <div style={{ padding:"10px 14px 0" }}>
            {adhkarScreen === "count" && adhkarSetKey ? (
              <AdhkarCounter
                items={(() => {
                  if (adhkarSetKey === "sleep") return ADHKAR_SLEEP;
                  if (adhkarSetKey === "adhan") return ADHKAR_ADHAN;
                  if (adhkarSetKey === "morning_evening") return ADHKAR_MORNING_EVENING;
                  if (adhkarSetKey && adhkarSetKey.startsWith("dua_")) {
                    const p = adhkarSetKey.replace("dua_","");
                    const d = ADHKAR_SALAH_DUAS[p];
                    return d ? [{ id:"salah_dua", ar:d.ar, transliteration:d.transliteration, en:d.en, count:1, src:d.src }] : ADHKAR_POST_PRAYER;
                  }
                  return ADHKAR_POST_PRAYER;
                })()}
                title={(() => {
                  if (adhkarSetKey === "sleep") return "Before Sleep Adhkar";
                  if (adhkarSetKey === "adhan") return "After Adhan";
                  if (adhkarSetKey === "morning_evening") return adhkarPrayer === "Fajr" ? "Morning Adhkar" : "Evening Adhkar";
                  if (adhkarSetKey && adhkarSetKey.startsWith("dua_")) return adhkarSetKey.replace("dua_","") + " Dua";
                  return "Post-Prayer Adhkar";
                })()}
                onComplete={() => {
                  // Mark this set as done
                  const doneKey = (adhkarPrayer||"") + "_" + adhkarSetKey;
                  markAdhkarDone(doneKey);
                  // Auto-tick matching deed
                  if (adhkarSetKey === "morning_evening") {
                    const h = new Date().getHours();
                    const id = h < 15 ? "adhkar_morning" : "adhkar_evening";
                    if (!todayChecked[id]) toggle(id);
                  } else if (adhkarSetKey === "sleep") {
                    if (!todayChecked["adhkar_sleep"]) toggle("adhkar_sleep");
                  }
                }}
                onBack={() => {
                  setAdhkarScreen(["sleep","adhan"].includes(adhkarSetKey) ? "home" : "select");
                }}
                T={T} GOLD={GOLD} sessionKey={(adhkarPrayer||"")+"_"+adhkarSetKey}
              />
            ) : adhkarScreen === "select" && adhkarPrayer ? (
              <div>
                <button onClick={() => setAdhkarScreen("home")} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif", padding:"0 0 12px", display:"flex", alignItems:"center", gap:4 }}>← Back</button>
                <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:2, fontFamily:"'Lora',serif" }}>
                  {{"Fajr":"🌙","Dhuhr":"☀️","Asr":"🌤️","Maghrib":"🌆","Isha":"🌃"}[adhkarPrayer]} After {adhkarPrayer}
                </div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginBottom:14 }}>Choose which adhkar to recite</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {(() => {
                    const ppDone = adhkarDone.has((adhkarPrayer||"")+"_post_prayer");
                    return (
                      <button onClick={() => { if (!ppDone) { setAdhkarSetKey("post_prayer"); setAdhkarScreen("count"); } }}
                        style={{ padding:"14px", background:ppDone?GOLD+"18":T.card, cursor:ppDone?"default":"pointer", border:"2px solid "+(ppDone?"#16a34a":GOLD), borderRadius:13, textAlign:"left", boxShadow:ppDone?"none":"0 2px 6px "+GOLD+"22" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                          <span style={{ fontSize:20 }}>{ppDone?"✅":"📿"}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:700,
                              color:ppDone?"#16a34a":GOLD, fontFamily:"'Lora',serif" }}>
                              Post-Prayer Adhkar {ppDone?"— Done":""}
                            </div>
                            <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>
                              {ppDone?"Completed today · 🔒 locked":""+ADHKAR_POST_PRAYER.length+" adhkar"}
                            </div>
                          </div>
                          {ppDone
                            ? <button onClick={e => { e.stopPropagation(); markAdhkarDone.unlock && markAdhkarDone.unlock((adhkarPrayer||"")+"_post_prayer"); setAdhkarDone(prev => { const s=new Set(prev); s.delete((adhkarPrayer||"")+"_post_prayer"); try{localStorage.setItem("yawm_adhkar_done_"+TODAY_KEY,JSON.stringify([...s]));}catch(e2){} return s; }); }} style={{ fontSize:10, padding:"3px 8px", borderRadius:8, background:"#f3f4f6", border:"1px solid #d1d5db", color:"#6b7280", cursor:"pointer", fontFamily:"sans-serif" }}>🔓 Unlock</button>
                            : <span style={{ color:GOLD }}>›</span>}
                        </div>
                        {!ppDone && <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {ADHKAR_POST_PRAYER.map(function(it) { return (<span key={it.id} style={{ fontSize:8, padding:"2px 6px", borderRadius:5, background:GOLD+"18", color:GOLD, fontFamily:"sans-serif", fontWeight:600 }}>{it.transliteration.split(" ")[0]} ×{it.count}</span>); })}
                        </div>}
                      </button>
                    );
                  })()}
                  {["Fajr","Maghrib"].includes(adhkarPrayer) && (() => {
                    const meDone = adhkarDone.has((adhkarPrayer||"")+"_morning_evening");
                    return (
                      <button onClick={() => { if (!meDone) { setAdhkarSetKey("morning_evening"); setAdhkarScreen("count"); } }}
                        style={{ padding:"14px", background:meDone?"#7c3aed18":T.card, cursor:meDone?"default":"pointer", border:"2px solid "+(meDone?"#16a34a":"#7c3aed"), borderRadius:13, textAlign:"left" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:20 }}>{meDone?"✅":"🌿"}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:700,
                              color:meDone?"#16a34a":"#7c3aed", fontFamily:"'Lora',serif" }}>
                              {adhkarPrayer === "Fajr" ? "Morning Adhkar" : "Evening Adhkar"}
                              {meDone?" — Done":""}
                            </div>
                            <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>
                              {meDone?"Completed · tap to repeat":ADHKAR_MORNING_EVENING.length+" adhkar"}
                            </div>
                          </div>
                          {meDone
                            ? <button onClick={e => { e.stopPropagation(); setAdhkarDone(prev => { const s=new Set(prev); s.delete((adhkarPrayer||"")+"_morning_evening"); try{localStorage.setItem("yawm_adhkar_done_"+TODAY_KEY,JSON.stringify([...s]));}catch(e2){} return s; }); }} style={{ fontSize:10, padding:"3px 8px", borderRadius:8, background:"#f3f4f6", border:"1px solid #d1d5db", color:"#6b7280", cursor:"pointer", fontFamily:"sans-serif" }}>🔓 Unlock</button>
                            : <span style={{ color:"#7c3aed" }}>›</span>}
                        </div>
                      </button>
                    );
                  })()}
                  {ADHKAR_SALAH_DUAS[adhkarPrayer] && (() => {
                    const duaDone = adhkarDone.has((adhkarPrayer||"")+"_dua_"+adhkarPrayer);
                    return (
                    <button onClick={() => { if (!duaDone) { setAdhkarSetKey("dua_"+adhkarPrayer); setAdhkarScreen("count"); } }}
                      style={{ padding:"14px",
                        background:duaDone?"#0369a115":T.card,
                        border:"2px solid "+(duaDone?"#16a34a":"#0369a1"),
                        borderRadius:13, cursor:duaDone?"default":"pointer", textAlign:"left" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:duaDone?0:8 }}>
                        <span style={{ fontSize:20 }}>{duaDone?"✅":"🤲"}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:duaDone?"#16a34a":"#0369a1", fontFamily:"'Lora',serif" }}>{adhkarPrayer} Dua{duaDone?" — Done":""}</div>
                          <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>{duaDone?"Completed · 🔒 locked":"Special dua after "+adhkarPrayer}</div>
                        </div>
                        {duaDone
                          ? <button onClick={e => { e.stopPropagation(); setAdhkarDone(prev => { const s=new Set(prev); s.delete((adhkarPrayer||"")+"_dua_"+adhkarPrayer); try{localStorage.setItem("yawm_adhkar_done_"+TODAY_KEY,JSON.stringify([...s]));}catch(e2){} return s; }); }} style={{ fontSize:10, padding:"3px 8px", borderRadius:8, background:"#f3f4f6", border:"1px solid #d1d5db", color:"#6b7280", cursor:"pointer", fontFamily:"sans-serif" }}>🔓 Unlock</button>
                          : <span style={{ color:"#0369a1" }}>›</span>}
                      </div>
                      {!duaDone && <div style={{ fontSize:15, color:"#0369a1", fontFamily:"'Amiri',serif", direction:"rtl", lineHeight:"1.8" }}>{ADHKAR_SALAH_DUAS[adhkarPrayer].ar}</div>}
                    </button>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div>
                <button onClick={() => setTab("more")} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif", padding:"0 0 12px", display:"flex", alignItems:"center", gap:4 }}>← Back</button>
                <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", letterSpacing:1, marginBottom:12, textAlign:"center" }}>Which prayer did you just complete?</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                  {["Fajr","Dhuhr","Asr","Maghrib","Isha"].map(function(p) {
                    // A prayer is fully done if its post-prayer adhkar is complete
                    const ppDone = adhkarDone.has(p+"_post_prayer");
                    const meDone = adhkarDone.has(p+"_morning_evening");
                    const duaDone = adhkarDone.has(p+"_dua_"+p);
                    const hasME = ["Fajr","Maghrib"].includes(p);
                    const hasDua = !!ADHKAR_SALAH_DUAS[p];
                    const allDone = ppDone && (!hasME || meDone) && (!hasDua || duaDone);
                    return (
                      <button key={p} onClick={() => { setAdhkarPrayer(p); setAdhkarScreen("select"); }}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                          background: allDone ? "#16a34a12" : T.card,
                          border:"1px solid "+(allDone?"#16a34a44":T.border),
                          borderRadius:13, cursor:"pointer", textAlign:"left", transition:"all 0.18s" }}>
                        <span style={{ fontSize:22 }}>{{"Fajr":"🌙","Dhuhr":"☀️","Asr":"🌤️","Maghrib":"🌆","Isha":"🌃"}[p]}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700,
                            color:allDone?"#16a34a":T.text, fontFamily:"'Lora',serif" }}>
                            {p} {allDone?"✓":""}
                          </div>
                          <div style={{ fontSize:10, fontFamily:"sans-serif", marginTop:1 }}>
                            {allDone
                              ? <span style={{ color:"#16a34a" }}>All adhkar complete · tap to view</span>
                              : <>
                                  {hasME && <span style={{ color:meDone?"#16a34a":GOLD }}>{meDone?"✓ ":""}Morning/Evening  </span>}
                                  {hasDua && <span style={{ color:duaDone?"#16a34a":"#7c3aed" }}>{duaDone?"✓ ":""}Special dua</span>}
                                </>
                            }
                          </div>
                        </div>
                        <span style={{ fontSize:15, color:allDone?"#16a34a":T.muted }}>
                          {allDone?"🔒":"›"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <div style={{ flex:1, height:1, background:T.border }} />
                  <span style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif", letterSpacing:1 }}>OTHER</span>
                  <div style={{ flex:1, height:1, background:T.border }} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {[{key:"sleep",icon:"🌙",label:"Before Sleep",n:ADHKAR_SLEEP.length},{key:"adhan",icon:"📣",label:"After Adhan",n:ADHKAR_ADHAN.length}].map(function(item) {
                    const isDone = adhkarDone.has("_"+item.key);
                    return (
                      <div key={item.key} style={{ flex:1 }}>
                        <button onClick={() => { if (!isDone) { setAdhkarSetKey(item.key); setAdhkarScreen("count"); } }}
                          style={{ width:"100%", padding:"13px 10px", cursor:isDone?"default":"pointer", background:isDone?"#16a34a12":T.card, border:"1px solid "+(isDone?"#16a34a44":T.border), borderRadius:13, textAlign:"center" }}>
                          <div style={{ fontSize:22, marginBottom:5 }}>{isDone?"✅":item.icon}</div>
                          <div style={{ fontSize:12, fontWeight:700, color:isDone?"#16a34a":T.text, fontFamily:"'Lora',serif" }}>{item.label}</div>
                          <div style={{ fontSize:10, color:isDone?"#16a34a":T.muted, fontFamily:"sans-serif", marginTop:2 }}>{isDone?"Done 🔒":item.n+" adhkar"}</div>
                        </button>
                        {isDone && <button onClick={() => setAdhkarDone(prev => { const s=new Set(prev); s.delete("_"+item.key); try{localStorage.setItem("yawm_adhkar_done_"+TODAY_KEY,JSON.stringify([...s]));}catch(e2){} return s; })} style={{ width:"100%", marginTop:4, padding:"5px", background:"none", border:"1px solid "+T.border, borderRadius:8, color:T.muted, cursor:"pointer", fontSize:10, fontFamily:"sans-serif" }}>🔓 Unlock</button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {!kidsMode && tab === "settings" && (() => {
          const SETTINGS_SECTIONS = ["Mode","Gender","Appearance","Prayer Times","Hijri","Notifications","About"];
          const sp = SETTINGS_SECTIONS[settingsPage];
          return (
          <div style={{ padding:"10px 14px 0" }}>
            {/* Section nav pills */}
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
              {SETTINGS_SECTIONS.map((s,i) => (
                <button key={s} onClick={() => setSettingsPage(i)} style={{
                  padding:"4px 10px", borderRadius:20, fontSize:10,
                  fontFamily:"sans-serif", fontWeight:settingsPage===i?700:400,
                  border:"1px solid "+(settingsPage===i?GOLD:T.border),
                  background:settingsPage===i?GOLD:T.alt,
                  color:settingsPage===i?"#fff":T.muted,
                  cursor:"pointer", transition:"all 0.18s",
                }}>{s}</button>
              ))}
            </div>

            {(sp==="Mode") && <div style={{ background:T.card, borderRadius:14, border:"1px solid " + T.border, overflow:"hidden", marginBottom:12 }}>
              <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid " + T.border, fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD }}>Mode</div>
              <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                {/* Classic/Journey toggle info */}
                <div style={{ background:GOLD+"10", borderRadius:12, border:"1px solid "+GOLD+"22",
                  padding:"12px 14px", marginBottom:8 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:GOLD,
                    fontFamily:"'Lora',serif", marginBottom:4 }}>
                    ☪️ Classic · ⭐ Journey
                  </div>
                  <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", lineHeight:"1.6" }}>
                    Toggle between Classic and Journey using the pill in the top-right of Today.
                    Data is always synced — Classic deeds appear in Journey automatically.
                  </div>
                </div>
                {/* Kids mode */}
                {[
                  { key:"kids", icon:"🌱", label:"Kids", desc:"For children — prayers & house in Jannah" },
                ].map(function(m) {
                  const active = mode === m.key;
                  const ac = "#f59e0b";
                  return (
                    <button key={m.key} onClick={() => setMode(m.key)} style={{
                      display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                      borderRadius:12, border:"2px solid " + (active ? ac : T.border),
                      background: active ? ac + "12" : T.alt,
                      cursor:"pointer", textAlign:"left", transition:"all 0.18s", width:"100%",
                    }}>
                      <span style={{ fontSize:22 }}>{m.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color: active ? ac : T.text,
                          fontFamily:"'Lora',serif" }}>{m.label}</div>
                        <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif" }}>{m.desc}</div>
                      </div>
                      {active && <span style={{ fontSize:16, color:ac }}>✓</span>}
                    </button>
                  );
                })}
                {/* Exit kids back to classic */}
                {mode === "kids" && (
                  <button onClick={() => setMode("classic")} style={{
                    width:"100%", padding:"10px", background:T.alt,
                    border:"1px dashed "+T.border, borderRadius:10,
                    cursor:"pointer", color:T.muted, fontSize:12,
                    fontFamily:"sans-serif", marginTop:4,
                  }}>← Back to Classic / Journey</button>
                )}
              </div>
            </div>

            }{/* end Mode */}
            {(sp==="Gender") && <div style={{ background:T.card, borderRadius:14, border:"1px solid " + T.border, overflow:"hidden", marginBottom:12 }}>
              <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid " + T.border, fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD }}>Gender</div>
              <div style={{ padding:"12px 14px", display:"flex", gap:10 }}>
                {[
                  { key:"male",   icon:"🧔", label:"Akhi",   desc:"Brother · Includes Jumu'ah" },
                  { key:"female", icon:"🧕", label:"Ukhti",  desc:"Sister · Includes exemption days" },
                ].map(function(g) {
                  const active = gender === g.key;
                  return (
                    <button key={g.key} onClick={() => setGender(g.key)} style={{
                      flex:1, padding:"12px 10px", borderRadius:12,
                      border:"2px solid " + (active ? GOLD : T.border),
                      background: active ? GOLD + "12" : T.alt,
                      cursor:"pointer", textAlign:"center", transition:"all 0.18s",
                    }}>
                      <div style={{ fontSize:26, marginBottom:4 }}>{g.icon}</div>
                      <div style={{ fontSize:13, fontWeight:700, color: active ? GOLD : T.text, fontFamily:"'Lora',serif" }}>{g.label}</div>
                      <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", marginTop:2 }}>{g.desc}</div>
                    </button>
                  );
                })}
              </div>
              {/* Exemption day toggle — only for females */}
              {isFemale && (
                <div style={{ padding:"0 14px 12px" }}>
                  <button onClick={toggleExempt} style={{
                    display:"flex", alignItems:"center", gap:10, width:"100%",
                    padding:"11px 13px",
                    background: isExempt ? "#fdf2f8" : T.alt,
                    border:"1px solid " + (isExempt ? "#f9a8d4" : T.border),
                    borderRadius:11, cursor:"pointer", textAlign:"left", transition:"all 0.18s",
                  }}>
                    <span style={{ fontSize:18 }}>🌸</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color: isExempt ? "#be185d" : T.sub, fontFamily:"'Lora',serif" }}>
                        {isExempt ? "Exemption day — active today" : "Mark today as exemption day"}
                      </div>
                      <div style={{ fontSize:10, color: isExempt ? "#ec4899" : T.muted, fontFamily:"sans-serif", marginTop:1 }}>
                        Prayers hidden · Du'a and dhikr remain open
                      </div>
                    </div>
                    <div style={{ width:22, height:22, borderRadius:6, flexShrink:0,
                      background: isExempt ? "#ec4899" : "transparent",
                      border:"2px solid " + (isExempt ? "#ec4899" : T.border),
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:12, color:"#fff", transition:"all 0.18s" }}>
                      {isExempt ? "✓" : ""}
                    </div>
                  </button>
                </div>
              )}
            </div>

            }{/* end Gender */}
            {(sp==="Appearance") && <div style={{ background:T.card, borderRadius:14, border:"1px solid " + T.border, overflow:"hidden", marginBottom:12 }}>
              <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid " + T.border, fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD }}>Appearance</div>
              <div style={{ padding:"12px 14px" }}>
                <div style={{ fontSize:11, color:T.sub, fontFamily:"sans-serif", marginBottom:8 }}>Theme</div>
                <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                  {[["light","☀️","Light"],["dark","🌙","Dark"]].map(function(t) {
                    const active = theme === t[0];
                    return (
                      <button key={t[0]} onClick={() => setTheme(t[0])} style={{
                        flex:1, padding:"10px", borderRadius:10,
                        border:"2px solid " + (active ? GOLD : T.border),
                        background: active ? GOLD + "12" : T.alt,
                        cursor:"pointer", fontSize:13, fontFamily:"'Lora',serif",
                        color: active ? GOLD : T.text, fontWeight: active ? 700 : 400,
                        transition:"all 0.18s",
                      }}>
                        {t[1]} {t[2]}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize:11, color:T.sub, fontFamily:"sans-serif", marginBottom:8 }}>Text Size</div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:12, color:T.muted, fontFamily:"'Amiri',serif" }}>أ</span>
                  <input type="range" min="0.85" max="1.25" step="0.05" value={fontScale}
                    onChange={e => setFontScale(parseFloat(e.target.value))}
                    style={{ flex:1, accentColor:GOLD, cursor:"pointer" }} />
                  <span style={{ fontSize:18, color:T.muted, fontFamily:"'Amiri',serif" }}>أ</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                  <span style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif", letterSpacing:1 }}>SMALL</span>
                  <span style={{ fontSize:10, color:GOLD, fontFamily:"sans-serif", fontWeight:700 }}>
                    {fontScale === 1.0 ? "Default" : fontScale > 1.0 ? "+" + Math.round((fontScale-1)*100) + "%" : Math.round((fontScale-1)*100) + "%"}
                  </span>
                  <span style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif", letterSpacing:1 }}>LARGE</span>
                </div>
              </div>
            </div>

            }{/* end Appearance */}
            {(sp==="Prayer Times") && <div style={{ background:T.card, borderRadius:14, border:"1px solid " + T.border, overflow:"hidden", marginBottom:12 }}>
              <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid " + T.border, fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD }}>Prayer Times</div>
              <div style={{ padding:"12px 14px" }}>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:T.sub, fontFamily:"sans-serif", marginBottom:6 }}>Calculation Method</div>
                  <select value={calcMethod} onChange={e => setCalcMethod(parseInt(e.target.value,10))} style={{ width:"100%", padding:"9px 10px", border:"1px solid " + T.border, borderRadius:8, background:T.alt, color:T.text, fontSize:12, fontFamily:"sans-serif" }}>
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
                    <option value={16}>Moonsighting Committee Worldwide</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, color:T.sub, fontFamily:"sans-serif", marginBottom:6 }}>Asr Calculation (Madhab)</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => setMadhab(0)} style={{ flex:1, padding:"8px", borderRadius:8, border:"1px solid " + T.border, background: madhab===0 ? GOLD : T.alt, color: madhab===0 ? "#fff" : T.text, cursor:"pointer", fontSize:12, fontFamily:"sans-serif", fontWeight: madhab===0 ? 600 : 400 }}>Hanafi</button>
                    <button onClick={() => setMadhab(1)} style={{ flex:1, padding:"8px", borderRadius:8, border:"1px solid " + T.border, background: madhab===1 ? GOLD : T.alt, color: madhab===1 ? "#fff" : T.text, cursor:"pointer", fontSize:12, fontFamily:"sans-serif", fontWeight: madhab===1 ? 600 : 400 }}>Shafi / Maliki / Hanbali</button>
                  </div>
                </div>
              </div>
            </div>

            }{/* end Prayer Times */}
            {(sp==="Hijri") && <div style={{ background:T.card, borderRadius:14, border:"1px solid " + T.border, overflow:"hidden", marginBottom:12 }}>
              <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid " + T.border, fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD }}>Hijri Date</div>
              <div style={{ padding:"12px 14px" }}>
                <div style={{ fontSize:11, color:T.muted, fontFamily:"sans-serif", marginBottom:10 }}>
                  Current: {hijri.day} {HM_EN[hijri.month-1]} {hijri.year} AH
                </div>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  {[["Day","day","1","30",44],["Month","month","1","12",44],["Year","year","1400","1500",60]].map(function(f) {
                    return (
                      <div key={f[0]} style={{ textAlign:"center" }}>
                        <div style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif", marginBottom:3 }}>{f[0]}</div>
                        <input type="number" min={f[2]} max={f[3]}
                          value={hijriDraft[f[1]] || ""}
                          placeholder={String(hijri[f[1]])}
                          onChange={e => setHijriDraft(function(p){ return {...p, [f[1]]:e.target.value}; })}
                          style={{ width:f[4], padding:"6px 4px", border:"1px solid " + T.border, borderRadius:6, background:T.alt, color:T.text, fontSize:13, textAlign:"center" }} />
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => {
                  const d = parseInt(hijriDraft.day,10), m = parseInt(hijriDraft.month,10), y = parseInt(hijriDraft.year,10);
                  if (d>=1&&d<=30&&m>=1&&m<=12&&y>=1400) { setHijri({ day:d, month:m, year:y }); }
                }} style={{ width:"100%", padding:"8px", background:GOLD, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>
                  Update Hijri Date ✓
                </button>
              </div>
            </div>



            }{/* end Notifications */}

            {/* About */}
            {(sp==="About") && (
              <div style={{ background:T.card, borderRadius:14, border:"1px solid "+T.border, overflow:"hidden", marginBottom:12 }}>
                <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid "+T.border, fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD }}>About Yawm</div>
                <div style={{ padding:"20px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🌙</div>
                  <div style={{ fontFamily:"'Amiri',serif", fontSize:22, color:GOLD, marginBottom:4 }}>يَوْم · Yawm</div>
                  <div style={{ fontSize:12, color:T.muted, fontFamily:"sans-serif", marginBottom:16, lineHeight:"1.7" }}>My Daily Islamic Deeds Tracker<br/>جزاك الله خيرًا</div>
                  <div style={{ fontSize:11, color:T.sub, fontFamily:"sans-serif", lineHeight:"1.8", marginBottom:16 }}>
                    All data stored locally on your device.<br/>
                    Nothing shared with any server except prayer time calculations.
                  </div>
                  <button onClick={() => setMode("kids")} style={{ display:"block", width:"100%", padding:"10px", background:T.alt, border:"1px solid "+T.border, borderRadius:10, cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif", marginBottom:8 }}>
                    🌱 Switch to Kids Mode
                  </button>
                </div>
              </div>
            )}

            {/* Next / Back nav buttons */}
            <div style={{ display:"flex", gap:10, marginTop:8, marginBottom:16 }}>
              {settingsPage > 0 && (
                <button onClick={() => setSettingsPage(p=>p-1)} style={{
                  flex:1, padding:"11px", background:T.alt, border:"1px solid "+T.border,
                  borderRadius:12, cursor:"pointer", color:T.sub, fontSize:13,
                  fontFamily:"sans-serif", fontWeight:600,
                }}>← Back</button>
              )}
              {settingsPage < SETTINGS_SECTIONS.length-1 && (
                <button onClick={() => setSettingsPage(p=>p+1)} style={{
                  flex:1, padding:"11px", background:GOLD, border:"none",
                  borderRadius:12, cursor:"pointer", color:"#fff", fontSize:13,
                  fontFamily:"'Lora',serif", fontWeight:700,
                }}>Next →</button>
              )}
            </div>

          </div>
          );
        })()}

        {/* ══ DUA ══ */}
        {!kidsMode && tab === "dua" && (() => {
          const cats = [...new Set(DUAS.map(d=>d.cat))];
          return (
            <div style={{ padding:"10px 14px 0" }}>
              <button onClick={() => setTab("more")} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif", padding:"0 0 10px", marginTop:4 }}>← Back</button>

              {/* Dua of the day */}
              <div style={{ background:T.card, borderRadius:16, border:"1px solid "+T.border, padding:"18px 16px", textAlign:"center", marginBottom:12 }}>
                <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontFamily:"sans-serif", color:T.muted, marginBottom:12 }}>Dua of the Day</div>
                <div style={{ fontSize:20, color:GOLD, lineHeight:"2.1", marginBottom:12, fontFamily:"'Amiri Quran','Amiri',serif", direction:"rtl", padding:"0 8px" }}>{DUA.ar}</div>
                <div style={{ fontSize:13, color:T.sub, fontStyle:"italic", lineHeight:"1.7", marginBottom:8, fontFamily:"'Lora',serif" }}>"{DUA.en}"</div>
                <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>— {DUA.src}</div>
              </div>

              {/* Full dua collection */}
              <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD, marginBottom:6 }}>Dua Collection</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                {["All",...cats].map(c => {
                  const active = !duaCatFilter ? c==="All" : duaCatFilter===c;
                  return (
                    <button key={c} onClick={() => setDuaCatFilter(c==="All"?null:c)} style={{
                      padding:"4px 10px", borderRadius:20, fontSize:10,
                      fontFamily:"sans-serif", fontWeight:active?700:400,
                      border:"1px solid "+(active?GOLD:T.border),
                      background:active?GOLD:T.alt,
                      color:active?"#fff":T.muted, cursor:"pointer",
                    }}>{c}</button>
                  );
                })}
              </div>
              {cats.filter(c => !duaCatFilter || c===duaCatFilter).map(cat => (
                <div key={cat} style={{ background:T.card, borderRadius:13, border:"1px solid "+T.border, overflow:"hidden", marginBottom:10 }}>
                  <div style={{ padding:"8px 14px 6px", borderBottom:"1px solid "+T.border, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:T.sub }}>{cat}</div>
                  {DUAS.filter(d=>d.cat===cat).map((dua,i,arr) => (
                    <div key={i} style={{ padding:"12px 14px", borderBottom:i<arr.length-1?"1px solid "+T.borderL:"none" }}>
                      <div style={{ fontSize:16, color:T.text, fontFamily:"'Amiri Quran','Amiri',serif", direction:"rtl", lineHeight:"2", marginBottom:6, textAlign:"right" }}>{dua.ar}</div>
                      <div style={{ fontSize:12, color:T.sub, fontStyle:"italic", fontFamily:"'Lora',serif", lineHeight:"1.6", marginBottom:4 }}>"{dua.en}"</div>
                      <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif" }}>— {dua.src}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}

        {/* ══ 99 NAMES ══ */}
        {!kidsMode && tab === "names99" && (
          <div style={{ padding:"10px 14px 0" }}>
            <button onClick={() => setTab("more")} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif", padding:"0 0 10px", marginTop:4 }}>← Back</button>
            <div style={{ background:GOLD+"12", borderRadius:13, border:"1px solid "+GOLD+"33", padding:"12px 14px", textAlign:"center", marginBottom:12 }}>
              <div style={{ fontSize:16, color:GOLD, fontFamily:"'Amiri Quran','Amiri',serif", direction:"rtl", lineHeight:"2" }}>وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا</div>
              <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", fontStyle:"italic", marginTop:4 }}>"To Allah belong the Most Beautiful Names, so call upon Him by them." — 7:180</div>
            </div>
            <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif",
              textAlign:"center", marginBottom:10, fontStyle:"italic" }}>
              Tap any name to reveal its meaning · {namesFlipped.size}/99 learned
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {ASMA.map((name) => {
                const flipped = namesFlipped.has(name.n);
                return (
                  <button key={name.n} onClick={() => setNamesFlipped(prev => {
                    const s = new Set(prev);
                    s.has(name.n) ? s.delete(name.n) : s.add(name.n);
                    return s;
                  })} style={{
                    background:flipped?GOLD+"18":T.card,
                    borderRadius:12, border:"1px solid "+(flipped?GOLD:T.border),
                    padding:"12px 10px", textAlign:"center",
                    cursor:"pointer", transition:"all 0.2s",
                    boxShadow:flipped?"0 2px 8px "+GOLD+"33":"none",
                  }}>
                    <div style={{ fontSize:9, color:T.muted, fontFamily:"sans-serif",
                      marginBottom:4 }}>{name.n}/99</div>
                    <div style={{ fontSize:18, color:GOLD,
                      fontFamily:"'Amiri Quran','Amiri',serif",
                      lineHeight:"1.8", marginBottom:4 }}>{name.ar}</div>
                    {flipped ? (<>
                      <div style={{ fontSize:11, fontWeight:700, color:T.text,
                        fontFamily:"sans-serif", marginBottom:2 }}>{name.en}</div>
                      <div style={{ fontSize:9, color:T.muted,
                        fontFamily:"sans-serif" }}>{name.meaning}</div>
                    </>) : (
                      <div style={{ fontSize:9, color:T.muted,
                        fontFamily:"sans-serif", fontStyle:"italic" }}>tap to learn</div>
                    )}
                  </button>
                );
              })}
            </div>
          {/* Next → scroll hint */}
          <div style={{ textAlign:"center", padding:"16px 0 8px" }}>
            <button onClick={() => {
              setTab("today");
            }} style={{ background:"none", border:"none", color:T.muted, fontSize:12,
              fontFamily:"sans-serif", cursor:"pointer" }}>
            </button>
            <a href="#top" style={{ display:"inline-block", padding:"10px 28px",
              background:GOLD, borderRadius:12, color:"#fff",
              fontSize:13, fontWeight:700, fontFamily:"'Lora',serif",
              textDecoration:"none" }}
              onClick={e => { e.preventDefault(); setTab("today"); }}>
              ← Back to Today
            </a>
          </div>
          </div>
        )}

        {/* ══ TASBIH ══ */}
        {!kidsMode && tab === "tasbih" && (
          <div style={{ padding:"10px 14px 0" }}>
            <button onClick={() => setTab("more")} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif", padding:"0 0 10px", display:"flex", alignItems:"center", gap:4 }}>← Back</button>

            {/* Phrase selector */}
            <div style={{ display:"flex", gap:6, marginBottom:14 }}>
              {TASBIH_PHRASES.map(function(p, i) {
                const active = tasbihPhrase === i;
                return (
                  <button key={i} onClick={() => { setTasbihPhrase(i); setTasbihCount(0); setTasbihTarget(i===2?34:33); }} style={{
                    flex:1, padding:"8px 4px", borderRadius:10,
                    border:"2px solid " + (active ? p.color : T.border),
                    background: active ? p.color+"18" : T.alt,
                    cursor:"pointer", textAlign:"center", transition:"all 0.18s",
                  }}>
                    <div style={{ fontSize:13, color:active?p.color:T.muted, fontFamily:"'Amiri',serif" }}>{p.ar}</div>
                    <div style={{ fontSize:9, color:active?p.color:T.muted, fontFamily:"sans-serif", marginTop:2, fontWeight:active?700:400 }}>{p.tr} ×{i===2?34:33}</div>
                  </button>
                );
              })}
            </div>

            {/* Big tap button */}
            <button onClick={tasbihTap} style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              width:"100%", padding:"32px 0",
              background: tasbihFlash ? TASBIH_PHRASES[tasbihPhrase].color+"22" : T.alt,
              border:"2px dashed " + (tasbihFlash ? TASBIH_PHRASES[tasbihPhrase].color : T.border),
              borderRadius:20, cursor:"pointer", transition:"all 0.2s", marginBottom:12,
            }}>
              <div style={{ fontSize:28, fontFamily:"'Amiri Quran','Amiri',serif",
                color:TASBIH_PHRASES[tasbihPhrase].color, direction:"rtl",
                lineHeight:"1.8", marginBottom:12, transition:"all 0.2s",
                transform: tasbihFlash ? "scale(1.04)" : "scale(1)" }}>
                {TASBIH_PHRASES[tasbihPhrase].ar}
              </div>
              <div style={{ fontSize:48, fontWeight:800, color:TASBIH_PHRASES[tasbihPhrase].color,
                fontFamily:"sans-serif", lineHeight:1, marginBottom:4 }}>
                {tasbihCount}
              </div>
              <div style={{ fontSize:13, color:T.muted, fontFamily:"sans-serif" }}>
                / {tasbihTarget}
              </div>
              <div style={{ marginTop:12, fontSize:11, color:T.muted, fontFamily:"sans-serif", letterSpacing:1 }}>
                TAP ANYWHERE HERE
              </div>
            </button>

            {/* Progress bar */}
            <div style={{ height:6, background:T.alt, borderRadius:3, overflow:"hidden", marginBottom:12 }}>
              <div style={{ height:"100%", borderRadius:3,
                background:TASBIH_PHRASES[tasbihPhrase].color,
                width:Math.round((tasbihCount/tasbihTarget)*100)+"%",
                transition:"width 0.2s" }} />
            </div>

            {/* Reset */}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setTasbihCount(0)} style={{ flex:1, padding:"11px",
                background:T.alt, border:"1px solid "+T.border, borderRadius:10,
                color:T.muted, cursor:"pointer", fontSize:12, fontFamily:"sans-serif" }}>
                ↺ Reset
              </button>
              <button onClick={() => { setTasbihCount(0); setTasbihPhrase(0); setTasbihTarget(33); }} style={{ flex:1, padding:"11px",
                background:T.alt, border:"1px solid "+T.border, borderRadius:10,
                color:T.muted, cursor:"pointer", fontSize:12, fontFamily:"sans-serif" }}>
                ↺ Full reset
              </button>
            </div>

            {/* Hadith */}
            <div style={{ background:GOLD+"10", borderRadius:12, border:"1px solid "+GOLD+"33",
              padding:"12px 14px", marginTop:12, textAlign:"center" }}>
              <div style={{ fontSize:13, color:GOLD, fontFamily:"'Amiri',serif",
                direction:"rtl", lineHeight:"2", marginBottom:4 }}>
                مَنْ قَالَ سُبْحَانَ اللَّهِ وَبِحَمْدِهِ فِي يَوْمٍ مِائَةَ مَرَّةٍ
              </div>
              <div style={{ fontSize:10, color:T.muted, fontFamily:"sans-serif", fontStyle:"italic" }}>
                "Whoever says SubhanAllahi wa bihamdihi 100 times — his sins are wiped away even if like sea foam" — Bukhari 6405
              </div>
            </div>
          </div>
        )}

        {/* ══ QIBLA ══ */}
        {!kidsMode && tab === "qibla" && (
          <div style={{ padding:"10px 14px 0" }}>
            <button onClick={() => setTab("more")} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif", padding:"0 0 10px", display:"flex", alignItems:"center", gap:4 }}>← Back</button>
            <QiblaFinder T={T} GOLD={GOLD} />
          </div>
        )}

        {/* ══ ISLAMIC MONTHS ══ */}
        {!kidsMode && tab === "months" && (
          <div style={{ padding:"10px 14px 0" }}>
            <button onClick={() => setTab("more")} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:12, fontFamily:"sans-serif", padding:"0 0 10px", display:"flex", alignItems:"center", gap:4 }}>← Back</button>
            <div style={{ background:T.card, borderRadius:14, border:"1px solid "+T.border, overflow:"hidden", marginBottom:12 }}>
              <div style={{ padding:"10px 14px 8px", borderBottom:"1px solid "+T.border, fontSize:10, letterSpacing:3, textTransform:"uppercase", fontWeight:700, fontFamily:"sans-serif", color:GOLD }}>
                Hijri Calendar — {hijri.year} AH
              </div>
              {HM_EN.map(function(m, i) {
                const cur = hijri.month - 1 === i;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px",
                    borderBottom: i < 11 ? "1px solid "+T.borderL : "none",
                    background: cur ? GOLD+"12" : "transparent" }}>
                    <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                      background: cur ? GOLD : T.alt, border:"1px solid "+(cur?GOLD:T.border),
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, fontWeight:700, color:cur?"#fff":T.muted, fontFamily:"sans-serif" }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:cur?700:500, color:cur?GOLD:T.text, fontFamily:"'Lora',serif" }}>{m}</div>
                    </div>
                    <div style={{ fontSize:16, color:cur?GOLD:T.muted, fontFamily:"'Amiri',serif" }}>{HM_AR[i]}</div>
                    {cur && <span style={{ fontSize:9, color:"#fff", background:GOLD, padding:"2px 6px", borderRadius:6, fontFamily:"sans-serif", fontWeight:700 }}>NOW</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
