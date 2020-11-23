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

                let dataValueLength = ("" + dataValue).length;
                // annotations with 4 or less characters get never truncated
                if (dataValueLength < 4) {
                    headerContent.style.minWidth = dataValueLength + "ch";
                    headerContent.style.textOverflow = "unset";
                }

                if (i !== 0 && firstAnnotationCreated) {
                    //First annotation -> no border
                    headerContent.style.borderLeft = "1px solid";
                    headerContent.style.borderLeftColor = lineDividerColor + "BF";
                    headerContent.style.paddingLeft = "8px";
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

        // truncate to a max length of 100 characters per tooltip row
        var maxLength = 100;
        if (typeof dataValue === "string" && dataValue.length > maxLength) {
            dataValue = truncateString(dataValue, maxLength);
        }

        var tooltipObj = {
            columnName: columnName,
            dataValue: dataValue
        };

        if (dataValue !== null) {
            // Remove empty data values
            tooltipCollection.push(tooltipObj);
            tooltipString = tooltipString + tooltipObj.columnName + ": " + tooltipObj.dataValue + "\n";
        }
    }
    return tooltipString;
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
 * @param newDiv newDiv is the div element which the button will be added to
 * @param buttonColor default color = API's font color
 */

function createCopyButton(newDiv, buttonColor) {
    // BUTTON
    var newButton = document.createElement("svg");

    newButton.title = "Copy to Clipboard";
    newButton.setAttribute("id", "img-button");

    //Creates SVG
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
        var text = newDiv.querySelector("#text-card-paragraph").textContent;
        textToClipboard(text);
        e.stopPropagation();
    };
    // 80 % opacity of font color
    newButton.onmouseup = (e) => {
        svg.setAttributeNS(null, "fill", buttonColor + "CC");
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
