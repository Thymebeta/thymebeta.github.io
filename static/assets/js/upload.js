$(function() {
    // TODO: DO NOT LEAVE mp3 IN PROD CODE
    let FORMATS = ["mov", "mpeg4", "mp4", "avi", "wmv", "mpegps", "flv", "3gpp", "webm", "mp3"];

    let clickH = "mousedown tap";
    let upload_perc = 0;
    let target_file = undefined;
    let do_change = true;

    $("#upload-region").on("drop", function (e) {
        target_file = e.originalEvent.dataTransfer.files[0];

        if (FORMATS.indexOf(target_file.name.split('.').slice(-1)[0]) === -1) {
            $("#ml-name").text(target_file.name + " is an invalid file.");
        } else {
            $("#ml-name").text(target_file.name + " selected");
            $("#continue-btn").removeClass("disabled");
        }

        e.preventDefault();
        return false;
    }).on("dragover", function (e) {
        e.preventDefault();
        return false;
    }).on("dragend", function (e) {
        e.preventDefault();
        return false;
    });

    $("#ml-ico, #ml-cap, #ml-sub").on(clickH, function (e) {
        $("#file-upload").trigger("click");

        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
    });

    $("#file-upload").on("change", function () {
        if (!do_change) { return; }

        let file = this.files[0];

        if (FORMATS.indexOf(file.name.split('.').slice(-1)[0]) === -1) {
            $("#ml-name").text(file.name + " is an invalid file.");
        } else {
            $("#ml-name").text(file.name + " selected");
            $("#continue-btn").removeClass("disabled");
        }
        target_file = file;
    });
    $("div").on(clickH, "#continue-btn:not(.disabled)", function (e) {
        $("#central-column").css({"max-width": "100%"});
        $("#upload-region").css({"min-height": "100%", "height": "100%"});
        $("#title").val(target_file.name);

        $("#upload-bar>span").text(target_file.name + " | Pending");
        $("#u-bar-progress").css({"width": "0"});

        $.ajax({
            type: 'POST',
            dataType: "json",
            url: "/upload",
            data: {},
            success: function (data) {
                let url = data['url'];
                let key = data['key'];
                do_change = false;

                $("#video-result-url").text(url).attr("href", url);
                $("#sb-sub").fadeIn();

                console.log('/upload/' + key + '?f=' + target_file.name.split('.').slice(-1)[0]);
                $('#file-upload').fileupload({
                    dataType: 'json',
                    maxChunkSize: 10000000, // 1 kB
                    type: 'POST',
                    url: '/upload/' + key + '?f=' + target_file.name.split('.').slice(-1)[0],
                    progressall: function (evt, data) {
                        upload_perc = parseInt(data.loaded / data.total * 100, 10);

                        $("#u-bar-progress").css({"width": upload_perc + "%"})
                            .text(target_file.name + " | " + upload_perc + "%");
                        $("#upload-bar>span").text(target_file.name + " | " + upload_perc + "%");
                    }
                }).fileupload('send', {files: [target_file]}).success(function(result) {
                    alert("Upload finished.");
                }).error(function(_, e) {
                    console.log(e)
                    $("#upload-bar>span").text(target_file.name + " | Failed");
                    $("#u-bar-progress").css({"width": "0"});
                });
            },
            error: function () {
                $("#upload-bar>span").text(target_file.name + " | Failed");
            }
        });

        /*$.ajax({
            type: 'POST',
            dataType: "json",
            url: "/upload",
            data: {},
            success: function(data) {
                let url = data['url'];
                let key = data['key'];

                $("#video-result-url").text(url).attr("href", url);
                $("#sb-sub").fadeIn();

                let reader = new FileReader();
                reader.onload = function() {
                    let arrayBuffer = reader.result;

                    $.ajax({
                        url: '/upload?key=' + key + '&f=' + target_file.name.split('.').slice(-1)[0],
                        type: 'PUT',
                        contentType: target_file.type,
                        data: arrayBuffer,
                        processData: false,
                        xhr: function() {
                            let xhr = new window.XMLHttpRequest();
                            xhr.upload.addEventListener("progress", function(evt){
                                if (evt.lengthComputable) {
                                    upload_perc = parseInt( parseFloat(evt.loaded / evt.total) * 100);

                                    $("#u-bar-progress").css({"width": upload_perc + "%"})
                                        .text(target_file.name + " | " + upload_perc + "%");
                                    $("#upload-bar>span").text(target_file.name + " | " + upload_perc + "%");
                                }
                            }, false);
                            return xhr;
                        },
                        success: function(result) {
                            alert("Upload finished.");
                        },
                        error: function() {
                            $("#upload-bar>span").text(target_file.name + " | Failed");
                            $("#u-bar-progress").css({"width": "0"});
                        }
                    });
                };
                reader.readAsArrayBuffer(target_file);
            },
            error: function() {
                $("#upload-bar>span").text(target_file.name + " | Failed");
            }
        });*/


        $("#middle-logo").fadeOut(500);
        $("#uploading").fadeIn(500);

        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
    });

    function listTags() {
        let tags = [];
        $(".tag").each(function () {
            let text = $(this).text();
            tags.push(text.substring(0, text.length - 1))
        });
        return tags;
    }

    $("#current-tag").on("keydown", function (e) {
        let tags = $("#tags");
        if (e.keyCode === 8) {
            if (this.selectionStart === 0 && this.selectionEnd === 0) {
                let child = tags.children(".tag").last();
                if (child) {
                    let text = child.text();
                    text = text.substring(0, text.length - 1);

                    $(this).val(text + $(this).val());
                    this.setSelectionRange(text.length, text.length);
                    child.remove()
                }
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        } else if (e.keyCode === 13 || e.key === "\n" || e.keyCode === 188 || e.key === ",") {
            let val = $(this).val().replace(/^\s+|\s+$/g, '');
            if (val && listTags().indexOf(val) === -1) {
                $("<span class=\"tag\">" + val + "<span class=\"tag-close\">×</span></span>")
                    .insertBefore('#tags>input');
            }
            $(this).val("");
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    });
    $(document).on(clickH, ".tag-close", function () {
        $(this).parent().remove();
    });

    $("#details-tab").on(clickH, function () {
        $("#privacy-dd").hide();
        $("#license-dd").hide();

        $("#title").show();
        $("#description").show();
        $("#tags").show();
        $("#details-tab").addClass("active");
        $("#privacy-tab").removeClass("active");
    });
    $('#file-upload').fileupload({
        dataType: 'json',
        done: function (e, data) {
            $.each(data.result.files, function (index, file) {
                $('<p/>').text(file.name).appendTo(document.body);
            });
        }
    });
    $("#privacy-tab").on(clickH, function () {
        $("#privacy-dd").show();
        $("#license-dd").show();
        $("#title").hide();
        $("#description").hide();
        $("#tags").hide();
        $("#details-tab").removeClass("active");
        $("#privacy-tab").addClass("active");
    });
});
