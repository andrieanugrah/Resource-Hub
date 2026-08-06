const { chromium } = require("playwright");
const fs = require("fs");
const COOKIE = fs.readFileSync(".cookies.txt","utf8");
let session=null;
for(const line of COOKIE.split("\n")){ if(line.includes("rh_session")){ session = line.trim().split(/\s+/).pop(); break; } }
console.log("session:", session);

(async()=>{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport:{width:375,height:900}});
  const page = await ctx.newPage();
  await ctx.addCookies([{name:"rh_session", value:session, domain:"localhost", path:"/", httpOnly:true, sameSite:"Strict"}]);
  await page.goto("http://localhost:3001/dashboard",{waitUntil:"networkidle"});
  await page.waitForTimeout(600);

  // Click hamburger
  const hamburger = await page.$('button[aria-label="Open menu"]');
  console.log("hamburger found:", !!hamburger);
  if(!hamburger){ console.log("No hamburger found, exiting"); await browser.close(); return; }
  await hamburger.click();
  await page.waitForTimeout(800);

  // Find all divs with translate-x-0 (open panel)
  const panels = await page.evaluate(()=>{
    const divs = document.querySelectorAll('div[class*="translate-x-0"]');
    return Array.from(divs).map((d,i)=>{
      const rect = d.getBoundingClientRect();
      return {idx:i, rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}, children: d.querySelectorAll('div').length};
    });
  });
  console.log("panels with translate-x-0:", JSON.stringify(panels));

  // Find all aside elements
  const asides = await page.evaluate(()=>{
    const all = document.querySelectorAll('aside');
    return Array.from(all).map((a,i)=>{
      const rect = a.getBoundingClientRect();
      const computed = getComputedStyle(a);
      return {
        idx: i,
        rect: {x:rect.x,y:rect.y,width:rect.width,height:rect.height},
        display: computed.display,
        height: computed.height,
        parent: a.parentElement?.tagName,
        parentHeight: a.parentElement?.getBoundingClientRect().height
      };
    });
  });
  console.log("all asides:", JSON.stringify(asides));

  // Take screenshot
  await page.screenshot({path:`.shots/debug-phone.png`, fullPage:true});
  console.log("screenshot saved to .shots/debug-phone.png");

  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});