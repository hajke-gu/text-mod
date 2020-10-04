/*
 * Copyright © 2020. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

//@ts-check - Get type warnings from the TypeScript language server. Remove if not wanted.

/**
 * Get access to the Spotfire Mod API by providing a callback to the initialize method.
 * @param {Spotfire.Mod} mod - mod api
 */
Spotfire.initialize(async (mod) => {
    /**
     * Create the read function.
     */
    const reader = mod.createReader(mod.visualization.data(), mod.windowSize(), mod.property("myProperty"));

    const modDiv = findElem("#text-card-container")
    /**
     * Store the context.
     */
    const context = mod.getRenderContext();
    /**
     * Initiate the read loop
     */
    reader.subscribe(render);

    /**
     * @param {Spotfire.DataView} dataView
     * @param {Spotfire.Size} windowSize
     * @param {Spotfire.ModProperty<string>} prop
     */
    async function render(dataView, windowSize, prop) {
        /**
         * Check the data view for errors
         */
        let errors = await dataView.getErrors();
        if (errors.length > 0) {
            // Showing an error overlay will hide the mod iframe.
            // Clear the mod content here to avoid flickering effect of
            // an old configuration when next valid data view is received.
            mod.controls.errorOverlay.show(errors);
            return;
        }
        mod.controls.errorOverlay.hide();

        modDiv.style.height = windowSize.height + "px";

        /**
         * Get rows from dataView
         */
        const rows = await dataView.allRows();
        if (rows == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }
        //window.addEventListener("resize", )
        //rows.forEach(row => {
        let reviewTextString = rows[0].categorical("Review Text").value()[0].key.toString()
        //console.log(row.categorical("Title").value()[0].key)

        //})
        //let reviewTextAsString = rows[0].categorical("Review text").value()[0].key.toString()
        //let newDiv = createDiv("text-card", reviewTextString);
        let textCardHeight = "wrap-content";
        let textCardWidth = "50%";
        let textCardPadding = "2%"
        let textCardMargin = "2%"
        let textCardBackgroundColor = rows[0].color().hexCode;
        //document.body.appendChild(newDiv)
        /**
         * Print out to document
         */
        const container = document.querySelector("#mod-container");
        container.textContent = `windowSize: ${windowSize.width}x${windowSize.height}\r\n`;
        container.textContent += `should render: ${rows.length} rows\r\n`;
        container.textContent += `${prop.name}: ${prop.value()}`;
        modDiv.appendChild(renderTextCards(rows, textCardHeight, textCardWidth, textCardPadding, textCardMargin, textCardBackgroundColor));

        /**
         * Signal that the mod is ready for export.
         */
        context.signalRenderComplete();
    }
});

/**
 * Create a div element.
 * @param {string} className class name of the div element.
 * @param {string | HTMLElement} [content] Content inside the div
 */
function createDiv(className, content, height, width, padding, margin, colour) {
    let elem = document.createElement("div");
    elem.classList.add(className);
    if (typeof content === "string") {
        elem.style.height = height;
        elem.style.width = width;
        elem.style.padding = padding;
        elem.style.margin = margin;

        elem.style.backgroundColor = colour;
        elem.appendChild(document.createTextNode(content));
        console.log("inside === string")
    } else if (content) {
        elem.style.height = height;
        elem.style.width = width;
        elem.style.padding = padding;
        elem.style.color = colour;
        elem.appendChild(content);
    }


    return elem;
}

function renderTextCards(rows, height, width, padding, margin, colour) {

    document.querySelector("#text-card-container").innerHTML = "";
    let fragment = document.createDocumentFragment();

    for (let index = 0; index < 10; index++) {

        let textCardContent = rows[index].categorical("Review Text").value()[0].key.toString();

        let newDiv = createDiv("text-card", textCardContent, height, width, padding, margin, colour);
        newDiv.onclick = (e) => {
            console.log(newDiv.textContent)
            rows.forEach((element) => element.mark("Toggle")

            );

        }
        fragment.appendChild(newDiv);

    }

    return fragment;
}

/** @returns {HTMLElement} */
function findElem(selector) {
    return document.querySelector(selector);
}

function sayHello() {
    console.log("hello")
}