//Written By G. Huebner
//August 8th, 2016

$(document).ready(function () {
    var stepSlider = document.getElementById('slider');
    var minText = document.getElementById('minTextbox');
    var maxText = document.getElementById('maxTextbox');

    noUiSlider.create(stepSlider, {
        start: [200, 2000],
        connect: true,
        range: {
            'min': [0, 10],
            '25%': [200, 100],
            '50%': [1000, 100],
            '75%': [2000, 1000],
            'max': 10000
        },
        pips: {
            mode: 'positions',
            values: [0, 25, 50, 75, 100],
            density: 4,
            stepped: true
        },
        format: wNumb({
            decimals: 0
        })
    });

    stepSlider.noUiSlider.on('update', function (values, handle) {
        minText.value = values[0];
        if (values[0] == 10000) {
            minText.value = values[0] + '+';
        } else {
            minText.value = values[0];
        }
    });

    minText.addEventListener('change', function () {
        stepSlider.noUiSlider.set([this.value, null]);
    });

    stepSlider.noUiSlider.on('update', function (values, handle) {
        if (values[1] == 10000) {
            maxText.value = values[1] + '+';
        } else {
            maxText.value = values[1];
        }
    });

    maxText.addEventListener('change', function () {
        stepSlider.noUiSlider.set([null, this.value]);
    });


    $(".chosen-select").chosen();
    parseGameResponse();

});

function ajaxGames(offset, cap) {
    var gameOptions = "";
    var i;

    return $.ajax({
        type: 'GET',
        url: "https://api.twitch.tv/kraken/games/top?limit=100&offset=" + offset,
        dataType: 'json',
        success: function (response) {
            for (i = 0; i < cap; i++) {
                if (gameOptions.indexOf(response.top[i].game.name) == -1) {
                    gameOptions += ('<option value="' + response.top[i].game.name + '">' + response.top[i].game.name + '</option>');
                }
            }
            $('#gamesSelect').append(gameOptions);
            $('#gamesSelect').trigger("chosen:updated");

            total_games = response._total;
        }
    });
}

function parseGameResponse() {
    var cap = 100;
    var remaining_games;
    var offset = 0;

    $.when(ajaxGames(offset, cap)).done(function () {
        remaining_games = total_games;
        remaining_games -= 100;
        offset += 100;

        do {
            ajaxGames(offset, cap);

            remaining_games -= 100;
            offset += 100;
            if (remaining_games < 100 && remaining_games > 0) {
                cap = remaining_games;
            }
        } while (remaining_games > 0);
        $('#gamesSelect').trigger("chosen:updated");
    });
}


$('#getStream').click(function () {
    var slider = document.getElementById('slider');
    var range = slider.noUiSlider.get();
    var invalid_characters = ["Á", "É", "Í", "Ó", "Ú", "Ý", "á", "é", "í", "ó", "ú", "ý", "â", "ê", "î", "ô", "û", "Â", "Ê", "Î", "Ô", "Û"];
    var selectedValues = $('.chosen-select').val();
    var i;

    min = range[0];

    if (range[1] == '10000+') {
        max = 1000000;
    } else {
        max = range[1];
    }

    for (i = 0; i < selectedValues.length; i++) {
        gamesArray.push(selectedValues[i]);
    }

    game = chooseGame();

    if (game != null) {
        for (i = 0; i < invalid_characters.length; i++) {
            if (game.indexOf(invalid_characters[i]) != -1) {
                game = game.replace(invalid_characters[i], encodeURIComponent(invalid_characters[i]));
            }
        }

        humane.log('Finding stream...');
        parseStreamResponse();
    }
});

function chooseGame()
{
    var game, random;

    game = null;
    if (gamesArray.length == 0) {
        humane.log('No Games Selected');
    } else {
        random = Math.floor(Math.random() * (gamesArray.length));
        game = gamesArray[random];
    }
    return game;
}

function ajaxStreams(offset, cap) {
    return $.ajax({
        type: 'GET',
        url: "https://api.twitch.tv/kraken/streams?game=" + game + "&limit=100&offset=" + offset,
        dataType: 'json',
        success: function (response) {
            if (response._total < 100) {
                for (i = 0; i < response._total; i++) {
                    if (response.streams[i].viewers <= max) {
                        if (response.streams[i].viewers >= min) {
                            streamArray.push(response.streams[i].channel.url);
                        } else {
                            break;
                        }
                    }
                }
                total_streams = 0;
            } else {
                if (response.streams[99].viewers <= max) {
                    for (i = 0; i < cap; i++) {
                        if (response.streams[i].viewers <= max) {
                            if (response.streams[i].viewers >= min) {
                                streamArray.push(response.streams[i].channel.url);
                            } else {
                                break;
                            }
                        }
                    }
                }
                total_streams = response._total;
            }
        }
    });
}

function parseStreamResponse() {
    var remaining_streams;
    var offset = 0;
    var cap = 100;

    $.when(ajaxStreams(offset, cap)).done(function () {
        remaining_streams = total_streams;
        remaining_streams -= 100;
        offset += 100;

        if (remaining_streams > 0) {
            do {
                ajaxStreams(offset, cap);

                remaining_streams -= 100;
                offset += 100;
                if (remaining_streams < 100 && remaining_streams > 0) {
                    cap = remaining_streams;
                }
            } while (remaining_streams > 0);
        }
        getRandomStream();
    });           
}

function getRandomStream() {
    var random;

    if (streamArray.length == 0)
    {
        humane.log("No streams found within that viewer range.");
    } else {
        random = Math.floor(Math.random() * (streamArray.length));
        window.open(streamArray[random]);
    }
}

var max;
var min;
var game;

var total_games;
var total_streams;

var gamesArray = [];
var streamArray = [];


