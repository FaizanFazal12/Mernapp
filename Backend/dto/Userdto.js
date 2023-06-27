class UserDto {
    constructor(user) {
        this._id = user._id,
            this.email = user.email,
            this.username = user.username
    }
}
module.exports=UserDto