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
if (!Math.sign) {
  Math.sign = function(v) {
    return v < 0 ? -1 : (v > 0 ? 1 : 0);
  };
};

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

var ambientLight = new THREE.AmbientLight(0x888888);
//scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, -1, 1).normalize();
scene.add(directionalLight);

directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(-1, 1, 1).normalize();
scene.add(directionalLight);

Object3D.MANAGER = new Object3D.Manager(scene);

var PLAYER = new Ent(new THREE.Vector3(0, 0, 0))
  .addPart(new Actor(1, 5));

var ents = [PLAYER];

var ADD_ENT = function(e) {
  ents.push(e);
};

var LEVEL = new Ent(new THREE.Vector3())
  .addPart(new Level())
  .addPart(new Object3D(new THREE.Object3D()));
//  .addPart(new 
ADD_ENT(LEVEL);

Crawler.MANAGER = new Crawler.Manager(LEVEL.getPart(Level));

LEVEL.addChild(new Ent(new THREE.Vector3(0, 0, -50))
    .addPart(new Level.Side('-z', {
      left: '-x',
      up: 'y',
    }))
    .addPart(Object3D.newRectRenderer({
      r: 50,
      mtl: new THREE.MeshLambertMaterial({
        color: 0x888888,
      }),
    })));

LEVEL.addChild(
    new Ent(new Transform(
        new THREE.Vector3(0, 0, 50),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0), Math.PI)
    ))
    .addPart(new Level.Side('z', {
      left: 'x',
      up: 'y',
    }))
    .addPart(Object3D.newRectRenderer({
      r: 50,
      mtl: new THREE.MeshLambertMaterial({
        color: 0x888888,
      }),
    })));

LEVEL.addChild(
    new Ent(new Transform(
        new THREE.Vector3(-50, 0, 0),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), Math.PI / 2)
    ))
    .addPart(new Level.Side('-x', {
      left: 'z',
      up: 'y',
    }))
    .addPart(Object3D.newRectRenderer({
      r: 50,
      mtl: new THREE.MeshLambertMaterial({
        color: 0x888888,
      }),
    })));

LEVEL.addChild(
    new Ent(new Transform(
        new THREE.Vector3(50, 0, 0),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, -1, 0), Math.PI / 2)
    ))
    .addPart(new Level.Side('x', {
      left: '-z',
      up: 'y',
    }))
    .addPart(Object3D.newRectRenderer({
      r: 50,
      mtl: new THREE.MeshLambertMaterial({
        color: 0x888888,
      }),
    })));

LEVEL.addChild(
    new Ent(new Transform(
        new THREE.Vector3(0, 50, 0),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0), Math.PI / 2)
    ))
    .addPart(new Level.Side('y', {
      left: '-x',
      up: 'z',
    }))
    .addPart(Object3D.newRectRenderer({
      r: 50,
      mtl: new THREE.MeshLambertMaterial({
        color: 0x888888,
      }),
    })));

LEVEL.addChild(
    new Ent(new Transform(
        new THREE.Vector3(0, -50, 0),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0), Math.PI / -2)
    ))
    .addPart(new Level.Side('-y', {
      left: '-x',
      up: '-z',
    }))
    .addPart(Object3D.newRectRenderer({
      r: 50,
      mtl: new THREE.MeshLambertMaterial({
        color: 0x888888,
      }),
    })));

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

    var rotateAxis;
    if (KB.keyPressed('q')) {
      LEVEL.addChild(
          new Ent(new THREE.Vector3(0, 0, 0))
          .addPart(new Crawler)
          .addPart(Object3D.newCubeRenderer({
            r: 3,
            mtl: new THREE.MeshLambertMaterial({
              color: 0xf78731,
            }),
          })));
    }
    if (KB.keyPressed(Keys.LEFT) || KB.keyPressed('a')) {
      rotateAxis = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), Math.PI / 2);
    } else if (KB.keyPressed(Keys.RIGHT) || KB.keyPressed('d')) {
      rotateAxis = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    } else if (KB.keyPressed(Keys.UP) || KB.keyPressed('w')) {
      rotateAxis = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    } else if (KB.keyPressed(Keys.DOWN) || KB.keyPressed('s')) {
      rotateAxis = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0), Math.PI / 2);
    }
    if (rotateAxis) {
      LEVEL.getPart(Level).rotate(rotateAxis);
    }

    ents.forEach(function(e) { e && !e.dead && e.tick(t); });
    Object3D.MANAGER.tick(t);
    Crawler.MANAGER.tick(t);
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
