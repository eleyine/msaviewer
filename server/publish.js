// Proteins -- {name: String}
Proteins = new Meteor.Collection("proteins");

// Publish complete set of lists to all clients.
Meteor.publish('proteins', function () {
  return Proteins.find();
});

// Colors -- {name: String}
Colors = new Meteor.Collection("colors");

// Publish complete set of lists to all clients.
Meteor.publish('colors', function () {
  return Colors.find();
});

// Alignments -- {name: String,
//                protein_id: String}
Alignments = new Meteor.Collection("alignments");

// Publish complete set of lists to all clients.
Meteor.publish('alignments', function () {
  return Alignments.find({}, {sort:{name:1}});
});

// Sequences -- {gb_id: String,
//               name: String,
//               alignment_id: String,
//               organism: String,
//               is_reference: Boolean,
//               content: String,
//               index: Integer }
Sequences = new Meteor.Collection("sequences");

// Publish all items for requested alignment_id
Meteor.publish('sequences', function (alignment_id) {
  return Sequences.find({alignment_id: alignment_id});
});

// Annotations -- {symbol: String,
//                sequence_id: String,
//                index: Integer,
//                annotation: String}
Annotations = new Meteor.Collection("annotations");

// Publish all items for requested sequence_id
Meteor.publish('annotations', function (sequence_id) {
  return Annotations.find({sequence_id: sequence_id});
});

// CharacterFilters -- {name: String,
//               content: [String, ...],
//               alignment_id: String,
//               applied_on: [String, ...]}
CharacterFilters = new Meteor.Collection("char_filters");

// Publish all items for requested alignment_id
Meteor.publish('char_filters', function (alignment_id) {
  return CharacterFilters.find({alignment_id: alignment_id});
});

// BooleanFilters -- {name: String,
//               content: [Boolean, ...],
//               alignment_id: String,
//               applied_on: String}
BooleanFilters = new Meteor.Collection("bool_filters");

// Publish all items for requested alignment_id
Meteor.publish('bool_filters', function (alignment_id) {
  return BooleanFilters.find({alignment_id: alignment_id});
});