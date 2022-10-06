  /**
   * Get water level data and send them to the frontend
   * @title Rheinpegel
   * @category Water Level
   * @author Hermann Holz
   */
  const myAction = async () => {
    const axios = require('axios')
    // set default station
    const defaultStation = 'Köln'
    const encodedDefaultStation = encodeURI(defaultStation)

    // prepare water level request
    const serviceURL = 'http://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/'
    const overviewQuery = '/W.json?includeCurrentMeasurement=true'
    const pegelstandOverviewURL = serviceURL + encodedDefaultStation + overviewQuery
    const historyQuery = '/W/measurements.json?start=P5D'
    const pegelstandHistoryURL = serviceURL + encodedDefaultStation + historyQuery
    let pegelstandApiResponseOverview
    let pegelstandApiResponseHistory
    let connError = false

    try {
      bp.logger.info('get pegelstand overview data')
      pegelstandApiResponseOverview = await axios.get(pegelstandOverviewURL)
     } catch (error) {
      connError = true
     }

    try {
      bp.logger.info('get pegelstand history data')
      pegelstandApiResponseHistory = await axios.get(pegelstandHistoryURL)
     } catch (error) {
      connError = true
    }

    if (pegelstandApiResponseOverview.data) {
      bp.logger.info('overview', pegelstandApiResponseOverview.data)

      // Calculate the average water level
      bp.logger.info('Calculate the average water level', pegelstandApiResponseHistory.data.length)
      const currentMeasurement = pegelstandApiResponseOverview.data.currentMeasurement
      let intervalls = [];

      let tempTimeStampOld = 0;
      let addValues = 0;
      let tempIndex = 0;
   
      for (var i = 0; i < pegelstandApiResponseHistory.data.length; i++) {
        tempTimeStamp = pegelstandApiResponseHistory.data[i].timestamp;
        tempTimeStamp = tempTimeStamp.substring(0,10)
        let tempValue = pegelstandApiResponseHistory.data[i].value;
        if (tempTimeStampOld == 0) {
          addValues = tempValue;
          tempTimeStampOld = tempTimeStamp
        }
        else if (tempTimeStamp ==  tempTimeStampOld){
          addValues = addValues + tempValue;
        }
        else {
          bp.logger.info('addValues', Math.round(addValues / (i - tempIndex)));
          intervalls.push(Math.round(addValues / (i - tempIndex)));
          tempIndex = i;
          addValues = tempValue;
          tempTimeStampOld = tempTimeStamp;
        }
      }
      bp.logger.info('addValues', Math.round(addValues / (i - tempIndex)));
      intervalls.push(Math.round(addValues / (i - tempIndex)));

      if (intervalls.length == 6) {
        for (var i = 0; i < intervalls.length - 1; i++) {
          intervalls[i] = intervalls[i+1]
        }
      }

      // Set Trend
      let strTrend = ''
      switch (currentMeasurement.trend) {
        case 1:
          strTrend = 'steigend'
          break
        case 0:
          strTrend = 'gleichbleibend'
          break
        case -1:
          strTrend = 'fallend'
          break
        default:
          strTrend = 'unbekannt'
      }

      // Prepare the alternative Text for IM Channels
      const unit = pegelstandApiResponseOverview.data.unit
      temp.title = 'Der aktuelle Pegelstand für ' + defaultStation
      temp.alternativeText =
        'Pegelstand: <b>' +
        currentMeasurement.value +
        unit +
        '</b><br/>Tendenz: <b>' +
        strTrend +
        '</b>'

      var pegelstand = {
        type: 'component',
        typeName: 'water-level',
        location: defaultStation,
        unit: unit,
        currentWaterLevel: currentMeasurement.value,
        trend: strTrend,
        intervallLevel: intervalls,
        // intervall2Level: intervalls[1],
        // intervall3Level: intervalls[2],
        // intervall4Level: intervalls[3],
        // intervall5Level: intervalls[4],
        alternativeText: temp.alternativeText
      }
      // -------------------------------------------------------------
      // output to Frontend
      // -------------------------------------------------------------
      if (connError == false){
        pegelstand = {
          error: false,
          errorText: '',
          ... pegelstand,
        }
      }
      else {
        let errorText = 'Bei der Abfrage des aktuellen Pegelstands ist leider ein Fehler aufgetreten';
        pegelstand = {
          error: true,
          errorText: errorText
        }
      }
      await bp.events.replyToEvent(event, [pegelstand])
      bp.logger.info('pegelstandcard card sent to frontend')
    }
  }

  return myAction()