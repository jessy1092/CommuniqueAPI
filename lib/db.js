var mongodbClient = require('mongodb').MongoClient;
var url = 'mongodb://127.0.0.1:27017/Communique';

var app = exports = module.exports = {};

app.init = function () {
    mongodbClient.connect(url, function (err, db) {
        db.dropDatabase(function (err, result) {
            db.dropCollection('item', function (err, result) {
                db.createCollection('item', function (err, collection){
                    if (err) {
                        console.log('Create Error');
                    } else {
                        console.log('Create Successed');
                    }
                    db.close();
                });
            });
        });
    });
};

app.insertData = function (data) {
    mongodbClient.connect(url, function (err, db) {
        db.collection('item').insert(data, function (err, records) {
            if (err) {
                console.log('Insert Error');
            } else {
                // console.log("Insert Successed");
                console.log("Record added as", records[0]._id);
            }
            db.close();
        });
    });
};