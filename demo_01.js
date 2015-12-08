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
var KdLeft = 4;
var KpRight = 1;
var KiRight = 0.5;
var KdRight = 4;

var LeftSensFlag=0;
var RightSensFlag=0;

var desiredFLeft=0;
var desiredFRight=0;

var LeftForwardFlag = false;
var RightForwardFlag = false;

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

var firmata = require("firmata");

var board = new firmata.Board("/dev/ttyACM0",function(){
    console.log("Prikljuèitev na Arduino");
	console.log("Firmware: " + board.firmware.name + "-" + board.firmware.version.major + "." + board.firmware.version.minor); // izpišemo verzijo Firmware
	
//	console.log("Omogoèimo pin 3");
//	board.pinMode(3, board.MODES.SERVO);	
	
	console.log("Omogoèimo pin 9");
	board.pinMode(9, board.MODES.SERVO);	
    board.servoWrite(9,5);
	
    console.log("Omogoèimo pin 10");
    board.pinMode(10, board.MODES.PWM);
	console.log("Omogoèimo pin 11");
    board.pinMode(11, board.MODES.PWM);
    console.log("Omogoèimo pin 13");    
    board.pinMode(13, board.MODES.OUTPUT);
    console.log("Omogoèimo pin 13");
    board.pinMode(12, board.MODES.OUTPUT);
    
    board.pinMode(22, board.MODES.OUTPUT);    
    board.pinMode(23, board.MODES.OUTPUT);
    board.digitalWrite(22, board.HIGH);
    board.digitalWrite(23, board.HIGH);
    
    board.pinMode(24, board.MODES.INPUT);
    board.pinMode(25, board.MODES.INPUT);
    board.digitalWrite(24, board.HIGH);
    board.digitalWrite(25, board.HIGH);

    console.log("Omogoèimo pin 8");
    board.pinMode(8, board.MODES.OUTPUT);
    console.log("Omogoèimo pin 7");
    board.pinMode(7, board.MODES.OUTPUT);
    console.log("Omogoèimo pin 4");
    board.pinMode(4, board.MODES.OUTPUT);

    board.pinMode(6, board.MODES.SERVO);
	console.log("Tilt servo");    
    
	console.log("Omogoèimo tipko na pinu 2.");
    board.pinMode(2, board.MODES.INPUT);
    board.servoWrite(6,90); // kamero postavimo na izhodiščni kot, ki je podan s spremenljivko "tilt"
    
    BoardStartedFlag = true;
    
    board.digitalRead(24, function(value) {
        if (LeftSensFlag == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
        }
        else
        {
            LeftSensFlag = value;
            timesArrayLeft.push(Date.now());
           // console.log("Pin 24 active " + value);
        }
    });
    board.digitalRead(25, function(value) {
        if (RightSensFlag == value) { // ta del rabimo, da se ne zgodi, da nam ob vklopu, ko kolesa mirujejo digitalRead prebere 1 - kolo sicer miruje (enko vedno prebre) in bi nato narobe preračunali frekvenco 1/0.5=2 V resnici kolo miruje. Prvi preračun lahko naredimo le, ko se pojavi naslednja vrednost
        }
        else
        {
            RightSensFlag = value;
            timesArrayRight.push(Date.now());
           // console.log("Pin 25 active " + value);
        }
    });

});


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
            board.digitalWrite(22, board.LOW); // LEFT
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
            board.digitalWrite(22, board.HIGH); // LEFT
            board.analogWrite(11, 255-PWMleft);
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
            board.digitalWrite(23, board.LOW); // Right
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
            board.digitalWrite(23, board.HIGH); // Right
            board.analogWrite(10, 255-PWMright);
            if(desiredFRight == 0)
                board.analogWrite(10, 0);
        }    
    }
}    
var frequencyMeasureLeftRightTimer=setInterval(function(){frequencyMeasureLeftRight()}, 50);   
    

