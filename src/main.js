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
    var prevScrollTop = 0;
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

        modDiv.style.height = windowSize.height - 32 + "px";

        /**
         * Get rows from dataView
         */
        var rows = await dataView.allRows();
        //modDiv.style.height = rows.length * cardHeight + "px";
        var cardsToLoad = 9;
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
        //var firstEmptyDiv = document.getElementById("firstEmptyDiv");
        //firstEmptyDiv.style.height = modDiv.scrollTop + "px";

        //modDiv.appendChild(firstEmptyDiv);
        modDiv.appendChild(renderSanghaiDiv("firstDiv", modDiv.scrollTop));

        var returnedObject = renderTextCards(
            rows,
            prevIndex,
            cardsToLoad,
            rerender, // When rerendering we always want to render everything
            windowSize,
            mod,
            modDiv.scrollTop
        );
        modDiv.appendChild(returnedObject.fragment);
        prevIndex = 1;
        var cardHeight = getCardHeight(modDiv.children);

        console.log(cardHeight, "cardHeight");
        modDiv.appendChild(
            renderSanghaiDiv("lastEmptyDiv", (rows.length - cardsToLoad) * cardHeight - modDiv.scrollTop)
        );

        /**
         * De-mark on click on something that isn't text card *
         */

        modDiv.onclick = () => {
            dataView.clearMarking();
        };

        document.onkeydown = (e) => {
            console.log(e.key.toString());
            var selectedText = getSelectedText();
            if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedText !== "") {
                textToClipboard(selectedText);
                selectedText = "";
            }
            if (e.key === "ArrowUp") {
                modDiv.scrollBy(0, -100);
            }
            if (e.key === "ArrowDown") {
                modDiv.scrollBy(0, 100);
            } else {
                console.log(e.key, " pressed");
            }
        };

        /*
         *        Scroll Event Listener
         */
        modDiv.addEventListener("scroll", async function (e) {
            var currentScrollTop = modDiv.scrollTop;
            cardHeight = getCardHeight(modDiv.children);

            /*console.log(cardHeight, "cardHeight inside if");
            console.log(currentScrollTop, "currentScrollTop before if");
            console.log(prevScrollTop, "prevScrollTop before if");*/
            //console.log(prevIndex, "previndex before if");

            if (currentScrollTop > prevScrollTop) {
                if (currentScrollTop - prevScrollTop > cardHeight) {
                    console.log("WERE GOING DOWN TO SINGAPORE");
                    //modDiv.appendChild(renderSanghaiDiv("firstDiv", currentScrollTop));
                    console.log(prevScrollTop);
                    //Check if old data view
                    if (await dataView.hasExpired()) {
                        return;
                    }
                    var returnedObject = renderTextCards(
                        rows,
                        prevIndex,
                        cardsToLoad,
                        rerender,
                        windowSize,
                        mod,
                        currentScrollTop
                    );
                    modDiv.appendChild(returnedObject.fragment);

                    var nrOfCards = rows.length - cardsToLoad;
                    console.log(nrOfCards, "nr of cards");
                    console.log(cardHeight, "cardheight");
                    var bottomHeight = nrOfCards * cardHeight;
                    console.log(bottomHeight, "bottomheight");
                    var totalBottomHeight = bottomHeight - currentScrollTop;
                    modDiv.appendChild(renderSanghaiDiv("lastEmptyDiv", totalBottomHeight));

                    prevIndex = returnedObject.startIndex - cardsToLoad + 1;
                    console.log(returnedObject.startIndex, "start index");
                    prevScrollTop = currentScrollTop;
                    if (prevIndex + cardsToLoad >= rows.length) {
                        modDiv.removeChild(document.getElementById("lastEmptyDiv"));
                    }

                    console.log(prevIndex, "previndex in down");
                }
            } else {
                console.log(currentScrollTop, "currentScrollTop before if");
                //console.log(cardHeight, "cardHeight before if");
                console.log(prevScrollTop, "prevScrollTop before if");
                /*console.log(prevIndex, "previndex before if");*/
                console.log("GOING TO MARS WITH ELON");

                if (prevScrollTop - currentScrollTop >= cardHeight) {
                    //modDiv.appendChild(renderSanghaiDiv("firstDiv", modDiv.scrollTop));
                    if (await dataView.hasExpired()) {
                        return;
                    }
                    if (prevIndex - 3 <= 0) {
                        prevIndex = 0;
                    }

                    console.log(prevIndex, "previndex before render");
                    var returnedObject = renderTextCards(
                        rows,
                        prevIndex,
                        cardsToLoad,
                        rerender,
                        windowSize,
                        mod,
                        currentScrollTop
                    );
                    modDiv.appendChild(returnedObject.fragment);

                    var nrOfCards = rows.length - cardsToLoad;
                    console.log(nrOfCards, "nr of cards");
                    console.log(cardHeight, "cardheight");
                    var bottomHeight = nrOfCards * cardHeight;
                    console.log(bottomHeight, "bottomheight");
                    var totalBottomHeight = bottomHeight - currentScrollTop;
                    modDiv.appendChild(renderSanghaiDiv("lastEmptyDiv", totalBottomHeight));

                    prevScrollTop = currentScrollTop;

                    if (returnedObject.startIndex + cardsToLoad >= rows.length) {
                        modDiv.removeChild(document.getElementById("lastEmptyDiv"));
                    }
                    prevIndex = prevIndex - 1;

                    //console.log(modDiv.children, "children before mars");
                }
            }
        });
        console.log(prevScrollTop, "prevscrolltop");

        var mouseDownScrollLeft = 0;
        var mouseDownScrollTop = 0;
        /*
        var scrollBarPressed = false;
        var event = new Event("mouseup");
 
        var mouseMoveHandler = function () {
            console.log("mousemove")
            console.log(mouseDownScrollTop, "mouse scrolltop")
            console.log(modDiv.scrollTop, "modDiv.scrollTop")
 
            if (mouseDownScrollTop !== modDiv.scrollTop) {
                scrollBarPressed = true;
                console.log("mousemove and press scroll element")
                console.log(mouseDownScrollTop, "mousedownscrolltop")
                var currentScrollTop = modDiv.scrollTop;
                cardHeight = getCardHeight(modDiv.children);
                var percentageIndex = Math.round(currentScrollTop / cardHeight);
                console.log(percentageIndex, "percentage")
                var returnedObject = renderTextCards(
                    rows,
                    percentageIndex + 1,
                    cardsToLoad,
                    rerender,
                    windowSize,
                    mod,
                    currentScrollTop
                );
                modDiv.appendChild(returnedObject.fragment);
                //cardHeight = modDiv.children[2].clientHeight;
                var bottomDivHeight = (rows.length - cardsToLoad) * cardHeight - currentScrollTop;
                modDiv.appendChild(renderSanghaiDiv("lastEmptyDiv", bottomDivHeight));
 
                prevIndex = returnedObject.startIndex - cardsToLoad + 1;
                prevScrollTop = currentScrollTop;
                scrollBarPressed = false;
                console.log(percentageIndex, "previndex in down");
                mouseDownScrollTop = modDiv.scrollTop;
 
            }

            const mouseDownHandler = function () {
            mouseDownScrollTop = modDiv.scrollTop;
            console.log("INSIDE MOUSEDOWN FUNC")
            document.addEventListener("mousemove", mouseMoveHandler);
 
 
        }
 
        }*/
        const mouseUpHandler = function () {
            console.log("HERE IS MOUSE UP VAAARAAA");
            if (mouseDownScrollTop !== modDiv.scrollTop) {
                console.log("mousemove and press scroll element");
                console.log(mouseDownScrollTop, "mousedownscrolltop");
                var currentScrollTop = modDiv.scrollTop;
                cardHeight = getCardHeight(modDiv.children);
                var percentageIndex = Math.round(currentScrollTop / cardHeight);
                console.log(percentageIndex, "percentage");
                var returnedObject = renderTextCards(
                    rows,
                    percentageIndex + 1,
                    cardsToLoad,
                    rerender,
                    windowSize,
                    mod,
                    currentScrollTop
                );
                modDiv.appendChild(returnedObject.fragment);
                //cardHeight = modDiv.children[2].clientHeight;
                var nrOfCards = rows.length - cardsToLoad;
                console.log(nrOfCards, "nr of cards");
                console.log(cardHeight, "cardheight");
                var bottomHeight = nrOfCards * cardHeight;
                console.log(bottomHeight, "bottomheight");
                var totalBottomHeight = bottomHeight - currentScrollTop;
                modDiv.appendChild(renderSanghaiDiv("lastEmptyDiv", totalBottomHeight));

                prevIndex = returnedObject.startIndex - cardsToLoad + 1;
                prevScrollTop = currentScrollTop;
                console.log(percentageIndex, "previndex in down");
                mouseDownScrollTop = modDiv.scrollTop;
            }
        };

        //document.addEventListener("mousedown", mouseDownHandler);

        modDiv.addEventListener("mouseup", mouseUpHandler);

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

