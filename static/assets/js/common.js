var search_open = false;
var API_URL = "http://127.0.0.1:8080";
var BASE = "/";
var FULL_URL = API_URL + BASE;


function getIP(after) {
    $.ajax({
        dataType: "json",
        url: FULL_URL + "auth/getip",
        data: {},
        success: function(data) {
            after(data["ip"]);
        }
    });
}
function getNonce(endpoint, after) {
    getIP(function(i) {
        let t = Math.round(+new Date()/1000);
        $.ajax({
            dataType: "json",
            url: FULL_URL + "auth/getnonce",
            data: {
                t: t,
                i: i,
                h: md5(t + i),
                e: BASE + endpoint
            },
            success: function(data) {
                after(data["nonce"]);
            }
        })
    });
}
function register(username, password, email, after) {
    let endpoint = "auth/register";
    getNonce(endpoint, function(nonce) {
        $.post({
            dataType: "json",
            url: FULL_URL + endpoint,
            data: {
                n: nonce,
                u: username,
                p: password,
                e: email,
                c: md5(nonce + password + username + email)
            },
            success: function(data) {
                after(data);
            }
        })
    });
}
function login(email, password, after) {
    let endpoint = "auth/login";
    getNonce(endpoint, function(nonce) {
        $.post({
            dataType: "json",
            url: FULL_URL + endpoint,
            data: {
                n: nonce,
                p: password,
                e: email,
                c: md5(nonce + password + email)
            },
            success: function(data) {
                after(data);
            }
        })
    });
}

//getIP(function(ip) {console.log(ip)});
//getNonce("auth", function(nonce) {console.log(nonce)});
//login("email", "paaass", function(d) {console.log(d)});

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