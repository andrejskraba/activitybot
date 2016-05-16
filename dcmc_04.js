/*********************************************************************        
University of Maribor ************************************************
Faculty of Organizational Sciences ***********************************
Cybernetics & Decision Support Systems Laboratory ********************
@author Andrej Škraba ************************************************
@author Andrej Koložvari**********************************************
@author Davorin Kofjač ***********************************************
@author Radovan Stojanović *******************************************
*********************************************************************/

var firmata = require("firmata");

var LeftEncPin1 = 22;
var LeftEncPin2 = 23;
var LeftEncPin3 = 24;

var RightEncPin1 = 25;
var RightEncPin2 = 26;
var RightEncPin3 = 27;

var LeftPWMPin = 6;
var RightPWMPin = 7;

var LeftDirectionPin = 2;
var RightDirectionPin = 4;

var SolenoidPin = 3;

var InfRedSen1Pin = "A14";
var InfRedSen2Pin = "A15";

var InfRedSen1;
var InfRedSen2;

var Speed = 50;

var ArduinoStarted = false;

var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function() {
    console.log("Priključitev na Arduino");
    console.log("Omogočimo pine");
    this.pinMode(LeftEncPin1, five.Pin.INPUT);  // LEFT digital pin from encoder 1
    this.pinMode(LeftEncPin2, five.Pin.INPUT);  // LEFT digital pin from encoder 2
    this.pinMode(LeftEncPin3, five.Pin.INPUT);  // LEFT digital pin from encoder 3
    this.pinMode(RightEncPin1, five.Pin.INPUT); // RIGHT digital pin from encoder 1
    this.pinMode(RightEncPin2, five.Pin.INPUT); // RIGHT digital pin from encoder 2
    this.pinMode(RightEncPin3, five.Pin.INPUT); // RIGHT digital pin from encoder 3
    this.pinMode(SolenoidPin, five.Pin.OUTPUT);
    this.pinMode(LeftDirectionPin, five.Pin.OUTPUT);    // LEFT digital pin to change direction
    this.pinMode(RightDirectionPin, five.Pin.OUTPUT);   // RIGHT digital pin to change direction
    this.pinMode(LeftPWMPin, five.Pin.PWM);             // LEFT PWM pin
    this.pinMode(RightPWMPin, five.Pin.PWM);            // RIGHT PWM pin    
    this.digitalWrite(LeftEncPin1, 1);          // LEFT digital pin from encoder 1
    this.digitalWrite(LeftEncPin2, 1);          // LEFT digital pin from encoder 2
    this.digitalWrite(LeftEncPin3, 1);          // LEFT digital pin from encoder 3
    this.digitalWrite(RightEncPin1, 1);         // RIGHT digital pin from encoder 1
    this.digitalWrite(RightEncPin2, 1);         // RIGHT digital pin from encoder 2
    this.digitalWrite(RightEncPin3, 1);         // RIGHT digital pin from encoder 3
    this.digitalWrite(SolenoidPin, 0);          // Solenoid must be DOWN

    InfRedSen1 = new five.Pin(InfRedSen1Pin);
    InfRedSen2 = new five.Pin(InfRedSen2Pin);
    
    
    this.digitalRead(LeftEncPin1, function(value) { // LEFT funkcija se aktivira le, kadar se spremeni stanje; sicer bi bilo 1M čitanj na sekundo
        if (secondLeftFlag1 == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
        }
        else
        {
            //console.log("Pin LeftEncPin1 active " + Date.now() + " " + value + " " + secondLeftFlag1);
            secondLeftFlag1 = value;
            //console.log("Code on pin 22 active");
            if(NumLastMeasuresLeft < 3)
            {
                LeftLastMeasures.unshift(1);
                LeftLastTimes.unshift(Date.now());
                NumLastMeasuresLeft++;
                LeftLastIntervals.push(0);
                timesArrayLeft.push(Date.now());
            }
            else
            {
                LeftLastMeasures.pop();
                LeftLastMeasures.unshift(1);
                LeftLastTimes.pop();
                LeftLastTimes.unshift(Date.now());
                //console.log("LeftLastMeasures pin 1 " + LeftLastMeasures[0] + LeftLastMeasures[1] + LeftLastMeasures[2]);
                if(LeftLastMeasures[0] == 1 && LeftLastMeasures[1] == 2 && LeftLastMeasures[2] == 3
                || LeftLastMeasures[0] == 2 && LeftLastMeasures[1] == 3 && LeftLastMeasures[2] == 1
                || LeftLastMeasures[0] == 3 && LeftLastMeasures[1] == 1 && LeftLastMeasures[2] == 2)
                {
                    LeftLastIntervals.push(LeftLastTimes[0] - LeftLastTimes[1]);
                    timesArrayLeft.push(Date.now());
                    ///console.log("FORWARD");
                }
                else if(LeftLastMeasures[0] == 3 && LeftLastMeasures[1] == 2 && LeftLastMeasures[2] == 1
                || LeftLastMeasures[0] == 1 && LeftLastMeasures[1] == 3 && LeftLastMeasures[2] == 2
                || LeftLastMeasures[0] == 2 && LeftLastMeasures[1] == 1 && LeftLastMeasures[2] == 3)
                {
                    LeftLastIntervals.push(LeftLastTimes[1] - LeftLastTimes[0]);
                    timesArrayLeft.push(Date.now());
                    //console.log("BACKWARD");
                }
                else
                {
                    LeftLastIntervals.push(0);
                    timesArrayLeft.push(Date.now());
                    //console.log("STOP");
                }
            }
                    
            //timesArrayLeft.push(Date.now());
            //if (refreshClientGui == 1) {
            //    socket.emit("klientBeri1", {"vrednost": value, "cas": timesArrayLeft[timesArrayLeft.length - 1]});
            //}
        }
        
        //socket.emit("sporociloKlientu", "Flag 22 ->" + secondLeftFlag1);
        
    });
    
    this.digitalRead(LeftEncPin2, function(value) { // LEFT funkcija se aktivira le, kadar se spremeni stanje; sicer bi bilo 1M čitanj na sekundo
        
        if (secondLeftFlag2 == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
            //secondLeftFlag2++;
        }
        else
        {
            //console.log("       Pin LeftEncPin2 active " + Date.now() + " " + value + " " + secondLeftFlag2);
            secondLeftFlag2 = value;
            //console.log("       Code on pin 24 active");
            if(NumLastMeasuresLeft < 3)
            {
                LeftLastMeasures.unshift(2);
                LeftLastTimes.unshift(Date.now());
                NumLastMeasuresLeft++;
                LeftLastIntervals.push(0);
                timesArrayLeft.push(Date.now());
            }
            else
            {
                LeftLastMeasures.pop();
                LeftLastMeasures.unshift(2);
                LeftLastTimes.pop();
                LeftLastTimes.unshift(Date.now());
                //console.log("LeftLastMeasures pin 2 " + LeftLastMeasures[0] + LeftLastMeasures[1] + LeftLastMeasures[2]);
                if(LeftLastMeasures[0] == 1 && LeftLastMeasures[1] == 2 && LeftLastMeasures[2] == 3
                || LeftLastMeasures[0] == 2 && LeftLastMeasures[1] == 3 && LeftLastMeasures[2] == 1
                || LeftLastMeasures[0] == 3 && LeftLastMeasures[1] == 1 && LeftLastMeasures[2] == 2)
                {
                    LeftLastIntervals.push(LeftLastTimes[0] - LeftLastTimes[1]);
                    timesArrayLeft.push(Date.now());
                    ///console.log("FORWARD");
                }
                else if(LeftLastMeasures[0] == 3 && LeftLastMeasures[1] == 2 && LeftLastMeasures[2] == 1
                || LeftLastMeasures[0] == 1 && LeftLastMeasures[1] == 3 && LeftLastMeasures[2] == 2
                || LeftLastMeasures[0] == 2 && LeftLastMeasures[1] == 1 && LeftLastMeasures[2] == 3)
                {
                    LeftLastIntervals.push(LeftLastTimes[1] - LeftLastTimes[0]);
                    timesArrayLeft.push(Date.now());
                    //console.log("BACKWARD");
                }
                else
                {
                    LeftLastIntervals.push(0);
                    timesArrayLeft.push(Date.now());
                    //console.log("STOP");
                }
            }
                    
            //timesArrayLeft.push(Date.now());
            //if (refreshClientGui == 1) {
            //    socket.emit("klientBeri1", {"vrednost": value, "cas": timesArrayLeft[timesArrayLeft.length - 1]});
            //}
        }
        
        //socket.emit("sporociloKlientu", "Flag 24 ->" + secondLeftFlag2);
        
    });
    
    this.digitalRead(LeftEncPin3, function(value) { // LEFT funkcija se aktivira le, kadar se spremeni stanje; sicer bi bilo 1M čitanj na sekundo
        
        if (secondLeftFlag3 == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
            //secondLeftFlag3++;
        }
        else
        {
            //console.log("               Pin LeftEncPin3 active " + Date.now() + " " + value + " " + secondLeftFlag3);
            secondLeftFlag3 = value;
            //console.log("               Code on pin 26 active");
            if(NumLastMeasuresLeft < 3)
            {
                LeftLastMeasures.unshift(3);
                LeftLastTimes.unshift(Date.now());
                NumLastMeasuresLeft++;
                LeftLastIntervals.push(0);
                timesArrayLeft.push(Date.now());
            }
            else
            {
                LeftLastMeasures.pop();
                LeftLastMeasures.unshift(3);
                LeftLastTimes.pop();
                LeftLastTimes.unshift(Date.now());
                //console.log("LeftLastMeasures pin 3 " + LeftLastMeasures[0] + LeftLastMeasures[1] + LeftLastMeasures[2]);
                if(LeftLastMeasures[0] == 1 && LeftLastMeasures[1] == 2 && LeftLastMeasures[2] == 3
                || LeftLastMeasures[0] == 2 && LeftLastMeasures[1] == 3 && LeftLastMeasures[2] == 1
                || LeftLastMeasures[0] == 3 && LeftLastMeasures[1] == 1 && LeftLastMeasures[2] == 2)
                {
                    LeftLastIntervals.push(LeftLastTimes[0] - LeftLastTimes[1]);
                    timesArrayLeft.push(Date.now());
                    ///console.log("FORWARD");
                }
                else if(LeftLastMeasures[0] == 3 && LeftLastMeasures[1] == 2 && LeftLastMeasures[2] == 1
                || LeftLastMeasures[0] == 1 && LeftLastMeasures[1] == 3 && LeftLastMeasures[2] == 2
                || LeftLastMeasures[0] == 2 && LeftLastMeasures[1] == 1 && LeftLastMeasures[2] == 3)
                {
                    LeftLastIntervals.push(LeftLastTimes[1] - LeftLastTimes[0]);
                    timesArrayLeft.push(Date.now());
                    //console.log("BACKWARD");
                }
                else
                {
                    LeftLastIntervals.push(0);
                    timesArrayLeft.push(Date.now());
                    //console.log("STOP");
                }
            }
                    
            //timesArrayLeft.push(Date.now());
            //if (refreshClientGui == 1) {
            //    socket.emit("klientBeri1", {"vrednost": value, "cas": timesArrayLeft[timesArrayLeft.length - 1]});
            //}
        }
        
        //socket.emit("sporociloKlientu", "Flag 26 ->" + secondLeftFlag3);
        
    });
    
    
    this.digitalRead(RightEncPin1, function(value) { // RIGHT funkcija se aktivira le, kadar se spremeni stanje; sicer bi bilo 1M čitanj na sekundo
        
        if (secondRightFlag1 == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
            //secondRightFlag1++;
        }
        else
        {
            //console.log("Pin RightEncPin1 active " + Date.now() + " " + value + " " + secondRightFlag1);
            secondRightFlag1 = value;
            //console.log("Code on pin 22 active");
            if(NumLastMeasuresRight < 3)
            {
                RightLastMeasures.unshift(1);
                RightLastTimes.unshift(Date.now());
                NumLastMeasuresRight++;
                RightLastIntervals.push(0);
                timesArrayRight.push(Date.now());
            }
            else
            {
                RightLastMeasures.pop();
                RightLastMeasures.unshift(1);
                RightLastTimes.pop();
                RightLastTimes.unshift(Date.now());
                //console.log("RightLastMeasures pin 1 " + RightLastMeasures[0] + RightLastMeasures[1] + RightLastMeasures[2]);
                if(RightLastMeasures[0] == 1 && RightLastMeasures[1] == 2 && RightLastMeasures[2] == 3
                || RightLastMeasures[0] == 2 && RightLastMeasures[1] == 3 && RightLastMeasures[2] == 1
                || RightLastMeasures[0] == 3 && RightLastMeasures[1] == 1 && RightLastMeasures[2] == 2)
                {
                    RightLastIntervals.push(RightLastTimes[0] - RightLastTimes[1]);
                    timesArrayRight.push(Date.now());
                    ///console.log("FORWARD");
                }
                else if(RightLastMeasures[0] == 3 && RightLastMeasures[1] == 2 && RightLastMeasures[2] == 1
                || RightLastMeasures[0] == 1 && RightLastMeasures[1] == 3 && RightLastMeasures[2] == 2
                || RightLastMeasures[0] == 2 && RightLastMeasures[1] == 1 && RightLastMeasures[2] == 3)
                {
                    RightLastIntervals.push(RightLastTimes[1] - RightLastTimes[0]);
                    timesArrayRight.push(Date.now());
                    //console.log("BACKWARD");
                }
                else
                {
                    RightLastIntervals.push(0);
                    timesArrayRight.push(Date.now());
                    //console.log("STOP");
                }
            }
                    
            //timesArrayRight.push(Date.now());
            //if (refreshClientGui == 1) {
            //    socket.emit("klientBeri1", {"vrednost": value, "cas": timesArrayRight[timesArrayRight.length - 1]});
            //}
        }
        
        //socket.emit("sporociloKlientu", "Flag 22 ->" + secondRightFlag1);
        
    });
    
    this.digitalRead(RightEncPin2, function(value) { // Right funkcija se aktivira le, kadar se spremeni stanje; sicer bi bilo 1M čitanj na sekundo
        
        if (secondRightFlag2 == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
            //secondRightFlag2++;
        }
        else
        {
            //console.log("       Pin RightEncPin2 active " + Date.now() + " " + value + " " + secondRightFlag2);
            secondRightFlag2 = value;
            //console.log("       Code on pin 24 active");
            if(NumLastMeasuresRight < 3)
            {
                RightLastMeasures.unshift(2);
                RightLastTimes.unshift(Date.now());
                NumLastMeasuresRight++;
                RightLastIntervals.push(0);
                timesArrayRight.push(Date.now());
            }
            else
            {
                RightLastMeasures.pop();
                RightLastMeasures.unshift(2);
                RightLastTimes.pop();
                RightLastTimes.unshift(Date.now());
                //console.log("RightLastMeasures pin 2 " + RightLastMeasures[0] + RightLastMeasures[1] + RightLastMeasures[2]);
                if(RightLastMeasures[0] == 1 && RightLastMeasures[1] == 2 && RightLastMeasures[2] == 3
                || RightLastMeasures[0] == 2 && RightLastMeasures[1] == 3 && RightLastMeasures[2] == 1
                || RightLastMeasures[0] == 3 && RightLastMeasures[1] == 1 && RightLastMeasures[2] == 2)
                {
                    RightLastIntervals.push(RightLastTimes[0] - RightLastTimes[1]);
                    timesArrayRight.push(Date.now());
                    ///console.log("FORWARD");
                }
                else if(RightLastMeasures[0] == 3 && RightLastMeasures[1] == 2 && RightLastMeasures[2] == 1
                || RightLastMeasures[0] == 1 && RightLastMeasures[1] == 3 && RightLastMeasures[2] == 2
                || RightLastMeasures[0] == 2 && RightLastMeasures[1] == 1 && RightLastMeasures[2] == 3)
                {
                    RightLastIntervals.push(RightLastTimes[1] - RightLastTimes[0]);
                    timesArrayRight.push(Date.now());
                    //console.log("BACKWARD");
                }
                else
                {
                    RightLastIntervals.push(0);
                    timesArrayRight.push(Date.now());
                    //console.log("STOP");
                }
            }
                    
            //timesArrayRight.push(Date.now());
            //if (refreshClientGui == 1) {
            //    socket.emit("klientBeri1", {"vrednost": value, "cas": timesArrayRight[timesArrayRight.length - 1]});
            //}
        }
        
        //socket.emit("sporociloKlientu", "Flag 24 ->" + secondRightFlag2);
        
    });
    
    this.digitalRead(RightEncPin3, function(value) { // Right funkcija se aktivira le, kadar se spremeni stanje; sicer bi bilo 1M čitanj na sekundo
        
        if (secondRightFlag3 == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
            //secondRightFlag3++;
        }
        else
        {
            //console.log("               Pin RightEncPin3 active " + Date.now() + " " + value + " " + secondRightFlag3);
            secondRightFlag3 = value;
            //console.log("               Code on pin 26 active");
            if(NumLastMeasuresRight < 3)
            {
                RightLastMeasures.unshift(3);
                RightLastTimes.unshift(Date.now());
                NumLastMeasuresRight++;
                RightLastIntervals.push(0);
                timesArrayRight.push(Date.now());
            }
            else
            {
                RightLastMeasures.pop();
                RightLastMeasures.unshift(3);
                RightLastTimes.pop();
                RightLastTimes.unshift(Date.now());
                //console.log("RightLastMeasures pin 3 " + RightLastMeasures[0] + RightLastMeasures[1] + RightLastMeasures[2]);
                if(RightLastMeasures[0] == 1 && RightLastMeasures[1] == 2 && RightLastMeasures[2] == 3
                || RightLastMeasures[0] == 2 && RightLastMeasures[1] == 3 && RightLastMeasures[2] == 1
                || RightLastMeasures[0] == 3 && RightLastMeasures[1] == 1 && RightLastMeasures[2] == 2)
                {
                    RightLastIntervals.push(RightLastTimes[0] - RightLastTimes[1]);
                    timesArrayRight.push(Date.now());
                    ///console.log("FORWARD");
                }
                else if(RightLastMeasures[0] == 3 && RightLastMeasures[1] == 2 && RightLastMeasures[2] == 1
                || RightLastMeasures[0] == 1 && RightLastMeasures[1] == 3 && RightLastMeasures[2] == 2
                || RightLastMeasures[0] == 2 && RightLastMeasures[1] == 1 && RightLastMeasures[2] == 3)
                {
                    RightLastIntervals.push(RightLastTimes[1] - RightLastTimes[0]);
                    timesArrayRight.push(Date.now());
                    //console.log("BACKWARD");
                }
                else
                {
                    RightLastIntervals.push(0);
                    timesArrayRight.push(Date.now());
                    //console.log("STOP");
                }
            }
                    
            //timesArrayRight.push(Date.now());
            //if (refreshClientGui == 1) {
            //    socket.emit("klientBeri1", {"vrednost": value, "cas": timesArrayRight[timesArrayRight.length - 1]});
            //}
        }
        
        //socket.emit("sporociloKlientu", "Flag 26 ->" + secondRightFlag3);
        
    });

    ArduinoStarted = true;
});

