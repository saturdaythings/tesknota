// worker/fetch-metadata.js
// Cloudflare Worker — tesknota-fetch-metadata
//
// PURPOSE: Fetches a Fragrantica (or Sephora/FragranceNet) URL server-side
// and returns structured fragrance metadata as JSON.
// Solves the browser CORS restriction — the app cannot fetch these sites directly.
//
// DEPLOY:
// 1. dash.cloudflare.com → Workers & Pages → Create → Worker
// 2. Name it: tesknota-fetch-metadata
// 3. Paste this entire file → Deploy
// 4. Copy the worker URL → add as WORKER_URL env var in Cloudflare Pages

export default {
  async fetch(request) {

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: 'Invalid JSON body' }, 400, corsHeaders);
    }

    const url = body.url;
    const query = body.query;

    // ── Query mode: Parfumo name search ──────────────────────────────────────
    if (!url && query) {
      const result = await searchParfumo(query);
      return json(result, 200, corsHeaders);
    }

    if (!url) {
      return json({ error: 'Missing url or query field in request body' }, 400, corsHeaders);
    }

    // Only allow known fragrance sites
    const allowedDomains = ['fragrantica.com', 'sephora.com', 'fragrancenet.com', 'jomashop.com', 'scentsplit.com'];
    const isAllowed = allowedDomains.some(function(d) { return url.includes(d); });
    if (!isAllowed) {
      return json({ error: 'URL must be from: ' + allowedDomains.join(', ') }, 400, corsHeaders);
    }

    // Fetch the page
    let html;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' from target URL');
      }
      html = await response.text();
    } catch (e) {
      return json({ error: 'Could not fetch URL: ' + e.message }, 502, corsHeaders);
    }

    // Parse metadata based on domain
    let result;
    if (url.includes('fragrantica.com')) {
      result = parseFragrantica(html, url);
      // If Fragrantica was blocked or returned minimal data, supplement with Parfumo
      if (result.parseConfidence === 'slug-only' || (!result.topNotes && !result.allNotes)) {
        const searchName = result.name || extractFromSlug(url);
        if (searchName) {
          const parfumoData = await searchParfumo(searchName).catch(() => null);
          if (parfumoData && !parfumoData.error) {
            result = Object.assign(parfumoData, {
              name: result.name || parfumoData.name,
              house: result.house || parfumoData.house,
              url: url,
              source: 'parfumo',
              parseConfidence: parfumoData.topNotes ? 'high' : 'slug-only',
            });
          }
        }
      }
    } else if (url.includes('sephora.com')) {
      result = parseSephora(html, url);
    } else {
      result = parseGeneric(html, url);
    }

    return json(result, 200, corsHeaders);
  }
};

// ── Fragrantica parser ────────────────────────────────────────────────────────

function parseFragrantica(html, url) {
  const name  = extractMeta(html, 'og:title') || extractH1(html) || extractFromSlug(url);
  const house = extractHouseFragrantica(html) || extractHouseFromSlug(url);

  return {
    name:            cleanName(name, house),
    house:           house,
    communityRating: extractFragranticaRating(html),
    topNotes:        extractFragranticaNotes(html, 'Top Notes'),
    middleNotes:     extractFragranticaNotes(html, 'Heart Notes'),
    baseNotes:       extractFragranticaNotes(html, 'Base Notes'),
    allNotes:        '',  // filled below
    communityLong:   extractFragranticaVote(html, ['Very long', 'Long lasting', 'Moderate', 'Weak', 'Very weak']),
    communitySill:   extractFragranticaVote(html, ['Enormous', 'Strong', 'Moderate', 'Soft', 'Intimate']),
    url:             url,
    source:          'fragrantica',
    parseConfidence: name ? 'high' : 'slug-only',
  };
}

function extractHouseFragrantica(html) {
  // Fragrantica brand link: <span itemprop="name">Brand Name</span> inside brand section
  const brandMatch = html.match(/itemprop="brand"[^>]*>[\s\S]*?itemprop="name"[^>]*>([^<]+)<\/span/);
  if (brandMatch) return brandMatch[1].trim();
  // Fallback: look for /designers/ link text
  const designerMatch = html.match(/\/designers\/[^"]+\.html"[^>]*>([^<]+)<\/a>/);
  if (designerMatch) return designerMatch[1].trim();
  return '';
}

function extractFragranticaRating(html) {
  // Schema.org rating
  const match = html.match(/<meta[^>]+itemprop="ratingValue"[^>]+content="([^"]+)"/);
  if (match) return parseFloat(match[1]);
  const match2 = html.match(/ratingValue[^>]*content="([0-9.]+)"/);
  if (match2) return parseFloat(match2[1]);
  return null;
}

