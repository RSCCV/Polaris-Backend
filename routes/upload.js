const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const Requirement = require('../models/Requirement')
const upload = require('../MW/authMW.js');
const SECRET = process.env.JWT_SECRET; 



//user requests to be added to group
router.post('/requestJoin', async (req, res) => {
  try {
    const { groupname, user } = req.body
    const targetGroup = await Group.findOne({ name: groupname });
    if (!targetGroup) {
      return res.status(400).json({ message: 'No target group to update' });
    }
    // const group = await Group.find();
    if (targetGroup.requests.indexOf(user) > -1) {
      return res.status(400).json({ message: 'Membership already requested' })
    }
    //TODO redo for new DB save
    await Group.updateOne(
      {
        name: groupname,
      },
      {
        $push: {
          requests: user
        }
      }
    );
    res.status(201).json({
      message: 'Added request',
      added: user
    })
  } catch (err) {
    res.status(500).send(err.message);
    res.status(500).json({ error: 'Could not request membership' });
  }
});

//remove users request to join specified group
router.post('/removeRequest', async (req, res) => {
  try {
    const { groupname, user } = req.body
    const targetGroup = await Group.findOne({ name: groupname });
    if (!targetGroup) {
      return res.status(400).json({ message: 'No target group to update' });
    }
    // const group = db.prepare('SELECT * FROM groups').all();
    if (targetGroup.requests.indexOf(user) == -1) {
      return res.status(400).json({ message: 'No request to delete' })
    }
    //TODO new DB save
    await Group.updateOne(
      {
        name: groupname,
      },
      {
        $pull: {
          requests: user
        }
      }
    );
    res.status(201).json({
      message: 'Removed request',
      removed: user
    })
  } catch (err) {
    res.status(500).send(err.message);
    res.status(500).json({ error: 'Could deny request' });
  }
});

router.post('/updateReq', async (req,res) => {
    try {
    const { group, cost, effort, impact, status, title , responsible } = req.body;
    const targetGroup = Group.findOne({ name: group });
    if (!targetGroup) {
        return res.status(400).json({ message: 'No target group' });
    }
    //TODO new DB
    const updatedGroup = await Group.updateOne(
    {
      name: group,
      "requirements.title": title
    },
    {
      $set: {
          "requirements.$.title": title,
          "requirements.$.cost": cost,
          "requirements.$.effort": effort,
          "requirements.$.impact": impact,
          "requirements.$.status": status,
          "requirements.$.responsible": responsible
      }
    }
  );
        // Response
    res.status(201).json({
        message:'Updated requirement',
        req: req.body
    });
  } catch (err) {
    res.status(500).send(err.message,'Could not update');
  }
});

// add a list of users to specified group
router.post('/addUsers', async (req, res) => {
  try {
    const { userList, groupname } = req.body
    const targetGroup = await Group.findOne({ name: groupname });
    if (!targetGroup) {
      return res.status(400).json({ message: 'No target group to update' });
    }
    await Group.updateOne(
      {
        name: groupname,
      },
      {
        $push: {
          members: { $each: userList}
        }
      }
    );
    res.status(201).json({
      message: 'Added users',
      added: userList
    })
  } catch (err) {
    res.status(500).send(err.message);
  }
});
// add all requirements from list to specified group
router.post('/addReq', async (req, res) => {
  try {
    const { reqList, groupname } = req.body
    const requirements = await Requirement.find()
    const targetGroup = await Group.findOne({ name: groupname });
    if (!targetGroup) {
      return res.status(400).json({ message: 'No target group to update' });
    }
    //extract requirements currently in the group
    const groupRequirements = targetGroup.requirements.map(req => req.title)
    //filter for target requirements in full list
    const filteredRequirements = requirements.filter((requirement) => reqList.indexOf(requirement.title) > -1) //list of full objects
    //TODO new DB
    if(filteredRequirements.length === 0){
      await Group.updateOne(
      {
        name: groupname,
      },
      {
        $set: {
          requirements: [],
        }
      }
    );
      return res.status(201).json({ error: 'Emptied requirement list' });
    }
    const filteredReqNames = filteredRequirements.map(req => req.title) //list of only titles
    //filter for new requirements to add to group
    const addedRequirements = filteredRequirements.filter((requirement) => groupRequirements.indexOf(requirement.title) <= -1) //req objects to add
    //filter for requirements to remove from group
    const toRemove = groupRequirements.filter((requirement) => filteredReqNames.indexOf(requirement) <= -1) //titles of reqs to be removed
    //change into group entry format
    let toAdd = addedRequirements.map((req) => ({title: req.title, cost: req.cost, effort: req.effort, impact: req.impact, status: 'Nicht bearbeitet', responsible: []}))
    //TODO new DB save
    await Group.updateOne(
      {
        name: groupname,
      },
      {
        $push: {
          requirements: { $each: toAdd }
        }
      }
    );
    await Group.updateOne(
      {
        name: groupname,
      },
      {
        $pull: {
          requirements: { 
            title: { $in: toRemove }
          }
        }
      }
    );
    res.status(201).json({
      message: 'Updated requirements',
      toremove: toRemove,
      added: toAdd
    })
  } catch (err) {
    res.status(500).send(err.message);
    res.status(500).json({ error: 'Could not add requirements' });
  }
});