var fs  = require("fs");

var options = {
  key: fs.readFileSync('agent2-key.pem'),
  cert: fs.readFileSync('agent2-cert.pem')
};

var https = require("https").createServer(options, handler) // tu je pomemben argument "handler", ki je kasneje uporabljen -> "function handler (req, res); v tej vrstici kreiramo server! (http predstavlja napo aplikacijo - app)
  , io  = require("socket.io").listen(https, { log: false })
  , url = require("url");

send404 = function(res) {
    res.writeHead(404);
    res.write("404");
    res.end();
}

//process.setMaxListeners(0); 

//********************************************************************************************************
// Simple routing ****************************************************************************************
//********************************************************************************************************
function handler (req, res) { // handler za "response"; ta handler "handla" le datoteko index.html
    var path = url.parse(req.url).pathname; // parsamo pot iz url-ja
    
    switch(path) {
    
    case ('/') : // v primeru default strani

    fs.readFile(__dirname + "/dcmc_01.html",
    function (err, data) { // callback funkcija za branje tekstne datoteke
        if (err) {
            res.writeHead(500);
            return res.end("Napaka pri nalaganju strani pwmbutton...html");
        }
        
    res.writeHead(200);
    res.end(data);
    });
     
    case('/admin') :
               
    fs.readFile(__dirname + "/dcmc_admin_01.html",
    function (err, data) { // callback funkcija za branje tekstne datoteke
        if (err) {
            res.writeHead(500);
            return res.end("Napaka pri nalaganju strani admin...html");
        }
        
    res.writeHead(200);
    res.end(data);
    });
            
    case('/adminspeech') : // v primeru, da je v web naslovu na koncu napisano /zahvala
               
    fs.readFile(__dirname + "/dcmc_admin_speech_01.html",
    function (err, data) { // callback funkcija za branje tekstne datoteke
        if (err) {
            res.writeHead(500);
            return res.end("Napaka pri nalaganju strani admin...html");
        }
        
    res.writeHead(200);
    res.end(data);
    });        
            
    break;    
            
    default: send404(res);
            
    }
}
//********************************************************************************************************
//********************************************************************************************************
//********************************************************************************************************

