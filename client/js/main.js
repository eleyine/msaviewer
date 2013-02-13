// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Alignments = new Meteor.Collection("alignments");
Colors = new Meteor.Collection("colors");
Sequences = new Meteor.Collection("sequences");
Proteins = new Meteor.Collection("proteins");
CharacterFilters = new Meteor.Collection("char_filters");
BooleanFilters = new Meteor.Collection("bool_filters");
Annotations = new Meteor.Collection("annotations");

// ID of currently selected alignment
Session.set('alignment_id', null);

// ID of currently selected sequence
Session.set('sequence_id', null);

// When editing a sequence name, ID of the sequence
Session.set('editing_sequencename', null);

// ID of currently selected filter
Session.set('filter_id', null);

// When editing a sequence name, ID of the sequence
Session.set('editing_filtername', null);

// Subscribe to 'alignments' collection on startup.
// Select an alignment once data has arrived.

Meteor.subscribe('alignments', function () {
  console.log('Subscribing to alignments');
  if (!Session.get('alignment_id')) {
    var alignment = Alignments.findOne({}, {sort: {name: 1}});
    if (alignment) {
      Router.setAlignment(alignment._id);
    }
  } 
});

Meteor.autosubscribe(function () {
  var alignment_id = Session.get('alignment_id');
  if (alignment_id) {
    Meteor.subscribe('sequences', alignment_id);
    Meteor.subscribe('char_filters', alignment_id);
    Meteor.subscribe('bool_filters', alignment_id);
    Sequences.find({alignment_id: alignment_id}).forEach( function(sequence) {
      Meteor.subscribe('annotations', sequence._id);
    });
    console.log('Autosubscriptions done');
  }
});

Meteor.subscribe('proteins');
Meteor.subscribe('colors');

////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };
  return events;
};

var activateInput = function (input) {
  input.focus();
  input.select();
};


////////// UI ////////////

// Use when content template has been rendered
var content_created = function () {

    // make the two tables scroll together
    $('.linked-scroll').scroll(function(){
        $('.linked-scroll').scrollLeft($(this).scrollLeft());    
    });

    // highlight column and row
    $("table").delegate('td.symbol','mouseover mouseleave', function(e) {
        if (e.type == 'mouseover') {
          $(this).parent().addClass("sequence-hover"); 
          var this_symbol = this;
          $("table.sequence-symbols").each(function() {
            $(this).children("colgroup").eq($(this_symbol).index()).addClass("sequence-hover");
          });
        } else {
          $(this).parent().removeClass("sequence-hover");
          var this_symbol = this;
          $("table.sequence-symbols").each(function() {
            $(this).children("colgroup").eq($(this_symbol).index()).removeClass("sequence-hover");
          });
        }
    });

};

// Use when color_input content has been rendered

var color_input_rendered = function () {
    console.log('color input rendered');

    var colorUpdater = function(inputColor) {
          $('#colorInputGroup > .add-on').css('background-color', Colors.findOne({name:inputColor}).rgb)
          return inputColor;
    };

    $('#colorInput').typeahead({ 
      source: _.pluck(Colors.find().fetch(), "name")
    });

    // $('#colorInput').bind('change', function(){
    //   var color = $(this).val();
    //   if (color in color_names) {
    //     $("#colorInput").closest(".control-group").removeClass("error");
    //     // $("#colorInput").closest(".control-group").children(".help-inline").css("display", "none");
    //   } else {
    //     console.log("invalid");
    //     $("#colorInput").closest(".control-group").addClass("error");
    //     // $("#colorInput").closest(".control-group").children(".help-inline").css("display", "");
    //   }
    //   console.log(color);
    // });
};

////////// Sequences //////////

Template.sequences.sequences = function () {
  var alignment_id = Session.get('alignment_id');
  if (!alignment_id) {
    console.log('alignment_id is not in Session');
    return {};
  }
  var sel= {alignment_id: alignment_id};
  return Sequences.find(sel, {sort: {index: 1}});
};

Template.sequences.events({
  'mousedown td.sequence-name': function (evt) { // select list
    Session.set('sequence_id', this._id);
  },
  'click td.sequence': function (evt) {
    // prevent clicks on <a> from refreshing the page.
    evt.preventDefault();
  },
  'dblclick td.sequence-name': function (evt, tmpl) { // start editing sequence name
    Session.set('editing_sequencename', this._id);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    var input = tmpl.find("#sequence-name-input");
    if (!input) {
      if (this)
        console.log("'This' is undefined.");
      else
        console.log("Unable to edit sequence ' + String(this.name) + '. Could not find '#sequence-name-input'");
    } else {
      activateInput(input);
    }
  }
});
// @TODO create new sequence

Template.sequences.events(okCancelEvents(
  '#sequence-name-input',
  {
    ok: function (value) {
      Sequences.update(this._id, {$set: {name: value}});
      Session.set('editing_sequencename', null);
    },
    cancel: function () {
      Session.set('editing_sequencename', null);
    }
  }));

