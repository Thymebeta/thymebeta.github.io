$(function (){
    let search = location.search.substring(1);
    let url_param = {};
    if (search) {
        url_param = JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function (key, value) {
            return key === "" ? value : decodeURIComponent(value)
        })
    }

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
                if (data["err"]) {
                    $("#login-box").removeClass("disabled");
                    $("#login-box *").prop("disabled", false);
                    $("#error").text(data["err"]).show().effect("shake", {distance: 2});
                } else {
                    localStorage.setItem('loggedIn', data['user']);

                    if (url_param.redirect) {
                        window.location.href = url_param.redirect;
                    } else {
                        window.location.href = '/';
                    }
                }
            });
        } else if (mode === 1) {
            if ($r_pwd.val() !== $r_pwd2.val()) {
                $("#error").text("Passwords don't match.").show().effect("shake", {distance: 2});
            } else {
                $("#login-box").addClass("disabled");
                $("#login-box *").prop("disabled", true);

                register($r_uname.val(), $r_pwd.val(), $r_email.val(), function (data) {
                    if (data["err"]) {
                        $("#login-box").removeClass("disabled");
                        $("#login-box *").prop("disabled", false);
                        $("#error").text(data["err"]).show().effect("shake", {distance: 2});
                    } else {
                        login($r_email.val(), $r_pwd.val(), function() {
                            localStorage.setItem('loggedIn', data['user']);

                            if (url_param.redirect) {
                                window.location.href = url_param.redirect;
                            } else {
                                window.location.href = '/';
                            }
                        });
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