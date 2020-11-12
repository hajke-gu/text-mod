const puppeteer = require("puppeteer");
var argv = require("minimist")(process.argv.slice(2));

/* main runner */
(async () => {
    /* start */
    var headless;

    if (argv.h) {
        // check if running headless
        headless = true;
    } else {
        headless = false;
    }
    const browser = await puppeteer.launch({
        headless: headless,
        defaultViewport: null,
        args: ["--disable-web-security"]
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

    /* setup of test environment */
    await login(page, username, password);
    await changeToEditMode(page);
    await openVisualizationMode(page);
    await connectToProjectServer(page);
    await uploadToLibrary(page);

    /* run test suite */
    await runTests(page);

    /* closedown */
    if (headless) {
        // cannot use pdf when not running true headless
        await page.pdf({ path: "result.pdf", landscape: true });

        // close browser
        await browser.close();
    }
})();

async function login(page, username, password) {
    /* login into spotfire */
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
}

async function changeToEditMode(page) {
    /* change to edit mode */
    await page.waitForSelector(".sfx_simple-dropdown_846");
    await page.click(".sfx_author-dropdown_463");
    await page.click("[title=Editing]");
    await new Promise((r) => setTimeout(r, 5000)); // wait for loading

    /* remove intro */
    await page.click("#id65");
}

async function openVisualizationMode(page) {
    /* create visualization mode */
    await page.click('.sfx_button_462[title~="Show"]');
    await page.click(".contextMenuItemLabel[title=Tools]");
    await page.click(".contextMenuItemLabel[title~=Development]");
    await page.click(".contextMenuItemLabel[title~=Create]");
    await new Promise((r) => setTimeout(r, 5000)); // wait for loading
}

async function connectToProjectServer(page) {
    /* connect to project */
    await page.click("div[title~=Connect]");
    await new Promise((r) => setTimeout(r, 5000)); // wait for loading

    const els = await page.$$(".sfx_button_507");
    await els[1].click();
    await new Promise((r) => setTimeout(r, 5000)); // wait for loading

    const arr = await page.$$(".sfx_button_507");
    await arr[1].click();
    await new Promise((r) => setTimeout(r, 5000)); // wait for loading
}

async function uploadToLibrary(page) {
    /* upload server mod to library */
    await new Promise((r) => setTimeout(r, 3000)); // wait for loading
    await page.$$eval(".sfx_button-text_518", (elements) =>
        elements.forEach((el) => {
            if (el.textContent.includes("Disconnect")) {
                el.click();
            }
        })
    );
    //await page.pdf({ path: "result.pdf", landscape: true });
    await new Promise((r) => setTimeout(r, 6000)); // wait for loading

    await page.$$eval(".sfx_button_507", (elements) =>
        elements.forEach((el) => {
            if (el.textContent.includes("Save")) {
                el.click();
            }
        })
    );
    await new Promise((r) => setTimeout(r, 6000)); // wait for loading
    await page.click('[title~="Spotfire"]');
    await new Promise((r) => setTimeout(r, 3000)); // wait for loading
    await page.click('div[title~="Text-Mod"]');
    await new Promise((r) => setTimeout(r, 3000)); // wait for loading
    await page.click('div[title~="Beta"]');
    await new Promise((r) => setTimeout(r, 3000)); // wait for loading
    await page.click('button[title~="Save"]');
    await new Promise((r) => setTimeout(r, 3000)); // wait for loading
    await page.click("div.footer-button-group > button:nth-child(1)");
    await new Promise((r) => setTimeout(r, 5000)); // wait for loading
}

async function runTests(page) {
    // all tests placed in here and validate here
    var results = new Array();
    var result;

    //test1
    result = await test1(page);
    results.push(result);

    //test2
    //result = await test2(page);
    //results.push(result);
}

/* AC The text visualization should only display a subset of the data at a time */
async function test1(page) {
    var result = false;

    // get number of rows in dataset
    const element = await page.$(".sfx_label_217");
    const text = await page.evaluate((element) => element.textContent, element);
    var dataset = text.substr(0, text.indexOf(" "));
    dataset = dataset.replace(",", "");

    // get all textcards rendered
    const amountOfTextCards = await page.evaluate(() => {
        // access iFrame
        const iframe = document.querySelector("iframe.sfx_frame_1046");

        // grab iframe's document object
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        return iframeDoc.querySelectorAll("div#text-card").length;
    });

    // compare dataset
    if (dataset > amountOfTextCards) {
        result = true;
    }

    return result;
}

/* AC It must be possible to copy the entire or a selected subset of the text to the clipboard. */
async function test2(page) {
    var result = false;

    const res = await page.evaluate((page) => {
        // access iFrame
        const iframe = document.querySelector("iframe.sfx_frame_1046");

        // grab iframe's document object
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        // get first text card
        const el = iframeDoc.querySelector("div#text-card");

        el.click();

        // click text card
        iframeDoc.querySelector("svg").click();

        return el.textContent;
    });

    return result;
}
