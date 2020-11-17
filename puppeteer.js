//@ts-check
const puppeteer = require("puppeteer");
/** @type {any} */
const assert = require("assert");
const { waitForDebugger } = require("inspector");
var argv = require("minimist")(process.argv.slice(2));
var ncp = require("copy-paste");

(async () => {
    try {
        /* setup */
        var headless = !!argv.h;

        const browser = await puppeteer.launch({
            headless: headless,
            env: {
                webSecurityEnabled: "false"
            },
            defaultViewport: null,
            // This allows for inspection of iframes from other origins, e.g sandboxed.
            args: ["--disable-features=site-per-process"]
        });

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

        /* main runner */
        await login(page, username, password);
        await changeToEditMode(page);
        await connectToServer(page);

        /* run test suite */
        await runTests(page);

        /* show results */
        if (headless) {
            // cannot use pdf when not running true headless
            await browser.close();
        }
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
})();

async function login(page, username, password) {
    /* login into spotfire */
    await page.goto("https://labs.spotfire-cloud.com/spotfire/login.html#/", { waitUntil: "networkidle2" });
    await page.type("[name=username]", username);
    await page.type("[name=password]", password);
    await page.click(".LoginButton");
    await page.waitForSelector(".tss-box");
    await page.goto("https://labs.spotfire-cloud.com/spotfire/wp/analysis?file=/Introduction%20to%20Spotfire", {
        waitUntil: "networkidle2"
    });
}

async function changeToEditMode(page) {
    /* change to edit mode */
    await page.waitForSelector(sfx("simple-dropdown"), { visible: true });
    await clickSelectorWithText(page, sfx("author-dropdown"), "Viewing");
    await clickSelectorWithText(page, "[title=Editing]", "Editing");
}

async function connectToServer(page) {
    /* connect to local running server */
    await selectorWithText(page, sfx("left-bar-visible"), ""); // The left menu is visible when the document enter editing mode.
    await page.click('[id*="Spotfire.Find"]'); // Strange selector because '.' not a valid id selector.
    await page.keyboard.type("new page");
    await (await page.waitForSelector(sfx("result-content"))).click();
    await selectorWithText(page, sfx("title"), "Start from visualizations");
    await page.click('[id*="Spotfire.Find"]'); // Strange selector because '.' not a valid id selector.
    await page.keyboard.type("Dev mod");
    await (await page.waitForSelector(sfx("result-content"))).click();
    await page.waitForSelector(sfx("instructions-column"));
    await clickSelectorWithText(page, sfx("button-text"), "Connect to project");
    await page.waitForSelector(sfx("instruction"));
    await clickSelectorWithText(page, sfx("popout") + " " + sfx("button-text"), "Development server");
    await clickSelectorWithText(page, sfx("popout") + " " + sfx("button-text"), "Connect");
    await clickSelectorWithText(page, sfx("popout") + " " + sfx("button-text"), "Disconnect");
    await page.keyboard.press("Escape");
}

async function runTests(page) {
    // all tests placed in here and validate here
    var results = new Array();
    var result;

    // test1
    result = await test1(page);
    results.push(result);

    // test2
    result = await test2(page);
    results.push(result);

    // verify results
    if (results.includes(false)) {
        console.log("Tests unsuccessful.");
        //process.exit(1);
    } else {
        console.log("Tests succesful.");
    }
}

/* AC The text visualization should only display a subset of the data at a time */
async function test1(page) {
    var result = false;

    // wait for render
    await page.waitFor(5000);

    // get number of rows in dataset
    const element = await page.$(".sfx_label_217");
    const text = await page.evaluate((element) => element.textContent, element);
    var dataset = text.substr(0, text.indexOf(" "));
    dataset = dataset.replace(",", "");

    // access iFrame
    let frame = await page.waitForSelector("iframe" + sfx("frame"));
    let content = await frame.contentFrame();

    // get number of text cards
    const numberOfTextCards = await content.$$eval("div#text-card", (divs) => divs.length);

    // comparison
    if (dataset > numberOfTextCards) {
        result = true;
    }

    return result;
}

/* AC It must be possible to copy the entire or a selected subset of the text to the clipboard. */
async function test2(page) {
    var result = false;

    // wait for render
    await page.waitFor(5000);

    // access iFrame
    let frame = await page.waitForSelector("iframe" + sfx("frame"));
    let content = await frame.contentFrame();

    // get first text card
    await content.hover("div#text-card");
    await content.waitForSelector("div#text-card svg");
    await page.waitFor(5000); // required
    await content.click("div#text-card svg");

    // get text from clipboard
    const text = ncp.paste();

    // compare
    if (text === "East Asia & Pacific") {
        result = true;
    }

    return result;
}

/**
 * Find an element with an sfx prefix. The number will change and can't be used.
 * @param {string} name
 */
function sfx(name) {
    return '[class*="sfx_' + name + '_"]';
}

/**
 * Sleep for a while
 * @param {number} ms - Number of milliseconds to sleep
 */
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/**
 *
 * @param {import("puppeteer").Page} page
 * @param {*} selector
 * @param {*} includedText
 */
async function selectorWithText(page, selector, includedText) {
    let timeout = Date.now() + 10000;
    while (Date.now() < timeout) {
        const links = await page.$$(selector);
        for (var i = 0; i < links.length; i++) {
            let elem = links[i];
            let valueHandle = await elem.getProperty("textContent");
            let linkText = await valueHandle.jsonValue();
            if (linkText.includes(includedText)) {
                let visible = await page.evaluate((e) => e.offsetWidth > 0 && e.offsetHeight > 0, links[0]);
                if (visible && (await elem.isIntersectingViewport())) {
                    return elem;
                }
            }
        }

        await sleep(50);
    }
}

async function clickSelectorWithText(page, selector, includedText) {
    let elem = await selectorWithText(page, selector, includedText);
    await elem.click();
}
