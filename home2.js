// TEMPLATES
var VCARD = `<div class="video-card">
  <div class="video-meta">
    <div class="video-title">{title}</div>
    <div class="video-author">{author}</div>
  </div>
  <div class="video-meta m-sub">
    <div class="video-views">{views} loops</div>
  </div>
  <div class="video-thumb" style="background-image: url('{thumb}')"></div>
</div>
`;
var VCARD_SKEL = `
<div class="video-card skel"></div>
`
var FEATURED_CLASS = ' featured-thymes';
var VROW = `<div class="row-header">{title}<span class="sub-heading">{sub}</span></div>
<div id="{r-id}" class="video-row{featured}">
  <div class="vbtn vbt-l"><i class="fa fa-chevron-left"></i></div>
  <div id="{c-id}"></div>
  <div class="vbtn vbt-r"><i class="fa fa-chevron-right"></i></div>
</div>
`;
var VROW_SKEL = `<span id="{id}"><div class="row-header skel"><span class="sub-heading"></span></div>
<div class="video-row skel{featured}">
  <div class="vbtn vbt-l skel"><i class="fa fa-chevron-left"></i></div>
  <div id="{c-id}"></div>
  <div class="vbtn vbt-r skel"><i class="fa fa-chevron-right"></i></div>
</div><span>
`;

// API
function request_new_row(num) {
  // Request row #num from the b/e
  return {'title': 'Title', 'sub': 'Sub title', 'is_featured': false, 'key': num};
}
function request_row(key, items, offset) {
  // Request row data from the b/e
  let cards = [];
  for (i=0; i<items; i++) {
    let w = Math.floor(Math.random() * 500 + 500);
    let h = Math.floor(Math.random() * 500 + 500);
//    w = key * 100;
    let type = key % 2 == 0 ? 'animals' : 'tech'
    let img = `//placeimg.com/${w}/${h}/${type}`;
    cards.push({'title': 'Title', 'author': 'Author', 'views': 'Views', 'id': '---', 'thumb': img});
  }
  return cards;
}


// CODE
var TARGET_WIDTH = 300;

function randId() {
     return Math.random().toString(36).substr(2, 10);
}

function load_row(row_elem, title, sub, is_featured, key, count, displayed_count) {
  (function (img, cards, ids, loaded, replaced_row, $new_row) {
    let row_dat = request_row(key, count, 0);

    for (let i=0; i<count; i++) {
      img = new Image();
      let url = row_dat[i]['thumb']

      let parent = $(this);
      let rd = row_dat[i];
      let c_num = i;
      $('<img/>').attr('src', url).on('load', function() {
        $(this).remove();

        let t_id = randId();
        let $c = $(VCARD.replace('{title}',  rd['title'])
                        .replace('{author}', rd['author'])
                        .replace('{views}',  rd['views'])
                        .replace('{t-id}',   t_id)
                        .replace('{thumb}',  url));

        cards.push($c);
        loaded ++;

        if (!replaced_row) {
          replaced_row = true;

          let c_id = randId();
          let r_id = randId();
          let $row = $(VROW.replace('{title}',    title)
                           .replace('{sub}',      sub)
                           .replace('{featured}', is_featured ? FEATURED_CLASS : '')
                           .replace('{r-id}',     r_id)
                           .replace('{c-id}',     c_id));
          row_elem.animate({'opacity': '0'}, 100, function () {
            row_elem.replaceWith($row);
            $('#' + c_id).parent().replaceWith(row_elem.children('.video-row').first());
            $row.animate({'opacity': '1'}, 200);
          });

          $new_row = row_elem.children('.video-row').first();
          $new_row.removeClass('skel');
          $new_row.css('opacity', '1');
        }

        let $card = $new_row.children('.video-card').eq(c_num).first();
        if (c_num >= displayed_count) {
          $c.hide();
          $card.replaceWith($c);
        } else {
          $card.animate({'opacity': '0'}, 100, function () {
            $card.replaceWith($c);
            $c.animate({'opacity': '1'}, 200);
          });
        }

        /*
        if (loaded == count) {
          let c_id = randId();
          let $row = $(VROW.replace('{title}',    title)
                           .replace('{sub}',      sub)
                           .replace('{featured}', is_featured ? FEATURED_CLASS : '')
                           .replace('{c-id}',     c_id));

          row_elem.animate({'opacity': '0'}, 100, function () {
            row_elem.replaceWith($row);
            $('#' + c_id).replaceWith(cards);
            $row.animate({'opacity': '1'}, 50);
          });
        }*/
      });
    }
  })(null, [], [], 0, false, null);
}

function add_row(num) {
  let row_dat = request_new_row(num);

  let body = $("#body-content");

  let displayed_count = Math.floor(body.width() / TARGET_WIDTH);
  let count = 10;

  let cards = [];
  for (let i=0; i<count; i++) {
    let $c = $(VCARD_SKEL);
    if (i >= displayed_count) {
      $c.hide();
    }
    cards.push($c);
  }
  let c_id = randId();
  let $row = $(VROW_SKEL.replace('{id}',       row_dat['key'])
                        .replace('{featured}', row_dat['is_featured'] ? FEATURED_CLASS : '')
                        .replace('{c-id}',     c_id));

  body.append($row);
  $('#' + c_id).replaceWith(cards);

  setTimeout(function(){load_row($row, row_dat['title'], row_dat['sub'], row_dat['is_featured'], row_dat['key'], count, displayed_count)}, 0)

  return num + 1;
}

$().ready(function () {
  for (let i=0; i<50; i++) {
    setTimeout(function(){add_row(i);}, 0);
  }
});
