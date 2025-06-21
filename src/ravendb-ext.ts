// Extended RavenDB/AI types for backend

export interface AiUsage {
  PromptTokens: number;
  CompletionTokens: number;
  TotalTokens: number;
  CachedTokens: number;
}

export interface ToolRequest {
  Name: string;
  ToolId: string;
  Arguments: Record<string, any>;
}

export interface ToolResponse {
  ToolId: string;
  Content: string;
}

export interface ChatResult<TSchema> {
  ChatId: string;
  Response: TSchema;
  Usage: AiUsage;
  ToolRequests: ToolRequest[];
}

export interface CreateAiAgentBody {
  ConnectionStringName: string;
  SystemPrompt: string;
  OutputSchema: string;
  Persistence: {
    Collection: string;
    Expires: Date | null;
  };
  Queries: Array<{
    Name: string;
    Query: string;
    Description: string;
    ParametersSchema: string;
  }>;
  Actions: Array<{
    Name: string;
    Description: string;
    ParametersSchema: string;
  }>;
}

import fetch from 'node-fetch';

export async function createAiAgent(
  ravendbUrl: string,
  name: string,
  body: CreateAiAgentBody
): Promise<void> {
  const url = `${ravendbUrl}/databases/orders/admin/ai/agent?name=${encodeURIComponent(name)}&raft-request-id=${crypto.randomUUID()}`;
  const exists = await fetch(url);
  if (exists.ok) {
    console.log(`${name} already exists, skipping initialization.`);
    return;
  }
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`createAiAgent PUT failed: ${response.status} - ${text}`);
  }
}

function parseChatResult<TSchema>(result: any): ChatResult<TSchema> {
  return {
    ChatId: result.ChatId,
    Response: result.Response as TSchema,
    Usage: result.Usage,
    ToolRequests: Array.isArray(result.ToolRequests)
      ? result.ToolRequests.map((tr: any) => {
          let parsedArguments: Record<string, any> | null = null;
          if (typeof tr.Arguments === 'string') {
            try {
              parsedArguments = JSON.parse(tr.Arguments);
            } catch {
              parsedArguments = null;
            }
          }
          return {
            ...tr,
            Arguments: parsedArguments
          };
        })
      : []
  };
}

export async function startConversation<TSchema>(
  ravendbUrl: string,
  agentName: string,
  params: Record<string, any>,
  userPrompt: string,
): Promise<ChatResult<TSchema>> {
  const url = `${ravendbUrl}/databases/orders/ai/agent/start?name=${encodeURIComponent(agentName)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Prompt: userPrompt,
      Parameters: params
    })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Start chat POST failed: ${response.status} - ${text}`);
  }
  const result = await response.json();
  return parseChatResult<TSchema>(result);
}

export type ResumeConversationInput =
  | { userPrompt: string }
  | { toolResponses: ToolResponse[] };

export async function resumeConversation<TSchema>(
  ravendbUrl: string,
  agentName: string,
  chatId: string,
  input: ResumeConversationInput,
): Promise<ChatResult<TSchema>> {
  const url = `${ravendbUrl}/databases/orders/ai/agent/resume?name=${encodeURIComponent(agentName)}&chatId=${encodeURIComponent(chatId)}`;
  const body = 'userPrompt' in input
    ? { UserPrompt: input.userPrompt, ToolResponse: null }
    : { UserPrompt: null, ToolResponse: input.toolResponses };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Start chat POST failed: ${response.status} - ${text}`);
  }
  const result = await response.json();
  return parseChatResult<TSchema>(result);
}
