//axios
var url = 'http://192.168.100.202/Interfaces/LoyaltyKiosk/LoyaltyKioskService.svc?wsdl';
var url_hospitality = 'http://192.168.100.202/Interfaces/Hospitality/HospitalityService.svc?wsdl';
var axios = require('axios');
//axios

var parseString = require('xml2js').parseString; //here i'm using a library colled xml2js to parse the respanse from xml to js object
var stripNS = require('xml2js').processors.stripPrefix;
const options = {
    tagNameProcessors: [stripNS],
    explicitArray: false,
};
function isJson(item) {
    item = typeof item !== "string"
        ? JSON.stringify(item)
        : item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    if (typeof item === "object" && item !== null) {
        return true;
    }

    return false;
}
async function getCustomerImage({ res, computer, number }) {
    var xml = `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
    <Body>
        <GetCustomerImage xmlns="http://www.IntelligentGaming.co.uk">
            <!-- Optional -->
            <request>
                <ComputerName xmlns="IG.Cms.Gateway.DataContracts">#computer</ComputerName>
                <CustomerNumber xmlns="IG.Cms.Gateway.DataContracts">#number</CustomerNumber>
            </request>
        </GetCustomerImage>
    </Body>
</Envelope>`;
    xml = xml.replace('#computer', computer).replace('#number', number);
    axios.post(url_hospitality, xml,
        {
            headers:
            {
                'Content-Type': 'text/xml',
                SOAPAction: "http://www.IntelligentGaming.co.uk/HospitalityService/GetCustomerImage"
            }
        }).then(data => {
            parseString(data.data, options, function (err, result) {

                let my_result = result.Envelope.Body.GetCustomerImageResponse.GetCustomerImageResult.Image;
                if (isJson(my_result)) {
                    res.json('null');
                } else {
                    res.json(my_result);
                }
            });
        }).catch(error => {
            console.log(error)
        });
}




async function getCustomerInCasino({ res, computer, gammingdate }) {
    var xml = `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
    <Body>
        <CustomersInCasino xmlns="http://www.IntelligentGaming.co.uk">
            <!-- Optional -->
            <request>
                <ComputerName xmlns="IG.Cms.Gateway.DataContracts">#computer</ComputerName>
                <!-- Optional -->
                <Casino xmlns="IG.Cms.Gateway.DataContracts">
                    <Id>3</Id>
                    <Name>Vegas Club</Name>
                </Casino>
                <GamingDate xmlns="IG.Cms.Gateway.DataContracts">#gammingdate</GamingDate>
            </request>
        </CustomersInCasino>
    </Body>
</Envelope>`;
    xml = xml.replace('#computer', computer).replace('#gammingdate', gammingdate);
    axios.post(url_hospitality, xml,
        {
            headers:
            {
                'Content-Type': 'text/xml',
                SOAPAction: "http://www.IntelligentGaming.co.uk/HospitalityService/CustomersInCasino"
            }
        }).then(data => {
            parseString(data.data, options, function (err, result) {
                let final_result = result.Envelope.Body.CustomersInCasinoResponse.CustomersInCasinoResult;
                // console.log(final_result);//get the value from the respanse object
                res.json((final_result));
            });
        }).catch(error => {
            console.log(error)
        });
}


async function getActiveVoucher({ number, res, computer }) {
    var xml = `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
    <Body>
        <GetActiveVouchersForCustomer xmlns="http://www.IntelligentGaming.co.uk">
            <!-- Optional -->
            <request>
                <ComputerName xmlns="IG.Cms.Gateway.DataContracts">win10-tech</ComputerName>
                <CustomerNumber xmlns="IG.Cms.Gateway.DataContracts">#number</CustomerNumber>
            </request>
        </GetActiveVouchersForCustomer>
    </Body>
</Envelope>`;
    xml = xml.replace('#computer', computer).replace('#number', number);
    axios.post(url, xml,
        {
            headers:
            {
                'Content-Type': 'text/xml',
                SOAPAction: "http://www.IntelligentGaming.co.uk/LoyaltyKioskService/GetActiveVouchersForCustomer"
            }
        }).then(data => {

            var parseString = require('xml2js').parseString; //here i'm using a library colled xml2js to parse the respanse from xml to js object
            var stripNS = require('xml2js').processors.stripPrefix;
            const options = {
                tagNameProcessors: [stripNS],
                explicitArray: false,
            };


            parseString(data.data, options, function (err, result) {
                let final_result = result.Envelope.Body.GetActiveVouchersForCustomerResponse.GetActiveVouchersForCustomerResult
                console.log(final_result);//get the value from the respanse object
                if (final_result.Vouchers.CrmVoucher.DisplayName != null && final_result.Vouchers.CrmVoucher.Value != null) {
                    res.json({
                        "$": {
                            "xmlns:a": "IG.Cms.Gateway.DataContracts",
                            "xmlns:i": "http://www.w3.org/2001/XMLSchema-instance"
                        },
                        "FailureReason": {
                            "$": {
                                "i:nil": "true"
                            }
                        },
                        "Success": "false",
                        "Vouchers": {
                            "CrmVoucher": [
                                {
                                    "CanBeRedeemedAtPos": final_result.Vouchers.CrmVoucher.CanBeRedeemedAtPos,
                                    "DisplayName": final_result.Vouchers.CrmVoucher.DisplayName,
                                    "IsValid": "true",
                                    "Value": final_result.Vouchers.CrmVoucher.Value,
                                    "VoucherId": final_result.Vouchers.CrmVoucher.VoucherId,
                                    "VoucherType": final_result.Vouchers.CrmVoucher.VoucherType
                                },

                            ]
                        }
                    })

                } else {
                    res.json((final_result));
                }


            });
        }).catch(error => {
            res.json({
                "$": {
                    "xmlns:a": "IG.Cms.Gateway.DataContracts",
                    "xmlns:i": "http://www.w3.org/2001/XMLSchema-instance"
                },
                "FailureReason": {
                    "$": {
                        "i:nil": "true"
                    }
                },
                "Success": "false",
                "Vouchers": ""
            })
        });
}


module.exports = {
    getActiveVoucher: getActiveVoucher,
    getCustomerInCasino:getCustomerInCasino,
    getCustomerImage:getCustomerImage,
}

