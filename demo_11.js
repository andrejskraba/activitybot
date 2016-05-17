var http = require("http").createServer(handler)
  , io  = require("socket.io").listen(http, { log: false })
  , fs  = require("fs");

//funkcija iz: http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
var localaddress;
var os=require('os');
var ifaces=os.networkInterfaces();
for (var dev in ifaces) {
  var alias=0;
  ifaces[dev].forEach(function(details){
    if (details.family=='IPv4' && dev != "lo") {
      localaddress = details.address;
      ++alias;
    }
    return localaddress;
  });
}

var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/power.log', {flags : 'w'});
var log_stdout = process.stdout;

function writelog(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
}

var log_file2 = fs.createWriteStream(__dirname + '/control.log', {flags : 'w'});
var log_stdout2 = process.stdout;
function writelog2(d) { //
  log_file2.write(util.format(d) + '\n');
  log_stdout2.write(util.format(d) + '\n');
}

var KpLeft = 1.8;
var KiLeft = 1.05;
var KdLeft = 0.08;
var KpRight = 1.8;
var KiRight = 1.05;
var KdRight = 0.08;

var Speed = 15.0;
var upperLimitPWM = 255;

var RightStoppedFlag = 1;
var LeftStoppedFlag = 1;

var LeftSensFlag=0;
var RightSensFlag=0;

var desiredFLeft=0;
var desiredFRight=0;

var LeftForwardFlag = false;
var RightForwardFlag = false;
var StopFlag = true;

var ErrorLeft = new Array();
var IntegralCounterLeft = 0;
var ErrorRight = new Array();
var IntegralCounterRight = 0;

var SummInterval = 3;

var timesArrayLeft = new Array();
var timesArrayRight = new Array();

var PWMleft = 0; // value for pin left (pin 11)
var PWMright = 0; // value for pin right (pin 10)

var BoardStartedFlag = false;
var CameraDown = false;
var CameraStop = true;
var CameraLeft = false;
var CameraStop2 = true;

var five = require("johnny-five");
var board = new five.Board();

var ProximityPin = 26;
var GripperPin = 9;
var RightPWMPin = 10;
var LeftPWMPin = 11;
var StandbyPin = 27;
var LDirPin1 = 22;
var LDirPin2 = 23;
var RDirPin1 = 28;
var RDirPin2 = 29;
var LEncPin = 7;
var REncPin = 8;
var CamHorisontalPin = 5;
var CamVerticalPin = 6;

var voltagePin = "A1";
var VoltageSensorValue = 0;

var currentPin = "A0";
var CurrentSensorValue = 0;

var TotalEnergy = 0;

var tilt = 90; // spremenljivka za premik kamere - gor/dol t.j. "tilt"
var tilt2 = 81; // spremenljivka za premik kamere - levo/desno t.j. "tilt2"

//var firmata = require("firmata");

