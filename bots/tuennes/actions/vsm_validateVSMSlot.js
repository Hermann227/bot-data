  /**
   * param 'query', fill with session.slots.vsmQuery.source
   * @title VSM Slot Validator
   * @category VSM
   * @author Frank Dase
   * @param {string} query - search query for VSM API
   */
  const myAction = async (name, value) => {
    bp.logger.info('slot', args.query)

    temp.slotFilled = 'false'
    if (args.vsmQuery !== '') {
      temp.slotFilled = 'true'
      temp.vsmQuery = encodeURI(args.vsmQuery)
    }
  }

  return myAction(args.name, args.value)