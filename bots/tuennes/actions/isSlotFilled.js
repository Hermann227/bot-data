  /**
   * param 'query', fill with session.slots.vsmQuery.source
   * @title isSlotFilled
   * @category General
   * @author Frank Dase
   * @param {string} query - search query for API
   */
  const myAction = async (name, value) => {
    const defaultCity = 'Köln'
    bp.logger.info('slot', args.query)
    temp.slotValue = ''
    temp.slotFilled = 'false'
    if (args.query !== '') {
      temp.city = args.query
      temp.slotFilled = 'true'
      temp.slotValue = encodeURI(args.query)
    } 
    else if(event.nlu.intent.name ==='weather'){
      temp.city = defaultCity
      temp.slotFilled = 'true'
      temp.slotValue = encodeURI(defaultCity)
      }
      else{
      temp.slotFilled = 'true'
      temp.slotValue = encodeURI(event.payload.text)
      }
    bp.logger.info('payload', temp.slotValue)
  }

  return myAction(args.name, args.value)