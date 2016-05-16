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

var KpLeft = 1;
var KiLeft = 0.5;
var KdLeft = 3;
var KpRight = 1;
var KiRight = 0.5;
var KdRight = 3;

var Speed = 35.0;

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

//var firmata = require("firmata");

//var board = new firmata.Board("/dev/ttyACM0",function(){
board.on("ready", function() {
    var proximity = new five.Proximity({
        controller: "HCSR04",
        pin: 26
    });
    proximity.on("data", function() {
        //console.log("Proximity: ");
        // console.log("  cm  : ", this.cm);
        //console.log("  in  : ", this.in);
        //console.log("-----------------");
      });

    proximity.on("change", function() {
        //console.log("The obstruction has moved.");
      });
    console.log("Prikljuèitev na Arduino");
	//console.log("Firmware: " + this.firmware.name + "-" + this.firmware.version.major + "." + this.firmware.version.minor); // izpišemo verzijo Firmware
	
//	console.log("Omogoèimo pin 3");
//	this.pinMode(3, this.MODES.SERVO);	
	
	console.log("Omogoèimo pin 9");
	this.pinMode(9, five.Pin.SERVO);	
    this.servoWrite(9,5);
	
    console.log("Omogoèimo pin 10");
    this.pinMode(10, five.Pin.PWM); // PWMB
    console.log("Omogoèimo pin 11");
    this.pinMode(11, five.Pin.PWM); // PWMA
    console.log("Omogoèimo pin 13");    
    this.pinMode(13, five.Pin.OUTPUT);
    console.log("Omogoèimo pin 13");
    this.pinMode(12, five.Pin.OUTPUT);

    this.pinMode(27, five.Pin.OUTPUT); // STANDBY PIN 
    this.digitalWrite(27, 1);

    this.pinMode(2, five.Pin.OUTPUT);
    console.log("Omogoèimo pin 2");
    this.pinMode(3, five.Pin.OUTPUT);
    console.log("Omogoèimo pin 3");
    this.pinMode(4, five.Pin.OUTPUT);
    console.log("Omogoèimo pin 4");
   
    
    this.pinMode(22, five.Pin.OUTPUT); // AIN1   
    this.pinMode(23, five.Pin.OUTPUT); // AIN2
    this.pinMode(28, five.Pin.OUTPUT); // BIN1   
    this.pinMode(29, five.Pin.OUTPUT); // BIN2
    this.digitalWrite(22, 0);
    this.digitalWrite(23, 0);
    this.digitalWrite(28, 0);
    this.digitalWrite(29, 0);
    
    this.pinMode(7, five.Pin.INPUT);
    this.pinMode(8, five.Pin.INPUT);
    //this.digitalWrite(7, 1);
    //this.digitalWrite(8, 1);

    //console.log("Omogoèimo pin 8");
    //this.pinMode(8, five.Pin.OUTPUT);
    //console.log("Omogoèimo pin 7");
    //this.pinMode(7, five.Pin.OUTPUT);
    console.log("Omogoèimo pin 4");
    this.pinMode(4, five.Pin.OUTPUT);

    this.pinMode(6, five.Pin.SERVO);
	console.log("Tilt servo");    
    this.pinMode(5, five.Pin.SERVO);
	console.log("Tilt servo 2"); 
    
	console.log("Omogoèimo tipko na pinu 2.");
    this.pinMode(2, five.Pin.INPUT);
    this.servoWrite(6,90); // kamero postavimo na izhodiščni kot, ki je podan s spremenljivko "tilt"
    this.servoWrite(5,90); // kamero postavimo na izhodiščni kot, ki je podan s spremenljivko "tilt"
    
    this.digitalRead(7, function(value) {
        if (LeftSensFlag == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
        }
        else
        {
            LeftSensFlag = value;
            timesArrayLeft.push(Date.now());
            console.log("Pin 7 active " + value);
        }
    });
    this.digitalRead(8, function(value) {
        if (RightSensFlag == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
        }
        else
        {
            RightSensFlag = value;
            timesArrayRight.push(Date.now());
            console.log("Pin 8 active " + value);
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

counter = 0;

for (i = 0; i < timesArrayLeft.length; i++) {
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

counter = 0;

for (i = 0; i < timesArrayRight.length; i++) {
    if (timesArrayRight[i] <= timeValue) {
        counter++;
}
else {break;}
}
    
timesArrayRight.splice(0, counter); // remove the values from 0, n=counter values
    
return counter; // function returns the number of occurences of times leess or equal to timeValue    

}

var timePreviousLeft = Date.now(); // inicializiramo čas ob povezavi klienta
var timePreviousRight = timePreviousLeft;

function frequencyMeasureLeftRight() {
    
    timeNextLeft = Date.now();
    timeNextRight = timeNextLeft;    
    numberOfCountsLeft = countValuesAndChopArrayLeft(timesArrayLeft, timeNextLeft); // number of counts up to current time within last second
    numberOfCountsRight = countValuesAndChopArrayRight(timesArrayRight, timeNextRight); // number of counts up to current time within last second
    timeIntervalLeft = timeNextLeft - timePreviousLeft;
    timePreviousLeft = timeNextLeft;
    frequencyLeft = numberOfCountsLeft/(timeIntervalLeft/1000);
    
    timeIntervalRight = timeNextRight - timePreviousRight;
    timePreviousRight = timeNextRight;
    frequencyRight = numberOfCountsRight/(timeIntervalRight/1000);    
    
    console.log("frequencyLeft " + frequencyLeft);
    console.log("frequencyRight " + frequencyRight);
    
    if(BoardStartedFlag)
    {
	if(StopFlag)
	{
		board.digitalWrite(22, 1);
    		board.digitalWrite(23, 1);
    		board.digitalWrite(28, 1);
    		board.digitalWrite(29, 1);
		PWMleft = 0;
		PWMright = 0;
	}
	else
	{
		if(!LeftForwardFlag)
		{
		    if(IntegralCounterLeft < SummInterval)
		    {
		        ErrorLeft.unshift(desiredFLeft - frequencyLeft);
		        IntegralCounterLeft++;
		    }
		    else
		    {
		        ErrorLeft.pop();
		        ErrorLeft.unshift(desiredFLeft - frequencyLeft);
		    }
		    //console.log("ErrorLeft[0] = " + ErrorLeft[0]);        
		    if(IntegralCounterLeft = 1)
		    {
		        PWMleft += KiLeft*ErrorLeft[0];
		    }
		    else if(IntegralCounterLeft = 2)
		    {
		        PWMleft += KpLeft*(ErrorLeft[0] - ErrorLeft[1]) + KiLeft*ErrorLeft[0];
		    }
		    else
		    {
		        PWMleft += KpLeft*(ErrorLeft[0] - ErrorLeft[1]) + KiLeft*ErrorLeft[0] + KdLeft*(ErrorLeft[0] - 2*ErrorLeft[1] + ErrorLeft[2]);
		    }
		    console.log("PWMleft = " + PWMleft);
		    if (PWMleft > 255) {
		        PWMleft = 255;
		    }
		    else if(PWMleft < 0)
		    {
		        PWMleft = 0;
		    }
		    board.digitalWrite(22, 1); // LEFT
		    board.digitalWrite(23, 0); // LEFT
		    board.analogWrite(11, PWMleft);
		    if(desiredFLeft == 0)
		        board.analogWrite(11, 0);
		}
		else 
		{
		    if(IntegralCounterLeft < SummInterval)
		    {
		        ErrorLeft.unshift(desiredFLeft - frequencyLeft);
		        IntegralCounterLeft++;
		    }
		    else
		    {
		        ErrorLeft.pop();
		        ErrorLeft.unshift(desiredFLeft - frequencyLeft);
		    }
		    //console.log("ErrorLeft[0] = " + ErrorLeft[0]);        
		    if(IntegralCounterLeft = 1)
		    {
		        PWMleft += KiLeft*ErrorLeft[0];
		    }
		    else if(IntegralCounterLeft = 2)
		    {
		        PWMleft += KpLeft*(ErrorLeft[0] - ErrorLeft[1]) + KiLeft*ErrorLeft[0];
		    }
		    else
		    {
		        PWMleft += KpLeft*(ErrorLeft[0] - ErrorLeft[1]) + KiLeft*ErrorLeft[0] + KdLeft*(ErrorLefsockett[0] - 2*ErrorLeft[1] + ErrorLeft[2]);
		    }
		    console.log("PWMleft = " + PWMleft);
		    if (PWMleft > 255) {
		        PWMleft = 255;
		    }
		    else if(PWMleft < 0)
		    {
		        PWMleft = 0;
		    }
		    board.digitalWrite(22, 0); // LEFT
		    board.digitalWrite(23, 1); // LEFT
		    board.analogWrite(11, PWMleft);
		    if(desiredFLeft == 0)
		        board.analogWrite(11, 0);
		}


		if(!RightForwardFlag)
		{
		    if(IntegralCounterRight < SummInterval)
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
		    if(IntegralCounterRight = 1)
		    {
		        PWMright += KiRight*ErrorRight[0];
		    }
		    else if(IntegralCounterRight = 2)
		    {
		        PWMright += KpRight*(ErrorRight[0] - ErrorRight[1]) + KiRight*ErrorRight[0];
		    }
		    else
		    {
		        PWMright += KpRight*(ErrorRight[0] - ErrorRight[1]) + KiRight*ErrorRight[0] + KdRight*(ErrorRight[0] - 2*ErrorRight[1] + ErrorRight[2]);
		    }
		    console.log("PWMRight = " + PWMright);
		    if (PWMright > 255) {
		        PWMright = 255;
		    }
		    else if(PWMright < 0)
		    {
		        PWMright = 0;
		    }
		    board.digitalWrite(28, 1); // Right
		    board.digitalWrite(29, 0); // Right
		    board.analogWrite(10, PWMright);
		    if(desiredFRight == 0)
		        board.analogWrite(10, 0);
		}
		else
		{
		    if(IntegralCounterRight < SummInterval)
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
		    if(IntegralCounterRight = 1)
		    {
		        PWMright += KiRight*ErrorRight[0];
		    }
		    else if(IntegralCounterRight = 2)
		    {
		        PWMright += KpRight*(ErrorRight[0] - ErrorRight[1]) + KiRight*ErrorRight[0];
		    }
		    else
		    {
		        PWMright += KpRight*(ErrorRight[0] - ErrorRight[1]) + KiRight*ErrorRight[0] + KdRight*(ErrorRight[0] - 2*ErrorRight[1] + ErrorRight[2]);
		    }
		    console.log("PWMRight = " + PWMright);
		    if (PWMright > 255) {
		        PWMright = 255;
		    }
		    else if(PWMright < 0)
		    {
		        PWMright = 0;
		    }
		    board.digitalWrite(28, 0); // Right
		    board.digitalWrite(29, 1); // Right
		    board.analogWrite(10, PWMright);
		    if(desiredFRight == 0)
		        board.analogWrite(10, 0);
		}    
	} // stop flag else finish
    }
}    
var frequencyMeasureLeftRightTimer=setInterval(function(){frequencyMeasureLeftRight()}, 150);   

function CameraUpDown()
{
    if(CameraStop == false)
    {
        if(CameraDown == true)
        {
            tilt = tilt + 1;
            if(tilt > 175)
                tilt = 175;
            board.servoWrite(6,tilt);   
        }
        else
        {
            tilt = tilt - 1;
            if(tilt < 40)
                tilt = 40;
            board.servoWrite(6,tilt);   
        }
    }
}

var CameraUpDownControl=setInterval(function(){CameraUpDown()}, 20);   

function CameraLeftRight()
{
    if(CameraStop2 == false)
    {
        if(CameraLeft == true)
        {
            tilt2 = tilt2 - 1;
            if(tilt2 < 1)
                tilt2 = 1;
            board.servoWrite(5,tilt2);   
        }
        else
        {
            tilt2 = tilt2 + 1;
            if(tilt2 > 179)
                tilt2 = 179;            
            board.servoWrite(5,tilt2);   
        }
    }
}

var CameraLeftRightControl=setInterval(function(){CameraLeftRight()}, 20);  
//var cv = require('opencv');
var tilt = 90; // spremenljivka za premik kamere - gor/dol t.j. "tilt"
var tilt2 = 90; // spremenljivka za premik kamere - levo/desno t.j. "tilt2"


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

//***var camera = new cv.VideoCapture(0);
//camera.set(4,320);
//camera.set(5,240);
//camera.width=320;
//camera.height=240;

//setTimeout(function(){console.log(camera.width)},5000);

  
//http.listen(1337); // doloèimo na katerih vratih bomo poslušali | vrata 80 sicer uporablja LAMP

var httpListenPort = 8080; // doloèimo spremenljivko; kje poslušamo - rabimo v nadaljevanju
http.listen(httpListenPort); // doloèimo na katerih vratih bomo poslušali | vrata 80 sicer uporablja LAMP | lahko doloèimo na "router-ju" (http je glavna spremenljivka, t.j. aplikacija oz. app)

function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    //return new Buffer(bitmap).toString('base64');
    return new Buffer(bitmap).toString('base64');
}

function akcija(outArg, imArg, callback) { // prvi del za callback funkcijo

	return callback(outArg, imArg);

}

function posredujSliko(outArg, imArg) { // drugi del za callback funkcijo

     outArg.save('out8.jpg'); // *** za pisanje rezultatov na disk
    imArg.save('original.jpg');
    var base64str1 = base64_encode('original.jpg');
    //var base64str1 = base64_encode('/home/pika/moved.jpg');
    //var base64str2 = base64_encode('out8.jpg');
    //io.sockets.emit("posredujBase64string",base64str1, base64str2); // bo izvedel to funkcijo, t.j. "Pozdravljen svet!" ta funkcija pa emitira nazaj na klienta (išèe funkcijo testzadeve in posreduje podatke "Pozdravljen svet!")
    io.sockets.emit("posredujBase64string",base64str1); // bo izvedel to funkcijo, t.j. "Pozdravljen svet!" ta funkcija pa emitira nazaj na klienta (išèe funkcijo testzadeve in posreduje podatke "Pozdravljen svet!")
    //console.log(base64str1);
	//console.log("klic");
}


function handler (req, res) { // handler za "response"; ta handler "handla" le datoteko index.html
    fs.readFile(__dirname + "/demo_07.html",
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
    var base64str1 = base64_encode('/home/cloudsto/moved.jpg');
    //var base64str1 = base64_encode('/home/pika/moved.jpg');
    ////var base64str2 = base64_encode('out8.jpg');
    io.sockets.emit("posredujBase64string",base64str1); // , base64str2 bo izvedel to funkcijo, t.j. "Pozdravljen svet!" ta funkcija pa emitira nazaj na klienta (išèe funkcijo testzadeve in posreduje podatke "Pozdravljen svet!")
    //io.sockets.emit("posredujBase64string",base64str1); // bo izvedel to funkcijo, t.j. "Pozdravljen svet!" ta funkcija pa emitira nazaj na klienta (išče funkcijo testzadeve in posreduje podatke "Pozdravljen svet!")
    //console.log(base64str1);
	//console.log("klic");


    }); 


	socket.on("ukazArduinu", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išèi funkcijo ukazArduinu)
		
// *********************
// *********************
// *********************
		
	
		if (data.stevilkaUkaza == "777") {
		StopFlag = false;
	        board.digitalWrite(13, this.HIGH); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = Speed;
            desiredFRight = Speed;
            LeftForwardFlag = true;
            RightForwardFlag = true;
            PWMleft = 0;
            PWMright = 0;
	        //this.analogWrite(11,255-60); // naprej levi motor
	        //this.analogWrite(10,255-60); // naprej desni motor
		}		  		  

		else if (data.stevilkaUkaza == "888") {
		StopFlag = false;
	        board.digitalWrite(13, 1); // na pinu 13 zapišemo vrednost HIGH
            
            //this.digitalWrite(23, this.LOW); // RIGHT
            desiredFLeft = Speed;
            desiredFRight = Speed;
            LeftForwardFlag = false;
            RightForwardFlag = false;
            PWMleft = 0;
            PWMright = 0;
	        //this.analogWrite(11,60); // nazaj levi motor
	        //this.analogWrite(10,60); // nazaj desni motor           

		}		  		  
  
		else if (data.stevilkaUkaza == "999") {
		StopFlag = true;
	        board.digitalWrite(13, 0); // na pinu 13 zapišemo vrednost HIGH
            	desiredFLeft = 0;
            	desiredFRight = 0;
            	LeftForwardFlag = false;
            	RightForwardFlag = false;
            	PWMleft = 0;
            	PWMright = 0;
		    //this.analogWrite(11,0); // stop levi motor
		    //this.analogWrite(10,0); // stop desni motor
		}

		else if (data.stevilkaUkaza == "40") { //bela
	       board.digitalWrite(12, 0); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "41") {
	       board.digitalWrite(12, 1); // na pinu zapišemo vrednost HIGH
		}
		else if (data.stevilkaUkaza == "80") { // modra
	       board.digitalWrite(2, 0); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "81") {
		       board.digitalWrite(2, 1); // na pinu zapišemo vrednost HIGH
		}		  		  
		else if (data.stevilkaUkaza == "70") { // rumena
		      board.digitalWrite(13, 0); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "71") {
		      board.digitalWrite(13, 1); // na pinu zapišemo vrednost HIGH
		}
		else if (data.stevilkaUkaza == "120") { // zelena
		      board.digitalWrite(3, 0); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "121") {
		      board.digitalWrite(3, 1); // na pinu zapišemo vrednost HIGH
		}
		else if (data.stevilkaUkaza == "130") { // rdeca
		      board.digitalWrite(4, 0); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "131") {
		      board.digitalWrite(4, 1); // na pinu zapišemo vrednost HIGH
		}

        else if (data.stevilkaUkaza == "3") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
            if (data.valuePWM != 0) { // če PWM vrednost ni 0 vklopimo rele
                board.digitalWrite(3, 1); // na pinu 3 zapišemo vrednost HIGH
            }
            //else { // če je PWM vrednost enaka 0 izklopimo rele
            //    this.digitalWrite(3, this.LOW); // na pinu 3 zapišemo vrednost LOW
            //    this.digitalWrite(12, this.LOW); // na pinu 3 zapišemo vrednost LOW
            //}
            board.analogWrite(data.pinNo, data.valuePWM); // tretji argument je lahko tudi callback - za funkcijo, ki jo kličemo po izvedbi
            console.log("pinNO=" + data.pinNo + " | " + "valuePWM = " + data.valuePWM);
            socket.emit("sporociloKlientu", "PWM Custom."); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED ugasnjena."
        } 


		else if (data.stevilkaUkaza == "7771") { // buttonLeftforward 
		StopFlag = false;
	        board.digitalWrite(13, 1); // na pinu 13 zapišemo vrednost HIGH
	        desiredFLeft = Speed/2;
            desiredFRight = Speed;
            LeftForwardFlag = true;
            RightForwardFlag = true;
            PWMleft = 0;
            PWMright = 0;
	        //setTimeout(function() {this.servoWrite(10,0);},0); // naprej levi motor malo manj
	        //setTimeout(function() {this.servoWrite(11,0 );},0); // naprej levi motor

		}
		
		else if (data.stevilkaUkaza == "7772") { // buttonRightforward 
		StopFlag = false;
	        board.digitalWrite(13, 1); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = Speed;
            desiredFRight = Speed/2;
            LeftForwardFlag = true;
            RightForwardFlag = true;
            PWMleft = 0;
            PWMright = 0;
	        //setTimeout(function() {this.servoWrite(10,0);},0); // naprej levi motor
	        //setTimeout(function() {this.servoWrite(11,0 );},0); // naprej desni motor malo manj

	        

		}
		else if (data.stevilkaUkaza == "9991") { // buttonSpinleft 
		StopFlag = false;
	        board.digitalWrite(13, 1); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = Speed;
            desiredFRight = Speed;
            LeftForwardFlag = false;
            RightForwardFlag = true;
            PWMleft = 0;
            PWMright = 0;
	        //this.analogWrite(11,75); // nazaj levi motor
	        //this.analogWrite(10,255-75); // naprej desni motor
	        //setTimeout(function() {this.servoWrite(10,92 );},0); // nazaj levi motor
	        //setTimeout(function() {this.servoWrite(11,92);},0); // naprej desni motor

		}
		else if (data.stevilkaUkaza == "9992") { // buttonSpinright
		StopFlag = false;
	        board.digitalWrite(13, 1); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = Speed;
            desiredFRight = Speed;
            LeftForwardFlag = true;
            RightForwardFlag = false;
            PWMleft = 0;
            PWMright = 0;
	        //this.analogWrite(11,255-75); // naprej levi motor
	        //this.analogWrite(10,75); // nazaj desni motor
	        //setTimeout(function() {this.servoWrite(11,94);},0); // naprej levi motor
			//setTimeout(function() {this.servoWrite(10,94);},0); // nazaj desni motor

		}
		else if (data.stevilkaUkaza == "8881") { // buttonLeftbackward
		StopFlag = false;
	        board.digitalWrite(13, 1); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = Speed/2;
            desiredFRight = Speed;
            LeftForwardFlag = false;
            RightForwardFlag = false;
            PWMleft = 0;
            PWMright = 0;
	        //setTimeout(function() {this.servoWrite(10,0);},0); // naprej levi motor
	        //setTimeout(function() {this.servoWrite(11,0 );},0); // naprej desni motor malo manj

		}
		else if (data.stevilkaUkaza == "8882") { // buttonRightbackward
		StopFlag = false;
	        board.digitalWrite(13, 1); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = Speed;
            desiredFRight = Speed/2;
            LeftForwardFlag = false;
            RightForwardFlag = false;
            PWMleft = 0;
            PWMright = 0;
		    //setTimeout(function() {this.servoWrite(10,0);},0); // naprej levi motor malo manj
	        //setTimeout(function() {this.servoWrite(11,0 );},0); // naprej levi motor	        
		

		}


		else if (data.stevilkaUkaza == "9998") { // CAMERA TILT
                CameraDown = true;
                CameraStop = false; 
                //tilt = tilt + 3;
                //this.servoWrite(6,tilt); 
	        }
        else if (data.stevilkaUkaza == "99981") { // CAMERA TILT
                CameraDown = true;
                CameraStop = true;
			    //tilt = tilt + 3;
                //this.servoWrite(6,tilt);           
	        }
        else if (data.stevilkaUkaza == "99982") { // CAMERA TILT
                //CameraDown = true;
                //CameraStop = true;
			    tilt = tilt + 5;
                if(tilt > 180)
                    tilt = 180;
                board.servoWrite(6,tilt);           
	        }
        else if (data.stevilkaUkaza == "9999") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
			    CameraDown = false;
                CameraStop = false;
                //tilt = tilt - 3;
	        	//this.servoWrite(6,tilt);
	        }	
        else if (data.stevilkaUkaza == "99991") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
			    CameraDown = false;
                CameraStop = true;    
                //tilt = tilt - 3;
	        	//this.servoWrite(6,tilt);
	        }
        else if (data.stevilkaUkaza == "99992") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
			    //CameraDown = false;
                //CameraStop = true;    
                tilt = tilt - 5;
                if(tilt < 35)
                    tilt = 35;
	        	board.servoWrite(6,tilt);
	        }
        else if (data.stevilkaUkaza == "9996") { // CAMERA TILT
                CameraLeft = true;
                CameraStop2 = false; 
                //tilt = tilt + 3;
                //this.servoWrite(6,tilt); 
	        }
        else if (data.stevilkaUkaza == "99961") { // CAMERA TILT
                CameraLeft = true;
                CameraStop2 = true;
			    //tilt = tilt + 3;
                //this.servoWrite(6,tilt);           
	        }
        else if (data.stevilkaUkaza == "99962") { // CAMERA TILT
                //CameraLeft = true;
                //CameraStop2 = true;
		tilt2 = tilt2 - 3;
                if(tilt2 < 1)
                    tilt2 = 1;
                board.servoWrite(5,tilt2);           
	        }
        else if (data.stevilkaUkaza == "9997") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
			    CameraLeft = false;
                CameraStop2 = false;
                //tilt = tilt - 3;
	        	//this.servoWrite(6,tilt);
	        }	
        else if (data.stevilkaUkaza == "99971") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
			    CameraLeft = false;
                CameraStop2 = true;    
                //tilt = tilt - 3;
	        	//this.servoWrite(6,tilt);
	        }
        else if (data.stevilkaUkaza == "99972") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
			    //CameraLeft = false;
                //CameraStop2 = true;    
                tilt2 = tilt2 + 3;
		if(tilt2 > 179)
                    tilt2 = 179;
	        	board.servoWrite(5,tilt2);
	        }
	else if (data.stevilkaUkaza == "11171") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
        		Speed = Speed + 0.2*Speed;  
			if(Speed > 50)
				Speed = 50;
	        }
        else if (data.stevilkaUkaza == "11172") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
        		Speed = Speed - 0.2*Speed;  
	        }





		/*else if (data.stevilkaUkaza == "9999") { // buttonTiltup
	        this.digitalWrite(13, this.HIGH); // na pinu 13 zapišemo vrednost HIGH
	        setTimeout(function() {this.servoWrite(6,30 );},0); // nazaj levi motor
	        

		}
		
		else if (data.stevilkaUkaza == "9998") { // buttonTiltdown
	        this.digitalWrite(13, this.HIGH); // na pinu 13 zapišemo vrednost HIGH
	        setTimeout(function() {this.servoWrite(6,100 );},0); // nazaj levi motor
	        }
		*/
		

	
	/*	
		
		
		
		
		  if (data.stevilkaUkaza == "11") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 1
	            this.digitalWrite(13, this.HIGH); // na pinu 13 zapišemo vrednost HIGH
		    setTimeout(function() {this.servoWrite(11,92);},0); // nazaj levi motor
		    setTimeout(function() {this.servoWrite(10,92);},0); // naprej desni motor
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            //io.sockets.emit("sporociloKlientu", "LED prižgana na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	        }
		  
		  
		  
  
		else if (data.stevilkaUkaza == "12") {
	        this.digitalWrite(13, this.HIGH); // na pinu 13 zapišemo vrednost HIGH
		setTimeout(function() {this.servoWrite(11,94);},0); // naprej levi motor
		setTimeout(function() {this.servoWrite(10,94);},0); // nazaj desni motor
		}
		else if (data.stevilkaUkaza == "13") {
	        this.digitalWrite(13, this.HIGH); // na pinu 13 zapišemo vrednost HIGH
		setTimeout(function() {this.servoWrite(11,93);},0); // stop levi motor
		setTimeout(function() {this.servoWrite(10,93);},0); // stop desni motor
		}

	        else if (data.stevilkaUkaza == "31") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 1
	            this.digitalWrite(12, this.HIGH); // na pinu 13 zapišemo vrednost HIGH
		    setTimeout(function() {this.servoWrite(11,92 );},0); // nazaj levi motor
		    setTimeout(function() {this.servoWrite(10,92 );},0); // naprej desni motor
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            //io.sockets.emit("sporociloKlientu", "LED prižgana na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	        }
		else if (data.stevilkaUkaza == "32") {
	        this.digitalWrite(12, this.HIGH); // na pinu 13 zapišemo vrednost HIGH
		setTimeout(function() {this.servoWrite(11,94 );},0); // naprej levi motor
		setTimeout(function() {this.servoWrite(10,94 );},0); // nazaj desni motor
		}
		else if (data.stevilkaUkaza == "33") {
	        this.digitalWrite(12, this.HIGH); // na pinu 13 zapišemo vrednost HIGH
		setTimeout(function() {this.servoWrite(11,93 );},0); // stop levi motor
		setTimeout(function() {this.servoWrite(10,93 );},0); // stop desni motor
		}
		  
		else if (data.stevilkaUkaza == "80") {
	       //this.digitalWrite(8, this.LOW); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "81") {
		       //this.digitalWrite(8, this.HIGH); // na pinu zapišemo vrednost HIGH
			}		  		  
		else if (data.stevilkaUkaza == "70") {
		       //this.digitalWrite(7, this.LOW); // na pinu zapišemo vrednost LOW
			}
			else if (data.stevilkaUkaza == "71") {
			       //this.digitalWrite(7, this.HIGH); // na pinu zapišemo vrednost HIGH
				}		else if (data.stevilkaUkaza == "40") {
				       this.digitalWrite(4, this.LOW); // na pinu zapišemo vrednost LOW
				}
				else if (data.stevilkaUkaza == "41") {
				       this.digitalWrite(4, this.HIGH); // na pinu zapišemo vrednost HIGH
					}
		  
		  
		  
		  
		else if (data.stevilkaUkaza == "90") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 1
	        	this.servoWrite(9,5);
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
//	            io.sockets.emit("sporociloKlientu", "LED prižgana na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	        }
	        else if (data.stevilkaUkaza == "91") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
	        	this.servoWrite(9,90);
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            //io.sockets.emit("sporociloKlientu", "LED ugasnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	        }		  

	        else if (data.stevilkaUkaza == "0") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
	            this.digitalWrite(13, this.LOW); // na pinu 13 zapišemo vrednost LOW
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            io.sockets.emit("sporociloKlientu", "LED ugasnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
		setTimeout(function() {this.servoWrite(11,93 );},0); // stop levi motor
		setTimeout(function() {this.servoWrite(10,93 );},0); // stop desni motor
	        }

	   else if (data.stevilkaUkaza == "2") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
	            this.digitalWrite(12, this.LOW); // na pinu 13 zapišemo vrednost LOW
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            //io.sockets.emit("sporociloKlientu", "LED ugasnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
		setTimeout(function() {this.servoWrite(11,93 );},0); // stop levi motor
		setTimeout(function() {this.servoWrite(10,93 );},120); // stop desni motor
	        }
// *********************
// *********************
// *********************		
		
		
		
		
	*/	