//var cv = require('opencv');
var tilt = 90; // spremenljivka za premik kamere - gor/dol t.j. "tilt"


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
    fs.readFile(__dirname + "/demo_01.html",
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




var trikotnikObstaja = 0;
var pravokotnikObstaja = 0;



// *****************************************************************************


 socket.on("pridobisliko", function (stikalo) { // ko je socket ON in je posredovan preko connection-a: testpovezave (t.j. ukaz: išèi funkcijo pridobisliko)
    // convert image to base64 encoded string

     ////out.save('out8.jpg'); // *** za pisanje rezultatov na disk
    im.save('original.jpg');
    var base64str1 = base64_encode('original.jpg');
    //var base64str1 = base64_encode('/home/pika/moved.jpg');
    ////var base64str2 = base64_encode('out8.jpg');
    io.sockets.emit("posredujBase64string",base64str1); // , base64str2 bo izvedel to funkcijo, t.j. "Pozdravljen svet!" ta funkcija pa emitira nazaj na klienta (išèe funkcijo testzadeve in posreduje podatke "Pozdravljen svet!")
    //console.log(base64str1);
	//console.log("klic");


    }); 


	socket.on("ukazArduinu", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išèi funkcijo ukazArduinu)
		
// *********************
// *********************
// *********************
		
	
		if (data.stevilkaUkaza == "777") {
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = 5;
            desiredFRight = 5;
            LeftForwardFlag = true;
            RightForwardFlag = true;
	        //board.analogWrite(11,255-60); // naprej levi motor
	        //board.analogWrite(10,255-60); // naprej desni motor
		}		  		  

		else if (data.stevilkaUkaza == "888") {
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
            
            //board.digitalWrite(23, board.LOW); // RIGHT
            desiredFLeft = 5;
            desiredFRight = 5;
            LeftForwardFlag = false;
            RightForwardFlag = false;
	        //board.analogWrite(11,60); // nazaj levi motor
	        //board.analogWrite(10,60); // nazaj desni motor           

		}		  		  
  
		else if (data.stevilkaUkaza == "999") {
	        board.digitalWrite(13, board.LOW); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = 0;
            desiredFRight = 0;
            LeftForwardFlag = false;
            RightForwardFlag = false;
		    //board.analogWrite(11,0); // stop levi motor
		    //board.analogWrite(10,0); // stop desni motor
		}

		else if (data.stevilkaUkaza == "40") {
	       board.digitalWrite(4, board.LOW); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "41") {
	       board.digitalWrite(4, board.HIGH); // na pinu zapišemo vrednost HIGH
		}
		else if (data.stevilkaUkaza == "80") {
	       board.digitalWrite(8, board.LOW); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "81") {
		       board.digitalWrite(8, board.HIGH); // na pinu zapišemo vrednost HIGH
		}		  		  
		else if (data.stevilkaUkaza == "70") {
		      board.digitalWrite(7, board.LOW); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "71") {
		      board.digitalWrite(7, board.HIGH); // na pinu zapišemo vrednost HIGH
		}
		else if (data.stevilkaUkaza == "120") {
		      board.digitalWrite(12, board.LOW); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "121") {
		      board.digitalWrite(12, board.HIGH); // na pinu zapišemo vrednost HIGH
		}
		else if (data.stevilkaUkaza == "130") {
		      board.digitalWrite(13, board.LOW); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "131") {
		      board.digitalWrite(13, board.HIGH); // na pinu zapišemo vrednost HIGH
		}

        else if (data.stevilkaUkaza == "3") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
            if (data.valuePWM != 0) { // če PWM vrednost ni 0 vklopimo rele
                board.digitalWrite(3, board.HIGH); // na pinu 3 zapišemo vrednost HIGH
            }
            //else { // če je PWM vrednost enaka 0 izklopimo rele
            //    board.digitalWrite(3, board.LOW); // na pinu 3 zapišemo vrednost LOW
            //    board.digitalWrite(12, board.LOW); // na pinu 3 zapišemo vrednost LOW
            //}
            board.analogWrite(data.pinNo, data.valuePWM); // tretji argument je lahko tudi callback - za funkcijo, ki jo kličemo po izvedbi
            console.log("pinNO=" + data.pinNo + " | " + "valuePWM = " + data.valuePWM);
            socket.emit("sporociloKlientu", "PWM Custom."); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED ugasnjena."
        } 


		else if (data.stevilkaUkaza == "7771") { // buttonLeftforward 
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
	        desiredFLeft = 3;
            desiredFRight = 6;
            LeftForwardFlag = true;
            RightForwardFlag = true;
	        //setTimeout(function() {board.servoWrite(10,0);},0); // naprej levi motor malo manj
	        //setTimeout(function() {board.servoWrite(11,0 );},0); // naprej levi motor

		}
		
		else if (data.stevilkaUkaza == "7772") { // buttonRightforward 
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = 6;
            desiredFRight = 3;
            LeftForwardFlag = true;
            RightForwardFlag = true;
	        //setTimeout(function() {board.servoWrite(10,0);},0); // naprej levi motor
	        //setTimeout(function() {board.servoWrite(11,0 );},0); // naprej desni motor malo manj

	        

		}
		else if (data.stevilkaUkaza == "9991") { // buttonSpinleft 
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = 5;
            desiredFRight = 5;
            LeftForwardFlag = false;
            RightForwardFlag = true;
	        //board.analogWrite(11,75); // nazaj levi motor
	        //board.analogWrite(10,255-75); // naprej desni motor
	        //setTimeout(function() {board.servoWrite(10,92 );},0); // nazaj levi motor
	        //setTimeout(function() {board.servoWrite(11,92);},0); // naprej desni motor

		}
		else if (data.stevilkaUkaza == "9992") { // buttonSpinright
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = 5;
            desiredFRight = 5;
            LeftForwardFlag = true;
            RightForwardFlag = false;
	        //board.analogWrite(11,255-75); // naprej levi motor
	        //board.analogWrite(10,75); // nazaj desni motor
	        //setTimeout(function() {board.servoWrite(11,94);},0); // naprej levi motor
			//setTimeout(function() {board.servoWrite(10,94);},0); // nazaj desni motor

		}
		else if (data.stevilkaUkaza == "8881") { // buttonLeftbackward
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = 6;
            desiredFRight = 3;
            LeftForwardFlag = false;
            RightForwardFlag = false;
	        //setTimeout(function() {board.servoWrite(10,0);},0); // naprej levi motor
	        //setTimeout(function() {board.servoWrite(11,0 );},0); // naprej desni motor malo manj

		}
		else if (data.stevilkaUkaza == "8882") { // buttonRightbackward
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
            desiredFLeft = 3;
            desiredFRight = 6;
            LeftForwardFlag = false;
            RightForwardFlag = false;
		    setTimeout(function() {board.servoWrite(10,0);},0); // naprej levi motor malo manj
	        setTimeout(function() {board.servoWrite(11,0 );},0); // naprej levi motor	        
		

		}


		else if (data.stevilkaUkaza == "9998") { // CAMERA TILT
			tilt = tilt + 3;
	        	board.servoWrite(6,tilt);
	        }
	        else if (data.stevilkaUkaza == "9999") { // če je številka ukaza, ki smo jo dobili iz klienta enaka 0
			tilt = tilt - 3;
	        	board.servoWrite(6,tilt);
	        }	





		/*else if (data.stevilkaUkaza == "9999") { // buttonTiltup
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
	        setTimeout(function() {board.servoWrite(6,30 );},0); // nazaj levi motor
	        

		}
		
		else if (data.stevilkaUkaza == "9998") { // buttonTiltdown
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
	        setTimeout(function() {board.servoWrite(6,100 );},0); // nazaj levi motor
	        }
		*/
		

	
	/*	
		
		
		
		
		  if (data.stevilkaUkaza == "11") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 1
	            board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
		    setTimeout(function() {board.servoWrite(11,92);},0); // nazaj levi motor
		    setTimeout(function() {board.servoWrite(10,92);},0); // naprej desni motor
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            //io.sockets.emit("sporociloKlientu", "LED prižgana na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	        }
		  
		  
		  
  
		else if (data.stevilkaUkaza == "12") {
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
		setTimeout(function() {board.servoWrite(11,94);},0); // naprej levi motor
		setTimeout(function() {board.servoWrite(10,94);},0); // nazaj desni motor
		}
		else if (data.stevilkaUkaza == "13") {
	        board.digitalWrite(13, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
		setTimeout(function() {board.servoWrite(11,93);},0); // stop levi motor
		setTimeout(function() {board.servoWrite(10,93);},0); // stop desni motor
		}

	        else if (data.stevilkaUkaza == "31") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 1
	            board.digitalWrite(12, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
		    setTimeout(function() {board.servoWrite(11,92 );},0); // nazaj levi motor
		    setTimeout(function() {board.servoWrite(10,92 );},0); // naprej desni motor
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            //io.sockets.emit("sporociloKlientu", "LED prižgana na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	        }
		else if (data.stevilkaUkaza == "32") {
	        board.digitalWrite(12, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
		setTimeout(function() {board.servoWrite(11,94 );},0); // naprej levi motor
		setTimeout(function() {board.servoWrite(10,94 );},0); // nazaj desni motor
		}
		else if (data.stevilkaUkaza == "33") {
	        board.digitalWrite(12, board.HIGH); // na pinu 13 zapišemo vrednost HIGH
		setTimeout(function() {board.servoWrite(11,93 );},0); // stop levi motor
		setTimeout(function() {board.servoWrite(10,93 );},0); // stop desni motor
		}
		  
		else if (data.stevilkaUkaza == "80") {
	       board.digitalWrite(8, board.LOW); // na pinu zapišemo vrednost LOW
		}
		else if (data.stevilkaUkaza == "81") {
		       board.digitalWrite(8, board.HIGH); // na pinu zapišemo vrednost HIGH
			}		  		  
		else if (data.stevilkaUkaza == "70") {
		       board.digitalWrite(7, board.LOW); // na pinu zapišemo vrednost LOW
			}
			else if (data.stevilkaUkaza == "71") {
			       board.digitalWrite(7, board.HIGH); // na pinu zapišemo vrednost HIGH
				}		else if (data.stevilkaUkaza == "40") {
				       board.digitalWrite(4, board.LOW); // na pinu zapišemo vrednost LOW
				}
				else if (data.stevilkaUkaza == "41") {
				       board.digitalWrite(4, board.HIGH); // na pinu zapišemo vrednost HIGH
					}
		  
		  
		  
		  
		else if (data.stevilkaUkaza == "90") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 1
	        	board.servoWrite(9,90);
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
//	            io.sockets.emit("sporociloKlientu", "LED prižgana na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	        }
	        else if (data.stevilkaUkaza == "91") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
	        	board.servoWrite(9,5);
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            //io.sockets.emit("sporociloKlientu", "LED ugasnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	        }		  

	        else if (data.stevilkaUkaza == "0") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
	            board.digitalWrite(13, board.LOW); // na pinu 13 zapišemo vrednost LOW
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            io.sockets.emit("sporociloKlientu", "LED ugasnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
		setTimeout(function() {board.servoWrite(11,93 );},0); // stop levi motor
		setTimeout(function() {board.servoWrite(10,93 );},0); // stop desni motor
	        }

	   else if (data.stevilkaUkaza == "2") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
	            board.digitalWrite(12, board.LOW); // na pinu 13 zapišemo vrednost LOW
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            //io.sockets.emit("sporociloKlientu", "LED ugasnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
		setTimeout(function() {board.servoWrite(11,93 );},0); // stop levi motor
		setTimeout(function() {board.servoWrite(10,93 );},120); // stop desni motor
	        }
// *********************
// *********************
// *********************		
		
		
		
		
	*/	


