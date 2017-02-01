/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Hello World to say hello"
 *  Alexa: "Hello World!"
 */

/**
 * App ID for the skill
 */
var APP_ID = "amzn1.ask.skill.077188d5-fe1c-4d5a-a196-39c5648a3622";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var nodeFetch = require('node-fetch');

/**
 * MyFlat is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var MyFlat = function () {
    AlexaSkill.call(this, APP_ID);
};

var locale = "de-DE";
var myNumbers = [6,12,18,21,27,48];
var mySuperZahl = 6;

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
        var latestLottoDay = getLatestLottoDay();
        var numberOfMatches = checkLottoNumbers(latestLottoDay);
        var superZahl = getSuperZahl(latestLottoDay);

        if(numberOfMatches == 0)
            response.tell("In der letzten Ziehung hast du leider nichts gewonnen! Ich wünsche dir weiterhin viel Glück!");
        else if(numberOfMatches == 1)
            response.tell("In der letzten Ziehung hast du eine richtige Zahl aber leider nichts gewonnen! Ich wünsche dir weiterhin viel Glück!");
        else if(numberOfMatches == 2 && !(mySuperZahl == superZahl))
            response.tell("In der letzten Ziehung hast du zwei richtige Zahlen aber leider nichts gewonnen! Ich wünsche dir weiterhin viel Glück!");
        else if(numberOfMatches == 6 && mySuperZahl == superZahl)
            response.tell("Du hast den JackPott geknackt! Alle Zahlen und die Superzahl hast du richtig getippt. Herzlichen Glückwunsch!");
        else
            response.tell("In der letzten Ziehung hast du " + numberOfMatches + " richtige Zahlen " + (mySuperZahl == superZahl ? " und sogar die Superzahl richtig!" : ""));
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

function invokeBackend(url, options) {
    return nodeFetch(url, options)
        .then(function(res) {
            return res.json();
        }).catch(function(err) {
            response.tellWithCard("Fehler", "Weltraum-Fehler", "" + JSON.stringify(err));
        });
}

function checkLottoNumbers(lastDayJson) {
    var numberOfMatches = 0;

    var gewinnZahlen = [lastDayJson.zahlensuche_zahl, lastDayJson.zahlensuche_zahl3, lastDayJson.zahlensuche_zahl4, lastDayJson.zahlensuche_zahl5, lastDayJson.zahlensuche_zahl6, lastDayJson.zahlensuche_zahl7];

    for(var i=0; i < myNumbers.length;i++)
    {
        for(var j=0; j < gewinnZahlen.length;j++)
        {
            if(myNumbers[j] == gewinnZahlen[i])
                numberOfMatches++;
        }
    }

    return numberOfMatches;
}

function getSuperZahl(lastDay) {
    return lastDay.zahlensuche_zz;
}

function getLatestLottoDay() {
    var json = [];
    json = json.concat(getLottoByYear(new Date().getFullYear()));
    console.log(json[json.length-1]);

    var stringZahlen = JSON.stringify(json[json.length-1]);
    var lastDayJson = JSON.parse(stringZahlen.substring(1, stringZahlen.length-1));

    return lastDayJson;
}

function convertLottoToJson(html, div_name, row_offset) {
    var divtojson = require('html-div2json-js');
    return divtojson.convert(html, div_name, row_offset);
}

function getLottoByYear(year) {
    var url = "http://www.lottozahlenonline.de/statistik/beide-spieltage/lottozahlen-archiv.php?j=" + year;

    var request = require('sync-request');
    var res = request('GET', url);
    var json_object = convertLottoToJson(res.body, "gewinnzahlen", 1);
    //json_object.splice(0, 2);
    //console.log("write http response " + res.body);
    return json_object;
}