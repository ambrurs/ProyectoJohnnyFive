var five = require("johnny-five"), button, buttonLed;
      _    = require('lodash');

var socket = require('socket.io-client')('http://206.189.234.255:8083/',{reconnect: true});


/*var express = require('express');
var app = express();
var io = require('socket.io')(app.listen(8083));
var path = require('path'); */     

var flag = false;
var valorTem;

/*app.use(express.static(path.join(__dirname + '/nodebot')));

app.get('/', function (req,res) { 
    res.sendFile(__dirname + '/index.html');
});*/


var board = new five.Board({ports:'COM3'});
var temp = -1;
board.on("ready", function () {

       console.log("Conectado al socket", socket.id);

    var temperature  =  new five.Thermometer({
        controller: "LM35",
        pin: "A0"
      });

    var rgb = new five.Led.RGB({
        pins: {
            red: 9,
            green: 10,
            blue: 11
        },
        isAnode: true
    });

    rgb.on();

    var light = new five.Light("A1");

    var motion = new five.Motion(1);


	var self = this;
  var write = (message) => {
    this.i2cWrite(0x08, Array.from(message, c => c.charCodeAt(0)));
  };
  this.i2cConfig();

  this.repl.inject({ write });

    button = new five.Button(2);

  // Inject the `button` hardware into
  // the Repl instance's context;
  // allows direct command line access
  board.repl.inject({
    button: button
  });	


  // "up" the button is released
  button.on("up", function() {
	 write("servo");
  });

     buttonLed = new five.Button(8);

  // Inject the `button` hardware into
  // the Repl instance's context;
  // allows direct command line access
  board.repl.inject({
    buttonLed: buttonLed
  });	

  // "up" the button is released
  buttonLed.on("up", function() {    
	 write("led");
  });
  
  
  //alarma
  var alarma =  function(){
 var piezo = new five.Piezo(7);

  // Injects the piezo into the repl
  board.repl.inject({
    piezo: piezo
  });

  // Plays a song
  piezo.play({
    // song is composed by an array of pairs of notes and beats
    // The first argument is the note (null means "no note")
    // The second argument is the length of time (beat) of the note (or non-note)
    song: [
      ["C4", 1 / 4],
      ["D4", 1 / 4],
      ["F4", 1 / 4],
      ["D4", 1 / 4],
      ["A4", 1 / 4],
      [null, 1 / 4],
      ["A4", 1],
      ["G4", 1],
      [null, 1 / 2],
      ["C4", 1 / 4],
      ["D4", 1 / 4],
      ["F4", 1 / 4],
      ["D4", 1 / 4],
      ["G4", 1 / 4],
      [null, 1 / 4],
      ["G4", 1],
      ["F4", 1],
      [null, 1 / 2]
    ],
    tempo: 100
  });

  // Plays the same song with a string representation
  piezo.play({
    // song is composed by a string of notes
    // a default beat is set, and the default octave is used
    // any invalid note is read as "no note"
    song: "C D F D A - A A A A G G G G - - C D F D G - G G G G F F F F - -",
    beats: 1 / 4,
    tempo: 100
  });
  }
   var led = new five.Led(11);
  var encenderLed =  function(){
  led.on();
  }
   var apagarLed =  function(){
  led.off();
  }


 var read =  function(){
   //self.io.i2cRead(address, bytesToRead, handler)
   self.io.i2cRead(8, 27, function(ArrayOfBytes){

     //console.log(ArrayOfBytes);

     var length = ArrayOfBytes.length;
     var message = "";
	 
	  for (var i = 0; i < length; i++){
       var code = ArrayOfBytes[i]
       var char = String.fromCharCode(code);
       if (code != 255){
         message = message.concat(char);
       }
       
     }
     if (message.length != 1){
       //console.log(message.length, message);	   
     }
	 
	 if(message.includes ("Sensor activado")){
		 alarma();
	 }
	if(message.includes("C:")){
		flag = true;
     temp =  parseInt(message.substring(2));
		
    valorTem = temp;
    if(temp > 20 && temp < 30){		 
		encenderLed();		 
	    } else {
			apagarLed();
		}
	}
   }
 )} 

  read();


      socket.on('ledPrint', function(data){
          rgb.color(data);
      });

      socket.on('onServo', function (){
        console.log("Ejecutando el servo");
         write("servo"); 
      });

    socket.on('offServo', function (){
         console.log("Encendiendo leds");
         write("servo"); 
      });



    /*socket.on("temp",function(){
          socket.emit('tempResponse', temp);      
    });*/

      //Temperatura
      temperature.on("change", function() {
           socket.emit('temp', this.celsius);
        });

      //Forocelda
      light.on("change", function() {
         socket.emit('sensorLuz', this.level);
      });


      motion.on("calibrated", function() {
        console.log("calibrated");
      });

      motion.on("motionstart", function() {
         console.log("motionstart");
      });

      motion.on("motionend", function() {
        console.log("motionend");
      });

});
