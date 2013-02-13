// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
  console.log("New startup.");
  if (Alignments.find().count() === 0) {
    console.log("Building database.");

    // load json
    var require = __meteor_bootstrap__.require;
    var fs = require('fs');
    var colors_json = JSON.parse(fs.readFileSync('server/fixtures/colors.json', 'UTF8'));
    var sequences_json = JSON.parse(fs.readFileSync('server/fixtures/sequences.json', 'UTF8'));
    var char_filters_json = JSON.parse(fs.readFileSync('server/fixtures/char_filters.json', 'UTF8'));
    var bool_filters_json = JSON.parse(fs.readFileSync('server/fixtures/bool_filters.json', 'UTF8'));

    // populate Colors collection with PyMol default colors
    var array_to_rgb = function(val){
      val = val.map( function(item) { return Math.floor(item * 255);});
      return 'rgb('+val[0]+','+val[1]+','+val[2]+')';
    }
    for (var key in colors_json) {
      Colors.insert({
        name: key, 
        rgb_array: colors_json[key],
        rgb: array_to_rgb(colors_json[key])
      });
    }

    // populate Proteins collection
    var protein_id = Proteins.insert({
      name: 'beta-catenin'
    });

    // populate Alignments collection
    var alignment_id = Alignments.insert({
      name: 'beta-catenin',
      protein_id: protein_id
    });

    var MAX_CHAR = 150;
    var START = 200;

    var reference_sequence_id;
    // populate Sequences and AminoAcids collections
    for (var i = 0; i < sequences_json.length; i++) {
      var sequence_id = Sequences.insert({
        gb_id: sequences_json[i]['gb_id'],
        name: sequences_json[i]['name'],
        alignment_id: alignment_id,
        organism: sequences_json[i]['name'], // maybe change this to Collection
        is_reference: sequences_json[i]['reference'],
        content: sequences_json[i]['content'].split("").slice(START,START+MAX_CHAR),
        index: sequences_json[i]['index'],
        protein: 'beta-catenin'
      });
      if(sequences_json[i]['reference']) {
        reference_sequence_id = sequence_id;
      }
    }

    // populate CharacterFilters collection
    for (var i = 0; i < char_filters_json.length; i++) {
      CharacterFilters.insert({
        name: char_filters_json[i]['name'],
        content: char_filters_json[i]['content'].slice(START, START+MAX_CHAR),
        applied_on: [reference_sequence_id],
        alignment_id: alignment_id
      });
    }    

    // populate BooleanFilters collection
    for (var i = 0; i < bool_filters_json.length; i++) {
      BooleanFilters.insert({
        name: bool_filters_json[i]['name'],
        content: bool_filters_json[i]['content'].slice(START, START+MAX_CHAR),
        applied_on: [reference_sequence_id],
        alignment_id: alignment_id
      });
    }  
  }
});