router.post('/remUserFromGroup', async (req, res) => {
    try {
      const { username, groupname } = req.body;

    // Check if entry already exists
    const exisitingUser = await User.findOne({ username: username });
    if (!exisitingUser) {
        return res.status(400).json({ message: 'User does not exist' });
    }
    const targetGroup = await Group.findOne({ name: groupname });
    if (!targetGroup) {
        return res.status(400).json({ message: 'Invalid Group' });
    }
    if (targetGroup.members.indexOf(username) <= -1) {
        return res.status(400).json({ message: 'User not in Group' });
    }
    await Group.updateOne(
      {
        name: groupname,
      },
      {
        $pull: {
          members: username
        }
      }
    );

    res.status(201).json({
      message: 'User removed successfully',
      group: { req: req.body }
    });
  } catch (err) {
    res.status(500).send(err.message,'Could not remove user');
  }
});

router.post('/remGroup', async (req, res) => {
  try {
    const { groupname } = req.body;
  // Check if entry already exists
    const targetGroup = Group.findOne({ name: groupname });
    if (!targetGroup) {
      return res.status(400).json({ message: 'Invalid Group' , req: req.body});
    }
    await Group.deleteOne(targetGroup);

    res.status(201).json({
      message: 'Group deleted successfully',
      group: { req: req.body }
    });
  } catch (err) {
    res.status(500).send(err.message,'Could not delete group');
  }
});

router.post('/addGroup', upload.single('file'), async (req, res) => {

  try {
    let { Admin, Name, SelectedFields} = req.body;

    if (!Array.isArray(SelectedFields)) {
     SelectedFields = [SelectedFields];
    }

    let requirements = await Requirement.find()

    // Check if entry already exists
    const existingGroup = await Group.findOne({ name: Name });
    if (existingGroup) {
        return res.status(400).json({ message: 'Group already exists' });
    }
    const existingAdmin = await User.findOne({ username: Admin });
    if (!existingAdmin) {
        return res.status(400).json({ message: 'Invalid Admin' });
    }

    let InitialRequirements = []
    let remainingRequirements = [...requirements]
    for (const field of SelectedFields){
      const matches = remainingRequirements.filter(
        req => req.fields.includes(field)
      );

      InitialRequirements = InitialRequirements.concat(matches);
    }

    InitialRequirements = InitialRequirements.map((req) => (req = {...req,status: "Nicht bearbeitet"}));

    if(req.file !== undefined){
      const newGroup = await Group.create({
        name : Name,
        thumbnail : req.file.buffer,
        members : [Admin],
        admins: [Admin],
        fields: SelectedFields,
        requirements: InitialRequirements,
      });
    } else {
      const newGroup = await Group.create({
        name : Name,
        thumbnail : null,
        members : [Admin],
        admins: [Admin],
        fields: SelectedFields,
        requirements: InitialRequirements,
      });
    }

        // Response
    res.status(201).json({
      message: 'Group created successfully',
      group: { req: req.body, file: req.file, initReq: InitialRequirements}
    });
  } catch (err) {
    res.status(500).send(err.message,'Could not upload group');
  }
});

module.exports = router;