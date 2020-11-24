/**
 * Render Text Cards
 * @param {*} rows All the rows from the dataset
 * @param {*} prevIndex Index of the previously rendered text card
 * @param {*} cardsToLoad Number of cards to render at one time
 * @param {*} rerender Boolean to check if the text cards needs to be rerendered
 * @param {*} windowSize WindowSize of the mod in pixels
 * @param {*} mod The mod object that will be used to add a tooltip using the "controls"
 * @returns {HTMLDocument}
 */
function renderTextCards(rows, prevIndex, cardsToLoad, rerender, windowSize, mod, tooltipEnabled, annotationEnabled) {
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

    // get and group styling attributes
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

    // customized scrollbar for Text Card and Text Card Container that is adjusting to the theme
    // hex color + "4D" = 30% opacitiy
    // hex color + "BF" = 75% opacity
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

    // check if all row are marked
    var allRowsMarked = isAllRowsMarked(rows);

    // create all text cards
    for (let index = startIndex; index < whatToLoad; index++) {
        if (index >= rows.length) {
            break;
        }

        // get value/content for the specifc card and handle date
        let textCardContent = getDataValue(rows[index], "Content", 0);
        if (getColumnName(rows[index], "Content", 0) === "Date")
            // date handling
            textCardContent = formatDate(new Date(Number(textCardContent)));

        // textCard not NULL or UNDEFINED
        if (textCardContent) {
            // create annotation
            var annotation = null;
            if (annotationEnabled) {
                annotation = rows[index].categorical("Annotation").value();
            }

            // get color from api to be used for the side bar of the card
            var color = rows[index].color().hexCode;

            // check if specific row are marked and add boolean for condition is all rows marked
            var markObject = {
                row: rows[index].isMarked(),
                allRows: allRowsMarked
            };

            // create border div
            let borderDiv = document.createElement("div");
            borderDiv.setAttribute("id", "text-card-border");

            // create the text card
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

            // create on click functionallity, select text and stiling
            newDiv.onmousedown = (event) => {
                var scrolling = true;
                let width = newDiv.getBoundingClientRect().width + 27;
                let height = newDiv.getBoundingClientRect().height;
                let maxHeight = windowSize.height * 0.5;

                // check if card could have scrollbar and check if clicking scrollbar
                if (height < maxHeight || width - event.clientX > 10) {
                    scrolling = false;
                }
                newDiv.onmouseup = function () {
                    if (!scrolling) {
                        var selectedText = getSelectedText();
                        if (selectedText === "" && event.button == 0) {
                            if (!event.ctrlKey) {
                                rows[index].mark("Replace");
                            } else {
                                rows[index].mark("Toggle");
                            }
                        }
                    }
                };
                event.stopPropagation();
            };
            // create mouse over functionallity & Border around card and tooltip
            configureMouseOver(divObject, borderDiv, fontStyling, rows[index], tooltipEnabled, mod, annotationEnabled);

            borderDiv.appendChild(newDiv);
            fragment.appendChild(borderDiv);
        }
    }
    if (!rerender || prevIndex === 0) {
        prevIndex = prevIndex + cardsToLoad;
    }

    var returnObject = { fragment, startIndex: prevIndex };
    return returnObject;
}
