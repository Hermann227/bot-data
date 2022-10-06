  /**
   * Small description of your action
   * @title The title displayed in the flow editor
   * @category Custom
   * @author Your_Name
   * @param {string} name - An example string variable
   * @param {any} value - Another Example value
   */
  const axios = require('axios')

  const myAction = async (name, value) => {
    bp.logger.info('webchatCustomId: ' + event.state.user.webchatCustomId)
    let connError = 'false'
    let response

    if (event.state.user.webchatCustomId) {
      user.customUserId = event.state.user.webchatCustomId
      try {
        response = await axios
          .post('http://localhost:9090/get/user', {
            userlogin: user.customUserId
          })
          .catch(function(error) {
            connError = 'true'
            bp.logger.info('Die Anfrage ist fehlgeschlagen. Error: ' + error)
            //throw error
          })
      } catch (error) {
        connError = 'true'
        bp.logger.info('Die Anfrage ist fehlgeschlagen. Error: ' + error)
        //throw error
      }
      // handle success
      if (connError == 'false') {
        // for(let key in response) {
        //   bp.logger.info(key + ":", response[key]);
        // }
        bp.logger.info('response: ' + JSON.stringify(response.data))
        user.attributes = response.data.response
        bp.logger.info('vorname: ' + user.attributes.user_vorname)
      }
    }
  }

  return myAction(args.name, args.value)