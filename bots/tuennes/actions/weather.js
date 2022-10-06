  /**
   * Get weather detail informations
   * @title OpenWeatherMap Onecall Weather
   * @category Weather
   * @author Hermann Holz
   * @version 1.0
   */
  const myAction = async () => {
    const axios = require('axios')
    const dayjs = require('dayjs')

    var customParseFormat = require('dayjs/plugin/customParseFormat')
    dayjs.extend(customParseFormat)

    // JSON-Variable für die Übergabe an das Frontend.
    var weatherdata = {}

    // checkInput.geolocation -> Eingegebenr Ort mit lat/long Koordinaten. 
    // Bei fehlender oder nicht identifizierbarer Ortseingabe wird der konfigurierte Default Ort (Köln) übermittelt. 
    // Bei Fehler in der Ortsübermittlung ist der Wert = null 
    // checkInput.rqTime -> Eingegebenes Datum. Ansonsten = null
    // checkInput.daydiff -> Differenz des eingegebenen Tags zu heute. 
    // Negativer Wert = Vergangenheit. Positiver Wert = Zukunft. 
    // Historische Wetterdaten können nicht ermittelt werden. Zukünftige Vorhersagen max. 7 Tage in der Zukunft.
    // checkInput.connError -> Fehler bei der Kommunikation mit der OpenweatherApi
    const checkInput = {}
    
    // ist die temporäre Variable mit dem Response von https://api.mapbox.com/geocoding gefüllt?
    // wurde ein eingegebenener Ort gefunden?
    if (temp.places.body.features.length > 0) {
      checkInput.geolocation = temp.places.body.features.find(feature => feature.place_type.includes('place'))
      bp.logger.info('geolocation: ' + checkInput.geolocation)
     }
    else {
      checkInput.geolocation = null
      bp.logger.info('Der eingegebene Ort konnte nicht gefunden werden. Ortseingabe: ' + error)
    }
    
    // Wurde ein Datum eingegeben? Beispiel: wie wird das wetter am 13.04.2022
    if (event.nlu.entities.find(name => name.name == 'time')) {
      checkInput.rqTime = event.nlu.entities.find(name => name.name == 'time')
      let checkResult = checkdate(checkInput)
      checkInput.daydiff = checkResult.daydiff
      checkInput.day = checkResult.day
    }
    else {
      checkInput.daydiff = 0
      checkInput.day = new Date(Date.now())
    }

    // Prüfung, ob das eingegeben Datum im Toleranzbereich liegt 
    // Formatierung des Datums für die Überschrift der WeatherCard
    if (checkInput.daydiff > -1 && checkInput.daydiff < 8) {
      temp.myDate = dayjs(checkInput.day.getFullYear() + '-' + (checkInput.day.getMonth() + 1) + '-' + checkInput.day.getDate()).format('DD.MM.YYYY')
      bp.logger.info('Suchdatum: ' + temp.myDate)
    }

    // Abfrage Openweathermap
    checkInput.connError = false
    if (checkInput.geolocation && (checkInput.daydiff > -1 && checkInput.daydiff < 8)) {
      const apiToken = 'xxxxxxxxxxxxxxxxxxxxxx'
      const [long, lat] = checkInput.geolocation.center
      bp.logger.info('Koordinaten: ' + checkInput.geolocation.center)

      let response
      try {
        response = await axios.get(
          'https://api.openweathermap.org/data/2.5/onecall?lat=' + lat + '&lon=' + long + '&appid=' + apiToken + '&units=metric&lang=de'
        )
        .catch(function (error) {
          checkInput.connError = true
          bp.logger.info('Die Anfrage an den Wetterdienst ist fehlgeschlagen. Error: ' + error)
          //throw error
        })
      }
      catch (error) {
        checkInput.connError = true
        bp.logger.info('Die Anfrage an den Wetterdienst ist fehlgeschlagen. Error: ' + error)
        //throw error
      }
      // handle success
      if (checkInput.connError == false){
        weatherdata = show(response, checkInput, weatherdata)
      }
    } 

    // -------------------------------------------------------------
    // output to Frontend
    // --------------------------------------------------------
    if (checkInput.connError == false && checkInput.geolocation && (checkInput.daydiff > -1 && checkInput.daydiff < 8)){
      weatherdata = {
        error: false,
        errorText: '',
        ... weatherdata,
      }
    }
    else {
      let errorText = getErrorText(checkInput);
      weatherdata = {
        error: true,
        errorText: errorText
      }
    }
    console.log("weatherdata: " + JSON.stringify(weatherdata))

    await bp.events.replyToEvent(event, [weatherdata])
    bp.logger.info('weather card sent to frontend')
    
    
    // *** Functions ***
    // Überprüfung des Datums
    function checkdate(checkInput){
      const checkResult = {}
      bp.logger.info('Zeiteingabe: ' + checkInput.rqTime.data.value)

      let customDate = dayjs(checkInput.rqTime.data.value, 'YYYY-MM-DD')
      bp.logger.info('customDate: ' + customDate)
      inputDate = String(dayjs(customDate).year()).padStart(4, '0') + String(dayjs(customDate).month()).padStart(2, '0') + String(dayjs(customDate).date()).padStart(2, '0')
      bp.logger.info('inputDate: ' + inputDate)
      nowDate = String(dayjs().year()).padStart(4, '0') + String(dayjs().month()).padStart(2, '0') + String(dayjs().date()).padStart(2, '0')
      bp.logger.info('nowDate: ' + nowDate)

      checkResult.daydiff = parseInt(inputDate, 10) - parseInt(nowDate, 10)

      if (checkResult.daydiff > -1 && checkResult.daydiff < 8) {
        checkResult.day = new Date(checkInput.rqTime.data.value)
      }

      return checkResult
    }

    // Ermittlung des Text für die Fehlerausgabe im Frontend
    function getErrorText(checkInput) {
        let text = 'Die Anfrage an den Wetterdienst ist leider fehlgeschlagen.'
        if (checkInput.geolocation == null) {
          text = 'Der gesuchte Ort konnte leider nicht gefunden werden.'

        }
        if (checkInput.daydiff < 0) {
          text = 'Das gesuchte Datum liegt in der Vergangenheit. Historische Wetterdaten kann ich leider nicht ermitteln.'

        }
        if (checkInput.daydiff > 7) {
          text = 'Das gesuchte Datum liegt zu weit in der Zukunft. Ich kann nur Wetterdaten für maximal eine Woche im Voraus ermitteln.'

        }
        return text;
    }

    // make weather card
    function show(response, checkInput, weatherdata) {
      const weatherResp = response.data;
      // bp.logger.info('response.data: ' + JSON.stringify(response.data))

      // Make weather card with forecast 4 hours for current day
      // Or make weathercard for forecast day without hourly forcast
      
      if (checkInput.daydiff == 0){
        const location = checkInput.geolocation.text ? checkInput.geolocation.text + ' am ' + temp.myDate : temp.city + ' am ' + temp.myDate;
        const currentTemperature = Math.round(weatherResp.current.temp);
        const minTemperature = Math.round(weatherResp.daily[0].temp.min);
        const maxTemperature = Math.round(weatherResp.daily[0].temp.max);
        let alternativeText = `Das aktuelle Wetter in ${location}:\n ${response.data.current.weather[0].description}`;
        alternativeText = alternativeText + `\nDie aktuelle Temperatur beträgt ${currentTemperature}°`;
        alternativeText = alternativeText + `\nHöchsttemperatur:  ${maxTemperature}° / Tiefsttemperatur: ${minTemperature}°`;
        weatherdata = {
          type: 'component',
          typeName: 'weather-with-forecast',
          location: location,
          currentTemperature: currentTemperature,
          minTemperature: Math.round(weatherResp.daily[0].temp.min),
          maxTemperature: Math.round(weatherResp.daily[0].temp.max),
          windSpeed: Math.round(weatherResp.daily[0].wind_speed),
          rainProbability: Math.round(weatherResp.daily[0].humidity),
          icon: weatherResp.current.weather[0].icon,
          forecast: weatherResp.hourly
          .filter(forecastweather => forecastweather.dt > weatherResp.current.dt)
            .slice(1, 5)
            .map(forecastweather => ({
              icon: forecastweather.weather[0].icon,
              temperature: Math.round(forecastweather.temp),
              timestamp: new Date(forecastweather.dt * 1000).toISOString()
          })),
          alternativeText: alternativeText
        }
      }
      else {
        const location = checkInput.geolocation.text ? checkInput.geolocation.text + ' am ' + temp.myDate : temp.city + ' am ' + temp.myDate;
        const currentTemperature = Math.round(weatherResp.daily[checkInput.daydiff].temp.day);
        const minTemperature = Math.round(weatherResp.daily[checkInput.daydiff].temp.min);
        const maxTemperature = Math.round(weatherResp.daily[checkInput.daydiff].temp.max);
        let alternativeText = `Das Wetter in ${location}:\n${weatherResp.daily[checkInput.daydiff].weather[0].description}`;
        alternativeText = alternativeText + `\nDie Tagestemperatur beträgt ${currentTemperature}°`;
        alternativeText = alternativeText + `\nHöchsttemperatur: ${maxTemperature}° / Tiefsttemperatur: ${minTemperature}°`;
        weatherdata = {
          type: 'component',
          typeName: 'weather-without-forecast',
          location: location,
          currentTemperature: currentTemperature,
          minTemperature: minTemperature,
          maxTemperature: maxTemperature,
          windSpeed: Math.round(weatherResp.daily[checkInput.daydiff].wind_speed),
          rainProbability: Math.round(weatherResp.daily[checkInput.daydiff].humidity),
          icon: weatherResp.daily[checkInput.daydiff].weather[0].icon,
          alternativeText: alternativeText
        }
      }

      // Alternativtext für die Anbindung an externe UI. Übergabe über temp-Varaiable
      temp.alternativeText = weatherdata.alternativeText;

      // Format time for weather forecast for the next 4 hours
      if (checkInput.daydiff == 0) {
        for (var i = 0; i < 4; i++) {
          let x = weatherdata.forecast[i].timestamp.indexOf("T");
          let tempTimeStamp = Number(weatherdata.forecast[i].timestamp.slice(x+1,x+3))
          tempTimeStamp = tempTimeStamp + 1
          if (tempTimeStamp == 24) {
            tempTimeStamp = 0
          }
          weatherdata.forecast[i].timestamp = tempTimeStamp.toString()
        }
      }
      return weatherdata;
    }
  }
  return myAction()