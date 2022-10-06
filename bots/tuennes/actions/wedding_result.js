  /**
   * Expert Flow zur Eheschließung
   * @title Eheschließungs Experte
   * @category Expert
   * @author Frank Dase

   */
  const myAction = async () => {
    let requiredDocuments = ['Personalausweis, Reisepass oder ein anderes gültiges Ausweisdokument']
    let showConsultingAppointment = false
    let showRegistrationAppointment = true
    let notGermanPartner = false
    let notBornInGermany = false
    temp.openingHours =
      '<b>Montag und Donnerstag:</b><br/>8 Uhr bis 16 Uhr<br/><b>Dienstag:</b><br/>8 Uhr bis 18 Uhr<br/><b>Mittwoch und Freitag:</b><br/>8 Uhr bis 12 Uhr'
    temp.linkZurBeratung = 'https://www.stadt-koeln.de/service/adressen/anmeldung-eheschliessung'
    temp.linkZurTraukalender = 'https://traukalender.stadt-koeln.de/index.php?company=stadtkoeln-sta&cur_cause=0'
    temp.linkZurGeburtsurkunde = 'https://www.stadt-koeln.de/service/onlinedienste/geburtsurkunde'
    let telefonNummer = '<br/><i><b>0221 221 28135</b></i>'

    if (temp['skill-choice-ret-quzppaivxf'] == 'nein') {
      notGermanPartner = true
    }

    if (temp['skill-choice-ret-tzqmtppme1'] == 'ja') {
      requiredDocuments.push(
        'Aktuelle beglaubigte Abschrift aus dem Geburtenregister (die Geburtsurkunde alleine ist nicht ausreichend): <a style="color:#b00000" href="' +
          temp.linkZurGeburtsurkunde +
          '" target="_blank" rel="noopener">Beantragung der Geburtsurkunde (Geburtsort Köln)</a>'
      )
    } else {
      notBornInGermany = true
      requiredDocuments.push('Vollständige Geburtsurkunde mit Angaben der Eltern ggf. in internationaler Form')
    }

    if (temp['skill-choice-ret-12muzd59vz'] == 'jaDeutschland' || temp.five === 'jaDeutschland') {
      requiredDocuments.push('Aktuelles Eheregister mit Auflösungsvermerk')
    }

    if (temp['skill-choice-ret-12muzd59vz'] == 'jaAusland') {
      requiredDocuments.push('Heiratsurkunde und Scheidungsurteil')
      showConsultingAppointment = true
    }

    if (temp['skill-choice-ret-k50ambkplt'] == 'nein') {
      showConsultingAppointment = true
    }

    if (temp['skill-choice-ret-k50ambkplt'] == 'jaeiner') {
      requiredDocuments.push(
        'Meldebescheinigung des Hauptwohnsitzes inklusive der Angaben über den Familienstand derjenigen/desjenigen mit Wohnsitz nicht in Köln'
      )
    }

    if (temp['skill-choice-ret-k50ambkplt'] == 'nein') {
      showRegistrationAppointment = false
    }

    if (temp['skill-choice-ret-wdtmvcukd9'] == 'ja') {
      requiredDocuments.push('Geburtsurkunden der gemeinsamen Kinder')
    }

    function buildList() {
      let list = '<ul>'
      requiredDocuments.forEach(document => (list = list + '<li>' + document + '</li>'))
      list = list + '</ul>'
      return list
    }

    // ------------------------------
    // Output Frank
    // ------------------------------
    // const tempList = {
    //   type: 'text',
    //   text: '<div class="leftText">' + buildList() + '</div>'
    // }
    let tempList = buildList()
    bp.logger.info('tempList: ' + tempList)
    const list = await bp.cms.renderElement('cgn_simplecard', { type: 'text', title: 'Benötigte Dokumente', text: tempList }, event)

    // Cognigy Output

    // const list = {
    //   actions: [
    //     {
    //       type: 'card',
    //       cardType: 'accordion',
    //       title: 'Übersicht',
    //       alternativeText: '',
    //       data: {
    //         elements: [
    //           {
    //             type: 'block',
    //             blockType: 'html',
    //             title: 'Benötigte Unterlagen:',
    //             alternativeText: '',
    //             data: {
    //               elements: [
    //                 {
    //                   html: buildList()
    //                 }
    //               ]
    //             }
    //           }
    //         ]
    //       }
    //     }
    //   ]
    // }

    if (notGermanPartner) {
      const payloads = await bp.cms.renderElement(
        'cgn_htmltext',
        {
          type: 'text',
          text:
            '<div class="leftText">Aufgrund deiner Angaben zur Staatsbürgerschaft ist ein Beratungsgespräch notwendig. Die Kollegen im Standesamt können dann genau sagen, welche zusätzlichen Unterlagen benötigt werden. Wenn du dich schon vorher, über die je nach Herkunftsland benötigten Unterlagen, informieren willst, kannst du das auch gerne über <a style="color:#b00000" href= "https://www.olg-koeln.nrw.de/aufgaben/justizverwaltung/organisation_verwaltung/dez_7/laender/index.php" target="_blank" rel="noopener">diese Webseite</a> tun. Bitte bring zum Beratungsgespräch direkt folgende Unterlagen mit:</div>'
        },
        event
      )
      await bp.events.replyToEvent(event, payloads)
      await bp.events.replyToEvent(event, list)

      say(
        '<div class="leftText">Zur Beratung könnt ihr <a style="color:#b00000" href="' +
          temp.linkZurBeratung +
          '" target="_blank" rel="noopener">online</a> einen Termin vereinbaren oder unter der Telefonnummer ' +
          telefonNummer +
          ' anrufen. <br/><h4>Öffnungszeiten:</h4>' +
          temp.openingHours +
          '</div>',
        event
      )
    } else {
      if (showConsultingAppointment) {
        const payloads = await bp.cms.renderElement(
          'cgn_htmltext',
          {
            type: 'text',
            text:
              '<div class="leftText">Da einer von euch oder beide bereits im Ausland verheiratet waren, ist ein Beratungsgespräch notwendig. Die Kollegen im Standesamt können dann genau sagen, welche zusätzlichen Unterlagen zwingend benötigt werden. Bitte bring zum Beratungsgespräch folgende Unterlagen mit:</div>'
          },
          event
        )
        await bp.events.replyToEvent(event, payloads)
        await bp.events.replyToEvent(event, list)
      } else if (notBornInGermany) {
        const payloads = await bp.cms.renderElement(
          'cgn_htmltext',
          {
            type: 'text',
            text:
              '<div class="leftText">Da beide oder einer von euch beiden nicht in Deutschland geboren ist, ist ein Beratungsgespräch notwendig. Die Kollegen im Standesamt können dann genau sagen, welche zusätzlichen Unterlagen benötigt werden. Bitte bring zum Beratungsgespräch direkt folgende Unterlagen mit:</div>'
          },
          event
        )
        await bp.events.replyToEvent(event, payloads)
        await bp.events.replyToEvent(event, list)
      } else {
        const payloads = await bp.cms.renderElement(
          'cgn_htmltext',
          {
            type: 'text',
            text:
              '<div class="leftText">Anhand der bisherigen Informationen benötigt ihr für die Anmeldung der Eheschließung folgende Dokumente:</div>'
          },
          event
        )
        await bp.events.replyToEvent(event, payloads)
        await bp.events.replyToEvent(event, list)
      }
      if (showConsultingAppointment || notBornInGermany) {
        say(
          '<div class="leftText">Zur Beratung könnt ihr <a style="color:#b00000" href= "' +
            temp.linkZurBeratung +
            '" target="_blank" rel="noopener">online</a> oder unter der Telefonnummer: ' +
            telefonNummer +
            ' einen Termin vereinbaren.<br/><h4>Öffnungszeiten:</h4> ' +
            temp.openingHours +
            '</div>',
          event
        )
      } else if (showRegistrationAppointment) {
        say(
          '<div class="leftText">Zur Anmeldung könnt ihr <a style="color:#b00000" href= "' +
            temp.linkZurTraukalender +
            '" target="_blank" rel="noopener">online</a> oder unter der Telefonnummer: ' +
            telefonNummer +
            ' einen Termin vereinbaren. <br/><h4>Öffnungszeiten:</h4> ' +
            temp.openingHours +
            '</div>',
          event
        )
      }
    }
  }
  async function say(content, event, obj = null) {
    const payloads = await bp.cms.renderElement('cgn_htmltext', { type: 'text', text: content }, event)
    await bp.events.replyToEvent(event, payloads)
    if (obj != null) {
      await bp.events.replyToEvent(event, [obj])
    }
  }
  async function showAccordion(event, obj) {
    await bp.events.replyToEvent(event, [obj])
  }
  return myAction()