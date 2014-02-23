FRAME_RATE = 60;
DEBUG = false;

// +----------------------------------------------------------------------------
// | KB
Keys = {
  ENTER: 13,
  ESCAPE: 27,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SHIFT: 16,
};

KB = {};
KB.keyDown_ = {};
KB.keyDownCounts_ = {};

KB.clear = function() {
  KB.keyDown_ = {};
  KB.keyDownCounts_ = {};
};

KB.keyPressed = function(chr) {
  return KB.keyDown(chr) == 1;
};

KB.NON_ASCII = {
  ',': 188,
  '.': 190,
  ';': 186,  // This is wrong for firefox, I believe.
  '[': 219,
  ']': 221,
};

KB.keyDown = function(chr) {
  if (typeof(chr) == 'string') {
    var code = chr.toUpperCase().charCodeAt(0);
    if ((code >= 48 && code <= 57) ||
        (code >= 65 && code <= 90)) {
      return KB.keyDownCounts_[code];
    } else {
      var mapped = KB.NON_ASCII[chr];
      if (mapped) {
        return KB.keyDownCounts_[mapped];
      } else {
        alert('Don\'t know key code for "' + chr + '"!');
        asdf;
      }
    }
  } else {
    return KB.keyDownCounts_[chr];
  }
};

KB.tickHandleInput_ = function() {
  for (var key in KB.keyDown_) {
    if (KB.keyDownCounts_[key]) {
      KB.keyDownCounts_[key]++;
    } else {
      KB.keyDownCounts_[key] = 1;
    }
  }
  for (var key in KB.keyDownCounts_) {
    if (!KB.keyDown_[key]) {
      KB.keyDownCounts_[key] = 0;
    }
  }
};

KB.onKeyDown = function(event) {
  if (event.keyCode == 77 /* m */ && event.ctrlKey) {
    //SND.mute();
    return false;
  }
  KB.keyDown_[event.keyCode] = true;
  if (event.keyCode < 112) {
    event.preventDefault();
    return false;
  }
};

KB.onKeyUp = function(event) {
  KB.keyDown_[event.keyCode] = false;
  if (event.keyCode < 112) {
    event.preventDefault();
    return false;
  }
};

// +----------------------------------------------------------------------------
// | MOUSE
MouseButtons = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
};

MOUSE = {};

MOUSE.lastPos_ = {x:0, y:0};
MOUSE.overElem_ = false;
MOUSE.buttonDown_ = {};
MOUSE.buttonDownCounts_ = {};

MOUSE.clear = function() {
  MOUSE.buttonDown_ = {};
  MOUSE.buttonDownCounts_ = {};
};

MOUSE.buttonPressed = function(button) {
  return MOUSE.buttonDown(button) == 1;
};

MOUSE.buttonDown = function(button) {
  return MOUSE.buttonDownCounts_[button];
};

MOUSE.lastPos = function() {
  return MOUSE.lastPos_;
};

MOUSE.isOver = function() {
  return MOUSE.overElem_;
};

MOUSE.tickHandleInput_ = function() {
  for (var button in MOUSE.buttonDown_) {
    if (MOUSE.buttonDownCounts_[button]) {
      MOUSE.buttonDownCounts_[button]++;
    } else {
      MOUSE.buttonDownCounts_[button] = 1;
    }
  }
  for (var button in MOUSE.buttonDownCounts_) {
    if (!MOUSE.buttonDown_[button]) {
      MOUSE.buttonDownCounts_[button] = 0;
    }
  }
};

MOUSE.onContextMenu = function(event) {
  event.preventDefault();
  return false;
};

MOUSE.onMouseDown = function(event) {
  MOUSE.buttonDown_[event.button] = true;
  MOUSE.lastPos_ = MOUSE.getPos_(event);
};

MOUSE.onMouseUp = function(event) {
  MOUSE.buttonDown_[event.button] = false;
  MOUSE.lastPos_ = MOUSE.getPos_(event);
};

MOUSE.onMouseMove = function(event) {
  MOUSE.lastPos_ = MOUSE.getPos_(event);
};

MOUSE.onMouseLeave = function(event) {
  MOUSE.overElem_ = false;
  MOUSE.lastPos_ = MOUSE.getPos_(event);
}
MOUSE.onMouseEnter = function(event) {
  MOUSE.overElem_ = true;
  MOUSE.lastPos_ = MOUSE.getPos_(event);
}

MOUSE.getPos_ = function(event) {
  var box = event.target.getBoundingClientRect();
  return {x: event.clientX - box.left, y: event.clientY - box.top};
};

// +----------------------------------------------------------------------------
// | Pidgine
Pidgine = {};

// Takes an object with these fields as a param:
//   elem: the Element to listen for key events on.
//   tick: a function of one argument that steps time forward by that amount.
//   render: a function that renders something.
Pidgine.run = function(gameStruct) {
  gameStruct.elem.addEventListener('keydown', KB.onKeyDown);
  gameStruct.elem.addEventListener('keyup', KB.onKeyUp);

  gameStruct.elem.addEventListener('contextmenu', MOUSE.onContextMenu);
  gameStruct.elem.addEventListener('mousedown', MOUSE.onMouseDown);
  gameStruct.elem.addEventListener('mouseup', MOUSE.onMouseUp);
  gameStruct.elem.addEventListener('mousemove', MOUSE.onMouseMove);
  gameStruct.elem.addEventListener('mouseleave', MOUSE.onMouseLeave);
  gameStruct.elem.addEventListener('mouseenter', MOUSE.onMouseEnter);
  var lastFrame = new Date().getTime();
  (function renderLoop() {
    var now = new Date().getTime();
    var numFrames = Math.floor((now - lastFrame) / (1000 / FRAME_RATE));
    lastFrame = lastFrame + numFrames * (1000 / FRAME_RATE);
    if (numFrames > 5) {
      numFrames = 1;
    }
    for (var i = 0; i < numFrames; i++) {
      KB.tickHandleInput_();
      MOUSE.tickHandleInput_();
      gameStruct.tick(1 / FRAME_RATE);
    }
    if (numFrames > 0) {
      gameStruct.render();
    }

    requestAnimationFrame(renderLoop);
  })();
};
