export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

export interface OrderLine {
    Discount: number;
    PricePerUnit: number;
    Product: string;
    ProductName: string;
    Quantity: number;
}

export interface Location {
    Latitude: number;
    Longitude: number;
}

export interface ShipTo {
    City: string;
    Country: string;
    Line1: string;
    Line2: string | null;
    Location: Location;
    PostalCode: string;
    Region: string;
}

export interface Order {
    id: string;
    Company: string;
    Employee: string;
    Freight: number;
    Lines: OrderLine[];
    OrderedAt: string;
    RequireAt: string;
    ShipTo: ShipTo;
    ShipVia: string;
    ShippedAt: string | null;
}

export interface ChatMessage {
    userId: string;
    message?: string;
    answer?: {
        message: string;
        orders: string[];
        products: string[];
    },
    requiredActions: {
        name: string;
        toolId: string;
        arguments: string;
    }[],
    sender: 'user' | 'ai';
    timestamp: string;
}

export interface Chat {
    userId: string;
    messages: ChatMessage[];
}

export interface ToolCall {
    id: string;
    type: string;
    function: {
        name: string;
        arguments: string;
    };
}

export interface Usage {
    PromptTokens: number;
    CompletionTokens: number;
    TotalTokens: number;
    CachedTokens: number;
}

export interface ConversationMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | null;
    date: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
    refusal?: string | null;
    annotations?: any[];
    usage?: Usage;
}
export interface Conversation {
    Agent: string;
    Parameters: {
        [key: string]: any;
    };
    Messages: ConversationMessage[];
    HistoryDocuments: any[];
    TotalUsage: Usage;
    OpenActionCalls: Record<string, any>;
}

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Product {
    Name: string;
    Supplier: string;
    Category: string;
    QuantityPerUnit: string;
    PricePerUnit: number;
    UnitsInStock: number;
    UnitsOnOrder: number;
    Discontinued: boolean;
    ReorderLevel: number;
}