https.listen(8080); // določimo na katerih vratih bomo poslušali | vrata 80 sicer uporablja LAMP | lahko določimo na "router-ju" (http je glavna spremenljivka, t.j. aplikacija oz. app)

console.log("Uporabite (S) httpS! - Zagon sistema - Uporabite (S) httpS!"); // na konzolo zapišemo sporočilo (v terminal)

var sendDataToClient = 1; // flag to send data to the client

var refreshFrequency = 50; // frequency of control algorithm refresh in ms

var STARTctrlFW = 0; // zastavica za zagon kontrolnega algortma za Naprej
var STARTctrlBK = 0; // zastavica za zagon kontrolnega algortma za Nazaj
var STARTctrlSpinL = 0; // zastavica za vklop kontrolnega algoritma SpinL
var STARTctrlSpinR = 0; // zastavica za izklop kontrolnega algoritma SpinR
var STARTctrlHzLRfw = 0; // zastavica za rotacijo koles naprej z različnimi frekvencami, npr. Levo = 10Hz, Desno = 5Hz 
var STARTctrlHzLRbk = 0; // zastavica za rotacijo koles nazaj z različnimi frekvencami, npr. Levo = 10Hz, Desno = 5Hz  

var STARTctrl = 0;

var upperLimitPWM = 125; // zgornja meja vrednosti PWM - le ta določa koliko lahko največ kontrolni algoritem pošlje na PWM    
var lowerLimitPWM = 0; // spodnja meja vrednosti PWM - le ta določa koliko lahko najmanj kontrolni algoritem pošlje na PWM    

