const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("./models/user");
const Event = require("./models/event");
const SALT_ROUNDS = require("./config").SALT_ROUNDS;

// GET all users, with optional query parameters for filtering between roles
router.get("/", async (req, res) => {
    try {
        if (req.query.role) {
            const role = req.query.role;
            if (!["amministratore", "dipendentecomunale", "sorvegliante"].includes(role)) {
                return res.status(400).json({
                    error: "Invalid role specified",
                    errorCode: "INVALID_ROLE",
                });
            }
            const users = await User.find({ role: role });
            return res.json(users);
        }
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});
// CREATE new user
router.post("/", async (req, res) => {
    try {
        const { email, password, role, name } = req.body;
        if (!email || !password || !role || !name) {
            return res
                .status(400)
                .json({ error: "All fields are required", errorCode: "MISSING_FIELDS" });
        }
        // Check if user already exists
        const existingUser = await User.findOne({
            email,
        });
        if (existingUser) {
            return res
                .status(400)
                .json({ error: "User already exists", errorCode: "USER_ALREADY_EXISTS" });
        }
        const newUser = new User({
            name,
            email,
            role,
            hash: await bcrypt.hash(password, SALT_ROUNDS),
        });
        await newUser.save();
        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: newUser,
        });
    } catch (err) {
        res.status(500).json({ error: "Internal server error", errorCode: "INTERNAL_SERVER_ERROR" });
    }
});
// UPDATE user
router.patch("/:id", async (req, res) => {
    try {
        // Prevent admin from modifying their own account
        const loggedUserId = req.loggedUser.id;
        if (loggedUserId.toString() === req.params.id) {
            return res.status(403).json({
                error: "Cannot modify your own account",
                errorCode: "SELF_MODIFICATION_FORBIDDEN",
            });
        }
        // Check if the user exists
        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) {
            return res.status(404).json({ error: "User not found", errorCode: "USER_NOT_FOUND" });
        }
        // Check if the email is already in use by another user
        if (req.body.email) {
            const existingUser = await User.findOne({
                email: req.body.email,
                _id: { $ne: req.params.id }, // Exclude the current user
            });
            if (existingUser) {
                return res
                    .status(400)
                    .json({ error: "Email already in use", errorCode: "EMAIL_ALREADY_IN_USE" });
            }
        }
        newemail = req.body.email;
        newname = req.body.name;
        newrole = req.body.role;

        if (!newemail || !newname || !newrole) {
            return res
                .status(400)
                .json({ error: "All fields are required", errorCode: "MISSING_FIELDS" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                email: newemail,
                name: newname,
                role: newrole,
            },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ error: "User not found", errorCode: "USER_NOT_FOUND" });
        }
        res.json(user);
    } catch (err) {

        if (error.name === "CastError" && error.kind === "ObjectId") {
            return res.status(400).json({
                error: "Specified ID is not valid format",
                errorCode: "INVALID_ID",
            });
        }

        res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});
// DELETE user
router.delete("/:id", async (req, res) => {
    try {
        // Prevent admin from deleting their own account
        const loggedUserId = req.loggedUser.id;
        if (loggedUserId.toString() === req.params.id) {
            return res.status(403).json({
                error: "Cannot delete your own account",
                errorCode: "SELF_DELETION_FORBIDDEN",
            });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found", errorCode: "USER_NOT_FOUND" });
        }
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        
        if (error.name === "CastError" && error.kind === "ObjectId") {
            return res.status(400).json({
                error: "Specified ID is not valid format",
                errorCode: "INVALID_ID",
            });
        }
        
        res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});

// GET user by ID
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found", errorCode: "USER_NOT_FOUND" });
        }
        res.json(user);
    } catch (err) {

        if (error.name === "CastError" && error.kind === "ObjectId") {
            return res.status(400).json({
                error: "Specified ID is not valid format",
                errorCode: "INVALID_ID",
            });
        }

        res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});

// GET events confirmed by a specific user (only sorvegliante)
router.get("/:id/events", async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found", errorCode: "USER_NOT_FOUND" });
        }
        if (user.role !== "sorvegliante") {
            return res.status(400).json({
                error: "Only users with 'sorvegliante' role can confirm events",
                errorCode: "INVALID_USER",
            });
        }
        const events = await Event.find({ confirmedBy: userId });
        if (!events || events.length === 0) {   
            return res.status(404).json({ error: "No events found for this user", errorCode: "NO_EVENTS_FOUND" });
        }
        res.json(events);
    } catch (err) {

        if (error.name === "CastError" && error.kind === "ObjectId") {
            return res.status(400).json({
                error: "Specified ID is not valid format",
                errorCode: "INVALID_ID",
            });
        }
        res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});

module.exports = router;
