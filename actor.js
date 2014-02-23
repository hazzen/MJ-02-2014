(function(exports) {

var Transform = function(position, opt_rotation) {
  this.proxy_ = null;
  this.position = position;
  this.rotation = opt_rotation || new THREE.Quaternion();
  this.globalRotation_ = this.rotation.clone();
  this.globalPosition_ = this.position.clone();
  this.parent = null;
  this.children = [];
};
Transform.type = 'Transform';

Transform.prototype.setProxy = function(p) {
  this.proxy_ = p;
  p.position.copy(this.position);
  p.quaternion.copy(this.rotation);
  this.position = p.position;
  this.rotation = p.quaternion;
};

Transform.prototype.setEnt = function(e) {
  e.transform = this;
  this.ent = e;
};

Transform.prototype.addChild = function(t) {
  if (t.proxy_ && t.proxy_.parent) {
    t.proxy_.parent.remove(t.proxy_);
  } else if (t.parent) {
    t.parent.removeChild(t);
  }
  if (t.proxy_) {
    this.proxy_.add(t.proxy_);
  } else {
    t.parent = this;
  }
  this.children.push(t);
};

Transform.prototype.removeChild = function(t) {
  var index = this.children.indexOf(t);
  if (index == -1) {
    throw 'Removing child that is not mine!';
  }
  this.children.splice(index, 1);
  t.parent = null;
};

Transform.prototype.globalRotation = function() {
  if (this.proxy_) {
    this.globalRotation_.setFromRotationMatrix(this.proxy_.matrixWorld);
    return this.globalRotation_;
  } else if (this.parent) {
    this.globalRotation_.copy(this.rotation);
    var parent = this.parent;
    while (parent) {
      this.globalRotation_.multiplyQuaternions(
          parent.rotation, this.globalRotation_);
      parent = parent.parent;
    }
    return this.globalRotation_;
  } else {
    return this.rotation;
  }
};

Transform.prototype.globalPosition = function() {
  if (this.proxy_) {
    this.globalPosition_.setFromMatrixPosition(this.proxy_.matrixWorld);
    return this.globalPosition_;
  } else if (this.parent) {
    this.globalPosition_.x = this.position.x;
    this.globalPosition_.y = this.position.y;
    var parent = this.parent;
    while (parent) {
      this.globalPosition_.x += parent.position.x;
      this.globalPosition_.y += parent.position.y;
      parent = parent.parent;
    }
    return this.globalPosition_;
  } else {
    return this.position;
  }
};

var Crawler = function() {
  this.side_ = null;
  this.speed = Math.random() * 20 + 20;
};
Crawler.type = 'Crawler';

Crawler.prototype.setEnt = function(e) {
  this.ent = e;
};

Crawler.Manager = function(level) {
  this.level = level;
  this.crawlers = [];
  this.lastBack = null;
};

Crawler.Manager.prototype.addEnt = function(ent) {
  this.crawlers.push(ent.getPart(Crawler));

  var back = this.lastBack.getPart(Level.Side);
  var along = back.along.clone();
  along.x *= Math.random() * 50 - 25;
  along.y *= Math.random() * 50 - 25;
  along.z *= Math.random() * 50 - 25;
  ent.transform.position.copy(back.ent.transform.position);
  ent.transform.position.add(along);
  ent.getPart(Crawler).side_ = back;
};

Crawler.Manager.prototype.removeEnt = function(ent) {
  var crawler = ent.getPart(Object3D);
  var index = this.crawlers.indexOf(crawler);
  if (index == -1) {
    throw 'BAD!';
  }
  this.crawlers.splice(index, 1);
};


Crawler.Manager.prototype.tick = function(t) {
  var back = this.level.getBack();
  if (back) {
    this.lastBack = back;
  }
  if (!this.lastBack) return;
  back = this.lastBack.getPart(Level.Side);
  var front = this.level.getSideWithDir(back.opposite);
  var frontGlobal = front.ent.transform.globalPosition();

  for (var i = 0; i < this.crawlers.length; i++) {
    var crawler = this.crawlers[i];
    var toFrontGlobal = new THREE.Vector3().subVectors(
        crawler.ent.transform.globalPosition(),
        frontGlobal);
    var toFront = new THREE.Vector3().subVectors(
        front.ent.transform.position,
        crawler.ent.transform.position);
    var along = crawler.side_.along;
    for (var nb in crawler.side_.neighbours_) {
      var dir = crawler.side_.neighbours_[nb];
      if (dir == back.opposite) {
        along = crawler.side_.along;
        break;
      }
    }
    if (nb == 'opposite') {
      toFront.multiplyScalar(-1);
    }
    if (!along.x) {
      toFront.x = 0;
    }
    if (!along.y) {
      toFront.y = 0;
    }
    if (!along.z) {
      toFront.z = 0;
    }
    toFront.setLength(crawler.speed * t);
    crawler.ent.transform.position.add(toFront);
    var pos = crawler.ent.transform.position;

    var doDir = function(d) {
      if (toFront[d]) {
        if (Math.abs(pos[d]) > 50) {
          pos[d] = Math.sign(pos[d]) * 50;
          crawler.side_ = this.level.getSideWithDir(pos[d] > 0 ? d : ('-' + d));
        }
      }
    }.bind(this);
    doDir('x');
    doDir('y');
    doDir('z');
  }
};

var Level = function() {
  this.rotate_ = null;
};
Level.type = 'Level';

Level.prototype.setEnt = function(e) {
  this.ent = e;
};

Level.prototype.getSideWithDir = function(d) {
  for (var i = 0; i < this.ent.transform.children.length; i++) {
    var side = this.ent.transform.children[i].ent.getPart(Level.Side);
    if (side.dir == d) {
      return side;
    }
  }
};

Level.prototype.getBack = function() {
  if (this.rotate_) return null;
  var back = new THREE.Vector3(0, 0, -50);
  for (var i = 0; i < this.ent.transform.children.length; i++) {
    var child = this.ent.transform.children[i];
    var pos = child.globalPosition();
    var d = Math.abs(pos.x - back.x) +
            Math.abs(pos.y - back.y) +
            Math.abs(pos.z - back.z);
    if (d < EPSILON) {
      return child.ent;
    }
  }
  return null;
};

Level.prototype.rotate = function(axis) {
  if (this.rotate_) return;
  this.rotate_ = {
    axis: new THREE.Quaternion().multiplyQuaternions(axis, this.ent.transform.rotation),
    cur: this.ent.transform.rotation.clone(),
    t: 1,
  };
  //this.getBack().getPart(Object3D).obj.material.color = 0xffffff;
};

Level.prototype.tick = function(t) {
  if (this.rotate_) {
    var rot = this.rotate_;
    rot.t -= t;
    this.ent.transform.rotation.copy(rot.cur);
    this.ent.transform.rotation.slerp(rot.axis, Math.min(1, 1 - rot.t));
    if (rot.t <= 0) {
      this.rotate_ = null;
      //this.getBack().getPart(Object3D).obj.material.color = 0xff0000;
    }
  }
};

Level.Side = function(dir, alongs) {
  this.dir = dir;
  this.neighbours_ = [];
  this.along = new THREE.Vector3(0, 0, 0);

  var handleDir = function(d, vec) {
    var v = 1;
    if (d[0] == '-') {
      v = -1;
      d = d.substr(1);
    }
    if (d == 'x') {
      vec.x = v;
    } else if (d == 'y') {
      vec.y = v;
    } else {
      vec.z = v;
    }
    return vec;
  };
  handleDir(alongs.left, this.along);
  handleDir(alongs.up, this.along);

  var opposite = function(d) {
    if (d[0] == '-') {
      return d.substr(1);
    } else {
      return '-' + d;
    }
  };

  this.neighbours_.left = alongs.left;
  this.neighbours_.right = opposite(alongs.left);
  this.neighbours_.up = alongs.up;
  this.neighbours_.down = opposite(alongs.up);
  this.neighbours_.opposite = opposite(this.dir);

  this.neighbourDs_ = {};
  for (var nb in this.neighbours_) {
    var dir = this.neighbours_[nb];
    var v = new THREE.Vector3();
    handleDir(dir, v);
    this.neighbourDs_[nb] = v;
  }
  this.neighbourDs_.opposite.copy(this.along);
  this.opposite = this.neighbours_.opposite;

  this.occupants = [];
};
Level.Side.type = 'Level.Side';

Level.Side.prototype.setEnt = function(e) {
  this.ent = e;
  if (e.transform.position.x) {
    this.along.x = 0;
  } else if (e.transform.position.y) {
    this.along.y = 0;
  } else if (e.transform.position.z) {
    this.along.z = 0;
  }
};

var Actor = function() {
};
Actor.type = 'Actor';

Actor.prototype.setEnt = function(e) {
  this.ent = e;
};

Actor.prototype.applyImpulse = function(force) {
};

Actor.prototype.tick = function(t) {
};

var Object3D = function(obj) {
  this.obj = obj;
};
Object3D.type = 'Object3D';

Object3D.newCubeRenderer = function(opts) {
  var r = opts.r;
  var geom = new THREE.CubeGeometry(r, r, r);
  var mtl = opts.mtl || new THREE.MeshBasicMaterial({color: 0xff0000});

  return new Object3D(new THREE.Mesh(geom, mtl));
};

Object3D.newRectRenderer = function(opts) {
  var r = opts.r;
  var geom = new THREE.Geometry();
  geom.vertices.push(new THREE.Vector3(-r, -r, 0));
  geom.vertices.push(new THREE.Vector3(-r,  r, 0));
  geom.vertices.push(new THREE.Vector3( r, -r, 0));
  geom.vertices.push(new THREE.Vector3( r,  r, 0));
  geom.faces.push(new THREE.Face3(0, 2, 1));
  geom.faces.push(new THREE.Face3(1, 2, 3));
  geom.computeFaceNormals();
  geom.computeVertexNormals();

  var mtl = opts.mtl || new THREE.MeshBasicMaterial({color: 0xff0000});

  return new Object3D(new THREE.Mesh(geom, mtl));
};

Object3D.prototype.setEnt = function(ent) {
  this.ent = ent;

  this.ent.transform.setProxy(this.obj);

  this.obj.matrixAutoUpdate = true;
  if (this.ent.transform.parent) {
    var parentObj = this.ent.transform.parent.ent.getPart(Object3D);
    if (parentObj) {
      parentObj.obj.add(this.obj);
    } else {
      throw 'Un-implemented!';
    }
  }
};

Object3D.Manager = function(scene) {
  this.scene = scene;
  this.objs = [];
};

Object3D.Manager.prototype.addEnt = function(ent) {
  this.objs.push(ent.getPart(Object3D));
  if (!ent.getPart(Object3D).obj.parent) {
    this.scene.add(ent.getPart(Object3D).obj);
  }
};

Object3D.Manager.prototype.removeEnt = function(ent) {
  var obj3d = ent.getPart(Object3D);
  var index = this.objs.indexOf(obj3d);
  if (index == -1) {
    throw 'BAD!';
  }
  this.objs.splice(index, 1);
  if (obj3d.obj.parent) {
    obj3d.obj.parent.remove(obj3d.obj);
  }
};

Object3D.Manager.prototype.tick = function(t) {
};

var Ent = function(posOrTransform) {
  if (!(posOrTransform instanceof Transform)) {
    posOrTransform = new Transform(posOrTransform);
  }
  this.parts = {};
  this.addPart(posOrTransform);
};

Ent.prototype.dispose = function() {
  this.dead = true;
};

Ent.prototype.disposeNow = function() {
  if (this.disposed) {
    throw 'DOUBLE DIP';
  }
  this.dead = true;
  this.disposed = true;
  for (var type in this.parts) {
    var part = this.parts[type];
    var clazz = part.constructor;
    if (clazz.MANAGER) {
      clazz.MANAGER.removeEnt(this);
    } else if (part.dispose) {
      part.dispose();
    }
  }
  if (this.parent()) {
    this.parent().removeChild(this);
  }
};

Ent.prototype.getPart = function(clazz) {
  return this.parts[clazz.type];
};

Ent.prototype.addPart = function(p) {
  var ctor = p.constructor;
  var type = ctor.type;
  if (type in this.parts) {
    throw 'Re-adding "' + type + '"!';
  }
  this.parts[type] = p;
  p.setEnt(this);
  if (ctor.MANAGER) {
    ctor.MANAGER.addEnt(this);
  }
  return this;
};

Ent.prototype.addChild = function(e) {
  this.transform.addChild(e.transform);
  return e;
};

Ent.prototype.removeChild = function(e) {
  this.transform.removeChild(e.transform);
  return e;
};

Ent.prototype.parent = function() {
  return this.transform.parent && this.transform.parent.ent;
};

Ent.prototype.tick = function(t) {
  for (var i = 0; i < this.transform.children.length; i++) {
    this.transform.children[i].ent.tick(t);
  }
  for (var type in this.parts) {
    var part = this.parts[type];
    var clazz = part.constructor;
    if (!clazz.MANAGER && part.tick) {
      part.tick(t);
    }
  }
};

exports.Actor = Actor;
exports.Ent = Ent;
exports.Object3D = Object3D;
exports.Transform = Transform;
exports.Level = Level;
exports.Crawler = Crawler;

})(window);