var zelenaVrednostNaprej = 0;    
var zelenaVrednostNazaj = 0;

var zelenaVrednostSpinLevo = 0;    
var zelenaVrednostSpinDesno = 0;         

var zelenaVrednostHzLevo = 0;    
var zelenaVrednostHzDesno = 0;

var zelenaVrednostLevo = 0;    
var zelenaVrednostDesno = 0;

var PWMfw = 0; // value for pin forward (pin 5)
var PWMbk = 0; // falue for pin backward (pin 6)
var PWMleft = 0; // value for pin left (pin 9)
var PWMright = 0; // value for pin right (pin 10)

var refreshClientGui = 1; // flag for refreshing values in client GUI

var arraySensor = new Array();
    arraySensor[0] = 0;
    arraySensor[1] = 0;
    arraySensor[2] = 0;
    arraySensor[3] = 0;
    arraySensor[4] = 0;
    arraySensor[5] = 0;
    arraySensor[6] = 0;
    arraySensor[7] = 0;
    arraySensor[8] = 0;
    arraySensor[9] = 0;

var ErrorLeft = new Array();
var IntegralCounterLeft = 0;
var ErrorRight = new Array();
var IntegralCounterRight = 0;
var SummInterval = 3;
var KpLeft = 0.03;
var KiLeft = 0.07;
var KdLeft = 0.02;
var KpRight = 0.03;
var KiRight = 0.07;
var KdRight = 0.02;
var LeftLastMeasures = new Array();
var LeftLastTimes = new Array();
var LeftLastIntervals = new Array();
var NumLastMeasuresLeft = 0;
var RightLastMeasures = new Array();
var RightLastTimes = new Array();
var RightLastIntervals = new Array();
var NumLastMeasuresRight = 0;
var StateNotChanged = 1;
var LeftStoppedFlag = 1;
var RightStoppedFlag = 1;

var secondLeftFlag1 = 0;  // zastavica, da vemo, da sta iz LEVEGA enkoderja prišli vsaj dve vrednosti    
var secondLeftFlag2 = 0;  // zastavica, da vemo, da sta iz LEVEGA enkoderja prišli vsaj dve vrednosti    
var secondLeftFlag3 = 0;  // zastavica, da vemo, da sta iz LEVEGA enkoderja prišli vsaj dve vrednosti    
var secondRightFlag1 = 0; // zastavica, da vemo, da sta iz DESNEGA enkoderja prišli vsaj dve vrednosti    
var secondRightFlag2 = 0; // zastavica, da vemo, da sta iz DESNEGA enkoderja prišli vsaj dve vrednosti  
var secondRightFlag3 = 0; // zastavica, da vemo, da sta iz DESNEGA enkoderja prišli vsaj dve vrednosti  
 
