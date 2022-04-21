require('dotenv').config();
const express = require('express');
const router = express.Router();
const db  = require('../model/dbConnection');
const { signupValidation, loginValidation } = require('../middleware/validation');
const path = require('path');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//let refreshTokens = [];

router.use(express.static('../public'));

router.post('/register', signupValidation, (req, res, next) => {
  
  db.query(
    `SELECT * FROM userData.users WHERE LOWER(email) = LOWER(${db.escape(
      req.body.email
    )});`,
    (err, result) => {
      if (result.length) {
        return res.status(409).send({
          msg: 'This user account is already registered, please try with different one'
        });
      } 
      else {
        // username is available
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            //console.log(req.body.password);
            return res.status(500).send({
              msg: err
            });
          } else {
            
            // has hashed pw => add to database
            db.query(`INSERT INTO userData.users (name, email, password) VALUES ('${req.body.username}', ${db.escape(
                req.body.email
              )}, ${db.escape(hash)})`,
              (err, result) => {
                if (err) {
                  return res.status(400).send({msg: err});
                }
                
                // Add the Alert Pop-up Message "User logged in successfully!!" 

                //res.redirect('/login');
                res.status(200).send({isRegistered:true})
              }
            );
          }
        });
      }
    }
  );


});



router.post('/login', loginValidation, (req, res, next) => {

  const email = req.body.email;
  const password = req.body.password;
  db.query(
    `SELECT * FROM userData.users WHERE email = ${db.escape(email)};`,
    (err, result) => {

      // user does not exists
      if (err) {
        return res.status(400).json({
          msg: err
        });
      }

      if (!result.length) {
        return res.status(401).json({
          auth:false, msg: 'Email or password is incorrect!'
        });
      }
      // check password
      bcrypt.compare(
        password,
        result[0]['password'],
        (bErr, bResult) => {
          // wrong password
          if (bErr) {
            return res.status(401).send({
              msg: 'Email or password is incorrect!'
            });
          }
          if (bResult) {
            const token = jwt.sign({id:result[0].id},process.env.JWT_ACCESS_SIGN,{ expiresIn: '1d' });
            const refToken = jwt.sign({id:result[0].id},process.env.JWT_REFRESH_SIGN,{ expiresIn: '7d' });
            //refreshTokens.push(refToken);

            db.query(
              `UPDATE userData.users SET last_login = now() WHERE id = '${result[0].id}'`
            );

            db.query(`UPDATE userData.users SET token = '${refToken}' WHERE id = '${result[0].id}'`);

            /*
            res.cookie('jwt-cookie', token, {
              secure: process.env.NODE_ENV !== "development",
              httpOnly: true,
              maxAge: 10 * 60 * 60 * 1000
            });
            */
            
            res.cookie('jwt-cookie', token, {
              secure: process.env.NODE_ENV !== "development",
              httpOnly: true,
              sameSite: 'lax',
              maxAge: 24 * 60 * 60 * 1000
            });
            
            return res.status(200).send({"isLogin": true, "refreshToken": refToken});
            
            /*
            res.cookie('ref-jwt-cookie',refToken, {
              secure: process.env.NODE_ENV !== "development",
              httpOnly: true,
              maxAge: 604800000
            });*/

            //return res.status(200).send({isLogin: true});
            //return res.redirect('/');

            
          }

          return res.status(401).json({
            auth:false, msg: 'Username or password is incorrect!'
          });
        }
      );
    }
  );
});


router.post('/refreshAccessToken', ( req, res) => {
  const refreshToken = req.body.refreshToken;
  //console.log(refreshToken);
  
  // if(!refreshToken || !refreshTokens.includes(refreshToken)){
  //   return res.status(403).json({ msg:"User is not Authenticated!!"})
  // }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SIGN, function (err, decoded){
    if(err){
      res.status(403).json({ message : `User is not Authenticated !! ${err}`});
      //return res.sendFile(path.join(__dirname + '/views/landing.html'));
    }
    else{
        return decoded;
    }
  });
  console.log(decoded);

  db.query(`SELECT * FROM userData.users where id=${decoded.id} AND token='${refreshToken}'`, function (error, results, fields) {
    if (error){
      console.log("error");
    
      return res.status(403).json({ message : "User is not Authenticated !!"})
    }
    else {
        const accessToken = jwt.sign({id:decoded.id},process.env.JWT_ACCESS_SIGN,{ expiresIn: '1d' });
        //res.setHeader("set-cookie", [`jwt-cookie=${accessToken}; httponly; samesite=lax; maxAge`]);
        res.cookie('jwt-cookie', accessToken, {
          secure: process.env.NODE_ENV !== "development",
          httpOnly: true,
          sameSite: 'none',
          maxAge: 24 * 60 * 60 * 1000
        });
        return res.send({
          "message": "Refreshed successfully"
        });
    }   
  });
})


module.exports = router;