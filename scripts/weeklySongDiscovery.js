/**
 * Standalone weekly song discovery script - the free alternative to functions/index.js's
 * weeklySongDiscovery Cloud Function.
 *
 * This does the exact same job (spec section 10 / 6): for every artist already in Firestore
 * (never a global search), ask Spotify if they released something new, try a best-effort Tab4U
 * search for a chords link, and either publish the song automatically or drop it into the manual
 * admin approval queue.
 *
 * It runs from GitHub Actions on a weekly cron schedule instead of as a Firebase scheduled Cloud
 * Function, specifically because Firebase's Secret Manager (and Cloud Functions deployment in
 * general) requires the paid Blaze plan with a billing account attached - even though the actual
 * usage cost would be ~$0. This script talks to Firestore directly with a service account key,
 * which works on Firebase's free Spark plan with no billing account needed at all.
 *
 * Required environment variables (set as GitHub Actions repository secrets - see README):
 *   SPOTIFY_CLIENT_ID
 *   SPOTIFY_CLIENT_SECRET
 *   FIREBASE_SERVICE_ACCOUNT_KEY   (the full JSON content of a Firebase service account key file)
 */

const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const GENRE_KEYWORDS = [
  { genre: "מזרחי", match: ["mizrahi"] },
  { genre: "רוק ישראלי", match: ["israeli rock", "rock"] },
  { genre: "פופ", match: ["israeli pop", "pop"] },
  { genre: "היפ הופ / ראפ", match: ["hip hop", "rap", "israeli hip hop"] },
  { genre: "חסידי / דתי", match: ["hasidic", "religious"] },
  { genre: "אלטרנטיבי / אינדי", match: ["indie", "alternative"] }
];

function detectGenre(spotifyGenres) {
  const lower = (spotifyGenres || []).map((g) => g.toLowerCase());
  for (const entry of GENRE_KEYWORDS) {
    if (entry.match.some((keyword) => lower.some((g) => g.includes(keyword)))) {
      return entry.genre;
    }
  }
  return "";
}

async function getSpotifyAccessToken(clientId, clientSecret) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    },
    body: "grant_type=client_credentials"
  });
  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);
  const json = await res.json();
  return json.access_token;
}

async function findSpotifyArtistId(name, token) {
  const url = `https://api.spotify.com/v1/search?type=artist&limit=1&q=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const json = await res.json();
  const first = json.artists && json.artists.items && json.artists.items[0];
  return first ? { id: first.id, genres: first.genres || [] } : null;
}

async function getRecentReleases(spotifyArtistId, token, sinceIso) {
  const url = `https://api.spotify.com/v1/artists/${spotifyArtistId}/albums?include_groups=single,album&market=IL&limit=20`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items || []).filter((album) => album.release_date >= sinceIso);
}

async function getAlbumTracks(albumId, token) {
  const url = `https://api.spotify.com/v1/albums/${albumId}/tracks?market=IL&limit=20`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.items || [];
}

// Best-effort only - unverified against the live tab4u.com site (see README). Never throws;
// returns "" on any failure, which just means the song lands in the manual queue instead.
const TAB4U_SEARCH_URL = "https://www.tab4u.com/resultsSimple.php";
const TAB4U_RESULT_LINK_PATTERN = /href="(\/tabs\/songs\/[^"]+\.html)"/;

async function tryFindTab4uLink(songName, artistName) {
  try {
    const query = `${artistName} ${songName}`;
    const url = `${TAB4U_SEARCH_URL}?ac=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return "";
    const html = await res.text();
    const match = html.match(TAB4U_RESULT_LINK_PATTERN);
    return match ? `https://www.tab4u.com${match[1]}` : "";
  } catch (err) {
    console.warn("Tab4U search failed, falling back to manual queue:", err.message);
    return "";
  }
}

async function main() {
  const db = admin.firestore();
  const token = await getSpotifyAccessToken(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );

  const sinceIso = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const artistsSnap = await db.collection("artists").get();
  const existingSongsSnap = await db.collection("songs").get();
  const existingKeys = new Set(
    existingSongsSnap.docs.map((d) => `${d.data().artistName}__${d.data().name}`.toLowerCase())
  );

  let published = 0;
  let queued = 0;

  for (const artistDoc of artistsSnap.docs) {
    const artist = artistDoc.data();
    let spotifyArtistId = artist.spotifyArtistId;
    let genres = artist.spotifyGenres || [];

    if (!spotifyArtistId) {
      const found = await findSpotifyArtistId(artist.name, token);
      if (!found) continue;
      spotifyArtistId = found.id;
      genres = found.genres;
      await artistDoc.ref.update({ spotifyArtistId, spotifyGenres: genres });
    }

    const releases = await getRecentReleases(spotifyArtistId, token, sinceIso);
    for (const album of releases) {
      const tracks = await getAlbumTracks(album.id, token);
      for (const track of tracks) {
        const key = `${artist.name}__${track.name}`.toLowerCase();
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);

        const tab4uUrl = await tryFindTab4uLink(track.name, artist.name);
        const detectedGenre = detectGenre(genres);

        if (tab4uUrl) {
          await db.collection("songs").add({
            name: track.name,
            artistName: artist.name,
            artistId: artistDoc.id,
            tab4uUrl,
            emoji: "🎵",
            colorHex: artist.colorHex || "#EA7A35",
            genre: detectedGenre,
            linkVerified: false,
            createdAt: admin.firestore.Timestamp.now()
          });
          published++;
        } else {
          await db.collection("pendingSongs").add({
            name: track.name,
            artistName: artist.name,
            artistId: artistDoc.id,
            tab4uUrl: "",
            tab4uFound: false,
            detectedGenre,
            discoveredAt: admin.firestore.Timestamp.now()
          });
          queued++;
        }
      }
    }
  }

  console.log(`Done. Published ${published} song(s) automatically, queued ${queued} for manual review.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Weekly song discovery failed:", err);
    process.exit(1);
  });