function createTextCard(content, colour, annotation, windowSize, markObject) {
    var textCardDiv = createTextCardDiv(colour);
    //add annotation to text card
    if (annotation !== null) {
        var header = createTextCardHeader();
        var headerContent = createHeaderContent(annotation);
        //Check if row is marked and check if all rows are marked. If row is not marked and all rows are not marked, decrease opacity
        if (!markObject.row && !markObject.allRows) header.style.color = "rgba(0, 0, 0, 0.5)";
        header.appendChild(headerContent);
        textCardDiv.appendChild(header);
        var line = createLineDividerInTextCard();
        textCardDiv.appendChild(line);
    }

    //add paragraph to text card
    if (typeof content === "string") {
        var contentParagraph = createTextCardContentParagraph(windowSize, content);

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
function renderTextCards(rows, prevIndex, cardsToLoad, rerender, windowSize, mod, scrollTop) {
    //if (rerender) {
    document.querySelector("#text-card-container").innerHTML = "";
    //}
    var fragment = document.createDocumentFragment();
    var topDiv = document.createElement("div");
    topDiv.style.height = scrollTop + "px";
    fragment.appendChild(topDiv);

    var whatToLoad = cardsToLoad;
    var startIndex = prevIndex;
    console.log(prevIndex, "prevIndex");
    console.log(whatToLoad, "whatToLoad");
    console.log(startIndex, "startIndex");

    //Check if all row are marked
    var allRowsMarked = isAllRowsMarked(rows);
    var index = prevIndex;
    console.log(index, "index before loop");
    for (; index < prevIndex + whatToLoad; index++) {
        // console.log("Rows: " + rows.length)
        if (index >= rows.length) {
            break;
        }
        let textCardContent = getDataValue(rows[index], "Content", 0);
        // textCard not NULL or UNDEFINED
        if (textCardContent) {
            console.log(index, "first");
            var annotation = getDataValue(rows[index], "Annotation", 0);
            var color = rows[index].color().hexCode;
            var tooltipString = createTooltipString(rows[index]);
            var markObject = {
                row: rows[index].isMarked(),
                allRows: allRowsMarked
            };
            let newDiv = createTextCard(textCardContent, color, annotation, windowSize, markObject);

            newDiv.onclick = (e) => {
                var selectedText = getSelectedText();
                if (selectedText === "") {
                    e.stopPropagation();
                    rows[index].mark("Toggle");
                }
            };
            newDiv.onmouseenter = (e) => {
                console.log(index, "second");
                console.log(rows[index]);
                console.log(index);
                mod.controls.tooltip.show(tooltipString);
                createCopyButton(newDiv);
            };
            newDiv.onmouseleave = (e) => {
                mod.controls.tooltip.hide();
                var button = document.getElementById("img-button");
                newDiv.removeChild(button);
            };
            fragment.appendChild(newDiv);
        }
    }
    prevIndex = index;
    var returnObject = { fragment, startIndex: prevIndex };
    return returnObject;
}

/**
 *
 * @param  element The row that will be used to get the specific value
 * @param {*} string String that represent the axis where the value will come from
 * @param {*} index Index of the column within the chosen axis to get the value from
 */

function getDataValue(element, string, index) {
    var result = null;
    try {
        result = element.categorical(string).value()[index].key;
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

/**
 *
 * @param  element The row that will be used to get the specific column name
 * @param {*} string String that represent the axis where the column name will come from
 * @param {*} index Index of the column within the chosen axis to get the column name from
 */

function getColumnName(element, string, index) {
    var result = null;
    try {
        result = element.categorical(string).value()[0]._node.__hierarchy.levels[index].name;
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

/**
 *
 * @param text Text is the value that the user has chosen, either through selection or copy entire text card
 */
function textToClipboard(text) {
    var temporaryCopyElement = document.createElement("textarea");
    document.body.appendChild(temporaryCopyElement);
    temporaryCopyElement.value = text;
    console.log(text);
    temporaryCopyElement.select();
    document.execCommand("copy");
    document.body.removeChild(temporaryCopyElement);
}

/**
 *
 * @param newDiv newDiv is the div element which the button will be added to
 */

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
 */
function createTextCardDiv(colour) {
    var textCardDiv = document.createElement("div");
    textCardDiv.setAttribute("id", "text-card");
    textCardDiv.style.borderLeftColor = colour;
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

function createTextCardContentParagraph(windowSize, content) {
    var contentParagraph = document.createElement("div");
    contentParagraph.setAttribute("id", "text-card-paragraph");
    contentParagraph.textContent = content;
    contentParagraph.style.maxHeight = windowSize.height * 0.5 + "px";

    return contentParagraph;
}

function createTooltipString(specificRow) {
    var nrOfTooltipChoices = specificRow.categorical("Tooltip").value()[0]._node.__hierarchy.levels.length;
    var tooltipCollection = [];
    var tooltipString = "";
    var i = null;
    for (i = 0; i < nrOfTooltipChoices; i++) {
        var columnName = getColumnName(specificRow, "Tooltip", i);
        var dataValue = getDataValue(specificRow, "Tooltip", i);
        var tooltipObj = {
            columnName: columnName,
            dataValue: dataValue
        };
        tooltipCollection.push(tooltipObj);
        tooltipString = tooltipString + tooltipObj.columnName + ": " + tooltipObj.dataValue + "\n";
    }
    return tooltipString;
}

function renderSanghaiDiv(name, height) {
    var shanghaiDiv = document.createElement("div");
    shanghaiDiv.setAttribute("id", name);
    shanghaiDiv.style.height = height + "px";
    console.log(shanghaiDiv);
    return shanghaiDiv;
}

function getCardHeight(childrenArray) {
    var index = 1;
    var cardHeight = 0;
    for (index; index < childrenArray.length - 1; index++) {
        cardHeight += childrenArray[index].getBoundingClientRect().height;
    }
    cardHeight = cardHeight / index - 1;

    return 100;
}
