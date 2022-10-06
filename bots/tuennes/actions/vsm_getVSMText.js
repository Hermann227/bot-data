  const axios = require('axios')
  const mapApiURL = 'https://sg.geodatenzentrum.de/gdz_geokodierung__14c4db63-44b2-b507-b42f-160b2cfa13d6/geosearch?'
  /**
   * Send search query and Laika code to API
   * @title Get Values By Laika Code (VSM API)
   * @category VSM
   * @author Frank Dase
   * @query text
   * @key text
   */
  const VSMUrl = 'https://api.vsm.nrw/suche'
  const regionKey = '053150000000' // Köln
  temp.noResult = 'false'

  const myAction = async (name, value) => {
    let mapResponse
    try {
      if (args.query != '' && event.payload.Schluessel != '') {
        args.query = encodeURI(args.query)
        bp.logger.info('vsm_getVSMText args', args)
        bp.logger.info('vsm_getVSMText schlüssel', event.payload.Schluessel)

        const response = await axios.get(
          VSMUrl +
            `?suchbegriff=${args.query}&leistungsSchluessel=${event.payload.Schluessel}&regionalSchluessel=${regionKey}&anzahlOE=30`
        )
        bp.logger.info(
          'vsm_getVSMText -> QuerryUrl',
          VSMUrl +
            `?suchbegriff=${args.query}&leistungsSchluessel=${event.payload.Schluessel}&regionalSchluessel=${regionKey}&anzahlOE=30`
        )
        //bp.logger.info('vsm_getVSMText response', response)
        //bp.logger.info('vsm_getVSMText Leistungsdaten', response.data.daten.leistungen.daten)

        if (response && response.status === 200 && event.payload.Schluessel) {
          // ---------------------------------------------------------
          // Part from Cognigy
          // ---------------------------------------------------------
          if (response.data.daten.leistungen.daten.length) {
            const competences = response.data.daten.leistungen.daten || []
            let uniqueCompetences = []

            for (const competence of competences) {
              let index = 0
              let isRepeatedCompetenceIndex = isRepeatedCompetence(competence)

              if (isRepeatedCompetenceIndex !== -1) {
                const newContactDetails = createContactDetails(competence.organisationseinheit[0])

                uniqueCompetences[isRepeatedCompetenceIndex].addresses.data.elements.push(newContactDetails)
                uniqueCompetences[isRepeatedCompetenceIndex].addresses.badgeContent++
                uniqueCompetences[isRepeatedCompetenceIndex].mapData.push(
                  await createMapDetails(competence.organisationseinheit[0])
                )
              } else {
                const formattedCompetence = {
                  details: createHtmlBlock(competence.leistung),
                  costs: createCostsBlock(competence.leistung),
                  addresses: createAdressBlock(createContactDetails(competence.organisationseinheit[0])),
                  mapData: [await createMapDetails(competence.organisationseinheit[0])],
                  index: index,
                  description: competence.leistung.leistungsbezeichnung
                }
                let amountOfAddresses = formattedCompetence.addresses.data.elements.length
                formattedCompetence.addresses.badgeContent = amountOfAddresses
                uniqueCompetences.push(formattedCompetence)
              }
            }
            temp.formattedCompetences = uniqueCompetences
            session.formattedCompetences = uniqueCompetences

            /*Help Functions*/
            function isRepeatedCompetence(candidate) {
              let foundIndex = uniqueCompetences.findIndex(
                element => element.description == candidate.leistung.leistungsbezeichnung
              )
              return foundIndex
            }

            function createContactDetails(organisation) {
              const findCommunicationOfType = (type, communications) => {
                const communication = communications.find(element => element.kanal === type)
                if (typeof communication === 'undefined') {
                  return {}
                }
                return communication
              }

              return {
                name: organisation.name,
                phone: findCommunicationOfType('telefon', organisation.kommunikation).kennung || '',
                fax: findCommunicationOfType('fax', organisation.kommunikation).kennung || '',
                emailAddress: findCommunicationOfType('email', organisation.kommunikation).kennung || '',
                showMap: false,
                street: organisation.anschrift[0].strasse,
                houseNumber: organisation.anschrift[0].hausnummer,
                postcode: organisation.anschrift[0].postleitzahl,
                city: organisation.anschrift[0].ort
              }
            }

            async function createMapDetails(organisation) {
              const url =
                mapApiURL +
                `query=strasse:(` +
                `${organisation.anschrift[0].strasse})+haus:${organisation.anschrift[0].hausnummer}+plz:${organisation.anschrift[0].postleitzahl}`

              bp.logger.info('vsm_getVSMText geodata query', url)

              try {
                mapResponse = await axios.get(encodeURI(url))
                if (mapResponse.status === 200 && mapResponse.data && mapResponse.data.features.length) {
                  bp.logger.info('vsm_getVSMText geodata result', mapResponse.data.features[0])
                  return mapResponse.data.features[0]
                }
                return
              } catch (error) {
                if (error.response && error.response.status === 401) {
                  throw new Error('Unable to get map data. Request failed with status code 401.')
                }
                throw error
              }
            }

            function createHtmlBlock(leistung) {
              const beschreibungDetails =
                (leistung.kurztext.length && leistung.kurztext) || (leistung.volltext.length && leistung.volltext) || ''

              let serviceBlock = {
                type: 'block',
                blockType: 'html',
                title: 'Beschreibung',
                data: {
                  elements: [
                    {
                      html: `<b> ${leistung.leistungsbezeichnung} </b>` + '<br/>' + beschreibungDetails
                    }
                  ]
                }
              }
              if (leistung.urlOnlineDienst && leistung.urlOnlineDienst !== '') {
                serviceBlock.data.elements.push({
                  html: `<b> <a href="${leistung.urlOnlineDienst}" target="_blank" > Weitere Infos</a> </b>`
                })
              }
              return serviceBlock
            }

            function createCostsBlock(leistung) {
              if (leistung.kosten && leistung.kosten !== '') {
                return {
                  type: 'block',
                  blockType: 'html',
                  title: 'Kosten',
                  data: {
                    elements: [
                      {
                        html: leistung.kosten
                      }
                    ]
                  }
                }
              }
            }

            function createAdressBlock(contactDetails) {
              return {
                type: 'block',
                blockType: 'address',
                title: 'Zuständigkeiten',
                badgeContent: contactDetails.length,
                data: { elements: [contactDetails] }
              }
            }

            // ----------------------------------------------------
            // build final output
            // ----------------------------------------------------
            let cardActions = []
            temp.vsmCardActions = {}
            /*let webTrefferCollection = tmp.vsmResults.result.daten.webTreffer.daten || [];

            if (!Array.isArray(webTrefferCollection)) {
              webTrefferCollection = [webTrefferCollection];
            }

            cc.vsmResultsList = webTrefferCollection.map(result => ({
              type: 'hyperlink',
              href: result.url,
              text: result.titel,
            }));*/
            bp.logger.info('vsm_getVSMText competences', temp.formattedCompetences)

            temp.formattedCompetences.forEach(competence => {
              let accordionElements = []
              let mapBlock = {}
              let markers = []
              let center = new Object()
              bp.logger.info('vsm_getVSMText -> competences', competence)
              // Generiere Karten Böbbels
              competence.mapData.forEach(mapDataElement => {
                bp.logger.info('vsm_getVSMText -> mapDataElement', mapDataElement)
                if (
                  mapDataElement &&
                  mapDataElement.geometry &&
                  mapDataElement.geometry.coordinates &&
                  mapDataElement.geometry.coordinates.length == 2
                ) {
                  bp.logger.info(
                    'vsm_getVSMText -> center',
                    !(Object.keys(center).length && center.constructor === Object)
                  )
                  if (!(Object.keys(center).length && center.constructor === Object)) {
                    center = {
                      lat: mapDataElement.geometry.coordinates[1],
                      lon: mapDataElement.geometry.coordinates[0]
                    }
                  }

                  markers.push({
                    lat: mapDataElement.geometry.coordinates[1],
                    lon: mapDataElement.geometry.coordinates[0]
                  })
                }
              })
              bp.logger.info('center', center)
              mapBlock = {
                type: 'block',
                blockType: 'map',
                title: 'Karte',
                data: {
                  elements: [
                    {
                      center: {
                        lat: center.lat,
                        lon: center.lon
                      },
                      zoom: 16,
                      markers: markers
                    }
                  ]
                }
              }

              if (competence.details) accordionElements.push(competence.details)
              if (competence.costs) accordionElements.push(competence.costs)
              if (competence.addresses) accordionElements.push(competence.addresses)
              accordionElements.push(mapBlock)

              cardActions.push({
                type: 'card',
                cardType: 'accordion',
                title: competence.description,
                data: {
                  elements: [...accordionElements]
                }
              })
            })
            // -------------------------------------------------------------
            // output to Frontend
            // -------------------------------------------------------------
            const foundResult = await bp.cms.renderElement(
              'builtin_text',
              {
                type: 'text',
                text: 'Dazu habe ich folgendes gefunden:'
              },
              event
            )
            //let output = { actions: cardActions }

            await bp.events.replyToEvent(event, foundResult)

            let accTitle = ''
            let accContent = ''
            if (typeof session.formattedCompetences != undefined) {
              accTitle = session.formattedCompetences[0].details.title
              if (typeof session.formattedCompetences[0].details.data.elements != undefined) {
                session.formattedCompetences[0].details.data.elements.forEach(element => {
                  accContent = accContent + element.html
                })
              }
              var payloads = null
              payloads = await bp.cms.renderElement(
                'cgn_simplecard',
                {
                  type: 'text',
                  title: accTitle,
                  text: accContent
                },
                event
              )
              await bp.events.replyToEvent(event, payloads)

              accTitle = ''
              accContent = ''
              accTitle = session.formattedCompetences[0].costs.title
              if (typeof session.formattedCompetences[0].costs.data.elements != undefined) {
                session.formattedCompetences[0].costs.data.elements.forEach(element => {
                  accContent = accContent + element.html
                })
              }

              payloads = await bp.cms.renderElement(
                'cgn_simplecard',
                {
                  type: 'text',
                  title: accTitle,
                  text: accContent
                },
                event
              )
              await bp.events.replyToEvent(event, payloads)

              accTitle = ''
              accContent = ''
              accTitle = session.formattedCompetences[0].addresses.title
              if (typeof session.formattedCompetences[0].addresses.data.elements != undefined) {
                session.formattedCompetences[0].addresses.data.elements.forEach(element => {
                  accContent =
                    accContent +
                    '<b>' +
                    element.name +
                    '</b><br/><br/>' +
                    element.street +
                    ' ' +
                    element.houseNumber +
                    '<br/>' +
                    element.postcode +
                    ' ' +
                    element.city +
                    '<br/>' +
                    'Telefon: ' +
                    element.phone +
                    '<br/>' +
                    'Fax: ' +
                    element.fax +
                    '<br/>' +
                    'E-Mail: <a href="mailto:' + element.emailAddress + '">' +
                    element.emailAddress + '</a>'
                })
              }

              payloads = await bp.cms.renderElement(
                'cgn_simplecard',
                {
                  type: 'text',
                  title: accTitle,
                  text: accContent
                },
                event
              )
              await bp.events.replyToEvent(event, payloads)
            }
            // var payloads = null
            // payloads = await bp.cms.renderElement(
            //   'cgn_accordion',
            //   {
            //     type: 'text',
            //     title: accTitle,
            //     text: accContent
            //   },
            //   event
            // )
            // await bp.events.replyToEvent(event, payloads)
            //await bp.events.replyToEvent(event, [output])
          } else {
            const payloads = await bp.cms.renderElement(
              'builtin_text',
              {
                type: 'text',
                text: 'Es wurde keine Details zu dieser Leistung gefunden'
              },
              event
            )
            await bp.events.replyToEvent(event, payloads)
          }
        } else {
          temp.noResult = 'true'
        }
      } else {
        const payloads = await bp.cms.renderElement(
          'builtin_text',
          {
            type: 'text',
            text: 'Da scheint jetzt irgendwas schiefgelaufen zu sein, versuchen wir es noch einmal.'
          },
          event
        )
        await bp.events.replyToEvent(event, payloads)
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        throw new Error('API Response Fehler?')
      }

      throw error
    }
  }

  return myAction(args.name, args.value)