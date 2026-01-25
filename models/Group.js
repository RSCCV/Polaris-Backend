const db = require('../config/db.js');

class Group{
  // Helper function to get full group data (mimics Mongoose populate)
  //TODO implement properly
  static getFullGroup = (groupName) => {
    const group = db.prepare('SELECT * FROM groups WHERE name = ?').get(groupName);
    
    if (!group) return null;

    // Get members
    const members = db.prepare(`
      SELECT username, name FROM group_members WHERE name = ?
    `).all(groupName);

    // Get admins
    const admins = db.prepare(`
      SELECT username, name FROM group_admins WHERE name = ?
    `).all(groupName);

    // Get fields
    const fields = db.prepare(`
      SELECT field FROM group_fields WHERE name = ?
    `).all(groupName);

    // Get requests
    const requests = db.prepare(`
      SELECT username, name FROM group_requests WHERE name = ?
    `).all(groupName);

    // Get requirements with responsibilities
    const requirements = db.prepare(`
      SELECT id, title, cost, effort, impact, status 
      FROM group_requirements 
      WHERE name = ?
    `).all(groupName);

    // For each requirement, get responsible users
    requirements.forEach(req => {
      const responsible = db.prepare(`
        SELECT username FROM group_responsibilities WHERE group_requirement_id = ?
      `).all(req.id);
      req.responsible = responsible.map(r => r.username);
    });

    return {
      name: group.name,
      thumbnail: group.thumbnail,
      members: members.map(m => m.username),
      admins: admins.map(a => a.username),
      fields: fields.map(f => f.field),
      requests: requests.map(r => r.username),
      requirements: requirements
    };
  };

  // Mongoose-like findOne
  static findOne = (query) => {
    if (query.name) {
      return this.getFullGroup(query.name);
    }
    return null;
  };

