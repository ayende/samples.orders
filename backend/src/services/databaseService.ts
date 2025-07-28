import { AiAgentConfiguration, DocumentStore } from 'ravendb';

// Initialize the document store
const documentStore = new DocumentStore([
    process.env.RAVENDB_URL || 'http://127.0.0.1:8080'
], process.env.RAVENDB_DATABASE || 'Orders');

// Configure certificate if needed
if (process.env.RAVENDB_CERTIFICATE_PATH) {
    documentStore.authOptions = {
        certificate: process.env.RAVENDB_CERTIFICATE_PATH,
        type: "pfx"
    };
}
documentStore.initialize();

console.log('🗄️ RavenDB DocumentStore initialized');

const agentConfig: AiAgentConfiguration = {
    identifier: 'shopping-agent',
    name: 'Shopping Agent',
    connectionStringName: 'Open AI Gen',
    systemPrompt: `
You are an AI assistant for a shopping dashboard application. Your role is to assist users with their shopping-related queries, provide information about their orders, and help them manage their cart.

You have access to their orders, cart items, and chat history.
You can answer questions about their orders, suggest products, and help them with any issues they might have.
You can also retrieve relevant documents from the knowledge base to provide more context or information.

`,
    sampleObject: JSON.stringify({
        answer: 'Your answer here',
        orders: ['order ids referenced in the answer'],
        products: ['product ids referenced in the answer'],
    }),
    queries: [{
        name: 'RecentOrders',
        query: 'from Orders where Company = $userId order by OrderedAt desc limit 10',
        description: 'Get the most recent orders for the current user',
        parametersSchema: '{}',
        parametersSampleObject: ''
    },
    {
        name: 'ProductCatalogSearch',
        description: "semantic search the store product catalog",
        query: "from Products where vector.search(embedding.text(Name), $query)",
        parametersSampleObject: JSON.stringify({ query: ["term or phrase to search in the catalog"] }),
        parametersSchema: '',
    }],
    persistence: {
        conversationIdPrefix: 'chats/',
        conversationExpirationInSec: 60 * 60 * 24 * 60, // 60 days
    },
    parameters: new Set(['userId']),
    outputSchema: '',
    actions: [],
    chatTrimming: null,
    maxModelIterationsPerCall: 16
};

// run in the background to create the agent configuration

documentStore.ai.createAgent(agentConfig)
    .then(() => {
        console.log('✅ AI Agent configuration created');
    })
    .catch(error => {
        console.error('❌ Failed to create AI Agent configuration:', error);
    });

export { documentStore };