//var board = new firmata.Board("/dev/ttyACM0",function(){
board.on("ready", function() {

    console.log("Prikljuèitev na Arduino");
	console.log("Omogoèimo pin " + GripperPin);
	this.pinMode(GripperPin, five.Pin.SERVO);	
    this.servoWrite(GripperPin,5);
	
    console.log("Omogoèimo pin " + RightPWMPin);
    this.pinMode(RightPWMPin, five.Pin.PWM); // PWMB
    console.log("Omogoèimo pin " + LeftPWMPin);
    this.pinMode(LeftPWMPin, five.Pin.PWM); // PWMA
    
    console.log("Omogoèimo pin " + StandbyPin);
    this.pinMode(StandbyPin, five.Pin.OUTPUT); // STANDBY PIN 
    this.digitalWrite(StandbyPin, 1);

    this.pinMode(LDirPin1, five.Pin.OUTPUT); // AIN1   
    this.pinMode(LDirPin2, five.Pin.OUTPUT); // AIN2
    this.pinMode(RDirPin1, five.Pin.OUTPUT); // BIN1   
    this.pinMode(RDirPin2, five.Pin.OUTPUT); // BIN2
    this.digitalWrite(LDirPin1, 0);
    this.digitalWrite(LDirPin2, 0);
    this.digitalWrite(RDirPin1, 0);
    this.digitalWrite(RDirPin2, 0);
    
    this.pinMode(LEncPin, five.Pin.INPUT);
    this.pinMode(REncPin, five.Pin.INPUT);

    this.pinMode(CamVerticalPin, five.Pin.SERVO);
	console.log("Tilt servo");    
    this.pinMode(CamHorisontalPin, five.Pin.SERVO);
	console.log("Tilt servo 2"); 
    
    this.servoWrite(CamVerticalPin,tilt); // kamero postavimo na izhodiščni kot, ki je podan s spremenljivko "tilt"
    this.servoWrite(CamHorisontalPin,tilt2); // kamero postavimo na izhodiščni kot, ki je podan s spremenljivko "tilt"
    
    var VoltageSensorPin = new five.Pin(voltagePin);
	five.Pin.read(VoltageSensorPin, function(error, value) {
		VoltageSensorValue = value;
	});
	
	var CurrentSensorPin = new five.Pin(currentPin);
	five.Pin.read(CurrentSensorPin, function(error, value) {
		CurrentSensorValue = value;
	});
    
    this.digitalRead(LEncPin, function(value) {
        if (LeftSensFlag == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
        }
        else
        {
            LeftSensFlag = value;
            timesArrayLeft.push(Date.now());
            //console.log("Pin 7 active " + value);
        }
    });
    this.digitalRead(REncPin, function(value) {
        if (RightSensFlag == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
        }
        else
        {
            RightSensFlag = value;
            timesArrayRight.push(Date.now());
            //console.log("Pin 8 active " + value);
        }
    });
    
    BoardStartedFlag = true;

});

//boardfive.on("ready", function() {
  //    var proximity = new five.Proximity({
    //    controller: "HCSR04",
      //  pin: 26
//      });
//
  //    proximity.on("data", function() {
    //    console.log("Proximity: ");
      //  console.log("  cm  : ", this.cm);
//        console.log("  in  : ", this.in);
  //      console.log("-----------------");
    //  });

//      proximity.on("change", function() {
  //      console.log("The obstruction has moved.");
    //  });
    //});
    


function countValuesAndChopArrayLeft (timesArrayLeft, timeValue) {
// function counts the values in the timesArrayLeft that are less or equal to timeValue and chops them out
// function returns chopped array and number of occurences
// timesArrayLeft must be defined as global variable not to lose time in between    

var counter = 0;

for (var i = 0; i < timesArrayLeft.length; i++) {
    if (timesArrayLeft[i] <= timeValue) {
        counter++;
}
else {break;}
}
    
timesArrayLeft.splice(0, counter); // remove the values from 0, n=counter values
    
return counter; // function returns the number of occurences of times leess or equal to timeValue    

}

function countValuesAndChopArrayRight (timesArrayRight, timeValue) {
// function counts the values in the timesArrayLeft that are less or equal to timeValue and chops them out
// function returns chopped array and number of occurences
// timesArrayLeft must be defined as global variable not to lose time in between    

var counter = 0;

for (var i = 0; i < timesArrayRight.length; i++) {
    if (timesArrayRight[i] <= timeValue) {
        counter++;
}
else {break;}
}
    
timesArrayRight.splice(0, counter); // remove the values from 0, n=counter values
    
return counter; // function returns the number of occurences of times leess or equal to timeValue    

}

function GetPWMfromPIDLeft(desiredFLeft,frequencyLeft)
{
    if (IntegralCounterLeft < SummInterval)
    {
        ErrorLeft.unshift(desiredFLeft - frequencyLeft);
        IntegralCounterLeft++;
    }
    else
    {
        ErrorLeft.pop();
        ErrorLeft.unshift(desiredFLeft - frequencyLeft);
    }
    if (IntegralCounterLeft == 1)
    {
        PWMleft += KiLeft*ErrorLeft[0];
    }
    else if (IntegralCounterLeft == 2)
    {
        PWMleft += KpLeft*(ErrorLeft[0] - ErrorLeft[1]) + KiLeft*ErrorLeft[0];
    }
    else
    {
        PWMleft += KpLeft*(ErrorLeft[0] - ErrorLeft[1]) + KiLeft*ErrorLeft[0] + KdLeft*(ErrorLeft[0] - 2*ErrorLeft[1] + ErrorLeft[2]);
    }
    return PWMleft;
}

