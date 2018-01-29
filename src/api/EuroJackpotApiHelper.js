'use strict';

var nodeFetch = require('node-fetch');
var LOTTOLAND_API_URL = "https://lottoland.com/api/drawings/euroJackpot";
var euroJackpotOdds = {"rank1": [5,2], "rank2": [5,1], "rank3": [5,0], "rank4": [4,2], "rank5": [4,1], "rank6": [4,0], "rank7": [3,2], "rank8": [2,2], "rank9": [3,1], "rank10": [3,0], "rank11": [1,2], "rank12": [2,1]};
var locale="";

function EuroJackpotApiHelper(currentLocale) {
    locale = currentLocale;

    if(!isGermanLang())
        LOTTOLAND_API_URL = "https://lottoland.com/en/api/drawings/euroJackpot";
    else
        LOTTOLAND_API_URL = "https://lottoland.com/api/drawings/euroJackpot";
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

EuroJackpotApiHelper.prototype.getLastLotteryDateAndNumbers = function() {
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

            numbersAndDate[0] = stringifyArray(lastLottery.numbers);
            numbersAndDate[1] = stringifyArray(lastLottery.euroNumbers);
            numbersAndDate[2] = lotteryDateString;
            numbersAndDate[3] = "";//json.last.currency;

            return numbersAndDate;
        }
    }).catch(function(err) {
        console.log(err);
    });
};

EuroJackpotApiHelper.prototype.getLastLotteryNumbers = function() {
    return invokeBackend(LOTTOLAND_API_URL).then(function(json){
        if(json) {
            var lastLottery = null;
            
            if(json.last.numbers && json.last.numbers.length > 0) {
                lastLottery = json.last;
            } else {
                lastLottery = json.past;
            }

            var numbers = [];
            numbers[0] = stringifyArray(lastLottery.numbers);
            numbers[1] = stringifyArray(lastLottery.euroNumbers);
            
            return numbers;
        }
    }).catch(function(err) {
        console.log(err);
    });
};

EuroJackpotApiHelper.prototype.getNextLotteryDrawingDate = function() {
    return invokeBackend(LOTTOLAND_API_URL).then(function(json){
        if(json) {
            if(isGermanLang())
                return json.next.date.dayOfWeek + ", den " + json.next.date.day + "." + json.next.date.month + "." + json.next.date.year; // + " um " + json.next.date.hour + " Uhr "  + (Number(json.next.date.minute) > 0 ? json.next.date.minute : "");
            else if(isUSLang())
                return json.next.date.dayOfWeek + ", " + json.next.date.day + "." + json.next.date.month + "." + json.next.date.year; // + " at " + json.next.date.hour + ":"  + (Number(json.next.date.minute) > 0 ? json.next.date.minute : "00");
            else
                return json.next.date.dayOfWeek + ", " + json.next.date.month + "." + json.next.date.day + "." + json.next.date.year; // + " at " + json.next.date.hour + ":"  + (Number(json.next.date.minute) > 0 ? json.next.date.minute : "00");
        }
    }).catch(function(err) {
        console.log(err);
    });
};

EuroJackpotApiHelper.prototype.getCurrentJackpot = function() {
    return invokeBackend(LOTTOLAND_API_URL).then(function(json){
        if(json) {
            if(json.next)
                return json.next.jackpot;
            else
                return json.last.jackpot;
        }
    }).catch(function(err) {
        console.log(err);
    });
};

EuroJackpotApiHelper.prototype.getLastPrizeByRank = function(myRank) {
    return invokeBackend(LOTTOLAND_API_URL).then(function(json) {
        if(json) {
            var lastLottery = null;
            
            if(json.last.numbers && json.last.numbers.length > 0) {
                lastLottery = json.last;
            } else {
                lastLottery = json.past;
            }

            if(lastLottery.odds && lastLottery.odds['rank'+myRank]) {
                if(lastLottery.odds['rank'+myRank].prize > 0) {
                    var price = lastLottery.odds['rank'+myRank].prize + "";
                    return price.substring(0, price.length-2) + (isGermanLang() ? "," : ".") + price.substring(price.length-2) + " €.";
                } else {
                    return null;
                }
            }
        } else {
            return null;
        }
    }).catch(function(err) {
        console.log(err);
    });
};

