 /**
   * GovBot - Set the origin for the Bot which will be used to retrieve the configs.
   */
  async function hook() {
    await bp.kvs.forBot(botId).set('origin', 'K')
    bp.logger.info('Hook > after boot mount > Koeln > set origin')
  }

  return hook()