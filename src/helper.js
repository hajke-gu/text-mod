function truncateString(dataValue, maxLength) {
    // Slice at maxLength minus 3 to really return maxLength characters
    return dataValue.slice(0, maxLength - 3) + "...";
}

function configureMouseOver(divObject, borderDiv, fontStyling, row, tooltipEnabled, mod, annotationEnabled) {
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
    rows.sort(function (a, b) {
        let sortValueA = a.categorical("Sorting").value()[0].key;
        let sortValueB = b.categorical("Sorting").value()[0].key;

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
 *
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