EuroJackpotApiHelper.prototype.getOdds = function() {
    return euroJackpotOdds;
};

EuroJackpotApiHelper.prototype.getCorrectArticle = function() {
    if(isGermanLang())
        return "Die ";
    else
        return "The ";
}

EuroJackpotApiHelper.prototype.getLotteryOddRank = function(numberOfMatchesMain, numberOfMatchesAdditional) {
    var myRank = [numberOfMatchesMain, numberOfMatchesAdditional];

    for(var i = 1; i <= Object.keys(euroJackpotOdds).length; i++)
    {
        if(euroJackpotOdds['rank'+i][0] == myRank[0] && euroJackpotOdds['rank'+i][1] == myRank[1])
            return i;
    }

    return 1000;
};

EuroJackpotApiHelper.prototype.createSSMLOutputForNumbers = function(numbers) {
    var speakOutput = "";
    var mainNumbers = numbers[0];
    var addNumbers = numbers[1];

    for(var i = 0; i < mainNumbers.length; i++)
        speakOutput += mainNumbers[i] + "<break time=\"500ms\"/>";
    
    if(isGermanLang())
        speakOutput+=". Eurozahlen: <break time=\"200ms\"/>" + addNumbers[0] + "<break time=\"500ms\"/> und " + addNumbers[1] + "<break time=\"500ms\"/>";
    else
        speakOutput+=". Euro numbers: <break time=\"200ms\"/>" + addNumbers[0] + "<break time=\"500ms\"/> and " + addNumbers[1] + "<break time=\"500ms\"/>";
        
    return speakOutput;
};

EuroJackpotApiHelper.prototype.createLotteryWinSpeechOutput = function(myRank, moneySpeech, date) {
    var speechOutput = "<speak>";

    switch(myRank) {
        case 1000:
            if(isGermanLang())
                speechOutput += "In der letzten Ziehung Eurojackpott von " + date + " hast du leider nichts gewonnen. Dennoch wünsche ich dir weiterhin viel Glück!";
            else
                speechOutput += "The last drawing of euro jackpot was on " + date + ". Unfortunately, you didn`t won anything. I wish you all the luck in the future!";
            break;
        case 1:
            if(isGermanLang())
                speechOutput += "In der letzten Ziehung Eurojackpott von " + date + " hast du den Jackpot geknackt! Alle Zahlen und auch die beiden Eurozahlen hast du richtig getippt. Jetzt kannst du es richtig krachen lassen! Herzlichen Glückwunsch! " + moneySpeech ;
            else
                speechOutput += "The last drawing of euro jackpot was on " + date + ". And you won the jackpot! You predicted all numbers and both euro numbers correctly! Let´s get the party started! Congratulation! " + moneySpeech ;
            break;
        default:
            if(isGermanLang()) {
                speechOutput += "In der letzten Ziehung Eurojackpott von " + date + " hast du ";
                speechOutput += (euroJackpotOdds['rank'+myRank][0] == 1 ? "eine richtige Zahl" : euroJackpotOdds['rank'+myRank][0]) + " richtige Zahlen";
                speechOutput += (euroJackpotOdds['rank'+myRank][1] == 1 ? " und eine Eurozahl richtig!" : "");
                speechOutput += (euroJackpotOdds['rank'+myRank][1] == 2 ? " und zwei Eurozahlen richtig!" : "");
                speechOutput += "! Herzlichen Glückwunsch! " + moneySpeech;
            } else {
                speechOutput += "The last drawing of euro jackpot was on " + date + ". You have ";
                speechOutput += (euroJackpotOdds['rank'+myRank][0] == 1 ? "one matching number" : euroJackpotOdds['rank'+myRank][0]) + " matching numbers";
                speechOutput += (euroJackpotOdds['rank'+myRank][1] == 1 ? " and one matching euro number!" : "");
                speechOutput += (euroJackpotOdds['rank'+myRank][1] == 2 ? " and two matching euro numbers!" : "");
                speechOutput += "! Congratulation! " + moneySpeech;
            }
            break;
    }

    return speechOutput;
};

function stringifyArray(numberArray) {
    for(var i = 0; i < numberArray.length; i++) {
        numberArray[i] = numberArray[i]+"";
    }
    return numberArray;
}

module.exports = EuroJackpotApiHelper;