const { chromium } = require("playwright");

const COOKIE = require("fs").readFileSync(".cookies.txt","utf8");
// parse rh_session
let session=null;
for(const line of COOKIE.split("\n")){
  if(line.includes("rh_session")){ const f=line.trim().split(/\s+/); session = f[f.length-1]; break; }
}
console.log("session:", session);

(async()=>{
  const browser = await chromium.launch();
  const screenshot = async (ctx, name) => {
    const page = await ctx.newPage();
    const cookies = [{name:"rh_session", value:session, domain:"localhost", path:"/", httpOnly:true, sameSite:"Strict"}];
    await ctx.addCookies(cookies);
    await page.goto("http://localhost:3001/dashboard", {waitUntil:"networkidle"});
    await page.waitForTimeout(800);
    await page.setViewportSize({width: ctx._w, height: 900});
    await page.screenshot({path:`.shots/${name}.png`, fullPage:false});
    return page;
  };

  require("fs").mkdirSync(".shots", {recursive:true});

  // phone 375
  const p1 = await browser.newContext({viewport:{width:375,height:900}});
  p1._w=375;
  const pg1 = await screenshot(p1, "phone-375-closed");
  // open drawer
  await pg1.click('button[aria-label="Open menu"]').catch(e=>console.log("no hamburger:",e.message));
  await pg1.waitForTimeout(600);
  await pg1.screenshot({path:`.shots/phone-375-open.png`});

  // tablet 768
  const p2 = await browser.newContext({viewport:{width:768,height:900}});
  p2._w=768;
  const pg2 = await screenshot(p2, "tablet-768");
  await pg2.click('button[aria-label="Open menu"]').catch(e=>console.log("no hamburger 768:",e.message));
  await pg2.waitForTimeout(600);
  await pg2.screenshot({path:`.shots/tablet-768-open.png`});

  // tablet 1023 (just below lg)
  const p3 = await browser.newContext({viewport:{width:1023,height:900}});
  p3._w=1023;
  const pg3 = await screenshot(p3, "tablet-1023");
  await pg3.click('button[aria-label="Open menu"]').catch(e=>console.log("no hamburger 1023:",e.message));
  await pg3.waitForTimeout(600);
  await pg3.screenshot({path:`.shots/tablet-1023-open.png`});

  // desktop 1280
  const p4 = await browser.newContext({viewport:{width:1280,height:900}});
  p4._w=1280;
  const pg4 = await screenshot(p4, "desktop-1280");

  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});