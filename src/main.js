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

    const modDiv = findElem("#text-card-container");
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
        /*
         * NON-GLOBALS
         */
        var prevIndex = 0;
        const cardsToLoad = 15;

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
        let reviewTextString = rows[0].categorical("Review Text").value()[0].key.toString();
        //console.log(row.categorical("Title").value()[0].key)

        //})
        //let reviewTextAsString = rows[0].categorical("Review text").value()[0].key.toString()
        //let newDiv = createDiv("text-card", reviewTextString);
        let textCardHeight = "wrap-content";
        let textCardWidth = "50%";
        let textCardPadding = "2%";
        let textCardMargin = "2%";
        let textCardBackgroundColor = rows[0].color().hexCode;

        //document.body.appendChild(newDiv)
        /**
         * Print out to document
         */
        var returnedObject = renderTextCards(
            rows,
            textCardHeight,
            textCardWidth,
            textCardPadding,
            textCardMargin,
            textCardBackgroundColor,
            prevIndex,
            cardsToLoad
        );
        modDiv.appendChild(returnedObject.fragment);
        prevIndex = returnedObject.index;

        /*
         * Scroll Event Listener
         */
        modDiv.addEventListener("scroll", function (e) {
            if (modDiv.scrollHeight - modDiv.scrollTop <= modDiv.clientHeight + 1) {
                var returnedObject = renderTextCards(
                    rows,
                    textCardHeight,
                    textCardWidth,
                    textCardPadding,
                    textCardMargin,
                    textCardBackgroundColor,
                    prevIndex,
                    cardsToLoad
                );
                modDiv.appendChild(returnedObject.fragment);
                prevIndex = returnedObject.index;
            }
        });

        var x = document.getElementById("mod-container");
        x.onclick = () => {
            dataView.clearMarking();
        }

        /**
         * Signal that the mod is ready for export.
         */
        context.signalRenderComplete();
    }
});

/**
 * Create a div element.
 * @param {string} className class name of the div element.
 * @param {string | HTMLElement} content Content inside the div
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
    } else if (content) {
        elem.style.height = height;
        elem.style.width = width;
        elem.style.padding = padding;
        elem.style.color = colour;
        elem.appendChild(content);
    }

    return elem;
}

function renderTextCards(rows, height, width, padding, margin, colour, prevIndex, cardsToLoad) {
    document.querySelector("#text-card-container").innerHTML = "";
    var fragment = document.createDocumentFragment();
    var textCardContent = null;
    var whatToLoad = prevIndex + cardsToLoad;

    for (let index = 0; index < whatToLoad; index++) {
        if (index == rows.length + 1) { break }
        console.log(index);
        colour = rows[index].color().hexCode;
        textCardContent = getTextCardContent(rows[index]);

        let newDiv = createDiv("text-card", textCardContent, height, width, padding, margin, colour);
        newDiv.onclick = (e) => {
            console.log(newDiv.textContent);
            rows[index].mark();
        };
        fragment.appendChild(newDiv);
    }
    prevIndex = prevIndex + cardsToLoad;
    var returnObject = { fragment, prevIndex };
    return returnObject;
}

function getTextCardContent(element) {
    var textCardContent = element.categorical("Review Text").value()[0].key;
    if (textCardContent != null) {
        textCardContent = textCardContent.toString();
    } else {
        textCardContent = "Something went wrong while fetching the data";
    }
    return textCardContent;
}

/** @returns {HTMLElement} */
function findElem(selector) {
    return document.querySelector(selector);
}

function sayHello() {
    console.log("hello");
}
