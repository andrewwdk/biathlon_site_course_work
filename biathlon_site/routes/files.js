var fs = require('fs');
var deasync = require('deasync');
var handlebars = require('handlebars');

var readHtml = (path) => {
    var result;
    var done = false;

    fs.readFile(path, null, (error, data) => {
        if(error){
            console.log('File not found')
        }else{
            result = data.toString();
        }
        done = true;
    });

    while(!done)
    {
         deasync.runLoopOnce();
    }

    return handlebars.compile(result);
}

module.exports.readHtml = readHtml;