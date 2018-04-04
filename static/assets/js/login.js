$(function (){
    let $pwd = $("#pwd");
    let $uname = $("#uname");
    let $r_uname = $("#r-uname");
    let $r_email= $("#r-email");
    let $r_pwd= $("#r-pwd");
    let $r_pwd2= $("#r-pwd2");
    let mode = 0;
    $("#login-box").submit(function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (mode === 0) {
            $("#login-box").addClass("disabled");
            $("#login-box *").prop("disabled", true);

            login($uname.val(), $pwd.val(), function(data){
                $("#login-box").removeClass("disabled");
                $("#login-box *").prop("disabled", false);

                if (data["err"]) {
                    $("#error").text(data["err"]).show().effect("shake", {distance: 2});
                } else {
                    alert("Nice one");
                }
            });
        } else if (mode === 1) {
            if ($r_pwd.val() !== $r_pwd2.val()) {
                $("#error").text("Passwords don't match.").show().effect("shake", {distance: 2});
            } else {
                $("#login-box").addClass("disabled");
                $("#login-box *").prop("disabled", true);

                register($r_uname.val(), $r_pwd.val(), $r_email.val(), function (data) {
                    $("#login-box").removeClass("disabled");
                    $("#login-box *").prop("disabled", false);

                    if (data["err"]) {
                        $("#error").text(data["err"]).show().effect("shake", {distance: 2});
                    } else {
                        alert("Registered! Noice.");
                    }
                });
            }
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
        $("#error").hide();
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
        $("#error").hide();
        $(".si").hide();
        $(".r").hide();
        $(".pr").show();
        $("#r-link").text("Login");
        $("#top-lab").text("Reset Password");
        mode = 2;
    });
});