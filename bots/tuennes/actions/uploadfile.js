  /**
   * Show upload file dialog
   * @title Upload File Dialog
   * @category Upload
   * @author Hermann Holz
   */
  const myAction = async () => {
    var uploadfile = {
      type: 'component',
      typeName: 'upload-file'
    }
    // -------------------------------------------------------------
    // output to Frontend
    // -------------------------------------------------------------
    uploadfile = {
      error: false,
      errorText: '',
      ...uploadfile
    }
    await bp.events.replyToEvent(event, [uploadfile])
    bp.logger.info('uploadiflecard card sent to frontend')
  }

  return myAction()