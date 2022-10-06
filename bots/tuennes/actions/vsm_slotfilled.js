  /**
   * Use slot if filled, else use complete user entry as query
   * @title Is Slot filled?
   * @category VSM
   * @author Frank Dase
   */
  const myAction = async () => {
    if (event.nlu.slots.vsmQuery.value !== '') {
      temp.vsmQuery = encodeURI(event.nlu.slots.vsmQuery.value)
    } else {
      temp.vsmQuery = encodeURI(event.payload.text)
    }
    bp.logger.info('search for ', temp.vsmQuery)
  }

  return myAction()