Template.sequences.selected = function () {
  return Session.equals('sequence_id', this._id) ? 'selected' : '';
};

Template.sidebar.selected_sequence = function () {
  var info = Sequences.findOne({ _id: Session.get('sequence_id')});
  return {
    protein: info.protein,
    organism: info.organism,
    gb_id: info.gb_id,
    num_annotations: Annotations.find({sequence_id: info._id}).count(),
    num_char_filters: CharacterFilters.find({applied_on: info._id}).count(),
    num_bool_filters: BooleanFilters.find({applied_on: info._id}).count()
  };
};

Template.sidebar.helpers({
  display_sequence_info: function () {
    return !Session.equals('sequence_id', null);
  },
  display_filter_info: function () {
    return !Session.equals('filter_id', null);
  }
});

Template.sequences.reference = function () {
  return this.reference ? 'reference' : '';
};

Template.sequences.editing = function () {
  return Session.equals('editing_sequencename', this._id);
};

Template.sequences.symbols = function () {
  return this.content.map(function(symbol) {
    return {symbol: symbol};
  });
};

// @TODO find a more efficient way
Template.sequences.columns = function () {
  var alignment_id = Session.get('alignment_id');
  var sequence = Sequences.findOne({alignment_id:alignment_id});
  if (!alignment_id || sequence == undefined)
    return {};
  return Sequences.findOne({alignment_id:alignment_id}).content;
};

////////// Filters //////////

Template.filters.char_filters = function () {
  var alignment_id = Session.get('alignment_id');
  if (!alignment_id)
    return {};
  var sel= {alignment_id: alignment_id};
  return CharacterFilters.find(sel);
};

Template.filters.bool_filters = function () {
  var alignment_id = Session.get('alignment_id');
  if (!alignment_id)
    return {};
  var sel= {alignment_id: alignment_id};
  return BooleanFilters.find(sel);
};

Template.filters.events({
  'mousedown td.sequence-name': function (evt) { // select list
    Session.set('filter_id', this._id);
  },
  'click td.sequence': function (evt) {
    // prevent clicks on <a> from refreshing the page.
    evt.preventDefault();
  },
  'dblclick td.sequence-name': function (evt, tmpl) { // start editing sequence name
    Session.set('editing_filtername', this._id);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    var input = tmpl.find("#filter-name-input");
    if (!input) {
      if (this)
        console.log("'This' is undefined.");
      else
        console.log("Unable to edit sequence ' + String(this.name) + '. Could not find '#filter-name-input'");
    } else {
      activateInput(input);
    }
  }
});

Template.filters.events(okCancelEvents(
  '#filter-name-input',
  {
    ok: function (value) {
      Sequences.update(this._id, {$set: {name: value}});
      Session.set('editing_filtername', null);
    },
    cancel: function () {
      Session.set('editing_filtername', null);
    }
  }));

Template.filters.selected = function () {
  return Session.equals('filter_id', this._id) ? 'selected' : '';
};

Template.filters.editing = function () {
  return Session.equals('editing_filtername', this._id);
};

Template.filters.symbols = function () {
  return this.content.map(function(symbol) {
    return {symbol: symbol};
  });
};

// @TODO find a more efficient way to do this
Template.filters.columns = function () {
  var alignment_id = Session.get('alignment_id');
  var sequence = Sequences.findOne({alignment_id:alignment_id});
  if (!alignment_id || sequence == undefined)
    return {};
  return Sequences.findOne({alignment_id:alignment_id}).content;
};

Template.content.rendered = content_created;

////////// Filters //////////

Template.color_input.rendered = color_input_rendered;
Template.color_input.created = color_input_rendered;
Template.color_input.source = function () {
      return _.pluck(Colors.find().fetch(), "name");
};

Template.color_input.updater = function () {
    var color_value = $('#colorInput').val();
    var updated_color = Colors.findOne({name:color_value});
    console.log(color_value);
    if(updated_color != undefined) {
      $('#colorInputGroup > .add-on').css('background-color', updated_color.rgb);
      $("#colorInput").closest(".control-group").removeClass("error");
    } else {
      $("#colorInput").closest(".control-group").addClass("error");
    }
    return color_value;
}

////////// Tracking selected alignment in URL //////////

var AlignmentsRouter = Backbone.Router.extend({
  routes: {
    ":alignment_id": "main"
  },
  main: function (alignment_id) {
    Session.set("alignment_id", alignment_id);
  },
  setAlignment: function (alignment_id) {
    console.log("alignment_id in Session set to " + alignment_id);
    this.navigate(alignment_id, true);
  }
});

Router = new AlignmentsRouter;

Meteor.startup(function () {
   Backbone.history.start({pushState: true});
});
