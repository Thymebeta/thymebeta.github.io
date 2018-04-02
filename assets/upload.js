$(function() {
    let clickH = "mousedown tap";
    let upload_perc = 0;
    let target_file = undefined;

    $("#upload-region").on("drop", function (e) {
        target_file = e.originalEvent.dataTransfer.files[0];

        $("#ml-name").text(target_file.name + " selected");
        $("#continue-btn").removeClass("disabled");

        e.preventDefault();
        return false;
    }).on("dragover", function(e) {
        e.preventDefault();
        return false;
    }).on("dragend", function(e) {
        e.preventDefault();
        return false;
    });

    $("#ml-ico, #ml-cap, #ml-sub").on(clickH, function(e) {
        $("#file-upload").trigger("click");

        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
    });

    $("#file-upload").on("change", function() {
        let file = this.files[0];

        $("#ml-name").text(file.name + " selected");
        $("#continue-btn").removeClass("disabled");

        target_file = file;
    });
    $("div").on(clickH, ".btn:not(.disabled)", function(e) {
        $("#central-column").css({"max-width": "100%"});
        $("#upload-region").css({"min-height": "100%"});
        $("#title").val(target_file.name);

        $("#upload-bar>span").text("Uploading | 0%");
        $("#u-bar-progress").text("Uploading | 0%")
                            .css({"width": "0"});

        setInterval(function() {
            $("#u-bar-progress").css({"width": upload_perc + "%"})
                                .text(target_file.name + " | " + upload_perc + "%");
            $("#upload-bar>span").text(target_file.name + " | " + upload_perc + "%");
            upload_perc ++;
            upload_perc = Math.min(upload_perc, 100);
        }, 100);
        console.log("huh?");

        $("#middle-logo").fadeOut(500);
        $("#uploading").fadeIn(500);

        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
    });
});