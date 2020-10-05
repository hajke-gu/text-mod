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

        //console.log("Data View exp: " + (await dataView.hasExpired()));
        /**
         * Get rows from dataView
         */
        const rows = await dataView.allRows();
        if (rows == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }

        let textCardHeight = "fit-content";
        let textCardWidth = windowSize.width * 0.5 + "px";
        let textCardPadding = "1%";
        let textCardMargin = "1%";
        let textCardBackgroundColor = rows[0].color().hexCode;

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
        prevIndex = returnedObject.prevIndex;
        /*          * Scroll Event Listener          */
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
                prevIndex = returnedObject.prevIndex;
            }
        });

        /*
        var modContainer = document.getElementById("mod-container");
        modContainer.onclick = () => {
            dataView.clearMarking();
        };
        */

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
function createDiv(className, content, height, width, padding, margin, colour, annotation) {
    var textCardDiv = document.createElement("div");
    textCardDiv.style.height = height;
    textCardDiv.style.width = width;
    textCardDiv.style.padding = padding;
    textCardDiv.style.margin = margin;
    textCardDiv.style.float = "left";
    textCardDiv.style.flex = "1 1 35%";

    //console.log(annotation);
    if (annotation !== null) {
        var annotationDiv = document.createElement("div");
        annotationDiv.textContent = annotation;
        annotationDiv.style.padding = "inherit";

        annotationDiv.style.backgroundColor = colour;

        textCardDiv.appendChild(annotationDiv);
    }
    textCardDiv.classList.add(className);
    if (typeof content === "string") {
        var contentDiv = document.createElement("div");
        contentDiv.style.padding = "inherit";
        contentDiv.style.backgroundColor = colour;
        contentDiv.style.opacity = "0.9";
        contentDiv.textContent = content;

        textCardDiv.appendChild(contentDiv);

        //console.log("inside === string");
    }

    return textCardDiv;
}

function renderTextCards(rows, height, width, padding, margin, colour, prevIndex, cardsToLoad) {
    document.querySelector("#text-card-container").innerHTML = ""; //Remove this to not reload everytime
    var fragment = document.createDocumentFragment();
    var whatToLoad = prevIndex + cardsToLoad;
    // Set index to prev index to not reload everytime

    for (let index = 0; index < whatToLoad; index++) {
        if (index == rows.length + 1) {
            break;
        }
        colour = rows[index].color().hexCode;
        let textCardContent = rows[index].categorical("Content").value()[0].key.toString();
        var truncatedTextCardContent = truncateString(textCardContent, 125);
        var annotation = rows[index].categorical("Annotation").value()[0].key.toString();
        let newDiv = createDiv(
            "text-card",
            truncatedTextCardContent,
            height,
            width,
            padding,
            margin,
            colour,
            annotation
        );
        newDiv.onclick = (e) => {
            console.log(newDiv.textContent);
            rows[index].mark();
        };
        newDiv.onmouseover = (e) => {
            newDiv.style.border = "solid";
        };
        fragment.appendChild(newDiv);
    }
    prevIndex = prevIndex + cardsToLoad;
    var returnObject = { fragment, prevIndex };
    return returnObject;
}

function getTextCardContent(element) {
    //console.log(element);
    let textCardContent = element.categorical("Review Text").value()[0].key;
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

function truncateString(str, num) {
    // If the length of str is less than or equal to num
    // just return str--don't truncate it.
    if (str.length <= num) {
        return str;
    }
    // Return str truncated with '...' concatenated to the end of str.
    return str.slice(0, num) + "...";
}
