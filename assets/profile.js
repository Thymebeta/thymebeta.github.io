$(function() {
    var clickH = "mousedown tap";

    var board_open = !1;

    $("div").on(clickH, "#board-toggle", function(e) {
        var size = board_open ? '100%' : '20%';
        $("#rhs").css({left: size});
        $("#board-toggle").toggleClass("active");
        board_open = !board_open;
        e.stopImmediatePropagation();
    })
});