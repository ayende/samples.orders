import { Router, Request, Response } from 'express';
import { documentStore } from '../services/databaseService';
import { Conversation } from '../types';

interface CurrentChat {
    id: string;
    userId: string;
    currentConversation: string;
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
                text: msg.role === 'user' ? msg.content : null,
                response: msg.role === 'assistant' ? JSON.parse(msg.content) : null,
                date: msg.date,
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
router.post('/', (req: Request, res: Response) => {
    try {
        const userId = req.query.userid as string;
        const { message } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userid is required' });
        }

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'message is required and must be a string' });
        }

        // const aiResponse = dataStore.addChatMessage(userId, message);
        // const chat = dataStore.getChat(userId);

        res.json({
            message: 'Message sent successfully',
            aiResponse: '',
            chat: ''
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

export { router as chatRoutes };
