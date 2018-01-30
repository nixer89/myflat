/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * App ID for the skill
 */
var APP_ID = process.env.APP_ID;
var LOTTO_DATA_TABLE_NAME = process.env.DB_TABLE;
var credentials = {
    accessKeyId: process.env.DB_ACCESS_KEY_ID,
    secretAccessKey: process.env.DB_SECRET_ACCESS_KEY,
    region: 'eu-west-1'
};

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var dynasty = require('dynasty')(credentials);
var skillHelperPrototype = require('./SkillHelper');
var skillHelper;

var lottoDbTable = function() {
    return dynasty.table(LOTTO_DATA_TABLE_NAME);
};

/**
 * MyFlat is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var MyFlat = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
MyFlat.prototype = Object.create(AlexaSkill.prototype);
MyFlat.prototype.constructor = MyFlat;

MyFlat.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("MyFlat onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

MyFlat.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    if(locale == 'de-DE')
        response.ask("Willkommen in Daniels Zimmer!", "Was möchtest du tun?")
    else
        response.ask("Welcome to Daniels room!", "What would you like to do?")
};

MyFlat.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("MyFlat onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

var US_Intent_Handler = {
    // register custom intent handlers
    "HelloIntent": function (intent, session, response) {
        response.tellWithCard("Hello!", "Hello!", "Hello!");
    },
    "WelcomingIntent": function (intent, session, response) {
        if(intent.slots.name)
            response.ask("Hello " + intent.slots.name.value + ". Welcome to Daniels flat","");
        else
            response.ask("Sorry i couldn`t understand your name. But still enjoy your stay in Daniels flat.","");
    },
    "ILoveYouIntent": function (intent, session, response) {
        response.ask("I love you so much " + intent.slots.name.value + ". You are the sweetest girl on earth!","");
    },
    "AskForStoredLotteryCount": function (intent, session, response) {
        lottoDbTable().scan().then(function(allEntries) {
            var output = "Currently, you have " + allEntries.length + " entries in your database";
            response.tell(output);
        });
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say hello to me!", "You can say hello to me!");
    },
    "QuitIntent": function (intent, session, response) {
        response.tell("Ciao and goodbye");
    }
};

var DE_Intent_Handler  = {
    // register custom intent handlers
    "HelloIntent": function (intent, session, response) {
        response.tellWithCard("Hallo!", "Hallo!", "Hallo!");
    },
    "WelcomingIntent": function (intent, session, response) {
        if(intent.slots.name)
            response.ask("Hallo " + intent.slots.name.value + ". Willkommen in Daniels Kuschelhöhle.","");
        else
            response.ask("Ich konnte den Namen leider nicht verstehen. Dennoch herzlich willkommen in Daniels Kuschelhöhle.","");
    },
    "ILoveYouIntent": function (intent, session, response) {
        response.ask("Ich liebe dich so sehr " + intent.slots.name.value + ". Du bist das süßeste Mädchen auf der Welt!","");
    },
    "AskForStoredLotteryCount": function (intent, session, response) {
        lottoDbTable().scan().then(function(allEntries) {
            var output = "Aktuell befinden sich " + allEntries.length + " Einträge in deiner Datenbank";
            response.tell(output);
        });
    },
    "AskHighesLotteryWin": function (intent, session, response) {
        lottoDbTable().scan().then(function(allEntries) {
            var highestPrice = 0;
            var winningResponse = "Hier sind die höchsten Gewinne der letzten Ziehungen aus allen unterstützten Lotterien: ";

            var lotteryName = "sechs aus neun und vierzig"
            var config = skillHelper.getConfigByUtterance(lotteryName);
            session.attributes.currentConfig = config;
            getHighesPriceByLottery(allEntries, "german6aus49", session).then(maxPrize => {
                winningResponse += "In 6 aus 49: " + (maxPrize>0?maxPrize.substring(0, maxPrize.length-2) + "," + maxPrize.substring(maxPrize.length-2) : 0) + " €. ";

                lotteryName = "spiel sieben und siebzig";
                config = skillHelper.getConfigByUtterance(lotteryName);
                session.attributes.currentConfig = config;
                highestPrice = getHighesPriceByLottery(allEntries, "spiel77", session).then(function(maxPrize) {
                    winningResponse += "In Spiel 77: " + (maxPrize>0?maxPrize.substring(0, maxPrize.length-2) + "," + maxPrize.substring(maxPrize.length-2) : 0) + " €. ";

                    lotteryName = "super sechs";
                    config = skillHelper.getConfigByUtterance(lotteryName);
                    session.attributes.currentConfig = config;
                    highestPrice = getHighesPriceByLottery(allEntries, "super6", session).then(function(maxPrize) {
                        winningResponse += "In Super 6: " + (maxPrize>0?maxPrize.substring(0, maxPrize.length-2) + "," + maxPrize.substring(maxPrize.length-2) : 0) + " €. ";

                        lotteryName = "euro jackpot";
                        config = skillHelper.getConfigByUtterance(lotteryName);
                        session.attributes.currentConfig = config;
                        highestPrice = getHighesPriceByLottery(allEntries, "euroJackpot", session).then(function(maxPrize) {
                            winningResponse += "In Eurojackpott: " + (maxPrize>0?maxPrize.substring(0, maxPrize.length-2) + "," + maxPrize.substring(maxPrize.length-2) : 0) + " €. ";

                            lotteryName = "euro millions";
                            config = skillHelper.getConfigByUtterance(lotteryName);
                            session.attributes.currentConfig = config;
                            getHighesPriceByLottery(allEntries, "euroMillions", session).then(function(maxPrize) {
                                winningResponse += "In Euromillions: " + (maxPrize>0?maxPrize.substring(0, maxPrize.length-2) + "," + maxPrize.substring(maxPrize.length-2) : 0)  + " €. ";

                                lotteryName = "sechs aus fünf und vierzig";
                                config = skillHelper.getConfigByUtterance(lotteryName);
                                session.attributes.currentConfig = config;
                                getHighesPriceByLottery(allEntries, "austrian6aus45", session).then(function(maxPrize) {
                                    winningResponse += "In 6 aus 45: " + (maxPrize>0?maxPrize.substring(0, maxPrize.length-2) + "," + maxPrize.substring(maxPrize.length-2) : 0)  + " €. ";

                                    lotteryName = "joker";
                                    config = skillHelper.getConfigByUtterance(lotteryName);
                                    session.attributes.currentConfig = config;
                                    getHighesPriceByLottery(allEntries, "austrianJoker", session).then(function(maxPrize) {
                                        winningResponse += "In Joker: " + (maxPrize>0?maxPrize.substring(0, maxPrize.length-2) + "," + maxPrize.substring(maxPrize.length-2) : 0)  + " €. ";

                                        lotteryName = "powerball";
                                        config = skillHelper.getConfigByUtterance(lotteryName);
                                        session.attributes.currentConfig = config;
                                        getHighesPriceByLottery(allEntries, "powerBall", session).then(function(maxPrize) {
                                            winningResponse += "In Powerball: " + (maxPrize>0?maxPrize.substring(0, maxPrize.length-2) + "," + maxPrize.substring(maxPrize.length-2) : 0)  + " €. ";

                                            lotteryName = "mega millions";
                                            config = skillHelper.getConfigByUtterance(lotteryName);
                                            session.attributes.currentConfig = config;
                                            getHighesPriceByLottery(allEntries, "megaMillions", session).then(function(maxPrize) {
                                                winningResponse += "In Megamillions: " + (maxPrize>0?maxPrize.substring(0, maxPrize.length-2) + "," + maxPrize.substring(maxPrize.length-2) : 0)  + " €. ";
                                                response.tell(winningResponse);
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("Du kannst hallo zu mir sagen!", "Du kannst hallo zu mir sagen!");
    },
    "QuitIntent": function (intent, session, response) {
        response.tell("Tschüss und auf wiedersehen.");
    }
};

function getHighesPriceByLottery(allEntries, lotteryDbName, session) {
    console.log("going to check " + lotteryDbName);
    return skillHelper.getLotteryApiHelper(session.attributes.currentConfig.lotteryName).getLastLotteryDateAndNumbers().then(function(lotteryNumbersAndDate) {
        console.log("got numbers for " + lotteryDbName);
        var maxPrize = 0;
        var odds = null;
        if(lotteryNumbersAndDate) {
            //console.log("entries: " + JSON.stringify(allEntries));
            return asyncLoop(allEntries, (entry,next) => {
                //console.log("current entry: " + JSON.stringify(allEntries[i]));
                console.log("current entry with table: " + JSON.stringify(entry[lotteryDbName]));
                if(entry[lotteryDbName] && entry[lotteryDbName].length > 0) {
                    //console.log("sorting numbers");
                    var lotteryNumbers = skillHelper.sortLotteryNumbers(entry[lotteryDbName]);
                    console.log("sorted numbers: " + JSON.stringify(lotteryNumbers));
                    if(lotteryNumbers) {
                        //check how many matches we have with the given numbers!
                        var rank = skillHelper.getRank(session.attributes, lotteryNumbersAndDate, lotteryNumbers);
                        console.log("my rank for " + lotteryDbName + " is: " + rank);

                        if(!odds) {
                            //resolve odds
                            console.log("resolving new odds for " + lotteryDbName);
                            skillHelper.getLotteryApiHelper(session.attributes.currentConfig.lotteryName).getLastLotteryOdds().then(function(lotteryOdds) {
                                if(lotteryOdds) {
                                    odds = lotteryOdds;
                                }

                                if(odds && odds['rank'+rank])
                                    if(odds['rank'+rank].prize > maxPrize)
                                        maxPrize = odds['rank'+rank].prize;
                                
                                next();
                            });
                        } else {
                            if(odds && odds['rank'+rank])
                                if(odds['rank'+rank].prize > maxPrize)
                                    maxPrize = odds['rank'+rank].prize;
                            
                            next();
                        }
                    } else {
                        console.log("no lotteryNumbers for " + lotteryDbName);
                        next();
                    }
                } else {
                    console.log("no entry for " + lotteryDbName);
                    next();
                }
            }).then(() => {
                console.log("returning max prize for " + lotteryDbName + " = " + maxPrize);
                return maxPrize+""});
        }
        console.log("no numbers found for " + lotteryDbName);
        return 0;
    }).catch(function(error) {
        console.log(error);
        return 0;
    });
}

function asyncLoopImpl(array, iter, complete, index = 0) {
    if (index >= array.length) complete();
    else iter(array[index], () => asyncLoopImpl(array, iter, complete, ++index));
}
function asyncLoop(array, iter) {
    return new Promise((resolve, reject) => asyncLoopImpl(array, iter, () => resolve()));
}

function getPrize(session, rank, lotteryDbName) {
    return skillHelper.getLotteryApiHelper(session.attributes.currentConfig.lotteryName).getLastPrizeByRank(rank).then(function(money) {
        if(money) {
            console.log("my money for " + lotteryDbName + " is: " + money);
            return money;
        }
        else {
            console.log("my money for " + lotteryDbName + " is: " + 0);
            return 0;
        }
    }).catch(function(err) {
        console.log(err);
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the MyFlat skill.
    var myFlat = new MyFlat();

    locale = event.request.locale
    skillHelper = new skillHelperPrototype(locale);

    if (locale == 'en-US')
        myFlat.intentHandlers = US_Intent_Handler; //register us intent handler
    else
        myFlat.intentHandlers = DE_Intent_Handler; //register german intent handler

    myFlat.execute(event, context);
};