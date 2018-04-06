let search_open = false;
let API_URL = "";
let BASE = "/";
let FULL_URL = API_URL + BASE;
let ip;


function getIP(after) {
    if (ip) { return after(ip); }

    $.ajax({
        dataType: "json",
        url: FULL_URL + "auth/getip",
        data: {},
        success: function(data) {
            ip = data['ip'];
            after(data['ip']);
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
        });
    });
}
function register(username, password, email, after) {
    let endpoint = "auth/register";
    getNonce(endpoint, function(nonce) {
        let c = md5(nonce + password + username + email);
        $.post({
            dataType: "json",
            url: FULL_URL + endpoint,
            data: {
                n: nonce,
                u: username,
                p: password,
                e: email,
                c: c
            },
            success: function(data, _, xhr) {
                after(data, xhr.status);
            },
            error: function(xhr) {
                after(xhr.responseJSON, xhr.status);
            }
        });
    });
}
function login(email, password, after) {
    let endpoint = "auth/login";
    getNonce(endpoint, function(nonce) {
        let c = md5(nonce + password + email);
        $.post({
            dataType: "json",
            url: FULL_URL + endpoint,
            data: {
                n: nonce,
                p: password,
                e: email,
                c: c
            },
            success: function(data, _, xhr) {
                after(data, xhr.status);
            },
            error: function(xhr) {
                after(xhr.responseJSON, xhr.status);
            }
        });
    });
}
getIP(function(){});


$(function() {
    let clickH = "mousedown tap";

    $("div").on(clickH, "#search-toggle", function(e) {
        let size = search_open ? '0' : '50px';
        $("#search-grow").css({height: size});
        $("#s-bar").css({top: size});
        $("#search-toggle").toggleClass("active");
        search_open = !search_open;
        e.stopImmediatePropagation();
    }).on(clickH, ".mini-show-more", function() {
        let $dblock = $(this).parent().parent().children(".description").first().children(".more").first();
        if ($dblock.is(":visible")) {
            $dblock.hide();
            $(this).text("SHOW MORE");
        } else {
            $dblock.show();
            $(this).text("SHOW LESS");
        }
    });
});
