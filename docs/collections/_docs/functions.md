## main.js
- Spotfire.initialize
  - render((dataView, windowSize, contentProp, sortingProp, cardbyProp)

## creator.js
- createTextCard(content, annotation, windowSize, markObject, fontStyling, lineDividerColor)
- createTooltipString(specificRow, tooltipContent)
- createTextCardContentParagraph(windowSize, content, fontStyling) 
- createHeaderContent(annotation) 
- createLineDividerInTextCard(lineColor) 
- createTextCardDiv(fontStyling) 
- createTextCardHeader() 
- createCopyButton(newDiv, buttonColor) 
- createWarning(mod, width)

## helper.js
- truncateString(dataValue, maxLength)
- configureMouseOver(divObject, borderDiv, fontStyling, row, tooltipEnabled, mod, annotationEnabled) 
- formatDate(date)
- isAllRowsMarked(rows)
- sortRows(rows)
- textToClipboard(text)
- findElem(selector)
- getSelectedText()
- getColumnName(element, string, index)
- getDataValue(element, string, index)

## render.js
- renderTextCards(rows, prevIndex, cardsToLoad, rerender, windowSize, mod, tooltipEnabled, annotationEnabled)
