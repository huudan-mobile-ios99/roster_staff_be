var config = require('./dbconfig')
const sql = require('mssql');
const e = require('express');
const dateTime = require('node-datetime');

const DBNAME ='[neoncmsprod]';



async function getPointsByDates(id, dateToday, dateToday2, startDateWeek, endDateWeek, startDateMonth, endDateMonth) {
    try {
        let pool = await sql.connect(config)
        const querybyDates = `SELECT [PointTransactionID]
      ,dbo.Customer.PreferredName
      ,dbo.Customer.Number
	  ,dbo.CustomerCard.TrackData as 'Customer Card'
      ,[GamingDate]
      ,[EntryDateTime]
      ,[Type]
      ,[PlayerTransactionID]
      ,[LastUpdatedByUserID]
      ,[Comment]
      ,[LoyaltyPoints]
      ,[CompPoints]
  FROM ${DBNAME}.[dbo].[PointTransaction]
  
  Join dbo.Customer
  On dbo.Customer.CustomerID=dbo.PointTransaction.CustomerID
  
  Join dbo.CustomerCard
  on dbo.customer.CustomerID=dbo.CustomerCard.CustomerID
  
  Where dbo.CustomerCard.TrackData=@input_id and dbo.PointTransaction.GamingDate between @input_startDate and @input_endDate`;
        
		const queryAll = `SELECT [PointTransactionID]
      ,dbo.Customer.PreferredName
      ,dbo.Customer.Number
	  ,dbo.CustomerCard.TrackData as 'Customer Card'
      ,[GamingDate]
      ,[EntryDateTime]
      ,[Type]
      ,[PlayerTransactionID]
      ,[LastUpdatedByUserID]
      ,[Comment]
      ,[LoyaltyPoints]
      ,[CompPoints]

  FROM [neoncmsprod].[dbo].[PointTransaction]
  
  Join dbo.Customer
  On dbo.Customer.CustomerID=dbo.PointTransaction.CustomerID
  
  Join dbo.CustomerCard
  on dbo.customer.CustomerID=dbo.CustomerCard.CustomerID
  
  Where dbo.CustomerCard.TrackData=@input_id`;
        
		const queryCurrentPoint = `SELECT dbo.customer.[CustomerID]
      ,dbo.customer.[Number]
     ,dbo.CustomerCard.TrackData as 'Customer_Card'
      ,[Title]
      ,[PreferredName]
     ,dbo.CustomerAccount.DisplayBalance as 'Current_Point'
        
  FROM [neoncmsprod].[dbo].[Customer]
  
  Join dbo.CustomerAccount
  On dbo.Customer.CustomerID=dbo.CustomerAccount.CustomerID
  
  Join dbo.CustomerCard
  On dbo.Customer.CustomerID=dbo.CustomerCard.CustomerID
  
  Where dbo.CustomerCard.TrackData=@input_id
  And dbo.CustomerAccount.AccountType=1`;

        console.log(`connection was established getPointsByDates`);


        const points = await pool.request()
            .input('input_id', sql.Int, id)
            .input('input_startDate', sql.NVarChar, dateToday)
            .input('input_endDate', sql.NVarChar, dateToday2)
            .query(`${querybyDates}`).catch((err) => {

                if (err instanceof Errors.NotFound)
                    return res.status(HttpStatus.NOT_FOUND).send({ message: err.message }); // 404
                console.log(err);
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: err, message: err.message }); //
            })
        const points_week = await pool.request()
            .input('input_id', sql.Int, id)
            .input('input_startDate', sql.NVarChar, startDateWeek)
            .input('input_endDate', sql.NVarChar, endDateWeek)
            .query(`${querybyDates}`).catch((err) => {

                if (err instanceof Errors.NotFound)
                    return res.status(HttpStatus.NOT_FOUND).send({ message: err.message }); // 404
                console.log(err);
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: err, message: err.message }); //
            })
        const points_month = await pool.request()
            .input('input_id', sql.Int, id)
            .input('input_startDate', sql.NVarChar, startDateMonth)
            .input('input_endDate', sql.NVarChar, endDateMonth)
            .query(`${querybyDates}`).catch((err) => {

                if (err instanceof Errors.NotFound)
                    return res.status(HttpStatus.NOT_FOUND).send({ message: err.message }); // 404
                console.log(err);
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: err, message: err.message }); //
            })
        const pointAll = await pool.request()
            .input('input_id', sql.Int, id)
            .query(`${queryAll}`).catch((err) => {

                if (err instanceof Errors.NotFound)
                    return res.status(HttpStatus.NOT_FOUND).send({ message: err.message }); // 404
                console.log(err);
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: err, message: err.message }); //
            })
        const point_current = await pool.request()
            .input('input_id', sql.Int, id)
            .query(`${queryCurrentPoint}`).catch((err) => {

                if (err instanceof Errors.NotFound)
                    return res.status(HttpStatus.NOT_FOUND).send({ message: err.message }); // 404
                console.log(err);
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: err, message: err.message }); //
            })
        let totalPoint_today = 0;
        let totalPoint_Week = 0;
        let totalPoint_Month = 0;
        let totalPoint_All = 0;
        let totalPoint_current = 0;
        let name = "";
        let number = 0;
        let dateTime = new Date();

        for (let i = 0; i < points.recordset.length; i++) {
            dateTime = new Date(points.recordset[i]['EntryDateTime'])
            let d1 = new Date(`${dateToday}T06:00:00`);
            let d2 = new Date(`${dateToday2}T06:00:00`);
            // console.log(`${dateTime} ${d1} ${d2}`);
            if (points.recordset[i]['LoyaltyPoints'] >= 0) {
                if (dateTime.getTime() >= d1.getTime() && dateTime.getTime() < d2.getTime()) {
                    totalPoint_today += points.recordset[i]['LoyaltyPoints'];
                }
            }

        }
        for (let i = 0; i < points_week.recordset.length; i++) {

            dateTime = new Date(points_week.recordset[i]['EntryDateTime'])
            let d1 = new Date(`${startDateWeek}T06:00:00`);
            let d2 = new Date(`${endDateWeek}T06:00:00`);
            //console.log(`${dateTime} ${d1} ${d2}`);
            if (points_week.recordset[i]['LoyaltyPoints'] >= 0) {
                if (dateTime.getTime() >= d1.getTime() && dateTime.getTime() < d2.getTime()) {
                    totalPoint_Week += points_week.recordset[i]['LoyaltyPoints'];
                }
            }

        }
        for (let i = 0; i < points_month.recordset.length; i++) {
            dateTime = new Date(points_month.recordset[i]['EntryDateTime'])
            let d1 = new Date(`${startDateMonth}T06:00:00`);
            let d2 = new Date(`${endDateMonth}T06:00:00`);
            // console.log(`${dateTime} ${d1} ${d2}`);

            if (points_month.recordset[i]['LoyaltyPoints'] >= 0) {
                if (dateTime.getTime() >= d1.getTime() && dateTime.getTime() < d2.getTime()) {
                    totalPoint_Month += points_month.recordset[i]['LoyaltyPoints'];
                }
            }

        }
        for (let i = 0; i < pointAll.recordset.length; i++) {
            number = pointAll.recordset[0]['Number'];
            name = pointAll.recordset[0]['PreferredName'];
            if (pointAll.recordset[i]['LoyaltyPoints'] >= 0) {
                totalPoint_All += pointAll.recordset[i]['LoyaltyPoints'];
            }
        }
        totalPoint_current = point_current.recordset[0]['Current_Point'];
        // console.log(`current point: ${totalPoint_current}`);
        // console.log(`total point: ${totalPoint_today}  ${name} ${number}`);
        let status = false
        if (name != "" && number != 0) {
            status = true;
        }

        const map = {
            "status": status,
            "data": {
                "PreferredName": name,
                "Number": number,
                "LoyaltyPoints": totalPoint_All,
                "LoyaltyPoints_Current": totalPoint_current,
                "LoyaltyPoints_Today": totalPoint_today,
                "LoyaltyPoints_Week": totalPoint_Week,
                "LoyaltyPoints_Month": totalPoint_Month,
            }
        }
        return map
        // return points.recordset;
    } catch (error) {
        console.log(`An error orcur getPointsByDates: ${error}`);
    }
}
async function getPointsByDatesRange(id, startDate, endDate) {
    try {
        let pool = await sql.connect(config)
        const querybyDates = `SELECT [PointTransactionID]
      ,dbo.Customer.PreferredName
      ,dbo.Customer.Number
	  ,dbo.CustomerCard.CustomerCardID as 'Customer Card'
      ,[GamingDate]
      ,[EntryDateTime]
      ,[Type]
      ,[PlayerTransactionID]
      ,[LastUpdatedByUserID]
      ,[Comment]
      ,[LoyaltyPoints]
      ,[CompPoints]

  FROM ${DBNAME}.[dbo].[PointTransaction]
  
  Join dbo.Customer
  On dbo.Customer.CustomerID=dbo.PointTransaction.CustomerID
  
  Join dbo.CustomerCard
  on dbo.customer.CustomerID=dbo.CustomerCard.CustomerID
  
  Where dbo.CustomerCard.TrackData=@input_id 
  And dbo.PointTransaction.Type=1
  and dbo.PointTransaction.GamingDate  between @input_startDate and @input_endDate`;

        const points = await pool.request()
            .input('input_id', sql.Int, id)
            .input('input_startDate', sql.NVarChar, startDate)
            .input('input_endDate', sql.NVarChar, endDate)
            .query(`${querybyDates}`)

        let totalPoint_today = 0;
        let dateTime = new Date();
        let name = "";
        let number = 0;

        for (let i = 0; i < points.recordset.length; i++) {
            dateTime = new Date(points.recordset[i]['EntryDateTime'])
            let d1 = new Date(`${startDate}T06:00:00`);
            let d2 = new Date(`${endDate}T06:00:00`);
            // console.log(`${dateTime} ${d1} ${d2}`);
            if (points.recordset[i]['LoyaltyPoints'] >= 0) {
                if (dateTime.getTime() >= d1.getTime() && dateTime.getTime() < d2.getTime()) {
                    totalPoint_today += points.recordset[i]['LoyaltyPoints'];
                    name = points.recordset[0]['PreferredName'];
                    number = points.recordset[0]['Number'];
                }
            }

        }
        let status = false
        if (name != "" && number != 0) {
            status = true;
        }
        const map = {
            "status": status,
            "data": {
                "PreferredName": name,
                "Number": number,
                "LoyaltyPoints_Frame": totalPoint_today,
            }
        }
        return map
    } catch (error) {
        console.log(`An error orcur getPointsByDatesRange: ${error}`);
    }
}
async function getPointByID(id) {
    try {
        let pool = await sql.connect(config)
        console.log(`connection was established_getPointByID`);
        let points = await pool.request().query(`SELECT [PointTransactionID] ,dbo.Customer.PreferredName,dbo.Customer.Number,[GamingDate],[Type],[Comment] ,[LoyaltyPoints] FROM ${DBNAME}.[dbo].[PointTransaction] Join dbo.Customer On dbo.Customer.CustomerID=dbo.PointTransaction.CustomerID Where dbo.Customer.Number=${id}`)
        return points.recordset.reverse();
    } catch (error) {
        console.log(`An error orcur getPointByID: ${error}`);
    }
}
async function getCardNumberByID(id) {
    try {
        let pool = await sql.connect(config)
        console.log(`connection was established_getPointByID`);
        let points = await pool.request().query(`SELECT TOP (1000) [CustomerCardID]
      ,[CustomerID]
      ,[Number]
      ,[Status]
      ,[IssueNumber]
      ,[TrackData]
  FROM ${DBNAME}.[dbo].[CustomerCard]
  where CustomerID=${id}`)
        return points.recordset.reverse();
    } catch (error) {
        console.log(`An error orcur getPointByID: ${error}`);
    }
}
//CARD TRACK DATA
async function getPointCurrentByCardTrack(id, dateToday, dateToday2, startDateWeek, endDateWeek, startDateMonth, endDateMonth) {
	console.log(id, dateToday, dateToday2, startDateWeek, endDateWeek, startDateMonth, endDateMonth);
    try {
        let pool = await sql.connect(config)
        const queryC = `SELECT dbo.customer.[CustomerID]
      ,dbo.customer.[Number]
      ,dbo.CustomerCard.CustomerCardID as 'Customer_Card'
      ,[Title]
      ,[PreferredName]
      ,dbo.CustomerAccount.DisplayBalance as 'Current_Point'
  FROM ${DBNAME}.[dbo].[Customer]
  
  Join dbo.CustomerAccount
  On dbo.Customer.CustomerID=dbo.CustomerAccount.CustomerID
  
  Join dbo.CustomerCard
  On dbo.Customer.CustomerID=dbo.CustomerCard.CustomerID
  
  Where dbo.CustomerCard.TrackData=@input_id
  And dbo.CustomerAccount.AccountType=1`;
       
	   const querybydates = `SELECT [PointTransactionID]
      ,dbo.Customer.PreferredName
      ,dbo.Customer.Number
	  ,dbo.CustomerCard.TrackData as 'Customer_Card'
      ,[GamingDate]
      ,[EntryDateTime]
      ,[Comment]
      ,[LoyaltyPoints]
      ,[CompPoints]

  FROM ${DBNAME}.[dbo].[PointTransaction]
  
  Join dbo.Customer
  On dbo.Customer.CustomerID=dbo.PointTransaction.CustomerID
  
  Join dbo.CustomerCard
  on dbo.customer.CustomerID=dbo.CustomerCard.CustomerID
  
  Where dbo.CustomerCard.TrackData=@input_id 
  and dbo.PointTransaction.Type=1
  and dbo.PointTransaction.GamingDate  between @input_startDate and @input_endDate`
       
	   const queryall = `SELECT [PointTransactionID]
      ,dbo.Customer.PreferredName
      ,dbo.Customer.Number
	  ,dbo.CustomerCard.TrackData as 'Customer_Card'
      ,[GamingDate]
      ,[EntryDateTime]
      ,[Comment]
      ,[LoyaltyPoints]
      ,[CompPoints]

  FROM ${DBNAME}.[dbo].[PointTransaction]
  
  Join dbo.Customer
  On dbo.Customer.CustomerID=dbo.PointTransaction.CustomerID
  
  Join dbo.CustomerCard
  on dbo.customer.CustomerID=dbo.CustomerCard.CustomerID
  Where dbo.CustomerCard.TrackData=@input_id`
        console.log(`connection was established getPointCurrentByCardTrack`);
        let totalPoint_today = 0;
        let totalPoint_Week = 0;
        let totalPoint_Month = 0;
        let totalPoint_All = 0;
        let totalPoint_current = 0;
        let name = "";
        let number = 0;
        let dateTime = new Date();
        const point_current = await pool.request()
            .input('input_id', sql.NVarChar, id)
            .query(`${queryC}`)
		
        const points = await pool.request()
            .input('input_id', sql.NVarChar, id)
            .input('input_startDate', sql.NVarChar, dateToday)
            .input('input_endDate', sql.NVarChar, dateToday2)
            .query(`${querybydates}`)
        const points_week = await pool.request()
            .input('input_id', sql.NVarChar, id)
            .input('input_startDate', sql.NVarChar, startDateWeek)
            .input('input_endDate', sql.NVarChar, endDateWeek)
            .query(`${querybydates}`)
        const points_month = await pool.request()
            .input('input_id', sql.NVarChar, id)
            .input('input_startDate', sql.NVarChar, startDateMonth)
            .input('input_endDate', sql.NVarChar, endDateMonth)
            .query(`${querybydates}`)
        const pointAll = await pool.request()
            .input('input_id', sql.NVarChar, id)
            .query(`${queryall}`)
            //console.log(points);
        if (points.rowsAffected > 0) {
            for (let i = 0; i < points.recordset.length; i++) {
                dateTime = new Date(points.recordset[i]['EntryDateTime'])
                //console.log(1,points[i])
                //console.log(points.recordset[i]['EntryDateTime'].toLocaleString())
                let d1 = new Date(`${dateToday}T06:00:00`);
                let d2 = new Date(`${dateToday2}T06:00:00`);
                //console.log(d1,d2);
                if (points.recordset[i]['LoyaltyPoints'] >= 0) {
                    if (dateTime.getTime() >= d1.getTime() && dateTime.getTime() < d2.getTime()) {
                        totalPoint_today += points.recordset[i]['LoyaltyPoints'];
                    }
                }
            }
        }
        if (points_week.rowsAffected > 0) {
            for (let i = 0; i < points_week.recordset.length; i++) {
                dateTime = new Date(points_week.recordset[i]['EntryDateTime'])
                let d1 = new Date(`${startDateWeek}T06:00:00`);
                let d2 = new Date(`${endDateWeek}T06:00:00`);
                if (points_week.recordset[i]['LoyaltyPoints'] >= 0) {
                    if (dateTime.getTime() >= d1.getTime() && dateTime.getTime() < d2.getTime()) {
                        totalPoint_Week += points_week.recordset[i]['LoyaltyPoints'];
                    }
                }

            }
        }
        if (points_month.rowsAffected > 0) {
            for (let i = 0; i < points_month.recordset.length; i++) {
                dateTime = new Date(points_month.recordset[i]['EntryDateTime'])
                let d1 = new Date(`${startDateMonth}T06:00:00`);
                let d2 = new Date(`${endDateMonth}T06:00:00`);
                if (points_month.recordset[i]['LoyaltyPoints'] >= 0) {
                    if (dateTime.getTime() >= d1.getTime() && dateTime.getTime() < d2.getTime()) {
                        totalPoint_Month += points_month.recordset[i]['LoyaltyPoints'];
                    }
                }
            }
        }
        if (points_month.rowsAffected > 0) {
            for (let i = 0; i < pointAll.recordset.length; i++) {
                number = pointAll.recordset[0]['Number'];
                name = pointAll.recordset[0]['PreferredName'];
                if (pointAll.recordset[i]['LoyaltyPoints'] >= 0) {
                    totalPoint_All += pointAll.recordset[i]['LoyaltyPoints'];
                }
            }
        }
        if (point_current.rowsAffected > 0) {
            totalPoint_current = point_current.recordset[0]['Current_Point'];
        }
        let status = false
        if (name != "" && number != 0) {
            status = true;
        }
        const map = {
            "status": status,
            "data": {
                "PreferredName": name,
                "Number": number,
                "LoyaltyPoints": totalPoint_All,
                "LoyaltyPoints_Current": totalPoint_current,
                "LoyaltyPoints_Today": totalPoint_today,
                "LoyaltyPoints_Week": totalPoint_Week,
                "LoyaltyPoints_Month": totalPoint_Month,
            }
        }
        return map
    } catch (error) {
        console.log(`An error orcur getPointCurrentByCardTrack: ${error}`);
    }
}
//END CARD TRACK DATA
//START GET POINT BY CARDTRACK RANGE
async function getPointCurrentByCardTrackRange(id,startDate,endDate) {
      try {
        let pool = await sql.connect(config)
        let querybydates = `SELECT [PointTransactionID]
      ,dbo.Customer.PreferredName
      ,dbo.Customer.Number
	  ,dbo.CustomerCard.TrackData as 'Customer_Card'
      ,[GamingDate]
      ,[EntryDateTime]
      ,[Comment]
      ,[LoyaltyPoints]
      ,[CompPoints]

  FROM ${DBNAME}.[dbo].[PointTransaction]
  
  Join dbo.Customer
  On dbo.Customer.CustomerID=dbo.PointTransaction.CustomerID
  
  Join dbo.CustomerCard
  on dbo.customer.CustomerID=dbo.CustomerCard.CustomerID
  
  Where dbo.CustomerCard.TrackData=@input_id 
  and dbo.PointTransaction.Type=1
  and dbo.PointTransaction.GamingDate  between @input_startDate and @input_endDate`
       
        console.log(`connection was established getPointCurrentByCardTrackRanges`);
        
        let totalPoint_Frame = 0;
        let name = "";
        let number = 0;
        let dateTime = new Date();
       
        const points_frame= await pool.request()
            .input('input_id', sql.NVarChar, id)
            .input('input_startDate', sql.NVarChar, startDate)
            .input('input_endDate', sql.NVarChar, endDate)
            .query(`${querybydates}`)
        
        if (points_frame.rowsAffected > 0) {
            for (let i = 0; i < points_frame.recordset.length; i++) {
                name = points_frame.recordset[i]['PreferredName'];
                number = points_frame.recordset[i]['Number'];
                
                dateTime = new Date(points_frame.recordset[i]['EntryDateTime'])
                let d1 = new Date(`${startDate}T06:00:00`);
                let d2 = new Date(`${endDate}T06:00:00`);
                if (points_frame.recordset[i]['LoyaltyPoints'] >= 0) {
                    if (dateTime.getTime() >= d1.getTime() && dateTime.getTime() < d2.getTime()) {
                        totalPoint_Frame += points_frame.recordset[i]['LoyaltyPoints'];
                    }
                }
            }
        }
        
        let status = false
        if (name != "" && number != 0 && totalPoint_Frame != 0) {
            status = true;
        }
        const map = {
            "status": status,
            "data": {
                "PreferredName": name,
                "Number": number,
                "LoyaltyPoints_Frame": totalPoint_Frame,
            }
        }
        return map
    } catch (error) {
        console.log(`An error orcur getPointCurrentByCardTrackRanges: ${error}`);
    }
}
//END HERE

module.exports = {
    getPointByID: getPointByID,
    getPointsByDates: getPointsByDates,
    getPointsByDatesRange: getPointsByDatesRange,
    getCardNumberByID: getCardNumberByID,
    getPointCurrentByCardTrack: getPointCurrentByCardTrack,
    getPointCurrentByCardTrackRange:getPointCurrentByCardTrackRange,
}