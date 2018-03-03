$(function (){
    var $pwd = $("#pwd");
    var $uname = $("#uname");
    var mode = 0;
    $("#login-box").submit(function () {
        if (mode === 0) {
            $pwd.effect("shake", {distance: 2});
            $pwd.addClass("error");

            $uname.effect("shake", {distance: 2});
            $uname.addClass("error");
        }
        return false;
    });
    $pwd.keydown(function () {
        $pwd.removeClass("error");
    });
    $uname.keydown(function () {
        $uname.removeClass("error");
    });

    $("#r-link").click(function () {
        if (mode === 0) {
            $(".si").hide();
            $(".pr").hide();
            $(".r").show();
            $("#r-link").text("Login");
            $("#top-lab").text("Register to Thyme");
            mode = 1;
        } else {
            $(".si").show();
            $(".pr").hide();
            $(".r").hide();
            $("#r-link").text("Register");
            $("#top-lab").text("Login to Thyme");
            mode = 0;
        }
    });
    $("#reg-link").click(function () {
        $(".si").hide();
        $(".r").hide();
        $(".pr").show();
        $("#r-link").text("Login");
        $("#top-lab").text("Reset Password");
        mode = 2;
    });
});