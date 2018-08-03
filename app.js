const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
const rest = require('./utils/utils.js');

bot.on('ready', () => {
    console.log("I'm ready!");
});

bot.on('message', (message) => {
    let messageSenderWithDiscriminator = (message.author.username + "#" + message.author.discriminator);
    let messageFiltered = message.content.trim().replace(/[^a-z0-9 -]/ig, '');
    let wordArray = messageFiltered.split(" ");
    if ((messageSenderWithDiscriminator !== process.env[config.my_discord_username_with_discriminator]) && (wordArray.length >= 1) && (messageFiltered.length >= 1)) {
        let messageResponse = getMessageResponse(message, wordArray, messageFiltered);
    }
});

function getMessageResponse(discordMessageObj, wordArray, messageFiltered) {
    if ((wordArray.length >= 1) && (messageFiltered.length >= 1)) {
        let firstWord = wordArray[0].toLowerCase();
        switch(true) {
            case (firstWord == "define"):
                getOxfordDefinition(discordMessageObj, wordArray.slice(1).join(" "));
                break;
            case (firstWord == "udefine"):
                getUrbanDefinition(discordMessageObj, wordArray.slice(1).join(" "));
                break;
            case ((wordArray[0] == "urban") && (wordArray[1] == "define")):
                getUrbanDefinition(discordMessageObj, wordArray.slice(2).join(" "));
                break;
            case (firstWord == "gif" || firstWord == "giphy" || firstWord == "giffy"):
                getGiphy(discordMessageObj, wordArray.slice(1).join(" "));
                break;
            case (firstWord == "wiki"):
                getWiki(discordMessageObj, wordArray.slice(1).join(" "));
                break;
        }
    }else{
        return false;
    }
}

function getSmartResponse(discordMessageObj, wordArray){
    console.log("TODO");
}

function getWiki(discordMessageObj, searchString) {
    try{
        if (searchString && searchString.length >= 1) {

            let queryExtendedProps = "&prop=description&prop=extracts&exintro=1&explaintext=1&exsentences=5&format=json"

            let urlSearchString = encodeURI(searchString);
            let path = '/w/api.php?action=query&generator=search&gsrsearch=' + urlSearchString + queryExtendedProps;
            var options = {
                host: 'en.wikipedia.org',
                port: 443,
                path: path,
                method: 'GET'
            };

            console.log("getWiki options",options);
            rest.callAPI(options, function (statusCode, result) {
                if (statusCode == 200) {
                        if (result && result.query && result.query.pages) {
                            let wikiPageIds = Object.keys(result.query.pages);
                            let wikiPageDataArray = [];
                            let wikiPageDataArrayFiltered;
                            wikiPageIds.forEach((pageID, index) => {
                                wikiPageDataArray.push(result.query.pages[pageID]);
                            });
                            if (wikiPageDataArray.length >= 1) {
                                try {
                                    wikiPageDataArrayFiltered = wikiPageDataArray.filter((pageData) => {
                                        return (JSON.parse(JSON.stringify(pageData)).title.toLowerCase().replace(/[^a-z0-9 -]/ig, '') == searchString);
                                    });
                                } catch (error) {

                                }
                            }
                            if (wikiPageDataArrayFiltered.length >= 1) {
                                let wikiResultParsed = JSON.parse(JSON.stringify(wikiPageDataArrayFiltered[0]));
                                let wikiExtract = wikiResultParsed.extract;
                                let wikiTitle = wikiResultParsed.title;
                                let wikiPageID = wikiResultParsed.pageid;
                                let wikiImage = false;

                                let pathWikiImage = '/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=100&titles=' + encodeURI(wikiTitle);
                                var optionsWikiImage = {
                                    host: 'en.wikipedia.org',
                                    port: 443,
                                    path: pathWikiImage,
                                    method: 'GET'
                                };
                                console.log("optionsWikiImage", optionsWikiImage);
                                rest.callAPI(optionsWikiImage, function (statusCodeWikiImage, resultWikiImage) {
                                    if (resultWikiImage && resultWikiImage.query && resultWikiImage.query.pages[wikiPageID] && resultWikiImage.query.pages[wikiPageID].thumbnail && resultWikiImage.query.pages[wikiPageID].thumbnail.source) {
                                        wikiImage = resultWikiImage.query.pages[wikiPageID].thumbnail.source;
                                    }
                                    let wikiURL = "https://en.wikipedia.org/wiki/" + encodeURI(wikiTitle);
                                    let embed;
                                    if (wikiImage) {
                                        embed = new Discord.RichEmbed().setURL(wikiURL).setTitle(wikiTitle).setDescription(wikiExtract).setThumbnail(wikiImage);
                                    } else {
                                        embed = new Discord.RichEmbed().setURL(wikiURL).setTitle(wikiTitle).setDescription(wikiExtract);
                                    }
                                    sendEmbed(discordMessageObj, embed);
                                });
                            }
                        } else {
                            let urbanDefinitionResponse = "I found no Wikipedia entry for \"" + searchString + "\".\r\n\r\n";
                            sendMessage(discordMessageObj, urbanDefinitionResponse, true);
                        }
                }
            });
        }else{
            return false;
        }
    } catch(error) {
        console.error("Error in getWiki:", error);
    }
}

