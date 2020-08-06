//Constants
const demoFlipInterval = 2500;  //Interval between the demo attempting to flip cards.
const flipDelay = 1000;         //Timer used for most timeOut calls(wait for animation timer)
const tooSlowInterval = 8000;   //Timer for if you take to long on your own turn. (only used on twoPlayer games)

//stores the card ids to assign all card boxes. It removes the number for figuring out the css image.
var cardsArray = ["heart1","heart2","boat1","boat2","car1","car2","troll1","troll2","brunost1","brunost2","fjord1","fjord2","genser1","genser2","ski1","ski2"];
//storage of "greyed out cards". used for the ai/demo to pair cards that have been shown on the board.
var foundCardsArray = [];

//global variables for controlling the game.
var startTime;                  //stored time of when game started.

//booleans
var acceptCardClicks = false;   //if false, can't click cards.
var enableSound = false;        //if false, can't play sound on card clicks.
var demoOn = true;              //if false, demo will not try to run.
var gameMode = false;           //if false, game has "two players". If true player two will be auto played.
var flipped = null;             //id of "clicked" card
var lastFlipped = null;         //id of previously "clicked" card for comparing
var difficulty=true;            //determines what to do when switch difficulty button is hit turning it "easy" or "hard"
var flipSound;                  //sound file that will be played on card "clicks" is stored here.

//timers
var demoTimer;                  //interval of the demo trying to run.
var nextTimeOut;                //next timeOut, used when processing cards so when top buttons are called, they can be interrupted.
var tooSlowTimer;               //timeOut stored for handling using too much time.

//numbers
var p1Points = 0;               //current score of player 1
var p2Points = 0;               //current score of player 2
var currentP = 1;               //current player
var totalRemoved = 0;           //once reached to amount of cards on board, end game.


