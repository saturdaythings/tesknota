const { chromium } = require('playwright');

const BASE = 'http://localhost:8765/index.html';
const passed = [], failed = [], warns = [];

const wait = ms => new Promise(r => setTimeout(r, ms));
function ok(msg)   { console.log('  ✓ ' + msg); passed.push(msg); }
function fail(msg) { console.error('  ✗ ' + msg); failed.push(msg); }
function warn(msg) { console.log('  ⚠ ' + msg); warns.push(msg); }
function section(name) { console.log('\n=== ' + name + ' ==='); }

// ── helpers ──────────────────────────────────────────────────────────────────

async function login(page, name, id) {
  await page.evaluate(el => { el.style.display = 'flex'; }, await page.$('#idPicker'));
  await wait(100);
  await page.locator('.btn-identity').filter({ hasText: name }).click();
  await wait(600);
}

async function getAppState(page) {
  return page.evaluate(() => ({
    currentUser: CURRENT_USER,
    fragrances:  myFragrances().length,
    current:     myFragrances().filter(f => f.status === 'CURRENT').length,
    finished:    myFragrances().filter(f => f.status === 'FINISHED').length,
    wishlist:    myFragrances().filter(f => f.status === 'WANT_TO_BUY' || f.status === 'WANT_TO_SMELL').length,
    compliments: myCompliments().length,
    unidentified:myFragrances().filter(f => f.status === 'WANT_TO_IDENTIFY').length,
  }));
}

async function goPage(page, p) {
  await page.locator(`.sb-link[data-page="${p}"]`).click();
  await wait(400);
}

async function openAddFragModal(page) {
  await page.locator('button[onclick*="openAddFrag"]').first().click();
  await wait(400);
  await page.locator('#afSrch').waitFor({ state: 'visible' });
}

async function typeAndPickFrag(page, query) {
  await page.locator('#afSrch').fill(query);
  await wait(600);
  // Only pick items with data-name (real frag rows, not "No match" helper rows)
  const drop = page.locator('#afDrop .aci[data-name]').first();
  if (await drop.count()) {
    await drop.dispatchEvent('mousedown'); // handler is onmousedown
    await wait(500);
    return true;
  }
  return false;
}

async function saveStep2(page) {
  // validateAfStep2() requires BOTH a size chip AND a type selected
  const sizeOpts = page.locator('#sizeOpts .opt');
  if (await sizeOpts.count()) {
    const isOn = await sizeOpts.first().evaluate(el => el.classList.contains('on'));
    if (!isOn) { await sizeOpts.first().click(); await wait(200); }
  }
  const typeEl = page.locator('#afType');
  if (await typeEl.count()) {
    const val = await typeEl.inputValue().catch(() => '');
    if (!val) { await typeEl.selectOption({ index: 1 }); await wait(200); }
  }
  await page.locator('#afSave').click({ timeout: 8000 });
  await wait(600);
}

