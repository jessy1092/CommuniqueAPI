var config     = require('./config');
var fs         = require('fs');
var Hackpad    = require('hackpad');
var htmlparser = require('htmlparser2');

var app = exports = module.exports = {}

var hackpadClient;

app.init = function(){
    hackpadClient = new Hackpad(config.hackpad.client, config.hackpad.secret, config.hackpad);
    // this.defaultConfig();
}

/**
 * Parse Communique's Html format.
 * @param  {String} year
 * @param  {String} padID
 * @param  {String} result
 */
function runParser(year, padID, result){

    var dateTag       = 0;
    var urlTag        = 0;
    var contentTag    = 0;
    var urlSearchTag  = 0;

    var url  = {'name': '', 'url': ''};
    var urls = [];
    var tags = [];
    var item = {'date': '','padID': config.pads[0].IdList[0],'Tags': tags, 'content': '', 'urls': urls};
    var date = '';

    parser = new htmlparser.Parser({
        onopentag: function (name, attribs) {
            // console.log("opentag " + name);
            switch (name)
            {
                case 'p':
                    dateTag == 0 ? dateTag++:dateTag;
                    break;
                case 'b':
                    dateTag == 1 ? dateTag++:dateTag;
                    break;
                case 'a':
                    urlTag++;
                    url  = {'name': '', 'url': ''};
                    url['url'] = attribs['href'];
                    // console.log(url['url']);
                    break;
                case 'ul':
                    contentTag == 0 ? contentTag++:contentTag;
                    break;
                case 'li':
                    if (contentTag == 1)
                    {
                        urls = [];
                        tags = [];
                        item = {'date': '','padID': config.pads[0].IdList[0],'Tags': tags, 'content': '', 'urls': urls};
                        contentTag++;
                    }
                    break;
                default:
                    break;
            }
            console.log("opentag " + name + dateTag);
        },
        ontext: function (text) {
            text = text.replace("&nbsp;", ' ');
            console.log("text " + text);
            if (dateTag == 2 && text.match(/\d{2}\/\d{2}/))         // parse date
            {
                console.log("match date", text);
                date = year + "\/" + text;
            }
            else if (contentTag > 0 && date != '')                  // parse content
            {
                // var textTmp;
                if (text.indexOf("#") >= 0)                         // parse Tag list
                {
                    var tmpList = text.split("#");
                    tagList = tmpList.splice(1);
                    text = tmpList[0];
                    if (tagList[tagList.length - 1] == '')          // parse #<a href=xxx>Tag</a>
                    {
                        tagList.pop();
                        urlSearchTag = 1;
                    }
                    tags = tags.concat(tagList);
                    item['Tags'] = tags;
                    console.log("add Tag: " + tags);
                }
                // item['content'] += text;
                // console.log(item['content']);
                if(urlTag > 0)                                      // parse url
                {
                    if (urlSearchTag != 1)
                    {
                        item['content'] += text;
                        if (text != '')                             // parse <a href=xxx>#Tag</a>
                        {
                            url['name'] = text;
                            urls.push(url);
                        }
                        // console.log(urls[0].name);
                    }
                    else
                    {
                        urlSearchTag = 0;
                        tags.push(text);
                    }
                }
                else
                {
                    item['content'] += text;
                }
            }
        },
        onclosetag: function (tagname) {
            // console.log("closetag " + tagname);
            switch (tagname)
            {
                case 'p':
                    dateTag == 1 ? dateTag--:dateTag;
                    break;
                case 'b':
                    dateTag == 2 ? dateTag--:dateTag;
                    break;
                case 'a':
                    urlTag--;
                    break;
                case 'ul':
                    contentTag == 1 ? contentTag--:contentTag;
                    break;
                case 'li':
                    if (contentTag == 2)
                    {
                        item['date'] = date;
                        console.log(item);
                        contentTag--;
                    }

                    break;
                default:
                    break;
            }
            console.log("closetag " + tagname+dateTag);
        }
    });
    parser.write(result);

    parser.end();
};


/**
 * Get the communique from hackpad by hackpad api.
 */
app.run = function(){
    config.pads.forEach(function (pad){
        var year = pad.Year;

        pad.IdList.forEach(function (ID) {
            hackpadClient.export(ID, "latest", "html", function (err, result) {
                console.log(ID);
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    fs.writeFile(ID + '.html', result, 'utf-8', function(err){
                        if (err)
                        {
                            console.log(err);
                        }
                    });
                    // parser.write(result);
                    // parser.end();
                    runParser(year, ID, result);
                }
            });
        });
    });
};

