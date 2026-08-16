/**
 * One-off diagnostic - NOT part of the app. Fetches a couple of known Tab4U URLs and prints the
 * raw response so we can see whether the HTML actually contains search results (server-rendered)
 * or just an empty JS shell (client-rendered) - this decides whether the search-page scraping
 * approach can ever work at all, and whether an artist-page listing might work better.
 */

async function dump(label, url) {
  console.log(`\n=== ${label} ===`);
  console.log(url);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
    console.log(`status: ${res.status} ${res.statusText}`);
    const html = await res.text();
    console.log(`length: ${html.length}`);
    console.log(html.slice(0, 3000));
  } catch (err) {
    console.log(`fetch error: ${err.message}`);
  }
}

async function main() {
  // Known song, should definitely exist on Tab4U if the site is reachable and parseable.
  await dump(
    "search: שלמה ארצי תתארו לכם",
    `https://www.tab4u.com/resultsSimple.php?ac=${encodeURIComponent("שלמה ארצי תתארו לכם")}`
  );
  // Tab4U's own homepage, as a baseline sanity check that fetch() reaches the site at all.
  await dump("homepage", "https://www.tab4u.com/");
}

main().then(() => process.exit(0));
