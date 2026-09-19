const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const userModel = require("../models/userModel.js");

const signup = async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const isUserExist = await userModel.findOne({ email });

        if (isUserExist) {
            console.log(isUserExist);

            return res.status(400).json({ message: "User already exists!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const user = await userModel.create({ username, email, password: hashPassword, repositories: [], followedUsers: [], starRepos: [] });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

        res.status(201).json({ message: "User Created Successfully", data: { username: user.username, email: user.email }, token })



    } catch (error) {
        console.log("Error is signup", error);
        res.status(500).json({ message: "Something went wrong" })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select("+password");

        if (!user) {
            return res.status(400).json({ message: "Invalid Credientails" });
        }

        const isMatchPassword = await bcrypt.compare(password, user.password);

        if (!isMatchPassword) {
            return res.status(400).json({
                message: "Invalid Credentials"
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

        return res.status(200).json({
            message: "Login Successful",
            data: {
                username: user.username,
                email: user.email
            },
            token
        });


    } catch (error) {
        console.log("Error is login", error);
        res.status(500).json({ message: "Something went wrong" })
    }
}

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({});
        res.json({ message: "User fetched successfully", users });
    } catch (error) {
        console.log("Error is get all users", error);
        res.status(500).json({ message: "Something went wrong" })
    }
}


const getUserProfile = async (req, res) => {
    try {
        const currentId = req.params.id;
        const user = await userModel.findById({ _id: currentId });

        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        res.status(200).json({ message: "User fetched successfully", user });
    } catch (error) {
        console.log("Error is login", error);
        res.status(500).json({ message: "Something went wrong" })
    }
}


const updateUserProfile = async (req, res) => {
    try {
        const currentId = req.params.id;
        const { username, password } = req.body;

        const updatedFields = { username };

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);

            updatedFields.password = hashPassword;
        }

        const updatedUserData = await userModel.findByIdAndUpdate({ _id: currentId }, updatedFields, { new: true });

        if (!updatedUserData) {
            return res.status(404).json({ message: "User not found!" });
        }

        res.status(200).json({ message: "User Updated Successfully", updatedUserData })
    } catch (error) {
        console.log("Error during updating profile", error);
        res.status(500).json({ message: "Something went wrong" })
    }
}


const deleteUserProfile = async (req, res) => {
    try {
        const deletedUser = await userModel.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({
                message: "User not found!"
            });
        }

        return res.status(200).json({
            message: "User deleted successfully", "deleteUser": deletedUser
        });

    } catch (error) {
        console.log("Error while deleting user profile", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


module.exports = {
    getAllUsers,
    signup,
    login,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile
}