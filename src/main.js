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

        /*
         * Scroll Event Listener
         */
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

        /*
         * Signal that the mod is ready for export.
         */
        context.signalRenderComplete();
    }
});

/**
 * Create a text card.
 * @param content Content inside the div
 * @param colour Colour of the border on left side of each textcard
 * @param annotation Annotation data from axis chosen by the user
 * @param windowSize Windowsize of the mod
 * @param markObject MarkObject contains information about if the object and/or rows is marked
 */

function createTextCard(content, colour, annotation, windowSize, markObject, fontStyling) {
    //create textCard
    var textCardDiv = createTextCardDiv(colour, fontStyling);
    //textCardDiv.setAttribute("id", "text-card");
    //textCardDiv.style.boxShadow = "0 0 0 1px #c2c6d1, 0 0 0 2px transparent, 0 0 0 3px transparent;";

    //add annotation to text card
    if (annotation !== null) {
        var header = createTextCardHeader();
        //header.setAttribute("class", "annotation-container");
        var headerContent = createHeaderContent(annotation);
        //headerContent.setAttribute("class", "annotation-content");
        //headerContent.textContent = annotation;
        //header.style.backgroundColor = colour;
        //header.style.borderBottom = "grey";

        //Check if row is marked and check if all rows are marked. If row is not marked and all rows are not marked, decrease opacity
        if (!markObject.row && !markObject.allRows) header.style.color = "rgba(0, 0, 0, 0.5)";

        header.appendChild(headerContent);
        textCardDiv.appendChild(header);

        var line = createLineDividerInTextCard();
        //line.setAttribute("class", "thin_hr");
        textCardDiv.appendChild(line);
    }

    //add paragraph to text card
    if (typeof content === "string") {
        var contentParagraph = createTextCardContentParagraph(windowSize, content, fontStyling);
        //contentParagraph.setAttribute("id", "text-card-paragraph");
        //contentParagraph.textContent = content;
        //contentParagraph.style.maxHeight = windowSize.height * 0.5 + "px";

        //Check if row is marked and check if all rows are marked. If row is not marked and all rows are not marked, decrease opacity
        if (!markObject.row && !markObject.allRows) contentParagraph.style.color = "rgba(0, 0, 0, 0.5)";

        textCardDiv.appendChild(contentParagraph);
    }

    return textCardDiv;
}

/**
 * Render Text Cards
 * @param {*} rows All the rows from the dataset
 * @param {*} prevIndex Index of the previously rendered text card
 * @param {*} cardsToLoad Number of cards to render at one time
 * @param {*} rerender Boolean to check if the text cards needs to be rerendered
 * @param {*} windowSize WindowSize of the mod in pixels
 * @param {*} mod The mod object that will be used to add a tooltip using the "controls"
 */
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

    // Get and group styling attributes
    const styling = mod.getRenderContext().styling;
    // general fonts styling
    const fontStyling = {
        fontSize: styling.general.font.fontSize,
        fontFamily: styling.general.font.fontFamily,
        fontColor: styling.general.font.color,
        fontStyle: styling.general.fontStyle,
        fontWeight: styling.general.fontWeight
    };
    // additional styling for scales
    const stylingMisc = {
        modBackgroundColor: styling.general.backgroundColor,
        line: styling.scales.line.stroke,
        tickMark: styling.scales.tick.stroke
    };

    //Check if all row are marked
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
            let newDiv = createTextCard(textCardContent, color, annotation, windowSize, markObject, fontStyling);
            newDiv.style.boxShadow = "0 0 0 1px " + stylingMisc.line + ", 0 0 0 2px transparent, 0 0 0 3px transparent";

            newDiv.onclick = (e) => {
                var selectedText = getSelectedText();
                if (selectedText === "") {
                    e.stopPropagation();
                    rows[index].mark("Toggle");
                }
            };
            newDiv.onmouseenter = (e) => {
                newDiv.style.boxShadow = "0 0 0 1px " + stylingMisc.line + ", 0 0 0 2px white, 0 0 0 3px #313336";
                mod.controls.tooltip.show(
                    getColumnName(rows[index], "Tooltip") + ": " + getDataValue(rows[index], "Tooltip")
                );
                createCopyButton(newDiv);
            };
            newDiv.onmouseleave = (e) => {
                newDiv.style.boxShadow =
                    "0 0 0 1px " + stylingMisc.line + ", 0 0 0 2px transparent, 0 0 0 3px transparent";
                mod.controls.tooltip.hide();
                var button = document.getElementById("img-button");
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
    console.log(text);
    temporaryCopyElement.select();
    document.execCommand("copy");
    document.body.removeChild(temporaryCopyElement);
}

