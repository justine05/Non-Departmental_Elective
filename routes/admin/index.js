const express = require('express')
const router = express.Router()
const models = require('../../models')
const methods = require('../../methods')
const importExcel = require('convert-excel-to-json')

router.get('/dashboard',(req,res,next)=>{
  methods.HOD.getHODs().then(function(result){
    var dic = {"HOD":result}
    let hod = []
    for (let i=0; i<dic["HOD"].length; i+=1) {
    hod.push(dic["HOD"][i].dataValues);
    }
    console.log(hod)
    let hoddept = []
    for(let i=0;i<hod.length;i++){
      hoddept.push(hod[i].deptID)
    }
    console.log(hoddept)
    methods.department.getDepts(hoddept).then(function(result){
      //console.log("From routes");
      var dict={"data":result}
      //console.log(dict["data"])
      let depts = [];
    for (let i=0; i<dict["data"].length; i+=1) {
     depts.push(dict["data"][i].dataValues);
    }
    console.log(depts);
      methods.course.getCourses()
      .then(re => {
        console.log(re)
        methods.department.getAllDepts()
        .then(dep => {
          res.render('admindashboard', {"HOD":hod,"data":depts,title : 'Admin Dashboard',dept:dep,course :re});
        })
        .catch(e=>{
          console.log(e);
        })
      })
      .catch(er => {
        console.log(er)
      })
    }).catch(function(err){
        res.json({
            "success":false,
            "data":err
        })
    })
  })
})

router.post("/addHOD", (req,res) => {
    methods.authentication.registerHOD(req.body)
    .then(result => {
        console.log(result)
        methods.HOD.addHOD(req.body)
        .then(re => {
            res.redirect("/admin/dashboard")
        })
    })
})

router.post('/changePassword',(req,res,next) => {
  methods.user.changePasswordHOD(req.body.userID,req.body.password)
  .then(re => {
      res.redirect('/admin/dashboard') //Make redirection to another page saying password change successful
  })
  .catch(er => {
      res.send({success:false,error:er})
  })
})

router.get("/allot",(req,response)=>{
  methods.student.generateRankList()
  .then(res2 => {
      //Students Arranged in Descending Order in res
      // console.log(res2)
      methods.student.getStudentPreferences(res2)
      .then(res => {
          //[{studentid1: ['cid1','cid2']},{studentid2: ['cid1','cid2']},{studentid3: ['cid1','cid2']}] array returned
          //Students are sorted in cgpa desc
          methods.course.getAllCourses()
          .then(re => {
              //re is an object with key course id and value array[capacity,filled]
              var course_list = re;
              // console.log(res)
              // console.log(course_list)
              var allotment = []
              res.forEach(studObj => {
                //console.log(studObj)
                studentID = Object.keys(studObj)[0]
                 courses  =studObj[studentID]
                 if(!courses){
                     //student not specified preference
                     // Add such students to an array and finally allot them to any course that is not yet filled
                     console.log(studentID, "not specified any preference")
                 }
                 else{
                  //    console.log(studObj)
                  for(var i=0;i<courses.length;i++){
                      var course = courses[i];
                       if(course_list[course][1]<course_list[course][0]){
                           course_list[course][1]++;
                           var stud_allot={}
                           stud_allot['studentID'] = studentID;
                           stud_allot['courseID'] = course;
                           allotment.push(stud_allot);
                           break;
                       }
                  }
                 }
              });
             for(var z=0;z<allotment.length;z++){
              methods.result.addResult(allotment[z])
             }
             
             response.redirect("/admin/dashboard")
          })
          .catch(er =>{
              console.log(er)
         })
          
      })

  })
  .catch(erro => {
      reject(erro)
  })
})

router.get("/courses",(req,res)=> {
  methods.course.getCourses()
  .then(re => {
    res.render('course',{title:'courses',result:re})
  })
})

router.get("/back",(req,res)=>{
    res.redirect("/admin/dashboard")
})

router.get("/upload",(req,res)=>{
        let file = req.files.myFile;
        let filename = file.name;
        let details = [];
        dept = result.dataValues.deptID
        file.mv('./excel/'+filename,(err)=>{
                if(err) {
                        console.log(err)
                }
                else{
                        let result = importExcel({
                                        sourceFile: './excel/' +filename,
                                        header : {rows:1},
                                        columnToKey : {A:'RegID',B:'Name',C:'email',D:'cgpa',E:'Dept'},
                                        sheets : ['Sheet1']
                        });
                        for(var i=0;i<result.Sheet1.length;i++){
                                methods.student.addStudent(result.Sheet1[i],result.Sheet1[i].Dept);
                        }
                        console.log(details)
                }
        })
        res.redirect("/admin/dashboard")
})

router.post("/result",(req,res) =>{
    var dept = req.body.deptID
    var course = req.body.courseID
    if(dept == "none" && course == "none"){
      methods.result.getResults()
      .then(re => {
        methods.course.getCourses()
        .then(crs => {
          methods.student.getAllStudents()
          .then(stud =>{
            res.render('result',{result: re, course: crs,student:stud})
          })
         
        })
      })
    }
    else if(dept == "none"){
      methods.result.getResults()
      .then(re => {
        methods.course.getCourse(course)
        .then(crs => {
          methods.student.getAllStudents()
          .then(stud =>{
            res.render('result',{result: re, course: crs,student:stud})
          })
        })
      })
    }
    else if(course == "none"){
      methods.result.getResults()
      .then(re => {
        methods.course.getCourses()
        .then(crs => {
          methods.student.getAllStudentsDept(dept)
          .then(stud =>{
            res.render('result',{result: re, course: crs,student:stud})
          })
        })
      })
    }
    else {
      methods.result.getResults()
      .then(re => {
        methods.course.getCourse(course)
        .then(crs => {
          methods.student.getAllStudentsDept(dept)
          .then(stud =>{
            res.render('result',{result: re, course: crs,student:stud})
          })
         
        })
      })
    }
})

module.exports = router;