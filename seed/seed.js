/**
 * One-time / re-runnable seed script for Jam2Go's Firestore data.
 *
 * Populates:
 *  - artists: the 50 most-played Israeli artists (shown by default in artist selection) plus
 *    ~45 more that only show up via search - taken directly from jam2go-artists.html.
 *  - songs: a starter catalog of real songs with verified Tab4U chord-page links, taken from
 *    jam2go-main.html / jam2go-mood.html.
 *  - jams: the 6 "jam by mood" categories from jam2go-mood.html, each pointing at a curated
 *    subset of the seeded songs.
 *
 * Usage:
 *   1. Download a service account key from Firebase console
 *      (Project settings -> Service accounts -> Generate new private key).
 *   2. GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node seed/seed.js
 *
 * Safe to re-run: every document uses a deterministic id (a slug of its name), so re-running
 * this script updates existing docs instead of duplicating them.
 */

const admin = require("firebase-admin");

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

function slug(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

const PALETTE = ["#EA7A35", "#D85A30", "#E8623C", "#C9502C", "#F0A06A", "#E24B4A", "#C9682C"];
function colorFor(name) {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const top50 = [
  "עומר אדם", "אייל גולן", "עידן רייכל", "חנן בן ארי", "פאר טסי", "סטטיק ובן אל תבורי",
  "נועה קירל", "עדן בן זקן", "שרית חדד", "אלעד שלום", "דניאל עמר", "אנה זק", "איתי לוי",
  "אושר כהן", "עומר נצר", "רותם כהן", "דודו אהרון", "משה פרץ", "ישי ריבו", "אייל דדון",
  "נסרין קדרי", "קרן פלס", "מור וקנין", "שלמה ארצי", "ריטה", "אביב גפן", "עברי לידר",
  "מרגלית צנעני", "זהבה בן", "אמיר דדון", "הראל סקעת", "אלון דה לוקו", "נתן גושן",
  "יסמין מועלם", "רגב אוחיון", "עידן חביב", "מיכאל גינזבורג", "אלי לוק", "שרון בר", "אודיה",
  "טונה", "נועם וזאנא", "יונתן רזאל", "אביתר בנאי", "מירי מסיקה", "אייל שני", "עדן חסון",
  "נועה עמדו", "יובל דיין", "גלי עטרי"
];

const extended = [
  "אריק איינשטיין", "שלום חנוך", "יהודית רביץ", "חוה אלברשטיין", "אהוד בנאי", "משינה",
  "כנסיית השכל", "טיפקס", "הדג נחש", "מוש בן ארי", "קובי פרץ", "זוהר ארגוב", "אבנר גדסי",
  "ננסי אג'רם", "יזהר כהן", "עופרה חזה", "להקת כוורת", "ג'קי מקייטן", "יגאל בשן", "צביקה פיק",
  "גידי גוב", "דני סנדרסון", "מיקי גבריאלוב", "שלומי שבת", "דנה אינטרנשיונל", "רמי קלינשטיין",
  "ריקי גל", "אתי אנקרי", "סאבטו סנטו", "קרולינה", "סטטיק", "בן אל תבורי", "עמיר בניון",
  "אושיק לוי", "נתן זהבי", "אריאל הורוביץ", "נעמי שמר", "כובשי כיסופים", "עדן דרעי",
  "רוני דלומי", "הראל מויאל", "יוסי אזולאי", "עמית פרקש", "ליאור נרקיס", "ליאור סוארי", "שי גבסו"
];

const songs = [
  { name: "בואי", artist: "עידן רייכל", emoji: "🎤", color: "#EA7A35", genre: "פופ",
    url: "https://www.tab4u.com/tabs/songs/2173_%D7%94%D7%A4%D7%A8%D7%95%D7%99%D7%99%D7%A7%D7%98_%D7%A9%D7%9C_%D7%A2%D7%99%D7%93%D7%9F_%D7%A8%D7%99%D7%99%D7%9B%D7%9C_-_%D7%91%D7%95%D7%90%D7%99.html" },
  { name: "מי שמאמין", artist: "אייל גולן", emoji: "🎶", color: "#D85A30", genre: "מזרחי",
    url: "https://www.tab4u.com/tabs/songs/4173_%D7%90%D7%99%D7%99%D7%9C%20%D7%92%D7%95%D7%9C%D7%9F_-_%D7%9E%D7%99%20%D7%A9%D7%9E%D7%90%D7%9E%D7%99%D7%9F.html" },
  { name: "מולדת", artist: "חנן בן ארי", emoji: "🎸", color: "#C9502C", genre: "רוק ישראלי",
    url: "https://www.tab4u.com/tabs/songs/72436_%D7%97%D7%A0%D7%9F_%D7%91%D7%9F_%D7%90%D7%A8%D7%99_-_%D7%9E%D7%95%D7%9C%D7%93%D7%AA.html" },
  { name: "שמש", artist: "חנן בן ארי", emoji: "☀️", color: "#F0A06A", genre: "רוק ישראלי",
    url: "https://www.tab4u.com/tabs/songs/66930_%D7%97%D7%A0%D7%9F_%D7%91%D7%9F_%D7%90%D7%A8%D7%99_-_%D7%A9%D7%9E%D7%A9.html" },
  { name: "טודו בום", artist: "סטטיק ובן אל תבורי", emoji: "🎧", color: "#E8623C", genre: "מזרחי",
    url: "https://www.tab4u.com/tabs/songs/7694_%D7%A1%D7%98%D7%98%D7%99%D7%A7_%D7%95%D7%91%D7%9F_%D7%90%D7%9C_%D7%AA%D7%91%D7%95%D7%A8%D7%99_-_%D7%98%D7%95%D7%93%D7%95_%D7%91%D7%95%D7%9D.html" },
  { name: "בחום של תל אביב", artist: "שרית חדד", emoji: "🎹", color: "#E24B4A", genre: "מזרחי",
    url: "https://www.tab4u.com/tabs/songs/7015_%D7%A9%D7%A8%D7%99%D7%AA_%D7%97%D7%93%D7%93_-_%D7%91%D7%97%D7%95%D7%9D_%D7%A9%D7%9C_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.html" },
  { name: "אהבה אין סופית", artist: "שרית חדד", emoji: "💫", color: "#C9682C", genre: "בלדות ושירי אהבה",
    url: "https://www.tab4u.com/tabs/songs/70504_%D7%A9%D7%A8%D7%99%D7%AA_%D7%97%D7%93%D7%93_-_%D7%90%D7%94%D7%91%D7%94_%D7%90%D7%99%D7%9F_%D7%A1%D7%95%D7%A4%D7%99%D7%AA.html" },
  { name: "רק שלך", artist: "עומר אדם", emoji: "🎵", color: "#EA7A35", genre: "להיטי רדיו",
    url: "https://www.tab4u.com/tabs/songs/73124_%D7%A2%D7%95%D7%9E%D7%A8_%D7%90%D7%93%D7%9D_-_%D7%A8%D7%A7_%D7%A9%D7%9C%D7%9A.html" },
  { name: "תהום", artist: "עומר אדם", emoji: "🎤", color: "#D85A30", genre: "להיטי רדיו",
    url: "https://www.tab4u.com/tabs/songs/74500_%D7%A2%D7%95%D7%9E%D7%A8_%D7%90%D7%93%D7%9D_-_%D7%AA%D7%94%D7%95%D7%9D.html" },
  { name: "ארמונו של מלך", artist: "בנימין לנדאו", emoji: "👑", color: "#C9682C", genre: "חסידי / דתי",
    url: "https://www.tab4u.com/tabs/songs/67885_%D7%91%D7%A0%D7%99%D7%9E%D7%99%D7%9F_%D7%9C%D7%A0%D7%93%D7%90%D7%95_-_%D7%90%D7%A8%D7%9E%D7%95%D7%A0%D7%95_%D7%A9%D7%9C_%D7%9E%D7%9C%D7%9A.html" },
  { name: "פנתרה", artist: "נועה קירל", emoji: "🎤", color: "#E24B4A", genre: "פופ",
    url: "https://www.tab4u.com/tabs/songs/71115_%D7%A0%D7%95%D7%A2%D7%94_%D7%A7%D7%99%D7%A8%D7%9C_-_%D7%A4%D7%A0%D7%AA%D7%A8%D7%94.html" },
  { name: "אני", artist: "נועה קירל", emoji: "🎵", color: "#EA7A35", genre: "פופ",
    url: "https://www.tab4u.com/tabs/songs/73819_%D7%A0%D7%95%D7%A2%D7%94_%D7%A7%D7%99%D7%A8%D7%9C_-_%D7%90%D7%A0%D7%99.html" },
  { name: "אמא שלי", artist: "נועה קירל", emoji: "🎶", color: "#D85A30", genre: "פופ",
    url: "https://www.tab4u.com/tabs/songs/66732_%D7%A0%D7%95%D7%A2%D7%94_%D7%A7%D7%99%D7%A8%D7%9C_-_%D7%90%D7%9E%D7%90_%D7%A9%D7%9C%D7%99.html" },
  { name: "יש בי אהבה", artist: "נועה קירל", emoji: "💫", color: "#C9502C", genre: "בלדות ושירי אהבה",
    url: "https://www.tab4u.com/tabs/songs/69443_%D7%A0%D7%95%D7%A2%D7%94_%D7%A7%D7%99%D7%A8%D7%9C_-_%D7%99%D7%A9_%D7%91%D7%99_%D7%90%D7%94%D7%91%D7%94.html" },
  { name: "ויקיפדיה", artist: "חנן בן ארי", emoji: "🎸", color: "#F0A06A", genre: "רוק ישראלי",
    url: "https://www.tab4u.com/tabs/songs/7640_%D7%97%D7%A0%D7%9F_%D7%91%D7%9F_%D7%90%D7%A8%D7%99_-_%D7%95%D7%99%D7%A7%D7%99%D7%A4%D7%93%D7%99%D7%94.html" }
];

// key -> gradient (start/end hex) + emoji + which songs (by index into `songs` above)
const jams = [
  { key: "campfire", name: "שירי מדורה", emoji: "🔥", start: "#DD5F2C", end: "#A83F1E", songIdx: [0, 2, 3, 6] },
  { key: "shabbat", name: "שירי שבת", emoji: "🕯️", start: "#F0A06A", end: "#C9682C", songIdx: [1, 4, 9] },
  { key: "soul", name: "שירי נשמה", emoji: "💫", start: "#E24B4A", end: "#993C1D", songIdx: [0, 6, 7, 13] },
  { key: "party", name: "שירי מסיבה", emoji: "🎉", start: "#EA7A35", end: "#DD5F2C", songIdx: [4, 5, 8, 10] },
  { key: "love", name: "שירי אהבה", emoji: "❤️", start: "#E8623C", end: "#C9502C", songIdx: [5, 6, 1, 13] },
  { key: "road", name: "שירי דרך", emoji: "🚗", start: "#C9682C", end: "#8A541E", songIdx: [2, 3, 8, 14] }
];

async function seedArtists() {
  const batch = db.batch();
  const idByName = {};
  for (const name of top50) {
    const id = "artist_" + slug(name);
    idByName[name] = id;
    batch.set(db.collection("artists").doc(id), {
      name, nameLower: name.toLowerCase(), photoUrl: "", featuredTop50: true, colorHex: colorFor(name)
    });
  }
  for (const name of extended) {
    const id = "artist_" + slug(name);
    idByName[name] = id;
    batch.set(db.collection("artists").doc(id), {
      name, nameLower: name.toLowerCase(), photoUrl: "", featuredTop50: false, colorHex: colorFor(name)
    });
  }
  await batch.commit();
  console.log(`Seeded ${top50.length + extended.length} artists.`);
  return idByName;
}

async function seedSongs(artistIdByName) {
  const batch = db.batch();
  const idBySong = [];
  songs.forEach((song, index) => {
    const id = "song_" + slug(song.artist + "_" + song.name);
    idBySong[index] = id;
    batch.set(db.collection("songs").doc(id), {
      name: song.name,
      artistName: song.artist,
      artistId: artistIdByName[song.artist] || "",
      tab4uUrl: song.url,
      emoji: song.emoji,
      colorHex: song.color,
      genre: song.genre,
      linkVerified: true,
      createdAt: admin.firestore.Timestamp.now()
    });
  });
  await batch.commit();
  console.log(`Seeded ${songs.length} songs.`);
  return idBySong;
}

async function seedJams(songIdByIndex) {
  const batch = db.batch();
  jams.forEach((jam, order) => {
    batch.set(db.collection("jams").doc("jam_" + jam.key), {
      name: jam.name,
      emoji: jam.emoji,
      gradientStartHex: jam.start,
      gradientEndHex: jam.end,
      songIds: jam.songIdx.map((i) => songIdByIndex[i]).filter(Boolean),
      order
    });
  });
  await batch.commit();
  console.log(`Seeded ${jams.length} jam categories.`);
}

async function main() {
  const artistIdByName = await seedArtists();
  const songIdByIndex = await seedSongs(artistIdByName);
  await seedJams(songIdByIndex);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