function GetPWMfromPIDRight(desiredFRight,frequencyRight)
{
    if (IntegralCounterRight < SummInterval)
    {
        ErrorRight.unshift(desiredFRight - frequencyRight);
        IntegralCounterRight++;
    }
    else
    {
        ErrorRight.pop();
        ErrorRight.unshift(desiredFRight - frequencyRight);
    }
    //console.log("ErrorRight[0] = " + ErrorRight[0]);        
    //console.log("ErrorRight[1] = " + ErrorRight[1]);
    //console.log("ErrorRight[2] = " + ErrorRight[2]);
    if (IntegralCounterRight == 1)
    {
        PWMright += KiRight*ErrorRight[0];
    }
    else if (IntegralCounterRight == 2)
    {
        PWMright += KpRight*(ErrorRight[0] - ErrorRight[1]) + KiRight*ErrorRight[0];
    }
    else
    {
        PWMright += KpRight*(ErrorRight[0] - ErrorRight[1]) + KiRight*ErrorRight[0] + KdRight*(ErrorRight[0] - 2*ErrorRight[1] + ErrorRight[2]);
    }
    return PWMright;
}

var timePreviousLeft = Date.now(); // inicializiramo čas ob povezavi klienta
var timePreviousRight = timePreviousLeft;
var SpinLeft = false;
var SpinRight = false;
var Forward = false;
var Backward = false;
var LFwd = false;
var RFwd = false;
var LBkwd = false;
var RBkwd = false;
var FullStopFlag = true;

function CheckFlags()
{
    if (SpinLeft)
    {
        desiredFLeft = Speed;
        desiredFRight = Speed;
        LeftForwardFlag = false;
        RightForwardFlag = true;
        SpinLeft = false;
        PWMleft = 0;
        PWMright = 0;
    }
    else if (SpinRight)
    {
        desiredFLeft = Speed;
        desiredFRight = Speed;
        LeftForwardFlag = true;
        RightForwardFlag = false;
        SpinRight = false;
        PWMleft = 0;
        PWMright = 0;
    }
    else if (Forward)
    {
        desiredFLeft = Speed;
        desiredFRight = Speed;
        LeftForwardFlag = true;
        RightForwardFlag = true;
        Forward = false;
        PWMleft = 0;
        PWMright = 0;
    }
    else if (Backward)
    {
        desiredFLeft = Speed;
        desiredFRight = Speed;
        LeftForwardFlag = false;
        RightForwardFlag = false;
        Backward = false;
        PWMleft = 0;
        PWMright = 0;
    }
    else if (LFwd)
    {
        desiredFLeft = Speed/2;
        desiredFRight = Speed;
        LeftForwardFlag = true;
        RightForwardFlag = true;
        LFwd = false;
        PWMleft = 0;
        PWMright = 0;
    }
    else if (RFwd)
    {
        desiredFLeft = Speed;
        desiredFRight = Speed/2;
        LeftForwardFlag = true;
        RightForwardFlag = true;
        RFwd = false;
        PWMleft = 0;
        PWMright = 0;
    }
    else if (LBkwd)
    {
        desiredFLeft = Speed/2;
        desiredFRight = Speed;
        LeftForwardFlag = false;
        RightForwardFlag = false;
        LBkwd = false;
        PWMleft = 0;
        PWMright = 0;
    }
    else if (RBkwd)
    {
        desiredFLeft = Speed;
        desiredFRight = Speed/2;
        LeftForwardFlag = false;
        RightForwardFlag = false;
        RBkwd = false;
        PWMleft = 0;
        PWMright = 0;
    }
    else
    {
        board.digitalWrite(LDirPin1, 1);
        board.digitalWrite(LDirPin2, 1);
        board.digitalWrite(RDirPin1, 1);
        board.digitalWrite(RDirPin2, 1);
        PWMleft = 0;
        PWMright = 0;
        StopFlag = false;
        FullStopFlag = true;
    }
}

