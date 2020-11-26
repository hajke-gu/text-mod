/**
 * Create a text card.
 * @param content Content inside the div
 * @param annotation Annotation data from axis chosen by the user
 * @param windowSize Windowsize of the mod
 * @param markObject MarkObject contains information about if the object and/or rows is marked
 * @returns {HTMLDocument}
 */
function createTextCard(content, annotation, windowSize, markObject, fontStyling, lineDividerColor) {
    // create div
    var textCardDiv = createTextCardDiv(fontStyling);

    // check if row is marked and check if all rows are marked. If row is not marked and all rows are not marked, decrease opacity (= add 99 to hexcolor => 60% opacity)
    // https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4
    if (!markObject.row && !markObject.allRows) textCardDiv.style.color = fontStyling.fontColor + "99";

    // add annotation to text card
    if (annotation !== null) {
        // create all annotation divs
        var header = createTextCardHeader();

        var firstAnnotationCreated = false;
        var annotationLength = annotation[0]._node.__hierarchy.levels.length;
        for (var i = 0; i < annotationLength; i++) {
            var dataValue = annotation[i].key; // get annotation value

            if (dataValue !== null) {
                // check if annotation has value

                // handle date
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
                    // first annotation -> no border
                    headerContent.style.borderLeft = "1px solid";
                    headerContent.style.borderLeftColor = lineDividerColor + "BF";
                    headerContent.style.paddingLeft = "8px";
                }
                header.appendChild(headerContent);
                firstAnnotationCreated = true;
            }
        }

        if (firstAnnotationCreated) {
            // check if any annotation has been created
            textCardDiv.appendChild(header);

            // add divider line to text card
            var line = createLineDividerInTextCard(lineDividerColor);
            textCardDiv.appendChild(line);
        }
    }

    // add paragraph to text card
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
 * Create a tooltip string
 * @param specificRow Row of dataset
 * @param tooltipContent Content of tooltip
 * @returns {String}
 */
function createTooltipString(specificRow, tooltipContent) {
    var nrOfTooltipChoices = specificRow.categorical(tooltipContent).value()[0]._node.__hierarchy.levels.length;
    var tooltipCollection = [];
    var tooltipString = "";
    var i = null;
    for (i = 0; i < nrOfTooltipChoices; i++) {
        var columnName = getColumnName(specificRow, tooltipContent, i);
        var dataValue = getDataValue(specificRow, tooltipContent, i);

        if (columnName === "Date")
            // handle date
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
            // remove empty data values
            tooltipCollection.push(tooltipObj);
            tooltipString = tooltipString + tooltipObj.columnName + ": " + tooltipObj.dataValue + "\n";
        }
    }
    return tooltipString;
}

/**
 * Create a text card content paragraph
 * @param windowSize Size of mod
 * @param content Content of text card
 * @param fontStyling Style of font from api
 * @returns {String}
 */
function createTextCardContentParagraph(windowSize, content, fontStyling) {
    var paragraph = document.createElement("div");
    paragraph.setAttribute("id", "text-card-paragraph");
    paragraph.textContent = content;
    paragraph.style.maxHeight = windowSize.height * 0.5 + "px";
    // apply styling of font Weight and Style only on Textcard Content (not on annotation line)
    paragraph.style.fontStyle = fontStyling.fontStyle;
    paragraph.style.fontWeight = fontStyling.fontWeight;

    return paragraph;
}

/**
 * Create header of text card / annotation
 * @param annotation Annotation content
 * @returns {String}
 */
function createHeaderContent(annotation) {
    var headerContent = document.createElement("div");
    headerContent.setAttribute("class", "annotation-content");
    headerContent.textContent = annotation;
    return headerContent;
}

/**
 * Create line divider in text card
 * @param lineColor Color of line divider
 * @returns {HTMLDocument}
 */
function createLineDividerInTextCard(lineColor) {
    var line = document.createElement("hr");
    line.setAttribute("class", "thin_hr");
    // color 75% opacity of line color
    line.style.backgroundColor = lineColor + "BF";
    return line;
}

/**
 * Create text card div
 * @param fontStyling Style of the current mod from api
 * @returns {HTMLDocument}
 */
function createTextCardDiv(fontStyling) {
    var textCardDiv = document.createElement("div");
    // adapting to font Color, size, family from API (theme)
    textCardDiv.style.color = fontStyling.fontColor;
    textCardDiv.style.fontSize = fontStyling.fontSize;
    textCardDiv.style.fontFamily = fontStyling.fontFamily;
    return textCardDiv;
}

/**
 * Create text card header string
 * @returns {String}
 */
function createTextCardHeader() {
    var header = document.createElement("div");
    header.setAttribute("class", "annotation-container");
    return header;
}

/**
 * Create copy button for the text card
 * @param newDiv The div / text card to have the new button
 * @param buttonColor Color of button
 */
function createCopyButton(newDiv, buttonColor) {
    // create element
    var newButton = document.createElement("svg");

    newButton.title = "Copy to Clipboard";
    newButton.setAttribute("id", "img-button");

    // gets and creates svg
    var svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgNode.setAttributeNS(null, "width", "16");
    svgNode.setAttributeNS(null, "height", "16");

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // set 60% opacity of font color
    svg.setAttributeNS(null, "fill", buttonColor + "99");
    svg.setAttributeNS(null, "viewBox", "0 0 16 16");
    svg.setAttributeNS(null, "d", "M11.259 1H6v3H2v11h10v-3h2V4.094zM8 4h2v1H8zm3 10H3V5h3v7h5zm1-5H8V8h4zm0-2H8V6h4z");
    // set 80 % opacity of font color
    newButton.onmouseover = (e) => {
        svg.setAttributeNS(null, "fill", buttonColor + "CC");
    };

    newButton.onmousedown = (e) => {
        svg.setAttributeNS(null, "fill", buttonColor);
        var text = newDiv.querySelector("#text-card-paragraph").textContent;
        textToClipboard(text);
        e.stopPropagation();
    };
    // set 80 % opacity of font color
    newButton.onmouseup = (e) => {
        svg.setAttributeNS(null, "fill", buttonColor + "CC");
        e.stopPropagation();
    };
    // set60% opacity of font color
    newButton.onmouseleave = (e) => {
        svg.setAttributeNS(null, "fill", buttonColor + "99");
    };

    svgNode.appendChild(svg);
    newButton.appendChild(svgNode);
    newDiv.appendChild(newButton);
}

/**
 *
 * @param mod the mod
 * @param width width of mod
 */
function createWarning(mod, width) {
    const { popout } = mod.controls;
    function showPopout(e) {
        popout.show(
            {
                x: width + 8,
                y: 8,
                autoClose: false,
                alignment: "Right",
                onChange: popoutChangeHandler
            },
            popoutContent
        );
    }

    const { section } = popout;
    const { button } = popout.components;
    const popoutContent = () => [
        section({
            heading: "Not selecting (Row Number) might lead to unwanted behavior",
            children: [button({ text: "Reset", name: "buttonReset" })]
        })
    ];
    function popoutChangeHandler() {
        mod.visualization.axis("Card by").setExpression("<baserowid()>");
    }

    showPopout();
}