  // Create a new group
  static createGroup = (groupData) => {
    const insert = db.transaction((data) => {
      // Insert main group
      db.prepare('INSERT INTO groups (name, thumbnail) VALUES (?, ?)').run(
        data.name,
        data.thumbnail || null
      );

      // Insert members
      if (data.members) {
        const insertMember = db.prepare(
          'INSERT INTO group_members (name, username) VALUES (?, ?)'
        );
        data.members.forEach(username => {
          insertMember.run(data.name, username);
        });
      }

      // Insert admins
      if (data.admins) {
        const insertAdmin = db.prepare(
          'INSERT INTO group_admins (name, username) VALUES (?, ?)'
        );
        data.admins.forEach(username => {
          insertAdmin.run(data.name, username);
        });
      }

      // Insert fields
      if (data.fields) {
        const insertField = db.prepare(
          'INSERT INTO group_fields (name, field) VALUES (?, ?)'
        );
        data.fields.forEach(field => {
          insertField.run(data.name, field);
        });
      }

      // Insert requests
      if (data.requests) {
        const insertRequest = db.prepare(
          'INSERT INTO group_requests (name, username) VALUES (?, ?)'
        );
        data.requests.forEach(username => {
          insertRequest.run(data.name, username);
        });
      }

      // Insert requirements
      if (data.requirements) {
        data.requirements.forEach(req => {
          const result = db.prepare(`
            INSERT INTO group_requirements (name, title, cost, effort, impact, status) 
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(data.name, req.title, req.cost, req.effort, req.impact, req.status);

          const reqId = result.lastInsertRowid;

          // Insert responsibilities
          if (req.responsible) {
            const insertResp = db.prepare(
              'INSERT INTO group_responsibilities (group_requirement_id, username) VALUES (?, ?)'
            );
            req.responsible.forEach(username => {
              insertResp.run(reqId, username);
            });
          }
        });
      }
    });

    insert(groupData);
    return this.getFullGroup(groupData.name);
  };

  // TODO untested Update a group
  static updateOne = (groupName, updateData) => {
    const update = db.transaction((name, data) => {
      // Update thumbnail if provided
      //NOTE leaving push and pull unimplemented as there should be no need for them
      if (data.set) {
        if (data.Set.thumbnail) {
          db.prepare('UPDATE groups SET thumbnail = ? WHERE name = ?').run(
            data.Push.thumbnail,
            name
          );
        }
      }

      if (data.Push){
        // Insert new members
        if (data.Push.members) {
          const insertMembers = db.prepare(
            'INSERT INTO group_members (name, username) VALUES (?, ?)'
          );
          data.Push.members.forEach(username => {
            console.log(name, username)
            insertMembers.run(name, username);
          });
        }

        // Insert new requirements
        if (data.Push.requirements) {
          data.Push.requirements.forEach(req => {
            const result = db.prepare(`
              INSERT INTO group_requirements (name, title, cost, effort, impact, status) 
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(name, req.title, req.cost, req.effort, req.impact, req.status);

            const reqId = result.lastInsertRowid;
            //TODO still untested
            if (req.responsible) {
              const insertResp = db.prepare(
                'INSERT INTO group_responsibilities (group_requirement_id, username) VALUES (?, ?)'
              );
              req.responsible.forEach(username => {
                insertResp.run(reqId, username);
              });
            }
          });
        }
      }

      if (data.Pull){
        // Delete members
        if (data.Pull.members) {
          const deleteMembers = db.prepare(
            'DELETE FROM group_members WHERE (name, username) = (?, ?)'
          );
          data.Pull.members.forEach(username => {
            deleteMembers.run(name, username);
          });
        }
        //Delete requirements
        if (data.Pull.requirements) {
          data.Pull.requirements.forEach(title => {
            const result = db.prepare(
              'DELETE FROM group_requirements WHERE (name, title) = (?, ?)')
              .run(name,title);
          });
        }
      }
      
      if(data.Modify){
        //TODO untested since this isnt used anywhere yet
        if (data.Modify.requirements) {
          console.log(data.Modify.requirements)
            const modifyRequirements = 
            db.prepare('UPDATE group_requirements SET (cost, effort, impact, status) = (?, ?, ?, ?) WHERE (name, title) = (?, ?)');
            data.Modify.requirements.forEach(req => {
              modifyRequirements.run(req.cost, req.effort, req.impact, req.status, name, req.title);

              const reqId = modifyRequirements.lastInsertRowid;
            //TODO redo using ids
            // Overwrite responsibilities 
            // if (req.responsible) {
            //   db.prepare('DELETE FROM group_responsibilities WHERE (name, title) = (?, ?)').run(name, req.title);
            //   const insertResp = db.prepare(
            //     'INSERT INTO group_responsibilities (responsible,name, title) VALUES (?, ?, ?)'
            //   );
            //   req.responsible.forEach(username => {
            //     insertResp.run(username, name, req.title);
            //   });
            // }
          });
        }
      }


      // 
      //TODO implement properly before enabling
      // Update admins
      // if (data.admins) {
      //   db.prepare('DELETE FROM group_admins WHERE name = ?').run(name);
      //   const insertAdmin = db.prepare(
      //     'INSERT INTO group_admins (name, username) VALUES (?, ?)'
      //   );
      //   data.admins.forEach(username => {
      //     insertAdmin.run(name, username);
      //   });
      // }

      //TODO implement properly before enabling
      // Update fields
      // if (data.fields) {
      //   db.prepare('DELETE FROM group_fields WHERE name = ?').run(name);
      //   const insertField = db.prepare(
      //     'INSERT INTO group_fields (name, field) VALUES (?, ?)'
      //   );
      //   data.fields.forEach(field => {
      //     insertField.run(name, field);
      //   });
      // }

      //TODO implement properly before enabling      
      // Update requests
      // if (data.requests) {
      //   db.prepare('DELETE FROM group_requests WHERE name = ?').run(name);
      //   const insertRequest = db.prepare(
      //     'INSERT INTO group_requests (name, username) VALUES (?, ?)'
      //   );
      //   data.requests.forEach(username => {
      //     insertRequest.run(name, username);
      //   });
      // }
    });

    update(groupName.name, updateData);
  };

  // Delete a group
  static deleteGroup = (groupName) => {
    db.prepare('DELETE FROM groups WHERE name = ?').run(groupName);
  };

  // Find all groups
  static findAll = () => {
    const groups = db.prepare('SELECT name FROM groups').all();
    return groups.map(g => this.getFullGroup(g.name));
  };
}
module.exports = Group;