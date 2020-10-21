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

        modDiv.style.height = windowSize.height - 8 + "px";

        /**
         * Get rows from dataView
         */
        var rows = await dataView.allRows();

        if (rows == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }

        /**
         * Sort rows
         */
        if ((await dataView.categoricalAxis("Sorting")) != null) {
            sortRows(rows);
        }

        var rerender = true;

        var returnedObject = renderTextCards(
            rows,
            prevIndex, // When rerendering we always want to render everything
            cardsToLoad,
            rerender,
            windowSize,
            mod
        );

        modDiv.appendChild(returnedObject.fragment);
        prevIndex = returnedObject.startIndex;

        /*          * De-mark on click on something that isn't text card *   */
        var modContainer = document.getElementById("text-card-container");

        modContainer.onclick = () => {
            dataView.clearMarking();
        };

        document.onkeydown = (e) => {
            console.log(e.key.toString());
            var selectedText = getSelectedText();
            if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedText !== "") {
                //console.log(selectedText);
                //console.log("inside if");
                textToClipboard(selectedText);
                selectedText = "";
            }
            if (e.key === "ArrowUp") {
                modContainer.scrollBy(0, -100);
            }
            if (e.key === "ArrowDown") {
                modContainer.scrollBy(0, 100);
            } else {
                console.log(e.key, " pressed");
            }
        };

        /*          * Scroll Event Listener          */
        modDiv.addEventListener("scroll", async function (e) {
            if (modDiv.scrollHeight - modDiv.scrollTop <= modDiv.clientHeight + 1) {
                //Check if old data view
                if (await dataView.hasExpired()) {
                    return;
                }
                var rerender = false;

                var returnedObject = renderTextCards(rows, prevIndex, cardsToLoad, rerender, windowSize, mod);
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
function createTextCard(content, colour, annotation, windowSize, markObject) {
    //create textCard
    var textCardWrapper = document.createElement("div");
    textCardWrapper.setAttribute("id", "text-card-wrapper");
    var textCardDiv = document.createElement("div");
    textCardDiv.setAttribute("id", "text-card");
    textCardDiv.style.boxShadow = "0 0 0 1px #c2c6d1, 0 0 0 2px transparent, 0 0 0 3px transparent;";
    //add sidebar to text card
    var sidebar = document.createElement("div");
    sidebar.setAttribute("id", "text-card-sidebar");
    sidebar.style.backgroundColor = colour;
    textCardDiv.appendChild(sidebar);

    //add annotation to text card
    if (annotation !== null) {
        var header = document.createElement("div");
        header.setAttribute("class", "annotation-container");
        var headerContent = document.createElement("div");
        headerContent.setAttribute("class", "annotation-content");
        headerContent.textContent = annotation;
        //header.style.backgroundColor = colour;
        //header.style.borderBottom = "grey";
        header.appendChild(headerContent);
        textCardDiv.appendChild(header);

        var line = document.createElement("hr");
        line.setAttribute("class", "thin_hr");
        textCardDiv.appendChild(line);
    }

    //add paragraph to text card
    if (typeof content === "string") {
        var contentParagraph = document.createElement("div");
        contentParagraph.setAttribute("id", "text-card-paragraph");
        contentParagraph.textContent = content;
        contentParagraph.style.maxHeight = windowSize.height * 0.5 + "px";

        //Check if row is marked and check if all rows are marked
        //If row is not marked and all rows are not marked, decrease opacity
        if (!markObject.row && !markObject.allRows) contentParagraph.style.color = "rgba(0, 0, 0, 0.5)";

        textCardDiv.appendChild(contentParagraph);
    }

    requestAnimationFrame(() => {
        sidebar.style.height = textCardWrapper.scrollHeight + "px";
    });

    textCardWrapper.appendChild(textCardDiv);

    return textCardWrapper;
}

function renderTextCards(rows, prevIndex, cardsToLoad, rerender, windowSize, mod) {
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

    /**
     * Check all if all rows are marked
     */
    var allRowsMarked = isAllRowsMarked(rows);

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
            var markObject = {
                row: rows[index].isMarked(),
                allRows: allRowsMarked
            };
            let newDiv = createTextCard(textCardContent, color, annotation, windowSize, markObject);

            //document.getElementById("text-card-sidebar").style.height = newDiv.style.height;

            newDiv.onclick = (e) => {
                var selectedText = getSelectedText();
                if (selectedText === "") {
                    e.stopPropagation();
                    rows[index].mark("Toggle");
                }
            };
            newDiv.onmouseenter = (e) => {
                mod.controls.tooltip.show(
                    getColumnName(rows[index], "Tooltip") + ": " + getDataValue(rows[index], "Tooltip")
                );
                createCopyButton(newDiv);
            };
            newDiv.onmouseleave = (e) => {
                mod.controls.tooltip.hide();
                var button = document.getElementById("image-button");
                newDiv.removeChild(button);
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

function getColumnName(element, string) {
    var result = null;
    //var result2 = null;
    try {
        result = element.categorical(string).value()[0]._node.__hierarchy.levels[0].name;
        //if we want the user to have more on the tooltip you have to loop over and change the "levels" incrementally
        //result2 = element.categorical(string).value()[0]._node.__hierarchy.levels[1].name;
        //console.log(result2)
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

function getSelectedText() {
    var selectedText = "";

    // window.getSelection
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    }
    // document.getSelection
    if (document.getSelection) {
        selectedText = document.getSelection().toString();
    }
    // document.selection

    return selectedText;
}

function textToClipboard(text) {
    var temporaryCopyElement = document.createElement("textarea");
    document.body.appendChild(temporaryCopyElement);
    temporaryCopyElement.value = text;
    temporaryCopyElement.select();
    document.execCommand("copy");
    document.body.removeChild(temporaryCopyElement);
}

function createCopyButton(newDiv) {
    var newButton = document.createElement("button");
    newButton.setAttribute("id", "image-button");
    var myImage = document.createElement("img");
    myImage.src = "assets/copy-icon.svg";
    myImage.style.height = "3em";
    myImage.style.width = "2em";

    newButton.appendChild(myImage);
    newButton.onclick = (e) => {
        var text = document.getElementById("text-card-paragraph").textContent;
        textToClipboard(text);
    };
    var buttonHeight = "3em";
    var buttonWidth = "3em";
    newButton.style.height = buttonHeight;
    newButton.style.width = buttonWidth;
    newButton.style.position = "absolute";
    //newButton.style.left="0px";
    newButton.style.bottom = "1em";
    newButton.style.zIndex = "10";
    // newButton.style.verticalAlign = "top";
    newButton.style.float = "right";
    newButton.style.right = "2em";
    newButton.style.top = "2em";
    newButton.title = "Copy to clipboard";
    newDiv.appendChild(newButton);
}

/**
 * Sort rows
 * @param {*} rows
 */
function sortRows(rows) {
    rows.sort(function (a, b) {
        var sortValueA = Number(a.categorical("Sorting").value()[0].key);
        var sortValueB = Number(b.categorical("Sorting").value()[0].key);

        if (sortValueA < sortValueB) return 1;

        if (sortValueA > sortValueB) return -1;

        return 0;
    });
}

/**
 * Check if all rows are marked
 * @param {*} rows
 */
function isAllRowsMarked(rows) {
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].isMarked()) return false;
    }
    return true;
}
