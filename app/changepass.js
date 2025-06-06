const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = require("./config").SALT_ROUNDS;
const User = require("./models/user");

router.post("", async function (req, res) {
    email = req.loggedUser.email;
    id = req.loggedUser.id;
    newpassword = req.body.newpassword;

    // find the user in the local db
    user = await User.findById(id);
    if (!user) {
        // the user has a valid token, but the user is not in the local db
        // this happens if the user is deleted from the local db
        return res.status(401).json({
            error: "Invalid email",
            errorCode: "INVALID_EMAIL",
        });
    }
    // change the password in the local db
    const hash = await bcrypt.hash(newpassword, SALT_ROUNDS);
    if (user.hash === hash) {
        return res.status(400).json({
            error: "New password cannot be the same as the old password",
            errorCode: "SAME_PASSWORD",
        });
    }
    user.hash = hash;
    user.save()
        .then(() => {
            res.json({
                success: true,
                message: "Password changed successfully",
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                error: "Internal server error",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        });
});

module.exports = router;
