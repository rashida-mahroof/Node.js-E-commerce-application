var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcryptjs')
const async = require('hbs/lib/async')
const { status } = require('express/lib/response')
const { stringify } = require('querystring')
module.exports = {
    doSignup: (userData)=>{
        //console.log(userData);
        return new Promise(async(resolve,reject)=>{
            //var salt = bcrypt.genSaltSync(10);   
                    userData.Password = await bcrypt.hash(userData.Password,10)
                           //console.log(userData.Password);
                            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                            resolve(data.insertedId)
                       })
                       
            })
           
    },
    doLogin: (userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginstatus= false
            let response = {}
            let user =await db.get().collection(collection.USER_COLLECTION).findOne({Email: userData.Email})
            if(user){
               
                   
                  //var res = bcrypt.compare(user.Password,userData.Password)
                //   console.log(user.Password);
                //   console.log(userData.Password);
                   var a= bcrypt.compare( userData.Password,user.Password).then((status)=>{
                     if(status){
                         console.log("success");
                         response.user = user
                         response.status = true
                         resolve(response)
                     }
                     else{
                         console.log("failed");
                         resolve({status:false})
                     }
                    });       
            }else{
                console.log("login failed");
                resolve({status:false})
            }
        })
    }
}