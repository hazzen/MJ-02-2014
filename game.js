//(function(exports) {
EPSILON = 1e-12;
PAUSED = false;

if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(cb, thisArg) {
    for (var i = 0; i < this.length; i++) {
      if (cb.call(thisArg, this[i], i, this)) {
        return i;
      }
    }
    return -1;
  };
}

var WIDTH = 640;
var HEIGHT = 640;
var camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
camera.position.z = 100;
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.updateProjectionMatrix();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff, 1);
renderer.setSize(WIDTH, HEIGHT);
renderer.domElement.setAttribute('tabindex', 0);
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();

var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
hemiLight.color.setHSL(0.6, 1, 0.6);
hemiLight.groundColor.setHSL(0.095, 1, 0.75);
hemiLight.position.set(0, 500, 0);
scene.add(hemiLight);

Object3D.MANAGER = new Object3D.Manager(scene);

var PLAYER = new Ent(new THREE.Vector3(0, 0, 0))
  .addPart(new Actor(1, 5))
  .addPart(RectRenderer({
    r: 1 * 1.8 / 2,
    mtl: new THREE.MeshBasicMaterial({color: 0x888888}),
  }));

var ents = [PLAYER];

var ADD_ENT = function(e) {
  ents.push(e);
};

var LEVEL = new Ent(new THREE.Vector3())
  .addPart(new Level())
  .addPart(new Object3D(new THREE.Object3D()));
//  .addPart(new 
ADD_ENT(LEVEL);

LEVEL.addChild(new Ent(new THREE.Vector3(0, 0, -50))
    .addPart(RectRenderer({
      r: 50,
      mtl: new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        color: 0xff0000
      }),
    })));

LEVEL.addChild(
    new Ent(new Transform(
        new THREE.Vector3(0, 0, 50),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0), Math.PI)
    ))
    .addPart(RectRenderer({
      r: 50,
      mtl: new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        color: 0xff0000
      }),
    })));

LEVEL.addChild(
    new Ent(new Transform(
        new THREE.Vector3(-50, 0, 0),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), Math.PI / 2)
    ))
    .addPart(RectRenderer({
      r: 50,
      mtl: new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        color: 0xff0000
      }),
    })));

LEVEL.addChild(
    new Ent(new Transform(
        new THREE.Vector3(50, 0, 0),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), Math.PI / -2)
    ))
    .addPart(RectRenderer({
      r: 50,
      mtl: new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        color: 0xff0000
      }),
    })));

LEVEL.addChild(
    new Ent(new Transform(
        new THREE.Vector3(0, 50, 0),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0), Math.PI / 2)
    ))
    .addPart(RectRenderer({
      r: 50,
      mtl: new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        color: 0x00ff00,
      }),
    })));

LEVEL.addChild(
    new Ent(new Transform(
        new THREE.Vector3(0, -50, 0),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0), Math.PI / -2)
    ))
    .addPart(RectRenderer({
      r: 50,
      mtl: new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.5,
        color: 0x00ff00,
      }),
    })));

ROTATE = null;

Pidgine.run({
  elem: renderer.domElement,
  tick: function(t) {
    if (KB.keyPressed('P')) {
      PAUSED = !PAUSED;
    }
    if (PAUSED && !KB.keyPressed(']')) return;

    if (MOUSE.isOver()) {
      var lp = MOUSE.lastPos();
      var p = new THREE.Vector3(
        lp.x / WIDTH * 2 - 1, -lp.y / HEIGHT * 2 + 1, 1);
      var proj = new THREE.Projector();
      proj.unprojectVector(p, camera);
      p.sub(camera.position).normalize();
      p.x = camera.position.x + p.x * camera.position.z / -p.z;
      p.y = camera.position.y + p.y * camera.position.z / -p.z;
    }

    if (MOUSE.buttonPressed(MouseButtons.LEFT)) {
    }

    if (ROTATE) {
      ROTATE.t -= t;
      LEVEL.transform.rotation.copy(ROTATE.cur);
      LEVEL.transform.rotation.slerp(ROTATE.axis, Math.min(1, 1 - ROTATE.t));
      if (ROTATE.t <= 0) {
        ROTATE = null;
      }
    } else {
      if (KB.keyPressed(Keys.LEFT)) {
        ROTATE = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), Math.PI / 2);
      } else if (KB.keyPressed(Keys.RIGHT)) {
        ROTATE = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), -Math.PI / 2);
      } else if (KB.keyPressed(Keys.UP)) {
        ROTATE = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      } else if (KB.keyPressed(Keys.DOWN)) {
        ROTATE = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0), Math.PI / 2);
      }
      if (ROTATE) {
        ROTATE = {axis: ROTATE.multiply(LEVEL.transform.rotation), t: 1, cur: LEVEL.transform.rotation.clone()};
      }
    }

    ents.forEach(function(e) { e && !e.dead && e.tick(t); });
    Object3D.MANAGER.tick(t);
    for (var i = 0; i < ents.length; i++) {
      var ent = ents[i];
      if (ent) {
        if (ent.dead) {
          ent.disposeNow();
          ents[i] = null;
        }
      }
    }
  },
  render: function() {
    var playerPos = PLAYER.transform.position;

    renderer.render(scene, camera);
  },
});

//})(window);
