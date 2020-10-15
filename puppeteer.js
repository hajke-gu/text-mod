const puppeteer = require("puppeteer");
var argv = require("minimist")(process.argv.slice(2));

(async () => {
    /* setup */
    var headless;

    if (argv.h) {
        // check if running headless
        headless = true;
    } else {
        headless = false;
    }
    const browser = await puppeteer.launch({ headless: headless, defaultViewport: null });
    const page = await browser.newPage();
    var username;
    var password;

    if (argv.u) {
        username = argv.u;
    } else {
        console.log("No username (-u) specified. Will terminate script.");
        process.exit(1);
    }

    if (argv.p) {
        password = argv.p;
    } else {
        console.log("No password (-p) specified. Will terminate script.");
        process.exit(1);
    }

    /* login */
    await page.goto("https://labs.spotfire-cloud.com/spotfire/login.html#/", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000)); // wait for loading
    await page.type("[name=username]", username);
    await page.type("[name=password]", password);
    await page.click(".LoginButton");
    await page.waitForSelector(".tss-box");
    await page.goto(
        "https://labs.spotfire-cloud.com/spotfire/wp/analysis?file=/Introduction%20to%20Spotfire&waid=53NKCHqQxUClRs2fKQxX4-290723e75ex28L&wavid=0",
        { waitUntil: "networkidle2" }
    );
    await new Promise((r) => setTimeout(r, 5000)); // wait for loading

    /* change to edit mode */
    await page.waitForSelector(".sfx_simple-dropdown_846");
    await page.click(".sfx_author-dropdown_463");
    await page.click("[title=Editing]");
    await new Promise((r) => setTimeout(r, 5000)); // wait for loading

    /* remove intro */
    await page.click("#id65");

    /* create visualization mode */
    await page.click(".sfx_button_462");
    await page.click(".contextMenuItemLabel[title=Tools]");
    await page.click(".contextMenuItemLabel[title=Development]");
    await page.$$eval(".contextMenuItemLabel", (elements) =>
        elements.forEach((el) => {
            if (el.textContent.includes("Create")) {
                el.click();
            }
        })
    );
    await new Promise((r) => setTimeout(r, 5000)); // wait for loading

    /* connect to project */
    await page.click(".sfx_button_507");
    await new Promise((r) => setTimeout(r, 4000)); // wait for loading
    await page.$$eval(".sfx_button_507", (elements) =>
        elements.forEach((el) => {
            if (el.textContent.includes("Development")) {
                el.click();
            }
        })
    );
    await new Promise((r) => setTimeout(r, 4000)); // wait for loading
    await page.$$eval(".sfx_button_507", (elements) =>
        elements.forEach((el) => {
            if (el.textContent.includes("Connect")) {
                el.click();
            }
        })
    );
    await new Promise((r) => setTimeout(r, 4000)); // wait for loading

    /* show results */
    if (headless) {
        // cannot use pdf when not running true headless
        await page.pdf({ path: "result.pdf", format: "A4" });
    }

    // continue here with tests

    await browser.close();
})();
