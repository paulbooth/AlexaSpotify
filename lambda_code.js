var http = require('http');
var post_options = {
    host: 'worthwhileloop.com',
    path: '/alexa',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
};

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    console.log('end request to ' + event.url);
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        // Prevent someone else from configuring a skill that sends requests to this function:
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.b2bdc42d-2715-4dda-9ed8-43878cfee232") {
             context.fail("Invalid Application ID");
         }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        console.log(e);
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
                + ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
                + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
        
    if ("PlayTitle" === intentName) {
        getTrackResponse(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    }

    // // Dispatch to your skill's intent handlers
    // if ("MyColorIsIntent" === intentName) {
    //     setColorInSession(intent, session, callback);
    // } else if ("WhatsMyColorIntent" === intentName) {
    //     getColorFromSession(intent, session, callback);
    // } else if ("HelpIntent" === intentName) {
    //     getWelcomeResponse(callback);
    // } else {
    //     throw "Invalid intent";
    // }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
                + ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getTrackResponse(intent, session, callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var track = intent.slots.Title.value;
    makeAdventureHouseRequest(track, function(error, body) {
        var cardTitle = body;
        var speechOutput = body;
        var repromptText = "You don't need reprompted";
        var shouldEndSession = true;
    
        callback(sessionAttributes,
                 buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
}

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "We all good. We all hood. We spotify. We play time.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Yo gimme that real trill track name and I will spin it.";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
// function setColorInSession(intent, session, callback) {
//     var cardTitle = intent.name;
//     var favoriteColorSlot = intent.slots.Color;
//     var repromptText = "";
//     var sessionAttributes = {};
//     var shouldEndSession = false;
//     var speechOutput = "";

//     if (favoriteColorSlot) {
//         favoriteColor = favoriteColorSlot.value;
//         sessionAttributes = createFavoriteColorAttributes(favoriteColor);
//         speechOutput = "I now know your favorite color is " + favoriteColor + ". You can ask me "
//                 + "your favorite color by saying, what's my favorite color?";
//         repromptText = "You can ask me your favorite color by saying, what's my favorite color?";
//     } else {
//         speechOutput = "I'm not sure what your favorite color is, please try again";
//         repromptText = "I'm not sure what your favorite color is, you can tell me your "
//                 + "favorite color by saying, my favorite color is red";
//     }

//     callback(sessionAttributes,
//              buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
// }

// function createFavoriteColorAttributes(favoriteColor) {
//     return {
//         favoriteColor: favoriteColor
//     };
// }

// function getColorFromSession(intent, session, callback) {
//     var cardTitle = intent.name;
//     var favoriteColor;
//     var repromptText = null;
//     var sessionAttributes = {};
//     var shouldEndSession = false;
//     var speechOutput = "";

//     if(session.attributes) {
//         favoriteColor = session.attributes.favoriteColor;
//     }

//     if(favoriteColor) {
//         speechOutput = "Your favorite color is " + favoriteColor + ", goodbye";
//         shouldEndSession = true;
//     }
//     else {
//         speechOutput = "I'm not sure what your favorite color is, you can say, my favorite color "
//                 + " is red";
//     }

//     // Setting repromptText to null signifies that we do not want to reprompt the user.
//     // If the user does not respond or says something that is not understood, the session
//     // will end.
//     callback(sessionAttributes,
//              buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
// }

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    }
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}

function makeAdventureHouseRequest(track, callback) {
    var reqPost = http.request(post_options, function(res) {
    console.log("Got response: " + res.statusCode);
    var body = '';
    res.on('data', function (chunk) {
        body += chunk;
    });
    res.on('end', function (chunk) {
        console.log(body);
        callback(null, body)
    });
        // context.succeed();
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
        callback(e, null)
        // context.done(null, 'FAILURE');
    });

    reqPost.write(JSON.stringify({track: track}));
    reqPost.end();
}
