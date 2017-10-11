const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let tree = new Schema({
    url: String,
    data: String,
})


let Tree = mongoose.model('Tree', tree);
module.exports = Tree;