var timePreviousLeft = Date.now(); // inicializiramo čas ob povezavi klienta
var timePreviousRight = timePreviousLeft;

var timesArrayLeft = new Array();
var timesArrayRight = new Array();

function countValuesAndChopArrayLeft (timesArrayLeft, timeValue, LeftLastIntervals) {
// function counts the values in the timesArrayLeft that are less or equal to timeValue and chops them out
// function returns chopped array and number of occurences
// timesArrayLeft must be defined as global variable should not lose time in between    

counter = 0;
var AvgInterval = 0;

for (i = 0; i < timesArrayLeft.length; i++) 
{
    if (timesArrayLeft[i] <= timeValue) 
    {
        AvgInterval += LeftLastIntervals[i];
        counter++;
    }
    else 
    {
        break;
    }
}
    
timesArrayLeft.splice(0, counter); // remove the values from 0, n=counter values
LeftLastIntervals.splice(0, counter);
  
if(counter != 0)
    return AvgInterval/counter;
else
    return 0;
//return counter; // function returns the number of occurences of times leess or equal to timeValue    

}

function countValuesAndChopArrayRight (timesArrayRight, timeValue, RightLastIntervals) {
// function counts the values in the timesArrayRight that are less or equal to timeValue and chops them out
// function returns chopped array and number of occurences
// timesArrayRight must be defined as global variable should not lose time in between    

counter = 0;
var AvgInterval = 0;

for (i = 0; i < timesArrayRight.length; i++) 
{
    if (timesArrayRight[i] <= timeValue) 
    {
        AvgInterval += RightLastIntervals[i];
        counter++;
    }
    else 
    {
        break;
    }
}
    
timesArrayRight.splice(0, counter); // remove the values from 0, n=counter values
RightLastIntervals.splice(0, counter);
  
if(counter != 0)
    return AvgInterval/counter;
else
    return 0;
    
}

function SetPWMLeft(PWMtoSet)   // Change DIR pin depending on PWM sign + use upperLimitPWM
{
    if(PWMtoSet > upperLimitPWM)
        PWMtoSet = upperLimitPWM;
    if(PWMtoSet < -upperLimitPWM)
        PWMtoSet = -upperLimitPWM;
    //console.log("PWMleft = " + PWMleft);
    if(PWMtoSet < 0)
    {
        board.digitalWrite(LeftDirectionPin, 0);
        board.analogWrite(LeftPWMPin, -PWMtoSet);
    }
    else
    {
        board.digitalWrite(LeftDirectionPin, 1);
        board.analogWrite(LeftPWMPin, PWMtoSet);
    }
}

function SetPWMRight(PWMtoSet) // Change DIR pin depending on PWM sign + use upperLimitPWM
{
    if(PWMtoSet > upperLimitPWM)
        PWMtoSet = upperLimitPWM;
    if(PWMtoSet < -upperLimitPWM)
        PWMtoSet = -upperLimitPWM;
    //console.log("PWMright = " + PWMright);
    if(PWMtoSet < 0)
    {
        board.digitalWrite(RightDirectionPin, 0);
        board.analogWrite(RightPWMPin, -PWMtoSet);
    }
    else
    {
        board.digitalWrite(RightDirectionPin, 1);
        board.analogWrite(RightPWMPin, PWMtoSet);
    }
}

function SolenoidDown()
{
    if(StateNotChanged)                         // If we did not decide to drive in the previous 1 sec
    {
        board.digitalWrite(SolenoidPin, 0);     // Than trigger solenoid DOWN
        console.log("SOLENOID DOWN!");
    }
}

function SolenoidCheck()
{
    if(zelenaVrednostDesno != 0 || zelenaVrednostLevo != 0) // If ANY of the wheels MUST go...
    {
        if(StateNotChanged == 1)
        {
            LeftStoppedFlag = 0;
            RightStoppedFlag = 0;
            StateNotChanged = 0;                    // We know that we want to drive! No we need to pull solenoid DOWN even if the timer is set        
            board.digitalWrite(SolenoidPin, 1);     // If we want to go, it MUST be switched ON
            console.log("SOLENOID UP!");
        }
    }
    else
    {
        if(frequencyLeft == 0 && zelenaVrednostLevo == 0 && ErrorLeft[0] == 0 && ErrorLeft[1] == 0 && ErrorLeft[2] == 0 &&
           frequencyRight == 0 && zelenaVrednostDesno == 0 && ErrorRight[0] == 0 && ErrorRight[1] == 0 && ErrorRight[2] == 0 && 
           StateNotChanged == 0) // If we are on a stop and drived before
        {
            StateNotChanged = 1;                // Remember that we stopped
            console.log("SOLENOID TIMER SET!");
            TimeoutSolenoid = setTimeout(SolenoidDown, 1000);    // And check again in 1 sec if something changed
        }        
    }
}

function GetPWMfromPIDLeft(zelenaVrednostLevo,frequencyLeft)
{
    if(IntegralCounterLeft < SummInterval)
    {
        ErrorLeft.unshift(zelenaVrednostLevo - frequencyLeft);
        IntegralCounterLeft++;
    }
    else
    {
        ErrorLeft.pop();
        ErrorLeft.unshift(zelenaVrednostLevo - frequencyLeft);
    }
    if(IntegralCounterLeft == 1)
    {
        PWMleft += KiLeft*ErrorLeft[0];
    }
    else if(IntegralCounterLeft == 2)
    {
        PWMleft += KpLeft*(ErrorLeft[0] - ErrorLeft[1]) + KiLeft*ErrorLeft[0];
    }
    else
    {
        PWMleft += KpLeft*(ErrorLeft[0] - ErrorLeft[1]) + KiLeft*ErrorLeft[0] + KdLeft*(ErrorLeft[0] - 2*ErrorLeft[1] + ErrorLeft[2]);
    }
    if(frequencyLeft == 0 && zelenaVrednostLevo == 0 && ErrorLeft[0] == 0 && ErrorLeft[1] == 0 && ErrorLeft[2] == 0 &&
      frequencyRight == 0 && zelenaVrednostDesno == 0 && ErrorRight[0] == 0 && ErrorRight[1] == 0 && ErrorRight[2] == 0)
    {
        PWMleft = 0;
        LeftStoppedFlag = 1;
        if(RightStoppedFlag == 1 && STARTctrl != 0)
        {
            STARTctrl = 0;
            console.log("Control algorithm STOPPED");
            SolenoidCheck();
        }            
    }    
    return PWMleft;
}

