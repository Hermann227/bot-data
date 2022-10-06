//CHECKSUM:7eea0dbe15aeb1a93741fc28b434fff9555622c3c8454965e8d3b8f207b537ca
function render(data) {
  const events = [];
  return [{
    // This tells channel-web to tread the event as a custom component
    type: 'custom',

    // The name of your module
    module: 'proactive',

    // The name of the component to load. In this example, the name of the component is "InfaText",
    // Components created for the web chat must be in the `lite` views
    component: 'CgnSimpleCard',

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
  id: 'cgn_simplecard',
  group: 'Custom Component',
  title: 'Cologne Simple Card',

  jsonSchema: {
    description: 'Simple Custom Card',
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

  computePreviewText: formData => formData.title && 'Cologne Simple Card: ${formData.title}',
  renderElement: renderElement
}
