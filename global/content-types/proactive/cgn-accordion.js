//CHECKSUM:2923598f250a7308ba3c6aff7901398e6f326655ef436adcb15358a21820284b
function render(data) {
  const events = [];
  return [{
    // This tells channel-web to tread the event as a custom component
    type: 'custom',

    // The name of your module
    module: 'proactive',

    // The name of the component to load. In this example, the name of the component is "InfaText",
    // Components created for the web chat must be in the `lite` views
    component: 'CgnAccordion',

    // Add anything else that you would want your module to process
    // ... data from the content manager forms:
    markdown: true,
    title: data.title,
    text: data.text,
  }]
}

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
  id: 'cgn_accordion',
  group: 'Custom Component',
  title: 'Cologne Accordion',

  jsonSchema: {
    description: 'Custom Accordion',
    type: 'object',
    required: ['title'],
    properties: {
      title: {
        type: 'string',
        title: 'title'
      },
      text: {
        type: 'string',
        title: 'text'
      }
    }
  },

  uiSchema: {},

  computePreviewText: formData => formData.title && 'Cologne Accordion: ${formData.title}',
  renderElement: renderElement
}
