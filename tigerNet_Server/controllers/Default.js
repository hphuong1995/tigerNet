'use strict';

var utils = require('../utils/writer.js');
var Default = require('../service/DefaultService');

module.exports.admCreate = function admCreate (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  var newNode = req.swagger.params['newNode'].value;
  Default.admCreate(pid,newNode)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.admCreateMess = function admCreateMess (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  var nid = req.swagger.params['nid'].value;
  var newMessage = req.swagger.params['newMessage'].value;
  Default.admCreateMess(pid,nid,newMessage)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.admDelNode = function admDelNode (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  var nid = req.swagger.params['nid'].value;
  Default.admDelNode(pid,nid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.admDelPattern = function admDelPattern (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  Default.admDelPattern(pid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.admEditNode = function admEditNode (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  var nid = req.swagger.params['nid'].value;
  var editedNode = req.swagger.params['editedNode'].value;
  Default.admEditNode(pid,nid,editedNode)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.admGetAllMess = function admGetAllMess (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  var nid = req.swagger.params['nid'].value;
  Default.admGetAllMess(pid,nid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.admGetAllNodes = function admGetAllNodes (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  Default.admGetAllNodes(pid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.admGetAllPatterns = function admGetAllPatterns (req, res, next) {
  Default.admGetAllPatterns()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.admGetAllUser = function admGetAllUser (req, res, next) {
  Default.admGetAllUser()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.admGetNode = function admGetNode (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  var nid = req.swagger.params['nid'].value;
  Default.admGetNode(pid,nid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.admGetPattern = function admGetPattern (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  Default.admGetPattern(pid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.admGetUser = function admGetUser (req, res, next) {
  var uid = req.swagger.params['uid'].value;
  Default.admGetUser(uid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.adminPatternsPOST = function adminPatternsPOST (req, res, next) {
  Default.adminPatternsPOST()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.adminUsersUidPUT = function adminUsersUidPUT (req, res, next) {
  var uid = req.swagger.params['uid'].value;
  var editedUser = req.swagger.params['editedUser'].value;
  Default.adminUsersUidPUT(uid,editedUser)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.userCreateMess = function userCreateMess (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  var nid = req.swagger.params['nid'].value;
  var newMessage = req.swagger.params['newMessage'].value;
  Default.userCreateMess(pid,nid,newMessage)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.userEditNode = function userEditNode (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  var nid = req.swagger.params['nid'].value;
  var editedNode = req.swagger.params['editedNode'].value;
  Default.userEditNode(pid,nid,editedNode)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.userGetAllMess = function userGetAllMess (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  var nid = req.swagger.params['nid'].value;
  Default.userGetAllMess(pid,nid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.userGetAllNodes = function userGetAllNodes (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  Default.userGetAllNodes(pid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.userGetAllPatterns = function userGetAllPatterns (req, res, next) {
  Default.userGetAllPatterns()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.userGetNode = function userGetNode (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  var nid = req.swagger.params['nid'].value;
  Default.userGetNode(pid,nid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.userGetPattern = function userGetPattern (req, res, next) {
  var pid = req.swagger.params['pid'].value;
  Default.userGetPattern(pid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.userLogin = function userLogin (req, res, next) {
  var user = req.swagger.params['user'].value;
  Default.userLogin(user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.userLogout = function userLogout (req, res, next) {
  Default.userLogout()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
