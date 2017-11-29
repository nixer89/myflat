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
var nodeFetch = require('node-fetch');
var dynasty = require('dynasty')(credentials);
var divtojson = require('html-div2json-js');

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

var LOTTO_URL = "http://www.lottozahlenonline.de/statistik/beide-spieltage/lottozahlen-archiv.php?j=";
var locale = "de-DE";
var myNumbers = ['6','12','18','21','27','48'];
var mySuperZahl = '6';

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
    "LotteryIntent": function (intent, session, response) {
        invokeBackend(LOTTO_URL + "2017").then(function(body) {
            var alleGewinnZahlen = convertLottoToJson(body, "gewinnzahlen", 1);
            var lastLottoDayJson = alleGewinnZahlen[alleGewinnZahlen.length-1][0];
            
            console.log(lastLottoDayJson);
            
            //check how many matches we have with the given numbers!
            var gewinnZahlen = getMatchingNumbers(lastLottoDayJson);
            
            console.log(gewinnZahlen);
            
            var numberOfMatches = gewinnZahlen.length;
            //also get the superzahl
            var superZahl = getSuperZahl(lastLottoDayJson);

            if(numberOfMatches == 0)
                response.tell("In der letzten Ziehung vom " + lastLottoDayJson.zahlensuche_datum + " hattest du leider keine richtige Zahl. Somit hast du leider nichts gewonnen! Ich wünsche dir weiterhin viel Glück!");
            else if(numberOfMatches == 1)
                response.tell("In der letzten Ziehung vom " + lastLottoDayJson.zahlensuche_datum + " hattest du nur eine richtige Zahl. Somit hast du leider nichts gewonnen! Ich wünsche dir weiterhin viel Glück!");
            else if(numberOfMatches == 2 && !(mySuperZahl == superZahl))
                response.tell("In der letzten Ziehung vom " + lastLottoDayJson.zahlensuche_datum + " hattest du nur zwei richtige Zahlen. Somit hast du leider nichts gewonnen! Ich wünsche dir weiterhin viel Glück!");
            else if(numberOfMatches == 6 && mySuperZahl == superZahl)
                response.tell("In der letzten Ziehung vom " + lastLottoDayJson.zahlensuche_datum + " hast den JackPott geknackt! Alle Zahlen und die Superzahl hast du richtig getippt. Jetzt kannst du es richtig krachen lassen! Herzlichen Glückwunsch!");
            else
                response.tell("In der letzten Ziehung vom " + lastLottoDayJson.zahlensuche_datum + " hast du " + numberOfMatches + " richtige Zahlen " + (mySuperZahl == superZahl ? " und sogar die Superzahl richtig! Herzlichen Glückwunsch!" : ""));
        });
    },
    "AskForStoredLotteryCount": function (intent, session, response) {
        lottoDbTable().scan().then(function(allEntries) {
            var output = "Aktuell befinden sich " + allEntries.length + " Einträge in deiner Datenbank";
            response.tell(output);
        });
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("Du kannst hallo zu mir sagen!", "Du kannst hallo zu mir sagen!");
    },
    "QuitIntent": function (intent, session, response) {
        response.tell("Tschüss und auf wiedersehen.");
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the MyFlat skill.
    var myFlat = new MyFlat();

    locale = event.request.locale

    if (locale == 'en-US')
        myFlat.intentHandlers = US_Intent_Handler; //register us intent handler
    else
        myFlat.intentHandlers = DE_Intent_Handler; //register german intent handler

    myFlat.execute(event, context);
};

function getMatchingNumbers(lastDayJson) {
    var numberOfMatches = 0;

    var gewinnZahlen = [lastDayJson.zahlensuche_zahl, lastDayJson.zahlensuche_zahl3, lastDayJson.zahlensuche_zahl4, lastDayJson.zahlensuche_zahl5, lastDayJson.zahlensuche_zahl6, lastDayJson.zahlensuche_zahl7];
    
    return gewinnZahlen.filter(n => myNumbers.indexOf(n) != -1);
}

function getSuperZahl(lastDay) {
    return lastDay.zahlensuche_zz;
}

function convertLottoToJson(html, div_name, row_offset) {
    return divtojson.convert(html, div_name, row_offset);
}

function invokeBackend(url, options) {
    return nodeFetch(url)
        .then(function(res) {
            return res.text();
        });
}