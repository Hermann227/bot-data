
  /**
   * Small description of your action
   * @title The title displayed in the flow editor
   * @category Custom
   * @author Your_Name
   * @param {string} name - An example string variable
   * @param {any} value - Another Example value
   */
  const myAction = async (name, value) => {
    
    // -------------------------------------------------------------
      // output to Frontend
      // --------------------------------------------------------
      const payloads = await bp.cms.renderElement('cgn_simplecard', { type: 'text', title: 'Call Action Server', text: 'Name: ' + name + ' Value: ' + value }, event)
      await bp.events.replyToEvent(event, payloads)
    
  }

  return myAction(args.name, args.value)