/**
 * One-time seed for the user-provided "ג'אם לפי הרגע" categories, replacing the
 * placeholder categories from seed.js. Safe to re-run: songs use deterministic slug ids
 * (same scheme as seed.js), and jam docs are full overwrites/deletes by fixed id.
 *
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node seed/seedMoodJams.js
 */

const admin = require("firebase-admin");

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

function slug(text) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

// Same lookup the weekly Spotify scan uses (scripts/weeklySongDiscovery.js) - a real search
// against Tab4U's own search endpoint, not a guess. Reused here so every song from the owner's
// list gets a real chord link automatically instead of being left for manual entry.
const TAB4U_SEARCH_URL = "https://www.tab4u.com/resultsSimple.php";
// Confirmed against the live site: the search query param is "q" (not "ac"), and result hrefs are
// written WITHOUT a leading slash ("tabs/songs/...html", not "/tabs/songs/...html") - both silently
// broke every previous lookup (0% hit rate) despite the site itself working fine.
const TAB4U_RESULT_LINK_PATTERN = /href="(tabs\/songs\/[^"]+\.html)"/;

async function tryFindTab4uLink(songName, artistName) {
  try {
    const query = `${artistName} ${songName}`;
    const url = `${TAB4U_SEARCH_URL}?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return "";
    const html = await res.text();
    const match = html.match(TAB4U_RESULT_LINK_PATTERN);
    return match ? `https://www.tab4u.com/${match[1]}` : "";
  } catch (err) {
    console.warn(`Tab4U search failed for "${songName}" (${artistName}):`, err.message);
    return "";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const categories = {
  "campfire": {
    name: "שירי מדורה",
    emoji: "🔥",
    start: "#DD5F2C",
    end: "#A83F1E",
    songs: [
      { name: "קול גלגל", artist: "שוטי הנבואה" },
      { name: "קוצים", artist: "אביב גפן/עידן רייכל" },
      { name: "יפה כלבנה", artist: "אביתר בנאי" },
      { name: "עד מחר", artist: "אביתר בנאי" },
      { name: "מעליות", artist: "דודו טסה/רוני אלטר" },
      { name: "יסמין", artist: "Blue Pill" },
      { name: "רבות הדרכים", artist: "דניאל סלומון" },
      { name: "כל מה שיש לי", artist: "נתן גושן" },
      { name: "סיפור אחר", artist: "נתן גושן" },
      { name: "אני אש", artist: "אילאי בוטנר/רן דנקר" },
      { name: "את יפה", artist: "עידן יניב" },
      { name: "יש לך", artist: "שלומי שבת" },
      { name: "היא לא יודעת מה עובר עליי", artist: "שלמה ארצי" },
      { name: "תתארו לכם", artist: "שלמה ארצי" },
      { name: "לא עוזב את העיר", artist: "שלמה ארצי" },
      { name: "חלק מהזמן", artist: "עידן עמדי" },
      { name: "עכשיו קרוב", artist: "עידן רייכל" },
      { name: "היא לא דומה", artist: "ארקדי דוכין" },
      { name: "הכוכבים דולקים על אש קטנה", artist: "משינה" },
      { name: "מכה אפורה", artist: "מוניקה סקס" },
      { name: "אדם צובר זיכרונות", artist: "אברהם טל" },
      { name: "בואי נעזוב", artist: "אילאי בוטנר/רן דנקר" },
      { name: "וויסקי", artist: "ג'יין בורדו" },
      { name: "איך אפשר", artist: "ג'יין בורדו" },
      { name: "היא כל כך יפה", artist: "כוורת" },
      { name: "אינך יכולה", artist: "The High Windows" },
      { name: "מקום לצידך", artist: "דור דניאל" },
      { name: "גיבור של אמא", artist: "משה פרץ" },
      { name: "לב חופשי", artist: "Mooki" },
      { name: "אורות", artist: "אברהם טל" },
      { name: "מחכה", artist: "עידן רפאל חביב" },
      { name: "רוקדים צמודים", artist: "ג'יין בורדו" },
      { name: "הזמן עושה את שלו", artist: "אברהם טל" },
      { name: "אני רץ", artist: "דודו טסה" },
      { name: "מרוב אהבה שותק", artist: "בועז בנאי" },
      { name: "מה שחשוב", artist: "ג'יין בורדו" },
      { name: "אור גדול", artist: "אמיר דדון" },
      { name: "מכתב לאחי", artist: "אילאי בוטנר/קובי אפללו" },
      { name: "זאת שמעל למצופה", artist: "דני סנדרסון/כפיר בן לויש" },
      { name: "אצלך בעולם", artist: "מאיר בנאי" },
      { name: "אישה מהשמיים", artist: "גלעד שגב" },
      { name: "בראשית", artist: "גבי שושן" },
      { name: "מוכרת לי מפעם", artist: "דין דין אביב" },
      { name: "פרפרים", artist: "אורי בנאי" },
      { name: "בשבילה אתה מלך העולם", artist: "שלמה ארצי" },
      { name: "עד שבאת", artist: "בית הבובות/אמיר אטיאס" },
      { name: "מתחת לשמיים", artist: "דיוויד ברוזה" },
      { name: "עכשיו טוב", artist: "גלעד שגב" },
      { name: "במרחק נגיעה מכאן", artist: "יזהר אשדות" },
      { name: "אהבה", artist: "דניאל סלומון" },
      { name: "זה הכל בשבילך", artist: "דני סנדרסון/מזי כהן" },
      { name: "חוזר ועולה שם", artist: "אלון עדר" },
      { name: "תן סימן", artist: "יושי" },
      { name: "סיגפו", artist: "בית הבובות/אמיר אטיאס" },
      { name: "גם אני", artist: "קוקי לבנה" },
      { name: "יוצא לאור", artist: "אהוד בנאי" },
    ],
  },
  "shabbat": {
    name: "שירי שבת",
    emoji: "🕯️",
    start: "#F0A06A",
    end: "#C9682C",
    songs: [
      { name: "יה אכסוף", artist: "מסורתי" },
      { name: "לכה דודי", artist: "מסורתי" },
      { name: "שלום עליכם", artist: "מסורתי" },
      { name: "לכו נרננה", artist: "מסורתי" },
      { name: "מזמור שיר ליום השבת", artist: "מסורתי" },
    ],
  },
  "soul": {
    name: "שירי נשמה",
    emoji: "💫",
    start: "#E24B4A",
    end: "#993C1D",
    songs: [
      { name: "וטהר ליבנו", artist: "מסורתי" },
      { name: "למען אחיי ורעיי", artist: "מסורתי" },
      { name: "הנשמה לך", artist: "מסורתי" },
      { name: "תפילה לעני", artist: "מסורתי" },
      { name: "שערי שמיים פתח", artist: "מסורתי" },
      { name: "טוב להודות להשם", artist: "מסורתי" },
      { name: "קריה יפיפיה", artist: "מסורתי" },
      { name: "אוחילה לאל", artist: "מסורתי" },
      { name: "מזמור לדוד", artist: "מסורתי" },
      { name: "תתן אחרית", artist: "מסורתי" },
      { name: "לב טהור", artist: "מסורתי" },
      { name: "התנערי", artist: "מסורתי" },
      { name: "כאיל תערוג", artist: "מסורתי" },
      { name: "רחם", artist: "מסורתי" },
      { name: "ענווים", artist: "מסורתי" },
      { name: "וזכני", artist: "מסורתי" },
      { name: "חמול", artist: "מסורתי" },
      { name: "שובי נפדי", artist: "מסורתי" },
      { name: "בלבבי משכן", artist: "מסורתי" },
      { name: "על הר גבוהה", artist: "מסורתי" },
      { name: "כנפי רוח", artist: "מסורתי" },
    ],
  },
  "memorial": {
    name: "שירי יום הזיכרון",
    emoji: "🕊️",
    start: "#6B7A99",
    end: "#3D4A66",
    songs: [
      { name: "אצלנו בגן", artist: "Shaylee Atary" },
      { name: "כאב של לוחמים", artist: "עידן עמדי" },
      { name: "הו רב חובל", artist: "Meital Trabelsi" },
      { name: "מה אברך", artist: "להקת חיל הים" },
      { name: "בן יפה נולד", artist: "רבקה זוהר" },
      { name: "ארים ראשי", artist: "שי גבסו" },
      { name: "שלחי אותו", artist: "רוני דלומי" },
      { name: "ים הרחמים", artist: "קובי אפללו" },
      { name: "ים של דמעות", artist: "נינט טייב" },
      { name: "נגמר", artist: "עידן עמדי" },
      { name: "אבות ובנים", artist: "אביתר בנאי" },
      { name: "לך אלי", artist: "מאיר בנאי" },
      { name: "עכשיו קרוב", artist: "עידן רייכל" },
      { name: "הייתי כאן", artist: "עברי לידר/נתן גושן" },
      { name: "עד מחר", artist: "אביתר בנאי" },
      { name: "קוצים", artist: "אביב גפן/עידן רייכל" },
      { name: "בזמן האחרון", artist: "עידן עמדי" },
      { name: "קול גלגל", artist: "שוטי הנבואה" },
      { name: "תמיד יחכו לך", artist: "ליאה שבת" },
      { name: "כשהלב בוכה", artist: "שרית חדד" },
      { name: "אייכה", artist: "שולי רנד" },
      { name: "ככלות הקול והתמונה", artist: "יזהר אשדות" },
      { name: "אין פה מקום", artist: "עידן רפאל חביב" },
      { name: "צליל מכוון", artist: "יצחק קלפטר" },
      { name: "זה הכל בשבילך", artist: "דני סנדרסון/מזי כהן" },
      { name: "מהמרחקים", artist: "גלי עטרי" },
      { name: "אבא", artist: "אביתר בנאי" },
      { name: "אמא אבא וכל השאר", artist: "עידן רייכל" },
      { name: "חורף 73", artist: "להקת חינוך מיוחד" },
      { name: "החיטה צומחת שוב", artist: "חוה אלברשטיין" },
    ],
  },
};

// The old placeholder categories this replaces (from seed.js) - deleted outright
// since the user does not want them; campfire/shabbat/soul share names with new
// categories above and get fully overwritten instead of deleted+recreated.
const obsoleteJamIds = ["jam_party", "jam_love", "jam_road"];

async function main() {
  for (const id of obsoleteJamIds) {
    await db.collection("jams").doc(id).delete();
  }
  console.log(`Deleted ${obsoleteJamIds.length} obsolete jam categories.`);

  // Dedupe across categories first so a song appearing in two lists (e.g. "עכשיו קרוב" in both
  // מדורה and יום הזיכרון) only gets looked up once.
  const uniqueSongs = new Map();
  for (const cat of Object.values(categories)) {
    for (const song of cat.songs) {
      const id = "song_" + slug(song.artist + "_" + song.name);
      if (!uniqueSongs.has(id)) uniqueSongs.set(id, song);
    }
  }

  const linkById = new Map();
  let found = 0;
  let i = 0;
  for (const [id, song] of uniqueSongs) {
    i++;
    const link = await tryFindTab4uLink(song.name, song.artist);
    linkById.set(id, link);
    if (link) found++;
    console.log(`[${i}/${uniqueSongs.size}] ${link ? "✓" : "✗"} ${song.name} - ${song.artist}`);
    await sleep(400); // polite pacing against Tab4U's server across ~100 requests
  }
  console.log(`Found Tab4U links for ${found}/${uniqueSongs.size} unique songs.`);

  const songBatch = db.batch();
  for (const [id, song] of uniqueSongs) {
    const tab4uUrl = linkById.get(id) || "";
    songBatch.set(
      db.collection("songs").doc(id),
      {
        name: song.name,
        artistName: song.artist,
        artistId: "",
        tab4uUrl,
        emoji: "🎵",
        colorHex: "#EA7A35",
        genre: "",
        linkVerified: Boolean(tab4uUrl),
        createdAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );
  }
  await songBatch.commit();
  console.log(`Wrote ${uniqueSongs.size} song documents.`);

  let songCount = 0;
  for (const [key, cat] of Object.entries(categories)) {
    const songIds = cat.songs.map((song) => "song_" + slug(song.artist + "_" + song.name));
    await db.collection("jams").doc("jam_" + key).set({
      name: cat.name,
      emoji: cat.emoji,
      gradientStartHex: cat.start,
      gradientEndHex: cat.end,
      songIds: [...new Set(songIds)],
      order: Object.keys(categories).indexOf(key),
    });
    songCount += cat.songs.length;
    console.log(`Seeded category ${cat.name} with ${songIds.length} songs.`);
  }
  console.log(`Done. ${songCount} song entries processed across ${Object.keys(categories).length} categories.`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
