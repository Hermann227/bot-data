//CHECKSUM:a61691fbe003df5641f1d3ecde7dd74df67126248a68d9dee38a6c5898d80f14
const base = require('./_base');

function render(data) {
  const events = [];
  return [{
    // This tells channel-web to tread the event as a custom component
    type: 'custom',

    // The name of your module
    module: 'proactive',

    // The name of the component to load. In this example, the name of the component is "InfaText",
    // Components created for the web chat must be in the `lite` views
    component: 'CgnHTMLText',

    // Add anything else that you would want your module to process
    // ... data from the content manager forms:
    markdown: true,
    text: data.text,
  }]
}

/*function renderMessenger(data) {
  return [{
    type: 'typing',
    value: data.typing
  }, {
    text: data.text
  }];
}*/

function renderElement(data, channel) {
  if (channel === 'web' || channel === 'api') {
    return render(data);
  }
  /*else if (channel === 'messenger') {
     return renderMessenger(data);
   }*/

  return []; // TODO
}


module.exports = {
  id: 'cgn_htmltext',
  group: 'Custom Component',
  title: 'Cologne HTML Text',
  jsonSchema: {
    description: 'HTML-Code in text will be rendered for output',
    type: 'object',
    required: ['text'],
    properties: {
      text: {
        type: 'string',
        title: 'Message'
      },
      variations: {
        type: 'array',
        title: 'Alternates (optional)',
        items: {
          type: 'string',
          default: ''
        }
      },
      ...base.typingIndicators
    }
  },
  uiSchema: {
    text: {
      'ui:field': 'i18n_field',
      $subtype: 'textarea'
    },
    variations: {
      'ui:options': {
        orderable: false
      }
    }
  },
  computePreviewText: formData => 'Cologne HTML text: ' + formData.text,
  renderElement: renderElement
}