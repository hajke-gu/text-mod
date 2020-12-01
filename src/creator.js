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
            var dataValue = annotation[i].formattedValue(); // get annotation value

            if (annotation[i].key !== null) {
                // check if annotation has value

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
        var dataValue = specificRow.categorical(tooltipContent).value()[i].formattedValue();

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

/**
 * Create copy button for the text card
 * @param newDiv The div / text card to have the new button
 * @param buttonColor Color of button
 */
function createSortButton(newDiv, buttonColor, sortOrder) {
    // create element
    var newButton = document.createElement("svg");

    newButton.title = "Sorted in " + sortOrder.value() + "ending order";
    newButton.setAttribute("id", "img-button-sort");

    // gets and creates svg
    var svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgNode.setAttributeNS(null, "width", "16");
    svgNode.setAttributeNS(null, "height", "16");
    svgNode.setAttributeNS(null, "viewBox", "0 0 16 16");
    // set 60% opacity of font color
    svgNode.setAttributeNS(null, "fill", buttonColor + "99");

    if (sortOrder.value() == "asc") {
        // sort symbol for ascending
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttributeNS(
            null,
            "d",
            "M4.34847 0.641433C4.15044 0.44898 3.83389 0.453502 3.64143 0.651533L0.505229 3.87864C0.312776 4.07667 0.317298 4.39322 0.515329 4.58568C0.713361 4.77813 1.02991 4.77361 1.22236 4.57558L4.0101 1.70703L6.87864 4.49477C7.07667 4.68722 7.39322 4.6827 7.58568 4.48467C7.77813 4.28664 7.77361 3.97009 7.57558 3.77764L4.34847 0.641433ZM4.69995 14.9929L4.49995 0.992858L3.50005 1.00714L3.70005 15.0071L4.69995 14.9929Z"
        );
        svgNode.appendChild(path);

        for (let i = 0; i < 4; i++) {
            let widths = ["3", "4", "5", "6"];
            let ys = ["13.5", "9.5", "5.5", "1.5"];
            let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttributeNS(null, "x", "9.5");
            rect.setAttributeNS(null, "y", ys[i]);
            rect.setAttributeNS(null, "width", widths[i]);
            rect.setAttributeNS(null, "height", "1");
            rect.setAttributeNS(null, "rx", "0.5");
            svgNode.appendChild(rect);
        }
    } else {
        // sort symbol for descending
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttributeNS(
            null,
            "d",
            "M3.74645 14.3543C3.94171 14.5495 4.25829 14.5495 4.45355 14.3543L7.63553 11.1723C7.8308 10.977 7.8308 10.6604 7.63553 10.4652C7.44027 10.2699 7.12369 10.2699 6.92843 10.4652L4.1 13.2936L1.27157 10.4652C1.07631 10.2699 0.759729 10.2699 0.564466 10.4652C0.369204 10.6604 0.369204 10.977 0.564466 11.1723L3.74645 14.3543ZM3.6 -0.000714123L3.6 14.0007H4.6L4.6 -0.000714123L3.6 -0.000714123Z"
        );
        svgNode.appendChild(path);

        for (let i = 0; i < 4; i++) {
            let widths = ["3", "4", "5", "6"];
            //let ys = ["13.5", "9.5", "5.5", "1.5"];
            let ys = ["1.5", "5.5", "9.5", "13.5"];
            let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttributeNS(null, "x", "9.5");
            rect.setAttributeNS(null, "y", ys[i]);
            rect.setAttributeNS(null, "width", widths[i]);
            rect.setAttributeNS(null, "height", "1");
            rect.setAttributeNS(null, "rx", "0.5");
            svgNode.appendChild(rect);
        }
    }
    // set 80 % opacity of font color
    newButton.onmouseover = (e) => {
        svgNode.setAttributeNS(null, "fill", buttonColor + "CC");
    };

    newButton.onmousedown = (e) => {
        svgNode.setAttributeNS(null, "fill", buttonColor);

        if (sortOrder.value() == "asc") sortOrder.set("desc");
        else sortOrder.set("asc");

        e.stopPropagation();
    };
    // set 80 % opacity of font color
    newButton.onmouseup = (e) => {
        svgNode.setAttributeNS(null, "fill", buttonColor + "CC");
        e.stopPropagation();
    };
    // set60% opacity of font color
    newButton.onmouseleave = (e) => {
        svgNode.setAttributeNS(null, "fill", buttonColor + "99");
    };

    newButton.appendChild(svgNode);
    newDiv.appendChild(newButton);
}