function GetPWMfromPIDRight(zelenaVrednostDesno,frequencyRight)
{
    if(IntegralCounterRight < SummInterval)
    {
        ErrorRight.unshift(zelenaVrednostDesno - frequencyRight);
        IntegralCounterRight++;
    }
    else
    {
        ErrorRight.pop();
        ErrorRight.unshift(zelenaVrednostDesno - frequencyRight);
    }
    //console.log("ErrorRight[0] = " + ErrorRight[0]);        
    if(IntegralCounterRight == 1)
    {
        PWMright += KiRight*ErrorRight[0];
    }
    else if(IntegralCounterRight == 2)
    {
        PWMright += KpRight*(ErrorRight[0] - ErrorRight[1]) + KiRight*ErrorRight[0];
    }
    else
    {
        PWMright += KpRight*(ErrorRight[0] - ErrorRight[1]) + KiRight*ErrorRight[0] + KdRight*(ErrorRight[0] - 2*ErrorRight[1] + ErrorRight[2]);
    }
    if(frequencyLeft == 0 && zelenaVrednostLevo == 0 && ErrorLeft[0] == 0 && ErrorLeft[1] == 0 && ErrorLeft[2] == 0 &&
      frequencyRight == 0 && zelenaVrednostDesno == 0 && ErrorRight[0] == 0 && ErrorRight[1] == 0 && ErrorRight[2] == 0)
    {
        PWMright = 0;
        RightStoppedFlag = 1;
        if(LeftStoppedFlag == 1 && STARTctrl != 0)
        {
            STARTctrl = 0;
            console.log("Control algorithm STOPPED");
            SolenoidCheck();
        }
    }
    return PWMright;
}

function ReadDistanceSensors()
{
    var DistanceLeft;
    five.Pin.read(InfRedSen1, function(error, value) {
	var volts = value*0.0048828125; ;
	var distance = 65*Math.pow(volts,-1.10);
	if (distance > 200)
		distance = 200;
	DistanceLeft = distance;
  	//console.log(distance);
    });
    five.Pin.read(InfRedSen2, function(error, value) {
	var volts = value*0.0048828125; ;
	var distance = 65*Math.pow(volts,-1.10);
	if (distance > 200)
		distance = 200;
  	console.log(distance);
	DistanceRight = distance;
    });
    if (DistanceLeft < 40 || DistanceRight < 40)
    {
	zelenaVrednostLevo = 0;
	zelenaVrednostDesno = 0;
    }
}

function frequencyMeasureAndControlLeftRight() {
    
    timeNextLeft = Date.now();
    timeNextRight = timeNextLeft;    
    numberOfCountsLeft = countValuesAndChopArrayLeft(timesArrayLeft, timeNextLeft, LeftLastIntervals); // number of counts up to current time within last second
    numberOfCountsRight = countValuesAndChopArrayRight(timesArrayRight, timeNextRight, RightLastIntervals); // number of counts up to current time within last second
    timeIntervalLeft = timeNextLeft - timePreviousLeft;
    timePreviousLeft = timeNextLeft;
    if(numberOfCountsLeft != 0)
        frequencyLeft = -1000/numberOfCountsLeft;
    else
        frequencyLeft = 0;
    timeIntervalRight = timeNextRight - timePreviousRight;
    timePreviousRight = timeNextRight;
    if(numberOfCountsRight != 0)
        frequencyRight = 1000/numberOfCountsRight;
    else
        frequencyRight = 0;

    if (ArduinoStarted)
    {
	ReadDistanceSensors();
    }

    // **************************************************************************************
    // Kontrolni algoritem ZAČETEK
    // **************************************************************************************
    
    SolenoidCheck(); // Trigger solenoid ON or OFF automatically if we are not driving

    if (STARTctrl == 1) { // le v primeru, da želene vrednosti v smeri nazaj nismo podali izvedemo algoritem za naprej

        //socket.emit("ukazArduinu", {"stevilkaUkaza": stevilkaUkaza, "pinNo": 5, "valuePWM": 1}); // za vsak primer pin naprej postavimo na 0
        //console.log("želena Levo " + zelenaVrednostLevo);
        //console.log("želena Desno " + zelenaVrednostDesno);
        //console.log("frequencyLeft " + frequencyLeft);
        //console.log("frequencyRight " + frequencyRight);
        PWMleft = GetPWMfromPIDLeft(zelenaVrednostLevo,frequencyLeft);
        PWMright = GetPWMfromPIDRight(zelenaVrednostDesno,frequencyRight);
        console.log("PWM for LEFT from PID is " + PWMleft);
        console.log("PWM for RIGHT from PID is " + PWMright);
        SetPWMLeft(PWMleft);
        SetPWMRight(PWMright);    
    }
    
    // **************************************************************************************
    // Kontrolni algoritem KONEC
    // **************************************************************************************      
}
    
var frequencyMeasureAndControlLeftRightTimer=setInterval(function(){frequencyMeasureAndControlLeftRight()}, refreshFrequency); 