function frequencyMeasureLeftRight() {
    
    var timeNextLeft = Date.now();
    var timeNextRight = timeNextLeft;    
    var numberOfCountsLeft = countValuesAndChopArrayLeft(timesArrayLeft, timeNextLeft); // number of counts up to current time within last second
    var numberOfCountsRight = countValuesAndChopArrayRight(timesArrayRight, timeNextRight); // number of counts up to current time within last second
    var timeIntervalLeft = timeNextLeft - timePreviousLeft;
    timePreviousLeft = timeNextLeft;
    var frequencyLeft = numberOfCountsLeft/(timeIntervalLeft/1000);
    
    var timeIntervalRight = timeNextRight - timePreviousRight;
    timePreviousRight = timeNextRight;
    var frequencyRight = numberOfCountsRight/(timeIntervalRight/1000);

    console.log("frequencyLeft " + frequencyLeft);
    console.log("frequencyRight " + frequencyRight);
    writelog2(Date.now() + "\tfrequencyLeft\t" + frequencyLeft + "\tfrequencyRight\t" + frequencyRight + "\tPWMleft\t" + PWMleft + "\tPWMright\t" + PWMright);
    
    var VoltageValue = VoltageSensorValue/1024*2*5/1.025;
    var CurrentValue = (CurrentSensorValue-512)/38;
    if (CurrentValue < 0)
        CurrentValue = 0;
    var PowerValue = VoltageValue*CurrentValue;
    TotalEnergy += PowerValue;
    console.log("Voltage = " + VoltageValue.toFixed(3) + "\tCurrent = " + CurrentValue.toFixed(3) + "\tPower = " + PowerValue.toFixed(3) + "\tEnergy = " + TotalEnergy.toFixed(3));
    writelog(Date.now() + "\t" + VoltageValue.toFixed(3) + "\t" + CurrentValue.toFixed(3) + "\t" + PowerValue.toFixed(3) + "\t" + TotalEnergy.toFixed(3));

    if (BoardStartedFlag)
    {
        {
            if (!LeftForwardFlag)
            {
                GetPWMfromPIDLeft(desiredFLeft,frequencyLeft);
                console.log("PWMleft " + PWMleft);
                if (PWMleft < 0)
                {
                    PWMleft = 0;
                }
                //console.log("PWMleft " + PWMleft);
                board.digitalWrite(LDirPin1, 1); // LEFT
		        board.digitalWrite(LDirPin2, 0); // LEFT
                board.analogWrite(LeftPWMPin, PWMleft);
                if (StopFlag && desiredFLeft == 0 && desiredFRight == 0 && frequencyLeft == 0 && frequencyRight == 0)
                {
                    CheckFlags();
                }
            }
            else 
            {
                GetPWMfromPIDLeft(desiredFLeft,frequencyLeft);
                console.log("PWMleft " + PWMleft);
                if (PWMleft < 0)
                {
                    PWMleft = 0;
                }
                //console.log("PWMleft " + PWMleft);
                board.digitalWrite(LDirPin1, 0); // LEFT
		        board.digitalWrite(LDirPin2, 1); // LEFT
                board.analogWrite(LeftPWMPin, PWMleft);
                if (StopFlag && desiredFLeft == 0 && desiredFRight == 0 && frequencyLeft == 0 && frequencyRight == 0)
                {
                    CheckFlags();
                }
            }


		    if (!RightForwardFlag)
            {
                GetPWMfromPIDRight(desiredFRight,frequencyRight);
                console.log("PWMright " + PWMright);
                if (PWMright < 0)
                {
                    PWMright = 0;
                }
                //console.log("PWMright " + PWMright);
                board.digitalWrite(RDirPin1, 1); // RIGHT
		        board.digitalWrite(RDirPin2, 0); // RIGHT
                board.analogWrite(RightPWMPin, PWMright);
                if (StopFlag && desiredFLeft == 0 && desiredFRight == 0 && frequencyLeft == 0 && frequencyRight == 0)
                {
                    CheckFlags();
                }
            }
            else 
            {
                GetPWMfromPIDRight(desiredFRight,frequencyRight);
                console.log("PWMright " + PWMright);
                if (PWMright < 0)
                {
                    PWMright = 0;
                }
                //console.log("PWMright " + PWMright);
                board.digitalWrite(RDirPin1, 0); // RIGHT
		        board.digitalWrite(RDirPin2, 1); // RIGHT
                board.analogWrite(RightPWMPin, PWMright);
                if (StopFlag && desiredFLeft == 0 && desiredFRight == 0 && frequencyLeft == 0 && frequencyRight == 0)
                {
                    CheckFlags();
                }
            }   
	   } // stop flag else finish
    }
}    
var frequencyMeasureLeftRightTimer=setInterval(function(){frequencyMeasureLeftRight()}, 150);   

