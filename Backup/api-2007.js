var dboperation = require('./dboperation')
var express = require('express')
var body_parser = require('body-parser')
var cors = require('cors')
var helmet = require('helmet')
var app = express();
var router = express.Router();
var fs= require('fs');
var cmd =require('node-cmd');
var app = express();
var router = express.Router();
var path = require('path');

app.use(body_parser.urlencoded({ extended: true }))
app.use(body_parser.json())
app.use(cors())
app.use(helmet())
app.use('/api', router)

router.use((request, response, next) => {
    console.log('middleware!');
    next();
});

var port = process.env.PORT || 8090;
app.listen(port);
console.log('app running at port: ' + port);

router.route('/card_number/:id').get((request, response) => {
    dboperation.getCardNumberByID(request.params.id).then(result => {
        response.json(result)
    })
})
router.route('/point/:id').get((request, response) => {
    dboperation.getPointByID(request.params.id).then(result => {
        response.json(result)
    })
})

router.route('/point_by_date').post((request, response) => {
    const {id,dateToday,dateToday2,startDateWeek,endDateWeek,startDateMonth,endDateMonth} = request.body;
    let now = new Date();
    let startDay = new Date();
    startDay.setHours(6,0,0,0);
    let startWeek = new Date();
    startWeek.setDate(now.getDate()-(now.getDay()+2));
    startWeek.setHours(6,0,0,0);
    let startMonth = new Date();
    startMonth.setDate(1);
    startMonth.setHours(6,0,0,0);
    console.log(id,startDay,now,startWeek,now,startMonth,now);
    dboperation.getPointsByDates(id,startDay,now,startWeek,now,startMonth,now)
    .then(result => {response.json(result)})
})

/*router.route('/point_by_date').post((request, response) => {
    const {id,dateToday,dateToday2,startDateWeek,endDateWeek,startDateMonth,endDateMonth} = request.body;
    // console.log(request.params.id,request.params.startDate,endDate);
    dboperation.getPointsByDates(id,dateToday,dateToday2,startDateWeek,endDateWeek,startDateMonth,endDateMonth)
    .then(result => {response.json(result)})
})*/

function convertISODate(date) {
    const offset = new Date().getTimezoneOffset();
    const myDate = date - (offset * 60 * 1000);
    const dateAsISO = new Date(myDate).toISOString();
 
    return dateAsISO;
}

router.route('/point_by_date_cardtrack').post((request, response) => {
    const {id,dateToday,dateToday2,startDateWeek,endDateWeek,startDateMonth,endDateMonth} = request.body;
	let now = new Date();
    let startDay = new Date();
    startDay.setHours(6,0,0,0);
	let nextDay = new Date();
	nextDay.setDate(startDay.getDate()+1);
    let startWeek = new Date();
    startWeek.setDate(now.getDate()-(now.getDay()+2));
    startWeek.setHours(6,0,0,0);
    let startMonth = new Date();
    startMonth.setDate(1);
    startMonth.setHours(6,0,0,0);
    
    dboperation.getPointCurrentByCardTrack(id,startDay.toLocaleDateString('sv'),
											nextDay.toLocaleDateString('sv'),
											startWeek.toLocaleDateString('sv'),
											nextDay.toLocaleDateString('sv'),
											startMonth.toLocaleDateString('sv'),
											nextDay.toLocaleDateString('sv'))
    .then(result => {response.json(result)})
})
router.route('/point_by_date/range').post((request, response) => {
    const {id,startDate,endDate} = request.body;
    dboperation.getPointsByDatesRange(id,startDate,endDate)
    .then(result => {response.json(result)})
})
router.route('/point_by_date_cardtrack/range').post((request, response) => {
    const {id,startDate,endDate} = request.body;
    dboperation.getPointCurrentByCardTrackRange(id,startDate,endDate)
    .then(result => {response.json(result)})
})


//PRINTER ESC POS
function sendPrintCommand(filename){
    let fullpath = path.resolve(filename);
    console.log(fullpath);
    cmd.run(`notepad /p ${fullpath}`);
}

function createPrintFile(cusname, cusnumber, cpoint, dpoint, wpoint, mpoint, fpoint){
    let temp = fs.readFileSync('print.tmp', 'utf8');
    temp = temp.replace('<cusName>', cusname)
        .replace('<cusNumber>', cusnumber)
        .replace('<cPoint>', cpoint)
        .replace('<dPoint>', dpoint)
        .replace('<wPoint>', wpoint)
        .replace('<mPoint>', mpoint)
        .replace('<fPoint>', fpoint)
        .replace('<time>', (new Date()).toLocaleString());

    fs.writeFileSync('print.txt', temp);
    sendPrintCommand('print.txt');
}

router.route('/print/vegaspoint').post((req, res) => {
    let {cusname, cusnumber, cpoint, dpoint, wpoint, mpoint, fpoint} = req.body;
    createPrintFile(cusname, cusnumber, cpoint, dpoint, wpoint, mpoint, fpoint);
    //  res.json(req.body);
    res.json({
       "result": 'data print'
    });
});

