
//***Requires a Leap Motion controller and the Leap JS library (0.6.4 included)
// https://www.leapmotion.com/

/*optional: the included motion.css file, which provides default styles for the debug element*/

var MotionControl = function() {
	var motion = this;

	this.enabled = false; //tracking enabled/disabled
	this.frameString = ''; //something
	this.paused = true; //if tracking is paused
	this.pauseOnGesture = false; //pause tracking on gesture
	this.controller = null; //reference to controller
	this.gestureObj = {}; //obj for gesture callbacks
	this.lastKey = 0; //stores the last key
	this.lastGesture = ''; //stores the last gesture
	this.cursor = ''; //motion cursor reference
	this.callback = {}; //callback storage
	this.handObj = {}; //obj for storing hand date from controller
	this.sensorLeft = true; //left handed
	this.isPreinit = false; //preinit has fired
	this.palm = ''; //palm reference from controller
	this.options = {}; //passed options
	
	this.initMotion = function(options){
		
		//if options are sent, run updateGestures, else store the options (which are stored in updateGestures)
		if(typeof(options) == 'object'){
			motion.updateGestures(options);
		} else {
			motion._options = options;
		}//if
		//call resize to update the location of the motion cursor pointer
		$(window).resize();
		
		//assign default event handlers
		motion.eventHandlers(true);
		
	};//func

	this.eventHandlers = function(opt){
		//can add others
		//motion.controller.on('deviceAttached', onAttached);
		//to remove all handlers
		//motion.controller.off();

		//on every frame, fire the frameHandler
		motion.controller.on('frame',motion.frameHandler);
		//on every gesture, fire the gestureControl
		motion.controller.on('gesture', motion.gestureControl);
		//when the device is connected, it starts streaming, so this fires when the device is connected, or when streaming otherwise starts after being stopped
		motion.controller.on('deviceStreaming',function(){
			//if the cursor is enabled but not on the screen yet, add the class to the cursor element
			(motion.gestureObj['cursor'] && !motion.cursor.hasClass('enabled')) ?
				motion.cursor.addClass('enabled') : '';
		});
		//when the device is removed, hide the cursor
		motion.controller.on('deviceRemoved',function(){
			motion.cursor.removeClass('enabled');
		});
		
	};//func

	this.frameHandler = function(frame){	
		//motion.controller = Leap.loop(controllerOptions, function(frame) {
			//if the controller has been paused or the document is not focused, do nothing
			if (motion.paused || !document.hasFocus()) {
				return;
			}//if
			
			//store this as the previous frame if there is not one yet
			if(!motion.prevFrame){
				motion.prevFrame = frame;
			}//if
			//store this frame
			motion.thisFrame = frame;
			//reset debug string
			motion.frameString = '';

			//reference to the debug window
			var frameOutput = document.getElementById('frameData');
			
			//interaction box
			var iBox = frame.interactionBox;
			motion.interactionbox = iBox;
			//fingers obj
			motion.framefingers = frame.fingers;
			//-extended fingers have extended:true
			//--0 thumb
			//--1 index
			//--2 middle
			//--3 ring
			//--4 pinky
			
			//update the debug box with debug data
			motion.updateDebug({
				'Frame ID': frame.id,
				'Timestamp': frame.timestamp,
				'iBox wxh': iBox.width + ' x ' + iBox.height,
				'Hands': frame.hands.length,
				'Fingers': [...frame.fingers.filter(d => d.extended)].length,
				'Tools': frame.tools.length,
				'Gestures': frame.gestures.length,
				"-Pinch str": ((frame.hands.length) ? frame.hands[0].pinchStrength : 'none'),
				"-Grab str": ((frame.hands.length) ? frame.hands[0].grabStrength : 'none')
			});
			
			//if there are hands in this frame
			motion.hasHands = (frame.hands.length > 0);
			//if there are tools in this frame
			motion.hasTools = (frame.tools.length > 0);
			//if the previous frame had hands
			motion.pHasHands = (motion.prevFrame.hands.length > 0);
			//if the previous frame had tools
			motion.pHasTools = (motion.prevFrame.tools.length > 0);

			//if the document is focused and there are either hands or tools in the frame, process
			if((motion.hasHands || motion.hasTools) && document.hasFocus()) { 
				//if there weren't hands in the last frame but there are in this one, store these hands as the previous ones
				if(!motion.pHasHands && motion.hasHands){
					motion.prevFrame.hands = frame.hands;
				}//if
				//if there weren't tools in the last frame but there are in this one, store these tools as the previous ones
				if(!motion.pHasTools && motion.hasTools){
					motion.prevFrame.tools = frame.tools;
				}//if
				//obj for hand data
				motion.handObj = {};
				//current hand
				motion.handObj.hands = {};
				//previous hand
				motion.handObj.pHands = {};

				//if there are hands
				if(motion.hasHands){
					//go through the current hands and store them
					frame.hands.every(function(v,i,a){
						motion.handObj.hands[v.type] = v;
					});
					//go through the previous hands and store them
					motion.prevFrame.hands.every(function(v,i,a){
						motion.handObj.pHands[v.type] = v;
					});
					//set the current left and right hands
					motion.handObj.leftHand = motion.handObj.hands.left;
					motion.handObj.rightHand = motion.handObj.hands.right;
					//set the previous left and right hands
					motion.handObj.pLeftHand = motion.handObj.pHands.left;
					motion.handObj.pRightHand = motion.handObj.pHands.right;

					//if the main hand is the left
					if(motion.sensorLeft){
						motion.handObj.mainHand = motion.handObj.leftHand;
						motion.handObj.pMainHand = motion.handObj.pLeftHand;
						motion.handObj.otherHand = motion.handObj.rightHand;
						motion.handObj.pOtherHand = motion.handObj.pRightHand;
					} else {
						//else it's the right
						motion.handObj.mainHand = motion.handObj.rightHand;
						motion.handObj.pMainHand = motion.handObj.pRightHand;
						motion.handObj.otherHand = motion.handObj.leftHand;
						motion.handObj.pOtherHand = motion.handObj.pLeftHand;
					}//if
					
					//get palm data
					//-sometimes an error gets thrown here using the main hand
					try{
						(!motion.handObj.pMainHand) ? motion.handObj.pMainHand = motion.handObj.mainHand : '';
						motion.handObj.leapPoint = motion.handObj.mainHand.stabilizedPalmPosition;
						motion.handObj.pLeapPoint = motion.handObj.pMainHand.stabilizedPalmPosition;
						
						motion.handObj.palm = {
							up: (motion.handObj.mainHand.palmNormal[1] >= 0),
							down: (motion.handObj.mainHand.palmNormal[1] < 0)
						};
					} catch(e){
						//handle the error by using the other hand
						(!motion.handObj.pOtherHand) ? motion.handObj.pOtherHand = motion.handObj.otherHand : '';
						motion.handObj.leapPoint = motion.handObj.otherHand.stabilizedPalmPosition;
						motion.handObj.pLeapPoint = motion.handObj.pOtherHand.stabilizedPalmPosition;
						
						motion.handObj.palm = {
							up: (motion.handObj.otherHand.palmNormal[1] >= 0),
							down: (motion.handObj.otherHand.palmNormal[1] < 0)
						};
					};

					//calculate the hand location
					motion.handObj.normalizedPoint = iBox.normalizePoint(motion.handObj.leapPoint, false);
					motion.handObj.pNormalizedPoint = iBox.normalizePoint(motion.handObj.pLeapPoint, false);

					//translate into a 2D position on the screen
					motion.handObj.appX = motion.handObj.normalizedPoint[0] * motion.appWidth;
					//make the height taller to impact sensitivity
					motion.handObj.appY = (((2 - motion.handObj.normalizedPoint[1])/2) * motion.appHeight);
					
					motion.handObj.cY = motion.appHeight - motion.handObj.normalizedPoint[1] * motion.appHeight;
					motion.handObj.pcY = motion.appHeight - motion.handObj.pNormalizedPoint[1] * motion.appHeight;

					motion.handObj.sensorLeft = motion.sensorLeft;

					/* ------ debug stuff ---------- */
					motion.updateDebug({
						'Palm UP': motion.handObj.palm.up,
						'Main Hand': !!motion.handObj.mainHand,
						//'App X': motion.handObj.appX,
						//'App Y': motion.handObj.appY
					});
					/* ------ end debug stuff ---------- */

					//store the palm
					motion.palm = motion.handObj.palm;
					
					//obj for storing the hands
					var handCallbackObj = {};
					//if there are hand callbacks
					if(motion.callback.handCallback){
						//call the hand callback
						handCallbackObj = motion.callback.handCallback(motion.handObj);
						//update debug if necessary
						(handCallbackObj && handCallbackObj.debug && typeof(handCallbackObj.debug) == 'object') ? 
							motion.updateDebug(handCallbackObj.debug) : '';
					}//if

					//if:
						//-scrolling callback is defined
						//-scrolling is not disabled
						//-the palm is facing up
						//-it's the main hand
						//-the fist is at least 50% closed
						//-there are not any tools in the frame
					//then scroll the window
					if(motion.gestureObj['scroll'] && !handCallbackObj.disableScrolling && motion.handObj.palm.up 
						&& motion.handObj.mainHand && motion.handObj.mainHand.grabStrength > 0.5 && !motion.hasTools) {
						//this calculation determines how sensitive scrolling is
						//TODO: move the sensitivity to the config obj
						window.scrollTo(0, window.scrollY + (((motion.handObj.pcY - motion.handObj.cY) / 1400) * $(document).height()));
						
						motion.updateDebug({'Hand Currently':'Scrolling'});
					} else {
						motion.updateDebug({'Hand Currently':((!motion.hasTools) ? 'Hand cursor' : 'Nothing')});
					}//if
				} else {
					//else there are no hands
					motion.handObj.palm = {
						up: false,
						down: false
					};
					motion.updateDebug({
						'Palm UP': 'none',
						'Main Hand': 'none',
						'Hand Currently':'Nothing'
					});
				}//if
				
				//if there are tools
				if(motion.hasTools){
					//store the tool data
					motion.toolObj = {
						mainTool: frame.tools[0],
						pMainTool: motion.prevFrame.tools[0]
					};
					//use only the first tool
					//-a second cursor for a second tool could be added, but why?

					//store the current and previous frame tool data
					motion.toolObj.leapPoint = motion.toolObj.mainTool.stabilizedTipPosition;
					motion.toolObj.pLeapPoint = motion.toolObj.pMainTool.stabilizedTipPosition;

					motion.toolObj.normalizedPoint = iBox.normalizePoint(motion.toolObj.leapPoint, false);
					motion.toolObj.pNormalizedPoint = iBox.normalizePoint(motion.toolObj.pLeapPoint, false);

					motion.toolObj.appX = motion.toolObj.normalizedPoint[0] * motion.appWidth;
					motion.toolObj.appY = ((1 - motion.toolObj.normalizedPoint[1]) * motion.appHeight);// + $(window).scrollTop();

					motion.toolObj.cY = motion.appHeight - motion.toolObj.normalizedPoint[1] * motion.appHeight;
					motion.toolObj.pcY = motion.appHeight - motion.toolObj.pNormalizedPoint[1] * motion.appHeight;

					motion.updateDebug({
						'Tool Currently':'Tool cursor',
						'App X': motion.toolObj.appX,
						'App Y': motion.toolObj.appY
					});
					motion.cursorObj = motion.toolObj;
				} else {
					motion.updateDebug({
						'Tool Currently':'Nothing',
						'App X': motion.handObj.appX,
						'App Y': motion.handObj.appY
					});
					motion.cursorObj = motion.handObj;
				}//if

				//TODO: need to be able to specify which corner to use as the pointer and then check for that here
				//-using top right for now, add 1 pixel so that the cursor itself is not picked up as the keytap element
				motion.cursorObj.clickX = motion.cursorObj.appX + motion.cursor._width + 1;
				motion.cursorObj.clickY = motion.cursorObj.appY;

				var cursorCallbackObj = {};

				//if:
					//-there is cursor callback
					//-there are hands in the frame and the palm is down and it's the main hand
					//-or there are tools
				//move the cursor
				if(motion.gestureObj['cursor'] && (motion.hasHands && !motion.handObj.palm.up && motion.handObj.mainHand)
					|| motion.hasTools) {
					//get the element under the cursor
					var hoverElement = $(document.elementFromPoint(motion.cursorObj.appX, motion.cursorObj.appY)),
						//if this is hovering over an element market with the ext-motion-element-hover class
						isHover = hoverElement.hasClass('ext-motion-element-hover') || hoverElement.closest('.ext-motion-element').hasClass('ext-motion-element-hover');
					//if we are hovering over a different element than the previous one and it's not the cursor itself
					if(motion.lastHover != hoverElement && !hoverElement.hasClass('ext-motion-cursor')){
						//store the element
						motion.cursorSelector = hoverElement;
						//if there are callbacks
						if(motion.callback.cursorCallback){
							//fire the callback
							cursorCallbackObj = motion.callback.cursorCallback(motion.cursorObj, hoverElement, isHover);
							//update debug if necessary
							(cursorCallbackObj && cursorCallbackObj.debug && typeof(cursorCallbackObj.debug) == 'object') ? 
								motion.updateDebug(cursorCallbackObj.debug) : '';
						}//if
						//store this as the previous hovered element
						motion.lastHover = hoverElement;
					}//if
					//constrain to window size, don't let it go off the edges
					motion.cursor.css({
						top: Math.min(motion.cursorObj.appY,window.outerHeight-(motion.cursor._height * 2))+'px',
						left: Math.min(motion.cursorObj.appX,window.outerWidth-(motion.cursor._width * 2))+'px'
					});

				}//if
			} else {
				//else there are no tools, update debug
				motion.updateDebug({
					'Palm UP': '',
					'Left Hand': '',
					'App X': '',
					'App Y': ''
				});
			}//if
			
			//check for valid prev frame and update debug with more data
			if(motion.prevFrame && motion.prevFrame.valid) {
				var translation = frame.translation(motion.prevFrame),
					rotationAxis = frame.rotationAxis(motion.prevFrame),
					rotationAngle = frame.rotationAngle(motion.prevFrame),
					scaleFactor = frame.scaleFactor(motion.prevFrame);

				motion.updateDebug({
					'Translation': vectorToString(translation),
					'Rotation axis': vectorToString(rotationAxis, 2),
					'Rotation angle': rotationAngle.toFixed(2),
					'Scale factor': scaleFactor.toFixed(2),
					'Gesture': motion.lastGesture
				});
			}//if
			//if there are hands or tools, update the debug element
			if(motion.hasHands || motion.hasTools){
				frameOutput.innerHTML = "<div style='width:99%; padding:5px'>" + motion.frameString + "</div>";
			}//if
			
			// Store frame for motion functions
			motion.prevFrame = frame;
		//});
		
	}//func

	//take debug strings and put them together
	this.updateDebug = function(obj){
		if(typeof(obj) == 'object'){
			$.each(obj, function(i,v){
				motion.frameString += (i+': '+v+'<br />');
			});
		}//if
	}//func

	//reinit the cursor hover elements for when the page is updated
	this.initHoverElements = function(reinit){
		if(typeof(motion.gestureObj.cursor) == 'object'){
			if(reinit){
				$('.ext-motion-element').removeClass('ext-motion-element').removeClass('dual');
				$('.ext-motion-element-target').removeClass('ext-motion-element-target');
			}//if
			$.each(motion.gestureObj.cursor.hoverElements, function(i,v){
				v.addClass('ext-motion-element');
			});
			$.each(motion.gestureObj.cursor.targetElements, function(i,v){
				(v.hasClass('ext-motion-element')) ?
					v.addClass('dual') : '';
				v.addClass('ext-motion-element-target');
			});
		}//if
	}//func

	//set the gesture callbacks
	this.updateGestures = function(options, remove){
		motion._options = options;
		
		//run preInit: should only be run once or twice
		if(!motion.isPreinit){
			motion.preInit();
		}//if
		//start tracking if not already
		if(options && options.on && !motion.enabled){
			motion.togglePause();
		}//if
		//show the debug window by default if specified
		if(options && !!options.showDebug){
			motion.toggleStats();
		}//if

		switch(true){
			//if this callback should be removed
			case(typeof(options) == 'object' && remove):
				$.each(options, function(i,v){
					delete motion.gestureObj[i];
				});
			break;
			//if the callback should be added
			case(typeof(options) == 'object' && !remove):
				$.each(options, function(i,v){
					motion.gestureObj[i] = v;
				});
				//store the hover elements
				motion.initHoverElements(false);
				//store callback and fire initCallback if specified
				if(typeof(options.callback) == 'object'){
					$.each(options.callback, function(i,v){
						(typeof(v) == 'function') ? 
							motion.callback[i] = v : '';
					});
					(typeof(options.callback.initCallback) == 'function') ?
						options.callback.initCallback() : '';
				}//if
			break;
			//if the callback should be removed and options is not an obj
			case(remove):
				delete motion.gestureObj[options];
			break;
			//if the callback should be added and options is not an obj, store true
			case(!remove):
				motion.gestureObj[options] = true;
			break;
		}//switch
		
	};//func

	//switch between left and right
	this.flipHands = function(){
		motion.sensorLeft = !motion.sensorLeft;
		//change button label
		motion.debug.flip.val(((/LT/i).test(motion.debug.flip.val()) && '-> RT') || '-> LT');
	};//func
	
	//fires gesture callbacks
	this.gestureControl = function(gesture){
		//if the controller has been paused or the document is not focused, do nothing
		if (motion.paused || !document.hasFocus()) {
			return;
		}//if
		
		//store last gesture
		motion.lastGesture = gesture.type;
		motion.lastGestureObj = gesture;
		
		//extra data
		gesture.extra = {};
		gesture.extra.isMainHand = (motion.thisFrame.hand(gesture.handIds[0]) == motion.handObj.mainHand);
		
		//fire the gesture callback if there are any and the document is focused
		var gestureCallbackObj = {};
		if(motion.callback.gestureCallback && document.hasFocus()){
			//fire gesture callback
			gestureCallbackObj = motion.callback.gestureCallback(motion.handObj, gesture);
			//update the debug element
			(gestureCallbackObj && gestureCallbackObj.debug && typeof(gestureCallbackObj.debug) == 'object') ? 
				motion.updateDebug(gestureCallbackObj.debug) : '';
		}//if

	};//func
	
	//convert the vector to a string for the debug window
	var vectorToString = function(vector, digits) {
	  if (typeof digits === 'undefined') {
		digits = 1;
	  }
	  return '(' + vector[0].toFixed(digits) + ', '
				 + vector[1].toFixed(digits) + ', '
				 + vector[2].toFixed(digits) + ')';
	};

	//start/stop the motion tracking
	this.togglePause = function(ev) {
		if(!motion.enabled){
			motion.enabled = true;
			motion.initMotion({'scroll':true,'navigator':true});
		}//if
		
		motion.paused = !motion.paused;
		if (motion.paused) {
			(motion.controller.connected()) ? motion.controller.disconnect() : '';
			motion.debug.pause.val('ON');
		} else {
			(!motion.controller.connected()) ? motion.controller.connect() : '';
			#motion.debug.pause.val('OFF');
		}
	}; //func

	//show/hide the debug window
	this.toggleStats = function(close){
		if(close){
			motion.debugContainer.removeClass('open');
		} else {
			motion.debugContainer.toggleClass('open');
		}//if
	};//func

	//set pause on gestures
	//-this button has been removed
	this.pauseForGestures = function() {
		if(document.getElementById('pauseOnGesture').checked){
			motion.pausedOnGesture = true;
		} else {
			motion.pausedOnGesture = false;
		}//if
	};//func

	//get ready to run init
	this.preInit = function(enable){
		//run once
		if(!motion.isPreInit){
			motion.isPreInit = true;
			
			//create the connection to the web socket
			motion.controller = new Leap.Controller({enableGestures: true, frameEventName:'deviceFrame'});
			
			//add the debug container
			motion.debugContainer = $('<div class="motion-debug-container">'
					+'<input type="button" id="motion-debug-mclose" value="X">'
					+'<input type="button" id="motion-debug-pause" value="ON">'
					+'<input type="button" id="motion-debug-flip" value="-> RT">'
					+'<div id="frameData"></div>'
				+'</div>')
				.appendTo($('body'));
			
			//set click events for buttons
			motion.debug = {
				pause: $('#motion-debug-pause').click(motion.togglePause),
				flip: $('#motion-debug-flip').click(motion.flipHands),
				close: $('#motion-debug-mclose').click(motion.toggleStats)
			};
			
			//motion cursor pointer svg
			motion.cursor = 
				$('<svg class="ext-motion-cursor" version="1.0" xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 16.000000 16.000000" preserveAspectRatio="xMidYMid meet"><g transform="translate(0.000000,16.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none"><path d="M215 345 c-230 -119 -240 -131 -135 -152 36 -7 74 -15 86 -18 17 -4 26 -22 44 -85 17 -59 27 -80 39 -80 12 0 40 56 103 208 76 185 90 233 69 232 -3 0 -96 -47 -206 -105z m100 -112 c-32 -76 -59 -139 -60 -141 -2 -2 -11 23 -22 55 l-18 58 -64 14 c-41 8 -59 16 -50 21 109 60 264 138 267 135 2 -2 -22 -66 -53 -142z"/></g></svg>');
			
			//add the cursor to the body
			motion.cursor.prependTo('body');
			
			//store width and height
			motion.cursor._width = motion.cursor.width();
			motion.cursor._height = motion.cursor.height();

			//keyboard shortcut to show/hide the debug window
			//-hit ctrl three times
			$('body').keyup(function(e){
				//store last key count if it is not ctrl
				(e.which != 17) ? motion.lastKey = 0 : '';

				switch(true){
					//if this is ctrl, increment the counter
					case(e.which == 17):
						motion.lastKey++;
						//if this is the third consecutive press of ctrl, toggle the debug window
						if(motion.lastKey == 3){
							motion.toggleStats();
							//reset counter
							motion.lastKey = 0;
						}//if
					break;
					//if this is ctrl + m, click pause
					case(e.ctrlKey && e.which == 77):
						motion.debug.pause.click();
					break;
					default:
						//do nothing
					break;
				}//switch
			});

			//adjust the height for the motion pointer container
			$(window).resize(function(){
				motion.appHeight = window.outerHeight;
				motion.appWidth = window.outerWidth;
			});
			//if enable is set, toggle pause, which will unpause
			(enable) ? motion.togglePause() : '';
		}//if ispreinit
	}//func
};//func

//create global reference to motion control function
var motion = new MotionControl();
//also store on window obj
window.__motion = motion;

//fire preinit
motion.preInit(true);