function CameraUpDown()
{
    if (CameraStop == false)
    {
        if (CameraDown == true)
        {
            tilt = tilt + 1;
            if (tilt > 175)
                tilt = 175;
            board.servoWrite(CamVerticalPin,tilt);   
        }
        else
        {
            tilt = tilt - 1;
            if (tilt < 40)
                tilt = 40;
            board.servoWrite(CamVerticalPin,tilt);   
        }
    }
}

var CameraUpDownControl=setInterval(function(){CameraUpDown()}, 20);   

function CameraLeftRight()
{
    if (CameraStop2 == false)
    {
        if (CameraLeft == true)
        {
            tilt2 = tilt2 - 1;
            if (tilt2 < 1)
                tilt2 = 1;
            board.servoWrite(CamHorisontalPin,tilt2);   
        }
        else
        {
            tilt2 = tilt2 + 1;
            if (tilt2 > 179)
                tilt2 = 179;            
            board.servoWrite(CamHorisontalPin,tilt2);   
        }
    }
}

var CameraLeftRightControl=setInterval(function(){CameraLeftRight()}, 20);  
//var cv = require('opencv');

var lowThresh = 1;
var highThresh = 255;

//var lowThresh = 400;
//var highThresh = 600;

var nIters = 2; // pred tem je bilo 2 - ontours.size() je pri 2 precej veèji (cca. 200); pri 10 manjši (cca. 20)
var minArea = 1500;

var BLUE = [0, 255, 0]; //B, G, R
var RED   = [0, 0, 255]; //B, G, R
var GREEN = [0, 255, 0]; //B, G, R
var WHITE = [255, 255, 255]; //B, G, R

var xVektorTrik = new Array();
var yVektorTrik = new Array();

var xVektorPrav = new Array();
var yVektorPrav = new Array();


var httpListenPort = 8080; // doloèimo spremenljivko; kje poslušamo - rabimo v nadaljevanju
http.listen(httpListenPort); // doloèimo na katerih vratih bomo poslušali | vrata 80 sicer uporablja LAMP | lahko doloèimo na "router-ju" (http je glavna spremenljivka, t.j. aplikacija oz. app)

function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    // return new Buffer(bitmap).toString('base64');
    return new Buffer(bitmap).toString('base64');
}

function akcija(outArg, imArg, callback) { // prvi del za callback funkcijo

	return callback(outArg, imArg);

}

function posredujSliko(outArg, imArg) { // drugi del za callback funkcijo

    outArg.save('out8.jpg'); // *** za pisanje rezultatov na disk
    imArg.save('original.jpg');
    var base64str1 = base64_encode('original.jpg');
    //io.sockets.emit("posredujBase64string",base64str1, base64str2); // bo izvedel to funkcijo, t.j. "Pozdravljen svet!" ta funkcija pa emitira nazaj na klienta (išèe funkcijo testzadeve in posreduje podatke "Pozdravljen svet!")
    io.sockets.emit("posredujBase64string",base64str1); // bo izvedel to funkcijo, t.j. "Pozdravljen svet!" ta funkcija pa emitira nazaj na klienta (išèe funkcijo testzadeve in posreduje podatke "Pozdravljen svet!")
    //console.log(base64str1);
	//console.log("klic");
}


function handler (req, res) { // handler za "response"; ta handler "handla" le datoteko index.html
    fs.readFile(__dirname + "/demo_10.html",
    function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end("Napaka pri nalaganju datoteke index.html");
        }
    res.writeHead(200);
    res.end(data);
    });
}

// http://www.hacksparrow.com/base64-encoding-decoding-in-node-js.html

