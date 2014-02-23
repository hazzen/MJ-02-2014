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

var Level = function() {
};
Level.type = 'Level';

Level.prototype.setEnt = function(e) {
  this.ent = e;
};

Level.Side = function() {
  this.occupants = [];
};
Level.Side.type = 'Level.Side';

Level.Side.prototype.setEnt = function(e) {
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

var RectRenderer = function(opts) {
  var r = opts.r;
  var geom = new THREE.Geometry();
  geom.vertices.push(new THREE.Vector3(-r, -r, 0));
  geom.vertices.push(new THREE.Vector3(-r,  r, 0));
  geom.vertices.push(new THREE.Vector3( r, -r, 0));
  geom.vertices.push(new THREE.Vector3( r,  r, 0));
  geom.faces.push(new THREE.Face3(0, 2, 1));
  geom.faces.push(new THREE.Face3(1, 2, 3));

  var mtl = opts.mtl || new THREE.MeshBasicMaterial({color: 0xff0000});

  return new Object3D(new THREE.Mesh(geom, mtl));
};

var Object3D = function(obj) {
  this.obj = obj;
};
Object3D.type = 'Object3D';

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
  this.objs.push({
    obj3d: ent.getPart(Object3D),
  });
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
exports.RectRenderer = RectRenderer;
exports.Object3D = Object3D;
exports.Transform = Transform;
exports.Level = Level;

})(window);
