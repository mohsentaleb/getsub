#!/usr/bin/env node

const ytssubs = require('ytssubs');
const prompt = require('prompt');
const colors = require("colors/safe");
const got = require('got');

// TODO: get the CWD with `path.basename(__dirname)` and do the job automatically!

let imdbID;

// User knows the IMDBId and passes it as the first arg
if (process.argv[2] && process.argv[2].startsWith('tt')) {
    imdbID = process.argv[2];
    ytssubs.getSubs(imdbID, (err, results) => {
        promptForDownload(results, imdbID);
    });

// User provides the name of the movie and the release date as first and second args
} else if (process.argv[2] && process.argv[3]) {
    let title = process.argv[2];
    let year = process.argv[3];
    (async () => {
        try {
            console.log(`Trying to download information for movie: ${title} ${year}`);
            var movieInfo = await got('http://www.omdbapi.com/?apikey=133939a8&t=' + title + '&y=' + year, { json: true });
            imdbID = movieInfo.body.imdbID;
            ytssubs.getSubs(imdbID, (err, results) => {
                promptForDownload(results, imdbID);
            })
        } catch (err) {
            console.log(`Can not get info of movie ${title} ${year}"`);
        }
    })()
} else {
    console.log('You should provide the IMDB id of a movie as a parameter.');
}

function promptForDownload(subsObject, imdbID) {
    console.log(`Finding available subtitles for movie with ID: ${imdbID}`);
    console.log('Available subtitle languages for this movie are:');
    console.log('================================================');
    subsObject.langs.map((lang, index) => {
        console.log((index+1) + '. ' + lang);
    });

    const languageParam = {
        properties: {
            language: {
                pattern: /^[1-9]+$/,
                message: 'Please enter a number according to the list above.',
                required: true
            }
        }
    };

    prompt.message = colors.green('\r\nPlease choose your desired language');
    prompt.start();

    prompt.get(languageParam, function (err, result) {
        if (err) { return onErr(err); }
        const languageIndex = parseInt(result.language) - 1;
        const languageString = subsObject.langs[languageIndex];
        const filteredSubs = subsObject.subs.filter(sub => {
            return sub.lang === languageString;
        });


        console.log('\r\nAvailable subtitles in ' + languageString);
        console.log('===============================');
        filteredSubs.map((sub, index) => {
            console.log((index + 1) + colors.yellow('. Rating: ' + sub.rating) + ' | ' + sub.url);
        });
        
        var urlParam = {
            properties: {
                url: {
                    pattern: /^[1-9]+$/,
                    message: 'Please enter a number according to the list above.',
                    required: true
                }
            }
        };

        prompt.message = colors.green('\r\nPlease choose one of these subtitles to download');
        prompt.get(urlParam, function (err, result) {
            const urlIndex = parseInt(result.url) - 1;
            const url = filteredSubs[urlIndex].url;
            
            ytssubs.downloadSubs(url, process.cwd(), () => {
                console.log(colors.green('\r\nYour subtitle has been downloaded!'));
            });
        });
    });
}