$(document).ready(function() {
    //onLoad create a spawn of the cards
    //run demo that randomly shows and unShows cards.
    //displayCards shows last game played, if no game has been played it shows the demo row instead.

    flipSound = new Audio('Card-flip-sound.mp3');       //the sound when a card is flipped.
    flipSound.preload = 'auto';                         //make sure it is loaded when the page is opened.

    shuffle();                                          //shuffle the cards.
    updateMode();                                       //runs to assign proper text to elements.
    scoreUpdate();                                      //runs to assign proper text and look to score elements.
    $('#playing').text("Current Player: " + currentP);  //make sure text is proper for current player.


    $('.card-box').click(cardClick);                    //function that is run when a card is "clicked" this is updated when running switchDifficulty.

    $('#start-button').click(startGame);                //Starts a new game by resetting values, and stops demo.

    $('#show-button').click(showCards);                 //shows all cards from current game.

    $('#difficulty-button').click(switchDifficulty);    //spawns or de spawns cards depending on if its set to "easy" or "hard"

    $('#gameMode-button').click(switchMode);            //switches if you play with 2 players or against a ai.
    if(demoOn===true){
        //run demo mode here
        startDemo();                                    //function that sets a interval for running the demo code.
    }

});
//sets demoOn to true, and sets the interval call for it.
function startDemo(){
    demoOn=true;
    demoTimer = setInterval(demoRun,demoFlipInterval);  //look at top for timer.
}
//prevents the demo function from being run anymore.
function stopDemo(){
    demoOn=false;
    clearInterval(demoTimer);
}
//stops stuff running then creates new game, is called on the new game button.
function startGame(){
    stopDemo();
    clearTimeouts();
    newGame();
}
//repeatedly called when demo is on. Will only run if flipped does not have anything in it.
//flipped is turned to null when most processes for "clicks" are finished.
function demoRun(){
    if(flipped===null){
        autoPick();     //function for deciding which card the computer chooses.
    }
}
//adds or removes a row of cards, then starts a new game.
function switchDifficulty() {
    //stop all auto running stuff
    clearTimeouts();
    stopDemo();
    //if difficulty is true, then spawn a new row of cards, and add some ids to the cardsArray.
    if (difficulty) {
        //create a "row" class div at the bottom of page.
        $('.container').append('<div class="row" id="hard"></div>');
        //add 4 cards to the added "row" div
        for(i=0;i<4;i++) {
            $('#hard').prepend('<div class="col-sm card-box"</div>');
        }
        //add card, front and back to all of those card-boxes in the new "row" div
        $('#hard').find('.card-box').prepend('<div class="card">');
        $('#hard').find('.card').prepend('<div class="front">');
        $('#hard').find('.card').prepend('<div class="back">');
        $('div.card-box').toggleClass('card-box2');                         //makes all boxes smaller to fit screen
        //add in some new card ids
        cardsArray.push("money1","money2","pc1","pc2");
        document.getElementById("difficulty-button").innerHTML = "Hard";    //change the button text to hard
    }
    else{
        //remove the cards that got added for "hard" from the cardsArray, and remove the row that got spawned.
        cardsArray.splice(cardsArray.indexOf("money1"), 1);
        cardsArray.splice(cardsArray.indexOf("money2"), 1);
        cardsArray.splice(cardsArray.indexOf("pc1"), 1);
        cardsArray.splice(cardsArray.indexOf("pc2"), 1);
        $('#hard').remove();
        $('div.card-box2').toggleClass('card-box2');                        //make all boxes back to original size.
        document.getElementById("difficulty-button").innerHTML = "Easy";    //change the button text to easy
    }
    difficulty = !difficulty;           //switch difficulty between true and false.
    $('.card-box').click(cardClick);    //make sure the cards "spawned" can be clicked.
    newGame();                          //starts a new game, but demo keeps going.
}
//switch between playing two player of single player, then start a new game. Will turn off demo.
function switchMode(){
    gameMode = !gameMode;               //switch gameMode between true and false
    stopDemo();                         //stop the demo
    clearTimeouts();                    //prevent bad timeOut timings
    updateMode();                       //update the mode text.
    newGame();
}
//just changes the text of the button for game mode.
function updateMode(){
    if(gameMode) {
        document.getElementById("gameMode-button").innerHTML = "Single Player";
    }
    else{
        document.getElementById("gameMode-button").innerHTML = "Two Player";
    }
}
function ai(){
    //if gameMode is true, then run this upon switching to player 2.
    if(gameMode) {
        //run autoPick, and then after a bit, run it again through a timeOut(since every round requires 2 card picks.
        autoPick();
    }
}
//Function for picking a card based on Greyed cards(foundCardsArray), if no match then just pick a random non grey card.
function autoPick(){
        //if any card in foundCards match the previously flipped card, then pick it.
    if (lastFlipped !== null) {
        if(lastFlipped.slice(-1)==='2') {
            if (foundCardsArray.includes(lastFlipped.slice(0, -1) + 1)) {
                flipped = lastFlipped.slice(0, -1) + 1;
            }
        }
        else {
            if (foundCardsArray.includes(lastFlipped.slice(0, -1) + 2)) {
                flipped = lastFlipped.slice(0, -1) + 2;
            }
        }
    }
    //if no previous card has been picked(so on first run through) do a quick search if 2 greyed cards match.
       else{
           for(i=0;i<foundCardsArray.length;i++){
               var card=foundCardsArray[i];
               if(card.slice(-1)==='1'){
                   if(foundCardsArray.includes(card.slice(0,-1)+2)){
                       flipped = card.slice(0,-1)+2;
                   }
               }
               else{
                   if(foundCardsArray.includes(card.slice(0,-1)+1)){
                       flipped = card.slice(0,-1)+1;
                   }
               }
           }
       }
       //if no card was decided upon before this point, then just pick a random not flipped nor grey card.
       if (flipped === null) {
           var found = false;
           while (!found) {
               var randomCardID = cardsArray[Math.floor(Math.random() * cardsArray.length)];
               if (!$("#" + randomCardID).find(".card").hasClass("flipped") && !foundCardsArray.includes(randomCardID)) {
                   found = true;
               }
           }
           flipped = randomCardID;
       }
       //a flipped card should be picked by now, so flip it, play the sound and process the choice.
       $("#" + flipped).find(".card").toggleClass('flipped');
       playFlipSound();
       processCardClick()
}
//play the sound for flipping cards.
function playFlipSound() {
    //only when we want the sound to be played(prevents awkward flipping sounds when newGame is made and so on)
    if(enableSound) {
        var currentSound = flipSound.cloneNode();   //cloneNode is used so if you click fast, then the sound is still played twice.
        currentSound.play();
    }
}
//when a user clicks on a card this is called. Just sets flipped to the divs id and then runs the processCardClick.
function cardClick(){
    //only run if we want the game to accept card choice, demo is not on and the card clicked isn't a "flipped" card.
    if(acceptCardClicks===true && !$(this).find(".card").hasClass("flipped") && !demoOn){
        $(this).find(".card").toggleClass('flipped');   //flip the card chosen.
        flipped=this.id;                                //set flipped variable to this divs id.
        playFlipSound();                                //play the flip sound
        processCardClick();                             //run the process for when a card is chosen
        tooSlowToggle(false);                           //reset slow timer
    }
}
//this is run every time a card is "clicked" be it user or computer chosen, and handles the games logic.
function processCardClick(){
    //if lastFlipped is not null, we are then on the second card of the turn
    //so run the logic for seeing if its a match or not.
    if(lastFlipped!==null) {
        //remove number from the chosen cards dic, and the previous one. If they match run this.
        if (flipped.slice(0,-1)===lastFlipped.slice(0,-1)) {
            //tags both chosen cards as not previously picked anymore.
            selectedCards(flipped,false);
            selectedCards(lastFlipped,false);
            //makes both cards to null since a new "turn" is starting.
            lastFlipped=null;
            flipped=null;
            //gives a point to the current player, that player then plays again.
            givePoint();
        }
        //else it is not a match so run this.
        else{
            //do not allow card clicks, will be enabled after the "animations are done"
            acceptCardClicks=false;
            nextTimeOut = setTimeout(noMatch,flipDelay);    //after a slight delay, deal with not getting a match.
        }
    }
    //if lastFlipped is null, then this is the first chosen card for this round.
    else{
        lastFlipped=flipped;
        flipped=null;
        //ai needs to pick another card.
        if(gameMode && currentP===2){
            nextTimeOut = setTimeout(ai,flipDelay);
        }
    }
}
//run when 2 cards chosen did not match.
function noMatch(){
    //this timeOut reflips the first card, and calls on the time out for the second card. Cards can not be clicked
    //untill switchPlayer is called.
    nextTimeOut = setTimeout(function(){
        unFlipPick(lastFlipped);
        lastFlipped=null;
        //make it null for next turn.

        //flip the second card. Does the same as above, then switches current player.
            nextTimeOut = setTimeout(function() {
                unFlipPick(flipped);
                flipped=null;
                switchPlayer();
            },flipDelay);
    },flipDelay);
}
//just unflips and adds card as known Cards.
function unFlipPick(cardID){
    $('#'+cardID).find('.card').toggleClass('flipped');
    selectedCards(cardID,true);
    playFlipSound();
}

