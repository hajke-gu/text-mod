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
    let prevIndex = 0;
    var prevScrollTop = 0;
    /**
     * Create the read function.
     */
    const reader = mod.createReader(
        mod.visualization.data(),
        mod.windowSize(),
        mod.property("myProperty"),
        mod.visualization.axis("Content"),
        mod.visualization.axis("Sorting")
    );

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
     * @param {Spotfire.Axis} contentProp
     * @param {Spotfire.Axis} sortingProp
     */
    async function render(dataView, windowSize, prop, contentProp, sortingProp) {
        if (contentProp.parts.length > 1 || sortingProp.parts.length > 1) {
            if (contentProp.parts.length > 1)
                mod.controls.errorOverlay.show("Selecting Multiple Content is not allowed.");
            else if (sortingProp.parts.length > 1) {
                mod.controls.errorOverlay.show("Selecting Multiple Sortings is not allowed.");
            } else {
                mod.controls.errorOverlay.show(
                    "If this text can be seen. Tell Jonatan that he did something very wrong!"
                );
            }
            return;
        }
        mod.controls.errorOverlay.hide();
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

        modDiv.style.height = windowSize.height + "px";

        /**
         * Get rows from dataView
         */
        var rows = await dataView.allRows();
        //modDiv.style.height = rows.length * cardHeight + "px";
        var cardsToLoad = Math.floor(windowSize.height / 60);
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

        /**
         * Check if tooltip enabled
         */
        var tooltip = false;
        if ((await dataView.categoricalAxis("Tooltip")) != null) tooltip = true;

        /**
         * Check if annotation enabled
         */
        var annotationEnabled = false;
        if ((await dataView.categoricalAxis("Annotation")) != null) annotationEnabled = true;

        var rerender = true;
        //var firstEmptyDiv = document.getElementById("firstEmptyDiv");
        //firstEmptyDiv.style.height = modDiv.scrollTop + "px";

        //modDiv.appendChild(firstEmptyDiv);
        modDiv.appendChild(renderBottomDiv("firstDiv", modDiv.scrollTop));
        console.log(prevIndex, "after mark previndex");
        var returnedObject = renderTextCards(
            rows,
            prevIndex,
            cardsToLoad,
            rerender, // When rerendering we always want to render everything
            windowSize,
            mod,
            tooltip,
            annotationEnabled,
            modDiv.scrollTop
        );
        modDiv.appendChild(returnedObject.fragment);
        prevIndex = returnedObject.startIndex - cardsToLoad + 1;
        var cardHeight = getCardHeight(modDiv.children);

        console.log(cardHeight, "cardHeight");
        modDiv.appendChild(
            renderBottomDiv("lastEmptyDiv", (rows.length - cardsToLoad) * cardHeight - modDiv.scrollTop)
        );

        /**
         * De-mark on click on something that isn't text card *
         */

        modDiv.onclick = () => {
            dataView.clearMarking();
        };

        document.onkeydown = (e) => {
            //console.log(e.key.toString());
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
                //console.log(e.key, " pressed");
            }
        };

        /*
         * Scroll Event Listener
         */
        modDiv.addEventListener("scroll", async function (e) {
            var currentScrollTop = modDiv.scrollTop;
            cardHeight = getCardHeight(modDiv.children);

            if (currentScrollTop > prevScrollTop) {
                if (currentScrollTop - prevScrollTop > cardHeight) {
                    console.log("WERE GOING DOWN TO SINGAPORE");
                    console.log(prevScrollTop);
                    //Check if old data view
                    if (await dataView.hasExpired()) {
                        return;
                    }
                    if (prevIndex + cardsToLoad - 1 >= rows.length) {
                        return;
                    }
                    if (Math.abs(prevScrollTop - currentScrollTop) > 1000) {
                        var percentageIndex = Math.round(currentScrollTop / cardHeight);

                        var returnedObject = renderTextCards(
                            rows,
                            percentageIndex,
                            cardsToLoad,
                            rerender,
                            windowSize,
                            mod,
                            tooltip,
                            annotationEnabled,
                            currentScrollTop
                        );
                    } else {
                        console.log(prevIndex, "previndex before render");
                        var returnedObject = renderTextCards(
                            rows,
                            prevIndex,
                            cardsToLoad,
                            rerender,
                            windowSize,
                            mod,
                            tooltip,
                            annotationEnabled,
                            currentScrollTop
                        );
                    }
                    modDiv.appendChild(returnedObject.fragment);

                    var nrOfCards = rows.length - cardsToLoad;
                    console.log(nrOfCards, "nr of cards");
                    console.log(cardHeight, "cardheight");
                    var bottomHeight = nrOfCards * cardHeight;
                    console.log(bottomHeight, "bottomheight");
                    var totalBottomHeight = bottomHeight - currentScrollTop;
                    modDiv.appendChild(renderBottomDiv("lastEmptyDiv", totalBottomHeight));

                    prevIndex = returnedObject.startIndex - cardsToLoad + 1;
                    console.log(returnedObject.startIndex, "start index");
                    console.log(totalBottomHeight, "bottomheight ");

                    prevScrollTop = currentScrollTop;
                    if (returnedObject.startIndex - 1 >= rows.length) {
                        modDiv.removeChild(document.getElementById("lastEmptyDiv"));
                    }

                    console.log(prevIndex, "previndex in down");
                }
            } else {
                if (prevScrollTop - currentScrollTop >= cardHeight) {
                    if (await dataView.hasExpired()) {
                        return;
                    }

                    if (prevIndex - cardsToLoad <= 0) {
                        prevIndex = 0;
                    }
                    if (Math.abs(prevScrollTop - currentScrollTop) > 1000) {
                        var percentageIndex = Math.round(currentScrollTop / cardHeight);
                        var returnedObject = renderTextCards(
                            rows,
                            percentageIndex,
                            cardsToLoad,
                            rerender,
                            windowSize,
                            mod,
                            tooltip,
                            annotationEnabled,
                            currentScrollTop
                        );
                        prevIndex = percentageIndex - 1;
                    } else {
                        console.log(prevIndex, "previndex before render");
                        var returnedObject = renderTextCards(
                            rows,
                            prevIndex,
                            cardsToLoad,
                            rerender,
                            windowSize,
                            mod,
                            tooltip,
                            annotationEnabled,
                            currentScrollTop
                        );
                        prevIndex = prevIndex - 1;
                    }

                    modDiv.appendChild(returnedObject.fragment);
                    var nrOfCards = rows.length - cardsToLoad;

                    var bottomHeight = nrOfCards * cardHeight;
                    var totalBottomHeight = bottomHeight - currentScrollTop;
                    modDiv.appendChild(renderBottomDiv("lastEmptyDiv", totalBottomHeight));
                    console.log(returnedObject.startIndex, "start index returned");
                    prevScrollTop = currentScrollTop;
                }
            }
        });

        context.signalRenderComplete();
    }
});