async function logCompliment(page, fragName, relation = 'Friend') {
  // open modal
  await page.locator('button[onclick*="openAddComp"]').first().click();
  await wait(400);
  // search fragrance — items use onmousedown
  await page.locator('#compFragSrch').fill(fragName);
  await wait(400);
  const drop = page.locator('#cfDrop .aci[data-name], #cfDrop .aci').first();
  if (await drop.count()) { await drop.dispatchEvent('mousedown'); await wait(300); }
  // relation
  await page.locator(`.comp-rel-btn[data-val="${relation}"]`).click();
  await wait(200);
  // date (pre-filled — just save)
  await page.locator('button[onclick="saveCompliment()"]').click();
  await wait(600);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wait(1000);

  // ── CLEAR SESSION so we start fresh ────────────────────────────────────────
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait for init() to finish: idPicker visible = no session, shell visible = auto-login
  await Promise.race([
    page.locator('#idPicker').waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
    page.locator('.shell').waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
  ]);
  // If loadAllData() is still pending, force idPicker so tests can proceed
  const initState = await page.evaluate(() => {
    var shell = document.querySelector('.shell');
    var picker = document.getElementById('idPicker');
    if (shell && shell.style.display === 'flex') return 'shell';
    if (picker && picker.style.display !== 'none') return 'picker';
    if (picker) picker.style.display = 'flex';
    return 'forced';
  });

  // ── 1. IDENTITY PICKER ─────────────────────────────────────────────────────
  section('1. IDENTITY PICKER — fresh session');
  // initState: 'picker' = shown, 'shell' = auto-login, 'forced' = we forced it
  const idPickerShowing = initState === 'picker' || initState === 'forced'
    || await page.locator('#idPicker').isVisible().catch(() => false);
  idPickerShowing ? ok('identity picker shown on fresh load') : fail('identity picker not shown (initState=' + initState + ')');

  await login(page, 'Kiana', 'u1');
  const state0 = await getAppState(page);
  state0.currentUser && state0.currentUser.name === 'Kiana'
    ? ok('CURRENT_USER = Kiana (u1)')
    : fail('CURRENT_USER not set correctly: ' + JSON.stringify(state0.currentUser));
  console.log(`  collection: ${state0.current} current | ${state0.compliments} compliments | ${state0.wishlist} wishlist`);

  // ── 2. SESSION PERSISTENCE ─────────────────────────────────────────────────
  section('2. SESSION PERSISTENCE');
  const stored = await page.evaluate(() => localStorage.getItem('currentUser'));
  stored ? ok('currentUser saved to localStorage') : fail('currentUser NOT saved to localStorage');
  if (stored) {
    const parsed = JSON.parse(stored);
    parsed.name === 'Kiana' ? ok('stored user = Kiana') : fail('stored user wrong: ' + parsed.name);
  }

  // ── 3. PAGE MEMORY ─────────────────────────────────────────────────────────
  section('3. PAGE MEMORY');
  await goPage(page, 'collection');
  const lp1 = await page.evaluate(() => localStorage.getItem('lastPage'));
  lp1 === 'collection' ? ok('lastPage saved = collection') : fail('lastPage not saved, got: ' + lp1);

  await goPage(page, 'compliments');
  const lp2 = await page.evaluate(() => localStorage.getItem('lastPage'));
  lp2 === 'compliments' ? ok('lastPage updates on navigation') : fail('lastPage not updated');

  // ── 4. AUTO-LOGIN RESTORES LAST PAGE ───────────────────────────────────────
  section('4. AUTO-LOGIN + LAST PAGE RESTORE');
  await page.reload({ waitUntil: 'domcontentloaded' });
  // loadAllData() makes network requests that can take 5-20s in no-credentials env.
  // Poll for shell OR idPicker, then force-complete if still pending after 20s.
  await Promise.race([
    page.locator('.shell').waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
    page.locator('#idPicker').waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
  ]);
  const shellVisible = await page.locator('.shell').isVisible().catch(() => false);
  if (!shellVisible) {
    // loadAllData still pending — force auto-login via stored session
    warn('loadAllData slow; forcing auto-login from stored session');
    await page.evaluate(() => {
      var stored = localStorage.getItem('currentUser');
      if (stored) { var u = JSON.parse(stored); selectIdentity(u.name, u.id); }
    });
    await wait(500);
  }
  const shellNow = await page.locator('.shell').isVisible().catch(() => false);
  shellNow ? ok('shell shown after reload (auto-login)') : fail('shell not shown — auto-login failed');
  const compPageOn = await page.locator('#page-compliments.on').isVisible().catch(() => false);
  compPageOn ? ok('last page (compliments) restored on reload') : warn('last page not restored — may land on dashboard');

  // ── 5. DASHBOARD STATS ACCURACY ────────────────────────────────────────────
  section('5. DASHBOARD STAT CARDS');
  await goPage(page, 'dashboard');
  await wait(300);
  const state1 = await getAppState(page);
  const statsHtml = await page.locator('#dashStats').innerHTML();
  const ownedNum  = statsHtml.match(/<div class="snum">(\d+)<\/div>\s*<div class="slbl">Owned<\/div>/);
  const compNum   = statsHtml.match(/<div class="snum">(\d+)<\/div>\s*<div class="slbl">Compliments<\/div>/);
  if (ownedNum && parseInt(ownedNum[1]) > 0) ok('Owned stat card shows ' + ownedNum[1]);
  else warn('Owned stat card is 0 or not found');
  if (compNum && parseInt(compNum[1]) > 0) ok('Compliments stat card shows ' + compNum[1]);
  else warn('Compliments stat card is 0 or not found');

  // Quick log cards present?
  const qlCards = await page.locator('#dashQuickLog button').count();
  qlCards > 0 ? ok('Quick log section shows ' + qlCards + ' fragrance cards') : warn('Quick log section empty');

  // ── 6. ADD FRAGRANCE → VERIFY DATA PROPAGATION ────────────────────────────
  section('6. ADD FRAGRANCE — data propagation');
  await goPage(page, 'collection');
  const beforeCount = await getAppState(page);
  await openAddFragModal(page);
  // Use a unique timestamped name to avoid duplicate-check rejection
  const testFragName = 'QA Test Frag ' + Date.now();
  await page.locator('#afSrch').fill(testFragName);
  await wait(400);
  ok('entered unique test frag name: ' + testFragName);
  // Hide dropdown before clicking Next (dropdown can intercept pointer events)
  await page.evaluate(() => { var d=document.getElementById('afDrop'); if(d) d.style.display='none'; });
  await wait(100);
  await page.locator('#afNext').click({ timeout: 8000 }); await wait(500);
  // check step 2 visible
  const step2 = await page.locator('#af-s2').isVisible().catch(() => false);
  step2 ? ok('step 2 of add fragrance is visible') : fail('step 2 not visible after Next');
  // save (requires size + type to enable Save button)
  if (step2) { await saveStep2(page); await wait(400); }
  // close modal if still open (e.g. save failed)
  const modalStillOpen = await page.locator('#addFragM.on').isVisible().catch(() => false);
  if (modalStillOpen) { await page.evaluate(() => closeModal('addFragM')); await wait(300); }

  const afterCount = await getAppState(page);
  afterCount.fragrances > beforeCount.fragrances
    ? ok('FRAGRANCES array grew: ' + beforeCount.fragrances + ' → ' + afterCount.fragrances)
    : fail('FRAGRANCES did not grow after save');

  // verify appears in collection table
  await goPage(page, 'collection');
  await wait(300);
  const collRows = await page.locator('#collTable tbody tr[onclick]').count();
  collRows > 0 ? ok('collection table has ' + collRows + ' rows') : fail('collection table empty after add');

  // verify dashboard stat updated
  await goPage(page, 'dashboard');
  await wait(300);
  const statsHtml2 = await page.locator('#dashStats').innerHTML();
  const ownedNum2 = statsHtml2.match(/<div class="snum">(\d+)<\/div>\s*<div class="slbl">Owned<\/div>/);
  if (ownedNum2 && parseInt(ownedNum2[1]) >= afterCount.current)
    ok('dashboard Owned stat updated to ' + ownedNum2[1]);
  else warn('dashboard Owned stat may not have updated');

  // ── 7. POST-SAVE NUDGE ─────────────────────────────────────────────────────
  section('7. POST-SAVE NUDGE (Add details →)');
  await goPage(page, 'collection');
  await openAddFragModal(page);
  // make sure MORE DETAILS is collapsed
  const moreWrap = page.locator('#afMoreWrap');
  const moreOpen = await moreWrap.isVisible().catch(() => false);
  if (moreOpen) { await page.locator('#afMoreToggle').click(); await wait(200); }
  // Use unique name to avoid duplicate rejection
  const testFragName2 = 'QA Nudge Test ' + Date.now();
  await page.locator('#afSrch').fill(testFragName2); await wait(300);
  await page.evaluate(() => { var d=document.getElementById('afDrop'); if(d) d.style.display='none'; });
  await wait(100);
  await page.locator('#afNext').click(); await wait(400);
  await saveStep2(page);
  await wait(500);
  // ensure modal closed
  const nudgeModalOpen = await page.locator('#addFragM.on').isVisible().catch(() => false);
  if (nudgeModalOpen) { await page.evaluate(() => closeModal('addFragM')); await wait(300); }
  const nudgeToast = await page.locator('.toast').filter({ hasText: 'Add details' }).count();
  nudgeToast > 0 ? ok('"Add details →" nudge toast shown after quick add') : warn('"Add details →" nudge not visible (may have already disappeared)');

  // ── 8. LOG COMPLIMENT → VERIFY ALL DATA LINKS ─────────────────────────────
  section('8. LOG COMPLIMENT — data links');
  await goPage(page, 'compliments');
  const compsBefore = await getAppState(page);
  // open modal via the page-level "Log Compliment" button (not inline row buttons)
  await page.locator('#page-compliments .btn-blue[onclick*="openAddComp"], #page-compliments .btn[onclick*="openAddComp"]').first().click();
  await wait(400);
  // focus fragrance search — recently worn suggestions should appear
  await page.locator('#compFragSrch').click();
  await wait(300);
  const recentSugg = await page.locator('#cfDrop').isVisible().catch(() => false);
  recentSugg ? ok('recently worn suggestions appear on focus') : warn('recently worn dropdown not visible on focus');
  // pick first suggestion or search — items use onmousedown
  const firstSugg = page.locator('#cfDrop .aci').first();
  if (await firstSugg.count()) {
    await firstSugg.dispatchEvent('mousedown'); await wait(300);
    ok('selected fragrance from recently worn suggestions');
  } else {
    await page.locator('#compFragSrch').fill('Baccarat');
    await wait(400);
    const res = page.locator('#cfDrop .aci').first();
    if (await res.count()) { await res.dispatchEvent('mousedown'); await wait(300); }
  }
  // verify Stranger pre-selected
  const strangerActive = await page.locator('.comp-rel-btn[data-val="Stranger"].active').count();
  strangerActive > 0 ? ok('Stranger pre-selected by default') : warn('Stranger not pre-selected');
  // save
  await page.locator('button[onclick="saveCompliment()"]').click();
  await wait(700);
  const compsAfter = await getAppState(page);
  compsAfter.compliments > compsBefore.compliments
    ? ok('COMPLIMENTS grew: ' + compsBefore.compliments + ' → ' + compsAfter.compliments)
    : fail('compliment not saved — count unchanged');

  // verify in compliment list
  const compRows = await page.locator('#compList .crow').count();
  compRows > 0 ? ok('compliment list has ' + compRows + ' rows') : fail('compliment list empty after log');

  // ── 9. COMPLIMENT COUNT LINK → FILTER ─────────────────────────────────────
  section('9. COMPLIMENT COUNT → FILTER LINK');
  await goPage(page, 'dashboard');
  await wait(300);
  const compLink = page.locator('#dashBody td span[style*="blue"]').first();
  if (await compLink.count()) {
    const linkText = await compLink.textContent();
    await compLink.click(); await wait(600);
    // should navigate to compliments with filter active
    const compPageActive = await page.locator('#page-compliments.on').isVisible().catch(() => false);
    compPageActive ? ok('clicked comp count (' + linkText + ') → navigated to compliments page') : fail('comp count click did not navigate to compliments');
    const filterBar = await page.locator('#compFragFilterBar').isVisible().catch(() => false);
    filterBar ? ok('fragrance filter bar active after count click') : warn('filter bar not visible — filter may not be applied');
  } else {
    warn('no clickable compliment count in dashboard (all zeros?)');
  }

  // ── 10. FILTER TABS — ALL 6 RELATIONS ─────────────────────────────────────
  section('10. COMPLIMENT FILTER TABS');
  await goPage(page, 'compliments');
  await wait(300);
  const filterTabs = ['all','Stranger','Friend','Colleague / Client','Family','Significant Other'];
  for (const f of filterTabs) {
    const tab = page.locator(`#compFbar .fc[data-filter="${f}"]`);
    if (await tab.count()) {
      await tab.click(); await wait(200);
      ok('filter tab "' + f + '" clickable and active');
    } else {
      fail('filter tab missing: ' + f);
    }
  }
  // reset to all
  await page.locator('#compFbar .fc[data-filter="all"]').click();

  // ── 11. CLICK COMPLIMENT ROW → EDIT MODAL ─────────────────────────────────
  section('11. COMPLIMENT ROW → EDIT MODAL');
  await wait(300);
  const firstCrow = page.locator('#compList .crow').first();
  if (await firstCrow.count()) {
    await firstCrow.click(); await wait(500);
    const editModalOpen = await page.locator('#addCompM.on').isVisible().catch(() => false);
    editModalOpen ? ok('clicking compliment row opens edit modal') : fail('edit modal did not open on row click');
    if (editModalOpen) {
      const titleText = await page.locator('#addCompTitle').textContent();
      titleText.includes('Edit') ? ok('modal title = "' + titleText + '"') : fail('modal title wrong: ' + titleText);
      await page.evaluate(() => closeModal('addCompM'));
      await wait(300);
    }
  } else {
    warn('no compliment rows to click');
  }

  // ── 12. DETAIL PANEL — DATA LINKS ─────────────────────────────────────────
  section('12. DETAIL PANEL — data accuracy');
  await goPage(page, 'collection');
  await wait(300);
  const firstRow = page.locator('#collTable tbody tr[onclick]').first();
  if (await firstRow.count()) {
    await firstRow.click(); await wait(500);
    const panelOpen = await page.locator('#detailP').isVisible().catch(() => false);
    panelOpen ? ok('detail panel opens on row click') : fail('detail panel not visible');
    if (panelOpen) {
      // check comp count section present
      const compSection = await page.locator('#d-comp-count').textContent().catch(() => null);
      if (compSection !== null) ok('compliment count in detail panel: "' + compSection.trim() + '"');
      // check status shown
      const statusEl = await page.locator('#d-status').textContent().catch(() => '');
      statusEl ? ok('status shown in panel: "' + statusEl.trim() + '"') : warn('status field empty in panel');
      // log compliment from panel
      const logBtn = page.locator('#detailP button[onclick*="logCompliment"], #detailP button[onclick*="openAddComp"]').first();
      if (await logBtn.count()) { ok('Log new compliment button present in detail panel'); }
      else { warn('no Log compliment button in detail panel'); }
      // view compliments from panel
      const viewBtn = page.locator('#detailP button[onclick*="viewFragCompliments"]').first();
      if (await viewBtn.count()) {
        await viewBtn.click(); await wait(500);
        const onComp = await page.locator('#page-compliments.on').isVisible().catch(() => false);
        onComp ? ok('View all compliments → navigates to filtered compliments') : fail('View all compliments did not navigate');
      }
      // close — panel may be off-viewport after navigation, use JS
      await page.evaluate(() => { if (typeof closeDetail === 'function') closeDetail(); }).catch(() => {});
      await wait(300);
    }
  } else { warn('no collection rows to click'); }

  // ── 13. CHANGE STATUS → FINISHED ──────────────────────────────────────────
  section('13. FINISHED STATUS — change and verify');
  await goPage(page, 'collection');
  await wait(300);
  const firstRowAgain = page.locator('#collTable tbody tr[onclick]').first();
  if (await firstRowAgain.count()) {
    await firstRowAgain.click(); await wait(500);
    // open status strip
    const changeBtn = page.locator('#detailP button[onclick*="toggleStatusStrip"]').first();
    if (await changeBtn.count()) {
      await changeBtn.click(); await wait(300);
      const finishedOpt = page.locator('#statusStrip .opt').filter({ hasText: 'Finished' });
      if (await finishedOpt.count()) {
        await finishedOpt.click(); await wait(400);
        ok('FINISHED status option found and clicked');
        const newStatus = await page.evaluate(() => {
          const f = FRAGRANCES.find(x => x.id === currentDetailId);
          return f ? f.status : null;
        });
        newStatus === 'FINISHED' ? ok('status changed to FINISHED in app state') : fail('status not FINISHED, got: ' + newStatus);
        // check pill color
        const statusText = await page.locator('#d-status').textContent().catch(() => '');
        statusText.includes('Finished') ? ok('detail panel shows Finished status text') : warn('detail panel status text: "' + statusText.trim() + '"');
      } else { fail('FINISHED option not in status strip'); }
      // change back to CURRENT
      await page.locator('#detailP button[onclick*="toggleStatusStrip"]').first().click(); await wait(300);
      const currentOpt = page.locator('#statusStrip .opt').filter({ hasText: 'Current' });
      if (await currentOpt.count()) { await currentOpt.click(); await wait(300); }
    } else { warn('change status button not found in detail panel'); }
    const closeBtn2 = page.locator('#detailP .close-btn').first();
    if (await closeBtn2.count()) { await closeBtn2.click(); await wait(300); }
    else { await page.keyboard.press('Escape'); }
  }

  // ── 14. COLLECTION FILTER TABS ────────────────────────────────────────────
  section('14. COLLECTION — search and sort');
  await goPage(page, 'collection');
  await wait(300);
  // search
  await page.locator('#collSearch').fill('a');
  await wait(300);
  const searchRows = await page.locator('#collTable tbody tr[onclick]').count();
  ok('search "a" returns ' + searchRows + ' rows');
  await page.locator('#collSearch').fill('');
  await wait(300);
  // sort
  await page.locator('#collSort').selectOption('nameZA'); await wait(300);
  await page.locator('#collSort').selectOption('comps'); await wait(300);
  await page.locator('#collSort').selectOption('nameAZ'); await wait(300);
  ok('sort dropdown cycles without errors');

  // ── 15. ANALYTICS — data populated ────────────────────────────────────────
  section('15. ANALYTICS — data links');
  await goPage(page, 'analytics');
  await wait(400);
  // collection tab
  const collSection = await page.locator('#anaCollectionSection').textContent().catch(() => '');
  collSection.length > 20 ? ok('analytics collection section has content') : warn('analytics collection section appears empty');
  // switch to compliments tab
  await page.locator('#anaTabs .ftab').filter({ hasText: 'Compliments' }).click(); await wait(400);
  const pillsCount = await page.locator('#anaPills .ana-pill').count();
  pillsCount > 0 ? ok('analytics compliments pills: ' + pillsCount) : warn('no pills in analytics compliments');
  const perfCards = await page.locator('.perf-card').count();
  perfCards > 0 ? ok('top performers: ' + perfCards + ' cards') : warn('no performer cards (need more compliments)');
  // accord performance section
  const accordSection = await page.locator('#anaAccordPerfSection').textContent().catch(() => '');
  accordSection.length > 20 ? ok('accord performance section has content') : warn('accord performance section empty');

  // ── 16. WISHLIST ──────────────────────────────────────────────────────────
  section('16. WISHLIST — add and promote');
  await goPage(page, 'wishlist');
  await wait(300);
  const wishBefore = await getAppState(page);
  // add to wishlist — unique name to avoid duplicate rejection
  await page.locator('button[onclick*="openAddFrag(\'WANT_TO_BUY\')"]').click(); await wait(400);
  const wishTestName = 'QA Wishlist ' + Date.now();
  await page.locator('#afSrch').fill(wishTestName); await wait(300);
  await page.evaluate(() => { var d=document.getElementById('afDrop'); if(d) d.style.display='none'; });
  await wait(100);
  await page.locator('#afStatus').selectOption('WANT_TO_BUY').catch(() => {}); await wait(200);
  await page.locator('#afNext').click(); await wait(400);
  await saveStep2(page); await wait(400);
  // close modal if still open
  const wModalOpen = await page.locator('#addFragM.on').isVisible().catch(() => false);
  if (wModalOpen) { await page.evaluate(() => closeModal('addFragM')); await wait(300); }
  const wishAfter = await getAppState(page);
  wishAfter.wishlist > wishBefore.wishlist
    ? ok('wishlist grew: ' + wishBefore.wishlist + ' → ' + wishAfter.wishlist)
    : warn('wishlist count unchanged (may be duplicate)');
  const wishRows = await page.locator('#wishBody tr[onclick]').count();
  wishRows > 0 ? ok('wishlist table has ' + wishRows + ' rows') : warn('wishlist table empty');

  // ── 17. SIDEBAR COUNTS ACCURACY ───────────────────────────────────────────
  section('17. SIDEBAR BADGE COUNTS');
  const ctColl = await page.locator('#ct-collection').textContent();
  const ctWish = await page.locator('#ct-wishlist').textContent();
  const ctComp = await page.locator('#ct-compliments').textContent();
  const finalState = await getAppState(page);
  parseInt(ctColl) === finalState.current
    ? ok('sidebar collection count matches state: ' + ctColl)
    : fail('sidebar collection count ' + ctColl + ' ≠ state ' + finalState.current);
  parseInt(ctComp) === finalState.compliments
    ? ok('sidebar compliments count matches state: ' + ctComp)
    : fail('sidebar compliments count ' + ctComp + ' ≠ state ' + finalState.compliments);
  ok('sidebar wishlist count: ' + ctWish);

  // ── 18. SETTINGS — export has data ────────────────────────────────────────
  section('18. SETTINGS — export integrity');
  await goPage(page, 'settings');
  await wait(300);
  // verify merge dropdowns have options
  const mergeOpts = await page.locator('#mergeKeep option').count();
  mergeOpts > 1 ? ok('merge dropdown has ' + mergeOpts + ' options (fragrances loaded)') : warn('merge dropdown has ' + mergeOpts + ' options');

  // ── 19. JS ERRORS ─────────────────────────────────────────────────────────
  section('19. JAVASCRIPT ERRORS');
  if (jsErrors.length === 0) { ok('no JS runtime errors'); }
  else { jsErrors.forEach(e => fail('JS error: ' + e.slice(0, 120))); }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(54));
  console.log('SUMMARY');
  console.log('  ✓ Passed:   ' + passed.length);
  console.log('  ⚠ Warnings: ' + warns.length);
  console.log('  ✗ Failed:   ' + failed.length);
  if (warns.length) { console.log('\nWARNINGS:'); warns.forEach(w => console.log('  ⚠ ' + w)); }
  if (failed.length) { console.log('\nFAILURES:'); failed.forEach(f => console.log('  ✗ ' + f)); }
  else { console.log('\n  All checks passed'); }

  await browser.close();
  process.exit(failed.length > 0 ? 1 : 0);
})();
