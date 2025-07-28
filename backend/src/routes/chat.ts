import { Router, Request, Response } from 'express';
import { documentStore } from '../services/databaseService';
import { Conversation } from '../types';
import { addItemToCart, removeItemFromCart } from './cart';
import { ref } from 'process';

class CurrentChat {
    id: string;
    userId: string;
    currentConversation: string;

    constructor(userId: string, conversationId: string) {
        this.id = `CurrentChats/${userId}`;
        this.userId = userId;
        this.currentConversation = conversationId;
    }
}

const router = Router();

// GET /api/chat?userid=uid - get current chat
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userid as string;
        if (!userId) {
            return res.status(400).json({ error: 'userid is required' });
        }

        const session = documentStore.openSession();
        const currentChatId = `CurrentChats/${userId}`;

        // Load CurrentChat document with include to get the conversation in one shot
        const currentChat = await session
            .include('currentConversation')
            .load<CurrentChat>(currentChatId);

        if (!currentChat || !currentChat.currentConversation) {
            return res.json({ chat: { messages: [] } });
        }

        // Load the conversation that was included
        const conversation = await session.load<Conversation>(currentChat.currentConversation);

        if (!conversation) {
            return res.json({ chat: { messages: [] } });
        }

        // Filter and format messages
        const messages = conversation.Messages || [];
        const formattedMessages = messages
            .filter((msg: any) => msg.role == 'user' || (msg.role == 'assistant' && msg.content))
            .map((msg: any) => ({
                sender: msg.role === 'user' ? 'user' : 'ai',
                message: msg.role === 'user' ? msg.content : null,
                answer: msg.role === 'assistant' ? JSON.parse(msg.content) : null,
                timestamp: msg.date,
                tokens: msg.usage?.TotalTokens || 0
            }));

        res.json({
            chat: {
                messages: formattedMessages,
                conversationId: currentChat.currentConversation
            }
        });
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
});

// POST /api/chat?userid=uid - send message and get reply
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userid as string;
        const { message, toolId } = req.body;

        const session = documentStore.openSession();
        const currentChatId = `CurrentChats/${userId}`;

        const currentChat = await session.load<CurrentChat>(currentChatId);

        const agent = currentChat ?
            documentStore.ai.resumeConversation(currentChat.currentConversation) :
            documentStore.ai.startConversation('shopping-agent', { userId: userId });

        if (toolId) {
            agent.addActionResponse(toolId, message);
        }
        else {
            agent.setUserPrompt(message);
        }
        let refreshCart = false;
        while (true) {
            const response = await agent.run();
            if (response === 'Done') {
                break;
            }
            for (var action of agent.requiredActions()) {
                switch (action.name) {
                    case 'AddToCart': {
                        refreshCart = true;
                        const { productId, quantity } = JSON.parse(action.arguments);
                        const { item, message, total } = await addItemToCart(userId, productId, quantity);
                        agent.addActionResponse(action.toolId, {
                            message,
                            addedItem: item,
                            totalAfterAddition: total
                        });
                        break;
                    }
                    case 'RemoveFromCart': {
                        refreshCart = true;
                        const { productId, quantity } = JSON.parse(action.arguments);
                        const { message, total } = await removeItemFromCart(userId, productId, quantity);
                        agent.addActionResponse(action.toolId, {
                            message,
                            totalAfterRemoval: total
                        });
                        break;
                    }
                }
            }
        }

        if (!currentChat) {
            // Create a new CurrentChat document if it doesn't exist
            const newChat = new CurrentChat(userId, agent.id);
            await session.store(newChat, currentChatId, CurrentChat);
            await session.saveChanges();
        }


        const requiredActions = agent.requiredActions();
        const aiMessage = {
            userId: userId,
            sender: 'ai' as const,
            message: undefined,
            answer: !requiredActions.length ? agent.answer : undefined,
            requiredActions,
            timestamp: new Date().toISOString()
        };

        res.json({
            chatMessage: aiMessage,
            conversationId: agent.id,
            refreshCart
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message: ' + error });
    }
});

// DELETE /api/chat?userid=uid - clear chat history
router.delete('/', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userid as string;
        if (!userId) {
            return res.status(400).json({ error: 'userid is required' });
        }

        const session = documentStore.openSession();
        const currentChatId = `CurrentChats/${userId}`;

        session.delete<CurrentChat>(currentChatId);

        await session.saveChanges();

        res.json({ success: true, message: 'Chat cleared' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear chat: ' + error });
    }
});

export { router as chatRoutes };