/**
 * Create a text card.
 * @param content Content inside the div
 * @param annotation Annotation data from axis chosen by the user
 * @param windowSize Windowsize of the mod
 * @param markObject MarkObject contains information about if the object and/or rows is marked
 */

function createTextCard(content, annotation, windowSize, markObject, fontStyling, lineDividerColor) {
    //create textCard
    var textCardDiv = createTextCardDiv(fontStyling);

    //Check if row is marked and check if all rows are marked. If row is not marked and all rows are not marked, decrease opacity (= add 99 to hexcolor => 60% opacity)
    // https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4
    if (!markObject.row && !markObject.allRows) textCardDiv.style.color = fontStyling.fontColor + "99";

    //add annotation to text card
    if (annotation !== null) {
        /**
         * Create all annotations
         */
        var header = createTextCardHeader();

        var firstAnnotationCreated = false;
        var annotationLength = annotation[0]._node.__hierarchy.levels.length;
        for (var i = 0; i < annotationLength; i++) {
            var dataValue = annotation[i].key; //Get annotation value

            if (dataValue !== null) {
                //Check if annotation has value

                //Handle date
                if (annotation[0]._node.__hierarchy.levels[i].name === "Date") {
                    dataValue = formatDate(new Date(Number(dataValue)));
                }

                var headerContent = createHeaderContent(dataValue);

                if (i !== 0 && firstAnnotationCreated) {
                    //First annotation -> no border
                    headerContent.style.borderLeft = "1px solid";
                    headerContent.style.borderLeftColor = lineDividerColor + "BF";
                }
                header.appendChild(headerContent);
                firstAnnotationCreated = true;
            }
        }

        if (firstAnnotationCreated) {
            //Check if any annotation has been created
            textCardDiv.appendChild(header);

            //add divider line to text card
            var line = createLineDividerInTextCard(lineDividerColor);
            textCardDiv.appendChild(line);
        }
    }

    //add paragraph to text card
    if (typeof content === "string") {
        var contentParagraph = createTextCardContentParagraph(windowSize, content, fontStyling);
        textCardDiv.appendChild(contentParagraph);
    }

    var divObject = {
        textCardDiv: textCardDiv,
        header: header,
        content: contentParagraph
    };

    return divObject;
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
function renderTextCards(
    rows,
    prevIndex,
    cardsToLoad,
    rerender,
    windowSize,
    mod,
    tooltipEnabled,
    annotationEnabled,
    scrollTop
) {
    if (rerender) {
        document.querySelector("#text-card-container").innerHTML = "";
    }
    var fragment = document.createDocumentFragment();
    var topDiv = document.createElement("div");
    topDiv.setAttribute("id", "top-div");
    topDiv.style.height = scrollTop + "px";
    fragment.appendChild(topDiv);

    var whatToLoad = cardsToLoad;
    var startIndex = prevIndex;
    console.log(prevIndex, "prevIndex");
    console.log(whatToLoad, "whatToLoad");
    console.log(startIndex, "startIndex");

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
    const scalesStyling = {
        modBackgroundColor: styling.general.backgroundColor,
        fontColor: styling.scales.font.color,
        lineColor: styling.scales.line.stroke,
        tickMarkColor: styling.scales.tick.stroke
    };

    // Customized scrollbar for Text Card and Text Card Container that is adjusting to the theme
    // HEX color + "4D" = 30% opacitiy
    // HEX color + "BF" = 75% opacity
    var styleElement = document.createElement("style");
    styleElement.appendChild(
        document.createTextNode(
            "::-webkit-scrollbar {width: 8px;} ::-webkit-scrollbar-track {border-radius: 16px; background-color: " +
                scalesStyling.lineColor +
                "4d;} ::-webkit-scrollbar-thumb {border-radius: 16px; background-color: " +
                fontStyling.fontColor +
                "4d;} ::-webkit-scrollbar-thumb:hover {background-color: " +
                fontStyling.fontColor +
                "BF;} ::-webkit-scrollbar-thumb:active {background-color: " +
                fontStyling.fontColor +
                "BF;}"
        )
    );
    document.getElementsByTagName("head")[0].appendChild(styleElement);

    //Check if all row are marked
    var allRowsMarked = isAllRowsMarked(rows);
    let index = startIndex;
    /**
     * Create all text cards
     */
    for (; index < prevIndex + whatToLoad; index++) {
        if (index >= rows.length) {
            break;
        }

        /**
         * Get value/content for the specifc card.
         * And handle date
         */
        let textCardContent = getDataValue(rows[index], "Content", 0);
        if (getColumnName(rows[index], "Content", 0) === "Date")
            //Date handling
            textCardContent = formatDate(new Date(Number(textCardContent)));

        // textCard not NULL or UNDEFINED
        if (textCardContent) {
            /**
             * Create Annotation
             */
            var annotation = null;
            if (annotationEnabled) {
                annotation = rows[index].categorical("Annotation").value();
            }

            /**
             * Get color from api for side bar
             */
            var color = rows[index].color().hexCode;

            /**
             * Check if specific row are marked and add boolean for condition is all rows marked
             */
            var markObject = {
                row: rows[index].isMarked(),
                allRows: allRowsMarked
            };

            /**
             * Create border div
             */
            let borderDiv = document.createElement("div");
            borderDiv.setAttribute("id", "text-card-border");

            /**
             * Create the text card
             */
            let divObject = createTextCard(
                textCardContent,
                annotation,
                windowSize,
                markObject,
                fontStyling,
                scalesStyling.tickMarkColor
            );
            let newDiv = divObject.textCardDiv;
            newDiv.setAttribute("id", "text-card");

            newDiv.style.boxShadow = "0 0 0 1px " + scalesStyling.lineColor;
            newDiv.style.borderLeftColor = color;

            markTextCard(rows[index], newDiv, index);
            /**
             * Create mouse over functionallity
             * Border around card and tooltip
             */
            configureMouseOver(divObject, borderDiv, fontStyling, rows[index], tooltipEnabled, mod);

            borderDiv.appendChild(newDiv);
            fragment.appendChild(borderDiv);
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
    //console.log(text);
    temporaryCopyElement.select();
    document.execCommand("copy");
    document.body.removeChild(temporaryCopyElement);
}

/**
 *
 * @param newDiv newDiv is the div element which the button will be added to
 * @param buttonColor default color = API's font color
 */

function createCopyButton(newDiv, buttonColor) {
    // BUTTON
    var newButton = document.createElement("svg");

    newButton.title = "Copy to Clipboard";
    newButton.setAttribute("id", "img-button");

    //TODO: Create SVG here
    var svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgNode.setAttributeNS(null, "width", "16");
    svgNode.setAttributeNS(null, "height", "16");

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // 60% opacity of font color
    svg.setAttributeNS(null, "fill", buttonColor + "99");
    svg.setAttributeNS(null, "viewBox", "0 0 16 16");
    svg.setAttributeNS(null, "d", "M11.259 1H6v3H2v11h10v-3h2V4.094zM8 4h2v1H8zm3 10H3V5h3v7h5zm1-5H8V8h4zm0-2H8V6h4z");
    // 80 % opacity of font color
    newButton.onmouseover = (e) => {
        svg.setAttributeNS(null, "fill", buttonColor + "CC");
    };

    newButton.onmousedown = (e) => {
        svg.setAttributeNS(null, "fill", buttonColor);
    };
    // 80 % opacity of font color
    newButton.onclick = (e) => {
        svg.setAttributeNS(null, "fill", buttonColor + "CC");
        var text = newDiv.querySelector("#text-card-paragraph").textContent;
        textToClipboard(text);
        console.log(text);
        e.stopPropagation();
    };
    // 60% opacity of font color
    newButton.onmouseleave = (e) => {
        svg.setAttributeNS(null, "fill", buttonColor + "99");
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

        if (sortValueA < sortValueB) return -1;

        if (sortValueA > sortValueB) return 1;

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
 * @param fontStyling Font specifications from API
 */
function createTextCardDiv(fontStyling) {
    var textCardDiv = document.createElement("div");
    /*
     * Adapting font Color, size, family from API (theme)
     */
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

function createLineDividerInTextCard(lineColor) {
    var line = document.createElement("hr");
    line.setAttribute("class", "thin_hr");
    // color 75% opacity of line color
    line.style.backgroundColor = lineColor + "BF";
    return line;
}

/**
 *
 * @param windowSize WindowSize of the mod
 * @param content Content of the row that will be in the paragraph
 */

function createTextCardContentParagraph(windowSize, content, fontStyling) {
    var paragraph = document.createElement("div");
    paragraph.setAttribute("id", "text-card-paragraph");
    paragraph.textContent = content;
    paragraph.style.maxHeight = windowSize.height * 0.5 + "px";
    /*
     * Apply styling of font Weight and Style only on Textcard Content (not on annotation line)
     */
    paragraph.style.fontStyle = fontStyling.fontStyle;
    paragraph.style.fontWeight = fontStyling.fontWeight;

    return paragraph;
}

function createTooltipString(specificRow, tooltipContent) {
    var nrOfTooltipChoices = specificRow.categorical(tooltipContent).value()[0]._node.__hierarchy.levels.length;
    var tooltipCollection = [];
    var tooltipString = "";
    var i = null;
    for (i = 0; i < nrOfTooltipChoices; i++) {
        var columnName = getColumnName(specificRow, tooltipContent, i);
        var dataValue = getDataValue(specificRow, tooltipContent, i);

        if (columnName === "Date")
            //Handle date
            dataValue = formatDate(new Date(Number(dataValue)));

        var tooltipObj = {
            columnName: columnName,
            dataValue: dataValue
        };
        tooltipCollection.push(tooltipObj);
        tooltipString = tooltipString + tooltipObj.columnName + ": " + tooltipObj.dataValue + "\n";
    }
    return tooltipString;
}

function renderBottomDiv(name, height) {
    var bottomDiv = document.createElement("div");
    bottomDiv.setAttribute("id", name);
    bottomDiv.style.height = height + "px";
    console.log(bottomDiv);
    return bottomDiv;
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
/**
 * Format date in YYYY-MM-DD
 *
 * @param {*} date Date object
 */
function formatDate(date) {
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var day = date.getDate();

    var dateFormat =
        year.toString() +
        "-" +
        (month < 10 ? "0" + month : month).toString() +
        "-" +
        (day < 10 ? "0" + day : day).toString();

    return dateFormat;
}

function configureMouseOver(divObject, borderDiv, fontStyling, row, tooltipEnabled, mod) {
    /**
     * Mouse over for textCardDiv
     */

    divObject.textCardDiv.onmouseenter = (e) => {
        borderDiv.style.boxShadow = "0 0 0 1px " + fontStyling.fontColor;
        createCopyButton(divObject.textCardDiv, fontStyling.fontColor);
    };

    divObject.textCardDiv.onmouseleave = (e) => {
        borderDiv.style.boxShadow = "";

        var button = document.getElementById("img-button");
        divObject.textCardDiv.removeChild(button);
    };

    /**
     * Mouse over for content
     */
    divObject.content.onmouseenter = (e) => {
        if (tooltipEnabled) {
            var tooltipString = createTooltipString(row, "Tooltip");
            mod.controls.tooltip.show(tooltipString);
        }
    };

    divObject.content.onmouseleave = (e) => {
        if (tooltipEnabled) mod.controls.tooltip.hide();
    };

    /**
     * Mouse over for header
     */
    divObject.header.onmouseenter = (e) => {
        var tooltipString = createTooltipString(row, "Annotation");
        mod.controls.tooltip.show(tooltipString);
    };

    divObject.header.onmouseleave = (e) => {
        mod.controls.tooltip.hide();
    };
}

function markTextCard(row, div, index) {
    /**
     * Create on click functionallity
     * Select text and marking
     */
    div.onclick = (e) => {
        var selectedText = getSelectedText();
        if (selectedText === "") {
            e.stopPropagation();
            console.log(index, "MAGIC");
            this.prevIndex = index - 1;
            row.mark("Toggle");
        }
    };
}
