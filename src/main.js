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
    var prevIndex = 0;
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

        const cardsToLoad = 100;

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
        var rows = await dataView.allRows();

        if (rows == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }

        if ((await dataView.categoricalAxis("Sorting")) != null) {
            rows.sort(function (a, b) {
                var sortValueA = a.categorical("Sorting").value()[0].key;
                var sortValueB = b.categorical("Sorting").value()[0].key;

                if (sortValueA < sortValueB) return 1;

                if (sortValueA > sortValueB) return -1;

                return 0;
            });
        }

        let textCardHeight = "fit-content";
        let textCardWidth = windowSize.width * 0.5 + "px";
        let textCardPadding = "0.5%";
        let textCardMargin = "0";
        var rerender = true;

        var returnedObject = renderTextCards(
            rows,
            prevIndex, // When rerendering we always want to render everything
            cardsToLoad,
            rerender
        );
        modDiv.appendChild(returnedObject.fragment);
        prevIndex = returnedObject.startIndex;

        /*          * De-mark on click on something that isn't text card *   */

        var modContainer = document.getElementById("text-card-container");
        modContainer.onclick = () => {
            dataView.clearMarking();
        };

        /*          * Scroll Event Listener          */
        modDiv.addEventListener("scroll", async function (e) {
            if (modDiv.scrollHeight - modDiv.scrollTop <= modDiv.clientHeight + 1) {
                //Check if old data view
                if (await dataView.hasExpired()) {
                    return;
                }
                var rerender = false;

                var returnedObject = renderTextCards(rows, prevIndex, cardsToLoad, rerender);
                modDiv.appendChild(returnedObject.fragment);
                prevIndex = returnedObject.startIndex;
            }
        });

        /**
         * Signal that the mod is ready for export.
         */
        context.signalRenderComplete();
    }
});

/**
 * Create a div element.
 * @param {string | HTMLElement} content Content inside the div
 */
function createTextCard(content, colour, annotation) {
    //create textCard
    var textCardDiv = document.createElement("div");
    textCardDiv.setAttribute("id", "text-card");

    //add sidebar to text card
    var sidebar = document.createElement("div");
    sidebar.setAttribute("id", "text-card-sidebar");
    sidebar.style.backgroundColor = colour;

    textCardDiv.appendChild(sidebar);

    //add annotation to text card
    if (annotation !== null) {
        var header = document.createElement("h4");
        header.textContent = annotation;
        //header.style.backgroundColor = colour;

        textCardDiv.appendChild(header);
    }

    //add paragraph to text card
    if (typeof content === "string") {
        var contentParagraph = document.createElement("p");
        contentParagraph.setAttribute("id", "text-card-paragraph");
        contentParagraph.textContent = content;

        textCardDiv.appendChild(contentParagraph);
    }

    return textCardDiv;
}

function renderTextCards(rows, prevIndex, cardsToLoad, rerender) {
    if (rerender) {
        document.querySelector("#text-card-container").innerHTML = "";
    }
    var fragment = document.createDocumentFragment();

    var whatToLoad = prevIndex + cardsToLoad;
    var startIndex = prevIndex;
    if (rerender) {
        whatToLoad = prevIndex;
        startIndex = 0;
        if (prevIndex == 0) {
            whatToLoad = cardsToLoad;
        }
    }
    for (let index = startIndex; index < whatToLoad; index++) {
        // console.log("Rows: " + rows.length)
        if (index >= rows.length) {
            break;
        }
        let textCardContent = getDataValue(rows[index], "Content");
        // textCard not NULL or UNDEFINED
        if (textCardContent) {
            var annotation = getDataValue(rows[index], "Annotation");
            var color = rows[index].color().hexCode;
            let newDiv = createTextCard(textCardContent, color, annotation);
            newDiv.onclick = (e) => {
                e.stopPropagation();
                rows[index].mark("Toggle");
            };
            newDiv.onmouseover = (e) => {
                newDiv.style.color = "black";
            };
            newDiv.onmouseout = (e) => {
                newDiv.style.color = "";
            };
            fragment.appendChild(newDiv);
        }
    }
    if (!rerender || prevIndex == 0) {
        prevIndex = prevIndex + cardsToLoad;
    }

    var returnObject = { fragment, startIndex: prevIndex };
    return returnObject;
}

function getDataValue(element, string) {
    var result = null;
    try {
        result = element.categorical(string).value()[0].key;
    } catch (error) {
        console.log(error.message);
    }

    if (result != null) {
        result = result.toString();
    } else {
        return result;
    }
    return result;
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
