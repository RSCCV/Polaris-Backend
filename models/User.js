const db = require('../config/db.js');

class User {
  //mimic findOne functionality
  static findOne(criteria) {
    if (criteria.username) {
      return db.prepare('SELECT * FROM users WHERE username = ?').get(criteria.username);
    } 
    //maybe need this eventually
    // if (criteria.email) {
    //   return db.prepare('SELECT * FROM users WHERE email = ?').get(criteria.email);
    // }
    return null;
  }
  //mimic previous behaviour with fields
  static findOneWithFields(criteria) {
    if (criteria.username) {
      // Get user
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(criteria.username);
      
      if (!user) return null;
      
      // Get fields for this user
      const fields = db.prepare('SELECT field FROM user_fields WHERE username = ?').all(user.username);
      
      // Attach fields to user object
      user.fields = fields.map(f => f.field);
      
      return user;
    }
    return null;
  }

  //create
  static create(userData) {
    const { username, password, fields, accessLevel } = userData;
    
    const insertUser = db.prepare('INSERT INTO users (username, password, accessLevel) VALUES (?, ?, ?)');
    const insertField = db.prepare('INSERT INTO user_fields (username, field) VALUES (?, ?)');
    
    const transaction = db.transaction(() => {
      // Insert user
      const result = insertUser.run(username, password, accessLevel);
      
      // Insert fields
      if (fields && fields.length > 0) {
        for (const field of fields) {
          insertField.run(username, field);
        }
      }
      
      return username;
    });
    
    const name = transaction();
    return { username: name, acess_Level: accessLevel };
  }

  //delete
  static delete(username) {
    return db.prepare('DELETE FROM users WHERE username = ?').run(username);
  }

  //get All
  static findAll() {
    return db.prepare('SELECT * FROM users').all();
  }
}

module.exports = User;
