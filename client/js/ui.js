// make the two tables scroll together
$('.linked-scroll').scroll(function(){
    $('.linked-scroll').scrollLeft($(this).scrollLeft());    
});

// highlight column and row
$("table").delegate('td','mouseover mouseleave', function(e) {
    if (e.type == 'mouseover') {
      $(this).parent().addClass("sequence-hover");
      $("colgroup").eq($(this).index()).addClass("sequence-hover");
    }
    else {
      $(this).parent().removeClass("sequence-hover");
      $("colgroup").eq($(this).index()).removeClass("sequence-hover");
    }
});

var hello = "world";