// 1234	
/*
 else if (data.stevilkaUkaza == "0") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
	            board.digitalWrite(13, board.LOW); // na pinu 13 zapišemo vrednost LOW
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            io.sockets.emit("sporociloKlientu", "LED ugasnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
		setTimeout(function() {board.servoWrite(11,93 );},0); // stop levi motor
		setTimeout(function() {board.servoWrite(10,93 );},0); // stop desni motor
	        }

	   else if (data.stevilkaUkaza == "2") { // èe je številka ukaza, ki smo jo dobili iz klienta enaka 0
	            board.digitalWrite(12, board.LOW); // na pinu 13 zapišemo vrednost LOW
	            //io.sockets.emit("sporociloKlientu", data.sporocilo); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
	            //io.sockets.emit("sporociloKlientu", "LED ugasnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo to funkcijo = "sporociloKlientu" na klientu, z argumentom, t.j. podatki="LED prižgana."
		setTimeout(function() {board.servoWrite(11,93 );},0); // stop levi motor
		setTimeout(function() {board.servoWrite(10,93 );},120); // stop desni motor
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
	board.digitalRead(2, function(value) {
     if (value === 0) {
         // board.digitalWrite(13, board.LOW);
     	socket.emit("sporociloKlientu", "Tipka spušèena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo funkcijo = "hello" na klientu, z argumentom, t.j. podatki="Strežnik povezan."
         socket.emit("pritisnjenaTipka", {"stUkaza": 0});
     }
     else if (value == 1) {
         // board.digitalWrite(13, board.HIGH);
         socket.emit("sporociloKlientu", "Tipka pritisnjena na arduinu IP: " + localaddress + ":" + httpListenPort); // izvedemo funkcijo = "hello" na klientu, z argumentom, t.j. podatki="Strežnik povezan."        	
         socket.emit("pritisnjenaTipka", {"stUkaza": 1}); 
     }
 }); 	
*/

 

});