function extractFragranticaNotes(html, sectionLabel) {
  // Fragrantica note pyramid sections
  const idx = html.indexOf(sectionLabel);
  if (idx === -1) return '';
  const chunk = html.slice(idx, idx + 3000);
  // Notes have title attributes in the span elements
  const matches = [];
  const re = /title="([^"]+)"/g;
  let m;
  while ((m = re.exec(chunk)) !== null) {
    const note = m[1].trim();
    if (note && note.length < 50 && !note.includes('http')) {
      matches.push(note);
    }
  }
  return matches.slice(0, 10).join(', ');
}

function extractFragranticaVote(html, options) {
  const lower = html.toLowerCase();
  for (const opt of options) {
    if (lower.includes(opt.toLowerCase())) return opt;
  }
  return null;
}

// ── Sephora parser ────────────────────────────────────────────────────────────

function parseSephora(html, url) {
  const name  = extractMeta(html, 'og:title') || extractFromSlug(url);
  const house = extractMeta(html, 'og:site_name') || extractHouseFromSlug(url);
  const price = extractSephoraPrice(html);

  return {
    name:            cleanSephoraName(name),
    house:           house,
    communityRating: extractSephoraRating(html),
    topNotes:        '',
    middleNotes:     '',
    baseNotes:       '',
    allNotes:        extractSephoraIngredients(html),
    communityLong:   null,
    communitySill:   null,
    avgPrice:        price,
    url:             url,
    source:          'sephora',
    parseConfidence: name ? 'high' : 'slug-only',
  };
}

function extractSephoraRating(html) {
  const match = html.match(/"ratingValue"\s*:\s*"?([0-9.]+)"?/);
  return match ? parseFloat(match[1]) : null;
}

function extractSephoraPrice(html) {
  const match = html.match(/"currentSku"[^}]*"listPrice"\s*:\s*"([^"]+)"/);
  if (match) return match[1];
  const match2 = html.match(/\$([0-9]+(?:\.[0-9]{2})?)/);
  if (match2) return '~$' + match2[1];
  return null;
}

function extractSephoraIngredients(html) {
  const match = html.match(/Ingredients[^:]*:\s*([^<]+)</i);
  if (match) return match[1].trim().slice(0, 200);
  return '';
}

function cleanSephoraName(name) {
  if (!name) return '';
  // Sephora titles often end with "| Sephora" or include brand
  return name.replace(/\s*[\|–]\s*Sephora.*$/i, '').trim();
}

// ── Generic fallback parser ───────────────────────────────────────────────────

function parseGeneric(html, url) {
  return {
    name:            extractMeta(html, 'og:title') || extractH1(html) || extractFromSlug(url),
    house:           extractMeta(html, 'og:site_name') || extractHouseFromSlug(url),
    communityRating: null,
    topNotes:        '',
    middleNotes:     '',
    baseNotes:       '',
    allNotes:        '',
    communityLong:   null,
    communitySill:   null,
    avgPrice:        null,
    url:             url,
    source:          'generic',
    parseConfidence: 'low',
  };
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function extractMeta(html, property) {
  const re = new RegExp('<meta[^>]+(?:property|name)="' + property + '"[^>]+content="([^"]+)"', 'i');
  const match = html.match(re);
  if (match) return match[1].trim();
  // Try reversed attribute order
  const re2 = new RegExp('<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="' + property + '"', 'i');
  const match2 = html.match(re2);
  return match2 ? match2[1].trim() : '';
}

function extractH1(html) {
  const match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return match ? match[1].trim() : '';
}

function extractFromSlug(url) {
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    const last = parts[parts.length - 1]
      .replace(/\.html$/, '')
      .replace(/-\d+$/, '')
      .replace(/-/g, ' ')
      .trim();
    // Capitalise each word
    return last.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
  } catch (e) {
    return '';
  }
}

function extractHouseFromSlug(url) {
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    // fragrantica: /perfume/Creed/Aventus-1077.html → parts[1] = 'Creed'
    if (parts.length >= 3) {
      return parts[1].replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    }
    return '';
  } catch (e) {
    return '';
  }
}

function cleanName(name, house) {
  if (!name) return '';
  // Remove house name from beginning of fragrance name if present
  if (house && name.toLowerCase().startsWith(house.toLowerCase())) {
    name = name.slice(house.length).trim();
  }
  // Remove " by Brand" suffix
  name = name.replace(/\s+by\s+.+$/i, '').trim();
  return name;
}

// ── Parfumo search ────────────────────────────────────────────────────────────

