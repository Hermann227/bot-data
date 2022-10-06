  /**
   * VSM Leikasuche
   * @title VSM Leikasuche
   * @category VSM
   * @author Frank Dase
   */

  const formatService = service => {
    return {
      displayText: service.Bezeichnung,
      dispatchText: service.Bezeichnung,
      payload: {
        Schluessel: service.Schluessel,
        Leistungskennung: service.Leistungskennung,
        Leistungsgruppierung: service.Leistungsgruppierung,
        Verrichtung: service.Verrichtung,
        Verrichtungdetail: service.Verrichtungdetail
      }
    }
  }

  const formatChildrenServices = children => {
    return Object.keys(children)
      .filter(key => children[key].leistung !== undefined)
      .map(key => {
        let formattedService = formatService(children[key].leistung)
        const serviceHasNoChildren = Array.isArray(children[key].children) && !children[key].children.length
        if (serviceHasNoChildren) {
          const displayText =
            children[key].leistung.Verrichtungdetail ||
            children[key].leistung.Verrichtung ||
            children[key].leistung.Leistungskennung
          formattedService = {
            ...formattedService,
            displayText
          }
        }
        if (Object.keys(children[key].children).length) {
          Object.assign(formattedService, { elements: formatChildrenServices(children[key].children) })
        }
        return formattedService
      })
  }

  const getTreeForLeikaService = (wholeTree, code, level = 4) => {
    /**
     * structure of Leika Codes:
     *  - Length 14 characters
     *  - Starts always with 99
     *  - after 99 the code consists of 4 blocks with each 3 digits
     */
    code = code.toString()
    let parentCode = transformLeikaCode(code, level - 1)
    if (level < 1 || !wholeTree[parentCode]) {
      return []
    }

    let children = Object.keys(wholeTree[parentCode].children).map(key => wholeTree[parentCode].children[key])
    console.log(JSON.stringify({ children }))
    if (parentCode !== code) {
      children = getTreeForLeikaService(wholeTree[parentCode].children, code, level - 1)
    }
    return children
  }
  const transformLeikaCode = (code, level) => code.slice(0, -(level * 3)) + '0'.repeat(level * 3)

  const myAction = async () => {
    temp.originalInputText = event.payload.text
    temp.foundServices = 'true'
    if (temp.response && temp.response.status === 200 && temp.response.body && temp.response.body.length > 0) {
      temp.leikacode = temp.response.body.find(result => result.confidence >= 0.95)
      temp.leikaSuggestions = temp.response.body.filter(result => result.confidence >= 0.05)
      temp.leikaConfidenceCertainty = determineLeikaConfidenceFromResponse(temp.response.body)
      const leikaSuggestionsList = temp.leikaSuggestions.map(suggestion => ({
        ...formatService(suggestion)
      }))

      if (temp.leikaConfidenceCertainty === 'high') {
        event.payload.text = temp.leikacode.Bezeichnung
        event.payload.Schluessel = temp.leikacode.Schluessel
        event.payload.Leistungskennung = temp.leikacode.Leistungskennung
        event.payload.Leistungsgruppierung = temp.leikacode.Leistungsgruppierung
        event.payload.Verrichtung = temp.leikacode.Verrichtung
        event.payload.Verrichtungdetail = temp.leikacode.Verrichtungdetail
      } else if (temp.leikaConfidenceCertainty == 'moderate') {
        // Leistungen gefunden

        // Found Result Textbubble
        const payloads = await bp.cms.renderElement(
          'builtin_text',
          {
            type: 'text',
            text: 'Passend zu deinem Suchbegriff habe ich folgende Leistungen gefunden:'
          },
          event
        )

        await bp.events.replyToEvent(event, payloads)
        /*
                // Emulator Link List output
                const emulatorOutput = await bp.cms.renderElement(
                  'custom_linklist',
                  {
                    title: 'Leistungen',
                    actions: [
                      {
                        type: 'card',
                        cardType: 'hierarchyList',
                        alternativeText: 'Ich habe Einträge im Leistungskatalog gefunden',
                        data: {
                          elements: leikaSuggestionsList
                        }
                      }
                    ]
                  },
                  event
                )
                await bp.events.replyToEvent(event, emulatorOutput)
        */
        // output in chat frontend

        temp.leikaCardData = {
          title: 'Leistungen',
          actions: [
            {
              type: 'card',
              cardType: 'hierarchyList',
              alternativeText: 'Ich habe Einträge im Leistungskatalog gefunden',
              data: {
                elements: leikaSuggestionsList
              }
            }
          ]
        }
        await bp.events.replyToEvent(event, [temp.leikaCardData])
      } else {
        //Confidence is too low
        temp.foundServices = 'false'
      }

      //
    } else {
      //Did not get any response
      temp.foundServices = 'false'
    }

    temp.response = null
    if (temp.leikaCardData) {
      // bp.logger.info(temp.leikaCardData)
    }
  }

  function determineLeikaConfidenceFromResponse(responseBody) {
    temp.leikacode = responseBody.find(result => result.confidence >= 0.95)
    if (temp.leikacode !== undefined) {
      return 'high'
    }

    temp.leikaSuggestions = responseBody.filter(result => result.confidence >= 0.05)
    if (temp.leikaSuggestions.length) {
      return 'moderate' // 0.05 <= score < 0.95
    }
    return 'default'
  }

  return myAction()