import { HoneycombWebSDK, WebVitalsInstrumentation } from '@honeycombio/opentelemetry-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

const sdk = new HoneycombWebSDK({
  apiKey: 'hcaik_01hw8ngrswdntfahar50fhe8n2rzrkdh02ev2kv0t6bcjr9f1pssr9scz9',
  serviceName: 'bergharen-klassiek',
  instrumentations: [getWebAutoInstrumentations(), new WebVitalsInstrumentation()], // add automatic instrumentation
});
sdk.start();