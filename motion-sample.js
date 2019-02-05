
//sample gestures

motion.updateGestures({
	//show the fake mouse pointer
	cursor:true,
	//enable motion control immediately
	on:true,
	//callback obj for hand, fake pointer, and gestures
	callback: {
		//callback for hand obj for the motion debug element
		handCallback: function(data){
			if(!!$('#some-element').length && !!$('#some-element').is('.show')){
				return {
					//what to display in the debug window
					debug: {"Currently": "Some Element"},
					//disable scrolling while this condition is true
					//-scrolling will be enabled again on the next frame unless it's disabled here
					disableScrolling: true
				};
			}//if
			return {debug: {}};
		},
		cursorCallback: function(data,hoverElement){
			//moves fake motion mouse pointer and toggles hover classes on the outline cells when the pointer hovers over them
			$('.hover-items.hover').removeClass('hover');

			//hoverElement is the element underneath the cursor
			hoverElement.addClass('hover');

			switch(true){
				//if this is a marked hover item, add the class
				case(hoverElement.is('.hover-items')):
					hoverElement.addClass('hover');
				break;
				//else find the closest hover-item to the hoverElement, which may be a child node of hoverElement
				default:
					hoverElement.closest('.hover-items').addClass('hover');
				break;
			}//switch
			return {debug: {}};
		},
		gestureCallback: function(handObj, gesture){	
			switch(true){
				//if:
					//-this is a swipe gesture
					//-and there are no tools and the palm is not up
					//--or it does have tools and the palm is up
					//-and it's not the main hand, or it is the main hand and there are tools
				case(gesture.extra.swipe && ((!motion.hasTools && !handObj.palm.up) || (motion.hasTools && handObj.palm.up))
					&& (!gesture.extra.isMainHand || (gesture.extra.isMainHand && motion.hasTools))):
					//do this
					switch(true){
						//if the body doesn't have some-class and it's a swipe to the right
						case(!$('body').hasClass('some-class') && gesture.extra.swipe == 'right'):
							//do something, like show an overlay
							$('body').addClass('some-class');
						break;
						//if the body does have some-class and it's a swipe to the left
						case( $('body').hasClass('some-class') && gesture.extra.swipe == 'left'):
							//do the opposite thing, like hide an overlay
						break;
					}//switch
				break;
				//keytap gesture for simulating click or whatever
				//if:
					//-this is a keytap gesture
					//-and the keytap gesture has completed
					//-and the palm is not up
					//-and this is the main hand
				case(gesture.state == 'stop' && gesture.type == 'keyTap' && !handObj.palm.up && gesture.extra.isMainHand):
					//do something, like simulate a click
					$('.some-class.hover').click();

					//set the lastGesture value to change what displays in the debug window
					motion.lastGesture = 'keyTap something';
				break;
			}//switch
			return {debug: {}};
		}
	}
});//updateGestures