// 1234	
/*
 else if (data.stevilkaUkaza == "0") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
	            this.digitalWrite(13, this.LOW); // na pinu 13 zapišemo vrednost LOW
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            io.sockets.emit("sporociloKlientu", "LED ugasnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
		setTimeout(function() {this.servoWrite(11,93 );},0); // stop levi motor
		setTimeout(function() {this.servoWrite(10,93 );},0); // stop desni motor
	        }

	   else if (data.stevilkaUkaza == "2") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
	            this.digitalWrite(12, this.LOW); // na pinu 13 zapišemo vrednost LOW
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            //io.sockets.emit("sporociloKlientu", "LED ugasnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
		setTimeout(function() {this.servoWrite(11,93 );},0); // stop levi motor
		setTimeout(function() {this.servoWrite(10,93 );},120); // stop desni motor
	        }

*/
// 1234	

		else if (data.stevilkaUkaza == "90") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 1
	        	board.servoWrite(9,175);
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
//	            io.sockets.emit("sporociloKlientu", "LED prižgana na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	        }
	        else if (data.stevilkaUkaza == "91") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
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

/*	
	this.digitalRead(2, function(value) {
     if (value === 0) {
         // this.digitalWrite(13, this.LOW);
     	socket.emit("sporociloKlientu", "Tipka spušèena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo funkcijo = "hello" na klientu, z argumentom, t.j. podatki="Strežnik povezan."
         socket.emit("pritisnjenaTipka", {"stUkaza": 0});
     }
     else if (value == 1) {
         // this.digitalWrite(13, this.HIGH);
         socket.emit("sporociloKlientu", "Tipka pritisnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo funkcijo = "hello" na klientu, z argumentom, t.j. podatki="Strežnik povezan."        	
         socket.emit("pritisnjenaTipka", {"stUkaza": 1}); 
     }
 }); 	
*/

 

});

