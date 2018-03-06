$().ready(function() {
    $(".comment-tog").text("SHOW COMMENTS");
    $(".comments").hide();

    $(".comments-tog").click(function() {
        var $cblock = $(this).parent().children(".comments").first();
        if ($cblock.is(":visible")) {
            $cblock.hide();
            $(this).text("SHOW COMMENTS");
        } else {
            $cblock.show();
            $(this).text("HIDE COMMENTS");
        }
    });
});