io.sockets.on("connection", function(socket) {  // od oklepaja ( dalje imamo argument funkcije on -> ob 'connection' se prenese argument t.j. funkcija(socket) 
                                                // ko nekdo pokliče IP preko "browser-ja" ("browser" pošlje nekaj node.js-u) se vzpostavi povezava = "connection" oz.
                                                // je to povezava = "connection" oz. to smatramo kot "connection"
                                                // v tem primeru torej želi client nekaj poslati (ko nekdo z browserjem dostopi na naš ip in port)
                                                // ko imamo povezavo moramo torej izvesti funkcijo: function (socket)
                                                // pri tem so argument podatki "socket-a" t.j. argument = socket
                                                // ustvari se socket_id

    socket.emit("sporociloKlientu", Date.now()); // izvedemo funkcijo = "hello" na klientu, z argumentom, t.j. podatki="Strežnik povezan."

	socket.on("ukazArduinu", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išči funkcijo ukazArduinu)
        if (data.stevilkaUkaza == "1") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 1
            //board.digitalWrite(12, 0); // na pinu 12 zapišemo vrednost HIGH
            //board.analogWrite(6, 150); // tretji argument je lahko tudi callback - za funkcijo, ki jo kličemo po izvedbi
            console.log("ana6=" + "150");
            //board.analogWrite(6, pwmValue2); // tretji argument je lahko tudi callback - za funkcijo, ki jo kličemo po izvedbi
            
            socket.emit("sporociloKlientu", "LED prižgana."); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
        }
        else if (data.stevilkaUkaza == "0") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
            board.digitalWrite(3, 0); // na pinu 12 zapišemo vrednost LOW
            //board.analogWrite(6, 0); // tretji argument je lahko tudi callback - za funkcijo, ki jo kličemo po izvedbi
            socket.emit("sporociloKlientu", "LED ugasnjena."); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED ugasnjena."
        }
        else if (data.stevilkaUkaza == "2") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 2
            if (data.valuePWM != 0) { // če PWM vrednost ni 0 vklopimo rele
                board.digitalWrite(3, 1); // na pinu 3 zapišemo vrednost HIGH
                //board.digitalWrite(12, 0); // na pinu 3 zapišemo vrednost HIGH
            }
            //else { // če je PWM vrednost enaka 0 izklopimo rele
            //    board.digitalWrite(3, board.LOW); // na pinu 3 zapišemo vrednost LOW
            //}
            board.analogWrite(data.pinNo, data.valuePWM); // tretji argument je lahko tudi callback - za funkcijo, ki jo kličemo po izvedbi
            console.log("pinNO=" + data.pinNo + " | " + "valuePWM = " + data.valuePWM);
            socket.emit("sporociloKlientu", "PWM Custom."); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED ugasnjena."
        }
        
        else if (data.stevilkaUkaza == "3") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
            if (data.valuePWM != 0) { // če PWM vrednost ni 0 vklopimo rele
                board.digitalWrite(3, 1); // na pinu 3 zapišemo vrednost HIGH
            }
            //else { // če je PWM vrednost enaka 0 izklopimo rele
            //    board.digitalWrite(3, board.LOW); // na pinu 3 zapišemo vrednost LOW
            //    board.digitalWrite(12, board.LOW); // na pinu 3 zapišemo vrednost LOW
            //}
            board.analogWrite(data.pinNo, data.valuePWM); // tretji argument je lahko tudi callback - za funkcijo, ki jo kličemo po izvedbi
            console.log("pinNO=" + data.pinNo + " | " + "valuePWM = " + data.valuePWM);
            socket.emit("sporociloKlientu", "PWM Custom."); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED ugasnjena."
        }        
        
	});
    
    
    socket.on("commandToArduinoFW", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išči funkcijo ukazArduinu)

        zelenaVrednostLevo = Speed; 
        zelenaVrednostDesno = Speed;

        if (refreshClientGui == 1) {
        socket.emit("refreshClientGUInumValues", {
            "zelenaVrednostNaprej": zelenaVrednostNaprej,
            "zelenaVrednostNazaj": zelenaVrednostNazaj,
            "zelenaVrednostSpinLevo": zelenaVrednostSpinLevo, 
            "zelenaVrednostSpinDesno": zelenaVrednostSpinDesno,
            "zelenaVrednostHzLevo": zelenaVrednostHzLevo, 
            "zelenaVrednostHzDesno": zelenaVrednostHzDesno,
            "PWMfw": PWMfw,
            "PWMbk": PWMbk,
            "PWMleft": PWMleft,
            "PWMright": PWMright,
        });
        }

        STARTctrl = 1; // zastavico za STARTctrl dvignemo, kontrolni algoritem lahko prične z delom, vse nastavitve zgoraj so vnešene
	
    });
    
    socket.on("commandToArduinoBK", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išči funkcijo ukazArduinu)
        
        zelenaVrednostLevo = -Speed; 
        zelenaVrednostDesno = -Speed;

        if (refreshClientGui == 1) {
        socket.emit("refreshClientGUInumValues", {
            "zelenaVrednostNaprej": zelenaVrednostNaprej,
            "zelenaVrednostNazaj": zelenaVrednostNazaj,
            "zelenaVrednostSpinLevo": zelenaVrednostSpinLevo, 
            "zelenaVrednostSpinDesno": zelenaVrednostSpinDesno,
            "zelenaVrednostHzLevo": zelenaVrednostHzLevo, 
            "zelenaVrednostHzDesno": zelenaVrednostHzDesno,
            "PWMfw": PWMfw,
            "PWMbk": PWMbk,
            "PWMleft": PWMleft,
            "PWMright": PWMright,
        });
        }

        STARTctrl = 1; 
        	
    });
    
    socket.on("commandToArduinoSpinL", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išči funkcijo ukazArduinu)
        
        zelenaVrednostLevo = -Speed; 
        zelenaVrednostDesno = Speed;

        if (refreshClientGui == 1) {
        socket.emit("refreshClientGUInumValues", {
            "zelenaVrednostNaprej": zelenaVrednostNaprej,
            "zelenaVrednostNazaj": zelenaVrednostNazaj,
            "zelenaVrednostSpinLevo": zelenaVrednostSpinLevo, 
            "zelenaVrednostSpinDesno": zelenaVrednostSpinDesno,
            "zelenaVrednostHzLevo": zelenaVrednostHzLevo, 
            "zelenaVrednostHzDesno": zelenaVrednostHzDesno,
            "PWMfw": PWMfw,
            "PWMbk": PWMbk,
            "PWMleft": PWMleft,
            "PWMright": PWMright,
        });
        }

        STARTctrl = 1; 
	
    });
    
