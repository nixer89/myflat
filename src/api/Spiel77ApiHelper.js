'use strict';

var nodeFetch = require('node-fetch');
var LOTTOLAND_API_URL = "https://lottoland.com/api/drawings/german6aus49";
var spiel77Odds = {"rank1": [7,0], "rank2": [6,0], "rank3": [5,0], "rank4": [4,0], "rank5": [3,0], "rank6": [2,0], "rank7": [1,0]};
var spiel77Prizes = {"rank1": 0, "rank2": 77777, "rank3": 7777, "rank4": 777, "rank5": 77, "rank6": 17, "rank7": 5};
var locale="";

function Spiel77ApiHelper(currentLocale) {
    locale = currentLocale;
    
    if(!isGermanLang())
        LOTTOLAND_API_URL = "https://lottoland.com/en/api/drawings/german6aus49";
    else
        LOTTOLAND_API_URL = "https://lottoland.com/api/drawings/german6aus49";
}

function invokeBackend(url) {
    return nodeFetch(url)
        .then(function(res) {
            return res.json();
        }).catch(function(err) {
        console.log(err);
    });
};

function isGermanLang() {
    return 'de-DE' == locale;
}

function isUSLang() {
    return 'en-US' == locale;
}

Spiel77ApiHelper.prototype.getLastLotteryDateAndNumbers = function() {
    return invokeBackend(LOTTOLAND_API_URL).then(function(json){
        if(json) {
            var numbersAndDate = [];
            var lotteryDateString = "";
            var lastLottery = null;
            
            if(json.last.numbers && json.last.numbers.length > 0) {
                lastLottery = json.last;
            } else {
                lastLottery = json.past;
            }
            
            if(isUSLang())
                lotteryDateString = lastLottery.date.dayOfWeek + ", " + lastLottery.date.month + "." + lastLottery.date.day + "." + lastLottery.date.year;
            else
                lotteryDateString = lastLottery.date.dayOfWeek + ", " + lastLottery.date.day + "." + lastLottery.date.month + "." + lastLottery.date.year;

            numbersAndDate[0] = stringifyArray(lastLottery.spiel77.split(""));
            numbersAndDate[1] = -1;
            numbersAndDate[2] = lotteryDateString;
            numbersAndDate[3] = "";//json.last.currency;

            return numbersAndDate;
        }
    }).catch(function(err) {
        console.log(err);
    });
};

Spiel77ApiHelper.prototype.getLastLotteryNumbers = function() {
    return invokeBackend(LOTTOLAND_API_URL).then(function(json){
        if(json) {
            var numbers = [];
            var lastLottery = null;
            
            if(json.last.numbers && json.last.numbers.length > 0) {
                lastLottery = json.last;
            } else {
                lastLottery = json.past;
            }

            numbers[0] = stringifyArray(lastLottery.spiel77.split(""));
            numbers[1] = "-1";

            return numbers;
        }
    }).catch(function(err) {
        console.log(err);
    });
};

Spiel77ApiHelper.prototype.getCorrectArticle = function() {
    if(isGermanLang())
        return "Die ";
    else
        return "The ";
}

Spiel77ApiHelper.prototype.getNextLotteryDrawingDate = function() {
    return invokeBackend(LOTTOLAND_API_URL).then(function(json){
        if(json) {
            if(isGermanLang())
                return json.next.date.dayOfWeek + ", den " + json.next.date.day + "." + json.next.date.month + "." + json.next.date.year; // + " um " + json.next.date.hour + " Uhr "  + (Number(json.next.date.minute) > 0 ? json.next.date.minute : "");
            else if(isUSLang())
                return json.next.date.dayOfWeek + ", " + json.next.date.month + "." + json.next.date.day + "." + json.next.date.year; // + " at " + json.next.date.hour + ":"  + (Number(json.next.date.minute) > 0 ? json.next.date.minute : "00");
            else
                return json.next.date.dayOfWeek + ", " + json.next.date.day + "." + json.next.date.month + "." + json.next.date.year; // + " at " + json.next.date.hour + ":"  + (Number(json.next.date.minute) > 0 ? json.next.date.minute : "00");
        }
    }).catch(function(err) {
        console.log(err);
    });
};

Spiel77ApiHelper.prototype.getCurrentJackpot =function() {
    return invokeBackend(LOTTOLAND_API_URL).then(function(json){
        if(json) {
            //return json.next.jackpot;
            if(isGermanLang())
                return "Der aktuelle Jackpot kann nicht bestimmt werden.";
            else
                return "The current jackpot cannot be determined";
        }
    }).catch(function(err) {
        console.log(err);
    });
};

