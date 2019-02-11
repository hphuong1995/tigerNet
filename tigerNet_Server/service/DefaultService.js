'use strict';
var db = require('./database/db');


/**
 * Admin create a new Node for a pattern
 * Admin create a new Node for a pattern
 *
 * pid String id of Pattern
 * newNode Node  (optional)
 * returns Node
 **/
exports.admCreate = function(pid,newNode) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "nid" : "node001",
  "status" : true,
  "directs" : [ "node002", "node004" ],
  "connector" : true,
  "messages" : [ "mess001", "mess002" ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Admin create a new message
 * Admin create a new message
 *
 * pid String id of Pattern
 * nid String id of Node
 * newMessage Message  (optional)
 * returns Message
 **/
exports.admCreateMess = function(pid,nid,newMessage) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "senderId" : "senderId",
  "mid" : "mid",
  "recieverId" : "recieverId",
  "content" : "content"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * admin Delete a Node
 * admin Delete a Node
 *
 * pid String id of Pattern
 * nid String id of Node
 * no response value expected for this operation
 **/
exports.admDelNode = function(pid,nid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Admin delete a Pattern
 * Admin Delete a Pattern
 *
 * pid String id of Pattern
 * no response value expected for this operation
 **/
exports.admDelPattern = function(pid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Admin edit a Node, changing status
 * Admin edit a Node, changing status
 *
 * pid String id of Pattern
 * nid String id of Node
 * editedNode Node  (optional)
 * returns Node
 **/
exports.admEditNode = function(pid,nid,editedNode) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "nid" : "node001",
  "status" : true,
  "directs" : [ "node002", "node004" ],
  "connector" : true,
  "messages" : [ "mess001", "mess002" ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Admin get all messages
 * Admin get all messages
 *
 * pid String id of Pattern
 * nid String id of Node
 * returns List
 **/
exports.admGetAllMess = function(pid,nid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "senderId" : "senderId",
  "mid" : "mid",
  "recieverId" : "recieverId",
  "content" : "content"
}, {
  "senderId" : "senderId",
  "mid" : "mid",
  "recieverId" : "recieverId",
  "content" : "content"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * admin get all Nodes of a pattern
 * admin get all Nodes of a pattern
 *
 * pid String id of Pattern
 * no response value expected for this operation
 **/
exports.admGetAllNodes = function(pid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Admin get all patterns in database
 * Get all pattern in database
 *
 * returns List
 **/
exports.admGetAllPatterns = function() {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "pid" : "patt001",
  "conNodeId" : "node001",
  "nonConNodes" : [ "node001", "node002", "node003", "node004" ]
}, {
  "pid" : "patt001",
  "conNodeId" : "node001",
  "nonConNodes" : [ "node001", "node002", "node003", "node004" ]
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Admin get all users
 * Admin get all users
 *
 * no response value expected for this operation
 **/
exports.admGetAllUser = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Admin get a Node
 * Admin get a Node
 *
 * pid String id of Pattern
 * nid String id of Node
 * returns Node
 **/
exports.admGetNode = function(pid,nid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "nid" : "node001",
  "status" : true,
  "directs" : [ "node002", "node004" ],
  "connector" : true,
  "messages" : [ "mess001", "mess002" ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Admin get a Pattern
 * Admin get a Pattern
 *
 * pid String id of Pattern
 * returns Pattern
 **/
exports.admGetPattern = function(pid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "pid" : "patt001",
  "conNodeId" : "node001",
  "nonConNodes" : [ "node001", "node002", "node003", "node004" ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Admin get a user information
 * Admin get a user information
 *
 * uid String user id
 * returns User
 **/
exports.admGetUser = function(uid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "uid" : "user001",
  "username" : "phuongnguyen",
  "password" : "pwdnguyen",
  "type" : "admin",
  "status" : true,
  "questions" : [ "What is your pet name?Rex", "Where was you born?Hanoi", "What is your mother middle name?Xuan" ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Admin Create new pattern
 * Admin Create new pattern parameters: - name: pattern in: body description: new pattern schema: $ref:
 *
 * returns Pattern
 **/
exports.adminPatternsPOST = function() {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "pid" : "patt001",
  "conNodeId" : "node001",
  "nonConNodes" : [ "node001", "node002", "node003", "node004" ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Admin edit an user(Unlock)
 * Admin edit an user(Unlock)
 *
 * uid String user id
 * editedUser User  (optional)
 * returns User
 **/
exports.adminUsersUidPUT = function(uid,editedUser) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "uid" : "user001",
  "username" : "phuongnguyen",
  "password" : "pwdnguyen",
  "type" : "admin",
  "status" : true,
  "questions" : [ "What is your pet name?Rex", "Where was you born?Hanoi", "What is your mother middle name?Xuan" ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * User create a new message
 * User create a new message
 *
 * pid String id of Pattern
 * nid String id of Node
 * newMessage Message  (optional)
 * returns Message
 **/
exports.userCreateMess = function(pid,nid,newMessage) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "senderId" : "senderId",
  "mid" : "mid",
  "recieverId" : "recieverId",
  "content" : "content"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * User edit a Node, changing status
 * User edit a Node, changing status
 *
 * pid String id of Pattern
 * nid String id of Node
 * editedNode Node  (optional)
 * returns Node
 **/
exports.userEditNode = function(pid,nid,editedNode) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "nid" : "node001",
  "status" : true,
  "directs" : [ "node002", "node004" ],
  "connector" : true,
  "messages" : [ "mess001", "mess002" ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * User get all messages
 * User get all messages
 *
 * pid String id of Pattern
 * nid String id of Node
 * returns List
 **/
exports.userGetAllMess = function(pid,nid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "senderId" : "senderId",
  "mid" : "mid",
  "recieverId" : "recieverId",
  "content" : "content"
}, {
  "senderId" : "senderId",
  "mid" : "mid",
  "recieverId" : "recieverId",
  "content" : "content"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * User get all Nodes of a pattern
 * User get all Nodes of a pattern
 *
 * pid String id of Pattern
 * no response value expected for this operation
 **/
exports.userGetAllNodes = function(pid) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * User get all patterns in database
 * Get all pattern in database
 *
 * returns List
 **/
exports.userGetAllPatterns = function() {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "pid" : "patt001",
  "conNodeId" : "node001",
  "nonConNodes" : [ "node001", "node002", "node003", "node004" ]
}, {
  "pid" : "patt001",
  "conNodeId" : "node001",
  "nonConNodes" : [ "node001", "node002", "node003", "node004" ]
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Admin get a Node
 * Admin get a Node
 *
 * pid String id of Pattern
 * nid String id of Node
 * returns Node
 **/
exports.userGetNode = function(pid,nid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "nid" : "node001",
  "status" : true,
  "directs" : [ "node002", "node004" ],
  "connector" : true,
  "messages" : [ "mess001", "mess002" ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * User get a Pattern
 * User get a Pattern
 *
 * pid String id of Pattern
 * returns Pattern
 **/
exports.userGetPattern = function(pid) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "pid" : "patt001",
  "conNodeId" : "node001",
  "nonConNodes" : [ "node001", "node002", "node003", "node004" ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * User log in
 *
 * user User user to log in (optional)
 * no response value expected for this operation
 **/
exports.userLogin = function(user) {
  return new Promise(function(resolve, reject) {
    db.getUserByLogin(user.username,user.password,resolve);
  });
}


/**
 * User log out
 * User Log out
 *
 * no response value expected for this operation
 **/
exports.userLogout = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}
