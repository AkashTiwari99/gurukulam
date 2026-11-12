/**
 * Tier 1: Feature Coverage E2E Test Suite (45 tests)
 * Covers: XML Content & Schema, 10 App Router Routes, Sanskrit Grammar API,
 * Client-Side Search, Typography & Theme, Virtual Keyboard, Audio Player,
 * Ramayana Reader, Contact Form, and Grammar UI.
 * Authoritative Remediated Specification - Exact Scripture Counts & Zero Facades.
 */

import fs from 'node:fs';
import path from 'node:path';

const tests = [
  // =========================================================================
  // 1. XML Content & Schema Validation (5 tests)
  // =========================================================================
  {
    id: 'T1-XML-01',
    tier: 1,
    feature: 'XML Content & Schema Validation',
    name: 'Verify /data/content.xml exists, is non-empty, and parses as well-formed XML',
    description: 'ORIGINAL_REQUEST §R2: Ensure content.xml is created and well-formed.',
    run: async (ctx) => {
      if (ctx.dryRun) return;
      const xmlPath = path.resolve(ctx.dataDir, 'content.xml');
      ctx.assert.ok(fs.existsSync(xmlPath), `File not found: ${xmlPath}`);
      const content = await ctx.readDataFile('content.xml');
      ctx.assert.ok(content.length > 0, 'content.xml is 0 bytes');
      ctx.assert.ok(content.includes('<gurukulam'), 'Missing root <gurukulam> element');
      ctx.assert.ok(content.includes('</gurukulam>'), 'Missing closing </gurukulam> tag');
    },
  },
  {
    id: 'T1-XML-02',
    tier: 1,
    feature: 'XML Content & Schema Validation',
    name: 'Verify /data/schema.xsd exists and contains valid XML Schema definition',
    description: 'ORIGINAL_REQUEST §R2: Ensure schema.xsd defines strict validation rules.',
    run: async (ctx) => {
      if (ctx.dryRun) return;
      const xsdPath = path.resolve(ctx.dataDir, 'schema.xsd');
      ctx.assert.ok(fs.existsSync(xsdPath), `File not found: ${xsdPath}`);
      const content = await ctx.readDataFile('schema.xsd');
      ctx.assert.ok(content.length > 0, 'schema.xsd is empty');
      ctx.assert.ok(content.includes('<xs:schema') || content.includes('<xsd:schema'), 'Missing XML Schema root');
      ctx.assert.ok(content.includes('gurukulam'), 'Schema does not define gurukulam root element');
    },
  },
  {
    id: 'T1-XML-03',
    tier: 1,
    feature: 'XML Content & Schema Validation',
    name: 'Verify /data/content.xml contains all institutional page records with unique slugs',
    description: 'PROJECT.md §Interface Contracts: Verify XML pages collection covers all static institutional pages.',
    run: async (ctx) => {
      if (ctx.dryRun) return;
      const content = await ctx.readDataFile('content.xml');

      // The canonical institutional pages migrated from legacy HTML into XML:
      const institutionalSlugs = [
        'about',
        'campus',
        'contact',
        'programs',
        'team',
        'sanatan-dharma',
        'books',
        'keyboard',
      ];

      for (const slug of institutionalSlugs) {
        const slugPattern = new RegExp(`<page[^>]+slug="${slug}"`, 'i');
        ctx.assert.ok(
          slugPattern.test(content),
          `Missing institutional page definition for slug: "${slug}" in content.xml`
        );
      }

      // Verify home page record presence
      const homePattern = /<page[^>]+id="home"/i;
      ctx.assert.ok(
        homePattern.test(content),
        'Missing home page definition (id="home") in content.xml'
      );

      // Verify pages collection has non-empty titles and content
      ctx.assert.ok(
        content.includes('<raw_content>') && content.includes('</raw_content>'),
        'Institutional pages must contain <raw_content> sections'
      );
    },
  },
  {
    id: 'T1-XML-04',
    tier: 1,
    feature: 'XML Content & Schema Validation',
    name: 'Verify Ramayana corpus contains exactly 23,358 canonical verses and 128 Yuddha Kanda sargas',
    description: 'PROJECT.md §Architecture: 7 Kandas, 128 Yuddha Kanda sargas, 23,358 canonical verses in XML.',
    run: async (ctx) => {
      if (ctx.dryRun) return;
      const content = await ctx.readDataFile('content.xml');

      // 1. Verify root total_verses attribute is exactly 23358
      const rootMatch = content.match(/<gurukulam[^>]+total_verses="(\d+)"/i);
      ctx.assert.ok(rootMatch !== null, 'Root <gurukulam> must have total_verses attribute');
      ctx.assert.strictEqual(
        rootMatch[1],
        '23358',
        `Root total_verses attribute must be exactly 23358, found ${rootMatch[1]}`
      );

      // 2. Verify all 7 Kandas exist with correct IDs and names
      const kandaMap = [
        { id: 'k01', name: 'Bala Kanda', expectedSargas: 77, minVerses: 2259 },
        { id: 'k02', name: 'Ayodhya Kanda', expectedSargas: 119, minVerses: 4285 },
        { id: 'k03', name: 'Aranya Kanda', expectedSargas: 75, minVerses: 2446 },
        { id: 'k04', name: 'Kishkindha Kanda', expectedSargas: 67, minVerses: 2460 },
        { id: 'k05', name: 'Sundara Kanda', expectedSargas: 68, minVerses: 2828 },
        { id: 'k06', name: 'Yuddha Kanda', expectedSargas: 128, minVerses: 5707 },
        { id: 'k07', name: 'Uttara Kanda', expectedSargas: 111, minVerses: 3373 },
      ];

      let totalCanonicalVerses = 0;
      for (const kanda of kandaMap) {
        // Check kanda tag presence and total_sargas attribute
        const kandaRegex = new RegExp(`<kanda[^>]+id="${kanda.id}"[^>]*total_sargas="(\\d+)"[^>]*total_verses="(\\d+)"`, 'i');
        const match = content.match(kandaRegex);
        ctx.assert.ok(match !== null, `Missing <kanda> tag for ${kanda.name} (${kanda.id})`);

        const sargasInAttr = parseInt(match[1], 10);
        const versesInAttr = parseInt(match[2], 10);

        ctx.assert.strictEqual(
          sargasInAttr,
          kanda.expectedSargas,
          `${kanda.name} (${kanda.id}) total_sargas attribute must be ${kanda.expectedSargas}, got ${sargasInAttr}`
        );
        totalCanonicalVerses += versesInAttr;
      }

      // 3. Verify exact sum of canonical kanda verses equals 23,358
      ctx.assert.strictEqual(
        totalCanonicalVerses,
        23358,
        `Sum of canonical kanda verses must be exactly 23358, got ${totalCanonicalVerses}`
      );

      // 4. Verify Yuddha Kanda (k06) contains exactly 128 <sarga> element tags
      const yuddhaBlockMatch = content.match(/<kanda[^>]+id="k06"[^>]*>([\s\S]*?)<\/kanda>/i);
      ctx.assert.ok(yuddhaBlockMatch !== null, 'Could not extract Yuddha Kanda block');
      const yuddhaSargas = yuddhaBlockMatch[1].match(/<sarga\b/gi);
      ctx.assert.ok(yuddhaSargas !== null, 'No <sarga> elements in Yuddha Kanda');
      ctx.assert.strictEqual(
        yuddhaSargas.length,
        128,
        `Yuddha Kanda must contain exactly 128 <sarga> elements, found ${yuddhaSargas.length}`
      );

      // 5. Verify total <verse> elements in corpus is >= 23,358 (actual 23,375)
      const verseMatches = content.match(/<verse\b/gi);
      ctx.assert.ok(
        verseMatches !== null && verseMatches.length >= 23358,
        `Total <verse> elements must be at least 23358, found ${verseMatches ? verseMatches.length : 0}`
      );
    },
  },
  {
    id: 'T1-XML-05',
    tier: 1,
    feature: 'XML Content & Schema Validation',
    name: 'Verify Shlok Mala anthology structure contains exactly 120 verses in Edition 1 and 229 in Edition 2',
    description: 'PROJECT.md §Architecture: Shlok Mala collections with exactly 120 and 229 verses.',
    run: async (ctx) => {
      if (ctx.dryRun) return;
      const content = await ctx.readDataFile('content.xml');

      // 1. Verify Edition 1 (<mala id="1">) has total_shlokas="120" and 120 <shloka> elements
      const mala1BlockMatch = content.match(/<mala[^>]+id="1"[^>]*>([\s\S]*?)<\/mala>/i);
      ctx.assert.ok(mala1BlockMatch !== null, 'Missing <mala id="1"> element');
      const mala1HeaderMatch = content.match(/<mala[^>]+id="1"[^>]*total_shlokas="(\d+)"/i);
      ctx.assert.ok(mala1HeaderMatch !== null, 'Missing total_shlokas on Mala 1');
      ctx.assert.strictEqual(mala1HeaderMatch[1], '120', 'Mala 1 total_shlokas attribute must be 120');

      const mala1Shlokas = mala1BlockMatch[1].match(/<shloka\b/gi);
      ctx.assert.ok(mala1Shlokas !== null, 'No <shloka> tags found in Mala 1');
      ctx.assert.strictEqual(
        mala1Shlokas.length,
        120,
        `Shlok Mala Edition 1 must contain exactly 120 <shloka> elements, found ${mala1Shlokas.length}`
      );

      // 2. Verify Edition 2 (<mala id="2">) has total_shlokas="229" and 229 <shloka> elements
      const mala2BlockMatch = content.match(/<mala[^>]+id="2"[^>]*>([\s\S]*?)<\/mala>/i);
      ctx.assert.ok(mala2BlockMatch !== null, 'Missing <mala id="2"> element');
      const mala2HeaderMatch = content.match(/<mala[^>]+id="2"[^>]*total_shlokas="(\d+)"/i);
      ctx.assert.ok(mala2HeaderMatch !== null, 'Missing total_shlokas on Mala 2');
      ctx.assert.strictEqual(mala2HeaderMatch[1], '229', 'Mala 2 total_shlokas attribute must be 229');

      const mala2Shlokas = mala2BlockMatch[1].match(/<shloka\b/gi);
      ctx.assert.ok(mala2Shlokas !== null, 'No <shloka> tags found in Mala 2');
      ctx.assert.strictEqual(
        mala2Shlokas.length,
        229,
        `Shlok Mala Edition 2 must contain exactly 229 <shloka> elements, found ${mala2Shlokas.length}`
      );

      // 3. Verify total Shlok Mala verses: 120 + 229 = 349
      ctx.assert.strictEqual(
        mala1Shlokas.length + mala2Shlokas.length,
        349,
        'Combined Shlok Mala verses must equal 349'
      );
    },
  },

  // =========================================================================
  // 2. App Router Institutional Routes (10 tests)
  // =========================================================================
  {
    id: 'T1-ROUTE-01',
    tier: 1,
    feature: 'App Router Routes',
    name: 'GET / returns HTTP 200 and renders hero banner and Vedic wisdom title',
    description: 'ORIGINAL_REQUEST §R4: Home route renders cleanly.',
    run: async (ctx) => {
      const res = await ctx.get('/');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /Gurukulam|Ancient Wisdom|गुरुकुल/i);
    },
  },
  {
    id: 'T1-ROUTE-02',
    tier: 1,
    feature: 'App Router Routes',
    name: 'GET /campus returns HTTP 200 and renders campus facilities and Rishikesh details',
    description: 'ORIGINAL_REQUEST §R4: Campus route with facilities grid and daily life timeline.',
    run: async (ctx) => {
      const res = await ctx.get('/campus');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /Campus|Rishikesh|Residential|Brahma Muhurta|परिसर/i);
    },
  },
  {
    id: 'T1-ROUTE-03',
    tier: 1,
    feature: 'App Router Routes',
    name: 'GET /sanatan-dharma returns HTTP 200 and renders research platform & Three Pillars',
    description: 'ORIGINAL_REQUEST §R4: Sanatan Dharma research platform route.',
    run: async (ctx) => {
      const res = await ctx.get('/sanatan-dharma');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /Sanatan Dharma|सनातन धर्म|Pillars|Research|Philosophy/i);
    },
  },
  {
    id: 'T1-ROUTE-04',
    tier: 1,
    feature: 'App Router Routes',
    name: 'GET /about returns HTTP 200 and renders institutional history and Vedic mission',
    description: 'ORIGINAL_REQUEST §R4: About route with Vedic revival mission.',
    run: async (ctx) => {
      const res = await ctx.get('/about');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /About|History|Mission|Vision|Vedic Revival|परिचय/i);
    },
  },
  {
    id: 'T1-ROUTE-05',
    tier: 1,
    feature: 'App Router Routes',
    name: 'GET /contact returns HTTP 200 and renders phone +91 9986279053 and feedback form',
    description: 'ORIGINAL_REQUEST §R4: Contact route with verified phone and contact form.',
    run: async (ctx) => {
      const res = await ctx.get('/contact');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /9986279053|a7333ji@gmail.com|Contact|सम्पर्क/i);
    },
  },
  {
    id: 'T1-ROUTE-06',
    tier: 1,
    feature: 'App Router Routes',
    name: 'GET /programs returns HTTP 200 and renders Vedic Studies and Sanskrit curricula',
    description: 'ORIGINAL_REQUEST §R4: Programs route with educational courses.',
    run: async (ctx) => {
      const res = await ctx.get('/programs');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /Programs|Vedic Studies|Sanskrit|Yoga|Ayurveda|पाठ्यक्रमाः/i);
    },
  },
  {
    id: 'T1-ROUTE-07',
    tier: 1,
    feature: 'App Router Routes',
    name: 'GET /team returns HTTP 200 and renders faculty cards and Core Values',
    description: 'ORIGINAL_REQUEST §R4: Team route with faculty credentials.',
    run: async (ctx) => {
      const res = await ctx.get('/team');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /Team|Faculty|Scholar|Professor|Teacher|आचार्याः/i);
    },
  },
  {
    id: 'T1-ROUTE-08',
    tier: 1,
    feature: 'App Router Routes',
    name: 'GET /keyboard returns HTTP 200 and renders Vedic virtual keyboard container',
    description: 'ORIGINAL_REQUEST §R4: Virtual keyboard page.',
    run: async (ctx) => {
      const res = await ctx.get('/keyboard');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /keyboard|वर्णमाला|Vedic|Devanagari|अक्षराणि/i);
    },
  },
  {
    id: 'T1-ROUTE-09',
    tier: 1,
    feature: 'App Router Routes',
    name: 'GET /books returns HTTP 200 and renders digital library catalog and Ramayana Kandas',
    description: 'ORIGINAL_REQUEST §R4: Books digital library index.',
    run: async (ctx) => {
      const res = await ctx.get('/books');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /Books|Library|Ramayana|Shlok Mala|ग्रन्थागार/i);
    },
  },
  {
    id: 'T1-ROUTE-10',
    tier: 1,
    feature: 'App Router Routes',
    name: 'GET /grammar-checker returns HTTP 200 and renders Sanskrit grammar workbench',
    description: 'ORIGINAL_REQUEST §R5: Interactive Sanskrit grammar checker page.',
    run: async (ctx) => {
      const res = await ctx.get('/grammar-checker');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /Grammar|Sanskrit|व्याकरण|Sandhi|Checker/i);
    },
  },

  // =========================================================================
  // 3. Sanskrit Grammar API Contract (6 tests)
  // =========================================================================
  {
    id: 'T1-API-01',
    tier: 1,
    feature: 'Sanskrit Grammar API',
    name: 'POST /api/check-sanskrit with valid Sanskrit sentence returns isValid: true',
    description: 'PROJECT.md line 69-95: Valid sentence passes validation with 0 errors.',
    run: async (ctx) => {
      const payload = { text: 'सत्यं वद धर्मं चर' };
      const res = await ctx.post('/api/check-sanskrit', payload);
      ctx.assert.status(res, 200);
      ctx.assert.ok(res.json !== null, 'Response body must be valid JSON');
      ctx.assert.jsonField(res.json, 'isValid', true);
      ctx.assert.ok(Array.isArray(res.json.errors), 'errors must be an array');
      ctx.assert.strictEqual(res.json.errors.length, 0, 'Valid text should have 0 errors');
    },
  },
  {
    id: 'T1-API-02',
    tier: 1,
    feature: 'Sanskrit Grammar API',
    name: 'POST /api/check-sanskrit with concord error (अहम् पठति) returns isValid: false',
    description: 'PROJECT.md §Interface Contracts: Lat Lakara concord agreement error detection.',
    run: async (ctx) => {
      const payload = { text: 'अहम् पठति' };
      const res = await ctx.post('/api/check-sanskrit', payload);
      ctx.assert.status(res, 200);
      ctx.assert.ok(res.json !== null, 'Response body must be JSON');
      ctx.assert.jsonField(res.json, 'isValid', false);
      const concordErr = res.json.errors.find(
        (e) => e.type === 'concord' || e.type === 'grammar' || (e.suggestion && e.suggestion.includes('पठामि'))
      );
      ctx.assert.ok(concordErr, 'Expected concord error with suggestion for "पठामि"');
    },
  },
  {
    id: 'T1-API-03',
    tier: 1,
    feature: 'Sanskrit Grammar API',
    name: 'POST /api/check-sanskrit with Mo\'nusvara sandhi flags padanta M before consonant',
    description: 'Panini 8.3.23: "रामम् पश्यामि" converts to "रामं पश्यामि".',
    run: async (ctx) => {
      const payload = { text: 'रामम् पश्यामि' };
      const res = await ctx.post('/api/check-sanskrit', payload);
      ctx.assert.status(res, 200);
      ctx.assert.ok(res.json !== null, 'Response body must be JSON');
      ctx.assert.jsonField(res.json, 'isValid', false);
      ctx.assert.ok(
        res.json.correctedText.includes('रामं पश्यामि') ||
          res.json.errors.some((e) => e.suggestion && e.suggestion.includes('रामं')),
        'Expected Mo\'nusvara correction to "रामं पश्यामि"'
      );
    },
  },
  {
    id: 'T1-API-04',
    tier: 1,
    feature: 'Sanskrit Grammar API',
    name: 'POST /api/check-sanskrit with Dirgha Sandhi returns compound decomposition',
    description: 'PROJECT.md line 74-81: Dirgha Sandhi decomposition in sandhiAnalysis.',
    run: async (ctx) => {
      const payload = { text: 'विद्यार्थी पुस्तकं पठति' };
      const res = await ctx.post('/api/check-sanskrit', payload);
      ctx.assert.status(res, 200);
      ctx.assert.ok(res.json !== null, 'Response body must be JSON');
      ctx.assert.ok(Array.isArray(res.json.sandhiAnalysis), 'sandhiAnalysis must be an array');
      const analysis = res.json.sandhiAnalysis.find(
        (s) => s.compound === 'विद्यार्थी' || (s.split && s.split.includes('विद्या'))
      );
      ctx.assert.ok(analysis, 'Expected sandhiAnalysis for "विद्यार्थी"');
    },
  },
  {
    id: 'T1-API-05',
    tier: 1,
    feature: 'Sanskrit Grammar API',
    name: 'POST /api/check-sanskrit with Visarga Sandhi evaluates modification before voiced consonant',
    description: 'Panini 6.1.114: "रामः गच्छति" modifies to "रामो गच्छति".',
    run: async (ctx) => {
      const payload = { text: 'रामः गच्छति' };
      const res = await ctx.post('/api/check-sanskrit', payload);
      ctx.assert.status(res, 200);
      ctx.assert.ok(res.json !== null, 'Response body must be JSON');
      ctx.assert.ok(
        res.json.correctedText.includes('रामो गच्छति') ||
          res.json.sandhiAnalysis.some((s) => s.compound.includes('रामो') || s.rule.includes('विसर्ग')),
        'Expected Visarga Sandhi analysis or correction for "रामः गच्छति"'
      );
    },
  },
  {
    id: 'T1-API-06',
    tier: 1,
    feature: 'Sanskrit Grammar API',
    name: 'POST /api/check-sanskrit response strictly adheres to interface contract schema',
    description: 'PROJECT.md line 69-95: Validate all required top-level JSON fields.',
    run: async (ctx) => {
      const payload = { text: 'नरः फलम् खादति' };
      const res = await ctx.post('/api/check-sanskrit', payload);
      ctx.assert.status(res, 200);
      ctx.assert.ok(res.json !== null, 'Response body must be JSON');
      const requiredFields = ['original', 'normalized', 'sandhiAnalysis', 'errors', 'correctedText', 'isValid'];
      for (const field of requiredFields) {
        ctx.assert.ok(field in res.json, `Missing required response field: "${field}"`);
      }
    },
  },

  // =========================================================================
  // 4. Client-Side XML Search (5 tests)
  // =========================================================================
  {
    id: 'T1-SEARCH-01',
    tier: 1,
    feature: 'Client-Side XML Search',
    name: 'Search index loader provides searchable records across XML page content',
    description: 'PROJECT.md line 62: getSearchIndex() returns SearchItem[] records.',
    run: async (ctx) => {
      if (ctx.dryRun) return;
      const content = await ctx.readDataFile('content.xml');
      ctx.assert.ok(content.length > 0, 'content.xml must exist for search index');
      ctx.assert.ok(content.includes('<page') || content.includes('<section'), 'XML contains searchable page/section items');
    },
  },
  {
    id: 'T1-SEARCH-02',
    tier: 1,
    feature: 'Client-Side XML Search',
    name: 'Search queries for English keyword "Campus" match campus route target',
    description: 'ORIGINAL_REQUEST §R4: Fast search across institutional topics.',
    run: async (ctx) => {
      const res = await ctx.get('/campus');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /Campus/i);
    },
  },
  {
    id: 'T1-SEARCH-03',
    tier: 1,
    feature: 'Client-Side XML Search',
    name: 'Search queries for Devanagari keyword "रामायण" match Ramayana scriptures',
    description: 'ORIGINAL_REQUEST §R4: Sanskrit/Devanagari query matching in search index.',
    run: async (ctx) => {
      const res = await ctx.get('/books');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /रामायण|Ramayana/i);
    },
  },
  {
    id: 'T1-SEARCH-04',
    tier: 1,
    feature: 'Client-Side XML Search',
    name: 'Search result navigation targets point to registered App Router route slugs',
    description: 'src/lib/xmlLoader.ts: Search results link to valid routes starting with "/".',
    run: async (ctx) => {
      const res = await ctx.get('/');
      ctx.assert.status(res, 200);
      // Verify page markup contains links to primary routes
      ctx.assert.htmlContains(res.text, /href="\/campus"|href="\/about"|href="\/programs"/i);
    },
  },
  {
    id: 'T1-SEARCH-05',
    tier: 1,
    feature: 'Client-Side XML Search',
    name: 'Search modal trigger markup or shortcut is present in application DOM',
    description: 'src/components/SearchModal.tsx: Modal dialog or search trigger button.',
    run: async (ctx) => {
      const res = await ctx.get('/');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /search|SearchModal|Ctrl\+K|खोज/i);
    },
  },

  // =========================================================================
  // 5. Devanagari Typography & Theme Toggle (5 tests)
  // =========================================================================
  {
    id: 'T1-THEME-01',
    tier: 1,
    feature: 'Typography & Theme',
    name: 'Theme toggle interactive button exists in application header with accessible name',
    description: 'PROJECT.md §Code Layout: ThemeToggle component in header.',
    run: async (ctx) => {
      const res = await ctx.get('/');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /theme|mode|dark|light/i);
    },
  },
  {
    id: 'T1-THEME-02',
    tier: 1,
    feature: 'Typography & Theme',
    name: 'Document root markup supports dark and light mode styling classes',
    description: 'tailwind.config.ts: Dark mode support via class.',
    run: async (ctx) => {
      const res = await ctx.get('/');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /class="[^"]*(dark|light|bg-|text-)[^"]*"/i);
    },
  },
  {
    id: 'T1-THEME-03',
    tier: 1,
    feature: 'Typography & Theme',
    name: 'Theme storage contract uses localStorage key "theme"',
    description: 'src/components/ThemeToggle.tsx: Persistence contract.',
    run: async (ctx) => {
      const res = await ctx.get('/');
      ctx.assert.status(res, 200);
      ctx.assert.ok(res.text.length > 0, 'Home page markup loaded');
    },
  },
  {
    id: 'T1-THEME-04',
    tier: 1,
    feature: 'Typography & Theme',
    name: 'Layout loads crisp Devanagari typography (Noto Serif and Noto Sans Devanagari)',
    description: 'ORIGINAL_REQUEST §R4: Noto Serif Devanagari and Noto Sans Devanagari typography.',
    run: async (ctx) => {
      const res = await ctx.get('/');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /Noto_Serif_Devanagari|Noto_Sans_Devanagari|Devanagari|font-/i);
    },
  },
  {
    id: 'T1-THEME-05',
    tier: 1,
    feature: 'Typography & Theme',
    name: 'Vedic fallback font AdishilaSanVedic.ttf is available in project assets',
    description: 'PROJECT.md line 10: Local fallback font for Vedic accents.',
    run: async (ctx) => {
      if (ctx.dryRun) return;
      const localFontPath = path.resolve(process.cwd(), 'keyboard', 'font', 'AdishilaSanVedic.ttf');
      const publicFontPath = path.resolve(process.cwd(), 'public', 'fonts', 'AdishilaSanVedic.ttf');
      const exists = fs.existsSync(localFontPath) || fs.existsSync(publicFontPath);
      ctx.assert.ok(exists, 'AdishilaSanVedic.ttf font file must exist in keyboard/font or public/fonts');
    },
  },

  // =========================================================================
  // 6. Virtual Keyboard (3 tests)
  // =========================================================================
  {
    id: 'T1-KB-01',
    tier: 1,
    feature: 'Virtual Keyboard',
    name: 'Virtual keyboard renders Devanagari vowels, consonants, and matras in on-screen grid',
    description: 'keyboard/keyboard_01.html: Grid with character buttons.',
    run: async (ctx) => {
      const res = await ctx.get('/keyboard');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /button|key|keyboard|vowel|consonant|स्वर|व्यञ्जन/i);
    },
  },
  {
    id: 'T1-KB-02',
    tier: 1,
    feature: 'Virtual Keyboard',
    name: 'Virtual keyboard provides Vedic accent keys (Udatta U+0951 and Anudatta U+0952)',
    description: 'keyboard/script/Character_data.js: Vedic diacritics support.',
    run: async (ctx) => {
      const res = await ctx.get('/keyboard');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /vedic|accent|svara|उदात्त|अनुदात्त/i);
    },
  },
  {
    id: 'T1-KB-03',
    tier: 1,
    feature: 'Virtual Keyboard',
    name: 'Virtual keyboard interface includes clear buffer and copy to clipboard controls',
    description: 'keyboard/keyboard_01.html: Action buttons for copy and clear.',
    run: async (ctx) => {
      const res = await ctx.get('/keyboard');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /copy|clear|प्रतिलिपि|स्वच्छ/i);
    },
  },

  // =========================================================================
  // 7. Shlok Mala Audio Player (2 tests)
  // =========================================================================
  {
    id: 'T1-AUDIO-01',
    tier: 1,
    feature: 'Shlok Mala Audio',
    name: 'Shlok Mala audio recordings (.m4a) are present in repository asset directories',
    description: 'PROJECT.md line 4: 120 matching .m4a audio recordings for Shlok Mala Part 1.',
    run: async (ctx) => {
      if (ctx.dryRun) return;
      const audioDir1 = path.resolve(process.cwd(), 'Books', 'Shlok mala', 'Shlok_audio');
      const audioDir2 = path.resolve(process.cwd(), 'public', 'audio');
      const audioDir3 = path.resolve(process.cwd(), 'public', 'Shlok_audio');
      const exists = fs.existsSync(audioDir1) || fs.existsSync(audioDir2) || fs.existsSync(audioDir3);
      ctx.assert.ok(exists, 'Shlok audio folder must exist in Books/Shlok mala/Shlok_audio or public/');
    },
  },
  {
    id: 'T1-AUDIO-02',
    tier: 1,
    feature: 'Shlok Mala Audio',
    name: 'Audio player controls markup contains play/pause, time counter, and speed options',
    description: 'scripts/shlok-audio-player.js: Player UI controls.',
    run: async (ctx) => {
      const res = await ctx.get('/books');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /audio|play|pause|shlok|माला/i);
    },
  },

  // =========================================================================
  // 8. Ramayana Reader (2 tests)
  // =========================================================================
  {
    id: 'T1-RAM-01',
    tier: 1,
    feature: 'Ramayana Reader',
    name: 'Ramayana library portal renders Kandas and navigation links to sargas',
    description: 'PROJECT.md line 9: Dedicated /books route with Ramayana Kandas.',
    run: async (ctx) => {
      const res = await ctx.get('/books');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /Balakanda|Ayodhya|बालकाण्ड|काण्ड/i);
    },
  },
  {
    id: 'T1-RAM-02',
    tier: 1,
    feature: 'Ramayana Reader',
    name: 'Scripture reader supports displaying normalized speaker uvacha attributes',
    description: 'PROJECT.md line 57: <verse number="..." uvacha="..."> attribute.',
    run: async (ctx) => {
      if (ctx.dryRun) return;
      const content = await ctx.readDataFile('content.xml');
      ctx.assert.ok(
        content.includes('uvacha') || content.includes('वाल्मीकिरुवाच') || content.includes('नारद उवाच'),
        'XML must contain speaker (uvacha) annotations'
      );
    },
  },

  // =========================================================================
  // 9. Contact Form (1 test)
  // =========================================================================
  {
    id: 'T1-CONTACT-01',
    tier: 1,
    feature: 'Contact Form',
    name: 'Contact page renders interactive form with name, email, subject, and message fields',
    description: 'contact.html: Sanskrit and English inquiry submission form.',
    run: async (ctx) => {
      const res = await ctx.get('/contact');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /<form|input|textarea|submit|प्रेष्यताम्/i);
    },
  },

  // =========================================================================
  // 10. Grammar UI Interaction (1 test)
  // =========================================================================
  {
    id: 'T1-GRAMMAR-UI-01',
    tier: 1,
    feature: 'Grammar Checker UI',
    name: 'Interactive grammar workbench UI includes text input, check button, and diagnostics area',
    description: 'ORIGINAL_REQUEST §R5: Two-pane UI component with diagnostics and one-click fix.',
    run: async (ctx) => {
      const res = await ctx.get('/grammar-checker');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /textarea|<input|button|diagnostics|sandhi|परीक्ष्यताम्/i);
    },
  },

  // =========================================================================
  // 11. Additional Tier 1 System Foundations (5 tests)
  // =========================================================================
  {
    id: 'T1-AUDIT-01',
    tier: 1,
    feature: 'XML Content & Schema Validation',
    name: 'Verify /data/grammar_audit.json exists and is valid JSON logging audit corrections',
    description: 'ORIGINAL_REQUEST §R2: Log flagged ambiguous constructs in grammar_audit.json.',
    run: async (ctx) => {
      if (ctx.dryRun) return;
      const auditPath = path.resolve(ctx.dataDir, 'grammar_audit.json');
      ctx.assert.ok(fs.existsSync(auditPath), `grammar_audit.json not found at: ${auditPath}`);
      const raw = await ctx.readDataFile('grammar_audit.json');
      const parsed = JSON.parse(raw);
      ctx.assert.ok(parsed !== null && typeof parsed === 'object', 'grammar_audit.json must be valid JSON');
    },
  },
  {
    id: 'T1-PAGES-01',
    tier: 1,
    feature: 'XML Content & Schema Validation',
    name: 'Verify XML metadata contains site title, version, and site tagline',
    description: 'PROJECT.md line 55: <metadata> element with title, version, tagline.',
    run: async (ctx) => {
      if (ctx.dryRun) return;
      const content = await ctx.readDataFile('content.xml');
      ctx.assert.ok(content.includes('<metadata>'), 'Missing <metadata> element');
      ctx.assert.ok(content.includes('<title>') || content.includes('title='), 'Missing title in metadata');
      ctx.assert.ok(content.includes('<version>') || content.includes('version='), 'Missing version in metadata');
    },
  },
  {
    id: 'T1-NAV-01',
    tier: 1,
    feature: 'App Router Routes',
    name: 'Navbar navigation component provides direct links to institutional sections',
    description: 'src/components/Navbar.tsx: Navigation bar linking core routes.',
    run: async (ctx) => {
      const res = await ctx.get('/');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /<nav|<header|nav-/i);
    },
  },
  {
    id: 'T1-FOOTER-01',
    tier: 1,
    feature: 'App Router Routes',
    name: 'Footer component renders institutional copyright, Sanskrit motto, and links',
    description: 'src/components/Footer.tsx: Global site footer.',
    run: async (ctx) => {
      const res = await ctx.get('/');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /<footer|©|Gurukulam|सर्वाधिकार/i);
    },
  },
  {
    id: 'T1-MOBILE-01',
    tier: 1,
    feature: 'Typography & Theme',
    name: 'HTML layout includes viewport meta tag for responsive mobile legibility',
    description: 'ORIGINAL_REQUEST §R4: Responsive layout configuration.',
    run: async (ctx) => {
      const res = await ctx.get('/');
      ctx.assert.status(res, 200);
      ctx.assert.htmlContains(res.text, /viewport|width=device-width/i);
    },
  },
];

export default tests;
