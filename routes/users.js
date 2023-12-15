"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, isAdmin } = require("../middleware/auth");
const { BadRequestError, UnauthorizedError, NotFoundError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login, isAdmin
 **/

router.post("/", ensureLoggedIn, isAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/**
 * POST / {user, jobid} => 
 * Apply for a Job
 *
 * This endpoint allows a user to apply for a job by using the username and job id as the parameters
 *
 * This returns the job details for them:
 *  {applied: { jobDetails : {id, title, salary, equity, company_handle} } }
 *
 * Authorization required: login, user must be the user applying or isAdmin
 **/

router.post("/:username/jobs/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const {username, id} = req.params;
    if (res.locals.user.isAdmin || res.locals.user.username === req.params.username) {
      
      const {appliedJobDetails} = await User.apply(username, id);

      if (appliedJobDetails) {
        return res.status(201).json({
            applied: {
                appliedJobDetails,
            },
        });
    }else {
        return res.status(404).json({ error: "Job not found or could not be applied" });
      }
  }else {
    return res.status(403).json({ error: "Unauthorized to apply for this job" });
  }
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return res.status(401).json({ error: err.message });
    }
    return next(err);
  }
});

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users. Can only be requested by an admin.
 *
 * Authorization required: login, isAdmin
 **/

router.get("/", ensureLoggedIn, isAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 * Getting information on an existing user.
 * This can only be requested by the logged-in user or an admin.
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login, isAdmin and/ or current user logged in === :username
 **/

router.get("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    if (res.locals.user.isAdmin || res.locals.user.username === req.params.username) {
      const user = await User.get(req.params.username);
      return res.json({ user });
    } else {
      throw new UnauthorizedError("You are not authorized to view this profile");
    }
  } catch (err) {
    // Check if the error is an UnauthorizedError
    if (err instanceof UnauthorizedError) {
      return res.status(401).json({ error: err.message });
    }
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 * Edits an existing user
 * This can only be done by the logged-in user or an admin
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login, isAdmin and/ or current user logged in === :username
 **/

router.patch("/:username", ensureLoggedIn, async function (req, res, next) {
  
  try {
   
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    if (res.locals.user.isAdmin || res.locals.user.username === req.params.username) {
      const user = await User.update(req.params.username, req.body);
      return res.json({ user });
    }else {
      throw new UnauthorizedError("You are not authorized to edit this profile");
    }

  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return res.status(401).json({ error: err.message });
    }
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 * Deletes an existing user.
 * This can only be doen by the logged-in user or an admin.
 *
 * Authorization required: login, isAdmin and/ or current user logged in === :username
 **/

router.delete("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    if(res.locals.user.isAdmin || res.locals.user.username === req.params.username){
      await User.remove(req.params.username);
      return res.json({ deleted: req.params.username });
    }else {
        throw new UnauthorizedError("You are not authorized to delete this profile");
      }
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return res.status(401).json({ error: err.message });
    }
    return next(err);
  }
});


module.exports = router;
