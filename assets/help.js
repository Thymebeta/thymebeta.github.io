function ansiWordBound(c) {
    return (
        (' ' === c) ||
        ('\n' === c) ||
        ('\r' === c) ||
        ('\t' === c)
    )
}
function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}
function readingTime(text) {
    let words = 0, start = 0, end = text.length - 1, i;
    let wordsPerMinute = 200;

    while (ansiWordBound(text[start])) start++;
    while (ansiWordBound(text[end])) end--;

    for (i = start; i <= end;) {
        for (; i <= end && !ansiWordBound(text[i]); i++) {}
        words++;
        for (; i <= end && ansiWordBound(text[i]); i++) {}
    }

    let minutes = words / wordsPerMinute;
    let time = minutes * 60 * 1000;
    let displayed = Math.ceil(minutes.toFixed(2));

    return {
        text: displayed + ' min read',
        minutes: minutes,
        time: time,
        words: words
    }
}

$(function() {
    let article = $("#page-region");
    article.empty();

    $.ajax({
        url: "pages/" + getUrlParameter("pagec") + ".md",
        success: function(data) {
            let html_data = new showdown.Converter().makeHtml(data);
            article.append($(html_data).first());
            document.title = $(html_data).first().text() + " | Thyme Help";
            article.append($("<div id=\"metadata\">" + readingTime(data).text + " - Last edited 2018-04-03</div>"));
            article.append($(html_data).slice(1));
        }
    });
});