io.sockets.on("connection", function (socket) {  // ko nekdo poklièe IP se vzpostavi povezava = "connection" oz.
                                                 // ko imamo povezavo moramo torej izvesti funkcijo: function (socket)
                                                 // pri tem so argument podatki "socket-a" t.j. argument = socket ustvari se socket_id




// *****************************************************************************
// Funkcija za periodièno branje in cv
// *****************************************************************************


	//camera.read(function(err, im) {

	//	im.save('cam.png');
	//});

// ********************************************

// var vid = new cv.VideoCapture("http://192.168.3.209:8080/?action=snapshot")





//setInterval(function() {
    //var base64str1 = base64_encode('/home/cloudsto/moved.jpg');
//    //var base64str1 = base64_encode('/home/pika/moved.jpg');
    //io.sockets.emit("posredujBase64string",base64str1); // bo izvedel to funkcijo, t.j. "Pozdravljen svet!" ta funkcija pa emitira nazaj na klienta (išče funkcijo testzadeve in posreduje podatke "Pozdravljen svet!")
//}, 200);


var trikotnikObstaja = 0;
var pravokotnikObstaja = 0;



// *****************************************************************************


 socket.on("pridobisliko", function (stikalo) { // ko je socket ON in je posredovan preko connection-a: testpovezave (t.j. ukaz: išèi funkcijo pridobisliko)
    // convert image to base64 encoded string

     ////out.save('out8.jpg'); // *** za pisanje rezultatov na disk
    //im.save('original.jpg');
    //var base64str1 = base64_encode('original.jpg');
            //var base64str1 = base64_encode('/home/cloudsto/moved.jpg');
    //var base64str1 = base64_encode('/home/pika/moved.jpg');
    ////var base64str2 = base64_encode('out8.jpg');
            //io.sockets.emit("posredujBase64string",base64str1); // , base64str2 bo izvedel to funkcijo, t.j. "Pozdravljen svet!" ta funkcija pa emitira nazaj na klienta (išèe funkcijo testzadeve in posreduje podatke "Pozdravljen svet!")
    //io.sockets.emit("posredujBase64string",base64str1); // bo izvedel to funkcijo, t.j. "Pozdravljen svet!" ta funkcija pa emitira nazaj na klienta (išče funkcijo testzadeve in posreduje podatke "Pozdravljen svet!")
    //console.log(base64str1);
	//console.log("klic");


    }); 


	socket.on("ukazArduinu", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išèi funkcijo ukazArduinu)
		
// *********************
// *********************
// *********************
		
	
		if (data.stevilkaUkaza == "777") { // FORWARD
	    	writelog2(Date.now() + "\t FORWARD PRESSED");
		    StopFlag = false;
		    SpinRight = false;
		    SpinLeft = false;
		    Forward = true;
            Backward = false;
            LFwd = false;
            RFwd = false;
            LBkwd = false;
            RBkwd = false;
            if (!LeftForwardFlag || !RightForwardFlag)
            {
                StopFlag = true;
                desiredFLeft = 0;
                desiredFRight = 0;
            }
            else
            {
                desiredFLeft = Speed;
                desiredFRight = Speed;
            }
            FullStopFlag = false;
		}		  		  

		else if (data.stevilkaUkaza == "888") { // BACKWARD
		    writelog2(Date.now() + "\t BACKWARD PRESSED");
		    StopFlag = false;
		    SpinRight = false;
		    SpinLeft = false;
		    Forward = false;
            Backward = true;
            LFwd = false;
            RFwd = false;
            LBkwd = false;
            RBkwd = false;
            if (LeftForwardFlag || RightForwardFlag)
            {
                StopFlag = true;
                desiredFLeft = 0;
                desiredFRight = 0;
            }
            else
            {
                desiredFLeft = Speed;
                desiredFRight = Speed;
            }
            FullStopFlag = false;
		}		  		  
  
		else if (data.stevilkaUkaza == "999") { // STOP
		    writelog2(Date.now() + "\t STOP PRESSED");
		    StopFlag = true;
		    SpinRight = false;
		    SpinLeft = false;
		    Forward = false;
            Backward = false;
            LFwd = false;
            RFwd = false;
            LBkwd = false;
            RBkwd = false;
            desiredFLeft = 0;
            desiredFRight = 0;
            FullStopFlag = true;
		}

		else if (data.stevilkaUkaza == "7771") { // buttonLeftforward 
		    writelog2(Date.now() + "\t buttonLeftforward PRESSED");
		    StopFlag = false;
		    SpinRight = false;
		    SpinLeft = false;
		    Forward = false;
            Backward = false;
            LFwd = true;
            RFwd = false;
            LBkwd = false;
            RBkwd = false;
            if (!LeftForwardFlag || !RightForwardFlag)
            {
                StopFlag = true;
                desiredFLeft = 0;
                desiredFRight = 0;
            }
            else
            {
                desiredFLeft = Speed/2;
                desiredFRight = Speed;
            }
            FullStopFlag = false;
		}
		
		else if (data.stevilkaUkaza == "7772") { // buttonRightforward 
		    writelog2(Date.now() + "\t buttonRightforward PRESSED");
		    StopFlag = false;
		    SpinRight = false;
		    SpinLeft = false;
		    Forward = false;
            Backward = false;
            LFwd = false;
            RFwd = true;
            LBkwd = false;
            RBkwd = false;
            if (!LeftForwardFlag || !RightForwardFlag)
            {
                StopFlag = true;
                desiredFLeft = 0;
                desiredFRight = 0;
            }
            else
            {
                desiredFLeft = Speed;
                desiredFRight = Speed/2;
            }
            FullStopFlag = false;
		}
		else if (data.stevilkaUkaza == "9991") { // buttonSpinleft 
		    writelog2(Date.now() + "\t buttonSpinleft PRESSED");
		    StopFlag = true;
		    SpinLeft = true;
		    Forward = false;
            Backward = false;
            LFwd = false;
            RFwd = false;
            LBkwd = false;
            RBkwd = false;
		    SpinRight = false;
            desiredFLeft = 0;
            desiredFRight = 0;
            FullStopFlag = false;
		}
		else if (data.stevilkaUkaza == "9992") { // buttonSpinright
		    writelog2(Date.now() + "\t buttonSpinright PRESSED");
		    StopFlag = true;
		    SpinLeft = false;
		    SpinRight = true;
		    Forward = false;
            Backward = false;
            LFwd = false;
            RFwd = false;
            LBkwd = false;
            RBkwd = false;
            desiredFLeft = 0;
            desiredFRight = 0;
            FullStopFlag = false;
		}
		else if (data.stevilkaUkaza == "8881") { // buttonLeftbackward
		    writelog2(Date.now() + "\t buttonLeftbackward PRESSED");
		    StopFlag = false;
		    SpinRight = false;
		    SpinLeft = false;
		    Forward = false;
            Backward = false;
            LFwd = false;
            RFwd = false;
            LBkwd = true;
            RBkwd = false;
            if (LeftForwardFlag || RightForwardFlag)
            {
                StopFlag = true;
                desiredFLeft = 0;
                desiredFRight = 0;
            }
            else
            {
                desiredFLeft = Speed/2;
                desiredFRight = Speed;
            }
            FullStopFlag = false;
		}
		else if (data.stevilkaUkaza == "8882") { // buttonRightbackward
		    writelog2(Date.now() + "\t buttonRightbackward PRESSED");
		    StopFlag = false;
		    SpinRight = false;
		    SpinLeft = false;
		    Forward = false;
            Backward = false;
            LFwd = false;
            RFwd = false;
            LBkwd = false;
            RBkwd = true;
            if (LeftForwardFlag || RightForwardFlag)
            {
                StopFlag = true;
                desiredFLeft = 0;
                desiredFRight = 0;
            }
            else
            {
                desiredFLeft = Speed;
                desiredFRight = Speed/2;
            }
            FullStopFlag = false;
        }


		else if (data.stevilkaUkaza == "9998") { // CAMERA TILT DOWN
		        writelog2(Date.now() + "\t CAMERA TILT DOWN PRESSED");
                CameraDown = true;
                CameraStop = false; 
	        }
        else if (data.stevilkaUkaza == "99981") { // CAMERA TILT DOWN
                CameraDown = true;
                CameraStop = true;
	        }
        else if (data.stevilkaUkaza == "99982") { // CAMERA TILT DOWN
                writelog2(Date.now() + "\t CAMERA TILT DOWN PRESSED");
			    tilt = tilt + 5;
                if (tilt > 180)
                    tilt = 180;
                board.servoWrite(CamVerticalPin,tilt);           
	        }
        else if (data.stevilkaUkaza == "9999") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
                writelog2(Date.now() + "\t CAMERA TILT UP PRESSED");
			    CameraDown = false;
                CameraStop = false;
	        }	
        else if (data.stevilkaUkaza == "99991") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
			    CameraDown = false;
                CameraStop = true;    
	        }
        else if (data.stevilkaUkaza == "99992") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
                writelog2(Date.now() + "\t CAMERA TILT UP PRESSED");
                tilt = tilt - 5;
                if (tilt < 35)
                    tilt = 35;
	        	board.servoWrite(CamVerticalPin,tilt);
	        } 
        else if (data.stevilkaUkaza == "9996") { // CAMERA TILT LEFT
                writelog2(Date.now() + "\t CAMERA TILT LEFT PRESSED");
                CameraLeft = true;
                CameraStop2 = false; 
	        }
        else if (data.stevilkaUkaza == "99961") { // CAMERA TILT LEFT
                CameraLeft = true;
                CameraStop2 = true;
	        }
        else if (data.stevilkaUkaza == "99962") { // CAMERA TILT LEFT
                writelog2(Date.now() + "\t CAMERA TILT LEFT PRESSED");
		        tilt2 = tilt2 - 3;
                if (tilt2 < 1)
                    tilt2 = 1;
                board.servoWrite(CamHorisontalPin,tilt2);           
	        }
        else if (data.stevilkaUkaza == "9997") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
                writelog2(Date.now() + "\t CAMERA TILT RIGHT PRESSED");
			    CameraLeft = false;
                CameraStop2 = false;
	        }	
        else if (data.stevilkaUkaza == "99971") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
			    CameraLeft = false;
                CameraStop2 = true;    
	        }
        else if (data.stevilkaUkaza == "99972") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
                writelog2(Date.now() + "\t CAMERA TILT RIGHT PRESSED");
                tilt2 = tilt2 + 3;
		        if (tilt2 > 179)
                    tilt2 = 179;
	        	board.servoWrite(CamHorisontalPin,tilt2);
	        }
	   else if (data.stevilkaUkaza == "999339") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
	            writelog2(Date.now() + "\t CAMERA TILT CENTER PRESSED");
	            tilt = 90;
	            tilt2 = 81;
                board.servoWrite(CamHorisontalPin,tilt2);
                board.servoWrite(CamVerticalPin,tilt);
                CameraStop2 = true; 
                CameraStop = true;
	        }
	   else if (data.stevilkaUkaza == "11171") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
	            writelog2(Date.now() + "\t SPEED + PRESSED");
        		Speed = Speed + 0.2*Speed;  
			    if (Speed > 50)
				    Speed = 50;
	        }
        else if (data.stevilkaUkaza == "11172") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
                writelog2(Date.now() + "\t SPEED - PRESSED");
        		Speed = Speed - 0.2*Speed; 
        		if (Speed < 0.1)
        		    Speed = 0.1;
	        }


		else if (data.stevilkaUkaza == "90") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 1
		        writelog2(Date.now() + "\t GRAB PRESSED");
	        	board.servoWrite(9,175);
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
//	            io.sockets.emit("sporociloKlientu", "LED prižgana na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	        }
	        else if (data.stevilkaUkaza == "91") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
	            writelog2(Date.now() + "\t RELEASE PRESSED");
	        	board.servoWrite(9,0);
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            //io.sockets.emit("sporociloKlientu", "LED ugasnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	        }		  


	});


 

// ********************************************************************
// Koda iz ros
// ********************************************************************

 //console.log('SOCKET ID ' + socket.id);
 
 var address = socket.handshake.address; // za doloèitev IP naslova
 //console.log('Remote IP ' + address.address + ":" + address.port);
 //console.log('Local IP ' + localaddress + ":" + httpListenPort);
 
 //socket.emit("sporociloKlientu", "Strežnik" + localaddress + ":" + httpListenPort + " povezan."); // izvedemo funkcijo = "hello" na klientu, z argumentom, t.j. podatki="Strežnik povezan."


	socket.on('sporociloStrezniku', function(msg) {
	    io.sockets.emit("sporociloKlientu", msg + " -> klik iz brskalnika na IP naslovu " + address.address + ":" + address.port);
	});


});

