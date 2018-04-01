var search_open = false;

$(function() {
    var clickH = "mousedown tap";

    $("div").on(clickH, "#search-toggle", function(e) {
        var size = search_open ? '0' : '50px';
        $("#search-grow").css({height: size});
        $("#s-bar").css({top: size});
        $("#search-toggle").toggleClass("active");
        search_open = !search_open;
        e.stopImmediatePropagation();
    }).on(clickH, ".mini-show-more", function() {
        var $dblock = $(this).parent().parent().children(".description").first().children(".more").first();
        if ($dblock.is(":visible")) {
            $dblock.hide();
            $(this).text("SHOW MORE");
        } else {
            $dblock.show();
            $(this).text("SHOW LESS");
        }
    });
});