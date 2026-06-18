const fs = require('fs');
const path = require('path');

const configFile = process.argv[2] || 'cafe_config.json';
const configPath = path.join(__dirname, configFile);

// Accept optional 2nd arg for output path (e.g., "Clients/sinaya-coffee/mockup.html")
// If relative, resolve from project root; if absolute, use as-is. Default: output/index.html
const outputArg = process.argv[3];
const outputPath = outputArg
  ? path.resolve(process.cwd(), outputArg)
  : path.join(__dirname, 'output', 'index.html');

// Autodetect: use premium_base_template.html if --template premium is passed as 4th arg
const templateArg = process.argv[4];
const templateName = templateArg === 'premium' ? 'premium_base_template.html' : 'kanto_coffee_template.html';
const templatePath = path.join(__dirname, templateName);

function escapeForJsString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function escapeForHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function resolveAbsoluteUrl(slug, value) {
  if (!value) return value;
  if (/^https?:\/\//.test(value)) return value;
  return 'https://allmites.github.io/' + slug + '/' + value.replace(/^\.?\//, '');
}

function getFontFamilyName(fontValue) {
  // "'Fraunces', serif" -> "Fraunces"
  return String(fontValue).split(',')[0].replace(/['"]/g, '').trim();
}

function buildGoogleFontsUrl(headingFont, bodyFont) {
  const h = getFontFamilyName(headingFont);
  const b = getFontFamilyName(bodyFont);
  const hEncoded = h.replace(/ /g, '+');
  const bEncoded = b.replace(/ /g, '+');
  return 'https://fonts.googleapis.com/css2?family=' + hEncoded + ':ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=' + bEncoded + ':wght@300;400;500;600;700&display=swap';
}

try {
  if (!fs.existsSync(configPath)) {
    console.error('Could not find ' + configFile + '. Pass a config filename as CLI arg, or ensure cafe_config.json exists.');
    process.exit(1);
  }
  if (!fs.existsSync(templatePath)) {
    console.error('Could not find kanto_coffee_template.html. Make sure it exists in the same directory.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  let html = fs.readFileSync(templatePath, 'utf8');

  // ------------------------------------------------------------------
  // 0. GOOGLE FONTS — swap the <link> tag to load actual configured fonts
  // ------------------------------------------------------------------
  const fontsUrl = buildGoogleFontsUrl(config.HEADING_FONT, config.BODY_FONT);
  html = html.replace(/href="https:\/\/fonts\.googleapis\.com\/css2\?family=[^"]+"/, 'href="' + fontsUrl + '"');

  // ------------------------------------------------------------------
  // 0a. Static <head> tags (title, description, keywords, OG) — filled
  // at build time so link-preview crawlers (Viber/FB/Messenger), which
  // don't execute JS, see real content instead of "Cafe Website Template".
  // ------------------------------------------------------------------
  const slugMatch = /Clients[\/\\]([^\/\\]+)[\/\\]/.exec(outputArg || configFile);
  const slug = slugMatch ? slugMatch[1] : null;
  const ogImageUrl = slug ? resolveAbsoluteUrl(slug, config.SEO_IMAGE) : config.SEO_IMAGE;
  const pageUrl = slug ? 'https://allmites.github.io/' + slug + '/' : '';

  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + escapeForHtml(config.SEO_TITLE) + '</title>');
  html = html.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + escapeForHtml(config.SEO_DESCRIPTION) + '">');
  html = html.replace(/<meta name="keywords" content="[^"]*">/, '<meta name="keywords" content="' + escapeForHtml(config.SEO_KEYWORDS) + '">');
  html = html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + escapeForHtml(config.SEO_TITLE) + '">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + escapeForHtml(config.SEO_DESCRIPTION) + '">');
  html = html.replace(/<meta property="og:image" content="[^"]*">/, '<meta property="og:image" content="' + escapeForHtml(ogImageUrl) + '">');
  if (pageUrl) {
    html = html.replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + escapeForHtml(pageUrl) + '">');
  }

  // ------------------------------------------------------------------
  // 1. SITE_CONFIG key-value replacements
  // ------------------------------------------------------------------
  const replacements = [
    // Theme colors (double-quoted strings)
    { from: /background:\s*"[^"]*"/,  to: 'background: "' + escapeForJsString(config.BACKGROUND_COLOR) + '"' },
    { from: /text:\s*"[^"]*"/,        to: 'text: "' + escapeForJsString(config.PRIMARY_COLOR) + '"' },
    { from: /accent:\s*"[^"]*"/,      to: 'accent: "' + escapeForJsString(config.ACCENT_COLOR) + '"' },
    { from: /surface:\s*"[^"]*"/,     to: 'surface: "' + escapeForJsString(config.SURFACE_COLOR) + '"' },
    { from: /border:\s*"[^"]*"/,      to: 'border: "' + escapeForJsString(config.BORDER_COLOR) + '"' },

    // Fonts
    { from: /heading:\s*"[^"]*"/,     to: 'heading: "' + escapeForJsString(config.HEADING_FONT) + '"' },
    { from: /body:\s*"[^"]*"/,        to: 'body: "' + escapeForJsString(config.BODY_FONT) + '"' },

    // Hero section
    { from: /businessName:\s*"[^"]*"/, to: 'businessName: "' + escapeForJsString(config.BUSINESS_NAME) + '"' },
    { from: /tagline:\s*"[^"]*"/,      to: 'tagline: "' + escapeForJsString(config.TAGLINE) + '"' },
    { from: /buttonText:\s*"[^"]*"/,   to: 'buttonText: "' + escapeForJsString('See the Menu') + '"' },
    { from: /backgroundImage:\s*"[^"]*"/, to: 'backgroundImage: "' + escapeForJsString(config.HERO_IMAGE_URL) + '"' },

    // About section
    { from: /(?<=about:\s*\{[^}]*?)title:\s*"[^"]*"/, to: 'title: "' + escapeForJsString(config.ABOUT_TITLE) + '"' },
    { from: /(?<=about:\s*\{[^}]*?)text:\s*"[^"]*"/,  to: 'text: "' + escapeForJsString(config.ABOUT_TEXT) + '"' },
    { from: /(?<=about:\s*\{[^}]*?)image:\s*"[^"]*"/, to: 'image: "' + escapeForJsString(config.ABOUT_IMAGE_URL) + '"' },

    // Section titles
    { from: /menuTitle:\s*"[^"]*"/,     to: 'menuTitle: "' + escapeForJsString(config.MENU_TITLE) + '"' },
    { from: /galleryTitle:\s*"[^"]*"/,  to: 'galleryTitle: "' + escapeForJsString(config.GALLERY_TITLE) + '"' },
    { from: /locationTitle:\s*"[^"]*"/, to: 'locationTitle: "' + escapeForJsString(config.LOCATION_TITLE) + '"' },

    // Pet-friendly flag
    { from: /isPetFriendly:\s*(true|false)/, to: 'isPetFriendly: ' + (config.IS_PET_FRIENDLY === 'true' ? 'true' : 'false') },

    // Logo URL (nullable)
    { from: /logoUrl:\s*[^,\n]+/, to: 'logoUrl: ' + (config.LOGO_URL ? '"' + escapeForJsString(config.LOGO_URL) + '"' : 'null') },

    // Contact fields — use lookbehind to avoid matching seo block
    { from: /address:\s*"[^"]*"/,     to: 'address: "' + escapeForJsString(config.ADDRESS) + '"' },
    { from: /(?<=contact:\s*\{[^}]*?)phone:\s*"[^"]*"/, to: 'phone: "' + escapeForJsString(config.PHONE) + '"' },
    { from: /facebook:\s*"[^"]*"/,    to: 'facebook: "' + escapeForJsString(config.FACEBOOK_URL) + '"' },
    { from: /instagram:\s*"[^"]*"/,   to: 'instagram: "' + escapeForJsString(config.INSTAGRAM_URL) + '"' },
    { from: /whatsapp:\s*"[^"]*"/,     to: 'whatsapp: "' + escapeForJsString(config.WHATSAPP_URL) + '"' },
    { from: /(?<=contact:\s*\{[^}]*?)locationImage:\s*"[^"]*"/, to: 'locationImage: "' + escapeForJsString(config.LOCATION_IMAGE) + '"' },

    // SEO fields — unique names, no conflict outside seo block
    { from: /templateTitle:\s*"[^"]*"/,         to: 'templateTitle: "' + escapeForJsString(config.SEO_TITLE) + '"' },
    { from: /(?<=seo:\s*\{[^}]*?)description:\s*"[^"]*"/, to: 'description: "' + escapeForJsString(config.SEO_DESCRIPTION) + '"' },
    { from: /keywords:\s*"[^"]*"/,              to: 'keywords: "' + escapeForJsString(config.SEO_KEYWORDS) + '"' },
    { from: /city:\s*"[^"]*"/,                 to: 'city: "' + escapeForJsString(config.SEO_CITY) + '"' },
    { from: /province:\s*"[^"]*"/,              to: 'province: "' + escapeForJsString(config.SEO_PROVINCE) + '"' },
    { from: /(?<=seo:\s*\{[^}]*?)phone:\s*"[^"]*"/, to: 'phone: "' + escapeForJsString(config.SEO_PHONE) + '"' },
    { from: /image:\s*"[^"]*"/,                 to: 'image: "' + escapeForJsString(config.SEO_IMAGE) + '"' },

    // Story section (premium template only — safe no-op on coffee template)
    { from: /(?<=story:\s*\{[^}]*?)title:\s*"[^"]*"/, to: 'title: "' + escapeForJsString(config.STORY_TITLE) + '"' },
    { from: /(?<=story:\s*\{[^}]*?)paragraph1:\s*"[^"]*"/, to: 'paragraph1: "' + escapeForJsString(config.STORY_PARAGRAPH_1) + '"' },
    { from: /(?<=story:\s*\{[^}]*?)paragraph2:\s*"[^"]*"/, to: 'paragraph2: "' + escapeForJsString(config.STORY_PARAGRAPH_2) + '"' },
    { from: /(?<=story:\s*\{[^}]*?)image:\s*"[^"]*"/, to: 'image: "' + escapeForJsString(config.STORY_IMAGE) + '"' },
    { from: /(?<=story:\s*\{[^}]*?)imageCaption:\s*"[^"]*"/, to: 'imageCaption: "' + escapeForJsString(config.STORY_IMAGE_CAPTION) + '"' },
  ];

  for (const { from, to } of replacements) {
    html = html.replace(from, function() { return to; });
  }

  // ------------------------------------------------------------------
  // 2. Full menu URL (nullable)
  // ------------------------------------------------------------------
  const fullMenuVal = config.FULL_MENU_URL === null ? 'null' : '"' + escapeForJsString(config.FULL_MENU_URL) + '"';
  html = html.replace(/fullMenuUrl:\s*[^,\n]+/, 'fullMenuUrl: ' + fullMenuVal);

  // ------------------------------------------------------------------
  // 3. Menu array — rebuild from config (4 items)
  // ------------------------------------------------------------------
  const menuItems = [
    { name: config.MENU_ITEM_1_NAME, desc: config.MENU_ITEM_1_DESC, price: config.MENU_ITEM_1_PRICE },
    { name: config.MENU_ITEM_2_NAME, desc: config.MENU_ITEM_2_DESC, price: config.MENU_ITEM_2_PRICE },
    { name: config.MENU_ITEM_3_NAME, desc: config.MENU_ITEM_3_DESC, price: config.MENU_ITEM_3_PRICE },
    { name: config.MENU_ITEM_4_NAME, desc: config.MENU_ITEM_4_DESC, price: config.MENU_ITEM_4_PRICE },
  ];
  const menuArrayStr = menuItems
    .map(function(item) {
      return '                { \n                    name: "' + escapeForJsString(item.name) + '", \n                    desc: "' + escapeForJsString(item.desc) + '", \n                    price: "' + escapeForJsString(item.price) + '" \n                }';
    })
    .join(',\n');
  html = html.replace(/menu:\s*\[[\s\S]*?\]\s*,/, function() { return 'menu: [\n' + menuArrayStr + '\n            ],'; });

  // ------------------------------------------------------------------
  // 4. Testimonials — rebuild from config (handle nested braces)
  // ------------------------------------------------------------------
  function replaceTestimonialsBlock(html, newContent) {
    var startMarker = 'testimonials:';
    var idx = html.indexOf(startMarker);
    if (idx === -1) return html;
    var start = idx;
    var depth = 0, inStr = false;
    var end = start;
    for (var i = start; i < html.length; i++) {
      var c = html[i];
      if (c === '"' && (i === 0 || html[i-1] !== '\\')) inStr = !inStr;
      if (inStr) continue;
      if (c === '{') depth++;
      if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    // Consume trailing comma and whitespace
    while (html[end] === ',' || html[end] === ' ' || html[end] === '\n' || html[end] === '\r') end++;
    return html.substring(0, start) + newContent + html.substring(end);
  }

  var testimonialTokens = ['', '', ''];
  var nameTokens = ['', '', ''];
  var locTokens = ['', '', ''];
  if (config.TESTIMONIAL_1_QUOTE) testimonialTokens[0] = escapeForJsString(config.TESTIMONIAL_1_QUOTE);
  if (config.TESTIMONIAL_2_QUOTE) testimonialTokens[1] = escapeForJsString(config.TESTIMONIAL_2_QUOTE);
  if (config.TESTIMONIAL_3_QUOTE) testimonialTokens[2] = escapeForJsString(config.TESTIMONIAL_3_QUOTE);
  if (config.TESTIMONIAL_1_NAME) nameTokens[0] = escapeForJsString(config.TESTIMONIAL_1_NAME);
  if (config.TESTIMONIAL_2_NAME) nameTokens[1] = escapeForJsString(config.TESTIMONIAL_2_NAME);
  if (config.TESTIMONIAL_3_NAME) nameTokens[2] = escapeForJsString(config.TESTIMONIAL_3_NAME);
  if (config.TESTIMONIAL_1_LOCATION) locTokens[0] = escapeForJsString(config.TESTIMONIAL_1_LOCATION);
  if (config.TESTIMONIAL_2_LOCATION) locTokens[1] = escapeForJsString(config.TESTIMONIAL_2_LOCATION);
  if (config.TESTIMONIAL_3_LOCATION) locTokens[2] = escapeForJsString(config.TESTIMONIAL_3_LOCATION);

  var testimonialStr = '            testimonials: {\n';
  testimonialStr += '                rating: ' + (config.TESTIMONIAL_RATING ? config.TESTIMONIAL_RATING : '0') + ',\n';
  testimonialStr += '                count: ' + (config.TESTIMONIAL_COUNT ? config.TESTIMONIAL_COUNT : '0') + ',\n';
  testimonialStr += '                items: [\n';
  for (var i = 0; i < 3; i++) {
    testimonialStr += '                    { quote: "' + testimonialTokens[i] + '", name: "' + nameTokens[i] + '", location: "' + locTokens[i] + '" }';
    if (i < 2) testimonialStr += ',';
    testimonialStr += '\n';
  }
  testimonialStr += '                ]\n            },';

  html = replaceTestimonialsBlock(html, testimonialStr);

  // ------------------------------------------------------------------
  // 4b. Hero slides array — rebuild from config (3 slides, premium template)
  //     Safe on coffee template: startMarker 'slides:' only matches premium
  // ------------------------------------------------------------------
  function replaceHeroSlidesBlock(html, newContent) {
    var startMarker = 'slides:';
    var idx = html.indexOf(startMarker);
    if (idx === -1) return html;
    var start = idx;
    var depth = 0, inStr = false;
    var end = start;
    for (var i = start; i < html.length; i++) {
      var c = html[i];
      if (c === '"' && (i === 0 || html[i-1] !== '\\')) inStr = !inStr;
      if (inStr) continue;
      if (c === '[') depth++;
      if (c === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    return html.substring(0, start) + newContent + html.substring(end);
  }

  var heroSlidesStr = 'slides: [\n';
  for (var s = 1; s <= 3; s++) {
    var imgKey = 'HERO_SLIDE_' + s + '_IMAGE';
    var capKey = 'HERO_SLIDE_' + s + '_CAPTION';
    var hlKey  = 'HERO_SLIDE_' + s + '_HEADLINE';
    var tagKey = 'HERO_SLIDE_' + s + '_TAGLINE';
    heroSlidesStr += '                    { image: "' + escapeForJsString(config[imgKey] || '') + '", caption: "' + escapeForJsString(config[capKey] || '') + '", headline: "' + escapeForJsString(config[hlKey] || '') + '", tagline: "' + escapeForJsString(config[tagKey] || '') + '" }';
    if (s < 3) heroSlidesStr += ',';
    heroSlidesStr += '\n';
  }
  heroSlidesStr += '                ]';

  html = replaceHeroSlidesBlock(html, heroSlidesStr);

  // ------------------------------------------------------------------
  // 4c. Gallery cards array — rebuild from config (6 cards, premium template)
  //     Safe on coffee template: startMarker 'galleryCards:' only matches premium
  // ------------------------------------------------------------------
  function replaceGalleryCardsBlock(html, newContent) {
    var startMarker = 'galleryCards:';
    var idx = html.indexOf(startMarker);
    if (idx === -1) return html;
    var start = idx;
    var depth = 0, inStr = false;
    var end = start;
    for (var i = start; i < html.length; i++) {
      var c = html[i];
      if (c === '"' && (i === 0 || html[i-1] !== '\\')) inStr = !inStr;
      if (inStr) continue;
      if (c === '[') depth++;
      if (c === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    return html.substring(0, start) + newContent + html.substring(end);
  }

  var galleryCardsStr = 'galleryCards: [\n';
  for (var gc = 1; gc <= 6; gc++) {
    var imgKey = 'GALLERY_CARD_' + gc + '_IMAGE';
    var titleKey = 'GALLERY_CARD_' + gc + '_TITLE';
    var descKey = 'GALLERY_CARD_' + gc + '_DESC';
    galleryCardsStr += '                    { image: "' + escapeForJsString(config[imgKey] || '') + '", title: "' + escapeForJsString(config[titleKey] || '') + '", desc: "' + escapeForJsString(config[descKey] || '') + '" }';
    if (gc < 6) galleryCardsStr += ',';
    galleryCardsStr += '\n';
  }
  galleryCardsStr += '                ]';
  html = replaceGalleryCardsBlock(html, galleryCardsStr);

  // ------------------------------------------------------------------
  // 5. Gallery array — rebuild from config (6 images)
  // ------------------------------------------------------------------
  const galleryImages = [
    config.GALLERY_IMAGE_1, config.GALLERY_IMAGE_2, config.GALLERY_IMAGE_3,
    config.GALLERY_IMAGE_4, config.GALLERY_IMAGE_5, config.GALLERY_IMAGE_6,
  ];
  const galleryArrayStr = galleryImages.map(function(url) { return '"' + escapeForJsString(url) + '"'; }).join(',\n                ');
  html = html.replace(/gallery:\s*\[[\s\S]*?\]/, function() { return 'gallery: [\n                ' + galleryArrayStr + '\n            ]'; });

  // ------------------------------------------------------------------
  // 6. Hours array — rebuild from config (3 entries)
  // ------------------------------------------------------------------
  const hoursConfig = [
    { day: 'Monday - Thursday', time: config.HOURS_MON_THU },
    { day: 'Friday - Saturday', time: config.HOURS_FRI_SAT },
    { day: 'Sunday',           time: config.HOURS_SUN },
  ];
  const hoursArrayStr = hoursConfig
    .map(function(h) { return '                { day: "' + h.day + '", time: "' + escapeForJsString(h.time) + '" }'; })
    .join(',\n');
  html = html.replace(/hours:\s*\[[\s\S]*?\]/, function() { return 'hours: [\n' + hoursArrayStr + '\n            ]'; });

  // ------------------------------------------------------------------
  // 7. CSS :root fallback fonts — update to match configured fonts
  // ------------------------------------------------------------------
  html = html.replace(/--font-heading:\s*'[^']*'[^;]*/, '--font-heading: ' + config.HEADING_FONT);
  html = html.replace(/--font-body:\s*'[^']*'[^;]*/, '--font-body: ' + config.BODY_FONT);

  // ------------------------------------------------------------------
  // 8. Map iframe src — replace Google Maps embed URL
  // ------------------------------------------------------------------
  if (config.MAPS_EMBED_URL) {
    const mapSrcRegex = /src="[^"]*google\.com\/maps\/embed[^"]*"/;
    html = html.replace(mapSrcRegex, function() { return 'src="' + escapeForJsString(config.MAPS_EMBED_URL) + '"'; });
  }

  // ------------------------------------------------------------------
  // 8. Write output
  // ------------------------------------------------------------------
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);

  console.log('Built: ' + outputPath);
  console.log('  Config: ' + configFile);
  console.log('  Client: ' + config.BUSINESS_NAME);
} catch (err) {
  if (err instanceof SyntaxError) {
    console.error('Invalid JSON in config.json. Check for missing commas or quotes.');
  } else {
    console.error('Error: ' + err.message);
  }
  process.exit(1);
}