//adds points to the current player when a match is made. Also calls ai when needed.
function givePoint(){
    if(currentP===1){
        p1Points++;
    }
    else{
        p2Points++;
    }
    totalRemoved+= 2;//if this matches with the ids stored in the cardsArray, then end the game.
    scoreUpdate();   //updates the text and look for player scores.
    if(totalRemoved>=cardsArray.length){
        nextTimeOut = setTimeout(gameEnd,flipDelay);    //after a slight delay, call the game ending function.
    }
    //if current player is 2 and the gameMode for singlePLayer is on:
    else if(gameMode && currentP===2){
        nextTimeOut = setTimeout(ai,flipDelay);         //after a slight delay, it will pick a card.
    }
}
//just changes players.
function switchPlayer(){
    if(!demoOn) {
        acceptCardClicks=true;
    }
    //deals with switching to player 2
    if(currentP===1){
        currentP=2;
        //calls the ai, and prevents users from clicking on cards.
        if(gameMode) {
            acceptCardClicks=false;
            nextTimeOut = setTimeout(ai,flipDelay);
        }
    }
    //deals with switching to player 1.
    else{
            //makes it so a user can click again
        currentP=1;
    }
    tooSlowToggle(false);                               //makes the slow timer reset itself.
    $('#playing').toggleClass("p2");                    //toggles the class of playing(changes the color of the box).
    $('#playing').text('Current Player: ' + currentP);  //changes the text for current player.
}
//send in a card, and a boolean, greys out cards and adds them to a array for found cards, or removes these steps.
function selectedCards(theCard,prePicked){
    //if true, then assume it should be greyed out and added to the array(if no all ready in it).
    if(prePicked){
        $("#"+theCard).addClass("prePicked");
        if(!foundCardsArray.includes(theCard)) {
            foundCardsArray.push(theCard);
        }
    }
    //if not true, assume the steps above have been applied, and should be removed.
    else{
        $("#"+theCard).removeClass("prePicked");
        if(foundCardsArray.includes(theCard)) {
            foundCardsArray.splice(foundCardsArray.indexOf(theCard), 1);
        }
    }
}
//resets all values, turns off timeOuts, shuffles the cards and so on.
function newGame(){

    clearTimeouts();                    //turns off nextTimeOut to prevent badly timed calls.
    tooSlowToggle(true);                //turn off the slowTimer completely.
    acceptCardClicks=false;             //make sure no cards can be clicked until game is ready.
    //resets the values, and updates texts where needed etc.
    currentP=1;
    $('#playing').text('Current Player: ' + currentP);
    p1Points=0;
    p2Points=0;
    totalRemoved=0;
    lastFlipped = null;
    flipped = null;
    scoreUpdate();
    //only enable sound if demo is sett as off
    if(!demoOn) {
        enableSound = true;
    }
    startTime = new Date().getTime();   //timer used for presenting how long the game took.
    hideCards();                        //un flips all cards.
    nextTimeOut = setTimeout(function(){//after cards are un flipped, randomise the cards and allow card clicks again.
        shuffle();
        acceptCardClicks=true;},flipDelay);
}
//change scores and it's color.
function scoreUpdate(){
    //remove the class for both divs.
    $("#p1Score").removeClass();
    $("#p2Score").removeClass();
    //based on who is leading or if equal, color divs certain ways.
    if(p1Points>p2Points){
        //make p1 ahead and p2 behind
        $("#p1Score").addClass("col-sm ahead");
        $("#p2Score").addClass("col-sm behind");
    }
    else if(p1Points<p2Points){
        //make p1 ahead and p2 behind
        $("#p1Score").addClass("col-sm behind");
        $("#p2Score").addClass("col-sm ahead");
    }
    else if(p1Points===p2Points){
        //make both behind
        $("#p1Score").addClass("col-sm behind");
        $("#p2Score").addClass("col-sm behind");
    }
    //add the points to the text.
    $('#p1Score').text('P1 Score: ' + p1Points);
    $('#p2Score').text('P2 Score: ' + p2Points);
}
//when a game is deemed as finished:
function gameEnd(){
    //if the demo is still on, just make a new game.
    if(demoOn){
        newGame();      //create new game
    }
    //if demo is not on, let's instead announce who won and so on.
    else {
        //celebration gif added
        $(document.body).addClass('fireWorks');

        tooSlowToggle(true);                //turn off the slow timer.
        clearTimeouts();                    //make sure no nextTimeOuts are running.
        acceptCardClicks = false;           //no longer able to click on cards(just in case).
        var time = new Date().getTime();    //store time of which this game is deemed over.
        var gameTime = time-startTime;      //store the difference in time for figuring out how long it took.
        gameTime = (gameTime/1000).toFixed();//convert to seconds, and avoid decimals.
        //remove gif after delay.
        setTimeout(function(){
        $(document.body).removeClass('fireWorks');
        },5000);
        //add text for P1 LOSER/WINNER P2 LOSER/WINNER and playing box shows Time game took
        if(p1Points>p2Points){
            $('#p1Score').text('P1 WINNER');
            $('#p2Score').text('P2 LOSER');
        }
        else if(p2Points>p1Points){
            $('#p1Score').text('P1 LOSER');
            $('#p2Score').text('P2 WINNER');
        }
        else if(p1Points===p2Points){
            $('#p1Score').text('P1 LOSER');
            $('#p2Score').text('P2 LOSER');
        }
        $('#playing').text('Game lasted: ' + gameTime + ' seconds!');
    }
}
//function that randomises the cardsArray, then assigns the ids to  all card divs.
function shuffle(){
    foundCardsArray=[];                 //reset the foundCardsArray, since it should be a new game.
    var i = cardsArray.length, j, temp; //variables used for randomising.
    //fisher yates shuffle
    while(--i>0){
        j = Math.floor(Math.random() * (i+1));  //chose random index.
        temp = cardsArray[j];                   //store random index contents.
        cardsArray[j] = cardsArray[i];          //replace random index contents with current index contents
        cardsArray[i] = temp;                   //make current index contents what was stored in the random index.
    }
    //take all cards, remove old class, add new class, un flip should be handled by hideCards(); before this is run.
    var cards = $('.card-box');
    for(var i = 0; i<cards.length;i++){
        var card = cards[i];
        //set the id for the div currently working on, to the value of i so we can reference later.
        $(card).attr('id',cardsArray[i]);
        //Apply current Arrays css class to the div.
        if($(card).find(".back").attr('class')!=="back") {
            var lastClass = $(card).find(".back").attr('class').split(' ').pop();
            $(card).find(".back").removeClass(lastClass);
        }

        //Apply current cards ids css class to the div by removing the number at the end.
        $(card).find(".back").addClass(card.id.slice(0, -1));
        //if card was gray, then remove it.
        if($(card).hasClass('prePicked')){
            selectedCards(card.id,false);
        }
    }
}
//hide all flipped cards(needs to be run before shuffle or divs will show what they are before they flip)
function hideCards(){
    //deny card clicks until game is ready for it again.
    acceptCardClicks=false;
    //take all divs that are "cards" and un flip them.
    var cards = $('.card-box');
    for(var i=0;i<cards.length;i++) {
        var card=cards[i];
        //if it was flipped, then toggle it to not flipped.
        if($(card).find(".card").hasClass("flipped")){
            $(card).find(".card").toggleClass('flipped');
        }
        //if it was gray (and potentially in foundCardsArray) then remove this.
        if($(card).find(".card").hasClass("prePicked")){
            selectedCards(card,false);
        }
    }
}
//flip all cards so they show. Warning if clicked fast after another button
//the newGame function will not have repopulated the cards always.
function showCards(){
    acceptCardClicks=false;                   //deny card clicks until a new game is started.(just in case)
    tooSlowToggle(true);                      //turn off the slow timer.
    stopDemo();                               //stop the demo.
    clearTimeouts();                          //prevent timeOut calls doing stuff.
    //run through all "cards" and make sure they are flipped.
    var cards = $('.card-box');
    for(var i=0;i<cards.length;i++) {
        var card = cards[i];
        //if it was gray (and potentially in foundCardsArray) then remove this.
        if ($(card).hasClass("prePicked")) {
        selectedCards(card.id,false);
        }
        //if it is not flipped, then toggle it so it is flipped.
        if($(card).find(".card").hasClass("flipped")===false){
            $(card).find(".card").toggleClass('flipped');
        }
    }
}
//if no card is selected fast enough, then do this.
function tooSlow(){
    //if lastFlipped is something:
    //don't want to run in single player anyway, and safety measure for demo times.
    if(!demoOn && !gameMode) {
        if (lastFlipped !== null) {
            selectedCards(lastFlipped, true);                //make it so the flipped card is stored as found.
            $('#'+lastFlipped).find(".card").toggleClass('flipped');      //toggle it back to unFlipped.
            lastFlipped = null;
        }
        if (flipped !== null) {
            selectedCards(flipped, true);                //make it so the flipped card is stored as found.
            $('#'+flipped).find(".card").toggleClass('flipped');      //toggle it back to unFlipped.
            flipped = null;
        }
        switchPlayer();                                 //switch the current player.
    }
}
//turn off the slow timer, or restart it.
function tooSlowToggle(off){
    clearTimeout(tooSlowTimer);                                 //turn off the timer for being slow
    if(!off){
        tooSlowTimer = setTimeout(tooSlow,tooSlowInterval);     //turn the slow timer on again, if we want it on.
    }
}
//clears the nextTimeOut call, used to prevent weird stuff happening(bugs) when clicking buttons(new game etc).
function clearTimeouts(){
    //only clear the timer if there is one to clear.
    if(nextTimeOut!==null) {
        clearTimeout(nextTimeOut);
    }
}
