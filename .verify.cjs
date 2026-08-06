const { chromium } = require("playwright");
const fs = require("fs");
const COOKIE = fs.readFileSync(".cookies.txt","utf8");
let session=null;
for(const line of COOKIE.split("\n")){ if(line.includes("rh_session")){ session = line.trim().split(/\s+/).pop(); break; } }

const testSizes = [
  {w:375, name:"phone"},
  {w:768, name:"tablet"},
  {w:1023, name:"tablet-edge"},
  {w:1280, name:"desktop"},
];

(async()=>{
  const browser = await chromium.launch();
  for(const {w,name} of testSizes){
    console.log(`\n=== ${name} (${w}px) ===`);
    const ctx = await browser.newContext({viewport:{width:w,height:900}});
    const page = await ctx.newPage();
    await ctx.addCookies([{name:"rh_session", value:session, domain:"localhost", path:"/", httpOnly:true, sameSite:"Strict"}]);
    await page.goto("http://localhost:3001/dashboard",{waitUntil:"networkidle"});
    await page.waitForTimeout(500);

    const hamburger = await page.$('button[aria-label="Open menu"]');
    const hamburgerVisible = hamburger ? await hamburger.isVisible() : false;
    console.log(`  hamburger visible: ${hamburgerVisible}`);

    if(name !== "desktop"){
      // Open drawer
      if(hamburger) await hamburger.click();
      await page.waitForTimeout(1000); // longer wait for transition

      // Check panel
      const panelInfo = await page.evaluate(()=>{
        const panel = document.querySelector('div[class*="translate-x-0"]');
        if(!panel) return null;
        const rect = panel.getBoundingClientRect();
        const aside = panel.querySelector('aside');
        const asideRect = aside ? aside.getBoundingClientRect() : null;
        return {panelRect:{w:rect.width,h:rect.height}, asideRect: asideRect?{w:asideRect.width,h:asideRect.height}:null};
      });
      console.log(`  panel: ${JSON.stringify(panelInfo)}`);

      // Test nav link click closes drawer - use page.click with selector
      try {
        await page.click('aside a[href="/assets"]', {timeout: 5000});
        await page.waitForTimeout(500);
        const panelStillOpen = await page.$('div[class*="translate-x-0"]');
        console.log(`  panel after nav click: ${panelStillOpen ? "STILL OPEN" : "closed"} ✅`);
      } catch(e) {
        console.log(`  nav click failed: ${e.message.split('\n')[0]}`);
      }

      // Re-open for logout test
      const hamburger2 = await page.$('button[aria-label="Open menu"]');
      if(hamburger2) await hamburger2.click();
      await page.waitForTimeout(800);

      // Test logout click closes drawer
      try {
        await page.click('aside button:last-of-type', {timeout: 5000});
        await page.waitForTimeout(500);
        const panelAfterLogout = await page.$('div[class*="translate-x-0"]');
        console.log(`  panel after logout click: ${panelAfterLogout ? "STILL OPEN ❌" : "closed"} ✅`);
      } catch(e) {
        console.log(`  logout click failed: ${e.message.split('\n')[0]}`);
      }

      await page.screenshot({path:`.shots/${name}-final.png`});
    } else {
      // Desktop: verify sidebar visible, hamburger hidden
      const desktopSidebar = await page.$('div[class*="lg:flex"] aside');
      const sidebarVisible = desktopSidebar ? await desktopSidebar.isVisible() : false;
      console.log(`  desktop sidebar visible: ${sidebarVisible}`);
      await page.screenshot({path:`.shots/${name}-final.png`});
    }

    await ctx.close();
  }
  await browser.close();
  console.log("\nDone. Check .shots/ for screenshots.");
})().catch(e=>{console.error(e);process.exit(1);});