async function searchParfumo(query) {
  const searchUrl = 'https://www.parfumo.com/search?q=' + encodeURIComponent(query);

  let html;
  try {
    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!resp.ok) {
      return { error: 'Parfumo search returned HTTP ' + resp.status };
    }
    html = await resp.text();
  } catch (e) {
    return { error: 'Parfumo fetch failed: ' + e.message };
  }

  // Extract first result detail URL — links look like: /Perfumes/Brand/Name
  const resultLinkMatch = html.match(/href="(\/Perfumes\/[^"]+)"/);
  if (!resultLinkMatch) {
    return { error: 'No Parfumo results found for: ' + query };
  }

  const detailUrl = 'https://www.parfumo.com' + resultLinkMatch[1];

  let detailHtml;
  try {
    const resp2 = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!resp2.ok) {
      return { error: 'Parfumo detail page returned HTTP ' + resp2.status };
    }
    detailHtml = await resp2.text();
  } catch (e) {
    return { error: 'Parfumo detail fetch failed: ' + e.message };
  }

  return parseParfumo(detailHtml, detailUrl);
}

function parseParfumo(html, url) {
  const name  = extractMeta(html, 'og:title') || extractH1(html) || '';

  // House: brand link pattern
  const houseMatch = html.match(/\/[Bb]rands?\/[^"]*"[^>]*>([^<]+)<\/a>/);
  const house = houseMatch ? houseMatch[1].trim() : '';

  // Rating
  const ratingMatch =
    html.match(/class="[^"]*rating[^"]*"[^>]*>\s*([0-9]+(?:\.[0-9]+)?)\s*</) ||
    html.match(/"ratingValue"[^>]*content="([0-9.]+)"/) ||
    html.match(/itemprop="ratingValue"[^>]*content="([0-9.]+)"/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  const topNotes    = extractParfumoNotes(html, ['Top Notes', 'Top', 'Head Notes']);
  const middleNotes = extractParfumoNotes(html, ['Heart Notes', 'Middle Notes', 'Heart', 'Middle']);
  const baseNotes   = extractParfumoNotes(html, ['Base Notes', 'Base', 'Bottom Notes']);

  const concMatch = html.match(/(?:Eau de Parfum|Eau de Toilette|Parfum|Extrait|Cologne|EDT|EDP|EDC)/i);
  const concentration = concMatch ? normalizeConcentration(concMatch[0]) : '';

  const familyMatch = html.match(/(?:Floral|Woody|Oriental|Fresh|Citrus|Chypre|Fougere|Gourmand|Aquatic|Leather|Musk|Amber|Spicy)/i);
  const family = familyMatch ? familyMatch[0] : '';

  const cleanedName = cleanName(name, house);

  return {
    name:            cleanedName || name,
    house:           house,
    communityRating: rating,
    topNotes:        topNotes,
    middleNotes:     middleNotes,
    baseNotes:       baseNotes,
    allNotes:        [topNotes, middleNotes, baseNotes].filter(Boolean).join(', '),
    concentration:   concentration,
    family:          family,
    communityLong:   null,
    communitySill:   null,
    url:             url,
    source:          'parfumo',
    parseConfidence: (cleanedName && (topNotes || middleNotes || baseNotes)) ? 'high' : cleanedName ? 'medium' : 'low',
  };
}

function extractParfumoNotes(html, labelVariants) {
  for (var i = 0; i < labelVariants.length; i++) {
    var label = labelVariants[i];
    var idx = html.indexOf(label);
    if (idx === -1) continue;
    var chunk = html.slice(idx, idx + 2000);

    // Parfumo puts note names in title or alt attributes on ingredient images
    var matches = [];
    var reTit = /title="([^"]{2,40})"/g;
    var reAlt = /alt="([^"]{2,40})"/g;
    var m;

    while ((m = reTit.exec(chunk)) !== null) {
      var note = m[1].trim();
      if (note && note.toLowerCase().indexOf('parfumo') === -1 && note.indexOf('http') === -1) {
        matches.push(note);
      }
    }
    if (matches.length === 0) {
      while ((m = reAlt.exec(chunk)) !== null) {
        var note2 = m[1].trim();
        if (note2 && note2.toLowerCase().indexOf('parfumo') === -1 && note2.indexOf('http') === -1) {
          matches.push(note2);
        }
      }
    }

    if (matches.length > 0) return matches.slice(0, 10).join(', ');
  }
  return '';
}

function normalizeConcentration(raw) {
  var r = raw.toLowerCase();
  if (r.indexOf('extrait') !== -1 || r === 'parfum') return 'Extrait de Parfum';
  if (r.indexOf('eau de parfum') !== -1 || r === 'edp') return 'Eau de Parfum';
  if (r.indexOf('eau de toilette') !== -1 || r === 'edt') return 'Eau de Toilette';
  if (r.indexOf('cologne') !== -1 || r === 'edc') return 'Eau de Cologne';
  return raw;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}),
  });
}
