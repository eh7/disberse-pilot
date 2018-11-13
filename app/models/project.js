var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('projects', new Schema({ 
    name: String,
    code: String,
    owner_address: String,
    amount: Number,
    currency: String,
    project_key: String,
    project_ref: String,
    user_id: String,
    status: String,
    addresses: [{type: String}],
    date: { type: Date, default: Date.now },
}));

