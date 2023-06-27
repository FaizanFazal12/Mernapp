const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_SECRET } = require("../config/index");
const { REFRESH_TOKEN_SECRET } = require("../config/index");
const RefreshToken = require("../models/Token")
// const ACCESS_TOKEN_SECRET="0548529c1235a1bbacacbb7327ba5823cda29bdddf4e6645dbba359687fb24b30dd07c35b5b740766aee26a368fb76fe9cb5f08369a73b11f8f596775a18970c";
// const REFRESH_TOKEN_SECRET='50fc64f55e46f976d9238687718454328699c4f7e03ba30f28fc773052b5f61b2d907e1ea4d9e91a5e1f0f7df87591ea84db3d15fa71745f555d509828a25913';
class JWTServices {
    //Sign Access Token
  static  SignAccessToken(payload, expiryTime) {
        return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: expiryTime });
    }
    //Sign refresh token
  static  SignRefreshToken(payload, expiryTime) {
        return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: expiryTime })
    }
    //Verify accesss token
  static VerifyAccessToken(token) {
        return jwt.verify(token, ACCESS_TOKEN_SECRET)
    }
    //Verify resfresh token
  static  VerifyRefreshToken(token) {
        return jwt.verify(token, REFRESH_TOKEN_SECRET)
    }
    //Store refresh tokennp 

  static  async StoreRefreshToken(token, userId) {
        try {

            const newToken = new RefreshToken({
                token: token,
                userId: userId
            })
            await newToken.save()
        }
        catch (err) {
            console.log(err)
        }
    }
}
module.exports=JWTServices