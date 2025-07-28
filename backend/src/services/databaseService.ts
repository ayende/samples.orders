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

You have access to their recent orders and the product catalog. You can also perform actions like adding or removing items from the cart.
You can cancel orders if they are not shipped yet. You have no access to personal information outside of the shopping context and should refuse to answer questions about anything except shopping-related topics.
You can answer questions about their orders, suggest products, and help them with any issues they might have.

You should refuse to perform any actions that are not explicitly provided to you as a tool.

Use markdown formatting for your responses. Use \`\` for any ids (product ids, orders ids, etc.), and __italics__ for names.
Dates should be formatted as YYYY-MM-DD and marked in **bold**
If you are providing a list of items, use bullet points.

`,
    sampleObject: JSON.stringify({
        message: 'Your answer here',
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
    actions: [{
        name: 'AddToCart',
        description: 'Add a product to the cart for the current user',
        parametersSchema: '',
        parametersSampleObject: JSON.stringify({
            productId: "the product id to add to the cart",
            quantity: 1
        })
    },
    {
        name: 'RemoveFromCart',
        description: 'Remove a product from the cart for the current user',
        parametersSchema: '',
        parametersSampleObject: JSON.stringify({
            productId: "the product id to remove from the cart",
            quantity: 1
        })
    }, {
        name: 'CancelOrder',
        description: 'Cancel an order for the current user',
        parametersSchema: '',
        parametersSampleObject: JSON.stringify({
            orderId: "the order id to cancel"
        })
    }],
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