socket.on("commandToArduinoSpinR", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išči funkcijo ukazArduinu)
        
        zelenaVrednostLevo = Speed; 
        zelenaVrednostDesno = -Speed;

        if (refreshClientGui == 1) {
        socket.emit("refreshClientGUInumValues", {
            "zelenaVrednostNaprej": zelenaVrednostNaprej,
            "zelenaVrednostNazaj": zelenaVrednostNazaj,
            "zelenaVrednostSpinLevo": zelenaVrednostSpinLevo, 
            "zelenaVrednostSpinDesno": zelenaVrednostSpinDesno,
            "zelenaVrednostHzLevo": zelenaVrednostHzLevo, 
            "zelenaVrednostHzDesno": zelenaVrednostHzDesno,
            "PWMfw": PWMfw,
            "PWMbk": PWMbk,
            "PWMleft": PWMleft,
            "PWMright": PWMright,
        });
        }

        STARTctrl = 1; 
	
    });
    
    socket.on("commandToArduinoTurnFwLeftL5R10", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išči funkcijo ukazArduinu)
        
        zelenaVrednostLevo = Speed/2; 
        zelenaVrednostDesno = Speed;

        if (refreshClientGui == 1) {
        socket.emit("refreshClientGUInumValues", {
            "zelenaVrednostNaprej": zelenaVrednostNaprej,
            "zelenaVrednostNazaj": zelenaVrednostNazaj,
            "zelenaVrednostSpinLevo": zelenaVrednostSpinLevo, 
            "zelenaVrednostSpinDesno": zelenaVrednostSpinDesno,
            "zelenaVrednostHzLevo": zelenaVrednostHzLevo, 
            "zelenaVrednostHzDesno": zelenaVrednostHzDesno,
            "PWMfw": PWMfw,
            "PWMbk": PWMbk,
            "PWMleft": PWMleft,
            "PWMright": PWMright,
        });
        }

        STARTctrl = 1; 
	
    });   
    
     socket.on("commandToArduinoTurnFwRightL10R5", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išči funkcijo ukazArduinu)
        
        zelenaVrednostLevo = Speed; 
        zelenaVrednostDesno = Speed/2;

        if (refreshClientGui == 1) {
        socket.emit("refreshClientGUInumValues", {
            "zelenaVrednostNaprej": zelenaVrednostNaprej,
            "zelenaVrednostNazaj": zelenaVrednostNazaj,
            "zelenaVrednostSpinLevo": zelenaVrednostSpinLevo, 
            "zelenaVrednostSpinDesno": zelenaVrednostSpinDesno,
            "zelenaVrednostHzLevo": zelenaVrednostHzLevo, 
            "zelenaVrednostHzDesno": zelenaVrednostHzDesno,
            "PWMfw": PWMfw,
            "PWMbk": PWMbk,
            "PWMleft": PWMleft,
            "PWMright": PWMright,
        });
        }

        STARTctrl = 1; 
	
    }); 
    
     socket.on("commandToArduinoTurnBkLeftL5R10", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išči funkcijo ukazArduinu)
        
        zelenaVrednostLevo = -Speed/2; 
        zelenaVrednostDesno = -Speed;

        if (refreshClientGui == 1) {
        socket.emit("refreshClientGUInumValues", {
            "zelenaVrednostNaprej": zelenaVrednostNaprej,
            "zelenaVrednostNazaj": zelenaVrednostNazaj,
            "zelenaVrednostSpinLevo": zelenaVrednostSpinLevo, 
            "zelenaVrednostSpinDesno": zelenaVrednostSpinDesno,
            "zelenaVrednostHzLevo": zelenaVrednostHzLevo, 
            "zelenaVrednostHzDesno": zelenaVrednostHzDesno,
            "PWMfw": PWMfw,
            "PWMbk": PWMbk,
            "PWMleft": PWMleft,
            "PWMright": PWMright,
        });
        }

        STARTctrl = 1; 
	
    }); 
    
     socket.on("commandToArduinoTurnBkRightL10R5", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išči funkcijo ukazArduinu)
        
        zelenaVrednostLevo = -Speed; 
        zelenaVrednostDesno = -Speed/2;

        if (refreshClientGui == 1) {
        socket.emit("refreshClientGUInumValues", {
            "zelenaVrednostNaprej": zelenaVrednostNaprej,
            "zelenaVrednostNazaj": zelenaVrednostNazaj,
            "zelenaVrednostSpinLevo": zelenaVrednostSpinLevo, 
            "zelenaVrednostSpinDesno": zelenaVrednostSpinDesno,
            "zelenaVrednostHzLevo": zelenaVrednostHzLevo, 
            "zelenaVrednostHzDesno": zelenaVrednostHzDesno,
            "PWMfw": PWMfw,
            "PWMbk": PWMbk,
            "PWMleft": PWMleft,
            "PWMright": PWMright,
        });
        }

        STARTctrl = 1; 
	
    }); 
        
	socket.on("ukazArduinuSTOP", function() {
        
        zelenaVrednostLevo = 0; 
        zelenaVrednostDesno = 0;

        if (refreshClientGui == 1) {
        socket.emit("refreshClientGUInumValues", {
            "zelenaVrednostNaprej": zelenaVrednostNaprej,
            "zelenaVrednostNazaj": zelenaVrednostNazaj,
            "zelenaVrednostSpinLevo": zelenaVrednostSpinLevo, 
            "zelenaVrednostSpinDesno": zelenaVrednostSpinDesno,
            "zelenaVrednostHzLevo": zelenaVrednostHzLevo, 
            "zelenaVrednostHzDesno": zelenaVrednostHzDesno,
            "PWMfw": PWMfw,
            "PWMbk": PWMbk,
            "PWMleft": PWMleft,
            "PWMright": PWMright,
        });
        }

        STARTctrl = 1; 
        
    });
    
    
                      
    
    

    //},1);
    
//}, 500); // digitalno branje poženemo šele čez pol sekunde zaradi pr        
        
    //analog read RIGHT:
    

    
//    board.analogRead(2, function(value) {
//        socket.emit("klientBeri2", value);
//    });
   
function ControlAndDisplayLeftRight() {
    

    socket.emit("sporociloKlientu", "No->" + numberOfCountsLeft);
    socket.emit("sporociloKlientu", "Time interval->" + timeIntervalLeft + "Freq->" + frequencyLeft);

    socket.emit("sporociloKlientu", "No->" + numberOfCountsRight);
    socket.emit("sporociloKlientu", "Time interval->" + timeIntervalRight + "Freq->" + frequencyRight);
    
    socket.emit("readOutFrequencyLeftRight", {"leftCount": numberOfCountsLeft, "frequencyLeft": frequencyLeft, "rightCount": numberOfCountsRight, "frequencyRight": frequencyRight});
    
        
    
    
    
    socket.emit("readOutControlLeftRight", {"PWMleft": PWMleft, "PWMright": PWMright});
 
    if (refreshClientGui == 1) {
    socket.emit("refreshClientGUInumValues", {
            "zelenaVrednostNaprej": zelenaVrednostNaprej,
            "zelenaVrednostNazaj": zelenaVrednostNazaj,
            "zelenaVrednostSpinLevo": zelenaVrednostSpinLevo, 
            "zelenaVrednostSpinDesno": zelenaVrednostSpinDesno,
            "zelenaVrednostHzLevo": zelenaVrednostHzLevo, 
            "zelenaVrednostHzDesno": zelenaVrednostHzDesno,
            "PWMfw": PWMfw,
            "PWMbk": PWMbk,
            "PWMleft": PWMleft,
            "PWMright": PWMright,
    });
    }
    
}
    
var ControlAndDisplayLeftRightTimer=setInterval(function(){ControlAndDisplayLeftRight()}, refreshFrequency);        
    
});
