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

    // The query text itself, so we can tell at a glance if the server actually understood ?ac=...
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    console.log(`title: ${titleMatch ? titleMatch[1] : "(no title found)"}`);

    // Every <input ...> tag on the page - this reveals the REAL field name the search form posts,
    // in case it isn't "ac".
    const inputs = [...html.matchAll(/<input[^>]*>/g)].map((m) => m[0]);
    console.log(`input tags (${inputs.length}):`);
    inputs.slice(0, 15).forEach((i) => console.log("  " + i));

    // Every <form ...> tag - reveals the real action URL + method.
    const forms = [...html.matchAll(/<form[^>]*>/g)].map((m) => m[0]);
    console.log(`form tags (${forms.length}):`);
    forms.forEach((f) => console.log("  " + f));

    // Any href at all - so we can see the real link pattern used for results, whatever it is.
    const allHrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    const interesting = allHrefs.filter((h) => !h.match(/\.(css|js|ico|svg|png|jpg)/) && h !== "" && h !== "#");
    console.log(`non-asset hrefs (${interesting.length}):`);
    interesting.slice(0, 40).forEach((l) => console.log("  " + l));

    // Locate the song/artist name itself in the body and print surrounding context - this shows
    // us exactly how a real result row is marked up, if one is present at all.
    const idx = html.indexOf("תתארו");
    if (idx >= 0) {
      console.log(`found "תתארו" at index ${idx}, context:`);
      console.log(html.slice(Math.max(0, idx - 400), idx + 400));
    } else {
      console.log(`"תתארו" not found anywhere in the HTML body`);
    }
  } catch (err) {
    console.log(`fetch error: ${err.message}`);
  }
}

async function main() {
  // The one that worked: title correctly showed the song+artist name.
  await dump(
    "search q=: שלמה ארצי תתארו לכם",
    `https://www.tab4u.com/resultsSimple.php?q=${encodeURIComponent("שלמה ארצי תתארו לכם")}`
  );
}

main().then(() => process.exit(0));