function getGiphy(discordMessageObj, searchString) {
    try{
        if (searchString && searchString.length >= 1) {
            let urlSearchString = encodeURI(searchString.toLowerCase());
            let path = '/v1/gifs/search?q=' + urlSearchString;
            var options = {
                host: process.env[config.giphy_host],
                port: 443,
                path: path,
                method: 'GET',
                headers: {
                    "api_key": process.env[config.giphy_token],
                }
            };

            console.log("getGiphy options",options);

            rest.callAPI(options, function (statusCode, result) {
                if (statusCode == 200) {
                    if (result && result.data && result.data.length >= 1) {
                        let giphyArray = result.data;
                        let giphyURL = giphyArray[Math.floor(Math.random()*giphyArray.length)].images.fixed_width.url;
                        const embed = new Discord.RichEmbed().setImage(giphyURL);
                        sendEmbed(discordMessageObj, embed);
                    } else {
                        let urbanDefinitionResponse = "I found no Urban Dictionary definition for \"" + searchString + "\".\r\n\r\n";
                        sendMessage(discordMessageObj, urbanDefinitionResponse, true);
                    }
                }
            });
        }else{
            return false;
        }
    } catch(error) {
        console.error("Error in getGiphy:", error);
    }
}

function getUrbanDefinition(discordMessageObj, searchString) {
    try{
        if (searchString && searchString.length >= 1) {
            let urlSearchString = encodeURI(searchString.toLowerCase());
            let path = '/v0/define?term=' + urlSearchString;
            var options = {
                host: process.env[config.urban_dictionary_host],
                port: 443,
                path: path,
                method: 'GET',
                headers: {}
            };
            console.log("getUrbanDefinition options",options);
            let phrasing;
            if (searchString.indexOf(" ") == -1) {
                phrasing = "the word";
            } else {
                phrasing = "the phrase";
            }
            let urbanDefinitionResponse = "";
            rest.callAPI(options, function (statusCode, result) {
                if (statusCode == 200) {
                    if (result && result.result_type && (result.result_type == "exact") && (result.list && result.list[0] && result.list[0].definition)) {
                        let definition = result.list[0].definition;
                        if (definition.length >= 1) {
                            urbanDefinitionResponse = "I found the following Urban Dictionary definition for " + phrasing + " \"" + searchString + "\":\r\n\r\n" + definition;
                            sendMessage(discordMessageObj, urbanDefinitionResponse, true);
                        }
                    } else if (result && result.result_type && (result.result_type == "no_results")){
                        urbanDefinitionResponse = "I found no Urban Dictionary definition for " + phrasing + " \"" + searchString + "\".\r\n\r\n";
                        sendMessage(discordMessageObj, urbanDefinitionResponse, true);
                    }
                }
            });
        } else {
            return false;
        }
    }catch(error){
        console.log("getUrbanDefinition Error", error)
    }
}

function getOxfordDefinition(discordMessageObj, searchString) {
    try {
        if (searchString && searchString.length >= 1) {
            let urlSearchString = encodeURI(searchString.toLowerCase());
            let path = '/api/v1/entries/en/' + urlSearchString;
            var options = {
                host: process.env[config.oxford_dictionary_host],
                port: 443,
                path: path,
                method: 'GET',
                headers: {
                    'app_id': process.env[config.oxford_dictionary_app_id],
                    'app_key': process.env[config.oxford_dictionary_app_key]
                }
            };
            console.log("getOxfordDefinition options",options);
            let definitionResponse = "";
            rest.callAPI(options, function (statusCode, result) {
                let phrasing;
                if (searchString.indexOf(" ") == -1) {
                    phrasing = "the word";
                } else {
                    phrasing = "the phrase";
                }
                if (statusCode == 200) {
                    let lexicalEntries = result.results[0].lexicalEntries;
                    let definitions = [];
                    lexicalEntries.forEach((entry, index) => {
                        console.log("entry.entries[0].senses[0]", entry.entries[0]);
                        let definition = "";
                        if (entry.entries[0].senses[0].definitions && entry.entries[0].senses[0].definitions[0]) {
                            definition = entry.entries[0].senses[0].definitions[0];
                        } else if (entry.entries[0].senses[0].crossReferenceMarkers && entry.entries[0].senses[0].crossReferenceMarkers[0]) {
                            definition = entry.entries[0].senses[0].crossReferenceMarkers[0];
                        }
                        if (definition) {
                            definitions.push(definition);
                        }
                    });

                    let preface = "";
                    if (definitions.length > 1) {
                        preface = "I managed to find the following definitions for " + phrasing + " \"" + searchString + "\":";
                    } else if (definitions.length == 1) {
                        preface = "I managed to find the following definition for " + phrasing + " \"" + searchString + "\":";
                    } else {
                        preface = "I did not manage to find a definition for the " + phrasing + " \"" + searchString + "\"";
                    }
                    definitionResponse += preface;
                    definitions.forEach((definition, index) => {
                        let definitionCount = index + 1 //Because users are not programmers
                        definitionResponse += "\r\n\r\n" + definitionCount + ". " + definition;
                        if (definitionCount == definitions.length) {
                            sendMessage(discordMessageObj, definitionResponse, true);
                        }
                    });
                }else if(statusCode == 404){
                    definitionNotFoundResponse = "I did not manage to find a defintion for the " + phrasing + " \"" + searchString + "\".\r\n\r\nP.S. This works best with singular root words (e.g. \"cat\" instead of \"cats\" or \"break\" instead of \"breaking\").";
                    sendMessage(discordMessageObj, definitionNotFoundResponse, true);
                }
            });
        } else {
            return false;
        }
    } catch(error){
        return false;
    }
}

function sendMessage(discordMessageObj, message, replyToMessageSender) {
    if(discordMessageObj && message && replyToMessageSender) {
        discordMessageObj.reply(message);
    }else if(discordMessageObj && message){
        //TODO Response without reply to user
        discordMessageObj.channel.send(message);
    }
}

function sendEmbed(discordMessageObj, embed) {
    if(discordMessageObj && embed) {
        discordMessageObj.channel.send({embed});
    }else {
        
    }
}

bot.login(process.env[config.my_discord_token]);