function createCopyButton(newDiv) {
    // BUTTON
    var newButton = document.createElement("button");

    newButton.title = "Copy to Clipboard";
    newButton.setAttribute("id", "img-button");

    //TODO: Create SVG here
    var svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgNode.setAttributeNS(null, "viewBox", "0 0 16 16");

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.setAttributeNS(null, "width", "100%");
    svg.setAttributeNS(null, "height", "100%");
    svg.setAttributeNS(null, "fill", "#797b85");
    svg.setAttributeNS(null, "d", "M11.259 1H6v3H2v11h10v-3h2V4.094zM8 4h2v1H8zm3 10H3V5h3v7h5zm1-5H8V8h4zm0-2H8V6h4z");

    newButton.onclick = (e) => {
        svg.setAttributeNS(null, "fill", "#61646b");
        //var text = newDiv.getElementById("text-card-paragraph").textContent;
        var text = newDiv.querySelector("#text-card-paragraph").textContent;
        textToClipboard(text);
        e.stopPropagation();
    };
    newButton.onmouseover = (e) => {
        svg.setAttributeNS(null, "fill", "#61646b");
    };
    newButton.onfocus = (e) => {
        svg.setAttributeNS(null, "fill", "#797b85");
    };
    newButton.onmouseleave = (e) => {
        svg.setAttributeNS(null, "fill", "#797b85");
    };
    newButton.onselect = (e) => {
        svg.setAttributeNS(null, "fill", "#3050EF");
    };

    svgNode.appendChild(svg);

    newButton.appendChild(svgNode);
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

/**
 * @param {*} colour Colour passed from the dataView object of specific row through the mod API
 * @param fontStyling Font specifications from API
 */
function createTextCardDiv(colour, fontStyling) {
    var textCardDiv = document.createElement("div");

    textCardDiv.setAttribute("id", "text-card");
    textCardDiv.style.borderLeftColor = colour;
    //textCardDiv.style.boxShadow = "0 0 0 1px #c2c6d1, 0 0 0 2px transparent, 0 0 0 3px transparent";
    /*
     * Adapting font Color, size, family from API (theme)
     */
    // should be color #313336
    textCardDiv.style.color = fontStyling.fontColor;
    textCardDiv.style.fontSize = fontStyling.fontSize;
    textCardDiv.style.fontFamily = fontStyling.fontFamily;
    return textCardDiv;
}

function createTextCardHeader() {
    var header = document.createElement("div");
    header.setAttribute("class", "annotation-container");
    return header;
}

/**
 *
 * @param annotation Content of the header based on information from user choice of annotation
 */

function createHeaderContent(annotation) {
    var headerContent = document.createElement("div");
    headerContent.setAttribute("class", "annotation-content");
    headerContent.textContent = annotation;
    return headerContent;
}

function createLineDividerInTextCard() {
    var line = document.createElement("hr");
    line.setAttribute("class", "thin_hr");
    return line;
}

/**
 *
 * @param windowSize WindowSize of the mod
 * @param content Content of the row that will be in the paragraph
 */

function createTextCardContentParagraph(windowSize, content, fontStyling) {
    var contentParagraph = document.createElement("div");
    contentParagraph.setAttribute("id", "text-card-paragraph");
    contentParagraph.textContent = content;
    contentParagraph.style.maxHeight = windowSize.height * 0.5 + "px";
    contentParagraph.style.fontStyle = fontStyling.fontStyle;
    contentParagraph.style.fontWeight = fontStyling.fontWeight;

    return contentParagraph;
}
