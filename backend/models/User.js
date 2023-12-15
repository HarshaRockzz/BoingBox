const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        type: String,

        default: "https://w7.pngwing.com/pngs/722/101/png-transparent-computer-icons-user-profile-circle-abstract-miscellaneous-rim-account.png"
    }
},
    {
        timestamps: true,
    });

userSchema.methods.matchPassword = async function (pass) {
    return await bcrypt.compare(pass, this.password)
}

userSchema.pre('save', async function (next) {
    if (!this.isModified) {
        next()
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt)
})
const User = mongoose.model("User", userSchema)

module.exports = User;