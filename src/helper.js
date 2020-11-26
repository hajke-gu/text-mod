/**
 * Truncates string
 * @param {*} dataValue the actual string
 * @param {*} maxLength max length of string
 */
function truncateString(dataValue, maxLength) {
    // Slice at maxLength minus 3 to really return maxLength characters
    return dataValue.slice(0, maxLength - 3) + "...";
}

/**
 * Configures mouse over
 * @param {*} divObject
 * @param {*} borderDiv
 * @param {*} fontStyling
 * @param {*} row
 * @param {*} tooltipEnabled
 * @param {*} mod
 * @param {*} annotationEnabled
 */
function configureMouseOver(divObject, borderDiv, fontStyling, row, tooltipEnabled, mod, annotationEnabled) {
    // mouse over text card event listener
    divObject.textCardDiv.onmouseenter = (e) => {
        borderDiv.style.boxShadow = "0 0 0 1px " + fontStyling.fontColor;
        createCopyButton(divObject.textCardDiv, fontStyling.fontColor);
    };

    // mouse leave text card event listener
    divObject.textCardDiv.onmouseleave = (e) => {
        borderDiv.style.boxShadow = "";

        var button = document.getElementById("img-button");
        divObject.textCardDiv.removeChild(button);
    };

    // mouse over text card content event listener
    divObject.content.onmouseenter = (e) => {
        if (tooltipEnabled) {
            var tooltipString = createTooltipString(row, "Tooltip");
            mod.controls.tooltip.show(tooltipString);
        }
    };

    divObject.content.onmouseleave = (e) => {
        if (tooltipEnabled) mod.controls.tooltip.hide();
    };

    // mouse over for annotation event listener
    if (annotationEnabled) {
        divObject.header.onmouseenter = (e) => {
            var tooltipString = createTooltipString(row, "Annotation");
            mod.controls.tooltip.show(tooltipString);
        };

        divObject.header.onmouseleave = (e) => {
            mod.controls.tooltip.hide();
        };
    }
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
 * Sort rows
 * @param {*} rows
 */
function sortRows(rows) {
    let length = rows[0].categorical("Sorting").value().length;
    rows.sort(function (a, b) {
        let sortValueA = a.categorical("Sorting").value()[0].key;
        let sortValueB = b.categorical("Sorting").value()[0].key;

        for (let i = 1; i < length; i++) {
            if (sortValueA == sortValueB) {
                console.log("!");
                sortValueA = a.categorical("Sorting").value()[i].key;
                sortValueB = b.categorical("Sorting").value()[i].key;
            } else {
                i = length;
            }
        }

        if (!isNaN(Number(sortValueA)) && !isNaN(Number(sortValueB))) {
            sortValueA = Number(sortValueA);
            sortValueB = Number(sortValueB);

            if (sortValueA < sortValueB) return -1;

            if (sortValueA > sortValueB) return 1;

            return 0;
        } else {
            if (sortValueA == null) sortValueA = "";
            if (sortValueB == null) sortValueB = "";
            return sortValueA.localeCompare(sortValueB);
        }
    });
}

/**
 * Get text from text card to clipboard
 * @param text Text is the value that the user has chosen, either through selection or copy entire text card
 */
function textToClipboard(text) {
    var temporaryCopyElement = document.createElement("textarea");
    document.body.appendChild(temporaryCopyElement);
    temporaryCopyElement.value = text;
    temporaryCopyElement.select();
    document.execCommand("copy");
    document.body.removeChild(temporaryCopyElement);
}

/**
 * Find element in dom
 * @param selector Selector as string to search for in dom
 * @returns {HTMLElement}
 */
function findElem(selector) {
    return document.querySelector(selector);
}

/**
 * Get selected text
 * @param selector Selector as string to search for in dom
 * @returns {String}
 */
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
    return selectedText;
}

/**
 * Get name of column from data table
 * @param element The row that will be used to get the specific column name
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

/**
 * Get data value from row
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
