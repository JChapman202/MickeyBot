var five = require("johnny-five");
var Promise = require("bluebird");
var keypress = require("keypress");

keypress(process.stdin);

process.stdin.setRawMode(true);
process.stdin.resume();

var board = new five.Board({
	port: "/dev/tty.MickeyBot-DevB"
});

// var board = new five.Board();

var danceRelay = null;
var powerRelay = null;
var eyesLed = null;
var motionSensor = null;

board.on("ready", function() {
	console.log("Press any key to terminate bot");
	waitForInput().then(terminate);

	danceRelay = new five.Relay(3);
	powerRelay = new five.Relay(2);
	eyesLed = new five.Led(12);
	motionSensor = new five.Sensor({ pin: 10, type: "digital"});
	var timeout = null;

	powerRelay.open();
	danceRelay.open();
	eyesLed.off();

	board.repl.inject({
		powerRelay: powerRelay,
		danceRelay: danceRelay,
		eyesLed: eyesLed
	});

	motionSensor.on("data", function() {
		console.log("motion data", this.value);

		motionState = this.value;
		if (motionState) {
			console.log("motion detected");

			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			if (powerRelay.isOn) {
				triggerDance(danceRelay);
			}
			else {
				console.log("spinning up");
				powerRelay.close();
				eyesLed.on();
			}
		}
		else {
			if (powerRelay.isOn && !timeout) {
				timeout = setTimeout(function() {
					console.log("shutting down");
					powerRelay.open();
					eyesLed.off();
				}, 10000);
			}
		}
	});
});

function waitForInput() {
	return new Promise(function(resolve) {
		process.stdin.on("keypress", function(ch, key) {
			resolve()
		});
	});
}

function triggerDance(danceRelay) {
	console.log("It's time to dance");
	danceRelay.close();

	return Promise.delay(1000)
		.then(function() {
			console.log("disable signal pin");
			danceRelay.open();
		});
}

function terminate() {
	Promise.try(function() {
		eyesLed.off();
		powerRelay.open();
	})
	.delay(500)
	.then(function() {
		process.exit(0);
	})
}