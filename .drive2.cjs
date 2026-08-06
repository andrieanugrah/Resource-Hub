const { chromium } = require("playwright");
const fs = require("fs");
const COOKIE = fs.readFileSync(".cookies.txt","utf8");
let session=null;
for(const line of COOKIE.split("\n")){ if(line.includes("rh_session")){ session = line.trim().split(/\s+/).pop(); break; } }
console.log("session:", session);

(async()=>{
  const browser = await chromium.launch();
  const probe = async (w, name) => {
    const ctx = await browser.newContext({viewport:{width:w,height:900}});
    const page = await ctx.newPage();
    const ck = ["console","pageerror","requestfailed"].map(t=>page.on(t, m=>console.log(`[${name}] ${t}:`, m?.message||m?.url||m)));
    await ctx.addCookies([{name:"rh_session", value:session, domain:"localhost", path:"/", httpOnly:true, sameSite:"Strict"}]);
    await page.setViewportSize({width:w,height:900});
    await page.goto("http://localhost:3001/dashboard",{waitUntil:"networkidle"});
    await page.waitForTimeout(600);
    const hamburger = await page.$('button[aria-label="Open menu"]');
    console.log(`\n=== ${name} w=${w} hamburger present:`, !!hamburger);
    // layout probe
    const probe = await page.evaluate(()=>{
      const out={};
      const ds=document.querySelector('div[class*="lg:flex"]');
      out.desktopSidebarVisible = ds ? getComputedStyle(ds).display!=="none" : "no-desktop-div";
      const topbar=document.querySelector('header');
      out.topbarRect = topbar? JSON.stringify(topbar.getBoundingClientRect()):null;
      out.bodyOverflow=document.body.style.overflow;
      out.viewport={w:innerWidth,h:innerHeight};
      return out;
    });
    console.log(JSON.stringify(probe,null,2));
    await page.screenshot({path:`.shots/${name}.png`});
    if(hamburger){
      await hamburger.click();
      await page.waitForTimeout(700);
      const after = await page.evaluate(()=>{
        const out={};
        const panel=document.querySelector('div.fixed.inset-y-0.left-0');
        out.panel = panel? {rect:JSON.stringify(panel.getBoundingClientRect()), x: getComputedStyle(panel).transform} : null;
        const backdrop=document.querySelector('div.fixed.inset-0');
        out.backdrop = backdrop? JSON.stringify(backdrop.getBoundingClientRect()):null;
        const aside=document.querySelector('aside');
        out.asideRect = aside? JSON.stringify(aside.getBoundingClientRect()):null;
        const nav=document.querySelector('nav');
        out.navScroll = nav? {clientHeight:nav.clientHeight, scrollHeight:nav.scrollHeight, overflow:getComputedStyle(nav).overflowY} : null;
        out.bodyOverflow=document.body.style.overflow;
        return out;
      });
      console.log("OPEN state:", JSON.stringify(after,null,2));
      await page.screenshot({path:`.shots/${name}-open.png`});
      // click a nav link inside aside - check close behaviour
      const links=await page.$$('aside a');
      console.log("aside links found:", links.length);
    }
    await ctx.close();
  };
  fs.mkdirSync(".shots",{recursive:true});
  await probe(375,"phone");
  await probe(768,"tablet");
  await probe(1023,"tablet-edge");
  await probe(1280,"desktop");
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});