Spiel77ApiHelper.prototype.getLastPrizeByRank = function(myRank) {
    return invokeBackend(LOTTOLAND_API_URL).then(function(json) {
        if(json) {
            var lastLottery = null;
            
            if(json.last.numbers && json.last.numbers.length > 0) {
                lastLottery = json.last;
            } else {
                lastLottery = json.past;
            }

            if(lastLottery.spiel77Odds && lastLottery.spiel77Odds['rank'+myRank]) {
                if(lastLottery.spiel77Odds['rank'+myRank].prize > 0) { //check the internet
                    return lastLottery.spiel77Odds['rank'+myRank].prize;
                } else {
                    return 0;
                }
            } else if(spiel77Prizes['rank'+myRank] && spiel77Prizes['rank'+myRank] > 0) { // no internet, use if not jackpot!
                return spiel77Prizes['rank'+myRank];
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    }).catch(function(err) {
        console.log(err);
    });
};

Spiel77ApiHelper.prototype.getLastLotteryOdds = function() {
    return invokeBackend(LOTTOLAND_API_URL).then(function(json) {
        if(json) {
            var lastLottery = null;
            
            if(json.last.numbers && json.last.numbers.length > 0) {
                lastLottery = json.last;
            } else {
                lastLottery = json.past;
            }

            return lastLottery.spiel77Odds;
        } else {
            return null;
        }}).catch(function(err) {
            console.log(err);
    });
};

Spiel77ApiHelper.prototype.getLotteryOddRank = function(numberOfMatchesMain, numberOfMatchesAdditional) {
    var myRank = [numberOfMatchesMain, numberOfMatchesAdditional];
    
    for(var i = 1; i <= Object.keys(spiel77Odds).length; i++)
    {
        if(spiel77Odds['rank'+i][0] == myRank[0] && spiel77Odds['rank'+i][1] == myRank[1])
            return i;
    }

    return 1000;
};

Spiel77ApiHelper.prototype.createSSMLOutputForNumbers = function(numbers) {
  var speakOutput = "";
  var mainNumbers = numbers[0];

  for(var i = 0; i < mainNumbers.length; i++)
      speakOutput += mainNumbers[i] + "<break time=\"500ms\"/>";

  return speakOutput;
};

Spiel77ApiHelper.prototype.createLotteryWinSpeechOutput = function(myRank, moneySpeech, date) {
    var speechOutput = "<speak>";

    switch(myRank) {
        case 1000:
            if(isGermanLang())
                speechOutput += "In der letzten Ziehung Spiel77 von " + date + " hast du leider nichts gewonnen. Dennoch wünsche ich dir weiterhin viel Glück!";
            else
                speechOutput += "The last drawing of game 77 was on " + date + ". Unfortunately, you didn`t win anything. I wish you all the luck next time!";
            break;
        case 1:
            if(isGermanLang())
                speechOutput += "In der letzten Ziehung Spiel77 von " + date + " stimmen alle deine Zahlen überein!. Jetzt kannst du es richtig krachen lassen! Herzlichen Glückwunsch! "  + moneySpeech;
            else
                speechOutput += "The last drawing of game 77 was on " + date + ". And all your numbers are matching to the drawn numbers! Let´s get the party started! Congratulation! "  + moneySpeech;
            break;
        case 7:
            if(isGermanLang())
                speechOutput += "In der letzten Ziehung Spiel77 von " + date + " stimmt die letzte Zahl überein. Herzlichen Glückwunsch! " + moneySpeech;
            else
                speechOutput += "The last drawing of game 77 was on " + date + ". Your last number matches the drawing. Congratulation! " + moneySpeech;
            break;
        default:
            if(isGermanLang())
                speechOutput += "In der letzten Ziehung Spiel77 von " + date + " stimmen die letzten " + spiel77Odds['rank'+myRank][0] + " Zahlen überein. Herzlichen Glückwunsch! " + moneySpeech;
            else
                speechOutput += "The last drawing of game 77 was on " + date + ". Your last " + spiel77Odds['rank'+myRank][0] + " numbers are matching. Congratulation! " + moneySpeech;
    }

    return speechOutput;
};

Spiel77ApiHelper.prototype.createLotteryWinSpeechOutputShort = function(myRank, moneySpeech, date) {
    var speechOutput = "<break time=\"500ms\"/>";

    switch(myRank) {
        case 1000:
            if(isGermanLang())
                speechOutput += " In Spiel77 hast du leider nichts gewonnen. Dennoch wünsche ich dir weiterhin viel Glück!";
            else
                speechOutput += "Unfortunately, you didn`t win anything in game 77. I wish you all the luck next time";
            break;
        case 1:
            if(isGermanLang())
                speechOutput += " In Spiel77 stimmen alle deine Zahlen überein!. Jetzt kannst du es richtig krachen lassen! Herzlichen Glückwunsch! " + moneySpeech;
            else
                speechOutput += " In game 77, all your numbers are matching to the drawn numbers!. Let´s get the party started! Congratulation! " + moneySpeech;
            break;
        case 7:
            if(isGermanLang())
                speechOutput += " In Spiel77 stimmt die letzte Zahl überein. Herzlichen Glückwunsch! " + moneySpeech;
            else
                speechOutput += " In game 77, your last number matches the drawing. Congratulation! " + moneySpeech;
            break;
        default:
            if(isGermanLang())
                speechOutput += " In Spiel77 stimmen die letzten " + spiel77Odds['rank'+myRank][0] + " Zahlen überein. Herzlichen Glückwunsch! " + moneySpeech;
            else
                speechOutput += " In game 77, your last " + spiel77Odds['rank'+myRank][0] + " numbers are matching. Congratulation! " + moneySpeech;
    }

    return speechOutput;
};

function stringifyArray(numberArray) {
    for(var i = 0; i < numberArray.length; i++) {
        numberArray[i] = numberArray[i]+"";
    }
    return numberArray;
}

module.exports = Spiel77ApiHelper;